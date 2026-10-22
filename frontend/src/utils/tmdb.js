// Franchise name from a TMDB collection name. The name comes in the request language and its suffix is
// localized too ("X Collection", "X | Колекція", ...), so known suffix forms are stripped.
export const cleanCollectionName = (name) => {
    if (!name) return '';
    return name
        .replace(/\s*\|\s*[^|]*$/, '')
        .replace(/\s*collection\s*$/i, '')
        .trim();
};
