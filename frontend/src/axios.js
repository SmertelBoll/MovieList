import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_URL_MONGO,
});

// При кожному запросі вшивати токен
instance.interceptors.request.use((config) => {
  config.headers.Authorization = window.localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);

  return config;
});

// Після будь-якої зміни папок чи збережених елементів повідомляємо застосунок,
// щоб він оновив індекс збережених (див. App.js). Подія, а не імпорт store —
// інакше axios і слайси імпортували б одне одного по колу.
export const SAVED_CHANGED_EVENT = "movielist:saved-changed";
const MUTATING = new Set(["post", "patch", "put", "delete"]);
const SAVED_PATHS = /^\/(movie|tv|folders)(\/|$)/;

instance.interceptors.response.use((response) => {
  const { method, url } = response.config;
  if (MUTATING.has((method || "").toLowerCase()) && SAVED_PATHS.test(url || "")) {
    window.dispatchEvent(new Event(SAVED_CHANGED_EVENT));
  }
  return response;
});

export default instance;
