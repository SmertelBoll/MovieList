// TMDB image URLs in one place. size: w92 | w185 | w342 | w500 | w780 | original.
const BASE_URL = process.env.REACT_APP_TMDB_IMG

export const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

// null when there is no image path
export const tmdbImage = (path, size = 'w185') => (path ? `${BASE_URL}/${size}${path}` : null)

export const tmdbImageOrDefault = (path, size = 'w185') => tmdbImage(path, size) || IMAGE_DEFAULT
