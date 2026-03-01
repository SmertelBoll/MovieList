import FolderModel from "../models/folder.js";
import MovieModel from "../models/movie.js";
import mongoose from "mongoose";


export const addMovieToFolder = async (req, res) => {
  try {
    const userId = req.userId;
    const folderName = req.body.folderName;

    const movieId = req.body.movieId;
    const movieTitle = req.body.movieTitle;
    const dateAdded = req.body.dateAdded;
    const rating = req.body.rating;
    const comment = req.body.comment;

    if (!folderName) {
      return res.status(400).json({ title: "Folder error", message: "no folder selected" });
    }
    if (!movieId) {
      return res.status(400).json({ title: "Folder error", message: "no movie selected" });
    }

    const doc = new MovieModel({
      movieId,
      movieTitle,
      dateAdded,
      rating,
      comment,
      user: userId
    });

    const movie = await doc.save();

    const updatedFolder = await FolderModel.findOneAndUpdate(
      { name: folderName, user: userId }, // Шукаємо папку за ім'ям
      { $push: { folderElements: movie._id } }, // Додаємо новий фільм у масив
      { new: true } // Повертаємо оновлену папку
    );

    if (!updatedFolder) {
      return res.status(404).json({ title: "Folder error", message: "folder not found" });
    }

    res.json({
      success: updatedFolder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to add movie" });
  }
};

export const getMoviesFromFolder = async (req, res) => {
  try {
    const folderName = req.params.name;
    const currentUserId = req.userId;
    const filter = req.query.filter || "";
    // Розбиваємо sort_by на sortBy і sortDirection
    const sortParam = req.query.sort_by || "";
    const [sortBy, sortDirection = "desc"] = sortParam.split(".");

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const skip = (page - 1) * limit;

    // Конвертуємо currentUserId в ObjectId
    const userId = new mongoose.Types.ObjectId(currentUserId);

    // Базовий pipeline
    const pipeline = [
      { $match: { name: folderName, user: userId } },
      { $unwind: { path: "$folderElements", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "movies",
          localField: "folderElements",
          foreignField: "_id",
          as: "movie"
        }
      },
      { $unwind: { path: "$movie", preserveNullAndEmptyArrays: false } }
    ];

    // Додаємо фільтрацію, якщо є параметр filter
    if (filter) {
      pipeline.push({
        $match: {
          "movie.movieTitle": { $regex: filter, $options: "i" }
        }
      });
    }

    // Додаємо сортування, якщо є параметр sortBy
    if (sortBy) {
      // Конвертуємо sortDirection в правильний формат (1 або -1)
      const sortOrder = sortDirection === 'asc' ? 1 : -1;
      pipeline.push({
        $sort: { [`movie.${sortBy}`]: sortOrder }
      });
    }

    // Групуємо назад в масив
    pipeline.push({
      $group: {
        _id: "$_id",
        folderElements: { $push: "$movie" }
      }
    });

    // Проектуємо тільки folderElements
    pipeline.push({
      $project: { _id: 0, folderElements: 1 }
    });

    // Розгортаємо масив folderElements
    pipeline.push({
      $unwind: { path: "$folderElements", preserveNullAndEmptyArrays: false }
    });

    // Проектуємо тільки фільми
    pipeline.push({
      $replaceRoot: { newRoot: "$folderElements" }
    });

    // Додаємо пагінацію
    pipeline.push({
      $facet: {
        movies: [
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
    const movies = result[0]?.movies || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Повертаємо фільми з метаданими пагінації
    res.json({
      results: movies,
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
    res.status(500).json({ title: "Folder error", message: "failed to get movies" });
  }
};

export const getMovieById = async (req, res) => {
  try {
    // Отримуємо movieId (ID з бази TMDB) з параметрів запиту
    const movieId = req.params.movieId;

    // Щоб знайти лише фільми поточного користувача (щоб один користувач не міг бачити оцінки іншого)
    const userId = req.userId;

    // Шукаємо фільм у базі MongoDB (модель MovieModel)
    const movie = await MovieModel.findOne({
      movieId: movieId,
      user: userId
    });

    if (!movie) {
      return res.status(404).json({
        title: "Not found",
        message: "Movie not found in your database"
      });
    }

    res.json(movie);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      title: "Movie error",
      message: "Failed to get movie by ID"
    });
  }
};
