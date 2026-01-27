'use client';

import axios, { AxiosInstance, AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { logoutBackofficeUser } from "../utils/auth";
import { routes } from "@/constants/routes";

const env = process.env.NEXT_PUBLIC_ENV;

let baseURL: string | undefined;

switch (env) {
  case "production":
    baseURL = process.env.NEXT_PUBLIC_API_URL_PROD;
    break;
  case "staging":
    baseURL = process.env.NEXT_PUBLIC_API_URL_STAGING;
    break;
  case "development":
  default:
    baseURL = "/api/v1";
}



export const api: AxiosInstance = axios.create({
  withCredentials: true,
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },

});

// lib/api.ts
api.interceptors.request.use((config) => {
  config.withCredentials = true;  // ← Force it every time
  return config;
});
// Global error handler for 401 (session expired)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Avoid redirect loop during logout or on public routes
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const currentPath = window.location.pathname;

    // Skip if it's a POS route or already on login
    if (
      error.response?.status === 401 &&
      !currentPath.startsWith("/pos") &&
      !currentPath.startsWith(routes.backofficeLogin)
    ) {
      toast.error("Session expired. Please log in again.");
      logoutBackofficeUser();
      window.location.href = routes.backofficeLogin;
    }

    return Promise.reject(error);
  }
);

export function clearSession() {
  logoutBackofficeUser();

  if (typeof window !== "undefined") {
    window.location.href = routes.backofficeLogin;
  }
}