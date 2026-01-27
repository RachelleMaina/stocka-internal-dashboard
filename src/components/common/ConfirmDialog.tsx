import React from "react";
import clsx from "clsx";

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-md shadow-lg m-3">
        <h2 className="text-lg font-bold mb-4 text-neutral-800 dark:text-neutral-100">
          {title}
        </h2>
        <div className="text-neutral-800 dark:text-neutral-300">{message}</div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onCancel}
            className="font-medium text-sm bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300 px-4 py-1.5 rounded hover:bgneutral-300 dark:hover:bgneutral-600"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "px-4 py-1.5 text-sm rounded font-medium",
              destructive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-primary text-white"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
