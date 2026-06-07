import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config();

import UserModel from "../models/user.js";
import MovieModel from "../models/movie.js";
import TvModel from "../models/tv.js";
import { destroyImage } from "./imageControllers.js";

const bcrypt_salt = process.env.BCRYPT_SALT;
const jwt_key = process.env.JWT_KEY;

export const registerUser = async (req, res) => {
  try {
    console.log(req.body);

    const password = req.body.password;

    const salt = await bcrypt.genSalt(parseInt(bcrypt_salt)); // шифрування
    const hash = await bcrypt.hash(password, salt);

    const avatar = req.body.avatar;
    const avatarPublicId = req.body.avatarPublicId;

    const doc = new UserModel({
      email: req.body.email,
      fullName: req.body.fullName,
      avatar: avatar ? avatar : "",
      avatarPublicId: avatarPublicId ? avatarPublicId : "",
      passwordHash: hash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      jwt_key, // ключ шифрування
      {
        expiresIn: "30d", // скільки токен буде існувати
      }
    );

    res.json({
      ...user._doc,
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ title: "Authorization error", message: "the user with this email is already registered" });
    }
    res.status(500).json({ title: "Authorization error", message: "failed to register" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email }).exec();
    if (!user) {
      return res.status(404).json({ title: "Authorization error", message: "user not found" });
    }

    const isValidPassword = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ title: "Authorization error", message: "wrong login or password" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      jwt_key, // ключ шифрування
      {
        expiresIn: "30d", // скільки токен буде існувати
      }
    );

    // повертаємо дані
    res.json({
      ...user._doc,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Authorization error", message: "failed to authenticate" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).exec();

    if (!user) {
      return res.status(404).json({ title: "Authorization error", message: "user not found" });
    }

    res.json({
      ...user._doc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Authorization error", message: "failed to get data" });
  }
};

// Видаляє кастомний тип зі списку користувача і прибирає його з усіх
// фільмів/серіалів користувача, де він був застосований
export const deleteCustomType = async (req, res) => {
  try {
    const userId = req.userId;
    const type = req.params.type;

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Settings error", message: "user not found" });
    }

    // Прибираємо тип зі списку користувача
    user.typeCustom = (user.typeCustom || []).filter((t) => t !== type);
    await user.save();

    // Очищаємо customType у всіх елементах користувача, де він використовувався
    await Promise.all([
      MovieModel.updateMany({ user: userId, customType: type }, { $set: { customType: "" } }),
      TvModel.updateMany({ user: userId, customType: type }, { $set: { customType: "" } }),
    ]);

    res.json({
      success: true,
      results: { typeCustom: user.typeCustom },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Settings error", message: "failed to delete custom type" });
  }
};

export const updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const newEmail = (email || "").trim().toLowerCase();

    // Базова валідація формату
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ title: "Email error", message: "invalid email address" });
    }

    const user = await UserModel.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Email error", message: "user not found" });
    }

    // Перевірка пароля
    const isValidPassword = await bcrypt.compare(password || "", user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ title: "Email error", message: "wrong password" });
    }

    // Якщо пошта не змінилась
    if (newEmail === user.email) {
      return res.status(400).json({ title: "Email error", message: "this is already your email" });
    }

    // Перевірка, що пошта не зайнята іншим користувачем
    const existing = await UserModel.findOne({ email: newEmail }).exec();
    if (existing) {
      return res.status(400).json({ title: "Email error", message: "this email is already in use" });
    }

    user.email = newEmail;
    await user.save();

    res.json({
      success: true,
      results: { email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ title: "Email error", message: "this email is already in use" });
    }
    console.log(error);
    res.status(500).json({ title: "Email error", message: "failed to update email" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ title: "Password error", message: "new password must be at least 5 characters" });
    }

    const user = await UserModel.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Password error", message: "user not found" });
    }

    const isValidPassword = await bcrypt.compare(oldPassword || "", user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ title: "Password error", message: "wrong current password" });
    }

    const salt = await bcrypt.genSalt(parseInt(bcrypt_salt));
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Password error", message: "failed to update password" });
  }
};

// Перейменовує тег у списку користувача і в усіх його фільмах/серіалах
export const renameCustomType = async (req, res) => {
  try {
    const userId = req.userId;
    const oldName = req.params.type;
    const newName = (req.body.newName || "").trim();

    if (!newName) {
      return res.status(400).json({ title: "Tag error", message: "tag name cannot be empty" });
    }
    if (newName.length > 100) {
      return res.status(400).json({ title: "Tag error", message: "tag name must be at most 100 characters" });
    }

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Tag error", message: "user not found" });
    }

    const types = user.typeCustom || [];
    if (!types.includes(oldName)) {
      return res.status(404).json({ title: "Tag error", message: "tag not found" });
    }
    if (oldName !== newName && types.includes(newName)) {
      return res.status(400).json({ title: "Tag error", message: "tag with this name already exists" });
    }

    // Замінюємо назву, зберігаючи порядок
    user.typeCustom = types.map((t) => (t === oldName ? newName : t));
    await user.save();

    // Оновлюємо customType у всіх елементах користувача
    await Promise.all([
      MovieModel.updateMany({ user: userId, customType: oldName }, { $set: { customType: newName } }),
      TvModel.updateMany({ user: userId, customType: oldName }, { $set: { customType: newName } }),
    ]);

    res.json({
      success: true,
      results: { typeCustom: user.typeCustom },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Tag error", message: "failed to rename tag" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, avatar, avatarPublicId } = req.body;

    const user = await UserModel.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Profile error", message: "user not found" });
    }

    if (typeof fullName === "string" && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    // Зміна/видалення аватарки: прибираємо стару з Cloudinary
    if (typeof avatar === "string") {
      const newPublicId = avatarPublicId || "";
      if (user.avatarPublicId && user.avatarPublicId !== newPublicId) {
        await destroyImage(user.avatarPublicId);
      }
      user.avatar = avatar;
      user.avatarPublicId = newPublicId;
    }

    await user.save();

    res.json({
      success: true,
      results: {
        fullName: user.fullName,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Profile error", message: "failed to update profile" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { themeMode, language, typeCustom } = req.body;

    // Кожен тег — не довше 100 символів
    if (Array.isArray(typeCustom) && typeCustom.some((t) => typeof t === "string" && t.length > 100)) {
      return res.status(400).json({ title: "Tag error", message: "tag name must be at most 100 characters" });
    }

    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      {
        themeMode,
        language,
        typeCustom,
      },
      { new: true }
    ).exec();

    if (!user) {
      return res.status(404).json({ title: "Settings error", message: "user not found" });
    }

    res.json({
      success: true,
      results: {
        themeMode: user.themeMode,
        language: user.language,
        typeCustom: user.typeCustom,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Settings error", message: "failed to update settings" });
  }
};
