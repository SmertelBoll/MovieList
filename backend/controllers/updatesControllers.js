import FolderModel, { FOLDER_STATUSES, FOLDER_STATUS_VALUES } from "../models/folder.js";
import MovieModel from "../models/movie.js";
import TvModel from "../models/tv.js";

// Якщо елемент лежить одразу в кількох папках зі статусами — перемагає
// «найдалі просунутий» стан перегляду.
const STATUS_PRIORITY = [
  FOLDER_STATUSES.WATCHED,
  FOLDER_STATUSES.WATCHING,
  FOLDER_STATUSES.DROPPED,
  FOLDER_STATUSES.PLANNED,
];

const betterStatus = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return STATUS_PRIORITY.indexOf(a) <= STATUS_PRIORITY.indexOf(b) ? a : b;
};

/**
 * Дані для сторінки "New releases".
 *
 * Статуси працюють по-різному в двох ролях (розбір самих ролей — на фронті):
 *   - watching / watched — «затравка»: лише вони вводять колекцію в список.
 *     Якщо з франшизи нічого не дивилися, показувати нема сенсу.
 *   - watched / dropped — «опрацьоване»: не рахується як нове.
 *   - watching / planned — збережене, але ще не переглянуте: лишається
 *     в лічильниках, просто з іншою іконкою.
 *
 * Через це watching одночасно і затравка, і «нове»: франшиза потрапляє
 * в список саме тому, що її почали дивитися, і незакінчений фільм видно.
 *
 * Звідси й випадок, коли з колекції збережений один фільм і той у dropped:
 * затравки немає, тож колекція не зʼявиться взагалі.
 *
 * Мова не має значення: tmdbId той самий незалежно від того, якою мовою
 * елемент зберігали, тож дедуплікація за ним зливає "Spider-Man" збережений
 * англійською і українською в один запис.
 */
export const getUpdates = async (req, res) => {
  try {
    const userId = req.userId;

    const folders = await FolderModel.find({
      user: userId,
      status: { $in: FOLDER_STATUS_VALUES },
    }).exec();

    // itemId -> { folderName, status }. Папки без статусу сюди не потрапляють.
    const placementByItem = new Map();
    const movieRefs = [];
    const tvRefs = [];
    for (const folder of folders) {
      for (const element of folder.folderElements) {
        const id = String(element.itemId);
        const current = placementByItem.get(id);
        const status = betterStatus(current?.status, folder.status);
        // Назву папки тримаємо ту, чий статус переміг — на неї відкриється редагування
        if (!current || status !== current.status) {
          placementByItem.set(id, { folderName: folder.name, status });
        }
        if (element.itemModel === "Movie") movieRefs.push(element.itemId);
        else if (element.itemModel === "Tv") tvRefs.push(element.itemId);
      }
    }

    const [movies, tvs] = await Promise.all([
      MovieModel.find({ _id: { $in: movieRefs }, user: userId }).exec(),
      TvModel.find({ _id: { $in: tvRefs }, user: userId }).exec(),
    ]);

    // Фільми: групуємо за tmdbId, статус — найсильніший серед копій
    const movieByTmdbId = new Map();
    for (const movie of movies) {
      const placement = placementByItem.get(String(movie._id));
      if (!placement) continue;

      const existing = movieByTmdbId.get(movie.tmdbId);
      const status = betterStatus(existing?.status, placement.status);
      // Документ беремо той, чий статус переміг — його редагуватимуть
      const takeThis = !existing || status !== existing.status;

      movieByTmdbId.set(movie.tmdbId, {
        tmdbId: movie.tmdbId,
        status,
        mongoId: takeThis ? String(movie._id) : existing.mongoId,
        folderName: takeThis ? placement.folderName : existing.folderName,
        // Потрібні діалогу редагування: без них форма відкрилась би порожньою
        // і збереження затерло б наявну оцінку та коментар
        rating: takeThis ? movie.rating ?? null : existing.rating,
        comment: takeThis ? movie.comment || "" : existing.comment,
        dateAdded: takeThis ? movie.dateAdded || null : existing.dateAdded,
        customType: takeThis ? movie.customType || null : existing.customType,
        copies: (existing?.copies || 0) + 1,
      });
    }

    // Серіали: беремо лише ті, що в watching / watched
    const tvByTmdbId = new Map();
    for (const tv of tvs) {
      const placement = placementByItem.get(String(tv._id));
      if (!placement) continue;
      if (placement.status !== FOLDER_STATUSES.WATCHING && placement.status !== FOLDER_STATUSES.WATCHED) continue;

      let entry = tvByTmdbId.get(tv.tmdbId);
      if (!entry) {
        entry = { tmdbId: tv.tmdbId, copies: 0, mongoId: null, folderName: null, customTypes: new Set(), watched: new Map() };
        tvByTmdbId.set(tv.tmdbId, entry);
      }
      entry.copies += 1;
      // Позначати й редагувати серії можна тільки коли збережена копія одна
      entry.mongoId = entry.copies === 1 ? String(tv._id) : null;
      entry.folderName = entry.copies === 1 ? placement.folderName : null;
      // Теги з усіх копій: для фільтра в шапці досить збігу хоча б з однією
      entry.customTypes.add(tv.customType || "");

      for (const season of tv.seasons) {
        if (!entry.watched.has(season.season)) entry.watched.set(season.season, new Map());
        const episodes = entry.watched.get(season.season);
        for (const episode of season.episodes) {
          // Перша копія перемагає — при кількох копіях редагування все одно вимкнене
          if (episodes.has(episode.episode)) continue;
          episodes.set(episode.episode, {
            dateAdded: episode.dateAdded || null,
            rating: episode.rating ?? null,
            comment: episode.comment || "",
            watchedCount: episode.watchedCount ?? 1,
          });
        }
      }
    }

    const watchedTv = [...tvByTmdbId.values()].map((entry) => ({
      tmdbId: entry.tmdbId,
      copies: entry.copies,
      mongoId: entry.mongoId,
      folderName: entry.folderName,
      customTypes: [...entry.customTypes],
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
