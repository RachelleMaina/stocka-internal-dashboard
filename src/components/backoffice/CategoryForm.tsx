"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import FloatingInput from "../common/FloatingInput";
import { Category } from "../../types/category";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import Select from "react-select";


interface CategoryFormProps {
  category: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
  loading: boolean;
}

const colorOptions = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#0EA5E9", // Sky
  "#D946EF", // Fuchsia
];

const categorySchema = Joi.object({
  category_name: Joi.string().min(2).max(100).required().label("Name"),
  color_hex: Joi.string().required().label("Color"),
  parent_category_id: Joi.string()
    .allow(null)
    .optional()
    .label("Parent Category"),
  sort_order: Joi.number().integer().min(0).optional().label("Sort Order"),
});



const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSave,
  onClose,
  loading
}) => {
  const [parentCategories, setParentCategories] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "None" }]);

  const methods = useForm<Category>({
    resolver: joiResolver(categorySchema),
    defaultValues: {
      category_name: category?.category_name || "",
      color_hex: category?.color_hex || colorOptions[0],
      parent_category_id: category?.parent_category_id || null,
      sort_order: category?.sort_order || 0,
    },
  });

  const { handleSubmit, setValue, watch, reset, formState } = methods;
  const selectedColor = watch("color_hex");


  useEffect(() => {
    reset({
      category_name: category?.category_name || "",
      color_hex: category?.color_hex || colorOptions[0],
      parent_category_id: category?.parent_category_id || null,
      sort_order: category?.sort_order || 0,
    });
  }, [category, reset]);

  const onSubmit = (data: Category) => {
    onSave({
      ...category,
      category_name: data.category_name,
      color_hex: data.color_hex,
      parent_category_id: data.parent_category_id || null,
      sort_order: data.sort_order,
    });
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 p-6 m-3 rounded-lg w-full max-w-md shadow-lg">
        <ModalHeader
          title={category?.id ? "Edit Category" : "Add Category"}
          onClose={onClose}
        />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FloatingInput
              id="category_name"
              label="Category Name"
              required
              register={methods.register("category_name")}
              backgroundClass="bg-white dark:bg-neutral-800"
              error={formState.errors.name?.message}
            />
            {/* <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Parent Category (optional)
              </label>
              <Select
                options={parentCategories}
                value={parentCategories.find(
                  (option) =>
                    option.value === watch("parent_category_id") ||
                    (!watch("parent_category_id") && option.value === "")
                )}
                onChange={(option) =>
                  setValue("parent_category_id", option?.value || null)
                }
                className="text-sm"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "transparent",
                    borderColor: "#d1d5db",
                    "&:hover": { borderColor: "#9ca3af" },
                    boxShadow: "none",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#1f2937"
                        : "#ffffff",
                    zIndex: 50,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? document.documentElement.classList.contains("dark")
                        ? "#374151"
                        : "#e5e7eb"
                      : document.documentElement.classList.contains("dark")
                      ? "#1f2937"
                      : "#ffffff",
                    color: document.documentElement.classList.contains("dark")
                      ? "#d1d5db"
                      : "#1f2937",
                    "&:hover": {
                      backgroundColor:
                        document.documentElement.classList.contains("dark")
                          ? "#374151"
                          : "#f3f4f6",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains("dark")
                      ? "#d1d5db"
                      : "#1f2937",
                  }),
                }}
              />
              {formState.errors.parent_category_id && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.parent_category_id.message}
                </p>
              )}
            </div> */}
            {/* <FloatingInput
              id="sort_order"
              label="Sort Order (optional)"
              type="number"
              register={methods.register("sort_order")}
              error={formState.errors.sort_order?.message}
            /> */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-9 h-9 rounded-full border-2 transition 
                      ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-black dark:ring-white"
                          : "border-gray-300"
                      }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setValue("color_hex", color)}
                  />
                ))}
              </div>
              {formState.errors.color_hex && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.color_hex.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <NeutralButton onClick={onClose} disabled={loading}>Cancel</NeutralButton>
              <PrimaryButton loading={loading} disabled={loading}>Save</PrimaryButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default CategoryForm;
