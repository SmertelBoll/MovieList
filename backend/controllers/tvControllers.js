import FolderModel from "../models/folder.js";
import TvModel from "../models/tv.js";
import mongoose from "mongoose";


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
      // Мова, якою користувач бачив назву в момент збереження
      language,
      dateAdded,
      rating,
      comment,
      customType,
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

    // Оновлюємо дані
    let updatedItem = await TvModel.findOneAndUpdate(
      { _id: mongoId, user: userId },
      { rating, comment, dateAdded, customType },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ title: "Update error", message: "item not found" });
    }

    // Якщо папка змінилася, тоді переносимо
    if (folderName) {
      const currentFolder = await FolderModel.findOne({
        user: userId,
        "folderElements.itemId": mongoId
      });


      if (currentFolder && currentFolder.name !== folderName) {
        // Знаходимо тип елемента в папці
        const folderElement = currentFolder.folderElements.find(el => el.itemId.toString() === mongoId);

        // Видаляємо зі старої папки
        await FolderModel.updateOne(
          { _id: currentFolder._id },
          { $pull: { folderElements: { itemId: mongoId } } }
        );

        // Додаємо в нову папку
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

    // Шукаємо папку і видаляємо посилання на елемент
    const folder = await FolderModel.findOneAndUpdate(
      { name: folderName, user: userId },
      { $pull: { folderElements: { itemId: mongoId } } },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ title: "Delete error", message: "folder not found" });
    }

    // Видаляємо документ з відповідної колекції
    const deleteItemResult = await TvModel.findOneAndDelete({ _id: mongoId, user: userId });

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Delete error", message: "failed to remove item" });
  }
};

// Оцінка / коментар / дата перегляду для сезону
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

// Оцінка / коментар / дата перегляду / кількість переглядів для серії
export const updateTvEpisode = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season, episode } = req.params;
    const { rating, comment, dateAdded, watchedCount } = req.body;

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

// Повністю видалити серію (об'єкт серії) із сезону
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

// Позначити всі (передані) серії сезону як переглянуті (watchedCount = 1),
// не чіпаючи серії, які вже мають перегляди / оцінку
export const markSeasonEpisodesWatched = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, season } = req.params;
    const { episodes } = req.body;

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

    const epNumbers = Array.isArray(episodes) ? episodes.map(Number) : [];
    for (const epNum of epNumbers) {
      let episodeDoc = seasonDoc.episodes.find(e => e.episode === epNum);
      if (!episodeDoc) {
        seasonDoc.episodes.push({ episode: epNum, watchedCount: 1, dateAdded: new Date() });
      } else if (!(episodeDoc.watchedCount > 0)) {
        episodeDoc.watchedCount = 1;
        if (!episodeDoc.dateAdded) episodeDoc.dateAdded = new Date();
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

    // Знаходимо папку, у якій збережено цей серіал
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
