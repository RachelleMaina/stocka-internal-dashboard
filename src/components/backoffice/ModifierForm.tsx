"use client"

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { Modifier, ModifierGroup } from "@/types/item";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import { api } from "@/lib/api";
import { endpoints } from "@/constants/endpoints";

type ModifierFormValues = {
  group_id: string;
  modifier_name: string;
  linked_item_id?: string;
  price_change: number;
};

export default function ModifierForm({
  modifier,
  modifierGroups,
  operationLoading,
  onSave,
  onClose,
}: {
  modifier: Modifier | null;
  modifierGroups: ModifierGroup[];
  operationLoading: boolean;
  onSave: (payload: {
    group_id: string;
    modifier_name: string;
    linked_item_id?: string;
    price_change: number;
  }) => void;
  onClose: () => void;
    }) {
 
    
  const methods = useForm<ModifierFormValues>({
    defaultValues: {
      group_id: modifier?.group_id || "",
      modifier_name: modifier?.modifier_name || "",
      linked_item_id: modifier?.linked_item_id || "",
      price_change: modifier?.price_change || 0,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = methods;

  const loadItems = async (inputValue: string) => {
    try {
      const response = await api.get(endpoints.getItemsForModifierSelect, {
        params: { search: inputValue },
      });
      return response.data.data.map((item: { id: string; item_name: string }) => ({
        value: item.id,
        label: item.item_name,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-md shadow-lg [--bg:#ffffff] [--border:#e5e7eb] [--border-hover:#d1d5db] [--bg-selected:#f3f4f6] [--bg-hover:#f9fafb] [--text:#1f2937] [--text-hover:#111827] dark:[--bg:#1f2937] dark:[--border:#4b5563] dark:[--border-hover:#6b7280] dark:[--bg-selected:#374151] dark:[--bg-hover:#4b5563] dark:[--text:#f3f4f6] dark:[--text-hover:#ffffff]">
        <ModalHeader
          title={modifier?.id ? "Edit Modifier" : "New Modifier"}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4 p-4">
            {/* Modifier Group */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Modifier Group
              </label>
              <Select
                options={modifierGroups.map((group) => ({
                  value: group.id,
                  label: group.group_name,
                }))}
                defaultValue={
                  modifier?.group_id
                    ? {
                        value: modifier.group_id,
                        label: modifierGroups.find((group) => group.id === modifier.group_id)
                          ?.group_name,
                      }
                    : null
                }
                onChange={(option) => setValue("group_id", option?.value || "")}
                 className="my-react-select-container"
                      classNamePrefix="my-react-select"
                placeholder="Select a group"
              />
              {errors.group_id && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.group_id.message}
                </p>
              )}
            </div>

            {/* Modifier Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Modifier Name
              </label>
              <input
                type="text"
                {...register("modifier_name", {
                  required: "Modifier name is required",
                })}
                className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter modifier name (e.g., Soda)"
              />
              {errors.modifier_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.modifier_name.message}
                </p>
              )}
            </div>

            {/* Linked Item ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Linked Item (Optional)
              </label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadItems}
                defaultValue={
                  modifier?.linked_item_id
                    ? { value: modifier.linked_item_id, label: modifier.linked_item_id }
                    : null
                }
                onChange={(option) => setValue("linked_item_id", option?.value || "")}
                className="my-react-select-container"
                      classNamePrefix="my-react-select"
                placeholder="Search for an item..."
                isClearable
              />
              {errors.linked_item_id && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.linked_item_id.message}
                </p>
              )}
            </div>

            {/* Price Change */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Price Change
              </label>
              <input
                type="number"
                step="0.01"
                {...register("price_change", {
                  required: "Price change is required",
                  valueAsNumber: true,
                })}
                className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter price change (e.g., 1.50)"
              />
              {errors.price_change && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.price_change.message}
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