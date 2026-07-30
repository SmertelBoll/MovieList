// Статуси папок. Значення мають збігатися з FOLDER_STATUSES у backend/models/folder.js —
// саме їх приймає PATCH /folders/status/:name.

export const FOLDER_STATUSES = {
    PLANNED: 'planned',
    WATCHING: 'watching',
    WATCHED: 'watched',
    DROPPED: 'dropped',
};

// Порядок тут визначає порядок пунктів у меню
export const FOLDER_STATUS_OPTIONS = [
    { value: FOLDER_STATUSES.PLANNED, label: 'Planned' },
    { value: FOLDER_STATUSES.WATCHING, label: 'Watching' },
    { value: FOLDER_STATUSES.WATCHED, label: 'Watched' },
    { value: FOLDER_STATUSES.DROPPED, label: 'Dropped' },
];

// Підпис для папки без статусу (створеної вручну)
export const NO_STATUS_LABEL = 'No status';

const BY_VALUE = FOLDER_STATUS_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option;
    return acc;
}, {});

export const getStatusLabel = (status) => BY_VALUE[status]?.label || NO_STATUS_LABEL;

// Значення кольорів лежать у theme/palette.js (група `status`) —
// тут лише посилання на токени теми.
const STATUS_COLOR_TOKENS = {
    [FOLDER_STATUSES.PLANNED]: 'status.planned',
    [FOLDER_STATUSES.WATCHING]: 'status.watching',
    [FOLDER_STATUSES.WATCHED]: 'status.watched',
    [FOLDER_STATUSES.DROPPED]: 'status.dropped',
};

// Токен кольору теми для статусу; null — якщо статусу немає
export const getStatusColorToken = (status) => STATUS_COLOR_TOKENS[status] || null;

// sx для Chip зі статусом. Без статусу — нейтральний контурний вигляд.
export const getStatusChipSx = (status) => {
    const token = STATUS_COLOR_TOKENS[status];
    if (!token) {
        return {
            bgcolor: 'transparent',
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
        };
    }
    return {
        bgcolor: token,
        color: 'text.dark',
        border: 'none',
        fontWeight: 600,
    };
};
