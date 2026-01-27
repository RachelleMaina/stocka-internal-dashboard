"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { Permission } from "./Permission";
import clsx from "clsx";

interface BreadcrumbLevel {
  name: string;
  onClick?: () => void;
}

interface ActionButton {
  title: string;
  description?: string;
  onClick: () => void;
  icon?: ReactNode;
  resource: string;
  action: string;
  disabled?: boolean;
}

interface BreadcrumbWithActionsProps {
  breadcrumbs: BreadcrumbLevel[];
  actions?: ActionButton[];
  label?: string;
  filters?: any;
}

const BreadcrumbWithActions: FC<BreadcrumbWithActionsProps> = ({
  breadcrumbs,
  actions = [],
  label = "Options",
  filters
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const parentLevel = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
  const currentLevel = breadcrumbs[breadcrumbs.length - 1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, onClick: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-600 min-h-14">
      <div className="px-3 py-2 flex flex-row items-center justify-between gap-3">
        <nav role="navigation" aria-label="Breadcrumb" className="flex items-center gap-2 flex-1">
          <div className="sm:hidden flex items-center justify-center gap-2 w-full">
            {parentLevel && (
              <button
                onClick={parentLevel.onClick}
                className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 transition absolute left-3"
                aria-label={`Back to ${parentLevel.name}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <span
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1 text-center"
              aria-current="page"
            >
              {currentLevel.name}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {breadcrumbs.slice(0, 3).map((level, index) => (
              <div key={level.name} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                )}
                {level.onClick && index < breadcrumbs.length - 1 ? (
                  <button
                    onClick={level.onClick}
                    className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 line-clamp-1 transition"
                    aria-label={`Go to ${level.name}`}
                  >
                    {level.name}
                  </button>
                ) : (
                  <span
                    className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1"
                    aria-current="page"
                  >
                    {level.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </nav>
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.length === 1 ? (
              <Permission resource={actions[0].resource} action={actions[0].action}>
                <button
                  onClick={actions[0].onClick}
                  disabled={actions[0].disabled}
                  className={clsx(
                    "flex items-center gap-1 px-2 py-2 rounded-sm font-medium text-sm text-white disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition",
                    actions[0].disabled
                      ? "cursor-not-allowed"
                      : "bg-primary"
                  )}
                  aria-label={actions[0].title}
                >
                  {actions[0].icon}
                  {actions[0].title}
                </button>
              </Permission>
            ) : (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-2 rounded-sm font-medium text-sm bg-primary text-white disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition"
                  aria-expanded={isDropdownOpen}
                  aria-controls="dropdown-menu"
                  aria-label={label}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <div className="border-l border-primary pl-1 ml-1 flex items-center">
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </span>
                </button>
                {isDropdownOpen && (
                  <div
                    id="dropdown-menu"
                    ref={dropdownRef}
                    role="menu"
                    aria-label="Actions"
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-md shadow-md border border-neutral-200 dark:border-neutral-600"
                  >
                    {actions.map((action, index) => (
                      <Permission
                        key={index}
                        resource={action.resource}
                        action={action.action}
                      >
                        <div
                          role="menuitem"
                          tabIndex={0}
                          onClick={() => {
                            action.onClick();
                            setIsDropdownOpen(false);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, action.onClick)}
                          className={clsx(
                            "flex items-start gap-2 px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition",
                            index < actions.length - 1
                              ? "border-b border-neutral-200 dark:border-neutral-600"
                              : "",
                            action.disabled ? "opacity-50 cursor-not-allowed" : ""
                          )}
                        >
                          {action.icon && <div className="mt-2">{action.icon}</div>}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-300">
                              {action.title}
                            </p>
                            <p className="text-xs text-neutral-700 dark:text-neutral-400">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </Permission>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {filters && (<div className="px-3">{filters}</div>)}
    </div>
  );
};

export default BreadcrumbWithActions;