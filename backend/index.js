import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

import { loginValidation, registerValidation } from "./validations/auth.js";
import { checkValidationError } from "./utils/checkValidationError.js";
import { getMe, loginUser, registerUser, updateSettings, updateProfile, deleteCustomType, updateEmail } from "./controllers/userControllers.js";
import { checkAuth } from "./utils/checkAuth.js";
import {
  createPost,
  getAllPosts,
  getOnePost,
  removePost,
  updatePost,
} from "./controllers/postControllers.js";
import { postCreateValidation } from "./validations/post.js";
import {
  createComment,
  getAllCommentsByMovie,
  getAllCommentsByUser,
  removeComment,
} from "./controllers/commentControllers.js";
import { commentCreateValidation } from "./validations/comment.js";
import { uploadFile } from "./controllers/imageControllers.js";
import { folderCreateValidation } from "./validations/folder.js";
import { createFolder, getFoldersByUser, orderDecrement, orderIncrement, removeFolder, renameFolder, getFoldersByMovie, getFoldersByTV, getItemsFromFolder, updateFolderImage } from "./controllers/folderControllers.js";
import { addMovieToFolder, getMovieByTmdbId, getMovieByMongoId, updateMovieByMongoId, removeMovieFromFolder } from "./controllers/movieControllers.js";
import { addTvToFolder, getTvByTmdbId, getTvByMongoId, removeTvFromFolder, updateTvByMongoId, updateTvSeason, updateTvEpisode, markSeasonEpisodesWatched, deleteTvEpisode } from "./controllers/tvControllers.js";

// підключаємось до бази даних
const mongoConnection = process.env.MONGO_CONNECTION;
mongoose
  .connect(mongoConnection)
  // перевіряємо підключення
  .then(() => {
    console.log("DB ok");
  })
  // якщо помилка
  .catch((err) => {
    console.log("DB error", err);
  });

// Створюємо програму
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    // помилки, куди загружати
    callBack(null, "uploads");
  },
  filename: (req, file, callBack) => {
    callBack(null, file.originalname);
  },
});
const upload = multer({ storage });

// Настройки
// app.use(express.json()); // дозволяє читати json
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.use("/uploads", express.static("uploads")); // щоб діставати статичні файли з папки (в гугл наприклад)

// Запроси
app.get("/", (req, res) => {
  res.send("Hello World!");
});
// app.post("/auth/register", registerValidation, checkValidationError, registerUser);
app.post("/auth/register", registerValidation, checkValidationError, registerUser);
app.post("/auth/login", loginValidation, checkValidationError, loginUser);
app.get("/auth/me", checkAuth, getMe);
app.patch("/auth/settings", checkAuth, updateSettings);
app.patch("/auth/profile", checkAuth, updateProfile);
app.patch("/auth/email", checkAuth, updateEmail);
app.delete("/auth/types/:type", checkAuth, deleteCustomType);

// Фронтенд шле картинку як base64 у JSON ({ image: "data:..." }), тому multer не потрібен.
// Без checkAuth, бо завантаження аватара відбувається ще до реєстрації/логіну.
app.post("/upload", uploadFile);

// app.get("/posts", getAllPosts);
// app.get("/posts/:id", getOnePost);
// app.post("/posts", checkAuth, postCreateValidation, checkValidationError, createPost);
// app.delete("/posts/:id", checkAuth, removePost);
// app.patch("/posts/:id", checkAuth, postCreateValidation, checkValidationError, updatePost);

// app.get("/comments/:postId", getAllCommentsByMovie);
// app.get("/comments", checkAuth, getAllCommentsByUser);
// app.post("/comments", checkAuth, commentCreateValidation, checkValidationError, createComment);
// app.delete("/comments/:id", checkAuth, removeComment);

app.get("/movie/mongo/:mongoId", checkAuth, getMovieByMongoId)
app.get("/movie/:tmdbId", checkAuth, getMovieByTmdbId)
app.post("/movie", checkAuth, addMovieToFolder)
app.patch("/movie/:mongoId", checkAuth, updateMovieByMongoId)
app.delete("/movie", checkAuth, removeMovieFromFolder)

app.get("/tv/mongo/:mongoId", checkAuth, getTvByMongoId)
app.get("/tv/:tmdbId", checkAuth, getTvByTmdbId)
app.post("/tv", checkAuth, addTvToFolder)
app.patch("/tv/:mongoId/season/:season/episode/:episode", checkAuth, updateTvEpisode)
app.patch("/tv/:mongoId/season/:season/watched", checkAuth, markSeasonEpisodesWatched)
app.patch("/tv/:mongoId/season/:season", checkAuth, updateTvSeason)
app.patch("/tv/:mongoId", checkAuth, updateTvByMongoId)
app.delete("/tv/:mongoId/season/:season/episode/:episode", checkAuth, deleteTvEpisode)
app.delete("/tv", checkAuth, removeTvFromFolder)

app.get("/folders/:name", checkAuth, getItemsFromFolder)
app.get("/folders/movie/:tmdbId", checkAuth, getFoldersByMovie)
app.get("/folders/tv/:tmdbId", checkAuth, getFoldersByTV)

app.get("/folders", checkAuth, getFoldersByUser);
app.post("/folders", checkAuth, folderCreateValidation, checkValidationError, createFolder);
app.patch("/folders/:oldName", checkAuth, folderCreateValidation, checkValidationError, renameFolder);
app.patch("/folders/image/:name", checkAuth, updateFolderImage);
app.patch("/folders/orderIncrement/:name", checkAuth, orderIncrement);
app.patch("/folders/orderDecrement/:name", checkAuth, orderDecrement);
app.delete("/folders/:name", checkAuth, removeFolder);



// на якому хості запускаємо, функція що робити якщо помилка
app.listen(4444, (err) => {
  if (err) {
    console.log("server error");
    console.log(err);
  }

  console.log("server ok");
});
