import React from "react";
import { LucideIcon } from "lucide-react";

type PageEmptyStateProps = {
  icon: LucideIcon;
  title?: string;
  description?: string;
};

const PageEmptyState: React.FC<PageEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div
      className="w-full bg-white dark:bg-neutral-800 p-4 flex flex-col items-center gap-4 text-center rounded"
      aria-live="polite"
    >
      <Icon className="w-8 h-8 text-neutral-400 dark:text-neutral-400" />
     {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-200">
        {title}
      </h3>} 
      {description &&  <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>}
     
    </div>
  );
};

export default PageEmptyState;
