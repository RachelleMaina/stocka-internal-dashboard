"use client"
import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { ModifierGroup } from "@/types/item";

type ModifierGroupFormValues = {
  group_name: string;
  is_required: boolean;
  min_choices: number;
  max_choices: number;
};

export default function ModifierGroupForm({
  modifierGroup,
  onSave,
  onClose,
}: {
  modifierGroup: ModifierGroup | null;
  onSave: (payload: {
    group_name: string;
    is_required: boolean;
    min_choices: number;
    max_choices: number;
  }) => void;
  onClose: () => void;
    }) {
    const [operationLoading, setOperationLoading]=useState(false)
    
  const methods = useForm<ModifierGroupFormValues>({
    defaultValues: {
      group_name: modifierGroup?.group_name || "",
      is_required: modifierGroup?.is_required || false,
      min_choices: modifierGroup?.min_choices || 0,
      max_choices: modifierGroup?.max_choices || 1,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-md shadow-lg [--bg:#ffffff] [--border:#e5e7eb] [--border-hover:#d1d5db] [--bg-selected:#f3f4f6] [--bg-hover:#f9fafb] [--text:#1f2937] [--text-hover:#111827] dark:[--bg:#1f2937] dark:[--border:#4b5563] dark:[--border-hover:#6b7280] dark:[--bg-selected:#374151] dark:[--bg-hover:#4b5563] dark:[--text:#f3f4f6] dark:[--text-hover:#ffffff]">
        <ModalHeader
          title={modifierGroup?.id ? "Edit Modifier Group" : "New Modifier Group"}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4 p-4">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Group Name
              </label>
              <input
                type="text"
                {...register("group_name", {
                  required: "Group name is required",
                })}
                className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter group name (e.g., Choose a Side)"
              />
              {errors.group_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.group_name.message}
                </p>
              )}
            </div>

            {/* Is Required */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Required
              </label>
              <input
                type="checkbox"
                {...register("is_required")}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300 dark:border-neutral-600 rounded"
              />
            </div>

            {/* Min Choices */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Minimum Choices
              </label>
              <input
                type="number"
                {...register("min_choices", {
                  required: "Minimum choices is required",
                  min: { value: 0, message: "Minimum choices must be at least 0" },
                })}
                className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter minimum choices"
              />
              {errors.min_choices && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.min_choices.message}
                </p>
              )}
            </div>

            {/* Max Choices */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Maximum Choices
              </label>
              <input
                type="number"
                {...register("max_choices", {
                  required: "Maximum choices is required",
                  min: { value: 1, message: "Maximum choices must be at least 1" },
                  validate: {
                    greaterThanMin: (value, formValues) =>
                      Number(value) >= Number(formValues.min_choices) ||
                      "Maximum choices must be greater than or equal to minimum choices",
                  },
                })}
                className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter maximum choices"
              />
              {errors.max_choices && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.max_choices.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <NeutralButton onClick={onClose}>Cancel</NeutralButton>
              <PrimaryButton disabled={operationLoading}>
                {operationLoading ? "Saving..." : "Save"}
              </PrimaryButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}