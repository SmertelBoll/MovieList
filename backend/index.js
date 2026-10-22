import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import compression from "compression";
import * as dotenv from "dotenv";
dotenv.config();

import { loginValidation, registerValidation } from "./validations/auth.js";
import { checkValidationError } from "./utils/checkValidationError.js";
import { getMe, loginUser, registerUser, updateSettings, updateProfile, deleteCustomType, renameCustomType, updateEmail, updatePassword } from "./controllers/userControllers.js";
import { checkAuth } from "./utils/checkAuth.js";
import { uploadFile } from "./controllers/imageControllers.js";
import { folderCreateValidation } from "./validations/folder.js";
import { getUpdates } from "./controllers/updatesControllers.js";
import { createFolder, getFoldersByUser, orderDecrement, orderIncrement, removeFolder, renameFolder, getFoldersByMovie, getFoldersByTV, getItemsFromFolder, getSavedIndex, updateFolderImage, updateFolderStatus } from "./controllers/folderControllers.js";
import { addMovieToFolder, getMovieByTmdbId, getMovieByMongoId, updateMovieByMongoId, removeMovieFromFolder } from "./controllers/movieControllers.js";
import { addTvToFolder, getTvByTmdbId, getTvByMongoId, removeTvFromFolder, updateTvByMongoId, updateTvSeason, updateTvEpisode, markSeasonEpisodesWatched, deleteTvEpisode, deleteTvSeason } from "./controllers/tvControllers.js";

const mongoConnection = process.env.MONGO_CONNECTION;
mongoose
  .connect(mongoConnection)
  .then(() => {
    console.log("DB ok");
  })
  .catch((err) => {
    console.log("DB error", err);
  });

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "uploads");
  },
  filename: (req, file, callBack) => {
    callBack(null, file.originalname);
  },
});
const upload = multer({ storage });

app.use(express.json({ limit: "50mb" }));
app.use(compression()); // gzip: /updates is hundreds of KB, noticeable on mobile.
app.use(cors());
app.use("/uploads", express.static("uploads"));

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
app.patch("/auth/password", checkAuth, updatePassword);
app.patch("/auth/types/:type", checkAuth, renameCustomType);
app.delete("/auth/types/:type", checkAuth, deleteCustomType);

// The frontend sends images as base64 JSON, so multer isn't needed.
// No checkAuth: avatar upload happens before registration/login.
app.post("/upload", uploadFile);

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
app.delete("/tv/:mongoId/season/:season", checkAuth, deleteTvSeason)
app.delete("/tv", checkAuth, removeTvFromFolder)

app.get("/folders/:name", checkAuth, getItemsFromFolder)
app.get("/folders/movie/:tmdbId", checkAuth, getFoldersByMovie)
app.get("/folders/tv/:tmdbId", checkAuth, getFoldersByTV)

app.get("/updates", checkAuth, getUpdates);
app.get("/items/saved", checkAuth, getSavedIndex);

app.get("/folders", checkAuth, getFoldersByUser);
app.post("/folders", checkAuth, folderCreateValidation, checkValidationError, createFolder);
app.patch("/folders/:oldName", checkAuth, folderCreateValidation, checkValidationError, renameFolder);
app.patch("/folders/image/:name", checkAuth, updateFolderImage);
app.patch("/folders/status/:name", checkAuth, updateFolderStatus);
app.patch("/folders/orderIncrement/:name", checkAuth, orderIncrement);
app.patch("/folders/orderDecrement/:name", checkAuth, orderDecrement);
app.delete("/folders/:name", checkAuth, removeFolder);



app.listen(4444, (err) => {
  if (err) {
    console.log("server error");
    console.log(err);
  }

  console.log("server ok");
});
