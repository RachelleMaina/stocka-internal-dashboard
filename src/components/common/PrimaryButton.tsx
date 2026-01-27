import React from "react";
import { Loader2 } from "lucide-react"; // Optional: Icon spinner

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <button
      type="submit"
      className="flex items-center justify-center gap-2 sm:w-auto px-3 py-1.5 rounded text-sm font-medium bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 transition"
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 className="animate-spin w-4 h-4" />}
      {loading ? "Loading..." : children}
    </button>
  );
};

export default PrimaryButton;
