'use client';

import React from 'react';
import clsx from 'clsx';

interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  disabled = false,
  onCheckedChange,
  className,
}) => {
  return (
    <label
      className={clsx(
        'inline-flex items-center',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={clsx(
          'relative w-9 h-5 rounded-full transition-all duration-200 ease-in-out',
          // Off state
          'bg-neutral-300',
          // On state — use primary color
          'peer-checked:bg-primary',
          // Focus ring using primary with opacity
          'peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30',
          // Thumb (the moving circle)
          'after:content-[""] after:absolute after:top-[2px] after:start-[2px]',
          'after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-md',
          'after:transition-all after:duration-200 after:ease-in-out',
          // Move thumb when checked
          'peer-checked:after:translate-x-full',
          'rtl:peer-checked:after:-translate-x-full'
        )}
      />
    </label>
  );
};