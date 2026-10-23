import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
      type: String,
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
    // Site-wide date format (date-fns string); the allowed list is in userControllers.js.
    dateFormat: {
      type: String,
      default: "yyyy-MM-dd",
    },
    colorFolderIcons: {
      type: Boolean,
      default: false,
    },
    typeCustom: {
      type: [String],
      default: [],
    },
    // Custom rating system: { name, abbr } blocks from highest (index 0) to lowest. Empty = default 100-point
    // scale.
    ratingSystem: {
      type: Array,
      default: [],
    },
    // Movie franchises (TMDB collections) hidden from Updates. mode "forever" hides for good, "new-part" until a part
    // is released after mutedAt (a yyyy-MM-dd calendar day).
    mutedCollections: {
      type: [
        {
          _id: false,
          collectionId: { type: Number, required: true },
          mode: { type: String, enum: ["forever", "new-part"], required: true },
          mutedAt: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
