"use client";

import BackofficeNavbar from "@/components/backoffice/NavbarOld";
import { AppStateProvider } from "@/lib/context/AppState";
import { Toaster } from "react-hot-toast";
import "react-loading-skeleton/dist/skeleton.css";
import "react-phone-number-input/style.css";
import "./globals.css";

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



  return (
    <AppStateProvider>
   
      <Toaster
        position="top-center"
        // toastOptions={toastOptions}
      />
<div className="h-screen flex bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
  
      {/* <Sidebar toggleTheme={toggleTheme} /> */}
      <main
        className="flex-1 overflow-y-auto"
      >
        <BackofficeNavbar />
        <div  className="max-w-screen-7xl mx-auto" >
       {children}
       </div>
      </main>
    </div>
    
    </AppStateProvider>
  );
}
