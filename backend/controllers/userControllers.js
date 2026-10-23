import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config();

import UserModel from "../models/user.js";
import MovieModel from "../models/movie.js";
import TvModel from "../models/tv.js";
import FolderModel, { DEFAULT_FOLDERS } from "../models/folder.js";
import { destroyImage } from "./imageControllers.js";

const bcrypt_salt = process.env.BCRYPT_SALT;
const jwt_key = process.env.JWT_KEY;

export const registerUser = async (req, res) => {
  try {
    console.log(req.body);

    const password = req.body.password;

    const salt = await bcrypt.genSalt(parseInt(bcrypt_salt));
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

    // Don't fail here: the user already exists and email is unique, so failing would block re-registration.
    try {
      await FolderModel.insertMany(
        DEFAULT_FOLDERS.map((folder) => ({ ...folder, user: user._id }))
      );
    } catch (folderError) {
      console.log("failed to create default folders:", folderError);
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      jwt_key,
      {
        expiresIn: "30d",
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
      jwt_key,
      {
        expiresIn: "30d",
      }
    );

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

// Removes a tag from the user's list and from all their items.
export const deleteCustomType = async (req, res) => {
  try {
    const userId = req.userId;
    const type = req.params.type;

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Settings error", message: "user not found" });
    }

    user.typeCustom = (user.typeCustom || []).filter((t) => t !== type);
    await user.save();

    await Promise.all([
      MovieModel.updateMany({ user: userId, customType: type }, { $pull: { customType: type } }),
      TvModel.updateMany({ user: userId, customType: type }, { $pull: { customType: type } }),
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ title: "Email error", message: "invalid email address" });
    }

    const user = await UserModel.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Email error", message: "user not found" });
    }

    const isValidPassword = await bcrypt.compare(password || "", user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ title: "Email error", message: "wrong password" });
    }

    if (newEmail === user.email) {
      return res.status(400).json({ title: "Email error", message: "this is already your email" });
    }

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

// Renames a tag in the user's list and in all their items.
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

    user.typeCustom = types.map((t) => (t === oldName ? newName : t));
    await user.save();

    const rename = { $set: { "customType.$[tag]": newName } };
    const options = { arrayFilters: [{ tag: oldName }] };
    await Promise.all([
      MovieModel.updateMany({ user: userId, customType: oldName }, rename, options),
      TvModel.updateMany({ user: userId, customType: oldName }, rename, options),
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

const MUTE_MODES = ["forever", "new-part"];
const DAY_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

// Stops following a movie franchise on Updates (or changes how). Body: { mode, mutedAt? }; mutedAt is the client's
// calendar day, the server's UTC day when absent.
export const muteCollection = async (req, res) => {
  try {
    const collectionId = Number(req.params.collectionId);
    const { mode, mutedAt } = req.body;
    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return res.status(400).json({ title: "Mute error", message: "invalid collection id" });
    }
    if (!MUTE_MODES.includes(mode)) {
      return res.status(400).json({ title: "Mute error", message: "mode must be forever or new-part" });
    }
    const day = typeof mutedAt === "string" && DAY_PATTERN.test(mutedAt) ? mutedAt : new Date().toISOString().slice(0, 10);

    const user = await UserModel.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({ title: "Mute error", message: "user not found" });
    }
    user.mutedCollections = [
      ...user.mutedCollections.filter((m) => m.collectionId !== collectionId),
      { collectionId, mode, mutedAt: day },
    ];
    await user.save();

    res.json({ success: true, results: user.mutedCollections });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Mute error", message: "failed to stop following the collection" });
  }
};

export const unmuteCollection = async (req, res) => {
  try {
    const collectionId = Number(req.params.collectionId);
    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { $pull: { mutedCollections: { collectionId } } },
      { new: true }
    ).exec();
    if (!user) {
      return res.status(404).json({ title: "Mute error", message: "user not found" });
    }

    res.json({ success: true, results: user.mutedCollections });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Mute error", message: "failed to follow the collection again" });
  }
};

// Keep in sync with DATE_FORMATS in frontend/src/utils/dateFormats.js
const ALLOWED_DATE_FORMATS = ["MM/dd/yyyy", "dd.MM.yyyy", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "yyyy.MM.dd"];

export const updateSettings = async (req, res) => {
  try {
    const { themeMode, language, typeCustom, ratingSystem, colorFolderIcons, dateFormat } = req.body;

    if (Array.isArray(typeCustom) && typeCustom.some((t) => typeof t === "string" && t.length > 100)) {
      return res.status(400).json({ title: "Tag error", message: "tag name must be at most 100 characters" });
    }

    // Rating system: empty (default scale) or 2..100 blocks.
    let normalizedRatingSystem = ratingSystem;
    if (Array.isArray(ratingSystem) && ratingSystem.length > 0) {
      if (ratingSystem.length < 2 || ratingSystem.length > 100) {
        return res.status(400).json({ title: "Rating system error", message: "rating system must have between 2 and 100 levels" });
      }
      if (ratingSystem.some((b) => !b || typeof b.name !== "string" || !b.name.trim())) {
        return res.status(400).json({ title: "Rating system error", message: "each level must have a name" });
      }
      if (ratingSystem.some((b) => typeof b.abbr === "string" && b.abbr.length > 2)) {
        return res.status(400).json({ title: "Rating system error", message: "abbreviation must be at most 2 characters" });
      }
      normalizedRatingSystem = ratingSystem.map((b) => ({
        name: b.name.trim(),
        abbr: (b.abbr || "").trim(),
        color: typeof b.color === "string" ? b.color : "",
      }));
    }

    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      {
        themeMode,
        language,
        typeCustom,
        ratingSystem: normalizedRatingSystem,
        // Only valid values are applied; anything else leaves the field untouched.
        colorFolderIcons: typeof colorFolderIcons === "boolean" ? colorFolderIcons : undefined,
        dateFormat: ALLOWED_DATE_FORMATS.includes(dateFormat) ? dateFormat : undefined,
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
        ratingSystem: user.ratingSystem,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Settings error", message: "failed to update settings" });
  }
};
