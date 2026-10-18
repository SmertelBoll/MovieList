// Теги фільму / серіалу (поле customType в моделях Movie і Tv) — масив рядків.

const MAX_TAG_LENGTH = 100;

// Масив з клієнта -> чистий масив унікальних тегів (без порожніх, надто довгих і дублікатів).
// Не масив (undefined, null, рядок) — це порожній список.
export const normalizeTags = (value) => {
  if (!Array.isArray(value)) return [];
  const clean = value
    .filter((tag) => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag && tag.length <= MAX_TAG_LENGTH);
  return [...new Set(clean)];
};
