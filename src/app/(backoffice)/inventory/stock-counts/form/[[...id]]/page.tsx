"use client";

import StockCountAddItemsModal from "@/components/backoffice/StockCountAddItemsModal";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";

interface Item {
  item_id: string;
  name: string;
  unit: { code: string; code_name: string };
  packaging_units: { code: string; code_name: string };
  conversion_factor: number;
  expected: number;
  counted: number | null;
  counted_packaging: number | null;
  reason: string;
  id: string;
}

interface StockCountItem {
  item_id: string;
  name: string;
  unit: { code: string; code_name: string };
  packaging_units: { code: string; code_name: string };
  conversion_factor: number;
  expected: number;
  counted: number | null;
  counted_packaging: number | null;
  reason: string;
  id: string;
}

interface StockCount {
  id: string;
  stock_count_name: string;
  count_type: "general" | "production_batch" | "purchase_batch";
  staff_details: {
    user_id: string;
    display_name: string;
    first_name: string;
    last_name: string;
  };
  notes?: string;
  items: StockCountItem[];
}

interface VarianceFormData {
  variance_reasons: { item_id: string; reason: string }[];
}

interface AddItemFormData {
  item_id: string;
  item_name: string;
}

interface StockCountInputFormData {
  counted_packaging: number | null;
  counted: number | null;
}

const stockCountSchema = (isEditMode: boolean) =>
  Joi.object({
    stock_count_name: Joi.string()
      .required()
      .label("Stock Count Name")
      .messages({
        "string.empty": "Stock Count Name is required.",
        "any.required": "Stock Count Name is required.",
      }),
    staff_details: Joi.object({
      user_id: Joi.string().required(),
      display_name: Joi.string().required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
    }).required(),
    notes: Joi.string().allow("").optional().label("Notes"),
    count_type: Joi.string()
      .valid("general", "production_batch", "purchase_batch")
      .required()
      .label("Count Type"),
    items: Joi.array()
      .items(
        Joi.object({
          item_id: Joi.string().uuid().required().label("Item ID"),
          name: Joi.string().required().label("Item Name"),
          unit: Joi.object({
            code: Joi.string().required(),
            code_name: Joi.string().required(),
          })
            .required()
            .label("Unit"),
          packaging_units: Joi.when("..count_type", {
            is: "production_batch",
            then: Joi.any().optional(),
            otherwise: Joi.object({
              code: Joi.string().required(),
              code_name: Joi.string().required(),
            }).required(),
          }).label("Packaging Units"),
          conversion_factor: Joi.when("..count_type", {
            is: "production_batch",
            then: Joi.number().optional().default(1),
            otherwise: Joi.number().min(0.0001).required(),
          }).label("Conversion Factor"),
          expected: Joi.number().required().label("Expected Quantity"),
          counted: Joi.number()
            .allow(null)
            .optional()
            .label("Counted Quantity"),
          counted_packaging: Joi.when("..count_type", {
            is: "production_batch",
            then: Joi.any().optional(),
            otherwise: Joi.number().allow(null).optional(),
          }).label("Counted Packaging Quantity"),
          reason: Joi.string().allow("").optional().label("Reason"),
          id: Joi.string().required().label("Field ID"),
        })
      )
      .min(isEditMode ? 0 : 1)
      .required()
      .label("Items")
      .messages({
        "array.min": "At least one item is required.",
        "any.required": "Items are required.",
      }),
  }).options({ stripUnknown: true });

const varianceSchema = Joi.object({
  variance_reasons: Joi.array()
    .items(
      Joi.object({
        item_id: Joi.string().uuid().required().label("Item ID"),
        reason: Joi.when("..counted", {
          is: Joi.number().exist(),
          then: Joi.string()
            .valid("wastage", "damage", "theft", "")
            .required()
            .label("Reason")
            .messages({
              "any.only": "Reason must be one of: Wastage, Damage, Theft",
              "any.required": "Reason is required for items with variance",
            }),
          otherwise: Joi.string().allow("").optional(),
        }),
      })
    )
    .required()
    .label("Variance Reasons"),
}).options({ stripUnknown: true });

const addItemSchema = Joi.object({
  item_id: Joi.string().uuid().required().label("Item").messages({
    "string.empty": "Please select an item.",
    "any.required": "Please select an item.",
  }),
  item_name: Joi.string().required().label("Item Name"),
}).options({ stripUnknown: true });

const stockCountInputSchema = Joi.object({
  counted_packaging: Joi.number()
    .allow(null)
    .optional()
    .label("Packaging Quantity"),
  counted: Joi.number().allow(null).optional().label("Unit Quantity"),
})
  .custom((value, helpers) => {
    if (value.counted == null && value.counted_packaging == null) {
      return helpers.error("any.custom", {
        message:
          "At least one of Packaging Quantity or Unit Quantity must be provided.",
      });
    }
    if (
      (value.counted != null && value.counted < 0) ||
      (value.counted_packaging != null && value.counted_packaging < 0)
    ) {
      return helpers.error("any.custom", {
        message: "Quantities cannot be negative.",
      });
    }
    return value;
  })
  .options({ stripUnknown: true });

const StockCountForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [screen, setScreen] = useState<"enter-counts" | "variance-review">(
    "enter-counts"
  );
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [stockCountId, setStockCountId] = useState<string | null>(id || null);
  const [items, setItems] = useState<StockCountItem[]>([]);
  const [progress, setProgress] = useState({
    total_items: 0,
    counted_items: 0,
  });
  const [isConfirmSkipOpen, setIsConfirmSkipOpen] = useState(false);
  const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCountInputModal, setShowCountInputModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<StockCountItem | null>(null);
  const router = useRouter();
  const { backoffice_user_profile } = useAppState();

  const staff_details = {
    user_id: backoffice_user_profile?.user_id || "",
    display_name: backoffice_user_profile?.display_name || "",
    first_name: backoffice_user_profile?.first_name || "",
    last_name: backoffice_user_profile?.last_name || "",
  };

  const store_location_id = backoffice_user_profile?.store_location_id;
  const business_location_id = backoffice_user_profile?.business_location_id;

  const methods = useForm<StockCount>({
    resolver: joiResolver(stockCountSchema(isEditMode)),
    defaultValues: {
      stock_count_name: isEditMode
        ? ""
        : `Stock Count ${new Date().toLocaleDateString()}`,
      staff_details,
      notes: "",
      count_type: "general",
      items: [],
    },
  });

  const {
    handleSubmit,
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  const { fields } = useFieldArray({
    control,
    name: "items",
  });

  const varianceMethods = useForm<VarianceFormData>({
    resolver: joiResolver(varianceSchema),
    defaultValues: {
      variance_reasons: [],
    },
  });

  const {
    control: varianceControl,
    handleSubmit: handleVarianceSubmit,
    setValue: setVarianceValue,
    formState: { errors: varianceErrors },
  } = varianceMethods;

  const addItemMethods = useForm<AddItemFormData>({
    resolver: joiResolver(addItemSchema),
    defaultValues: {
      item_id: "",
      item_name: "",
    },
  });

  const { reset: resetAddItem } = addItemMethods;

  const countInputMethods = useForm<StockCountInputFormData>({
    resolver: joiResolver(stockCountInputSchema),
    defaultValues: {
      counted_packaging: null,
      counted: null,
    },
  });

  const {
    control: countInputControl,
    handleSubmit: handleCountInputSubmit,
    reset: resetCountInput,
    formState: { errors: countInputErrors },
    setValue: setCountInputValue,
  } = countInputMethods;

  const reasonOptions = [
    { value: "wastage", label: "Wastage" },
    { value: "damage", label: "Damage" },
    { value: "theft", label: "Theft" },
    { value: "add_adjustment", label: "Add Adjustment" },
    { value: "remove_adjustment", label: "Remove Adjustment" },
  ];

  useEffect(() => {
    setValue("items", items, { shouldDirty: true });
  }, [items, setValue]);

  const fetchStockCount = async () => {
    try {
      const response = await api.get(
        endpoints.getStockCount(store_location_id, id)
      );
      const data = response?.data?.data;

      setValue("stock_count_name", data.stock_count_name || "");
      setValue("notes", data.notes || "");
      setValue("count_type", data.count_type || "general");

      const uncountedItems = (data.items || []).filter(
        (item) => item.counted === null || item.counted === undefined
      );

      setItems(uncountedItems || []);
      const total_items = data.items.length || 0;
      const counted_items =
        (data.items.length || 0) - (uncountedItems.length || 0);
      setProgress({
        total_items,
        counted_items,
      });
      if (total_items > 0 && counted_items === total_items) {
        setScreen("variance-review");
        fetchVarianceItems();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to load stock count data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      fetchStockCount();
    } else {
      setLoading(false);
    }
  }, [isEditMode, stockCountId, store_location_id, setValue]);

  const fetchVarianceItems = async () => {
    try {
      const response = await api.get(
        endpoints.getStockCountVariance(store_location_id, id)
      );
      const data = response?.data?.data;
      const varianceItems = (data.items || []).map((item: StockCountItem) => ({
        ...item,
        variance:
          item.counted !== null && item.expected !== null
            ? item.counted - item.expected
            : null,
      }));
      setItems(varianceItems);
      setVarianceValue(
        "variance_reasons",
        varianceItems.map((item: StockCountItem) => ({
          item_id: item.item_id,
          reason: item.reason || "",
        }))
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch variance data."
      );
    }
  };

  const loadItems = async (inputValue: string) => {
    if (!inputValue || !store_location_id) return [];
    try {
      const response = await api.get(endpoints.getItems(store_location_id), {
        params: { search: inputValue, business_location_id },
      });
      return (
        response?.data?.data?.map((item: Item) => ({
          value: item.item_id,
          label: item.name,
          item,
        })) || []
      );
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items.");
      return [];
    }
  };

  const handleCreateStockCount = async (data: StockCount) => {
    setOperationLoading(true);
    try {
      const payload = {
        ...data,
        business_location_id,
        store_location_id,
      };
      const response = await api.post(
        endpoints.createStockCount(store_location_id!),
        payload
      );
      const newStockCountId = response?.data?.data?.stock_count_id;
      setStockCountId(newStockCountId);
      setScreen("enter-counts");
      toast.success("Stock count created successfully.");
      router.push(`${routes.stockCounts}/${newStockCountId}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create stock count."
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSubmitCount = async (
    item: StockCountItem,
    counted_quantity_unit: number | null,
    counted_quantity_packaging: number | null
  ) => {
    setOperationLoading(true);
    try {
      await api.patch(
        endpoints.submitStockCountItem(store_location_id, id, item.item_id),
        {
          counted_quantity_unit,
          counted_quantity_packaging,
        }
      );
      toast.success("Count submitted successfully.");
      setShowCountInputModal(false);
      resetCountInput();
      setCurrentItem(null);
      fetchStockCount();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit count.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSkipItem = async () => {
    if (!currentItem) return;
    setOperationLoading(true);
    try {
      await api.patch(
        endpoints.removeStockCountItem(
          store_location_id,
          id,
          currentItem.item_id
        )
      );
      toast.success("Item skipped successfully.");
      setIsConfirmSkipOpen(false);
      setCurrentItem(null);
      fetchStockCount();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to skip item.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleFinalizeStockCount = async (data: VarianceFormData) => {
    setOperationLoading(true);
    try {
      await api.patch(
        endpoints.closeStockCount(store_location_id!, stockCountId!),
        {
          variance_reasons: data.variance_reasons,
        }
      );
      toast.success("Stock count closed successfully.");
      router.push(`${routes.stockCounts}/report/${id}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to finalize stock count."
      );
    } finally {
      setOperationLoading(false);
      setIsConfirmFinalizeOpen(false);
    }
  };

  const handleModalSubmit = async (stock_count_id: string) => {
    setShowAddItemModal(false);
    toast.success(`Item(s) added to stock count.`);
    router.push(`${routes.stockCountForm}/${stock_count_id}`);
  };

  const renderEnterCounts = () => {
    const percentage =
      progress.total_items > 0
        ? (progress.counted_items / progress.total_items) * 100
        : 0;

    const columns = [
      {
        key: "name",
        label: "Item",
        render: (item: StockCountItem) => (
          <div className="text-sm text-neutral-900 dark:text-neutral-200">
            {item.name}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        render: (item: StockCountItem) => (
          <div className="flex items-center gap-3 justify-end">
            <Permission resource="stock_counts" action="update">
              <button
                onClick={(e: any) => {
                  e.preventDefault();
                  setCurrentItem(item);
                  setShowCountInputModal(true);
                }}
                className="px-4 py-1 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex items-center justify-center disabled:cursor-not-allowed"
                disabled={operationLoading}
                aria-label="Enter Count"
              >
                Count
              </button>
            </Permission>
            <Permission resource="stock_counts" action="update">
              <button
                onClick={(e: any) => {
                  e.preventDefault();
                  setCurrentItem(item);
                  setIsConfirmSkipOpen(true);
                }}
                className="px-4 py-1 rounded text-red-500 dark:text-red-400 border-2 border-red-500 dark:border-red-400 bg-white dark:bg-neutral-800 flex items-center justify-center disabled:cursor-not-allowed"
                disabled={operationLoading}
                aria-label="Skip Item"
              >
                Skip
              </button>
            </Permission>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-2 mt-2 w-full">
        {items.length > 0 && (
          <>
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray={`${percentage}, 100`}
                  />
                  <text
                    x="18"
                    y="20"
                    textAnchor="middle"
                    fill="#1f2937"
                    className="text-xs dark:fill-neutral-200"
                  >
                    {`${Math.round(percentage)}%`}
                  </text>
                </svg>
              </div>
            </div>
            <ReusableTable data={fields} columns={columns} />
          </>
        )}
        {items.length === 0 && !isEditMode && (
          <button
            type="button"
            onClick={() => setShowAddItemModal(true)}
            disabled={operationLoading}
            className="w-full font-bold mt-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg py-6 text-sm text-neutral-500 dark:text-neutral-100 hover:border-primary hover:text-primary transition disabled:cursor-not-allowed"
          >
            + Add Items
          </button>
        )}
      </div>
    );
  };

  const renderVarianceReview = () => {
    const countType = getValues("count_type");
    const isProductionBatch = countType === "production_batch";

    return (
      <div className="space-y-2 mt-2 w-full">
        {items.length > 0 && (
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_2fr_1fr] gap-2 items-center">
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Item
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 text-center">
              Expected
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 text-center">
              Counted
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 text-center">
              Variance
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Reason
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 text-center">
              Actions
            </div>
          </div>
        )}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[3fr_1fr_1fr_1fr_2fr_1fr] gap-2 items-center"
          >
            <div className="text-sm text-neutral-900 dark:text-neutral-200">
              {item.name}
            </div>
            <div className="text-sm text-neutral-900 dark:text-neutral-200 text-center">
              {item.expected !== null
                ? `${formatNumber(item.expected)} ${item.unit.code_name}`
                : "-"}
            </div>
            <div className="text-sm text-neutral-900 dark:text-neutral-200 text-center">
              {item.counted !== null
                ? `${formatNumber(item.counted)} ${item.unit.code_name}${
                    !isProductionBatch && item.counted_packaging != null
                      ? ` (${formatNumber(item.counted_packaging)} ${
                          item.packaging_units.code_name
                        })`
                      : ""
                  }`
                : "-"}
            </div>
            <div className="text-sm text-neutral-900 dark:text-neutral-200 text-center font-medium">
              {item.counted !== null && item.expected !== null
                ? `${formatNumber(item.counted - item.expected)} ${
                    item.unit.code_name
                  }`
                : "-"}
            </div>
            <div>
              <Controller
                name={`variance_reasons.${index}.reason`}
                control={varianceControl}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={reasonOptions}
                    isDisabled={operationLoading}
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                    placeholder="Select"
                    value={
                      reasonOptions.find((opt) => opt.value === field.value) ||
                      null
                    }
                    onChange={(selected) =>
                      field.onChange(selected?.value || "")
                    }
                  />
                )}
              />
              <Controller
                name={`variance_reasons.${index}.item_id`}
                control={varianceControl}
                render={() => <input type="hidden" value={item.item_id} />}
              />
            </div>
            <div className="text-center">
              <Permission resource="stock_counts" action="update">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentItem(item);
                    setCountInputValue("counted", item.counted);
                    setCountInputValue(
                      "counted_packaging",
                      item.counted_packaging
                    );
                    setShowCountInputModal(true);
                  }}
                  className="px-4 py-1 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex items-center justify-center disabled:cursor-not-allowed"
                  disabled={operationLoading}
                  aria-label="Edit Count"
                >
                  Edit
                </button>
              </Permission>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div
            className="w-full bg-white dark:bg-neutral-800 p-4 flex flex-col items-center gap-4 text-center rounded"
            aria-live="polite"
          >
            <p className="text-neutral-600 dark:text-neutral-300">
              All Items counted. Submit to see report.
            </p>
            <button
              onClick={() => setIsConfirmFinalizeOpen(true)}
              className="flex items-center gap-1 px-2 py-2 rounded-sm font-medium text-sm text-white disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition bg-primary"
            >Submit Stock Count</button>
          </div>
        )}
        {varianceErrors.variance_reasons && (
          <div className="text-sm text-red-500">
            {varianceErrors.variance_reasons.message}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission
      resource="stock_counts"
      action={isEditMode ? "update" : "create"}
      isPage={true}
    >
      <BreadcrumbWithActions
        label={isEditMode ? "Edit Stock Count" : "Create Stock Count"}
        breadcrumbs={[
          { name: "Inventory", onClick: () => router.push(routes.inventory) },
          {
            name: "Stock Counts",
            onClick: () => router.push(routes.stockCounts),
          },
          { name: isEditMode ? "Edit Stock Count" : "Create Stock Count" },
        ]}
        actions={[
          ...(screen === "enter-counts" && isEditMode ? [] : []),
          ...(screen === "variance-review"
            ? [
                {
                  title: "Submit Stock Count",
                  onClick: () => setIsConfirmFinalizeOpen(true),
                  disabled: operationLoading,
                  resource: "stock_counts",
                  action: "update",
                },
              ]
            : []),
        ]}
      />
      <div className="bg-white dark:bg-neutral-800 p-4 m-1 flex justify-center">
        <FormProvider {...methods}>
          <form className="w-full space-y-2 max-w-[560px]">
            <div>
              <div className="flex gap-2 justify-between mb-2">
                <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
                  Stock Count Details
                </h2>
              </div>
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="stock_count_name"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Stock Count Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="stock_count_name"
                    type="text"
                    {...register("stock_count_name")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter stock count name"
                    disabled={operationLoading}
                  />
                  <div className="min-h-[0.5rem]">
                    {errors.stock_count_name && (
                      <p className="text-sm text-red-500">
                        {errors.stock_count_name.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    {...register("notes")}
                    className="w-full p-2 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    rows={2}
                    placeholder="Enter stock count notes"
                    disabled={operationLoading}
                  />
                  <div className="min-h-[0.5rem]">
                    {errors.notes && (
                      <p className="text-sm text-red-500">
                        {errors.notes.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Items
                </h2>
              </div>
              {screen === "enter-counts"
                ? renderEnterCounts()
                : renderVarianceReview()}
            </div>
          </form>
        </FormProvider>

        {showAddItemModal && (
          <StockCountAddItemsModal
            onSubmit={handleModalSubmit}
            onCancel={() => setShowAddItemModal(false)}
            operationLoading={operationLoading}
            countType={isEditMode ? getValues("count_type") : undefined}
            stockCountId={stockCountId}
            isSingleItemMode={isEditMode}
            store_location_id={store_location_id!}
            business_location_id={business_location_id!}
          />
        )}

        {showCountInputModal && currentItem && (
          <FormProvider {...countInputMethods}>
            <form
              onSubmit={handleCountInputSubmit((data) =>
                handleSubmitCount(
                  currentItem,
                  data.counted,
                  data.counted_packaging
                )
              )}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            >
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md max-w-md p-6 w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {currentItem.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      resetCountInput();
                      setShowCountInputModal(false);
                      setCurrentItem(null);
                    }}
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    disabled={operationLoading}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <div className="flex gap-3 space-y-3">
                    {getValues("count_type") !== "production_batch" && (
                      <div>
                        <div className="flex items-center gap-2">
                          <Controller
                            name="counted_packaging"
                            control={countInputControl}
                            render={({ field }) => (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null
                                  )
                                }
                                className="w-24 p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200 text-center"
                                disabled={operationLoading}
                              />
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-neutral-600 dark:text-neutral-200">
                              Purchase Units
                            </span>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {currentItem?.packaging_units?.code_name}
                            </span>
                          </div>
                        </div>
                        <div className="min-h-[1.5rem]">
                          {countInputErrors.counted_packaging && (
                            <p className="text-sm text-red-500">
                              {countInputErrors.counted_packaging.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Controller
                          name="counted"
                          control={countInputControl}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="w-24 p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200 text-center"
                              disabled={operationLoading}
                            />
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-600 dark:text-neutral-200">
                            Usage Units
                          </span>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {currentItem.unit.code_name}
                          </span>
                        </div>
                      </div>
                      <div className="min-h-[1.5rem]">
                        {countInputErrors.counted && (
                          <p className="text-sm text-red-500">
                            {countInputErrors.counted.message}
                          </p>
                        )}
                        {countInputErrors.root && (
                          <p className="text-sm text-red-500">
                            {countInputErrors.root.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetCountInput();
                      setShowCountInputModal(false);
                      setCurrentItem(null);
                    }}
                    className="px-4 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-200 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    disabled={operationLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded disabled:cursor-not-allowed flex items-center"
                    disabled={operationLoading}
                  >
                    Save Count
                  </button>
                </div>
              </div>
            </form>
          </FormProvider>
        )}

        {isConfirmSkipOpen && currentItem && (
          <ConfirmDialog
            title="Confirm Skip Item"
            message={`Are you sure you want to skip ${currentItem.name}? It will be removed from the stock count.`}
            confirmLabel="Skip Item"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleSkipItem}
            onCancel={() => {
              setIsConfirmSkipOpen(false);
              setCurrentItem(null);
            }}
          />
        )}

        {isConfirmFinalizeOpen && (
          <ConfirmDialog
            title="Submit Stock Count"
            message="This will submit the stock count and update stock levels. This action cannot be undone."
            confirmLabel="Submit"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleVarianceSubmit(handleFinalizeStockCount)}
            onCancel={() => setIsConfirmFinalizeOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default StockCountForm;
