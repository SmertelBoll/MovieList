// Статуси папок. Значення мають збігатися з FOLDER_STATUSES у backend/models/folder.js —
// саме їх приймає PATCH /folders/status/:name.

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';

export const FOLDER_STATUSES = {
    PLANNED: 'planned',
    WATCHING: 'watching',
    WATCHED: 'watched',
    DROPPED: 'dropped',
};

// Значок статусу в куті постера (сторінка New releases, Timeline).
// Годинник у двох станах: заповнений — дивиться зараз, контурний — заплановано.
// Той самий символ, але візуально розрізнювані.
export const STATUS_CORNER_ICON = {
    [FOLDER_STATUSES.WATCHED]: CheckIcon,
    [FOLDER_STATUSES.WATCHING]: AccessTimeFilledIcon,
    [FOLDER_STATUSES.DROPPED]: CloseIcon,
    [FOLDER_STATUSES.PLANNED]: AccessTimeIcon,
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

// Приглушуємо постер лише того, що вже позаду: переглянуте й кинуте.
// Те, що дивляться зараз або заплановане, лишається яскравим.
// Однаково на сторінці New releases і в Timeline.
export const DIMMED_POSTER_SX = {
    filter: 'grayscale(0.6)',
    opacity: 0.65,
};
export const isDimmedStatus = (status) =>
    status === FOLDER_STATUSES.WATCHED || status === FOLDER_STATUSES.DROPPED;

// Порядок блоків у підказці зі списком папок; null — папки без статусу
export const STATUS_DISPLAY_ORDER = [
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.WATCHING,
    FOLDER_STATUSES.PLANNED,
    FOLDER_STATUSES.DROPPED,
    null,
];

// Найсильніший статус серед списку — той самий порядок, що betterStatus на бекенді
// (models/folder.js): кинуте > дивлюсь > заплановано > переглянуто. Без статусів — null.
const STATUS_PRIORITY = [
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.WATCHING,
    FOLDER_STATUSES.PLANNED,
    FOLDER_STATUSES.WATCHED,
];
export const getBestStatus = (statuses) => {
    const known = statuses.filter(Boolean);
    if (known.length === 0) return null;
    return known.reduce((best, status) => (
        STATUS_PRIORITY.indexOf(status) < STATUS_PRIORITY.indexOf(best) ? status : best
    ));
};
