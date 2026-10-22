import FolderModel, { FOLDER_STATUSES, FOLDER_STATUS_VALUES, betterStatus } from "../models/folder.js";
import MovieModel from "../models/movie.js";
import TvModel from "../models/tv.js";
import { normalizeTags } from "../utils/tags.js";

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
// Пізніша з двох дат (будь-яка може бути порожня)
const latestOf = (a, b) => {
  if (!a) return b || null;
  if (!b) return a;
  return new Date(a) >= new Date(b) ? a : b;
};

export const getUpdates = async (req, res) => {
  try {
    const userId = req.userId;
    // ?view=dropped — та сама логіка, але по кинутих: серіали з папок зі статусом dropped
    // (звичайний режим бере тільки watching / watched). Фільми віддаються однаково в обох режимах
    // з прапорцем hasDropped — фронт сам вирішує, які колекції показувати.
    const tvStatuses = req.query.view === "dropped"
      ? [FOLDER_STATUSES.DROPPED]
      : [FOLDER_STATUSES.WATCHING, FOLDER_STATUSES.WATCHED];

    // .lean() — прості обʼєкти замість документів Mongoose: для сотень серіалів із тисячами серій це суттєво швидше
    const folders = await FolderModel.find({
      user: userId,
      status: { $in: FOLDER_STATUS_VALUES },
    }, { name: 1, status: 1, "folderElements.itemId": 1, "folderElements.itemModel": 1 }).lean().exec();

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

    // З серіалів потрібні лише ті поля серій, які сторінка показує або передає у діалог редагування
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
        // Хоча б одна копія лежить у папці зі статусом dropped (навіть якщо інша копія сильніша):
        // така франшиза на сторінці нових релізів не показується взагалі
        hasDropped: Boolean(existing?.hasDropped) || placement.status === FOLDER_STATUSES.DROPPED,
        mongoId: takeThis ? String(movie._id) : existing.mongoId,
        folderName: takeThis ? placement.folderName : existing.folderName,
        // Потрібні діалогу редагування: без них форма відкрилась би порожньою
        // і збереження затерло б наявну оцінку та коментар
        rating: takeThis ? movie.rating ?? null : existing.rating,
        comment: takeThis ? movie.comment || "" : existing.comment,
        dateAdded: takeThis ? movie.dateAdded || null : existing.dateAdded,
        // Для сортування «Recently watched»: коли запис востаннє змінювали (найпізніше серед копій)
        updatedAt: latestOf(existing?.updatedAt, movie.updatedAt),
        customType: takeThis ? normalizeTags(movie.customType) : existing.customType,
        copies: (existing?.copies || 0) + 1,
      });
    }

    // Серіали: лише ті, що в папках зі статусами з tvStatuses
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
      // Позначати й редагувати серії можна тільки коли збережена копія одна
      entry.mongoId = entry.copies === 1 ? String(tv._id) : null;
      entry.folderName = entry.copies === 1 ? placement.folderName : null;
      // Теги з усіх копій: для фільтра в шапці досить збігу хоча б з однією
      // Усі теги копії; без тегів — порожній рядок (фронт трактує його як «без тегу»)
      const tvTags = normalizeTags(tv.customType);
      for (const tag of tvTags.length ? tvTags : [""]) entry.customTypes.add(tag);

      entry.updatedAt = latestOf(entry.updatedAt, tv.updatedAt);
      for (const season of tv.seasons) {
        if (!entry.watched.has(season.season)) entry.watched.set(season.season, new Map());
        const episodes = entry.watched.get(season.season);
        for (const episode of season.episodes) {
          // Остання дата перегляду по всіх копіях (навіть тих серій, що нижче пропускаються як дублікати)
          entry.lastWatched = latestOf(entry.lastWatched, episode.dateAdded);
          // Перша копія перемагає — при кількох копіях редагування все одно вимкнене
          if (episodes.has(episode.episode)) continue;
          // Віддаємо лише значення, що відрізняються від типових (оцінки немає, коментаря немає, 1 перегляд,
          // не пропущена): фронт підставляє типові сам. Так відповідь для тисяч серій втричі менша.
          const data = {};
          if (episode.dateAdded) data.dateAdded = episode.dateAdded;
          if (episode.rating != null) data.rating = episode.rating;
          if (episode.comment) data.comment = episode.comment;
          if ((episode.watchedCount ?? 1) !== 1) data.watchedCount = episode.watchedCount;
          // Пропущена серія теж «опрацьована» (не нова), але показується хрестиком
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
