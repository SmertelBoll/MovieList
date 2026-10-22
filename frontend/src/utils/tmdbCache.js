// TMDB response cache for the Updates page (localStorage, per device). Caches ONLY TMDB data; user data always comes
// fresh from the backend.
// Entries are returned even if expired; isFresh() decides on refresh. Ended/Canceled series are kept long, airing ones
// briefly.

const STORAGE_KEY = "MovieList-tmdb-cache-v1";
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const TTL = {
  tvEnded: 30 * DAY,
  tvAiring: 6 * HOUR,
  movie: 30 * DAY,
  collection: 12 * HOUR,
};

let store = null;
let saveTimer = null;

function load() {
  if (store) return store;
  try {
    store = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    store = {};
  }
  return store;
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Storage full or unavailable (private mode): the cache just isn't persisted, it still works in memory
      // until reload
    }
  }, 500);
}

// kind: "tv" | "movie" | "collection"; lang: TMDB language code, or "all" for language-independent data
export function cacheGet(kind, lang, id) {
  return load()[lang]?.[kind]?.[id] || null;
}

export function cacheSet(kind, lang, id, data) {
  const s = load();
  if (!s[lang]) s[lang] = {};
  if (!s[lang][kind]) s[lang][kind] = {};
  s[lang][kind][id] = { t: Date.now(), d: data };
  scheduleSave();
}

export function isFresh(kind, entry) {
  if (!entry) return false;
  let ttl = TTL[kind];
  if (kind === "tv") ttl = entry.d?.status === "Ended" || entry.d?.status === "Canceled" ? TTL.tvEnded : TTL.tvAiring;
  return Date.now() - entry.t < ttl;
}
