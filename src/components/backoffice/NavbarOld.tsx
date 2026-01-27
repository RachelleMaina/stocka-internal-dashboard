"use client";

import {
  LogOut,
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import { useTheme } from "next-themes";
import { useAppState } from "@/lib/context/AppState";

export default function BackofficeNavbar() {
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    dispatch,
    backoffice_user_profile,
    business_profile,
    active_store_profile,
  } = useAppState();
  const [theme, setTheme] = useState("light");
  const pathname = usePathname();

  useEffect(() => {
    // Initialize theme from localStorage or default to light
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleSidebar = () => {
    dispatch({
      type: "BACKOFFICE_SIDEBAR_TOGGLE",
      show_backoffice_sidebar: true,
    });
  };

  const onLogout = () => {
    router.push("/logout");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !event.target.closest(".dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isDropdownOpen]);

 
  return (
    <>
      <div className="sticky top-0 z-10">
        {process.env.NEXT_PUBLIC_ENV === "staging" && (
          <div className="w-full bg-yellow-400 text-neutral-900 text-xs px-2 py-1.5 flex items-center justify-between font-medium z-50">
            <div className="flex items-center gap-2">
              <span className="">
                ⚠️This is a demo account. Data is cleared regularly. Reach out
                on WhatsApp at{" "}
                <a
                  href="https://wa.me/254780979817"
                  className="underline font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +254 780 979 817
                </a>{" "}
                to get your account created.
              </span>
            </div>
          </div>
        )}

        <nav className="flex items-center justify-between w-full border-b px-3 py-1.5 border-neutral-100 dark:border-neutral-600 bg-white dark:bg-neutral-800">
          <div className="flex items-center gap-2">
            {/* {active_store_profile?.logo ? (
              <img
                src={`data:image/png;base64,${active_store_profile.logo}`}
                alt="Store Logo"
                className="w-8 h-8 rounded object-cover border border-neutral-200 dark:border-neutral-600"
              />
            ) : // <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-100">
            //   {active_store_profile?.store_location_name?.substring(0, 2).toUpperCase() || "ST"}
            // </div>
            null} */}
 <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded bg-neutral-100 dark:bg-neutral-700"
            >
              <Menu className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
            </button>
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-[140px]">
              {backoffice_user_profile?.display_name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle theme */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700  px-3 py-2 rounded text-sm font-medium  transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-neutral-900 dark:text-neutral-300">
                Logout
              </span>
            </button>
          </div>
        </nav>
      </div>
     
    </>
  );
}
