import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { getActiveLocation, getCurrentBusiness, getCurrentBusinessLocation, getCurrentUser } from "@/lib/utils/auth";
import clsx from "clsx";
import {
  BarChart,
  ChevronsDown,
  CookingPot,
  Copy,
  CopyCheck,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Lock,
  Package,
  PanelLeftClose,
  Settings,
  Star,
  Unplug,
  UsersRound,
  X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Permission } from "../common/Permission";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    trial: {},
    subscription: {},
  });
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  const ref = useRef<HTMLDivElement>(null);

  const {
    dispatch,

    show_backoffice_sidebar,
  } = useAppState();
  const router = useRouter();
  const pathname = usePathname();
      const  backoffice_user_profile = getCurrentUser();
              const business_profile = getCurrentBusiness();
  const backoffice_business_location = getCurrentBusinessLocation();
  const active_store_profile = getActiveLocation()
  
  const topLevelStores = business_profile?.filter(
    (store) => !store.parent_store_location_id
  );

  // useEffect(() => {
  //   const getSubscription = async () => {
  //     setLoading(true)
  //   try {
  //       const res = await api.get(
  //         `/api/subscription/${backoffice_user_profile?.business_location_id}/check-status`
  //       );
  //       setSubscriptionStatus(res?.data?.data?.data);
  //       const data = res.data?.data?.data;
  //       const isActive =
  //         (data?.trial?.daysRemaining != null &&
  //           Number(data.trial.daysRemaining) > 0) ||
  //         (data?.subscription?.daysRemaining != null &&
  //           Number(data.subscription.daysRemaining) > 0);
  //       setIsExpired(!isActive);
  //     } catch (error: any) {
  //       console.log(error)
  //     } finally {
  //       setLoading(false)
  //     }
  //   };
  //   getSubscription();
   
  // }, [backoffice_user_profile?.business_location_id, pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    dispatch({
      type: "BACKOFFICE_SIDEBAR_TOGGLE",
      show_backoffice_sidebar: false,
    });
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sidebarItems = [
     {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "dashboard",
      onClick: () => {
        router.push(routes.backoffice);
        handleClose();
      },
    },
    {
      label: "Items",
      icon: Package,
      href: "items",
      onClick: () => {
        router.push(routes.items);
        handleClose();
      },
    },
       {
      label: "Sales",
      icon: Package,
      href: "sales",
      onClick: () => {
        router.push(routes.sales2);
        handleClose();
      },
    },
    {
      label: "Inventory",
      icon: FileText,
      href: "inventory",
      onClick: () => {
        router.push(routes.inventory);
        handleClose();
      },
    },
      {
      label: "Production",
      icon: CookingPot,
      href: "production",
      onClick: () => {
        router.push(routes.production);
        handleClose();
      },
    },
   
    {
      label: "People",
      icon: UsersRound,
      href: "people",
      onClick: () => {
        router.push(routes.people);
        handleClose();
      },
    },
  
     {
      label: "Reports",
      icon: BarChart,
      href: "reports",
      onClick: () => {
        router.push(routes.reports);
        handleClose();
      },
    },
    {
      label: "Settings",
      icon: Settings,
      href: "settings",
      onClick: () => {
        router.push(routes.settings);
        handleClose();
      },
    },
      {
      label: "Etims",
      icon: Unplug,
      href: "etims",
      onClick: () => {
window.location.replace(routes.etims);
        handleClose();
      },
    },
    {
      label: "Pos",
      icon: ExternalLink,
      href: "pos",
      onClick: () => {
window.location.replace(routes.posLogin);
        handleClose();
      },
    },
  ];

  return (
    <>
      {/* Overlay on mobile */}
      {show_backoffice_sidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed md:static top-0 left-0 z-30 h-full text-sm border-r border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex flex-col justify-between transition-all duration-300 ease-in-out",
          show_backoffice_sidebar ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          expanded ? "w-44" : "w-16"
        )}
      >
        <div>
          <div className="px-2 py-2.5 flex flex-col">
            <div className="flex items-center gap-3 md:justify-start justify-between">
              <div className="flex flex-col w-full ml-2">
                {expanded ? (
                  <div className="flex flex-col">
                    <h1 className="text-black dark:text-neutral-100 font-bold">
                      {backoffice_business_location?.business_location_name}
                    </h1>
                  </div>
                ) : (
                  <h1 className="text-[13px] font-bold text-black dark:text-neutral-100">
                    {getInitials(
                      backoffice_business_location?.business_location_name
                    )}
                  </h1>
                )}
              </div>
              <div className="hidden md:flex">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-white"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              <div className="md:hidden flex justify-end">
                <button onClick={handleClose}>
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>
            </div>
            {expanded && (
              <div className="ml-2">
                {backoffice_business_location?.device_key && (
                  <div className="flex gap-1  items-center text-[11px]">
                    <p className="font-bold text-neutral-700 dark:text-neutral-100 text-left">
                      {backoffice_business_location?.device_key || "-"}
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(backoffice_business_location?.device_key)
                      }
                      className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                      aria-label="Copy Key"
                    >
                      {copiedKey ===
                      backoffice_business_location?.device_key ? (
                        <CopyCheck className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-neutral-200 dark:border-neutral-600 mt-1 pt-2 ">
              <div className="relative" ref={ref}>
                <button
                  onClick={() => setOpen(!open)}
                  className="w-full flex items-center justify-between text-[13px] text-neutral-800 dark:text-neutral-200 px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                  aria-label="Select store"
                >
                  <span className="truncate font-medium">
                    {active_store_profile?.store_location_name ||
                      "Select store"}
                  </span>
                  <div className="ml-2 shrink-0 bg-primary rounded p-1 flex items-center justify-center">
                    <ChevronsDown className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>

                {open && (
                  <div className="absolute z-50 mt-1 w-full text-[13px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded shadow max-h-60 overflow-auto">
                    {topLevelStores.map((store) => (
                      <button
                        key={store.store_location_id}
                        onClick={() => {
                          setOpen(false);
                          dispatch({
                            type: "SET_ACTIVE_STORE_PROFILE",
                            store_profile: store,
                          });
                          localStorage.setItem(
                            "active_store_profile",
                            JSON.stringify(store)
                          );
                          router.refresh();
                        }}
                        className={clsx(
                          "w-full text-left px-3 py-2",
                          active_store_profile?.store_location_id ===
                            store.store_location_id
                            ? "bg-neutral-100 dark:bg-neutral-700 text-primary font-semibold"
                            : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                        )}
                      >
                        {store.store_location_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              return (
                <>
                  <button
                    onClick={item.onClick}
                    className={clsx(
                      "flex items-center gap-2 pl-3 py-1.5 font-semibold text-[13px] transition-all duration-200",
                      pathname?.includes(item.href)
                        ? "bg-primary/10 dark:bg-primary text-black dark:text-neutral-100 border-r-3 border-primary"
                        : "text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                    aria-current={
                      pathname?.includes(item.href) ? "page" : undefined
                    }
                  >
                    <item.icon
                      className={clsx(
                        "w-4 h-4",
                        pathname?.includes(item.href)
                          ? "text-black dark:text-neutral-50"
                          : "text-black dark:text-neutral-50"
                      )}
                    />
                    {expanded && <span>{item.label}</span>}
                  </button>
                </>
              );
            })}
          </nav>
        </div>
        {(process.env.NEXT_PUBLIC_ENV !== "staging" || !loading) && (
          <div className="flex flex-col">
            {/* Subscription Details */}
            {expanded ? (
              subscriptionStatus?.onboarding_status === "started" ? (
                <div className="px-3 mb-2 text-left group relative cursor-pointer">
                  <div className="bg-primary/10 dark:bg-primary/70 border border-primary dark:border-primary rounded-lg py-2 px-4 transition-shadow duration-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-semibold text-primary dark:text-neutral-50">
                        Setup in Progress
                      </span>
                      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-200 leading-snug">
                        All features available.
                      </span>
                    </div>
                  </div>
                </div>
              ) : subscriptionStatus?.onboarding_status === "cancelled" ? (
                <div className="px-3 mb-2 text-left group relative cursor-pointer">
                  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg py-2 px-4 transition-shadow duration-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-semibold text-red-700 dark:text-neutral-50">
                        Setup Cancelled
                      </span>
                      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-200 leading-snug">
                        Access restricted
                      </span>
                    </div>
                  </div>
                </div>
              ) : subscriptionStatus?.subscription?.status === "active" ? (
                <div
                  onClick={() => router.push(routes.subscriptions)}
                  className="px-3 mb-2 text-left group relative cursor-pointer"
                >
                  <div className="bg-gradient-to-b from-primary/10 to-white dark:from-primary dark:to-primary rounded-lg py-2 px-4 transition-shadow duration-200">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-primary dark:text-neutral-50 leading-tight">
                        {subscriptionStatus.subscription.daysRemaining}
                        <span className="text-sm font-medium ml-1 text-neutral-700 dark:text-neutral-50">
                          /{subscriptionStatus.subscription.totalDays} Days
                        </span>
                      </span>

                      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-200 leading-snug">
                        {subscriptionStatus.subscription.planName === "Basic"
                          ? "Basic Plan - Up to 50 products"
                          : subscriptionStatus.subscription.planName ===
                            "Standard"
                          ? "Standard Plan - Up to 200 products, custom branding"
                          : "Premium Plan - Up to 500 products, full features"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => router.push(routes.subscriptions)}
                  className="px-3 mb-2 text-left group relative cursor-pointer"
                >
                  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg py-2 px-4 transition-shadow duration-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-200 leading-snug">
                        Setup complete, but no plan is active.
                      </span>
                      <button
                        className="mt-1 w-fit text-[13px] font-medium text-white bg-primary rounded px-2 py-1 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(routes.subscriptions);
                        }}
                      >
                        Choose Plan
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <button
                onClick={() => router.push(routes.subscriptions)}
                className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-r from-primary/10 to-primary/10 dark:from-primary dark:to-primary hover:from-primary/10 dark:hover:from-primary dark:hover:to-primary transition-colors duration-200"
                aria-label="Subscription Status"
              >
                {subscriptionStatus?.subscription?.status === "active" ? (
                  <Star className="w-4 h-4 text-primary dark:text-primary/10" />
                ) : (
                  <Lock className="w-4 h-4 text-primary dark:text-primary/10" />
                )}
              </button>
            )}

            {/* Version Info */}
            <div className="border-t py-2 border-neutral-200 dark:border-neutral-600 flex flex-col items-center pb-3">
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500 w-full pl-4">
                Stocka v1.0.0
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
