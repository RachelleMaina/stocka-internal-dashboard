"use client";

import { api } from "@/lib/api";
import { joiResolver } from "@hookform/resolvers/joi";
import clsx from "clsx";
import Joi from "joi";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Select from "react-select";
import { Item } from "../../types/item";
import FloatingInput from "../common/FloatingInput";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";

interface ItemFormProps {
  item: Item;
  loading: boolean;
  onSave: (item: Item) => void;
  onClose: () => void;
}

const uoms = [
  { id: "piece", name: "Piece" },
  { id: "bottle", name: "Bottle" },
  { id: "can", name: "Can" },
  { id: "shot", name: "Shot" },
  { id: "pair", name: "Pair" },
  { id: "pack", name: "Pack" },
  { id: "set", name: "Set" },
  { id: "roll", name: "Roll" },
  { id: "bundle", name: "Bundle" },
  { id: "dozen", name: "Dozen" },
  { id: "six_pack", name: "6-Pack" },
  { id: "twelve_pack", name: "12-Pack" },
  { id: "box", name: "Box" },
  { id: "carton", name: "Carton" },
  { id: "case", name: "Case" },
  { id: "keg", name: "Keg" },
  { id: "g", name: "Gram" },
  { id: "kg", name: "Kilogram" },
  { id: "ml", name: "Millilitre" },
  { id: "l", name: "Litre" },
];

// Joi Validation Schema (only for registered fields)
const itemSchema = Joi.object({
  item_name: Joi.string().min(2).max(100).required().label("Name").messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name cannot be empty.",
    "string.min": "Name should have at least 2 characters.",
    "string.max": "Name should not exceed 100 characters.",
    "any.required": "Name is a required field.",
  }),

  category_id: Joi.any()
    .allow(null) // Allow null
    .optional() // Make it optional
    .label("Category")
    .messages({
      "any.base": "Category is not valid.",
      "any.required": "Category is a required field.",
    }),

  buying_price: Joi.number().min(0).required().label("Buying Price").messages({
    "number.base": "Buying Price must be a valid number.",
    "number.min": "Buying Price must be greater than or equal to 0.",
    "any.required": "Buying Price is a required field.",
  }),

  selling_price: Joi.number()
    .min(0)
    .required()
    .label("Selling Price")
    .messages({
      "number.base": "Selling Price must be a valid number.",
      "number.min": "Selling Price must be greater than or equal to 0.",
      "any.required": "Selling Price is a required field.",
    }),

  uom: Joi.string().required().label("uom").messages({
    "any.base": "Category is not valid.",
    "any.required": "Category is a required field.",
  }),

  tracks_stock: Joi.boolean().required().label("Track Stock").messages({
    "boolean.base": "Track Stock must be true or false.",
    "any.required": "Track Stock is a required field.",
  }),

  stock: Joi.when("tracks_stock", {
    is: true,
    then: Joi.number().min(0).required().label("Stock").messages({
      "number.base": "Stock must be a valid number.",
      "number.min": "Stock must be greater than or equal to 0.",
      "any.required": "Stock is required when tracking stock.",
    }),
    otherwise: Joi.number().allow(0),
  }).label("Stock"),

  low_stock_threshold: Joi.when("tracks_stock", {
    is: true,
    then: Joi.number().min(0).required().label("Alert when stock is").messages({
      "number.base": "Value must be a valid number.",
      "number.min": "Value must be greater than or equal to 0.",
      "any.required": "Value is required when tracking stock.",
    }),
    otherwise: Joi.number().allow(0),
  }).label("Alert when stock is"),
});

type FormData = {
  item_name: string;
  category_id?: string;
  buying_price: number;
  selling_price: number;
  low_stock_threshold: number;
  uom: string;
  tracks_stock: boolean;
  stock: number;
};

const ItemForm: React.FC<ItemFormProps> = ({
  item,
  loading,
  onSave,
  onClose,
}) => {
const [categories, setCategories] = useState([])


  const methods = useForm<FormData>({
    resolver: joiResolver(itemSchema),
    defaultValues: {
      item_name: item.item_name || "",
      category_id: item.category_id,
      buying_price: item.buying_price || 0,
      selling_price: item.selling_price || 0,
      uom: item.uom,
      tracks_stock: item.tracks_stock || false,
      low_stock_threshold: item.low_stock_threshold || 0,
      stock: item.stock || 0,
    },
  });

  const {
    handleSubmit,
    register,
    watch,
    reset,
    setValue,
    formState: { errors},
  } = methods;

  const tracks_stock = watch("tracks_stock");
  const selectedUOM = watch("uom");
  const selectedCategoryId = watch("category_id");

  useEffect(() =>{
    const fetchCategories = async () => {
      const response = await api.get("/api/categories");
      const categories = response.data.data;
      setCategories(categories)
    };
    fetchCategories()
},[])
  // Reset form and state when item changes
  useEffect(() => {
    reset({
      item_name: item.item_name || "",
      category_id: item.category_id,
      buying_price: item.buying_price || 0,
      selling_price: item.selling_price || 0,
      uom: item.uom || "",
      tracks_stock: item.tracks_stock || false,
      stock: item.stock || 0,
      low_stock_threshold: item.low_stock_threshold || 0,
    });
  }, [item, reset]);

  

  // const fetchCategories = async (inputValue: string) => {
  //   const response = await api.get("/api/categories", {
  //     params: { search: inputValue },
  //   });

  //   const categories = response.data.data;

  //   return categories.map((category: any) => ({
  //     value: category.id,
  //     label: category.category_name,
  //   }));
  // };

  // const loadCategories = (
  //   inputValue: string,
  //   callback: (options: any[]) => void
  // ) => {
  //   setTimeout(async () => {
  //     const options = await fetchCategories(inputValue);
  //     console.log(options);
  //     callback(options);
  //   }, 500); // optional: faster search
  // };

  const onSubmit = (data: FormData) => {
    onSave(data);
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
                  error={errors.item_name?.message}
                />
<div className="mt-3 flex gap-3">
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
                  register={register("selling_price", { valueAsNumber: true })}
                  error={errors.selling_price?.message}
                  />
                </div>
                <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                I sell  this item as a{" "}
                              <span className="text-red-500">* :</span>
                            </label>
                
                <Select
                  options={uoms.map((uom) => ({
                    value: uom.id,
                    label: uom.name,
                  }))}
                  value={uoms
                    .map((uom) => ({ value: uom.id, label: uom.name }))
                    .find((opt) => opt.value === selectedUOM)}
                  onChange={(option) => setValue("uom", option?.value || 0)}
                  placeholder="Unit of Masure"
                
                />
                {errors.category_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.uom.message}
                  </p>
                )}
                </div>
                <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Category:
                            </label>
               
                <Select
                    options={categories.map((cat) => (
                   {
                    value: cat.id,
                    label: cat.category_name,
                  }))}
                  value={categories
                    .map((cat) => ({ value: cat.id, label: cat.category_name }))
                    .find((opt) => opt.value === selectedCategoryId)}
                  onChange={(option) =>
                    setValue("category_id", option?.value || 0)
                  }
               
                  placeholder="Category"
                 
                  />
                   </div>
                {errors.category_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.category_id.message}
                  </p>
                )}
              </div>
            </div>

            {/* Inventory Section */}
            <div className="border rounded-md p-4  mt-6 border-neutral-300 dark:border-neutral-600">
              <h3 className="text-lg font-semibold mb-3 text-neutral-700 dark:text-neutral-300">
                Inventory
              </h3>
              <checkbox
                id="tracks_stock"
                label="Track Stock"
                register={register("tracks_stock")}
                className="mb-6"
              />

              {tracks_stock && (
                <div className="flex flex-col md:flex-row gap-3">
                  <FloatingInput
                    id="stock"
                    label="In Stock"
                    required
                    type="number"
                    register={register("stock", { valueAsNumber: true })}
                    error={errors.stock?.message}
                  />

                  <FloatingInput
                    id="low_stock_threshold"
                    label="Alert when stock is"
                    required
                    type="number"
                    register={register("low_stock_threshold", {
                      valueAsNumber: true,
                    })}
                    error={errors.low_stock_threshold?.message}
                  />
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2">
              <NeutralButton onClick={onClose} disabled={loading}>
                Cancel
              </NeutralButton>
              <PrimaryButton loading={loading} disabled={loading}>
                Save
              </PrimaryButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ItemForm;
