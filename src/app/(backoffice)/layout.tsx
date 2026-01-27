"use client";

import BackofficeNavbar from "@/components/backoffice/Navbar";
import Sidebar from "@/components/backoffice/Sidebar";
import { ReactNode, useEffect } from "react";

export default function BackofficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  // useEffect(() => {
  //   const html = document.documentElement;
  //   const storedTheme = localStorage.getItem("theme");
  //   const prefersDark = window.matchMedia(
  //     "(prefers-color-scheme: dark)"
  //   ).matches;
  //   const isDark = storedTheme === "dark" || (!storedTheme && prefersDark);

  //   html.classList.toggle("dark", isDark);
  // }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = html.classList.contains("dark") ? "light" : "dark";
    html.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
   window.location.reload();
  };

  return (
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
  );
}
