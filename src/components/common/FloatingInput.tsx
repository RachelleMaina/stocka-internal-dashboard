import React, { useEffect } from "react";
import { UseFormRegisterReturn, useFormContext } from "react-hook-form";

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  register: UseFormRegisterReturn;
  error?: string;
  isPhone?: boolean;
  backgroundClass?: string; // New prop for label background
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  label,
  type = "text",
  required = false,
  register,
  error,
  isPhone = false,
  backgroundClass = "bg-white dark:bg-neutral-900", // Default background
}) => {
  const { setValue, watch } = useFormContext();

  const value = watch(id);

  useEffect(() => {
    if (isPhone && value) {
      let formattedValue = value.replace(/\D/g, '');
      if (formattedValue.startsWith('0')) {
        formattedValue = '254' + formattedValue.slice(1);
      } else if (!formattedValue.startsWith('254')) {
        formattedValue = '254' + formattedValue;
      }
      setValue(id, formattedValue);
    }
  }, [value, isPhone, id, setValue]);

  return (
    <>
  
    <div className="relative">
      <input
        id={id}
        type={type}
          {...register}
       
          className={` ${backgroundClass}  block px-2.5 pb-2.5 pt-2 w-full text-sm text-neutral-900 dark:text-neutral-300 rounded  border-2 border-neutral-300 dark:border-neutral-600 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer`}
        placeholder=" "
   value={value !== undefined && value !== null ? value : ''}

      />
      <label
        htmlFor={id}
        className={`absolute text-sm text-neutral-500 dark:text-neutral-300 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] ${backgroundClass} px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1`}
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
  
    </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </>
  );
};

export default FloatingInput;