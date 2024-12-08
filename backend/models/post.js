import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String, // тип поля
      required: true, // поле обов'язкове
    },
    text: {
      type: String,
      required: true,
    },
    tags: {
      type: Array,
      default: [],
    },
    image: {
      type: String,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, // бо це користучав
      ref: "User", // з UserController
      required: true,
    },
  },
  {
    // при створенні чи оновленні зберігаємо час
    timestamps: true,
  }
);

export default mongoose.model("Post", PostSchema);
