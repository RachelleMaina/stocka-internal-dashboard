"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import Select from "react-select";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";

interface Item {
  id: string;
  item_name: string;
  category_id?: string;
  category_name?: string;
}

interface Category {
  id: string;
  category_name: string;
}

interface FormValues {
  categoryIds: string[];
}

interface BulkAddItemsModalProps {
  batchableItemsEndpoint: string; // New prop for the endpoint
  onSubmit: (items: Item[]) => void;
  onCancel: () => void;
  operationLoading: boolean;
}

const schema = Joi.object({
  categoryIds: Joi.array()
    .items(Joi.string().uuid())
    .optional()
    .label("Categories")
    .messages({
      "array.base": "Categories must be an array.",
      "string.uuid": "Each category ID must be a valid UUID.",
    }),
});

const BulkAddItemsModal: React.FC<BulkAddItemsModalProps> = ({
  batchableItemsEndpoint,
  onSubmit,
  onCancel,
  operationLoading,
}) => {
  const { backoffice_user_profile } = useAppState();
  const business_location_id = backoffice_user_profile?.business_location_id;

  const methods = useForm<FormValues>({
    resolver: joiResolver(schema),
    defaultValues: {
      categoryIds: [],
    },
  });

  const {
    control,
    formState: { errors },
    watch,
  } = methods;

  const [mode, setMode] = useState("all");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/categories", {
          params: { business_location_id },
        });
        const cats: Category[] = response?.data?.data || [];
        setCategories(cats);
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message || "Failed to load categories."
        );
      } finally {
        setLoading(false);
      }
    };
    if (business_location_id) {
      loadCategories();
    }
  }, [business_location_id]);

  const handleAddItems = async () => {
    setLoading(true);
    try {
      const response = await api.post(batchableItemsEndpoint, {
        business_location_id,
        ...(mode === "category" && watch("categoryIds").length > 0
          ? { category_ids: watch("categoryIds") }
          : {}),
      });
      const items: Item[] = response?.data?.data?.data || [];
      if (items.length === 0) {
        toast.error("No items found for the selected criteria.");
        return;
      }
      onSubmit(items);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    {
      value: "all",
      label: "Add All Items",
      description: "Add all items from the catalog to the batch.",
    },
    {
      value: "category",
      label: "By Category",
      description: "Add items from selected categories to the batch.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md max-w-lg p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Add Items to Batch
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
            {/* Mode Selection Cards */}
            <div className="grid gap-4 mb-6">
              {modes.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 rounded-md border cursor-pointer transition ${
                    mode === option.value
                      ? "bg-primary/10 dark:bg-neutral-700 border-primary"
                      : "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-1 mr-3 accent-primary"
                    disabled={operationLoading || loading}
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
            {mode === "category" && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-neutral-900 dark:text-neutral-200 mb-1">
                  Filter by Categories <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="categoryIds"
                  control={control}
                  render={({ field }) => (
                    <Select
                      isMulti
                      isLoading={loading}
                      options={categories.map((cat) => ({
                        value: cat.id,
                        label: cat.category_name,
                      }))}
                      onChange={(options) =>
                        field.onChange(options.map((opt) => opt.value))
                      }
                      value={categories
                        .filter((cat) => field.value?.includes(cat.id))
                        .map((cat) => ({
                          value: cat.id,
                          label: cat.category_name,
                        }))}
                      placeholder="Select categories"
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                      isClearable
                      isDisabled={operationLoading || loading}
                    />
                  )}
                />
                {errors.categoryIds && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.categoryIds.message}
                  </p>
                )}
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
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Items
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default BulkAddItemsModal;