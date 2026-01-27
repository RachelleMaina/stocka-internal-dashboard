import clsx from "clsx";

type BooleanBadgeProps = {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
  align?: "left" | "center" | "right";
};

const alignMap = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export default function BooleanBadge({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  align = "center",
}: BooleanBadgeProps) {
  const badgeStyles = value
    ? "bg-accent/60 text-white border border-accent dark:border-accent/50"
    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700";

  return (
    <div className={clsx("flex", alignMap[align])}>
      <span
        className={clsx(
          "px-3 py-1 text-xs font-medium rounded-full capitalize tracking-wide",
          badgeStyles
        )}
      >
        {value ? trueLabel : falseLabel}
      </span>
    </div>
  );
}
