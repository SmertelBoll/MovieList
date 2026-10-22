import { CONTRAST_DARK, CONTRAST_LIGHT } from '../theme/palette';

// Custom rating system logic. Levels are stored as [{ name, abbr }] from highest (index 0) to lowest;
// value(i) = round((N - i) * 100 / N), so the top = 100.

// Normalize a level to { name, abbr, color } (the old format, a plain string, is still supported)
const normalizeLevel = (lvl) =>
    typeof lvl === 'string'
        ? { name: lvl, abbr: '', color: '' }
        : { name: lvl?.name || '', abbr: lvl?.abbr || '', color: lvl?.color || '' };

export const getContrastText = (hex) => {
    if (!hex || hex.length < 7) return CONTRAST_DARK;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? CONTRAST_DARK : CONTRAST_LIGHT;
};

export const hasRatingSystem = (ratingSystem) => Array.isArray(ratingSystem) && ratingSystem.length >= 2;

export const getRatingLevels = (ratingSystem) => {
    if (!hasRatingSystem(ratingSystem)) return [];
    const n = ratingSystem.length;
    return ratingSystem.map((lvl, i) => {
        const norm = normalizeLevel(lvl);
        return { ...norm, value: Math.round(((n - i) * 100) / n) };
    });
};

export const findRatingLevel = (rating, ratingSystem) => {
    if (rating == null) return null;
    return getRatingLevels(ratingSystem).find((l) => l.value === rating) || null;
};

export const getRatingLevelColor = (rating, ratingSystem) => {
    const lvl = findRatingLevel(rating, ratingSystem);
    return lvl && lvl.color ? lvl.color : null;
};

// 2-letter abbreviation for the TV grid: the set abbr or the first 2 letters of the level name. null if no
// level matches (the number is shown then).
export const getRatingAbbr = (rating, ratingSystem) => {
    const lvl = findRatingLevel(rating, ratingSystem);
    if (!lvl) return null;
    return lvl.abbr || lvl.name.slice(0, 2).toUpperCase();
};

export const formatRatingLabel = (rating, ratingSystem) => {
    if (rating == null) return null;
    const lvl = findRatingLevel(rating, ratingSystem);
    return lvl ? lvl.name : `${rating}/100`;
};
