import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_URL_MONGO,
});

instance.interceptors.request.use((config) => {
  config.headers.Authorization = window.localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);

  return config;
});

// Notify the app after any folder/saved-item change so it refreshes the saved index (see App.js).
// An event instead of a store import avoids a circular import.
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
