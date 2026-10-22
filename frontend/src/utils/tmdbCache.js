// Кеш відповідей TMDB для сторінки Updates (localStorage, на цьому пристрої).
//
// Кешуємо ЛИШЕ дані TMDB: склад сезонів серіалу, зв'язок «фільм -> колекція», склад колекції. Те, що змінює користувач
// (що позначено переглянутим, папки, оцінки), сюди не потрапляє — воно щоразу приходить із бекенда свіжим.
//
// Запис: { t: час отримання, d: дані }. Він віддається одразу, навіть якщо прострочений; чи пора оновлювати,
// вирішує isFresh(). Завершені серіали (Ended / Canceled) змінюються рідко — їх тримаємо довго, а ті, що виходять,
// недовго, щоб нова серія з'явилась у списку.

const STORAGE_KEY = "MovieList-tmdb-cache-v1";
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const TTL = {
  tvEnded: 30 * DAY,
  tvAiring: 6 * HOUR,
  movie: 30 * DAY, // до якої колекції належить фільм — не змінюється
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
      // Сховище переповнене або недоступне (приватний режим): кеш просто не збережеться на диск,
      // у пам'яті він працює до перезавантаження сторінки
    }
  }, 500);
}

// kind: "tv" | "movie" | "collection"; lang — код мови TMDB або "all" для даних, які від мови не залежать
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
