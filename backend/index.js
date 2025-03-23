import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

import { loginValidation, registerValidation } from "./validations/auth.js";
import { checkValidationError } from "./utils/checkValidationError.js";
import { getMe, loginUser, registerUser } from "./controllers/userControllers.js";
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
import { addMovieToFolder, createFolder, getAllFoldersByUser, orderDecrement, orderIncrement, removeFolder, renameFolderByOrder } from "./controllers/folderControllers.js";

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

// // app.post("/upload", upload.single("image"), uploadFile);
// // app.get("/image/:fileId", download);
// app.post("/upload", upload.single("image"), uploadFile);

// app.get("/posts", getAllPosts);
// app.get("/posts/:id", getOnePost);
// app.post("/posts", checkAuth, postCreateValidation, checkValidationError, createPost);
// app.delete("/posts/:id", checkAuth, removePost);
// app.patch("/posts/:id", checkAuth, postCreateValidation, checkValidationError, updatePost);

// app.get("/comments/:postId", getAllCommentsByMovie);
// app.get("/comments", checkAuth, getAllCommentsByUser);
// app.post("/comments", checkAuth, commentCreateValidation, checkValidationError, createComment);
// app.delete("/comments/:id", checkAuth, removeComment);

app.post("/folders/create", checkAuth, folderCreateValidation, checkValidationError, createFolder);

app.get("/folders", checkAuth, getAllFoldersByUser);
app.patch("/folders/rename/:order", checkAuth, folderCreateValidation, checkValidationError, renameFolderByOrder);
app.delete("/folders/:order", checkAuth, removeFolder);
app.patch("/folders/orderIncrement/:order", checkAuth, orderIncrement);
app.patch("/folders/orderDecrement/:order", checkAuth, orderDecrement);

app.patch("/folders/addmovie", checkAuth, addMovieToFolder)




// на якому хості запускаємо, функція що робити якщо помилка
app.listen(4444, (err) => {
  if (err) {
    console.log("server error");
    console.log(err);
  }

  console.log("server ok");
});
