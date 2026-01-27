"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils/helpers";
import { Item } from "@/types/report";
import { joiResolver } from "@hookform/resolvers/joi";
import clsx from "clsx";
import Joi from "joi";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import toast from "react-hot-toast";
import AsyncSelect from "react-select/async";

interface Ingredient {
  item_id: string;
  item_name: string;
  quantity: number;
  quantity_units: { code: string; code_name: string };
  cost: number;
}

interface FormData {
  yield_quantity: number;
  yield_unit: { code: string; code_name: string } | null;
  ingredients: Ingredient[];
  description: string;
}

const recipeSchema = Joi.object({
  yield_quantity: Joi.number()
    .min(1)
    .required()
    .label("Yield Quantity")
    .messages({
      "number.base": "Yield Quantity must be a valid number.",
      "number.min": "Yield Quantity must be at least 1.",
      "any.required": "Yield Quantity is required.",
    }),
  yield_unit: Joi.object({
    code: Joi.string().required(),
    code_name: Joi.string().required(),
  })
    .required()
    .label("Yield Unit")
    .messages({
      "object.base": "Yield Unit is required.",
      "any.required": "Yield Unit is required.",
    }),
  ingredients: Joi.array()
    .items(
      Joi.object({
        item_id: Joi.string().uuid().required().label("Item"),
        item_name: Joi.string().required().label("Item Name"),
        quantity: Joi.number().min(0).required().label("Quantity"),
        quantity_units: Joi.object({
          code: Joi.string().required(),
          code_name: Joi.string().required(),
        }).required(),
        cost: Joi.number().min(0).required().label("Cost"),
      })
    )
    .min(1)
    .required()
    .label("Ingredients")
    .messages({
      "array.min": "At least one ingredient is required.",
      "any.required": "Ingredients are required.",
    }),
  description: Joi.string().allow("").optional().label("description"),
}).options({ stripUnknown: true });

const RecipeForm = () => {
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [recipe, setRecipe] = useState<Item | null>(null);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: joiResolver(recipeSchema),
    defaultValues: {
      yield_quantity: 1,
      yield_unit: null,
      ingredients: [
        {
          item_id: "",
          item_name: "",
          quantity: 0,
          quantity_units: { code: "", code_name: "" },
          cost: 0,
        },
      ],
      description: "",
    },
  });

  const {
    handleSubmit,
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id) {
          const itemResponse = await api.get(endpoints.getRecipe(id?.[0]));
          const recipeData = itemResponse.data.data;
          setRecipe(recipeData);
          setSellingPrice(parseFloat(recipeData?.selling_price));
          setValue("yield_unit", recipeData.quantity_units || null);

          if (recipeData) {
            setValue("yield_quantity", recipeData.yield_qty || 1);

            setValue(
              "ingredients",
              recipeData.ingredients?.length > 0
                ? recipeData.ingredients
                : [
                    {
                      item_id: "",
                      item_name: "",
                      quantity: 0,
                      quantity_units: { code: "", code_name: "" },
                      cost: 0,
                    },
                  ]
            );

            setValue("description", recipeData.recipe_description || "");
          }
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, setValue]);

  const loadItems = async (inputValue: string) => {
    if (!inputValue) return;
    try {
      const response = await api.get(endpoints.getIngredient, {
        params: { search: inputValue },
      });

      return response?.data?.data?.map((item: Item) => ({
        value: item.id,
        label: item.item_name,
        item,
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const handleAddIngredient = () => {
    append({
      item_id: "",
      item_name: "",
      quantity: 0,
      quantity_units: { code: "", code_name: "" },
      cost: 0,
    });
  };

  const handleDeleteRecipe = async () => {
    if (recipe?.recipe_id) {
      setOperationLoading(true);
      try {
        await api.delete(endpoints.deleteRecipe(recipe.recipe_id));
        toast.success("Recipe deleted.");
        router.push(routes.recipes);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to delete recipe"
        );
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleSaveRecipe = async (data: FormData) => {
    setOperationLoading(true);

    try {
      const payload = {
        item_id: id?.[0],
        recipe_name: recipe?.item_name,
        yield_qty: data.yield_quantity,
        yield_unit: data.yield_unit,
        ingredients: data.ingredients.map((ing) => ({
          item_id: ing.item_id,
          ingredient_qty: ing.quantity,
        })),
        recipe_description: data.description,
      };

      if (recipe?.recipe_id) {
        await api.patch(endpoints.updateRecipe(recipe.recipe_id), payload);
        toast.success("Recipe updated.");
      } else {
        await api.post(endpoints.createRecipe, payload);
        toast.success("Recipe created.");
      }
      router.push(routes.recipes);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save recipe.");
    } finally {
      setOperationLoading(false);
      setIsConfirmSubmitOpen(false);
    }
  };

  const yield_quantity = watch("yield_quantity");
  const ingredients = watch("ingredients");

  // Calculate unit cost and margin
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const unitCost = yield_quantity > 0 ? totalCost / yield_quantity : 0;
  const unitMargin = sellingPrice - unitCost || 0;

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission
      resource="recipes"
      action={id ? "update" : "create"}
      isPage={true}
    >
      <BreadcrumbWithActions
        label={id ? "Edit Recipe" : "Add Recipe"}
        breadcrumbs={[
          { name: "Production", onClick: () => router.push(routes.production) },
          { name: "Recipes", onClick: () => router.push(routes.recipes) },
          {
            name: id ? recipe?.item_name || "Edit Recipe" : "Add New Recipe",
          },
        ]}
        actions={[
          {
            title: "Save Recipe",
            onClick: handleSubmit((data) => setIsConfirmSubmitOpen(true)),
            disabled: operationLoading,
            resource: "recipes",
            action: id ? "update" : "create",
          },
        ]}
      />
      <div className="bg-white dark:bg-neutral-800 p-4 m-1 flex justify-center">
        <FormProvider {...methods}>
          <form className="w-full space-y-4 max-w-[460px]">
            {/* Expected Yield */}
            <div>
              <div className="flex gap-2 justify-between">
                <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
                  Expected Yield
                </h2>
                {recipe?.recipe_id && (
                  <Permission resource="recipes" action="delete">
                    <div
                      onClick={(e: any) => {
                        e.preventDefault();
                        setIsConfirmDeleteOpen(true);
                      }}
                      className="font-semibold text-sm text-red-700 dark:text-red-400  mb-3 cursor-pointer"
                    >
                      Delete Recipe
                    </div>
                  </Permission>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <div className="max-w-xs">
                  <label
                    htmlFor="yield_quantity"
                    className="block w-20  text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="yield_quantity"
                    type="number"
                    min={1}
                    max={999}
                    {...register("yield_quantity", { valueAsNumber: true })}
                    className="p-2 w-20 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                  />
                  {errors.yield_quantity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.yield_quantity.message}
                    </p>
                  )}
                </div>
                <div className="max-w-xs">
                  <label
                    htmlFor="yield_unit"
                    className="block w-20  text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Unit
                  </label>
                  <input
                    id="yield_unit"
                    readOnly
                    value={recipe?.quantity_units?.code_name || ""}
                    className="w-20  p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-900 dark:text-neutral-200 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                Ingredients
              </h2>
              <div className="space-y-4 mt-2 w-full">
                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <div className="text-xs text-start font-medium text-neutral-800 dark:text-neutral-200">
                    Item
                  </div>
                  <div className="text-xs text-start font-medium text-neutral-800 dark:text-neutral-200 w-12 md:w-16 ">
                    Qty
                  </div>
                  <div className="text-xs text-start w-12 md:w-16 font-medium text-neutral-800 dark:text-neutral-200 ">
                    Unit
                  </div>
                  <div className="text-xs text-start w-12 md:w-16 font-medium text-neutral-800 dark:text-neutral-200 ">
                    Cost
                  </div>
                  <div className="text-xs text-start font-medium text-neutral-800 dark:text-neutral-200 "></div>
                </div>
              </div>
              <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 items-center"
                  >
                    <div>
                      <Controller
                        name={`ingredients.${index}.item_id`}
                        control={control}
                        render={({ field }) => (
                          <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadItems}
                            value={
                              ingredients[index]?.item_id
                                ? {
                                    value: ingredients[index].item_id,
                                    label: ingredients[index].item_name,
                                  }
                                : null
                            }
                            onChange={(option) => {
                              if (option) {
                                setValue(
                                  `ingredients.${index}.item_id`,
                                  option.value
                                );
                                setValue(
                                  `ingredients.${index}.item_name`,
                                  option.item.item_name
                                );
                                setValue(
                                  `ingredients.${index}.quantity_units`,
                                  option.item.quantity_units
                                );
                                setValue(
                                  `ingredients.${index}.buying_price`,
                                  option.item.buying_price || 0
                                );
                                setValue(
                                  `ingredients.${index}.selling_price`,
                                  option.item.selling_price || 0
                                );
                                setValue(
                                  `ingredients.${index}.quantity`,
                                  ingredients[index].quantity || 1
                                );
                                setValue(
                                  `ingredients.${index}.cost`,
                                  (option.item.buying_price || 0) *
                                    (ingredients[index].quantity || 1)
                                );
                              } else {
                                setValue(`ingredients.${index}.item_id`, "");
                                setValue(`ingredients.${index}.item_name`, "");
                                setValue(
                                  `ingredients.${index}.quantity_units`,
                                  {
                                    code: "",
                                    code_name: "",
                                  }
                                );
                                setValue(
                                  `ingredients.${index}.buying_price`,
                                  0
                                );
                                setValue(
                                  `ingredients.${index}.selling_price`,
                                  0
                                );
                                setValue(`ingredients.${index}.quantity`, 0);
                                setValue(`ingredients.${index}.cost`, 0);
                              }
                            }}
                            placeholder="Search item"
                            className="my-react-select-container text-sm"
                            classNamePrefix="my-react-select"
                            isClearable
                          />
                        )}
                      />
                      {errors.ingredients?.[index]?.item_id && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.ingredients[index].item_id.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        id={`ingredients.${index}.quantity`}
                        type="number"
                        min={1}
                        max={999}
                        placeholder="Enter qty"
                        {...register(`ingredients.${index}.quantity`, {
                          valueAsNumber: true,
                          onChange: (e) => {
                            const qty = parseFloat(e.target.value) || 1;
                            const buyingPrice = ingredients[index]?.cost || 0;
                            setValue(
                              `ingredients.${index}.cost`,
                              qty * buyingPrice
                            );
                          },
                        })}
                        className="w-12 md:w-16 p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                      />
                      {errors.ingredients?.[index]?.quantity && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.ingredients[index].quantity.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        id={`ingredients.${index}.quantity_units`}
                        readOnly
                        placeholder="Unit"
                        value={
                          ingredients[index]?.quantity_units?.code_name || ""
                        }
                        className="w-12 md:w-16 p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-900 dark:text-neutral-200 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <input
                        id={`ingredients.${index}.cost`}
                        readOnly
                        placeholder="Cost"
                        value={formatNumber(ingredients[index]?.cost || 0)}
                        className="w-12 md:w-16 p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-900 dark:text-neutral-200 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(index)}
                        className=""
                        disabled={operationLoading || fields.length === 1}
                        aria-label="Remove ingredient"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-600 dark:text-neutral-100" />
                      </button>
                    </div>
                  </div>
                ))}
                {errors.ingredients && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.ingredients.message}
                  </p>
                )}
                <Permission resource="recipes" action="update">
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-4 py-2 border border-primary rounded text-primary text-sm font-semibold"
                    disabled={operationLoading}
                  >
                    Add Ingredient
                  </button>
                </Permission>
              </div>
            </div>
            <div className="w-full border-t border-neutral-200 dark:border-neutral-600"></div>
            {/* Unit Cost and Margin */}
            <div className="flex w-full justify-end pr-6">
              <div className="flex flex-col gap-2 max-w-md">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="unit_cost"
                    className="w-20 text-sm font-semibold text-neutral-900 dark:text-neutral-200 truncate"
                  >
                    Unit Cost:
                  </label>
                  <input
                    id="unit_cost"
                    readOnly
                    value={formatNumber(Math.round(unitCost))}
                    className="w-20 p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-900 dark:text-neutral-200 cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="unit_margin"
                    className="w-20 text-sm font-semibold text-neutral-900 dark:text-neutral-200 truncate"
                  >
                    Unit Margin:
                  </label>
                  <input
                    id="unit_margin"
                    readOnly
                    value={formatNumber(Math.round(unitMargin))}
                    className="w-20 p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-900 dark:text-neutral-200 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                Instructions
              </h2>
              <div className="w-full mt-2">
                <textarea
                  id="description"
                  {...register("description")}
                  className="w-full p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                  rows={4}
                  placeholder="Enter recipe description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Permission
                resource="recipes"
                action={recipe?.recipe_id ? "update" : "create"}
              >
                <button
                  type="button"
                  onClick={handleSubmit((data) => setIsConfirmSubmitOpen(true))}
                  disabled={operationLoading}
                  className={clsx(
                    "px-4 py-2 bg-primary text-white text-sm font-semibold rounded",
                    "disabled:cursor-not-allowed"
                  )}
                >
                  Save Recipe
                </button>
              </Permission>
            </div>
          </form>
        </FormProvider>

        {isConfirmSubmitOpen && (
          <ConfirmDialog
            title="Confirm Recipe Changes"
            message={
              <div>
                These changes will immediately affect how stock quantities are
                deducted.
              </div>
            }
            confirmLabel="Save"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleSubmit(handleSaveRecipe)}
            onCancel={() => setIsConfirmSubmitOpen(false)}
          />
        )}

        {isConfirmDeleteOpen && (
          <ConfirmDialog
            title="Delete Recipe"
            message={
              <div className="space-y-2 text-sm leading-relaxed text-neutral-900 dark:text-neutral-200">
                Are you sure you want to delete this recipe?
              </div>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleSubmit(handleDeleteRecipe)}
            onCancel={() => setIsConfirmDeleteOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default RecipeForm;
