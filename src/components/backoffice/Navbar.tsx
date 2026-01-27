'use client';

import { routes } from "@/constants/routes";
import { useAppState } from "@/lib/context/AppState";
import {  getCurrentUser } from "@/lib/utils/auth";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun, LogOut, User, Plus } from "lucide-react"; // Only for theme/profile icons

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch, theme } = useAppState(); // Assuming you have theme in context

  const backoffice_user_profile = getCurrentUser();


  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: "SET_THEME", theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'light');
  };

  const menuItems = [
    { label: "Items", href: routes.items },
    { label: "Settings", href: routes.settings },
    // { label: "Dashboard", href: routes.backoffice },
    // { label: "Sales", href: routes.sales2 },
    // { label: "Inventory", href: routes.inventory },
    // { label: "Production", href: routes.production },
    // { label: "People", href: routes.people },
    // { label: "Reports", href: routes.reports },
    // { label: "Etims", href: routes.etims, external: true },
    // { label: "POS", href: routes.posLogin, external: true },
  ];

  const logoUrl = null;

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
      <div className="max-w-screen-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
  
<div className="flex items-center gap-4">
  {/* Optional Logo */}
  {logoUrl ? (
    <img
      src={logoUrl} // ← Use your dynamic logo URL or path
      alt="Outlet Logo"
      className="h-8 w-auto object-contain"
      onError={(e) => {
        // Fallback if image fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  ) : (
    <div className="h-9 w-9 rounded border-1 border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
      <Plus size={16} className="text-neutral-500 dark:text-neutral-400" />
    </div>
  )}

  <div className="flex flex-col">
    <span className="font-medium text-neutral-900 dark:text-white">
      {backoffice_user_profile?.outlet?.name}
    </span>
    <span className="text-xs text-neutral-500 dark:text-neutral-400">
      Powered by Stocka
    </span>
  </div>
</div>
<div className="flex items-center gap-4">
          {/* Menu Items */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => {
              const isActive = pathname?.includes(item.href);
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.external) {
                      window.location.href = item.href;
                    } else {
                      router.push(item.href);
                    }
                  }}
                  className={clsx(
                    "text-base font-medium tracking-wide transition-all duration-300",
                    isActive
                      ? "text-primary  font-medium"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Profile Avatar + Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setOpenProfile(!openProfile)}
              className="flex items-center gap-3 focus:outline-none"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {getInitials(backoffice_user_profile?.profile?.name || "U")}
              </div>

              {/* Name (optional) */}
              <span className="hidden md:block text-sm font-medium text-neutral-900 dark:text-white">
                {backoffice_user_profile?.profile?.name?.split(" ")[0]}
              </span>
            </button>

            {/* Dropdown */}
            {openProfile && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-2 z-50">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                <button
                  onClick={() => {
                    // Your logout logic here
                    router.push(routes.logout);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Simple initials helper
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);