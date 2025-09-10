import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:44375/",
  headers: {
    accept: "*/*",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Giriş isteği için token ekleme
  if (config.url.includes("/api/login/login")) {
    return config; // Token eklenmez
  }
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/#/login";
    }
    return Promise.reject(error);
  },
);

export default api;
