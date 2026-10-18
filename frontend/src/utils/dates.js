/**
 * Дати перегляду — це календарні дні, а не моменти часу.
 *
 * Якщо зберігати повний timestamp, той самий запис показується різними днями
 * залежно від часового поясу: сира дата з ISO дає один день, а локальний
 * рендер — інший. Наприклад збережене 3 серпня в UTC+3 лягало в базу як
 * 2026-08-02T21:00:00Z, і тултіп показував 02.08, а поле вибору дати — 03.08.
 *
 * Рішення: усі дати проходять через parseDateOnly, тож інтерпретація одна
 * на весь застосунок, а в базу пишемо опівніч UTC.
 */

import { format } from 'date-fns';
import store from '../redux/store';

// Формат, який користувач вибрав у профілі. Читаємо зі store в момент виклику,
// тож усі місця, що показують дату, беруть актуальний формат без жодних пропсів.
const getDateFormat = () => store.getState().config.dateFormat;

// Момент -> локальні рік/місяць/день (те, що бачив користувач)
const localParts = (date) => ({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
});

/**
 * ISO або "YYYY-MM-DD" -> Date на локальну опівніч потрібного дня.
 *
 * Записи в новому форматі (опівніч UTC) і чисті "YYYY-MM-DD" читаємо як
 * календарний день без перетворень. Старі записи з довільним часом — це
 * моменти, тож беремо їхню ЛОКАЛЬНУ дату: саме її користувач бачив у полі
 * вибору, коли зберігав.
 */
export const parseDateOnly = (value) => {
    if (!value) return null;
    const raw = String(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        const fallback = new Date(raw);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    }

    const asCalendarDay = () => new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    // Без часу або рівно опівніч UTC — календарний день як є
    if (!raw.includes('T') || /T00:00:00(\.000)?Z$/.test(raw)) return asCalendarDay();

    // Старий запис із часом — беремо локальну дату цього моменту
    const instant = new Date(raw);
    if (Number.isNaN(instant.getTime())) return asCalendarDay();
    const { year, month, day } = localParts(instant);
    return new Date(year, month, day);
};

/** Date -> "YYYY-MM-DDT00:00:00.000Z". Зберігаємо саме обраний календарний день. */
export const toDateOnlyISO = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : parseDateOnly(value);
    if (!date || Number.isNaN(date.getTime())) return null;
    const { year, month, day } = localParts(date);
    return new Date(Date.UTC(year, month, day)).toISOString();
};

/**
 * Для показу: у форматі з профілю (за замовчуванням MM/dd/yyyy). Іде через parseDateOnly,
 * щоб старі записи відображались тим самим днем і в тултіпі, і в полі вибору дати.
 * Приймає і дати TMDB ("YYYY-MM-DD"), і ISO-рядки з бази.
 */
export const formatDateOnly = (value) => {
    const date = parseDateOnly(value);
    if (!date) return '';
    return format(date, getDateFormat());
};
