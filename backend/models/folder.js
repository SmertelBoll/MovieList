import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
    {
        name: {
            type: String, // Назва папки
            required: true, // Обов'язкове поле
        },
        order: {
            type: Number,
            required: true
        },
        folderElements: [
            {
                type: mongoose.Schema.Types.ObjectId, // бо це користучав
                ref: "Movie", // з UserController
            },
        ],
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

export default mongoose.model("Folder", FolderSchema);
