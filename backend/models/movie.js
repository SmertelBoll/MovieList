import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema(
    {
        tmdbId: { type: Number, required: true },
        tmdbTitle: { type: String, required: true },
        // Language tmdbTitle was saved in ("en", "uk", ...). Older docs have none and count as English.
        language: { type: String, default: "en" },
        dateAdded: { type: Date },
        rating: { type: Number },
        comment: { type: String },
        // Tags: the field is still named customType but holds an array of strings.
        customType: { type: [String], default: [] },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Movie", MovieSchema);
