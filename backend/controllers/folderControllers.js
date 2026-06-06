import UserModel from "../models/user.js";
import FolderModel from "../models/folder.js";
import MovieModel from "../models/movie.js";
import TvModel from "../models/tv.js";
import { destroyImage } from "./imageControllers.js";
import mongoose from "mongoose";


export const getFoldersByUser = async (req, res) => {
  try {
    const userId = req.userId;
    const foldersByUser = await FolderModel
      .find({ user: userId })
      .select("name order image folderElements -_id")
      .exec();

    const results = foldersByUser.map(folder => ({
      name: folder.name,
      order: folder.order,
      image: folder.image,
      movieCount: folder.folderElements.filter(e => e.itemModel === "Movie").length,
      tvCount: folder.folderElements.filter(e => e.itemModel === "Tv").length,
    }));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({ title: "Folders error", message: "could not get folders" });
  }
};

export const createFolder = async (req, res) => {
  try {
    const name = req.body.name;
    const userId = req.userId;

    const order = await FolderModel.countDocuments({ user: userId })

    const doc = new FolderModel({
      name: name,
      order: order,
      user: userId
    });

    const folder = await doc.save();

    res.json({
      success: true,
      results: folder
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folders error", message: "failed to create folder" });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const oldFolderName = req.params.oldName;
    const newFolderName = req.body.name;
    const userId = req.userId;

    const currentFolder = await FolderModel.findOne({ name: oldFolderName, user: userId });

    if (!currentFolder) {
      return res.status(404).json({ title: "Folder not found", message: "no folder found" });
    }

    let folderNames = await FolderModel
      .find({ user: userId })
      .select("name -_id")
      .exec();

    folderNames = folderNames.map(obj => obj.name)

    if (folderNames.includes(newFolderName) && oldFolderName !== newFolderName) {
      return res.status(400).json({ title: "Folders error", message: "the folder name must be unique" });
    }

    // Оновити поле name
    currentFolder.name = newFolderName;

    // Зберегти зміни
    await currentFolder.save();

    // Відповідь з оновленою папкою
    res.json({
      success: true,
      results: currentFolder
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      title: "Folders error", message: "failed to get folders"
    });
  }
}

export const updateFolderImage = async (req, res) => {
  try {
    const folderName = req.params.name;
    const userId = req.userId;
    const image = req.body.image || "";
    const imagePublicId = req.body.imagePublicId || "";

    const currentFolder = await FolderModel.findOne({ name: folderName, user: userId });

    if (!currentFolder) {
      return res.status(404).json({ title: "Folder not found", message: "no folder found" });
    }

    // Якщо була стара картинка і вона змінюється/видаляється — прибираємо її з Cloudinary
    const oldPublicId = currentFolder.imagePublicId;
    if (oldPublicId && oldPublicId !== imagePublicId) {
      await destroyImage(oldPublicId);
    }

    currentFolder.image = image;
    currentFolder.imagePublicId = imagePublicId;
    await currentFolder.save();

    res.json({
      success: true,
      results: currentFolder
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folders error", message: "failed to update folder image" });
  }
};

export const removeFolder = async (req, res) => {
  try {
    const folderName = req.params.name;
    const userId = req.userId;

    console.log(folderName, userId, req.params)

    const currentFolder = await FolderModel.find({ name: folderName, user: userId }).populate("user").exec();
    const currentUser = await UserModel.findById(userId);

    if (userId !== currentFolder[0].user._id.toString() && currentUser.accessLevel !== "admin") {
      console.log("access is denied");
      return res.status(500).json({ title: "Folder error", message: "access is denied" });
    }

    const folder = await FolderModel.findOneAndDelete({
      order: currentFolder[0].order,
      user: userId
    });

    if (!folder) {
      return res.status(404).json({ title: "Folder error", message: "folder not found", });
    }

    // Прибираємо картинку папки з Cloudinary, якщо вона була
    await destroyImage(folder.imagePublicId);

    const foldersByUser = await FolderModel
      .find({ user: userId })
      .exec();

    const orders = foldersByUser.map(folder => folder.order);                                 // Отримуємо масив значень order
    const sortedOrders = [...orders].sort((a, b) => a - b);                                   // Сортуємо масив order
    const newOrders = Array.from({ length: sortedOrders.length }, (_, index) => index);   // Створюємо новий масив без пропусків
    const mapping = {};                                                                       // Створюємо мапу старих значень до нових
    sortedOrders.forEach((value, index) => {
      mapping[value] = newOrders[index];
    });

    // Оновлюємо order для кожного об'єкта в foldersByUser
    const updatedFolders = foldersByUser.map(folder => {
      const folderObject = folder.toObject(); // Перетворюємо на звичайний об'єкт
      return {
        ...folderObject,
        order: mapping[folderObject.order] // Оновлюємо значення order
      };
    });

    // Зберігаємо оновлені папки у базі даних
    const updatePromises = updatedFolders.map(folder => {
      return FolderModel.updateOne({ _id: folder._id }, { order: folder.order });
    });

    await Promise.all(updatePromises); // Чекаємо, поки всі оновлення завершаться

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to delete folder" });
  }
};

// Виділяємо логіку змінити черги у окрему функцію
export const changeOrder = async (upOrDown, folderName, userId) => {
  try {
    const currentFolder = await FolderModel.findOne({ name: folderName, user: userId });
    const currentOrder = currentFolder.order;
    const elseOrder = currentOrder + upOrDown;

    const elseFolder = await FolderModel.findOne({ order: elseOrder, user: userId });

    if (!elseFolder) {
      return false
    }


    currentFolder.order = elseOrder;
    elseFolder.order = currentOrder;

    await currentFolder.save();
    await elseFolder.save();

    return true
  } catch (error) {
    console.log(error);
    throw new Error("Failed to change order");
  }
};

export const orderIncrement = async (req, res) => {
  try {
    const folderName = req.params.name;
    const userId = req.userId;

    const success = await changeOrder(1, folderName, userId);

    if (!success) {
      res.status(500).json({ title: "Folder error", message: "failed to change folder order" });
    }

    return res.json({
      success: success
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to change folder order" });
  }
}

export const orderDecrement = async (req, res) => {
  try {
    const folderName = req.params.name;
    const userId = req.userId;

    const success = await changeOrder(-1, folderName, userId);

    if (!success) {
      res.status(500).json({ title: "Folder error", message: "failed to change folder order" });
    }

    return res.json({
      success: success
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to change folder order" });
  }
}

export const getFoldersByMovie = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const userId = req.userId;

    // Шукаємо всі фільми у базі MongoDB для цього користувача (їх може бути багато, по одному на кожну папку)
    const movies = await MovieModel.find({
      tmdbId: tmdbId,
      user: userId
    });

    if (!movies || movies.length === 0) {
      // Якщо фільма немає, то він і не доданий в жодну папку
      return res.json({
        success: true,
        results: []
      });
    }

    const tmdbIds = movies.map(movie => movie._id);

    // Шукаємо всі папки користувача, де в масиві folderElements є _id хоча б одного з цих фільмів
    const folders = await FolderModel.find({
      user: userId,
      "folderElements.itemId": { $in: tmdbIds }
    }).select("name order -_id").exec();

    res.json({
      success: true,
      results: folders
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "Failed to get folders by movie ID" });
  }
};

export const getFoldersByTV = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const userId = req.userId;

    const tvShows = await TvModel.find({
      tmdbId: tmdbId,
      user: userId
    });

    if (!tvShows || tvShows.length === 0) {
      return res.json({
        success: true,
        results: []
      });
    }

    const tvIds = tvShows.map(tv => tv._id);

    const folders = await FolderModel.find({
      user: userId,
      "folderElements.itemId": { $in: tvIds }
    }).select("name order -_id").exec();

    res.json({
      success: true,
      results: folders
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "Failed to get folders by TV ID" });
  }
};

export const getItemsFromFolder = async (req, res) => {
  try {
    const folderName = req.params.name;
    const currentUserId = req.userId;
    const filter = req.query.query || "";
    // Розбиваємо sort_by на sortBy і sortDirection
    const sortParam = req.query.sort_by || "";
    const [sortBy, sortDirection = "desc"] = sortParam.split(".");

    // Фільтр за типом (movie/tv). Може містити обидва значення через кому
    const types = (req.query.type || "").split(",").filter(Boolean);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Конвертуємо currentUserId в ObjectId
    const userId = new mongoose.Types.ObjectId(currentUserId);

    // Базовий pipeline з об'єднанням обох колекцій
    const pipeline = [
      { $match: { name: folderName, user: userId } },
      { $unwind: { path: "$folderElements", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "movies",
          localField: "folderElements.itemId",
          foreignField: "_id",
          as: "movieDoc"
        }
      },
      {
        $lookup: {
          from: "tvs",
          localField: "folderElements.itemId",
          foreignField: "_id",
          as: "tvDoc"
        }
      },
      {
        $addFields: {
          item: {
            $cond: [
              { $gt: [{ $size: "$movieDoc" }, 0] },
              {
                $mergeObjects: [
                  { $arrayElemAt: ["$movieDoc", 0] },
                  { media_type: "movie" }
                ]
              },
              {
                $cond: [
                  { $gt: [{ $size: "$tvDoc" }, 0] },
                  {
                    $mergeObjects: [
                      { $arrayElemAt: ["$tvDoc", 0] },
                      { media_type: "tv" }
                    ]
                  },
                  null
                ]
              }
            ]
          }
        }
      },
      { $match: { item: { $ne: null } } },
      { $replaceRoot: { newRoot: "$item" } }
    ];

    // Фільтрація за типом (тільки movie або тільки tv)
    if (types.length > 0) {
      pipeline.push({
        $match: { media_type: { $in: types } }
      });
    }

    // Додаємо фільтрацію
    if (filter) {
      pipeline.push({
        $match: {
          "tmdbTitle": { $regex: filter, $options: "i" }
        }
      });
    }

    // Додаємо сортування
    if (sortBy) {
      const sortOrder = sortDirection === 'asc' ? 1 : -1;
      pipeline.push({
        $sort: { [sortBy]: sortOrder }
      });
    }

    // Додаємо пагінацію
    pipeline.push({
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    });

    const result = await FolderModel.aggregate(pipeline).exec();

    // Отримуємо результати
    const items = result[0]?.items || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      results: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to get items" });
  }
};
