// components/common/ModalHeader.tsx
import { X } from "lucide-react";
import React from "react";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold text-neutral-800 dark:text-white">{title}</h2>
      <button
        onClick={onClose}
        className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
      </button>
    </div>
  );
};

export default ModalHeader;
