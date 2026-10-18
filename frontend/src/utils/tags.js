// Теги фільму / серіалу (поле customType) — масив рядків. Не масив (ще не завантажено) — порожній список.
export const getTags = (value) =>
    Array.isArray(value) ? [...new Set(value.filter((tag) => typeof tag === 'string' && tag.trim()))] : [];
