import clsx from "clsx";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";

type PermissionFormData = {
  code: string;
  description: string;
  module: string;
  is_active: boolean;
};

interface PermissionModalProps {
  onSubmit: (data: PermissionFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  modules: string[];
  isLoading?: boolean;
}



const PermissionModal: React.FC<PermissionModalProps> = ({
  onSubmit,
  onCancel,
  initialData,
  modules=[],
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PermissionFormData>({
    defaultValues: initialData
      ? {
          code: initialData.code,
          description: initialData.description,
          module: initialData.module,
          is_active: initialData.is_active,
        }
      : {
          code: "",
          description: "",
          module: "",
          is_active: true,
        },
  });

  const onFormSubmit = async (data: PermissionFormData) => {
    await onSubmit(data);
  };
  const moduleOptions = modules.map((mod) => ({
    label: mod,
    value: mod.toLowerCase().replace(/\s+/g, "_"),
  }));

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Code
        </label>
        <input
          {...register("code", { required: "Code is required" })}
          className={clsx(
            "w-full px-4 py-2 border rounded-md",
            "border-neutral-300 dark:border-neutral-700 focus:border-primary focus:ring-2 focus:ring-primary/30",
            errors.code && "border-red-500"
          )}
          placeholder="e.g. dashboard:view"
        />
        {errors.code && (
          <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Description
        </label>
        <textarea
          {...register("description", { required: "Description is required" })}
          rows={3}
          className={clsx(
            "w-full px-4 py-2 border rounded-md",
            "border-neutral-300 dark:border-neutral-700 focus:border-primary focus:ring-2 focus:ring-primary/30",
            errors.description && "border-red-500"
          )}
          placeholder="e.g. View Dashboard"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Module
        </label>
        <Controller
          name="module"
          control={control}
          rules={{ required: "Module is required" }}
          render={({ field }) => (
            <Select
              {...field}
              options={moduleOptions}
              placeholder="Select module..."
              value={
                moduleOptions.find((opt) => opt.value === field.value) || null
              }
              menuPlacement="top"
              onChange={(option) => field.onChange(option?.value)}
              className="my-react-select-container text-sm"
              classNamePrefix="my-react-select"
            />
          )}
        />
        {errors.module && (
          <p className="text-red-500 text-sm mt-1">{errors.module.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            "px-8 py-2 bg-primary text-white rounded-md font-medium transition-colors",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
          )}
        >
          {isLoading
            ? "Saving..."
            : initialData
            ? "Update Permission"
            : "Create Permission"}
        </button>
      </div>
    </form>
  );
};

export default PermissionModal;
