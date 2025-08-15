import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:4444", //https://movielist-8qi5.onrender.com    http://localhost:4444
});

// При кожному запросі вшивати токен
instance.interceptors.request.use((config) => {
  config.headers.Authorization = window.localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);

  return config;
});

export default instance;
