// components/common/NeutralButton.tsx
import React from "react";

interface NeutralButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const NeutralButton: React.FC<NeutralButtonProps> = ({ children, ...props }) => {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 sm:w-auto px-3 py-1.5 text-sm font-medium bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white rounded transition"
   
      {...props}
    >
      {children}
    </button>
  );
};

export default NeutralButton;
