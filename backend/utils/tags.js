// Tags of a movie/tv (the customType field) are an array of strings.

const MAX_TAG_LENGTH = 100;

// Client array -> clean unique tags (no empty, too long or duplicates); a non-array means no tags.
export const normalizeTags = (value) => {
  if (!Array.isArray(value)) return [];
  const clean = value
    .filter((tag) => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag && tag.length <= MAX_TAG_LENGTH);
  return [...new Set(clean)];
};
