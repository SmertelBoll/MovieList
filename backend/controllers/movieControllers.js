import FolderModel from "../models/folder.js";
import MovieModel from "../models/movie.js";
import mongoose from "mongoose";


export const addMovieToFolder = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      folderName,
      tmdbId,
      tmdbTitle,
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

    const doc = new MovieModel({
      tmdbId,
      tmdbTitle,
      dateAdded,
      rating,
      comment,
      customType,
      user: userId
    });

    const item = await doc.save();

    const updatedFolder = await FolderModel.findOneAndUpdate(
      { name: folderName, user: userId },
      { $push: { folderElements: { itemId: item._id, itemModel: "Movie" } } },
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

export const updateMovieByMongoId = async (req, res) => {
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
    let updatedItem = await MovieModel.findOneAndUpdate(
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

export const removeMovieFromFolder = async (req, res) => {
  try {
    const userId = req.userId;
    const { mongoId, folderName } = req.body;

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
    const deleteItemResult = await MovieModel.findOneAndDelete({ _id: mongoId, user: userId });

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Delete error", message: "failed to remove item" });
  }
};

export const getMovieByMongoId = async (req, res) => {
  try {
    const mongoId = req.params.mongoId;
    const userId = req.userId;

    const item = await MovieModel.findOne({ _id: mongoId, user: userId });

    if (!item) {
      return res.status(404).json({ title: "Not found", message: "Item not found in your database" });
    }

    // Знаходимо папку, у якій збережено цей фільм
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

export const getMovieByTmdbId = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const userId = req.userId;

    let item = await MovieModel.findOne({ tmdbId, user: userId });

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
