import FolderModel, { FOLDER_STATUSES, FOLDER_STATUS_VALUES, betterStatus } from "../models/folder.js";
import MovieModel from "../models/movie.js";
import TvModel from "../models/tv.js";
import { normalizeTags } from "../utils/tags.js";

// Data for the Updates page. watching/watched seed a collection; watched/dropped/skipped count as handled (not new).
const latestOf = (a, b) => {
  if (!a) return b || null;
  if (!b) return a;
  return new Date(a) >= new Date(b) ? a : b;
};

export const getUpdates = async (req, res) => {
  try {
    const userId = req.userId;
    // ?view=dropped: series from dropped folders; ?view=muted: series from skipped ones (not followed). Movies are
    // the same in every view.
    const tvStatusesByView = {
      dropped: [FOLDER_STATUSES.DROPPED],
      muted: [FOLDER_STATUSES.SKIPPED],
    };
    const tvStatuses = tvStatusesByView[req.query.view] || [FOLDER_STATUSES.WATCHING, FOLDER_STATUSES.WATCHED];

    // lean(): plain objects, much faster for hundreds of series with thousands of episodes.
    const folders = await FolderModel.find({
      user: userId,
      status: { $in: FOLDER_STATUS_VALUES },
    }, { name: 1, status: 1, "folderElements.itemId": 1, "folderElements.itemModel": 1 }).lean().exec();

    const placementByItem = new Map();
    const movieRefs = [];
    const tvRefs = [];
    for (const folder of folders) {
      for (const element of folder.folderElements) {
        const id = String(element.itemId);
        const current = placementByItem.get(id);
        const status = betterStatus(current?.status, folder.status);
        // Keep the folder name of the winning status; editing opens that copy.
        if (!current || status !== current.status) {
          placementByItem.set(id, { folderName: folder.name, status });
        }
        if (element.itemModel === "Movie") movieRefs.push(element.itemId);
        else if (element.itemModel === "Tv") tvRefs.push(element.itemId);
      }
    }

    // Only the episode fields the page shows or passes to the edit dialog.
    const [movies, tvs] = await Promise.all([
      MovieModel.find({ _id: { $in: movieRefs }, user: userId }, { tmdbId: 1, rating: 1, comment: 1, dateAdded: 1, customType: 1, updatedAt: 1 }).lean().exec(),
      TvModel.find({ _id: { $in: tvRefs }, user: userId }, {
        tmdbId: 1,
        customType: 1,
        updatedAt: 1,
        "seasons.season": 1,
        "seasons.episodes.episode": 1,
        "seasons.episodes.dateAdded": 1,
        "seasons.episodes.rating": 1,
        "seasons.episodes.comment": 1,
        "seasons.episodes.watchedCount": 1,
        "seasons.episodes.skipped": 1,
      }).lean().exec(),
    ]);

    // Movies grouped by tmdbId; status = strongest among copies.
    const movieByTmdbId = new Map();
    for (const movie of movies) {
      const placement = placementByItem.get(String(movie._id));
      if (!placement) continue;

      const existing = movieByTmdbId.get(movie.tmdbId);
      const status = betterStatus(existing?.status, placement.status);
      const takeThis = !existing || status !== existing.status;

      movieByTmdbId.set(movie.tmdbId, {
        tmdbId: movie.tmdbId,
        status,
        mongoId: takeThis ? String(movie._id) : existing.mongoId,
        folderName: takeThis ? placement.folderName : existing.folderName,
        // Needed by the edit dialog, otherwise saving would wipe the rating and comment.
        rating: takeThis ? movie.rating ?? null : existing.rating,
        comment: takeThis ? movie.comment || "" : existing.comment,
        dateAdded: takeThis ? movie.dateAdded || null : existing.dateAdded,
        updatedAt: latestOf(existing?.updatedAt, movie.updatedAt),
        customType: takeThis ? normalizeTags(movie.customType) : existing.customType,
        copies: (existing?.copies || 0) + 1,
      });
    }

    const tvByTmdbId = new Map();
    for (const tv of tvs) {
      const placement = placementByItem.get(String(tv._id));
      if (!placement) continue;
      if (!tvStatuses.includes(placement.status)) continue;

      let entry = tvByTmdbId.get(tv.tmdbId);
      if (!entry) {
        entry = { tmdbId: tv.tmdbId, copies: 0, mongoId: null, folderName: null, customTypes: new Set(), watched: new Map() };
        tvByTmdbId.set(tv.tmdbId, entry);
      }
      entry.copies += 1;
      // Episodes can be edited only when exactly one copy is saved.
      entry.mongoId = entry.copies === 1 ? String(tv._id) : null;
      entry.folderName = entry.copies === 1 ? placement.folderName : null;
      // No tags = empty string (the client treats it as "no tag").
      const tvTags = normalizeTags(tv.customType);
      for (const tag of tvTags.length ? tvTags : [""]) entry.customTypes.add(tag);

      entry.updatedAt = latestOf(entry.updatedAt, tv.updatedAt);
      for (const season of tv.seasons) {
        if (!entry.watched.has(season.season)) entry.watched.set(season.season, new Map());
        const episodes = entry.watched.get(season.season);
        for (const episode of season.episodes) {
          entry.lastWatched = latestOf(entry.lastWatched, episode.dateAdded);
          if (episodes.has(episode.episode)) continue;
          // Send only non-default values (no rating/comment, 1 view, not skipped); the client fills defaults.
          // ~3x smaller response.
          const data = {};
          if (episode.dateAdded) data.dateAdded = episode.dateAdded;
          if (episode.rating != null) data.rating = episode.rating;
          if (episode.comment) data.comment = episode.comment;
          if ((episode.watchedCount ?? 1) !== 1) data.watchedCount = episode.watchedCount;
          // A skipped episode counts as handled (not new) but is shown with a cross.
          if (episode.skipped) data.skipped = true;
          episodes.set(episode.episode, data);
        }
      }
    }

    const watchedTv = [...tvByTmdbId.values()].map((entry) => ({
      tmdbId: entry.tmdbId,
      copies: entry.copies,
      mongoId: entry.mongoId,
      folderName: entry.folderName,
      customTypes: [...entry.customTypes],
      lastWatched: entry.lastWatched || null,
      updatedAt: entry.updatedAt || null,
      watched: Object.fromEntries(
        [...entry.watched.entries()].map(([season, episodes]) => [
          String(season),
          Object.fromEntries([...episodes.entries()].map(([n, data]) => [String(n), data])),
        ])
      ),
    }));

    res.json({
      success: true,
      results: {
        movies: [...movieByTmdbId.values()],
        tv: watchedTv,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Updates error", message: "failed to collect updates" });
  }
};
