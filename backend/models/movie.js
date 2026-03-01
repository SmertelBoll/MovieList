import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema(
    {
        movieId: { type: Number, required: true },
        movieTitle: { type: String, required: true },
        dateAdded: { type: Date },
        rating: { type: Number },
        comment: { type: String },
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
