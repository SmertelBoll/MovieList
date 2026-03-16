import mongoose from "mongoose";

const TvSchema = new mongoose.Schema(
    {
        tmdbId: { type: Number, required: true },
        tmdbTitle: { type: String, required: true },

        level: {
            type: String,
            enum: ["tv", "season", "episode"],
            required: true
        },
        dateAdded: { type: Date },
        rating: { type: Number },
        comment: { type: String },
        season: { type: Number },
        episode: { type: Number },

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

export default mongoose.model("Tv", TvSchema);
