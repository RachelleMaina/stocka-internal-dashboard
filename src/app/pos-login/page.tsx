"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { routes } from "@/constants/routes";
import { useAppState } from "@/lib/context/AppState";
import { posLogin } from "@/lib/services/authServices";
import { pullSync } from "@/lib/services/syncServices";
import clsx from "clsx";
import { Power, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

// Auto-logout after 5 minutes
const INACTIVITY_TIMEOUT = 300000;
let inactivityTimer: NodeJS.Timeout | null = null;

const resetInactivityTimer = (dispatch: any, router: any) => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    dispatch({ type: "BACKOFFICE_LOGOUT" });
    localStorage.removeItem("pos_user_profile");
    toast.success("Logged out due to inactivity");
    router.push("/pos/login");
  }, INACTIVITY_TIMEOUT);
};

const setupActivityListeners = (dispatch: any, router: any) => {
  const resetTimer = () => resetInactivityTimer(dispatch, router);
  window.addEventListener("mousemove", resetTimer);
  window.addEventListener("keypress", resetTimer);
  window.addEventListener("click", resetTimer);
  window.addEventListener("touchstart", resetTimer);

  return () => {
    window.removeEventListener("mousemove", resetTimer);
    window.removeEventListener("keypress", resetTimer);
    window.removeEventListener("click", resetTimer);
    window.removeEventListener("touchstart", resetTimer);
  };
};

const PosLogin = () => {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetPosOpen, setIsResetPosOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { dispatch, pos_device_profile } = useAppState();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) setPin((prev) => prev + digit);
  };

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handleClearAll = () => setPin("");

  const handleSubmit = async () => {
    if (pin.length !== 4) return;

    setIsSubmitting(true);

    try {
      const result = await posLogin(pin);

      if (!result.success) {
        toast.error(result.message || "Failed to login");
        setPin("");
        return;
      }

      dispatch({ type: "POS_LOGIN", pos_user_profile: result.data });
      localStorage.setItem("pos_user_profile", JSON.stringify(result.data));

      resetInactivityTimer(dispatch, router);
      setupActivityListeners(dispatch, router);

  
      router.push(routes.sell);
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4 && !isSubmitting) {
      handleSubmit();
    }
  }, [pin]);

  async function handleResetPos() {
    const POS_DB_NAME = "stocka_indexed_db";
    const POS_DEVICE_PROFILE_KEY = "pos_device_profile";
    const POS_HELD_TICKETS_KEY = "heldTickets";
    const POS_USER_PROFILE_KEY = "pos_user_profile";
    try {
      // 1. Remove specific localStorage keys
      localStorage.removeItem(POS_DEVICE_PROFILE_KEY);
      localStorage.removeItem(POS_HELD_TICKETS_KEY);
      localStorage.removeItem(POS_USER_PROFILE_KEY);

      // 2. Delete the IndexedDB database
      indexedDB.deleteDatabase(POS_DB_NAME);

      // 3. Unregister all service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 4. Reload page after a short delay
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    } catch (error) {
      console.error("Error resetting POS:", error);
    }
  }

  const refresh = async () => {
    setLoading(true)
    const { business_location_id, active_store_location_id } = pos_device_profile
    
    await pullSync(business_location_id, active_store_location_id);
  setLoading(false)
   
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
    <div className="flex h-screen justify-center items-center bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="flex flex-col gap-3 w-full justify-center items-center">
        
           {/* Logo */}
                <div className="flex justify-center my-1">
                  {/* Light mode logo */}
                  <div className="relative h-8 w-40 dark:hidden">
                    <Image
                      src="/icons/stocka-high-resolution-logo-grayscale-transparent.png"
                      alt="Stocka Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  {/* Dark mode logo */}
                  <div className="relative h-8 w-40 hidden dark:block">
                    <Image
                      src="/icons/stocka-high-resolution-logo-transparent.png"
                      alt="Stocka Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
      <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-800  px-3 rounded-md shadow-md w-full max-w-sm">
        {/* Main Content */}
        <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-800 py-2 w-full rounded-md">
          <div className="w-full flex flex-col items-center mb-4">
            <div className="w-full px-3 mb-2 flex justify-between items-center">
              <div className="flex flex-col text-xs">
                <span className="font-medium text-neutral-800 dark:text-neutral-100">
                  {date}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {timeString}
                </span>
              </div>

              <div className="flex gap-2 items-center">
                <button
                    onClick={refresh}
                    disabled={loading}
                  className="bg-neutral-200 dark:bg-neutral-700 font-bold p-2 rounded transition"
                  >
                    {loading ?
                      <RefreshCw className="animate-spin w-6 h-6 text-neutral-800 dark:text-neutral-300" />
                      : <RefreshCw className=" w-6 h-6 text-neutral-800 dark:text-neutral-300" />
                    }
                  </button>

                {/* Reset button */}
                <button
                  onClick={() => setIsResetPosOpen(true)}
                  className="bg-neutral-200 dark:bg-neutral-700 font-bold  p-2 rounded transition"
                >
                  <Power className="w-6 h-6 text-red-600 " />
                </button>
              </div>
            </div>
            <div className="border-b w-full border-neutral-300 dark:border-neutral-600"></div>
            <div className="flex gap-2 mt-2 items-center">
              {/* <img
                src={logoUrl}
                alt="Tenant Logo"
                className="h-10 object-contain rounded"
              /> */}

              <div className="font-medium">
                {pos_device_profile?.business_location?.location_name}
              </div>
            </div>
          </div>

          {/* PIN Circles */}
          <div className="flex gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  pin[i]
                    ? "bg-neutral-800 border-neutral-800 dark:bg-neutral-300 dark:border-neutral-300"
                    : "border-neutral-600"
                )}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 pb-3">
            {[..."123456789"].map((num) => (
              <button
                key={num}
                className="bg-neutral-200 dark:bg-neutral-700 font-bold text-neutral-800 dark:text-white text-lg py-3 px-5 rounded shadow"
                onClick={() => handleDigit(num)}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClearAll}
              className="bg-neutral-200 dark:bg-neutral-700 font-bold text-neutral-800 dark:text-white  p-4 rounded shadow"
            >
              Clear
            </button>
            <button
              onClick={() => handleDigit("0")}
              className="bg-neutral-200 dark:bg-neutral-700 font-bold text-neutral-800 dark:text-white text-lg p-4 rounded shadow"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="bg-neutral-200 dark:bg-neutral-700 font-bold text-neutral-800 dark:text-white text-lg p-4 rounded shadow"
            >
              ⌫
            </button>
          </div>
        </div>

     
        </div>
           {/* Footer */}
        {/* <div className="text-xs text-neutral-500  dark:text-neutral-400 text-center mb-3">
          <div>Stocka POS v1.0.0</div>
       </div> */}
      {isResetPosOpen && (
        <ConfirmDialog
          title="Reset POS"
          message={
            <>
              This will remove all data, restoring POS to factory settings. Are
              you sure you want to reset?
            </>
          }
          confirmLabel="Reset"
          cancelLabel="Cancel"
          destructive
          onConfirm={handleResetPos}
          onCancel={() => setIsResetPosOpen(false)}
        />
      )}
      </div>
      </div> 
  );
};

export default PosLogin;
