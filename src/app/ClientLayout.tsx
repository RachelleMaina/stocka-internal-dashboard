"use client";

import { AppStateProvider } from "@/lib/context/AppState";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import "react-loading-skeleton/dist/skeleton.css";
import "react-phone-number-input/style.css";
import "./globals.css";
import { SyncProvider } from "@/lib/context/SyncContext";

export const toastOptions = {
  className:
    "px-3 py-2 rounded-md text-sm font-medium shadow-md flex items-center gap-2",
  duration: 4000,
  style: {
    padding: "8px 12px",
    borderRadius: "0.375rem", // Tailwind rounded-md
  },
  success: {
    style: {
      backgroundColor: "rgb(220 252 231)", // green-100 light
      color: "rgb(22 101 52)", // green-800
    },
    iconTheme: {
      primary: "rgb(34 197 94)", // green-500
      secondary: "white",
    },
  },
  error: {
    style: {
      backgroundColor: "rgb(254 226 226)", // red-100 light
      color: "rgb(153 27 27)", // red-800
    },
    iconTheme: {
      primary: "rgb(239 68 68)", // red-500
      secondary: "white",
    },
  },
  loading: {
    style: {
      backgroundColor: "rgb(219 234 254)", // blue-100 light
      color: "rgb(30 64 175)", // blue-800
    },
    iconTheme: {
      primary: "rgb(59 130 246)", // blue-500
      secondary: "white",
    },
  },
};

export default function ClientLayout({ children }: any) {
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
    baseURL = process.env.NEXT_PUBLIC_API_URL_DEV;
  }
  
 useEffect(() => {
   if ("serviceWorker" in navigator && "SyncManager" in window) {
       const baseUrl = baseURL || "http://localhost:5001";
    navigator.serviceWorker
     .register(`/sw.js?baseUrl=${encodeURIComponent(baseUrl)}`)
      .then((reg) => {
        console.log("[SW] Registered successfully");

        const registerSync = () => {
          reg.sync.register("SYNC_SALES").then(() => {
            console.log("[SW] Background sync registered");
          }).catch((err) => {
            console.error("[SW] Failed to register background sync", err);
          });
        };

        if (navigator.serviceWorker.controller) {
          registerSync();
        } else {
          navigator.serviceWorker.addEventListener("controllerchange", registerSync);
        }
      })
      .catch((err) => {
        console.error("[SW] Registration failed", err);
      });
  }
}, []);


  return (
    <AppStateProvider>
      <SyncProvider>
      <Toaster
        position="top-center"
        // toastOptions={toastOptions}
      />

        {children}
        </SyncProvider>
    </AppStateProvider>
  );
}
