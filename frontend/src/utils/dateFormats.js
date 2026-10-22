// Date formats selectable in the profile (date-fns). Import-free file: ConfigSlice imports it and dates.js imports the
// store, so sharing would create a cycle.
// Keep in sync with ALLOWED_DATE_FORMATS in backend/controllers/userControllers.js.

export const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

export const DATE_FORMATS = [
  "MM/dd/yyyy",
  "dd.MM.yyyy",
  "dd/MM/yyyy",
  "dd-MM-yyyy",
  "yyyy-MM-dd",
  "yyyy.MM.dd",
];

export const isDateFormat = (value) => DATE_FORMATS.includes(value);
