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
                movieId: { type: Number, required: true },
                dateAdded: { type: Date },
                rating: { type: Number },
                comment: { type: String }
            }
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
