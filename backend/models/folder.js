import mongoose from "mongoose";

// Machine keys for view statuses; display names live in DEFAULT_FOLDERS below.
export const FOLDER_STATUSES = {
    PLANNED: "planned",
    WATCHING: "watching",
    WATCHED: "watched",
    DROPPED: "dropped",
    SKIPPED: "skipped",
};

export const FOLDER_STATUS_VALUES = Object.values(FOLDER_STATUSES);

// Highest priority wins when an item sits in several status folders: dropped > watching > planned > watched > skipped.
// Keep in sync with STATUS_PRIORITY in frontend/src/utils/folderStatus.js.
const STATUS_PRIORITY = [
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.WATCHING,
    FOLDER_STATUSES.PLANNED,
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.SKIPPED,
];

export const betterStatus = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    return STATUS_PRIORITY.indexOf(a) <= STATUS_PRIORITY.indexOf(b) ? a : b;
};

// Folders created on registration. Sorted by order descending, so the largest is on top: Watched, Watching,
// Planned, Dropped, Skipped.
export const DEFAULT_FOLDERS = [
    { name: "Watched", status: FOLDER_STATUSES.WATCHED, order: 4 },
    { name: "Watching", status: FOLDER_STATUSES.WATCHING, order: 3 },
    { name: "Planned", status: FOLDER_STATUSES.PLANNED, order: 2 },
    { name: "Dropped", status: FOLDER_STATUSES.DROPPED, order: 1 },
    { name: "Skipped", status: FOLDER_STATUSES.SKIPPED, order: 0 },
];

const FolderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        // Status is null for folders the user created manually.
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
            type: String,
            default: "",
        },
        imagePublicId: {
            type: String, // Cloudinary public_id, needed to delete the file.
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Folder", FolderSchema);
