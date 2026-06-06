import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String, // тип поля
      required: true, // поле обов'язкове
    },
    email: {
      type: String,
      required: true,
      unique: true, // повинно бути унікальним
    },
    passwordHash: {
      type: String,
      required: true,
    },
    accessLevel: {
      type: String,
      default: "ordinary",
    },
    avatar: {
      type: String,
    },
    avatarPublicId: {
      type: String, // public_id у Cloudinary — щоб видаляти стару аватарку
      default: "",
    },
    themeMode: {
      type: String,
      default: "light",
    },
    language: {
      type: String,
      default: "en",
    },
    typeCustom: {
      type: [String],
      default: [],
    }
  },
  {
    // при створенні чи оновленні зберігаємо час
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
