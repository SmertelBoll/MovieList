import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema(
    {
        adult: {
            type: Boolean,
            required: true,
        },
        backdrop_path: {
            type: String,
        },
        genre_ids: {
            type: [Number],
        },
        tmdb_id: {
            type: Number,
            required: true,
            unique: true,
        },
        original_language: {
            type: String,
            required: true,
        },
        original_title: {
            type: String,
            required: true,
        },
        overview: {
            type: String,
        },
        popularity: {
            type: Number,
        },
        poster_path: {
            type: String,
        },
        release_date: {
            type: Date,
        },
        title: {
            type: String,
            required: true,
        },
        video: {
            type: Boolean,
            required: true,
        },
        vote_average: {
            type: Number,
        },
        vote_count: {
            type: Number,
        },
    },
    {
        timestamps: true, // Додає поля createdAt та updatedAt
    }
);

export default mongoose.model("Movie", MovieSchema);
