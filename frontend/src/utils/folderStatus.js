// Folder statuses. Values must match FOLDER_STATUSES in backend/models/folder.js: PATCH /folders/status/:name
// accepts them.

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import SkipNextIcon from '@mui/icons-material/SkipNext';

export const FOLDER_STATUSES = {
    PLANNED: 'planned',
    WATCHING: 'watching',
    WATCHED: 'watched',
    DROPPED: 'dropped',
    SKIPPED: 'skipped',
};

// Status badge in a poster corner (New releases, Timeline). A clock in two states: filled = watching,
// outlined = planned (same symbol, visually distinct).
export const STATUS_CORNER_ICON = {
    [FOLDER_STATUSES.WATCHED]: CheckIcon,
    [FOLDER_STATUSES.WATCHING]: AccessTimeFilledIcon,
    [FOLDER_STATUSES.DROPPED]: CloseIcon,
    [FOLDER_STATUSES.SKIPPED]: SkipNextIcon,
    [FOLDER_STATUSES.PLANNED]: AccessTimeIcon,
};

export const FOLDER_STATUS_OPTIONS = [
    { value: FOLDER_STATUSES.PLANNED, label: 'Planned' },
    { value: FOLDER_STATUSES.WATCHING, label: 'Watching' },
    { value: FOLDER_STATUSES.WATCHED, label: 'Watched' },
    { value: FOLDER_STATUSES.DROPPED, label: 'Dropped' },
    { value: FOLDER_STATUSES.SKIPPED, label: 'Skipped' },
];

export const NO_STATUS_LABEL = 'No status';

const BY_VALUE = FOLDER_STATUS_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option;
    return acc;
}, {});

export const getStatusLabel = (status) => BY_VALUE[status]?.label || NO_STATUS_LABEL;

const STATUS_COLOR_TOKENS = {
    [FOLDER_STATUSES.PLANNED]: 'status.planned',
    [FOLDER_STATUSES.WATCHING]: 'status.watching',
    [FOLDER_STATUSES.WATCHED]: 'status.watched',
    [FOLDER_STATUSES.DROPPED]: 'status.dropped',
    [FOLDER_STATUSES.SKIPPED]: 'status.skipped',
};

export const getStatusColorToken = (status) => STATUS_COLOR_TOKENS[status] || null;

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

// Dim the poster only of what's already behind: watched, dropped and skipped. What's being watched or planned
// stays bright. Same on New releases and in Timeline.
export const DIMMED_POSTER_SX = {
    filter: 'grayscale(0.6)',
    opacity: 0.65,
};
export const isDimmedStatus = (status) =>
    status === FOLDER_STATUSES.WATCHED || status === FOLDER_STATUSES.DROPPED || status === FOLDER_STATUSES.SKIPPED;

export const STATUS_DISPLAY_ORDER = [
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.WATCHING,
    FOLDER_STATUSES.PLANNED,
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.SKIPPED,
    null,
];

// Strongest status in a list: same order as betterStatus on the backend (models/folder.js): dropped >
// watching > planned > watched > skipped. No statuses -> null.
const STATUS_PRIORITY = [
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.WATCHING,
    FOLDER_STATUSES.PLANNED,
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.SKIPPED,
];
export const getBestStatus = (statuses) => {
    const known = statuses.filter(Boolean);
    if (known.length === 0) return null;
    return known.reduce((best, status) => (
        STATUS_PRIORITY.indexOf(status) < STATUS_PRIORITY.indexOf(best) ? status : best
    ));
};
