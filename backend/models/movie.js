import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema(
    {
        tmdbId: { type: Number, required: true },
        tmdbTitle: { type: String, required: true },
        // Мова, якою було збережено tmdbTitle (короткий код: "en", "uk", ...).
        // Старі документи її не мають — вважаємо їх англійськими.
        language: { type: String, default: "en" },
        dateAdded: { type: Date },
        rating: { type: Number },
        comment: { type: String },
        customType: { type: String },
        user: {
            type: mongoose.Schema.Types.ObjectId, // бо це користучав
            ref: "User", // з UserController
            required: true,
        },
    },
    {
        timestamps: true, // Додає поля createdAt та updatedAt
    }
);

export default mongoose.model("Movie", MovieSchema);
