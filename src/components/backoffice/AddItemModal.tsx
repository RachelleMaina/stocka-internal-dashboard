"use client";

import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import { api } from "@/lib/api";
import { Category } from "@/types/category";
import { Controller, useForm, FormProvider } from "react-hook-form";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";

const schema = Joi.object({
  itemId: Joi.string().allow("").optional(),
  quantity: Joi.number().min(1).optional().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
  store_location_ids: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      "array.base": "Store locations must be an array",
      "array.min": "At least one store location must be selected",
      "any.required": "Store locations are required",
    }),
  categoryIds: Joi.array().items(Joi.string()).optional(),
});

type FormValues = {
  itemId?: string;
  quantity?: number;
  store_location_ids: string[];
  categoryIds?: string[];
};

interface AddStockLevelModalProps {
  onSubmit: (data: {
    mode: string;
    itemId?: string;
    quantity?: number;
    store_locations?: string[];
    categoryIds?: string[];
  }) => void;
  onClose: () => void;
  modes: { value: string; label: string; description: string }[];
  store_locations: {
    id: string;
    store_location_id?: string;
    store_location_name: string;
    is_default?: boolean;
  }[];
}

const AddStockLevelModal: React.FC<AddStockLevelModalProps> = ({
  onSubmit,
  onClose,
  modes,
  store_locations,
}) => {
  const methods = useForm<FormValues>({
    resolver: joiResolver(schema),
    defaultValues: {
      itemId: "",
      quantity: undefined,
      store_location_ids: [],
      categoryIds: [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;

  const [mode, setMode] = useState(modes[0].value);
  const [selectedItem, setSelectedItem] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const searchItemsByName = async (search: string) => {
    if (search) {
      try {
        const response = await api.get("/api/items", {
          params: { search },
        });
        const { data } = response?.data?.data;
        return data.map((item: any) => ({
          value: item.id,
          label: item.item_name,
          itemData: item,
        }));
      } catch (error) {
        console.log(error);
        return [];
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await api.get("/api/categories");
      setCategories(categoriesResponse.data.data);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  const onSubmitForm = (data: FormValues) => {
    setOperationLoading(true);

    onSubmit({
      mode,
      ...(mode === "single" && {
        itemId: data.itemId,
        quantity: Number(data.quantity),
        store_location_ids: data.store_location_ids,
      }),
      ...(mode === "catalogue" && {
        categoryIds: data.categoryIds,
        store_location_ids: data.store_location_ids,
      }),
    });
    setOperationLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white  dark:bg-neutral-800  rounded-lg shadow-md max-w-3xl overflow-y-auto max-h-[90vh] p-6">
        <ModalHeader title="Add Item(s) to Store Locations" onClose={onClose} />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            {/* Mode Selection Cards */}
            <div className="grid gap-4 mb-6">
              {modes.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 rounded-md border cursor-pointer transition ${
                    mode === option.value
                      ? "bg-[var(--bg-selected)] border-[var(--border-hover)]"
                      : "bg-[var(--bg)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-1 mr-3 accent-primary"
                  />
                  <div>
                    <h3 className="text-sm font-semibold">{option.label}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Form Fields */}
            {mode === "single" && (
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="w-full">
                    <label className="block text-xs font-medium mb-1">
                      Item
                    </label>
                    <Controller
                      name="itemId"
                      control={control}
                      render={({ field }) => (
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          loadOptions={searchItemsByName}
                          onChange={(selected) => {
                            setSelectedItem(selected);
                            field.onChange(selected?.value || "");
                          }}
                          value={selectedItem}
                          placeholder="Search items..."
                          className="my-react-select-container"
                          classNamePrefix="my-react-select"
                          isClearable
                        />
                      )}
                    />
                    {errors.itemId && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.itemId.message}
                      </p>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-medium mb-1">
                      Quantity
                    </label>
                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          min="1"
                          className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-600 text-xs rounded bg-white dark:bg-neutral-800 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter quantity"
                        />
                      )}
                    />
                    {errors.quantity && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mode === "catalogue" && (
              <div className="mb-6">
                <label className="block text-xs font-medium mb-1">
                  Filter by Categories (Optional)
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
                      className="my-react-select-container"
                      classNamePrefix="my-react-select"
                      isClearable
                    />
                  )}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">
                Locations to Stock Item (s)
              </label>
              <Controller
                name="store_location_ids"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    options={store_locations?.map((location) => ({
                      value: location.store_location_id || location.id,
                      label:
                        location.store_location_name +
                        (location.is_default ? " (Main)" : ""),
                    }))}
                    value={store_locations
                      ?.filter((location) =>
                        field.value.includes(
                          location.store_location_id || location.id
                        )
                      )
                      .map((location) => ({
                        value: location.store_location_id || location.id,
                        label:
                          location.store_location_name +
                          (location.is_default ? " (Main)" : ""),
                      }))}
                    onChange={(options) => {
                      const selectedIds = options.map((opt) => opt.value);
                      field.onChange(selectedIds);
                    }}
                    placeholder="Select locations to stock item"
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                    isClearable
                  />
                )}
              />
              {errors.store_location_ids && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.store_location_ids.message}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <NeutralButton onClick={onClose}>Cancel</NeutralButton>
              <button
                type="submit"
                disabled={operationLoading}
                className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-primary transition"
              >
                Add Item(s)
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default AddStockLevelModal;
