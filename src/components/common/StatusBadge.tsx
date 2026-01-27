import clsx from "clsx";

type Status =
  | "pending"
  | "active"
  | "inactive"
  | "rejected"
  | "approved"
  | string;

interface StatusBadgeProps {
  status?: Status;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800",

  active:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800",

  approved:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800",

  inactive:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800",

  rejected:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800",
};

export default function StatusBadge({
  status = "pending",
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center",
        "px-3 py-1",
        "text-xs font-medium",
        "rounded-full",
        "border",
        "capitalize tracking-wide",
        STATUS_STYLES[normalizedStatus] ??
          "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        className
      )}
    >
      {normalizedStatus}
    </span>
  );
}
