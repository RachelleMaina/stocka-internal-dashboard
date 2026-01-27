"use client";

import PageSkeleton from "@/components/common/PageSkeleton";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import {
  Package,
  Warehouse,
  Percent,
  Store,
  AlertTriangle,
  Copy,
  Plus,
  ChefHat,
  ShoppingCart,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";
import clsx from "clsx";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import FloatingInput from "@/components/common/FloatingInput";
import { routes } from "@/constants/routes";
import { Item } from "@/types/report";
import { Category } from "@/types/category";
import { Uom } from "@/types/item";
import { taxTypes } from "@/data/kraDataTypes";
import { formatNumber } from "@/lib/utils/helpers";
import { Permission } from "@/components/common/Permission";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CategoryForm from "@/components/backoffice/CategoryForm";
import UomForm from "@/components/backoffice/UomForm";

interface UomConfig {
  id: string;
  quantity_units: { code: string; code_name: string };
  packaging_units: { code: string; code_name: string };
  conversion_factor: number;
}

interface StoreLocationData {
  store_location_id: string;
  quantity: number;
}

interface FormData {
  item_name: string;
  category_id?: string;
  buying_price: number;
  selling_price: number;
  quantity_units: {
    code: string;
    code_name: string;
  } | null;
  product_code: string;
  product_type: { code: string; code_name: string };
  tax_type: {
    code: string;
    code_name: string;
    code_description: string;
  } | null;
  tracks_stock: boolean;
  low_stock_threshold: number;
  store_locations: StoreLocationData[];
  is_made_here: boolean;
  is_sold: boolean;
  is_sold_by_unit: boolean;
  is_sold_by_value: boolean;
}

const itemSchema = Joi.object({
  item_name: Joi.string().min(2).max(100).required().label("Name").messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "string.min": "Name should have at least 2 characters.",
    "string.max": "Name should not exceed 100 characters.",
    "any.required": "Name is required.",
  }),
  category_id: Joi.string()
    .uuid()
    .allow(null)
    .optional()
    .label("Category")
    .messages({
      "string.uuid": "Category must be a valid UUID.",
    }),
  buying_price: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .label("Buying Price")
    .custom((value, helpers) => {
      const strValue = value.toString().replace(".", "");
      if (strValue.length > 10) {
        return helpers.error("number.maxDigits", { limit: 10 });
      }
      return value;
    })
    .messages({
      "number.base": "Buying Price must be a valid number.",
      "number.min": "Buying Price must be greater than or equal to 0.",
      "number.precision": "Buying Price can have up to 2 decimal places.",
      "number.maxDigits": "Buying Price cannot exceed 10 digits.",
      "any.required": "Buying Price is required.",
    }),
  selling_price: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .label("Selling Price")
    .custom((value, helpers) => {
      const strValue = value.toString().replace(".", "");
      if (strValue.length > 10) {
        return helpers.error("number.maxDigits", { limit: 10 });
      }
      return value;
    })
    .messages({
      "number.base": "Selling Price must be a valid number.",
      "number.min": "Selling Price must be greater than or equal to 0.",
      "number.precision": "Selling Price can have up to 2 decimal places.",
      "number.maxDigits": "Selling Price cannot exceed 10 digits.",
      "any.required": "Selling Price is required.",
    }),
  quantity_units: Joi.object({
    code: Joi.string().optional().label("Unit Code"),
    code_name: Joi.string().optional().label("Unit Name"),
    code_description: Joi.string()
      .allow("")
      .optional()
      .label("Unit Description"),
    is_custom: Joi.boolean().optional(),
  })
    .unknown(true)
    .custom((value, helpers) => {
      if (
        !value ||
        typeof value !== "object" ||
        Object.keys(value).length === 0
      ) {
        return helpers.error("object.min");
      }
      return value;
    })
    .required()
    .label("Units")
    .messages({
      "object.base": "Unit of measure is required.",
      "object.min": "Unit of measure cannot be empty.",
      "any.required": "Unit of measure is required.",
    }),
  product_code: Joi.string()
    .max(50)
    .allow("")
    .optional()
    .label("Product Code")
    .messages({
      "string.max": "Product Code should not exceed 50 characters.",
    }),
  product_type: Joi.object({
    code: Joi.string().required(),
    code_name: Joi.string().required(),
  })
    .default({ code: "2", code_name: "Finished Product" })
    .label("Product Type"),
  tax_type: Joi.object({
    code: Joi.string().optional().label("Tax Code"),
    code_name: Joi.string().optional().label("Tax Name"),
    code_description: Joi.string().optional().label("Tax Description"),
  })
    .unknown(true)
    .custom((value, helpers) => {
      if (value === null) return value;
      if (typeof value !== "object" || Object.keys(value).length === 0) {
        return helpers.error("object.min");
      }
      return value;
    })
    .required()
    .label("Tax Type")
    .messages({
      "object.base": "Tax type is required.",
      "object.min": "Tax type cannot be empty.",
    }),
  tracks_stock: Joi.boolean().required().label("Track Stock").messages({
    "boolean.base": "Track Stock must be true or false.",
    "any.required": "Track Stock is required.",
  }),
  low_stock_threshold: Joi.when("tracks_stock", {
    is: true,
    then: Joi.number().integer().min(0).required().label("Low Stock Threshold"),
    otherwise: Joi.number().integer().allow(0),
  }).messages({
    "number.base": "Low Stock Threshold must be a valid number.",
    "number.integer": "Low Stock Threshold must be an integer.",
    "number.min": "Low Stock Threshold must be greater than or equal to 0.",
    "any.required": "Low Stock Threshold is required when tracking stock.",
  }),
  store_locations: Joi.array()
    .items(
      Joi.object({
        store_location_id: Joi.string()
          .uuid()
          .required()
          .label("Store Location ID"),
        quantity: Joi.number().integer().allow(0),
      })
    )
    .optional()
    .label("Store Locations"),
  is_made_here: Joi.boolean().required().label("Made Here").messages({
    "boolean.base": "Made Here must be true or false.",
    "any.required": "Made Here is required.",
  }),
  is_sold: Joi.boolean().required().label("Is Sold").messages({
    "boolean.base": "Is Sold must be true or false.",
    "any.required": "Is Sold is required.",
  }),
  is_sold_by_unit: Joi.boolean().required().label("Is Sold By Unit").messages({
    "boolean.base": "Is Sold By Unit must be true or false.",
    "any.required": "Is Sold By Unit is required.",
  }),
  is_sold_by_value: Joi.boolean().required().label("Is Sold By Value").messages({
    "boolean.base": "Is Sold By Value must be true or false.",
    "any.required": "Is Sold By Value is required.",
  }),
}).options({ stripUnknown: true });

const ItemForm = () => {
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<
    { id: string; category_name: string }[]
  >([]);
  const [uomConfigs, setUomConfigs] = useState<UomConfig[]>([]);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isUomFormOpen, setIsUomFormOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [newCategory, setNewCategory] = useState<Category | null>(null);
  const [newUom, setNewUom] = useState<Uom | null>(null);

  const [payload, setPayload] = useState({});
  const { business_profile } = useAppState();
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const defaultStoreLocations = useMemo(
    () =>
      business_profile?.map((location) => ({
        store_location_id: location.store_location_id || location.id,
        quantity: 0,
      })) || [],
    [business_profile]
  );

  const methods = useForm<FormData>({
    resolver: joiResolver(itemSchema),
    defaultValues: {
      item_name: "",
      category_id: undefined,
      buying_price: 0,
      selling_price: 0,
      quantity_units: null,
      product_code: "",
      product_type: { code: "2", code_name: "Finished Product" },
      tax_type: null,
      tracks_stock: false,
      low_stock_threshold: 0,
      store_locations: defaultStoreLocations,
      is_made_here: false,
      is_sold: true,
      is_sold_by_unit: true,
      is_sold_by_value: false,
    },
  });

  const {
    handleSubmit,
    register,
    watch,
    reset,
    control,
    setValue,
    formState: { errors },
    getValues,
  } = methods;

  const tracks_stock = watch("tracks_stock");
  const store_locations = watch("store_locations");
  const is_sold_by_value = watch("is_sold_by_value");
  const selectedUomConfigId = watch("quantity_units")?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catResponse = await api.get("/api/categories");
        setCategories(catResponse.data.data);

        const uomResponse = await api.get("/api/uoms");
        setUomConfigs(uomResponse.data.data);

        if (id) {
          const itemResponse = await api.get(`/api/items/${id}`);
          const itemData = itemResponse.data.data;
          setItem(itemData);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!item) return;

    reset({
      item_name: item.item_name || "",
      category_id: item.category_id || undefined,
      buying_price: item.buying_price || 0,
      selling_price: item.selling_price || 0,
      quantity_units: item.quantity_units || null,
      product_code: "",
      product_type: item.product_type || {
        code: "2",
        code_name: "Finished Product",
      },
      tax_type: item.tax_type || null,
      tracks_stock: item.tracks_stock || false,
      low_stock_threshold: item.low_stock_threshold || 0,
      store_locations: defaultStoreLocations,
      is_made_here: item.is_made_here || false,
      is_sold: item.is_sold || true,
      is_sold_by_unit: item.is_sold_by_unit || true,
      is_sold_by_value: item.is_sold_by_value || false,
    });
  }, [item, reset, defaultStoreLocations]);

  useEffect(() => {
    // Toggle is_sold_by_unit based on is_sold_by_value
    setValue("is_sold_by_unit", !is_sold_by_value);
  }, [is_sold_by_value, setValue]);

  const handleSaveCategory = async (category: Category) => {
    setOperationLoading(true);
    try {
      const response = await api.post("/api/categories", category);
      const newCategory = response.data.data;
   
      setCategories((prev) => [...prev, newCategory]);
      setValue("category_id", newCategory.id);
      toast.success("Category created.");
      setIsCategoryFormOpen(false);
      setNewCategory(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create category");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSaveUom = async (uom: Uom) => {
    setOperationLoading(true);
    try {
      const response = await api.post("/api/uoms", uom);
      const newUom = response.data.data;
      setUomConfigs((prev) => [...prev, newUom]);
      setValue("quantity_units", {
        code: newUom.quantity_units.code,
        code_name: newUom.quantity_units.code_name,
        uom: newUom,
      });
      toast.success("UOM created.");
      setIsUomFormOpen(false);
      setNewUom(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create UOM");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSaveItem = async (data?: any, confirmAction: string) => {
    const values = id ? payload : data;
    setOperationLoading(true);
    try {
      if (id) {
        await api.patch(`/api/items/${id}`, values);
        toast.success("Item updated.");
      } else {
        await api.post(`/api/items`, values);
        toast.success("Item created.");
      }

      if (confirmAction === "saveAndAdd") {
        reset({
          item_name: "",
          category_id: undefined,
          buying_price: 0,
          selling_price: 0,
          quantity_units: null,
          product_code: "",
          product_type: { code: "2", code_name: "Finished Product" },
          tax_type: null,
          tracks_stock: false,
          low_stock_threshold: 0,
          store_locations: defaultStoreLocations,
          is_made_here: false,
          is_sold: true,
          is_sold_by_unit: true,
          is_sold_by_value: false,
        });
      } else if (confirmAction === "duplicate") {
        const currentValues = getValues();
        reset({
          ...currentValues,
          item_name: "",
          product_code: "",
        });
      } else {
        router.push(routes.itemsList);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save item.");
    } finally {
      setOperationLoading(false);
      setIsConfirmSubmitOpen(false);
    }
  };

  const handleConfirmSubmit =
    (action: "save" | "saveAndAdd" | "duplicate") => async (data: FormData) => {
      const payload = {
        ...data,
        category_id: data.category_id || null,
        store_locations:
          data.store_locations.length > 0 ? data.store_locations : undefined,
        conversion_factor: data?.quantity_units?.conversion_factor || 1,
        packaging_units: data?.quantity_units?.packaging_units,
        quantity_units: data?.quantity_units?.quantity_units,
      };
      setPayload(payload);
      setConfirmAction(action);

      if (id) {
        setIsConfirmSubmitOpen(true);
      } else {
        await handleSaveItem(payload, action);
      }
    };

  const openAddCategoryForm = () => {
    setNewCategory({
      id: "",
      category_name: "",
      color_hex: "#A78BFA",
      parent_category_id: null,
      sort_order: 0,
    });
    setIsCategoryFormOpen(true);
  };

  const openAddUomForm = () => {
    setNewUom({
      id: "",
      quantity_units: { code: "", code_name: "" },
      packaging_units: { code: "", code_name: "" },
      conversion_factor: 1,
    });
    setIsUomFormOpen(true);
  };

  const selectedUomConfig = uomConfigs.find(
    (uom) => uom.id === selectedUomConfigId
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission
      resource="items"
      action={id ? "update" : "create"}
      isPage={true}
    >
      <div className="">
        <BreadcrumbWithActions
          label={id ? "Edit Item" : "Add Item"}
          breadcrumbs={[
            { name: "Items", onClick: () => router.push(routes.items) },
            {
              name: "Item List",
              onClick: () => router.push(routes.itemsList),
            },
            {
              name: id ? item?.item_name || "Edit Item" : "Add New Item",
            },
          ]}
          actions={[
            {
              title: "Save Changes",
              onClick: handleSubmit(handleConfirmSubmit("save")),
              disabled: operationLoading,
              resource: "items",
              action: id ? "update" : "create",
            },
          ]}
        />
        <div className="p-4 bg-white dark:bg-neutral-800">
          <FormProvider {...methods}>
            <form className="w-full max-w-[460px] md:w-full mx-auto space-y-4">
              {/* Product Details */}
              <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
                <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                  Product Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <FloatingInput
                        id="item_name"
                        label="Product Name"
                        required
                        register={register("item_name")}
                        error={errors.item_name?.message}
                        backgroundClass="bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FloatingInput
                        id="buying_price"
                        label="Buying Price"
                        required
                        type="text"
                        backgroundClass="bg-white dark:bg-neutral-800"
                        className="text-sm"
                        register={register("buying_price", {
                          setValueAs: (v) => {
                            const str = String(v).trim();
                            if (str === "") return undefined;
                            const parsed = parseFloat(str.replace(/,/g, ""));
                            return isNaN(parsed) ? undefined : parsed;
                          },
                          validate: {
                            isNumber: (v) =>
                              (typeof v === "number" && !isNaN(v)) ||
                              "Must be a valid number.",
                            hasTwoDecimals: (v) =>
                              /^\d+(\.\d{1,2})?$/.test(String(v)) ||
                              "Maximum 2 decimal places allowed.",
                          },
                        })}
                        error={errors.buying_price?.message}
                      />
                    </div>
                    <div>
                      <FloatingInput
                        id="selling_price"
                        label="Selling Price"
                        required
                        type="text"
                        backgroundClass="bg-white dark:bg-neutral-800"
                        className="text-sm"
                        register={register("selling_price", {
                          setValueAs: (v) => {
                            const str = String(v).trim();
                            if (str === "") return undefined;
                            const parsed = parseFloat(str.replace(/,/g, ""));
                            return isNaN(parsed) ? undefined : parsed;
                          },
                          validate: {
                            isNumber: (v) =>
                              (typeof v === "number" && !isNaN(v)) ||
                              "Must be a valid number.",
                            hasTwoDecimals: (v) =>
                              /^\d+(\.\d{1,2})?$/.test(String(v)) ||
                              "Maximum 2 decimal places allowed.",
                          },
                        })}
                        error={errors.selling_price?.message}
                      />
                    </div>
                  </div>
                </div>
              </section>
              {/* Category */}
              <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
                <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                  Category
                </h2>
                <div className="max-w-md space-y-2">
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={categories.map((cat) => ({
                          value: cat.id,
                          label: cat.category_name,
                        }))}
                        value={categories
                          .map((cat) => ({
                            value: cat.id,
                            label: cat.category_name,
                          }))
                          .find((opt) => opt.value === field.value)}
                        onChange={(option) =>
                          field.onChange(option?.value || null)
                        }
                        placeholder="Select Category"
                        className="my-react-select-container text-sm"
                        classNamePrefix="my-react-select"
                        isClearable
                      />
                    )}
                  />
                  {errors.category_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category_id.message}
                    </p>
                  )}
                </div>
                <Permission resource="categories" action="create">
                  <button
                    type="button"
                    onClick={openAddCategoryForm}
                    className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                    aria-label="Create new category"
                  >
                    <Plus className="w-4 h-4" />
                    Create a new category
                  </button>
                </Permission>
              </section>
              {/* Item Usage */}
              <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
                <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                  Item Usage
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_made_here"
                      {...register("is_made_here")}
                      className="h-5 w-5 text-primary accent-primary border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-800"
                    />
                    <label
                      htmlFor="is_made_here"
                      className="text-sm text-neutral-800 dark:text-neutral-200"
                    >
                      This item is made here (e.g., tots, cocktails, food)
                    </label>
                  </div>
                  {id && watch("is_made_here") && (
                    <Permission resource="recipes" action="update">
                      <button
                        type="button"
                        onClick={() => router.push(`${routes.recipesForm}/${id}`)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium w-fit bg-primary/20 text-primary dark:bg-primary/30 dark:text-white hover:underline"
                      >
                        Manage Recipe
                      </button>
                    </Permission>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_sold"
                      {...register("is_sold")}
                      className="h-5 w-5 text-primary accent-primary border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-800"
                    />
                    <label
                      htmlFor="is_sold"
                      className="text-sm text-neutral-800 dark:text-neutral-200"
                    >
                      This item is sold (i.e., not an ingredient)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_sold_by_value"
                      {...register("is_sold_by_value")}
                      className="h-5 w-5 text-primary accent-primary border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-800"
                    />
                    <label
                      htmlFor="is_sold_by_value"
                      className="text-sm text-neutral-800 dark:text-neutral-200"
                    >
                      This item is sold by value (e.g., weighed items)
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="tracks_stock"
                        {...register("tracks_stock")}
                        className="h-5 w-5 text-primary accent-primary border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-800"
                      />
                      <label
                        htmlFor="tracks_stock"
                        className="text-sm text-neutral-800 dark:text-neutral-200"
                      >
                        Track Stock
                      </label>
                    </div>
                    {tracks_stock && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="low_stock_threshold"
                            className="block text-sm text-neutral-800 dark:text-neutral-200 mb-1"
                          >
                            Alert when stock qty is:
                          </label>
                          <input
                            type="number"
                            id="low_stock_threshold"
                            {...register("low_stock_threshold", {
                              valueAsNumber: true,
                            })}
                            className="mt-1 p-2 block w-full rounded border-2 border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200"
                          />
                          {errors.low_stock_threshold && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.low_stock_threshold.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              {/* Packaging */}
              <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
                <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                  I Sell In <span className="text-red-500">*</span>
                </h2>
                <div className="max-w-md space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Controller
                        name="quantity_units"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={uomConfigs.map((uom) => ({
                              value: uom.quantity_units?.code,
                              label: uom.quantity_units?.code_name || "Unknown",
                              uom,
                            }))}
                            value={uomConfigs
                              .map((uom) => ({
                                value: uom.quantity_units?.code,
                                label: uom.quantity_units.code_name || "Unknown",
                                uom,
                              }))
                              .find((opt) => opt.value === field.value?.code)}
                            onChange={(option) =>
                              field.onChange(option?.uom || null)
                            }
                            placeholder="Select Unit of Measure"
                            className="my-react-select-container text-sm"
                            classNamePrefix="my-react-select"
                            isClearable
                          />
                        )}
                      />
                      {errors.quantity_units && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.quantity_units.message}
                        </p>
                      )}
                    </div>
                    <Permission resource="uoms" action="create">
                      <button
                        type="button"
                        onClick={openAddUomForm}
                        className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                        aria-label="Add New UOM"
                      >
                        <Plus className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      </button>
                    </Permission>
                  </div>
                  <Permission resource="uoms" action="create">
                    <button
                      type="button"
                      onClick={openAddUomForm}
                      className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                      aria-label="Create new uom"
                    >
                      <Plus className="w-4 h-4" />
                      Create a new UOM
                    </button>
                  </Permission>
                  {selectedUomConfig && (
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      {formatNumber(selectedUomConfig.conversion_factor)}{" "}
                      {selectedUomConfig.quantity_units?.code_name} = 1{" "}
                      {selectedUomConfig.packaging_units?.code_name}
                    </p>
                  )}
                </div>
              </section>
              {/* Tax Type */}
              <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
                <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                  Tax Type <span className="text-red-500">*</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <Controller
                      name="tax_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={taxTypes.map((tax) => ({
                            value: tax.code,
                            label: tax.code_name,
                            tax,
                          }))}
                          value={taxTypes
                            .map((tax) => ({
                              value: tax.code,
                              label: tax.code_name,
                              tax,
                            }))
                            .find((opt) => opt.value === field.value?.code)}
                          onChange={(option) =>
                            field.onChange(option ? option.tax : null)
                          }
                          placeholder="Select Tax Type"
                          className="my-react-select-container text-sm"
                          classNamePrefix="my-react-select"
                          isClearable
                        />
                      )}
                    />
                    {errors.tax_type && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.tax_type.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>
              {/* Where the item is sold */}
              <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
                <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                  Available at these locations:<span className="text-red-500">*</span>
                </h2>
                <div>
                  <Controller
                    name="store_locations"
                    control={control}
                    render={({ field }) => (
                      <Select
                        isMulti
                        options={business_profile?.map((location) => ({
                          value: location.store_location_id || location.id,
                          label:
                            location.store_location_name ||
                            location.location_name +
                              (location.is_default ? " (Main)" : ""),
                        }))}
                        value={business_profile
                          ?.filter((location) =>
                            field.value.some(
                              (stock) =>
                                stock.store_location_id ===
                                (location.store_location_id || location.id)
                            )
                          )
                          .map((location) => ({
                            value: location.store_location_id || location.id,
                            label:
                              location.store_location_name ||
                              location.location_name +
                                (location.is_default ? " (Main)" : ""),
                          }))}
                        onChange={(options) => {
                          const selectedIds = options.map((opt) => opt.value);
                          const updatedStoreLocations = selectedIds.map(
                            (id) => {
                              const existing = field.value.find(
                                (stock) => stock.store_location_id === id
                              );
                              return {
                                store_location_id: id,
                                quantity: existing?.quantity || 0,
                              };
                            }
                          );
                          field.onChange(updatedStoreLocations);
                        }}
                        placeholder="Select Store Locations"
                        className="my-react-select-container text-sm"
                        classNamePrefix="my-react-select"
                        isClearable
                      />
                    )}
                  />
                  {errors.store_locations && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.store_locations.message}
                    </p>
                  )}
                </div>
              </section>
              {/* Action Buttons */}
              <section className="p-4">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Permission
                    resource="items"
                    action={id ? "update" : "create"}
                  >
                    <button
                      type="button"
                      onClick={handleSubmit(handleConfirmSubmit("saveAndAdd"))}
                      disabled={operationLoading}
                      className={clsx(
                        "flex items-center justify-center gap-2 px-4 py-1.5 border-2 border-primary rounded text-primary text-sm font-medium",
                        "disabled:cursor-not-allowed dark:disabled:text-primary",
                        "sm:w-auto w-full"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      Save and Add Another
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit(handleConfirmSubmit("save"))}
                      disabled={operationLoading}
                      className={clsx(
                        "px-4 py-1.5 bg-primary text-white text-sm font-medium rounded",
                        "disabled:cursor-not-allowed",
                        "sm:w-auto w-full"
                      )}
                    >
                      Save Changes
                    </button>
                  </Permission>
                </div>
              </section>
            </form>
          </FormProvider>
        </div>
        {isConfirmSubmitOpen && (
          <ConfirmDialog
            title="Confirm Product Changes"
            message={
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1 text-red-700 dark:text-red-400" />
                <div className="space-y-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  <p>You&apos;re about to update this item.</p>
                  <p className="text-red-700 dark:text-red-400">
                    These changes will immediately affect how this item is
                    displayed and sold across all terminals.
                  </p>
                  <p>
                    Make sure you&apos;re not unintentionally overwriting
                    existing prices or labels used by cashiers.
                  </p>
                </div>
              </div>
            }
            confirmLabel={
              confirmAction === "saveAndAdd"
                ? "Save and Add Another"
                : confirmAction === "duplicate"
                ? "Duplicate"
                : "Save"
            }
            cancelLabel="Cancel"
            destructive
            onConfirm={handleSaveItem}
            onCancel={() => setIsConfirmSubmitOpen(false)}
          />
        )}
        {isCategoryFormOpen && newCategory && (
          <CategoryForm
            category={newCategory}
            onSave={handleSaveCategory}
            onClose={() => {
              setIsCategoryFormOpen(false);
              setNewCategory(null);
            }}
            loading={operationLoading}
          />
        )}
        {isUomFormOpen && newUom && (
          <UomForm
            uomConfig={newUom}
            onSave={handleSaveUom}
            onClose={() => {
              setIsUomFormOpen(false);
              setNewUom(null);
            }}
            loading={operationLoading}
          />
        )}
      </div>
    </Permission>
  );
};

export default ItemForm;