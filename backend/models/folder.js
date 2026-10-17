import mongoose from "mongoose";

// Статуси перегляду. Значення — короткі машинні ключі, назви папок
// для показу лежать окремо в DEFAULT_FOLDERS нижче.
export const FOLDER_STATUSES = {
    PLANNED: "planned",
    WATCHING: "watching",
    WATCHED: "watched",
    DROPPED: "dropped",
};

export const FOLDER_STATUS_VALUES = Object.values(FOLDER_STATUSES);

// Якщо елемент лежить одразу в кількох папках зі статусами — перемагає найвищий
// за пріоритетом: кинуте > дивлюсь > заплановано > переглянуто.
// Тримати синхронно з STATUS_PRIORITY у frontend/src/utils/folderStatus.js.
const STATUS_PRIORITY = [
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.WATCHING,
    FOLDER_STATUSES.PLANNED,
    FOLDER_STATUSES.WATCHED,
];

export const betterStatus = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    return STATUS_PRIORITY.indexOf(a) <= STATUS_PRIORITY.indexOf(b) ? a : b;
};

// Папки, які створюються автоматично при реєстрації.
export const DEFAULT_FOLDERS = [
    { name: "Planned", status: FOLDER_STATUSES.PLANNED, order: 0 },
    { name: "Watching", status: FOLDER_STATUSES.WATCHING, order: 1 },
    { name: "Watched", status: FOLDER_STATUSES.WATCHED, order: 2 },
    { name: "Dropped", status: FOLDER_STATUSES.DROPPED, order: 3 },
];

const FolderSchema = new mongoose.Schema(
    {
        name: {
            type: String, // Назва папки
            required: true, // Обов'язкове поле
        },
        // Статус перегляду. У папок, створених користувачем вручну, його немає —
        // тому null дозволений і стоїть за замовчуванням.
        status: {
            type: String,
            enum: [...FOLDER_STATUS_VALUES, null],
            default: null,
        },
        order: {
            type: Number,
            required: true
        },
        image: {
            type: String, // URL картинки папки (Cloudinary). Якщо немає — показуємо стандартну іконку
            default: "",
        },
        imagePublicId: {
            type: String, // public_id у Cloudinary — потрібен, щоб видаляти файл із хмари
            default: "",
        },
        folderElements: [
            {
                itemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    refPath: "folderElements.itemModel"
                },
                itemModel: {
                    type: String,
                    required: true,
                    enum: ["Movie", "Tv"]
                }
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
