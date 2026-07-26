// Логіка власної системи оцінок користувача.
// Рівні зберігаються як [{ name, abbr }] від найвищого (індекс 0) до найнижчого.
// Значення рівня: value(i) = round((N - i) * 100 / N), тож верх = 100.

// Приводимо рівень до { name, abbr, color } (підтримуємо і старий формат — простий рядок)
const normalizeLevel = (lvl) =>
    typeof lvl === 'string'
        ? { name: lvl, abbr: '', color: '' }
        : { name: lvl?.name || '', abbr: lvl?.abbr || '', color: lvl?.color || '' };

// Контрастний колір тексту (чорний/білий) для заданого фону hex
export const getContrastText = (hex) => {
    if (!hex || hex.length < 7) return '#000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#000' : '#fff';
};

export const hasRatingSystem = (ratingSystem) => Array.isArray(ratingSystem) && ratingSystem.length >= 2;

// Рівні з обчисленим значенням
export const getRatingLevels = (ratingSystem) => {
    if (!hasRatingSystem(ratingSystem)) return [];
    const n = ratingSystem.length;
    return ratingSystem.map((lvl, i) => {
        const norm = normalizeLevel(lvl);
        return { ...norm, value: Math.round(((n - i) * 100) / n) };
    });
};

// Знаходимо рівень, що відповідає конкретній оцінці (0-100)
export const findRatingLevel = (rating, ratingSystem) => {
    if (rating == null) return null;
    return getRatingLevels(ratingSystem).find((l) => l.value === rating) || null;
};

// Колір рівня, що відповідає оцінці (null — якщо немає збігу або колір не заданий)
export const getRatingLevelColor = (rating, ratingSystem) => {
    const lvl = findRatingLevel(rating, ratingSystem);
    return lvl && lvl.color ? lvl.color : null;
};

// 2-літерне скорочення для сітки TV: задане abbr або перші 2 букви назви рівня.
// null — якщо оцінка не збігається з жодним рівнем (тоді показуємо число).
export const getRatingAbbr = (rating, ratingSystem) => {
    const lvl = findRatingLevel(rating, ratingSystem);
    if (!lvl) return null;
    return lvl.abbr || lvl.name.slice(0, 2).toUpperCase();
};

// Текст для картки: назва рівня, якщо збігається, інакше "rating/100" (null — якщо оцінки немає)
export const formatRatingLabel = (rating, ratingSystem) => {
    if (rating == null) return null;
    const lvl = findRatingLevel(rating, ratingSystem);
    return lvl ? lvl.name : `${rating}/100`;
};
