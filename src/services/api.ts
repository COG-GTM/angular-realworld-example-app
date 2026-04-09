import axios, { AxiosError } from "axios";
import { getToken, destroyToken } from "./jwt.service";

// Event-based auth purge for 401 handling
// The AuthProvider listens for this event to update React state
export const AUTH_PURGE_EVENT = "auth:purge";

function emitAuthPurge() {
  window.dispatchEvent(new Event(AUTH_PURGE_EVENT));
}

const API_BASE_URL = "https://api.realworld.show/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Token attachment interceptor
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      // Global 401 handling for all endpoints EXCEPT /user
      if (status === 401 && !error.config?.url?.endsWith("/user")) {
        destroyToken();
        emitAuthPurge();
      }

      // Normalize error format
      const body =
        data && typeof data === "object" && "errors" in data
          ? data
          : {
              errors: {
                network: [
                  "Unable to connect. Please check your internet connection.",
                ],
              },
            };

      return Promise.reject({ ...body, status });
    }

    return Promise.reject({
      errors: {
        network: [
          "Unable to connect. Please check your internet connection.",
        ],
      },
      status: 0,
    });
  },
);

export default api;
