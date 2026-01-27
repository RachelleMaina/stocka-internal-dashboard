// Navbar.tsx
import { routes } from "@/constants/routes";
import { useAppState } from "@/lib/context/AppState";
import { useSyncContext } from "@/lib/context/SyncContext";
import { pullSync } from "@/lib/services/syncServices";
import { logoutPosUser } from "@/lib/utils/auth";
import { Loader, LogOut, Menu, Moon, RefreshCw, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar({ show_mobile_sidebar = false }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const [theme, setTheme] = useState("light");
  const [time, setTime] = useState(new Date());
  const { dispatch, pos_user_profile, pos_device_profile } = useAppState();
  const [loading, setLoading] = useState(false);

  const { syncStatus } = useSyncContext();
  const router = useRouter();

  useEffect(() => {
    // 1. Theme Initialization
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    // 2. Live Time Update
    const interval = setInterval(() => setTime(new Date()), 1000);

    // 3. Service Worker Message Listener
    const swMessageHandler = (event: MessageEvent) => {
      if (event.data?.type === "NEW_VERSION_AVAILABLE") {
        setUpdateAvailable(true);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", swMessageHandler);
    }

    // 4. Cleanup
    return () => {
      clearInterval(interval);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          swMessageHandler
        );
      }
    };
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage("USER_CONFIRMED_UPDATE");
    }
    window.location.reload();
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleSidebar = () => {
    dispatch({ type: "POS_SIDEBAR_TOGGLE", show_pos_sidebar: true });
  };

  const logout = () => {
      router.push(routes.posLogout);
  };

  const refresh = async () => {
    setLoading(true);
    const { business_location_id, active_store_location_id } =
      pos_device_profile;
    await pullSync(business_location_id, active_store_location_id);
    setLoading(false);
    window.location.reload(true);
  };

  const date = time.toLocaleDateString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timeString = time.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
  <div className="sticky top-0 z-10">
  {/* Update Banner - Fixed width */}
  {updateAvailable && (
    <div className="w-full bg-yellow-400 text-neutral-900 text-sm px-3 py-1 flex items-center justify-between font-medium z-50 overflow-hidden">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="truncate">🚀 New update available.</span>
        <span className="hidden sm:inline">
          Please refresh to get the latest features.
        </span>
      </div>
      <button
        onClick={handleUpdate}
        className="flex items-center bg-neutral-900 text-white text-xs px-2.5 py-1 gap-1 rounded hover:bg-neutral-800 transition whitespace-nowrap flex-shrink-0"
      >
        <RefreshCw className="h-3 w-3" /> 
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  )}

  {/* Main Navbar - Fixed width & mobile optimizations */}
  <div className="flex items-center justify-between w-full border-b px-3 py-3 md:py-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 overflow-hidden">
    {/* 1. LEFT: Sidebar toggle & user name */}
    <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[50%]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 rounded bg-neutral-100 dark:bg-neutral-700 flex-shrink-0"
      >
        <Menu className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
      </button>

      {/* Desktop sidebar toggle */}
      {show_mobile_sidebar && (
        <button
          onClick={toggleSidebar}
          className="hidden md:block p-2 rounded bg-neutral-100 dark:bg-neutral-700 flex-shrink-0"
        >
          <Menu className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
        </button>
      )}
      
      {/* User name - Truncate on mobile */}
      <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-[120px] md:max-w-[140px] flex-shrink-0">
        {pos_user_profile?.display_name}
      </div>
    </div>

    {/* 2. CENTER: Time (optional) - Better mobile handling */}
    <div className="hidden sm:flex flex-col items-center text-xs text-neutral-500 dark:text-neutral-400 leading-tight flex-shrink-0">
      <span className="font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-[180px]">
        {date}, {timeString}
      </span>
    </div>

    {/* 3. RIGHT: Status + Actions - Fixed width on mobile */}
    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
      {/* Sales syncing status - Fixed width */}
      <div className="px-2 py-1 w-16 md:w-20 flex-shrink-0">
        {syncStatus === "started" && (
          <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-medium truncate max-w-full cursor-default select-none">
            <Loader className="w-3 h-3 animate-spin flex-shrink-0" />
            <span className="hidden sm:inline">Syncing…</span>
            <span className="sm:hidden">Sync</span>
          </div>
        )}
      </div>
      
      {/* Toggle theme */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 flex-shrink-0"
        title="Toggle Theme"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-yellow-500" />
        ) : (
          <Moon className="w-4 h-4 text-neutral-700" />
        )}
      </button>

      {/* Manual refresh */}
      <button
        onClick={refresh}
        disabled={loading}
        className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 flex-shrink-0"
        title="Refresh"
      >
        {loading ? (
          <RefreshCw className="animate-spin w-4 h-4 text-neutral-900 dark:text-neutral-300" />
        ) : (
          <RefreshCw className="w-4 h-4 text-neutral-900 dark:text-neutral-300" />
        )}
      </button>

      {/* Logout - Compact on mobile */}
      <button
        onClick={logout}
        className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 px-2.5 py-2 rounded text-xs md:text-sm font-medium transition flex-shrink-0"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline text-neutral-900 dark:text-neutral-300">
          Logout
        </span>
      </button>
    </div>
  </div>
</div>
  );
}
