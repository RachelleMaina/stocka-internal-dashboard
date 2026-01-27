"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Permission } from "@/components/common/Permission";

type DropdownItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  resource?: string; // e.g., "roles", "items"
  action?: string;   // e.g., "create", "update"
};

type DropdownMenuProps = {
  items: DropdownItem[];
  trigger: React.ReactNode;
};

export function DropdownMenu({ items, trigger }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right - 192 + window.scrollX, // 192 = dropdown width (48 * 4)
      });
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <button ref={buttonRef} onClick={handleOpen} className="">
        {trigger}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="absolute bg-white dark:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-300 shadow-lg rounded-md z-50 w-48"
            style={{ top: coords.top, left: coords.left }}
          >
            {items.map((item, i) => {
              const button = (
                <button
                  key={i}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </button>
              );

              return item.resource && item.action ? (
                <Permission key={i} resource={item.resource} action={item.action}>
                  {button}
                </Permission>
              ) : (
                button
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
