import { routes } from "@/constants/routes";
import { useAppState } from "@/lib/context/AppState";
import clsx from "clsx";
import {
  ExternalLink,
  LineChart,
  ListChecks,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Users2,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Permission } from "../common/Permission";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export default function Sidebar({ show_mobile_sidebar = false }) {
  const [expanded, setExpanded] = useState(true);
  const {
    dispatch,
    pos_device_profile,
    backoffice_user_profile,
    show_pos_sidebar,
  } = useAppState();
  const router = useRouter();
  const pathname = usePathname();

  const handleClose = () => {
    dispatch({ type: "POS_SIDEBAR_TOGGLE", show_pos_sidebar: false });
  };

  const sidebarItems = [
    {
      label: "Sell",
      icon: ShoppingBag,
      href: "/sell",
      resource: "pos_sell",
      action: "sell",
      onClick: () => {
        router.push(routes.sell);
        handleClose();
      },
    },
    {
      label: "Bills",
      icon: ReceiptText,
      href: "/bills",
      resource: "pos_bills",
      action: "read",
      onClick: () => {
        router.push(routes.posBills);
        handleClose();
      },
    },
    {
      label: "Items",
      icon: Package,
      href: "/items",
      resource: "pos_items",
      action: "read",
      onClick: () => {
        router.push(routes.saleItems);
        handleClose();
      },
    },
    {
      label: "Sales",
      icon: LineChart,
      href: "/report",
      resource: "pos_sales",
      action: "read",
      onClick: () => {
        router.push(routes.posSales);
        handleClose();
      },
    },
   
     {
      label: "Customers",
      icon: Users2,
      href: "/customers",
      resource: "pos_customers",
      action: "read",
      onClick: () => {
        router.push(routes.posCustomers);
        handleClose();
      },
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/Settings",
      resource: "pos_settings_page",
      action: "read",
      onClick: () => {
        router.push(routes.posSettings);
        handleClose();
      },
    },
    {
      label: "Backoffice",
      icon: ExternalLink,
      href: "/backoffice",
      resource: "pos_backoffice_link",
      action: "link",
      onClick: () => {
    window.location.replace(routes.backoffice);

        handleClose();
      },
    },
  ];

  return (
    <>
      {/* Overlay on mobile */}
      {show_pos_sidebar && (
        <div
          className={clsx(
            "fixed inset-0 z-30 bg-black/40",
            !show_mobile_sidebar && "md:hidden"
          )}
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed top-0 left-0 z-40 h-full border-r border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex flex-col justify-between transition-all duration-300 ease-in-out",

          // Mobile: slide in/out
          show_pos_sidebar ? "translate-x-0" : "-translate-x-full",

          // Only apply md: classes if not forcing mobile view
          !show_mobile_sidebar && "md:static md:translate-x-0",

          // Width based on expanded
          expanded ? "w-52" : "w-20"
        )}
      >
        <div className="">
          <div className="border-b border-neutral-200 dark:border-neutral-600 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-4 pl-0 md:pl-3 justify-between md:justify-start">
              {/* <div className="hidden md:flex">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-black dark:text-neutral-300  dark:hover:text-white"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div> */}
              <div
                className="flex items-center font-medium gap-3 text-sm  text-black dark:text-white whitespace-nowrap overflow-hidden transition-opacity duration-300"
                title={pos_device_profile?.business_location?.location_name}
              >
                <span className="line-clamp-1 truncate">
                  {" "}
                  {expanded
                    ? pos_device_profile?.business_location?.location_name
                    : null}
                </span>
              </div>
              <div className="md:hidden flex justify-end">
                <button onClick={handleClose}>
                  <X className="w-5 h-5 text-black dark:text-neutral-300" />
                </button>
              </div>
            </div>
          </div>

          <nav className="flex flex-col p-3 gap-2">
            {sidebarItems.map((item) => {
              const isActive = pathname.includes(item.href);
              return (
                <Permission
                  key={item.label}
                  resource={item.resource}
                  action={item.action}
                >
                  <button
                    onClick={item.onClick}
                    className={clsx(
                      "flex font-medium text-sm dark:text-neutral-300 items-center gap-3 px-3 py-2 rounded transition",
                      isActive
                        ? "bg-primary text-white dark:text-white"
                        : "text-black dark:text-white hover:bg-primary hover:text-white dark:hover:bg-neutral-800"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={clsx(
                        "w-5 h-5",
                        isActive ? "text-white dark:text-neutral-100" : ""
                      )}
                    />
                    {expanded && <span>{item.label}</span>}
                  </button>
                </Permission>
              );
            })}
          </nav>
        </div>

        <div className="border-t py-3 border-neutral-200 dark:border-neutral-600 flex flex-col items-center px-6 pb-3">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 w-full">
            Stocka v1.0.0
          </div>
        </div>
      </div>
    </>
  );
}
