"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { endpoints } from "@/constants/endpoints";
import toast from "react-hot-toast";
import AsyncSelect from "react-select/async";

interface StockCountAddItemsModalProps {
  onSubmit: (items: Item[]) => void;
  onCancel: () => void;
  operationLoading: boolean;
  countType?: "general" | "production_batch" | "purchase_batch";
  stock_count_name: string;
  notes: string;
}

interface Item {
  item_id: string;
  name: string;
  unit: string;
  expected: number | null;
  counted: number | null;
  reason: string;
}

interface Category {
  id: string;
  category_name: string;
}

interface Batch {
  id: string;
  batch_name: string;
}

interface FormValues {
  count_type: "general" | "production_batch" | "purchase_batch";
  categoryIds: string[];
  batchId: string;
}

const StockCountAddItemsModal: React.FC<StockCountAddItemsModalProps> = ({
  onSubmit,
  onCancel,
  operationLoading,
  countType,
  stock_count_name,
  notes,

}) => {
  const { backoffice_user_profile } = useAppState();
  const business_location_id = backoffice_user_profile?.business_location_id;
   const store_location_id = backoffice_user_profile?.store_location_id;
  const staff_details = {
    user_id: backoffice_user_profile?.user_id || "",
    display_name: backoffice_user_profile?.display_name || "",
    first_name: backoffice_user_profile?.first_name || "",
    last_name: backoffice_user_profile?.last_name || "",
  };
  const methods = useForm<FormValues>({
    defaultValues: {
      count_type: countType || "general",
      categoryIds: [],
      batchId: "",
    },
  });

  const {
    control,
    watch,
    setValue,
  } = methods;

  const count_type = watch("count_type");
  const [loading, setLoading] = useState(false);
  const [categoryLabels, setCategoryLabels] = useState<{ [key: string]: string }>({});
  const [batchLabels, setBatchLabels] = useState<{ [key: string]: string }>({});

  // Reset batchId when count_type is "general"
  useEffect(() => {
    if (count_type === "general") {
      setValue("batchId", "");
    }
  }, [count_type, setValue]);

  const loadCategories = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2 || !store_location_id || !business_location_id) return [];
    try {
      const response = await api.get(endpoints.getCategories, {
        params: { search: inputValue },
      });
      const options = response?.data?.data?.map((cat: Category) => {
        setCategoryLabels((prev) => ({ ...prev, [cat.id]: cat.category_name }));
        return { value: cat.id, label: cat.category_name };
      }) || [];
      return options;
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      toast.error(error?.response?.data?.message || "Failed to load categories.");
      return [];
    }
  };

  const loadBatches = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2 || !store_location_id || !business_location_id) return [];
    try {
      const endpoint =
        count_type === "production_batch"
          ? endpoints.listProductionBatches(store_location_id)
          : endpoints.listPurchaseBatches(store_location_id);
      const response = await api.get(endpoint, {
        params: { search: inputValue, is_active:true },
      });
      const options = response?.data?.data?.data?.map((batch: Batch) => {
        setBatchLabels((prev) => ({ ...prev, [batch.id]: batch.batch_name }));
        return { value: batch.id, label: batch.production_batch_name || batch.purchase_batch_name};
      }) || [];
      return options;
    } catch (error: any) {
      console.error("Failed to load batches:", error);
      toast.error(error?.response?.data?.message || "Failed to load batches.");
      return [];
    }
  };

  const handleAddItems = async () => {
    setLoading(true);
    try {
      const values = methods.getValues();

      // Manual validation
      if (!values.count_type || !["general", "production_batch", "purchase_batch"].includes(values.count_type)) {
        toast.error("Please select a valid count type.");
        return;
      }
      if (["production_batch", "purchase_batch"].includes(values.count_type) && !values.batchId) {
        toast.error("Please select a batch for batch-specific counts.");
        return;
      }

      const payload: any = {
        stock_count_type: values.count_type,
        stock_count_name,
        notes,
        staff_details,
        business_location_id,
      };
      if (values.count_type === "general" && values.categoryIds.length > 0) {
        payload.category_ids = values.categoryIds;
      } else if (values.count_type !== "general") {
        payload.batch_id = values.batchId;
      }

      const response = await api.post(endpoints.createStockCount(store_location_id), payload);
      const items: Item[] = response?.data?.data?.items || [];
      if (items.length === 0) {
        toast.error("No items found for the selected criteria.");
        return;
      }
      onSubmit(response?.data?.data?.stock_count_id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    {
      value: "general",
      label: "General Count",
      description: "Add items, optionally filtered by categories.",
    },
    {
      value: "production_batch",
      label: "By Production Batch",
      description: "Add items from a selected production batch.",
    },
    {
      value: "purchase_batch",
      label: "By Purchase Batch",
      description: "Add items from a selected purchase batch.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md max-w-lg p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Add Items to Stock Count
          </h2>
          <button
            onClick={onCancel}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            disabled={operationLoading || loading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <FormProvider {...methods}>
          <form className="space-y-6">
            {/* Count Type Selection Cards */}
            <div className="grid gap-4 mb-6">
              {modes.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 rounded-md border cursor-pointer transition ${
                    count_type === option.value
                      ? "bg-primary/10 dark:bg-neutral-700 border-primary"
                      : "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="count_type"
                    value={option.value}
                    checked={count_type === option.value}
                    onChange={() => setValue("count_type", option.value)}
                    className="mt-1 mr-3 accent-primary"
                    disabled={operationLoading || loading || !!countType}
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {option.label}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Category Filter */}
            {count_type === "general" && (
              <div className="mb-6">
                <label
                  htmlFor="categoryIds"
                  className="block text-xs font-medium text-neutral-900 dark:text-neutral-200 mb-1"
                >
                  Categories
                </label>
                <Controller
                  name="categoryIds"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      isMulti
                      cacheOptions
                      defaultOptions
                      loadOptions={loadCategories}
                      onChange={(options) => {
                        console.log("Selected categories:", options); // Debug: Remove after testing
                        field.onChange(options ? options.map((opt) => opt.value) : []);
                      }}
                      value={field.value?.map((id) => ({
                        value: id,
                        label: categoryLabels[id] || id,
                      })) || []}
                      placeholder="Search categories..."
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                      isClearable
                      isDisabled={operationLoading || loading}
                    />
                  )}
                />
              </div>
            )}

            {/* Batch Filter */}
            {(count_type === "production_batch" || count_type === "purchase_batch") && (
              <div className="mb-6">
                <label
                  htmlFor="batchId"
                  className="block text-xs font-medium text-neutral-900 dark:text-neutral-200 mb-1"
                >
                  Select Batch <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="batchId"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      cacheOptions
                      defaultOptions
                      loadOptions={loadBatches}
                      onChange={(option) => field.onChange(option ? option.value : "")}
                      value={
                        field.value
                          ? { value: field.value, label: batchLabels[field.value] || field.value }
                          : null
                      }
                      placeholder="Search batches..."
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                      isClearable
                      isDisabled={operationLoading || loading}
                    />
                  )}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-200 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700"
                disabled={operationLoading || loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItems}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded disabled:cursor-not-allowed flex items-center"
                disabled={operationLoading || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Items
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default StockCountAddItemsModal;
