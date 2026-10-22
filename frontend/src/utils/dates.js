// Watch dates are calendar days, not moments in time. A full timestamp would show the same record as
// different days depending on timezone, so only the day is stored (UTC midnight).

import { format } from 'date-fns';
import store from '../redux/store';

// The format picked in the profile, read from the store at call time, so every place showing a date uses the
// current format without props.
const getDateFormat = () => store.getState().config.dateFormat;

const localParts = (date) => ({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
});

// ISO or "YYYY-MM-DD" -> Date at local midnight of that day. New-format records (UTC midnight) and plain days
// keep the calendar day; old records with a time use the local date of that moment.
export const parseDateOnly = (value) => {
    if (!value) return null;
    const raw = String(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        const fallback = new Date(raw);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    }

    const asCalendarDay = () => new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    if (!raw.includes('T') || /T00:00:00(\.000)?Z$/.test(raw)) return asCalendarDay();

    const instant = new Date(raw);
    if (Number.isNaN(instant.getTime())) return asCalendarDay();
    const { year, month, day } = localParts(instant);
    return new Date(year, month, day);
};

// Date -> "YYYY-MM-DDT00:00:00.000Z": store exactly the chosen calendar day.
export const toDateOnlyISO = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : parseDateOnly(value);
    if (!date || Number.isNaN(date.getTime())) return null;
    const { year, month, day } = localParts(date);
    return new Date(Date.UTC(year, month, day)).toISOString();
};

// For display, in the profile format (default MM/dd/yyyy); goes through parseDateOnly so old records display
// correctly.
export const formatDateOnly = (value) => {
    const date = parseDateOnly(value);
    if (!date) return '';
    return format(date, getDateFormat());
};
