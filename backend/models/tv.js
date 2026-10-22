import mongoose from "mongoose";

const EpisodeSchema = new mongoose.Schema(
    {
        episode: { type: Number, required: true },
        rating: { type: Number },
        comment: { type: String },
        dateAdded: { type: Date },
        watchedCount: { type: Number, default: 0 },
        // Skipped on purpose: not watched (watchedCount 0) but not "new"; shown with a cross.
        skipped: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const SeasonSchema = new mongoose.Schema(
    {
        season: { type: Number, required: true },
        rating: { type: Number },
        comment: { type: String },
        dateAdded: { type: Date },
        episodes: { type: [EpisodeSchema], default: [] },
    },
    {
        timestamps: true,
    }
);

const TvSchema = new mongoose.Schema(
    {
        tmdbId: { type: Number, required: true },
        tmdbTitle: { type: String, required: true },
        // Language tmdbTitle was saved in ("en", "uk", ...). Older docs have none and count as English.
        language: { type: String, default: "en" },

        dateAdded: { type: Date },
        rating: { type: Number },
        comment: { type: String },

        // Nested seasons (not created automatically when adding to a folder).
        seasons: { type: [SeasonSchema], default: [] },

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

export default mongoose.model("Tv", TvSchema);
