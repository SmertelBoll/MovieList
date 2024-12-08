import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    text: {
      type: String, // тип поля
      required: true, // поле обов'язкове
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      require: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, // бо це користучав
      ref: "User",
      required: true,
    },
  },
  {
    // при створенні чи оновленні зберігаємо час
    timestamps: true,
  }
);

export default mongoose.model("Comment", CommentSchema);
