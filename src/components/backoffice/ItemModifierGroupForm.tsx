"use client"

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { ModifierGroup } from "@/types/item";
import AsyncSelect from "react-select/async";
import { api } from "@/lib/api";
import { endpoints } from "@/constants/endpoints";

interface LinkedItem {
  id: string;
  item_name: string;
}

type ItemModifierGroupFormValues = {
  item_ids: string[];
};

export default function ItemModifierGroupForm({
  modifierGroup,
  linkedItems,
  onSave,
  onClose,
}: {
  modifierGroup: ModifierGroup;
  linkedItems: LinkedItem[];
  onSave: (group_id: string, item_ids: string[]) => void;
  onClose: () => void;
    }) {
    const [operationLoading, setOperationLoading] = useState(false)
    
  const methods = useForm<ItemModifierGroupFormValues>({
    defaultValues: {
      item_ids: linkedItems.map((item) => item.id),
    },
  });

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = methods;

  const loadItems = async (inputValue: string) => {
    try {
      const response = await api.get(endpoints.getItemsForModifierSelect, {
        params: { search: inputValue },
      });
      return response.data.data
        .filter((item: { id: string }) => !linkedItems.some((linked) => linked.id === item.id))
        .map((item: { id: string; item_name: string }) => ({
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
          title={`Link Items to ${modifierGroup.group_name}`}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((data) => onSave(modifierGroup.id, data.item_ids))}
            className="space-y-4 p-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Select Items
              </label>
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadItems}
                defaultValue={linkedItems.map((item) => ({
                  value: item.id,
                  label: item.item_name,
                }))}
                onChange={(options) =>
                  setValue("item_ids", options ? options.map((opt) => opt.value) : [])
                }
                 className="my-react-select-container"
                      classNamePrefix="my-react-select"
                placeholder="Search for items..."
              />
              {errors.item_ids && (
                <p className="text-sm text-red-500 mt-1">{errors.item_ids.message}</p>
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
