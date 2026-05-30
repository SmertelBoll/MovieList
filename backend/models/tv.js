import mongoose from "mongoose";

// Серія (епізод) — власні поля оцінки/коментаря/дат
const EpisodeSchema = new mongoose.Schema(
    {
        episode: { type: Number, required: true },
        rating: { type: Number },
        comment: { type: String },
        dateAdded: { type: Date },
    },
    {
        timestamps: true, // createdAt / updatedAt (updatedAt = дата редагування)
    }
);

// Сезон — власні поля + масив серій
const SeasonSchema = new mongoose.Schema(
    {
        season: { type: Number, required: true },
        rating: { type: Number },
        comment: { type: String },
        dateAdded: { type: Date },
        episodes: { type: [EpisodeSchema], default: [] },
    },
    {
        timestamps: true, // createdAt / updatedAt (updatedAt = дата редагування)
    }
);

const TvSchema = new mongoose.Schema(
    {
        tmdbId: { type: Number, required: true },
        tmdbTitle: { type: String, required: true },

        // Поля для всього серіалу
        dateAdded: { type: Date },
        rating: { type: Number },
        comment: { type: String },

        // Вкладені сезони (не створюються автоматично при додаванні в папку)
        seasons: { type: [SeasonSchema], default: [] },

        customType: { type: String },
        user: {
            type: mongoose.Schema.Types.ObjectId, // бо це користувач
            ref: "User", // з UserController
            required: true,
        },
    },
    {
        timestamps: true, // Додає поля createdAt та updatedAt
    }
);

export default mongoose.model("Tv", TvSchema);
