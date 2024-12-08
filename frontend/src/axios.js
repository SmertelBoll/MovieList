import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:4444", //https://my-article.onrender.com    http://localhost:4444
});

// При кожному запросі вшивати токен
instance.interceptors.request.use((config) => {
  config.headers.Authorization = window.localStorage.getItem("MovieList-token");

  return config;
});

export default instance;