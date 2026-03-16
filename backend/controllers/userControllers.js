import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config();

import UserModel from "../models/user.js";

const bcrypt_salt = process.env.BCRYPT_SALT;
const jwt_key = process.env.JWT_KEY;

export const registerUser = async (req, res) => {
  try {
    console.log(req.body);

    const password = req.body.password;

    const salt = await bcrypt.genSalt(parseInt(bcrypt_salt)); // шифрування
    const hash = await bcrypt.hash(password, salt);

    const avatar = req.body.avatar;

    const doc = new UserModel({
      email: req.body.email,
      fullName: req.body.fullName,
      avatar: avatar ? avatar : "",
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

export const updateSettings = async (req, res) => {
  try {
    const { themeMode, language, typeCustom } = req.body;
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
