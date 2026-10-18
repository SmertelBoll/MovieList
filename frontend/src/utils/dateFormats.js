// Формати дат, які користувач може вибрати в профілі (рядки date-fns).
// Окремий файл без імпортів: ConfigSlice імпортує його, а dates.js імпортує store —
// спільним модулем вони утворили б цикл.
//
// Тримати синхронно з ALLOWED_DATE_FORMATS у backend/controllers/userControllers.js.

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
