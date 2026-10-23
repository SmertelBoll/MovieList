import axios from 'axios'

// The one TMDB client. A plain axios instance on purpose: the app's `instance` adds the user's auth token to every
// request, which must never go to a third-party host.
const client = axios.create({
    baseURL: process.env.REACT_APP_URL_TMDB,
    params: { api_key: process.env.REACT_APP_TMDB_API_KEY },
})

// Identical requests within CACHE_MS share one response (back navigation, the same title on several rows). TMDB data
// changes slowly; saved-item data never goes through here.
const CACHE_MS = 5 * 60 * 1000
const cache = new Map()

// GET /path with params ({ language, ... }); resolves to the response body.
export const tmdbGet = (path, params = {}) => {
    const key = `${path}?${JSON.stringify(params)}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.time < CACHE_MS) return hit.promise
    const promise = client.get(path, { params }).then((res) => res.data)
    cache.set(key, { time: Date.now(), promise })
    // A failed request must not stay cached
    promise.catch(() => cache.delete(key))
    return promise
}
