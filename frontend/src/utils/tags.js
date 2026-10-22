export const getTags = (value) =>
    Array.isArray(value) ? [...new Set(value.filter((tag) => typeof tag === 'string' && tag.trim()))] : [];
