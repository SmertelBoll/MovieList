import mongoose from "mongoose";

const FolderElementSchema = new mongoose.Schema(
    {
        name: {
            type: String, // Назва папки
            required: true, // Обов'язкове поле
        },
        movieId: {
            type: mongoose.Schema.Types.ObjectId, // id фільмів
            ref: "Movie",
        },
        dateAdded: {
            type: Date, // Дата додавання
        },
        rating: {
            type: Number, // Оцінка
        },
        comment: {
            type: String, // Коментар
        },
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

export default mongoose.model("FolderElement", FolderElementSchema);
