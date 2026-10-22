import FolderModel from "../models/folder.js";
import TvModel from "../models/tv.js";
import mongoose from "mongoose";
import { normalizeTags } from "../utils/tags.js";


export const addTvToFolder = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      folderName,
      tmdbId,
      tmdbTitle,
      language,
      dateAdded,
      rating,
      comment,
      customType
    } = req.body;

    if (!folderName) {
      return res.status(400).json({ title: "Folder error", message: "no folder selected" });
    }
    if (!tmdbId) {
      return res.status(400).json({ title: "Folder error", message: "no item selected" });
    }

    const doc = new TvModel({
      tmdbId,
      tmdbTitle,
      language,
      dateAdded,
      rating,
      comment,
      customType: normalizeTags(customType),
      user: userId
    });

    const item = await doc.save();

    const updatedFolder = await FolderModel.findOneAndUpdate(
      { name: folderName, user: userId },
      { $push: { folderElements: { itemId: item._id, itemModel: "Tv" } } },
      { new: true }
    );

    if (!updatedFolder) {
      return res.status(404).json({ title: "Folder error", message: "folder not found" });
    }

    res.json({
      success: true,
      results: item
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to add movie" });
  }
};

export const updateTvByMongoId = async (req, res) => {
  try {
    const userId = req.userId;
    const mongoId = req.params.mongoId;

    const {
      folderName,
      dateAdded,
      rating,
      comment,
      customType
    } = req.body;

    let updatedItem = await TvModel.findOneAndUpdate(
      { _id: mongoId, user: userId },
      // Tags: omitted = unchanged, [] = clear.
      { rating, comment, dateAdded, customType: customType === undefined ? undefined : normalizeTags(customType) },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ title: "Update error", message: "item not found" });
    }

    if (folderName) {
      const currentFolder = await FolderModel.findOne({
        user: userId,
        "folderElements.itemId": mongoId
      });


      if (currentFolder && currentFolder.name !== folderName) {
        const folderElement = currentFolder.folderElements.find(el => el.itemId.toString() === mongoId);

        await FolderModel.updateOne(
          { _id: currentFolder._id },
          { $pull: { folderElements: { itemId: mongoId } } }
        );

        await FolderModel.findOneAndUpdate(
          { name: folderName, user: userId },
          { $push: { folderElements: { itemId: mongoId, itemModel: folderElement.itemModel } } }
        );
      }
    }

    res.json({
      success: true,
      results: updatedItem
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Update error", message: "failed to update item" });
  }
};

export const removeTvFromFolder = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, folderName } = req.body;

    console.log(mongoId, folderName)

    if (!mongoId || !folderName) {
      return res.status(400).json({ title: "Delete error", message: "insufficient data" });
    }

    const folder = await FolderModel.findOneAndUpdate(
      { name: folderName, user: userId },
      { $pull: { folderElements: { itemId: mongoId } } },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ title: "Delete error", message: "folder not found" });
    }

    const deleteItemResult = await TvModel.findOneAndDelete({ _id: mongoId, user: userId });

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Delete error", message: "failed to remove item" });
  }
};

export const updateTvSeason = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season } = req.params;
    const { rating, comment, dateAdded } = req.body;

    const tv = await TvModel.findOne({ _id: mongoId, user: userId });
    if (!tv) {
      return res.status(404).json({ title: "Update error", message: "tv not found" });
    }

    const seasonNumber = Number(season);
    let seasonDoc = tv.seasons.find(s => s.season === seasonNumber);
    if (!seasonDoc) {
      tv.seasons.push({ season: seasonNumber });
      seasonDoc = tv.seasons[tv.seasons.length - 1];
    }

    seasonDoc.rating = rating;
    seasonDoc.comment = comment;
    seasonDoc.dateAdded = dateAdded;

    await tv.save();

    res.json({
      success: true,
      results: tv
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Update error", message: "failed to update season" });
  }
};

export const updateTvEpisode = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season, episode } = req.params;
    const { rating, comment, dateAdded, watchedCount, skipped } = req.body;

    const tv = await TvModel.findOne({ _id: mongoId, user: userId });
    if (!tv) {
      return res.status(404).json({ title: "Update error", message: "tv not found" });
    }

    const seasonNumber = Number(season);
    const episodeNumber = Number(episode);

    let seasonDoc = tv.seasons.find(s => s.season === seasonNumber);
    if (!seasonDoc) {
      tv.seasons.push({ season: seasonNumber });
      seasonDoc = tv.seasons[tv.seasons.length - 1];
    }

    let episodeDoc = seasonDoc.episodes.find(e => e.episode === episodeNumber);
    if (!episodeDoc) {
      seasonDoc.episodes.push({ episode: episodeNumber });
      episodeDoc = seasonDoc.episodes[seasonDoc.episodes.length - 1];
    }

    episodeDoc.rating = rating;
    episodeDoc.comment = comment;
    episodeDoc.dateAdded = dateAdded;
    episodeDoc.watchedCount = watchedCount;
    // Omitted = unchanged (a quick "watched" must not reset the skipped flag).
    if (typeof skipped === "boolean") episodeDoc.skipped = skipped;

    await tv.save();

    res.json({
      success: true,
      results: tv
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Update error", message: "failed to update episode" });
  }
};

export const deleteTvEpisode = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season, episode } = req.params;

    const tv = await TvModel.findOne({ _id: mongoId, user: userId });
    if (!tv) {
      return res.status(404).json({ title: "Delete error", message: "tv not found" });
    }

    const seasonNumber = Number(season);
    const episodeNumber = Number(episode);

    const seasonDoc = tv.seasons.find(s => s.season === seasonNumber);
    if (seasonDoc) {
      seasonDoc.episodes = seasonDoc.episodes.filter(e => e.episode !== episodeNumber);
      await tv.save();
    }

    res.json({
      success: true,
      results: tv
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Delete error", message: "failed to delete episode" });
  }
};

// Deletes the season together with its episodes.
export const deleteTvSeason = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season } = req.params;

    const tv = await TvModel.findOne({ _id: mongoId, user: userId });
    if (!tv) {
      return res.status(404).json({ title: "Delete error", message: "tv not found" });
    }

    const seasonNumber = Number(season);
    tv.seasons = tv.seasons.filter(s => s.season !== seasonNumber);
    await tv.save();

    res.json({
      success: true,
      results: tv
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Delete error", message: "failed to delete season" });
  }
};

// Marks the given episodes watched (watchedCount = 1); episodes that already have views or a rating are
// untouched.
export const markSeasonEpisodesWatched = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season } = req.params;
    const { episodes, dateAdded } = req.body;

    const tv = await TvModel.findOne({ _id: mongoId, user: userId });
    if (!tv) {
      return res.status(404).json({ title: "Update error", message: "tv not found" });
    }

    const seasonNumber = Number(season);
    let seasonDoc = tv.seasons.find(s => s.season === seasonNumber);
    if (!seasonDoc) {
      tv.seasons.push({ season: seasonNumber });
      seasonDoc = tv.seasons[tv.seasons.length - 1];
    }

    // dateAdded: null = no date, omitted = today.
    const parsed = dateAdded ? new Date(dateAdded) : null;
    const hasDate = Object.prototype.hasOwnProperty.call(req.body, "dateAdded");
    const watchDate = hasDate ? (parsed && !Number.isNaN(parsed.getTime()) ? parsed : null) : new Date();

    const epNumbers = Array.isArray(episodes) ? episodes.map(Number) : [];
    for (const epNum of epNumbers) {
      let episodeDoc = seasonDoc.episodes.find(e => e.episode === epNum);
      if (!episodeDoc) {
        seasonDoc.episodes.push({ episode: epNum, watchedCount: 1, dateAdded: watchDate });
      } else if (!episodeDoc.skipped && !(episodeDoc.watchedCount > 0)) {
        // Skipped episodes stay skipped when marking everything watched.
        episodeDoc.watchedCount = 1;
        if (!episodeDoc.dateAdded) episodeDoc.dateAdded = watchDate;
      }
    }

    await tv.save();

    res.json({
      success: true,
      results: tv
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Update error", message: "failed to mark season watched" });
  }
};

export const getTvByMongoId = async (req, res) => {
  try {
    const mongoId = req.params.mongoId;
    const userId = req.userId;

    const item = await TvModel.findOne({ _id: mongoId, user: userId });

    if (!item) {
      return res.status(404).json({ title: "Not found", message: "Item not found in your database" });
    }

    const folder = await FolderModel.findOne({
      user: userId,
      "folderElements.itemId": mongoId
    }).select("name -_id");

    res.json({
      success: true,
      results: {
        ...item.toObject(),
        folderName: folder?.name || null
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Error", message: "Failed to get item by mongo ID" });
  }
};

export const getTvByTmdbId = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const userId = req.userId;

    let item = await TvModel.findOne({ tmdbId, user: userId });

    if (!item) {
      return res.status(404).json({ title: "Not found", message: "Item not found in your database" });
    }

    res.json({
      success: true,
      results: item
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Error", message: "Failed to get item by ID" });
  }
};
