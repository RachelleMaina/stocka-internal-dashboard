"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import Select from "react-select";
import clsx from "clsx";
import FloatingInput from "../common/FloatingInput";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { Item, ItemOption, ItemVariant } from "../../types/item";
import { Category } from "../../types/category";
import CustomCheckbox from "../common/CustomCheckbox";
import { Plus, Trash2 } from "lucide-react";

interface ItemFormProps {
  item: Item;
  categories: Category[];
  onSave: (item: Item) => void;
  onClose: () => void;
}

// Joi Validation Schema (only for registered fields)
const itemSchema = Joi.object({
  item_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .label("Name")
    .messages({
      "string.base": 'Name must be a string.',
      "string.empty": 'Name cannot be empty.',
      "string.min": 'Name should have at least 2 characters.',
      "string.max": 'Name should not exceed 100 characters.',
      "any.required": 'Name is a required field.',
    }),

  category_id: Joi.any()
    .allow(null) // Allow null
    .optional()  // Make it optional
    .label("Category")
    .messages({
      "any.base": 'Category is not valid.',
      "any.required": 'Category is a required field.',
    }),

  buying_price: Joi.number()
    .min(0)
    .required()
    .label("Buying Price")
    .messages({
      "number.base": 'Buying Price must be a valid number.',
      "number.min": 'Buying Price must be greater than or equal to 0.',
      "any.required": 'Buying Price is a required field.',
    }),

  selling_price: Joi.number()
    .min(0)
    .required()
    .label("Selling Price")
    .messages({
      "number.base": 'Selling Price must be a valid number.',
      "number.min": 'Selling Price must be greater than or equal to 0.',
      "any.required": 'Selling Price is a required field.',
    }),

  barcode: Joi.string()
    .allow("")
    .label("Barcode")
    .messages({
      "string.base": 'Barcode must be a string.',
    }),

  sku: Joi.string()
    .allow("")
    .label("SKU")
    .messages({
      "string.base": 'SKU must be a string.',
    }),

  tracks_stock: Joi.boolean()
    .required()
    .label("Track Stock")
    .messages({
      "boolean.base": 'Track Stock must be true or false.',
      "any.required": 'Track Stock is a required field.',
    }),

  stock: Joi.when("tracks_stock", {
    is: true,
    then: Joi.number()
      .min(0)
      .required()
      .label("Stock")
      .messages({
        "number.base": 'Stock must be a valid number.',
        "number.min": 'Stock must be greater than or equal to 0.',
        "any.required": 'Stock is required when tracking stock.',
      }),
    otherwise: Joi.number().allow(0),
  }).label("Stock")
});


type FormData = {
  item_name: string;
  category_id?: string;
  buying_price: number;
  selling_price: number;
  barcode: string;
  sku: string;
  tracks_stock: boolean;
  stock: number;
};

const ItemForm: React.FC<ItemFormProps> = ({
  item,
  categories,
  onSave,
  onClose,
}) => {
  const methods = useForm<FormData>({
    resolver: joiResolver(itemSchema),
    defaultValues: {
      item_name: item.item_name || "",
      category_id: item.category_id,
      buying_price: item.buying_price || 0,
      selling_price: item.selling_price || 0,
      barcode: item.barcode || "",
      sku: item.sku || "",
      tracks_stock: item.tracks_stock || false,
      stock: item.stock || 0,
    },
  });

  const {
    handleSubmit,
    register,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;

  const [options, setOptions] = useState<ItemOption[]>([]);
  const [variants, setVariants] = useState<ItemVariant[]>(item.variants || []);
  // Track which variants have manually edited prices
  const [editedVariantPrices, setEditedVariantPrices] = useState<Set<number>>(
    new Set()
  );

  const tracks_stock = watch("tracks_stock");
  const selectedCategoryId = watch("category_id");
  const parentBuyingPrice = watch("buying_price") || 0;
  const parentSellingPrice = watch("selling_price") || 0;

  // Reset form and state when item changes
  useEffect(() => {
    reset({
      item_name: item.item_name || "",
      category_id: item.category_id,
      buying_price: item.buying_price || 0,
      selling_price: item.selling_price || 0,
      barcode: item.barcode || "",
      sku: item.sku || "",
      tracks_stock: item.tracks_stock || false,
      stock: item.stock || 0,
    });
    setOptions( []);
    setVariants(item.variants || []);
    setEditedVariantPrices(new Set());
  }, [item, reset]);

  // Watch parent prices and update non-edited variant prices
  useEffect(() => {
    setVariants((prevVariants) =>
      prevVariants.map((variant, index) => {
        if (editedVariantPrices.has(index)) {
          return variant; // Skip if prices were manually edited
        }
        return {
          ...variant,
          buying_price: parentBuyingPrice,
          selling_price: parentSellingPrice,
        };
      })
    );
  }, [parentBuyingPrice, parentSellingPrice, editedVariantPrices]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Generate variant combinations
  const generateVariants = (opts: ItemOption[]): ItemVariant[] => {
    const combinations: string[][] = [];

    const combine = (index: number, current: string[]) => {
      if (index === opts.length) {
        combinations.push([...current]);
        return;
      }
      for (const value of opts[index].values) {
        combine(index + 1, [...current, value]);
      }
    };

    combine(0, []);

    return combinations.map((combo, index) => ({
      id: variants[index]?.id || index + 1,
      option_values: combo,
      sku: variants[index]?.sku || "",
      barcode: variants[index]?.barcode || "",
      buying_price: variants[index]?.buying_price ?? parentBuyingPrice,
      selling_price: variants[index]?.selling_price ?? parentSellingPrice,
    }));
  };

  const handleAddOption = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const handleOptionChange = (
    index: number,
    field: "name" | "values",
    value: string | string[]
  ) => {
    const newOptions = [...options];
    if (field === "name") {
      newOptions[index].name = value as string;
    } else {
      newOptions[index].values = value as string[];
    }
    setOptions(newOptions);
    setVariants(generateVariants(newOptions));
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    setVariants(generateVariants(newOptions));
    setEditedVariantPrices(new Set()); // Reset edited prices on option removal
  };

  const handleVariantChange = (
    index: number,
    field: keyof ItemVariant,
    value: string | number
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
    // Mark prices as edited if changed
    if (field === "buying_price" || field === "selling_price") {
      setEditedVariantPrices((prev) => new Set(prev).add(index));
    }
  };

  const onSubmit = async (data: FormData) => {
    // Optional: Validate options and variants
    const hasValidOptions = options.every(
      (opt) =>
        opt.name.trim() &&
        opt.values.length > 0 &&
        opt.values.every((v) => v.trim())
    );
    if (!hasValidOptions) {
      alert("All options must have a name and at least one valid value.");
      return;
    }

    await onSave({
      id: item.id,
      item_name: data.item_name,
      category_id: data.category_id,
      buying_price: data.buying_price,
      selling_price: data.selling_price,
      barcode: data.barcode,
      sku: data.sku,
      tracks_stock: data.tracks_stock,
      stock: data.tracks_stock ? data.stock : 0,
      options,
      variants,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <ModalHeader
          title={item.id ? "Edit Item" : "Add Item"}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* General Section */}
            <div className="">
              <h3 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             
                <FloatingInput
                  id="item_name"
                  label="Name"
                  required
                  register={register("item_name")}
                  error={errors.name?.message}
                />
              
                  <FloatingInput
                    id="buying_price"
                    label="Buying Price"
                    required
                    type="number"
                    register={register("buying_price", { valueAsNumber: true })}
                    error={errors.buying_price?.message}
                  />
                  <FloatingInput
                    id="selling_price"
                    label="Selling Price"
                    required
                    type="number"
                    register={register("buying_price", { valueAsNumber: true })}
                    error={errors.selling_price?.message}
                  />
                  <Select
                    options={categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                    value={categories
                      .map((cat) => ({ value: cat.id, label: cat.name }))
                      .find((opt) => opt.value === selectedCategoryId)}
                    onChange={(option) =>
                      setValue("category_id", option?.value || 0)
                    }
                    placeholder="Category"
                 
                  />
                  {errors.category_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.category_id.message}
                    </p>
                  )}
                

                <FloatingInput
                  id="barcode"
                  label="Barcode"
                  register={register("barcode")}
                  error={errors.barcode?.message}
                />
                <FloatingInput
                  id="sku"
                  label="SKU"
                  register={register("sku")}
                  error={errors.sku?.message}
                />
              </div>
            </div>

            {/* Inventory Section */}
            <div className="border rounded-md p-4  mt-6 border-neutral-300 dark:border-neutral-600">
              <h3 className="text-lg font-semibold mb-3 text-neutral-700 dark:text-neutral-300">
                Inventory
              </h3>
              <CustomCheckbox
                id="tracks_stock"
                label="Track Stock"
                register={register("tracks_stock")}
                className="mb-4"
              />

              {tracks_stock && (
                <FloatingInput
                  id="stock"
                  label="In Stock"
                  required
                  type="number"
                  register={register("stock", { valueAsNumber: true })}
                  error={errors.stock?.message}
                />
              )}
            </div>

            {/* Variants Section */}
            <div className="border rounded-md p-4  mt-6 border-neutral-300 dark:border-neutral-600">
              <div className="flex mb-3 items-center justify-between gap-2">
              <h3 className="text-lg font-semibold mb-3 text-neutral-700 dark:text-neutral-300">
                 Variants
              </h3>
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center justify-between gap-1 font-semibold text-indigo-500  hover:bg-primary transition"
              > <Plus />
                Add Option
              </button>
              </div>
             
              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 p-4 rounded-md bg-neutral-50 dark:bg-neutral-800"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-neutral-700 dark:text-neutral-300">
                      Option {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                     <Trash2 />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 mb-3">
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                      Option Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) =>
                        handleOptionChange(index, "name", e.target.value)
                      }
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Size, Color"
                    />
                  </div>
                  <div  className="flex flex-col gap-1 mb-3">
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                      Option Values (comma-separated){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={option.values.join(", ")}
                      onChange={(e) =>
                        handleOptionChange(
                          index,
                          "values",
                          e.target.value.split(",").map((v) => v.trim())
                        )
                      }
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., S, M, L or Red, Green"
                    />
                  </div>
                </div>
              ))}
              {variants.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    Variant Combinations
                  </h4>
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-800"
                      >
                        <h5 className="font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                          {variant.option_values.join(" / ")}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Buying Price{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.buying_price}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "buying_price",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full border px-3 py-2 rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter buying price"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Selling Price{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.selling_price}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "selling_price",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full border px-3 py-2 rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter selling price"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              SKU
                            </label>
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "sku",
                                  e.target.value
                                )
                              }
                              className="w-full border px-3 py-2 rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter variant SKU"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Barcode
                            </label>
                            <input
                              type="text"
                              value={variant.barcode}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "barcode",
                                  e.target.value
                                )
                              }
                              className="w-full border px-3 py-2 rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter variant barcode"
                            />
                          </div>
                         
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2">
              <NeutralButton onClick={onClose}>Cancel</NeutralButton>
              <PrimaryButton disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </PrimaryButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ItemForm;
