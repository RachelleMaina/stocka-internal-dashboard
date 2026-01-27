"use client";

import BulkAddItemsModal from "@/components/backoffice/BulkAddItemsModal";
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
import { AlertCircle, Loader2, Trash2, X, XCircle } from "lucide-react";
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
import AsyncSelect from "react-select/async";

interface Item {
  id: string;
  item_name: string;
  category_id?: string;
  category_name?: string;
  unit: { code: string; code_name: string };
  packaging_units: { code: string; code_name: string };
  conversion_factor: number;
}

interface Category {
  id: string;
  category_name: string;
}

interface BatchItem {
  id?: string;
  item_id: string;
  item_name: string;
  in_stock?: number;
  quantity: number;
  packaging_quantity: number;
  unit_price?: number;
  is_rolled_over?: boolean;
  unit: { code: string; code_name: string };
  packaging_units: { code: string; code_name: string };
  conversion_factor: number;
}

interface Document {
  document_type: string;
  document_number: string;
}

interface FormData {
  purchase_batch_name: string;
  staff_details: {
    user_id: string;
    display_name: string;
    first_name: string;
    last_name: string;
  };
  notes?: string;
  documents: Document[];
  items: BatchItem[];
}

interface AddItemFormData {
  item_id: string;
  item_name: string;
  quantity: number;
  packaging_quantity: number;
}

interface StockAdjustmentFormData {
  counted_quantity_packaging: number | null;
  counted_quantity_unit: number | null;
  type: string;
}

interface PurchaseBatch {
  id: string;
  purchase_batch_name: string;
  staff_details: {
    user_id: string;
    display_name: string;
    first_name: string;
    last_name: string;
  };
  notes?: string;
  documents: Document[];
  items: BatchItem[];
}

interface RemainingItemsResponse {
  items: BatchItem[];
}

const documentTypes = ["Invoice", "LPO", "Receipt", "Delivery Note"];
const adjustmentReasons = [
  "purchase",
  "add_adjustment",
  "remove_adjustment",
  "theft",
  "damage",
  "wastage",
  "purchase_return",
];

export const batchSchema = (isEditMode: boolean) =>
  Joi.object({
    purchase_batch_name: Joi.string().required().label("Batch Name").messages({
      "string.empty": "Batch Name is required.",
      "any.required": "Batch Name is required.",
    }),
    staff_details: Joi.object({
      user_id: Joi.string().required(),
      display_name: Joi.string().required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
    }).required(),
    notes: Joi.string().allow("").optional().label("Notes"),
    documents: Joi.array()
      .items(
        Joi.object({
          document_type: Joi.string()
            .valid(...documentTypes)
            .required()
            .label("Document Type")
            .messages({
              "string.empty": "Document type is required.",
              "any.required": "Document type is required.",
              "any.only": `Document type must be one of ${documentTypes.join(
                ", "
              )}.`,
            }),
          document_number: Joi.string()
            .required()
            .label("Document Number")
            .messages({
              "string.empty": "Document number is required.",
              "any.required": "Document number is required.",
            }),
        })
      )
      .optional()
      .label("Documents")
      .messages({
        "array.base": "Documents must be an array.",
      }),
    items: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().uuid().optional().label("Item ID"),
          item_id: Joi.string().uuid().required().label("Item"),
          item_name: Joi.string().required().label("Item Name"),
          quantity: isEditMode
            ? Joi.number().min(0).required().label("Unit Quantity")
            : Joi.number().min(0).required().label("Unit Quantity"),
          packaging_quantity: isEditMode
            ? Joi.number().min(0).required().label("Packaging Quantity")
            : Joi.number().min(0).required().label("Packaging Quantity"),
          unit_price: Joi.number().min(0).optional().label("Unit Price"),
          is_rolled_over: Joi.boolean().optional().label("Is Rolled Over"),
        })
      )
      .min(1)
      .required()
      .label("Items")
      .messages({
        "array.min": "At least one item is required.",
        "any.required": "Items are required.",
      }),
  }).options({ stripUnknown: true });

const addItemSchema = Joi.object({
  item_id: Joi.string().uuid().required().label("Item").messages({
    "string.empty": "Please select an item.",
    "any.required": "Please select an item.",
  }),
  item_name: Joi.string().required().label("Item Name"),
  quantity: Joi.number().min(0).required().label("Unit Quantity").messages({
    "number.base": "Unit Quantity must be a valid number.",
    "number.min": "Unit Quantity must be at least 0.",
    "any.required": "Unit Quantity is required.",
  }),
  packaging_quantity: Joi.number()
    .min(0)
    .required()
    .label("Packaging Quantity")
    .messages({
      "number.base": "Packaging Quantity must be a valid number.",
      "number.min": "Packaging Quantity must be at least 0.",
      "any.required": "Packaging Quantity is required.",
    }),
})
  .options({ stripUnknown: true })
  .custom((value, helpers) => {
    if (value.quantity === 0 && value.packaging_quantity === 0) {
      return helpers.error("any.custom", {
        message:
          "At least one of Unit Quantity or Packaging Quantity must be greater than 0.",
      });
    }
    return value;
  });

const stockAdjustmentSchema = Joi.object({
  counted_quantity_packaging: Joi.number()
    .allow(null)
    .optional()
    .label("Packaging Quantity")
    .messages({
      "number.base": "Packaging Quantity must be a valid number.",
    }),
  counted_quantity_unit: Joi.number()
    .allow(null)
    .optional()
    .label("Unit Quantity")
    .messages({
      "number.base": "Unit Quantity must be a valid number.",
    }),
  type: Joi.string()
    .valid(...adjustmentReasons)
    .required()
    .label("Reason")
    .messages({
      "string.empty": "Reason is required.",
      "any.required": "Reason is required.",
      "any.only": `Reason must be one of ${adjustmentReasons.join(", ")}.`,
    }),
})
  .options({ stripUnknown: true })
  .custom((value, helpers) => {
    if (
      value.counted_quantity_unit == null &&
      value.counted_quantity_packaging == null
    ) {
      return helpers.error("any.custom", {
        message:
          "At least one of Packaging Quantity or Unit Quantity must be provided.",
      });
    }
    if (
      (value.counted_quantity_unit != null &&
        value.counted_quantity_unit < 0) ||
      (value.counted_quantity_packaging != null &&
        value.counted_quantity_packaging < 0)
    ) {
      return helpers.error("any.custom", {
        message: "Quantities cannot be negative.",
      });
    }
    return value;
  });

const PurchaseBatchForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [showBatchesCount, setShowBatchesCount] = useState(false);
  const [openBatchesCount, setOpenBatchesCount] = useState(0);
  const [remainingItems, setRemainingItems] = useState<BatchItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStockAdjustmentModal, setShowStockAdjustmentModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState<BatchItem | null>(null);
  const [key, setKey] = useState(1);
  const router = useRouter();
  const { backoffice_user_profile } = useAppState();

  const today = new Date();
  const defaultBatchName = `Purchase ${today
    .getDate()
    .toString()
    .padStart(2, "0")}/${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${today.getFullYear()}`;
  const staff_details = {
    user_id: backoffice_user_profile?.user_id || "",
    display_name: backoffice_user_profile?.display_name || "",
    first_name: backoffice_user_profile?.first_name || "",
    last_name: backoffice_user_profile?.last_name || "",
  };

  const methods = useForm<FormData>({
    resolver: joiResolver(batchSchema(isEditMode)),
    defaultValues: {
      purchase_batch_name: isEditMode ? "" : defaultBatchName,
      staff_details,
      notes: "",
      documents: [],
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

  const {
    append: appendItem,
    fields,
    remove,
  } = useFieldArray({
    control,
    name: "items",
  });

  const {
    fields: documentFields,
    append: appendDocument,
    remove: removeDocument,
  } = useFieldArray({
    control,
    name: "documents",
  });

  const addItemMethods = useForm<AddItemFormData>({
    resolver: joiResolver(addItemSchema),
    defaultValues: {
      item_id: "",
      item_name: "",
      quantity: 0,
      packaging_quantity: 0,
    },
  });

  const stockAdjustmentMethods = useForm<StockAdjustmentFormData>({
    resolver: joiResolver(stockAdjustmentSchema),
    defaultValues: {
      counted_quantity_packaging: null,
      counted_quantity_unit: null,
      type: "",
    },
  });

  const {
    control: addItemControl,
    handleSubmit: handleAddItemSubmit,
    reset: resetAddItem,
    formState: { errors: addItemErrors },
  } = addItemMethods;

  const {
    control: stockAdjustmentControl,
    handleSubmit: handleStockAdjustmentSubmit,
    reset: resetStockAdjustment,
    formState: { errors: stockAdjustmentErrors },
  } = stockAdjustmentMethods;

  const store_location_id = backoffice_user_profile?.store_location_id;
  const business_location_id = backoffice_user_profile?.business_location_id;

  useEffect(() => {
    if (isEditMode) {
      const fetchBatch = async () => {
        try {
          const batchRes = await api.get(
            endpoints.getPurchaseBatch(store_location_id, id)
          );
          const batchItemsRes = await api.get(
            endpoints.listPurchaseBatchItems(store_location_id, id)
          );
          const batch: PurchaseBatch = batchRes.data.data;
          setValue("purchase_batch_name", batch.purchase_batch_name);
          setValue("staff_details", batch.staff_details);
          setValue("notes", batch.notes || "");
          setValue("documents", batch.documents || []);
          setValue(
            "items",
            batchItemsRes?.data?.data?.map((item) => ({
              id: item.id,
              item_id: item.item_id,
              item_name: item.item_name,
              in_stock: item.in_stock || 0,
              quantity: 0,
              packaging_quantity: 0,
              unit_price: item.unit_price || 0,
              is_rolled_over: item.carried_out > 0,
              unit: {
                code: item.unit?.code || item.quantity_units || "",
                code_name:
                  item.unit?.code_name ||
                  item.unit_name ||
                  item.quantity_units ||
                  "",
              },
              packaging_units: {
                code: item.packaging_units?.code || item.packaging_units || "",
                code_name:
                  item.packaging_units?.code_name ||
                  item.packaging_unit_name ||
                  item.packaging_units ||
                  "",
              },
              conversion_factor: item.conversion_factor || 1,
            }))
          );
        } catch (error: any) {
          toast.error(
            error?.response?.data?.message || "Failed to load batch data."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchBatch();
    } else {
      const fetchOpenBatchesCount = async () => {
        try {
          const response = await api.get(
            endpoints.getOpenBatchStatus(store_location_id)
          );
          const count = response?.data?.data?.open_batch_count;
          if (count >= 10) {
            setShowBatchesCount(true);
            setOpenBatchesCount(count);
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchOpenBatchesCount();
    }
    setLoading(false);
  }, [id, isEditMode, setValue, store_location_id, key]);

  const fetchRemainingItems = async () => {
    try {
      setOperationLoading(true);
      const response = await api.get(
        endpoints.getBatchRemainingItems(store_location_id, id)
      );
      setRemainingItems(response?.data?.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch remaining items.");
    } finally {
      setOperationLoading(false);
    }
  };

  const loadItems = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await api.get(endpoints.getPurchaseBatchableItems, {
        params: { search: inputValue, business_location_id },
      });
      return response?.data?.data?.map((item: Item) => ({
        value: item.id,
        label: item.item_name,
        item,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleAddNewItem = (items: Item[]) => {
    const newItems = items.map((item) => ({
      item_id: item.id,
      item_name: item.item_name,
      quantity: 0,
      packaging_quantity: 0,
      unit: item.quantity_units,
      packaging_units: item.packaging_units,
      conversion_factor: item.conversion_factor || 1,
    }));

    appendItem(newItems);
    toast.success(`${items.length} item(s) added to form.`);
    setShowAddItemModal(false);
  };

  const handleAddItemToBatch = async (data: AddItemFormData) => {
    setOperationLoading(true);
    try {
      const payload = {
        staff_details,
        item: {
          item_id: data.item_id,
          quantity: data.quantity,
          packaging_quantity: data.packaging_quantity,
        },
      };
      const response = await api.patch(
        endpoints.addPurchaseBatchItem(store_location_id, id),
        payload
      );
      toast.success(`Item added to batch.`);
      setShowAddItemModal(false);
      const batchItemsRes = await api.get(
        endpoints.listPurchaseBatchItems(store_location_id, id)
      );
      setValue(
        "items",
        batchItemsRes?.data?.data?.map((item) => ({
          id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          in_stock: item.in_stock || 0,
          quantity: 0,
          packaging_quantity: 0,
          unit_price: item.unit_price || 0,
          is_rolled_over: item.carried_out > 0,
          unit: {
            code: item.unit?.code || item.quantity_units || "",
            code_name:
              item.unit?.code_name ||
              item.unit_name ||
              item.quantity_units ||
              "",
          },
          packaging_units: {
            code: item.packaging_units?.code || item.packaging_units || "",
            code_name:
              item.packaging_units?.code_name ||
              item.packaging_unit_name ||
              item.packaging_units ||
              "",
          },
          conversion_factor: item.conversion_factor || 1,
        }))
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to add item.`);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleStockAdjustment = async (data: StockAdjustmentFormData) => {
    if (!selectedItem) return;
    setOperationLoading(true);
    try {
      const payload = {
        item_id: selectedItem.item_id,
        counted_quantity_unit: data.counted_quantity_unit,
        counted_quantity_packaging: data.counted_quantity_packaging,
        type: data.type,
        note: `Stock adjustment for ${selectedItem.item_name}`,
        unit_cost: selectedItem.unit_price || 0,
        staff_details,
      };
      await api.patch(
        endpoints.adjustPurchaseBatchStock(store_location_id, id),
        payload
      );
      toast.success(`Stock Adjusted.`);
      setShowStockAdjustmentModal(false);
      resetStockAdjustment();
      setSelectedItem(null);
      setKey((key) => key + 1);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to record stock adjustment."
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSaveBatch = async (data: FormData) => {
    setOperationLoading(true);
    try {
      if (isEditMode) {
        const payload = {
          purchase_batch_name: data.purchase_batch_name,
          staff_details,
          notes: data.notes || null,
          documents: data.documents,
        };
        await api.patch(
          endpoints.updatePurchaseBatch(store_location_id, id),
          payload
        );
        toast.success("Purchase batch updated successfully.");
      } else {
        const payload = {
          purchase_batch_name: data.purchase_batch_name,
          staff_details: data.staff_details,
          notes: data.notes || null,
          documents: data.documents,
          items: data.items.map((item) => ({
            item_id: item.item_id,
               item_name: item.item_name,
            quantity: item.quantity,
            packaging_quantity: item.packaging_quantity,
            unit_price: item.unit_price || 0,
            unit: item.unit,
            packaging_units: item.packaging_units,
            conversion_factor: item.conversion_factor,
          })),
          store_location_id,
        };
      
        await api.post(
          endpoints.createPurchaseBatch(store_location_id),
          payload
        );
        toast.success("Purchase batch created successfully.");
      }
      router.push(routes.purchaseBatches);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} purchase batch.`
      );
    } finally {
      setOperationLoading(false);
      setIsConfirmSubmitOpen(false);
    }
  };

  const handleCloseBatch = async () => {
    setOperationLoading(true);
    try {
      await api.patch(endpoints.closePurchaseBatch(store_location_id, id), {
        user_id: backoffice_user_profile?.user_id,
        staff_details,
      });
      toast.success("Purchase batch closed successfully.");
      router.push(routes.purchaseBatches);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to close purchase batch."
      );
    } finally {
      setOperationLoading(false);
      setIsConfirmCloseOpen(false);
    }
  };

  const renderCreateModeItems = () => {
    return (
      <>
        {/* Disclaimer */}
        {fields.length > 0 && (
          <div className="flex items-start gap-2 mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Note: Usage units may be the same as purchase units. In such
              cases, use either one consistently.
            </p>
          </div>
        )}

        {fields.length > 0 && (
          <ReusableTable
            data={fields}
            columns={[
              {
                key: "item_name",
                label: "Item",
                render: (item: BatchItem) => (
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {item.item_name}
                  </span>
                ),
              },
              {
                key: "packaging_quantity",
                label: "Purchase Unit",
                render: (item: BatchItem, index: number) => (
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`items.${index}.packaging_quantity`}
                      rules={{
                        required: "Packaging quantity is required",
                        validate: (value) =>
                          !isNaN(value) ||
                          "Packaging quantity must be a number",
                        min: { value: 0, message: "Must be non-negative" },
                      }}
                      render={({ field }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^[0-9]*$/.test(value)) {
                              field.onChange(value === "" ? 0 : Number(value));
                            }
                          }}
                          onBlur={field.onBlur}
                          className="w-24 p-2 h-9 text-right rounded border border-neutral-300 
                                   dark:border-neutral-600 bg-white dark:bg-neutral-800 
                                   text-sm text-neutral-900 dark:text-neutral-200 
                                   focus:ring-2 focus:ring-primary/50"
                          disabled={operationLoading}
                        />
                      )}
                    />
                    <span className="w-12 text-xs text-neutral-500 dark:text-neutral-400 text-left truncate">
                      {item?.packaging_units?.code_name || "Pkg"}(s)
                    </span>
                  </div>
                ),
              },
              {
                key: "quantity",
                label: "Usage Units",
                render: (item: BatchItem, index: number) => (
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      rules={{
                        required: "Unit quantity is required",
                        validate: (value) =>
                          !isNaN(value) || "Unit quantity must be a number",
                        min: { value: 0, message: "Must be non-negative" },
                      }}
                      render={({ field }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^[0-9]*$/.test(value)) {
                              field.onChange(value === "" ? 0 : Number(value));
                            }
                          }}
                          onBlur={field.onBlur}
                          className="w-24 p-2 h-9 text-right rounded border border-neutral-300 
                                   dark:border-neutral-600 bg-white dark:bg-neutral-800 
                                   text-sm text-neutral-900 dark:text-neutral-200 
                                   focus:ring-2 focus:ring-primary/50"
                          disabled={operationLoading}
                        />
                      )}
                    />
                    <span className="w-12 text-xs text-neutral-500 dark:text-neutral-400 text-left truncate">
                      {item?.unit?.code_name || "Units"}(s)
                    </span>
                  </div>
                ),
              },
              {
                key: "actions",
                label: "",
                align: "right",
                render: (_: BatchItem, index: number) => (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 rounded-full border border-neutral-300 dark:border-neutral-600 
                             text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 
                             dark:hover:bg-neutral-700 transition"
                    disabled={operationLoading}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            rowErrors={errors.items?.map((error, index) => ({
              index,
              errors: [
                error?.packaging_quantity && {
                  key: "packaging_quantity",
                  message: error.packaging_quantity.message,
                },
                error?.quantity && {
                  key: "quantity",
                  message: error.quantity.message,
                },
              ].filter(Boolean),
            }))}
          />
        )}

        {fields.length === 0 && (
          <Permission resource="purchase_batches" action="create">
            <button
              type="button"
              onClick={() => setShowAddItemModal(true)}
              disabled={operationLoading}
              className="w-full font-medium mt-3 border-2 border-dashed border-neutral-300 
                       dark:border-neutral-600 rounded-lg py-6 text-sm 
                       text-neutral-500 dark:text-neutral-400 hover:border-primary 
                       hover:text-primary transition disabled:cursor-not-allowed"
            >
              + Add Items
            </button>
          </Permission>
        )}
      </>
    );
  };

  const renderEditModeItems = () => (
    <ReusableTable
      data={getValues("items") || []}
      columns={[
        {
          key: "item_name",
          label: "Item",
          render: (item: BatchItem) => (
            <div className="flex flex-col">
              {item.is_rolled_over && (
                <span className="mb-1 inline-flex items-center w-fit px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 rounded-full">
                  Rolled Over
                </span>
              )}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {item.item_name}
              </span>
            </div>
          ),
        },
        {
          key: "in_stock",
          label: "In Stock",
          align: "right",
          render: (item: BatchItem) => (
            <span className="text-sm text-neutral-800 dark:text-neutral-200">
              {formatNumber(item.in_stock || 0)}{" "}
              <span>{item.unit.code_name}(s)</span>
            </span>
          ),
        },
        {
          key: "actions",
          label: "",
          align: "right",
          render: (item: BatchItem) => (
            <Permission resource="purchase_batches" action="stock_adjustment">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedItem(item);
                  setShowStockAdjustmentModal(true);
                }}
                className="px-3 py-1 text-sm font-medium rounded border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition disabled:opacity-50"
                aria-label="Adjust Stock"
                disabled={operationLoading}
              >
                Adjust
              </button>
            </Permission>
          ),
        },
      ]}
    />
  );

  const renderDocuments = () => (
    <div className="space-y-3 mt-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
          Documents
        </h2>
        <button
          type="button"
          onClick={() =>
            appendDocument({ document_type: "", document_number: "" })
          }
          disabled={operationLoading}
          className="px-3 py-1 text-sm font-medium rounded border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition disabled:cursor-not-allowed"
        >
          + Add Document
        </button>
      </div>

      {/* Table header */}
      {documentFields.length > 0 && (
        <div className="grid grid-cols-[2fr_2fr_50px] gap-2 items-center">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Document Type
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Document Number
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 text-center">
            Action
          </div>
        </div>
      )}

      {/* Rows */}
      {documentFields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-[2fr_2fr_50px] gap-2 items-start"
        >
          {/* Type */}
          <div>
            <Controller
              name={`documents.${index}.document_type`}
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={documentTypes.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  value={
                    field.value
                      ? { value: field.value, label: field.value }
                      : null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
                  isDisabled={operationLoading}
                  placeholder="Document Type"
                  className="my-react-select-container text-sm"
                  classNamePrefix="my-react-select"
                  isClearable
                />
              )}
            />
            {errors.documents?.[index]?.document_type && (
              <p className="text-sm text-red-500 mt-1">
                {errors.documents[index].document_type.message}
              </p>
            )}
          </div>

          {/* Number */}
          <div>
            <input
              id={`documents.${index}.document_number`}
              type="text"
              {...register(`documents.${index}.document_number`)}
              className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
              placeholder="Enter document number"
              disabled={operationLoading}
            />
            {errors.documents?.[index]?.document_number && (
              <p className="text-sm text-red-500 mt-1">
                {errors.documents[index].document_number.message}
              </p>
            )}
          </div>

          {/* Remove */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => removeDocument(index)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition"
              disabled={operationLoading}
              aria-label="Remove document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* General errors */}
      {errors.documents && (
        <p className="text-sm text-red-500">{errors.documents.message}</p>
      )}
    </div>
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission
      resource="purchase_batches"
      action={isEditMode ? "update" : "create"}
      isPage={true}
    >
      <BreadcrumbWithActions
        label={isEditMode ? "Edit Entry" : "Add Entry"}
        breadcrumbs={[
          { name: "Inventory", onClick: () => router.push(routes.inventory) },
          {
            name: "Purchases",
            onClick: () => router.push(routes.purchaseBatches),
          },
          { name: isEditMode ? "Edit Entry" : "Add New Entry" },
        ]}
        actions={[
          {
            title: "Save Changes",
            onClick: handleSubmit(() => setIsConfirmSubmitOpen(true)),
            disabled: operationLoading,
            resource: "purchase_batches",
            action: isEditMode ? "update" : "create",
          },
        ]}
      />
      <div className=" p-4 m-1 flex justify-center">
        <FormProvider {...methods}>
          <form className="w-full max-w-[560px] space-y-5">
            {/* Batch Details */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600 p-5 ">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                  Entry Details
                </h2>
                {isEditMode && (
                  <Permission resource="purchase_batches" action="close">
                    <button
                      type="button"
                      onClick={() => {
                        fetchRemainingItems();
                        setIsConfirmCloseOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded 
               bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 
               text-white  transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Close Entry
                    </button>
                  </Permission>
                )}
              </div>

              <div className="space-y-4">
                {/* Entry Name */}
                <div>
                  <label
                    htmlFor="purchase_batch_name"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Entry Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="purchase_batch_name"
                    type="text"
                    {...register("purchase_batch_name")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter name"
                  />
                  {errors.purchase_batch_name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.purchase_batch_name.message}
                    </p>
                  )}
                </div>

                {/* Notes */}
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
                    placeholder="Enter batch notes"
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600 p-5 ">
              {renderDocuments()}
            </div>

            {/* Line Items */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600 p-6 ">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Purchased Items
                </h2>
                {isEditMode && (
                  <Permission resource="purchase_batches" action="update">
                    <button
                      type="button"
                      onClick={() => setShowAddItemModal(true)}
                      disabled={operationLoading}
                      className="px-4 py-1.5 text-sm font-medium rounded bg-primary/90 text-white hover:bg-primary  transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + Add Item
                    </button>
                  </Permission>
                )}
              </div>

              <div className="space-y-3">
                {isEditMode ? renderEditModeItems() : renderCreateModeItems()}
              </div>
            </div>
          </form>
        </FormProvider>

        {/* Add Item Modal (Edit Mode Only) */}
        {isEditMode && showAddItemModal && (
          <FormProvider {...addItemMethods}>
            <form
              onSubmit={handleAddItemSubmit(handleAddItemToBatch)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            >
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg max-w-lg w-full flex flex-col">
                {/* Header */}
                <div className="border-b border-neutral-200 dark:border-neutral-600">
                  <div className="flex justify-between items-center px-6 py-4">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Add Item
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        resetAddItem();
                        setShowAddItemModal(false);
                      }}
                      className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition"
                      disabled={operationLoading}
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-5 px-6 py-5">
                  {/* Item select - full width */}
                  <div className="w-full">
                    <label
                      htmlFor="item_id"
                      className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                    >
                      Item <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="item_id"
                      control={addItemControl}
                      render={({ field }) => (
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          loadOptions={loadItems}
                          value={
                            field.value
                              ? {
                                  value: field.value,
                                  label: addItemMethods.getValues("item_name"),
                                }
                              : null
                          }
                          onChange={(option) => {
                            if (option) {
                              field.onChange(option.value);
                              addItemMethods.setValue(
                                "item_name",
                                option.item.item_name
                              );
                              addItemMethods.setValue(
                                "packaging_units",
                                option.item.packaging_units
                              );
                              addItemMethods.setValue(
                                "quantity_units",
                                option.item.quantity_units
                              );
                            } else {
                              field.onChange("");
                              addItemMethods.setValue("item_name", "");
                              addItemMethods.setValue("packaging_units", null);
                              addItemMethods.setValue(
                                "quantity_units",
                                null
                              );
                            }
                          }}
                          placeholder="Search item"
                          className="my-react-select-container text-sm w-full"
                          classNamePrefix="my-react-select"
                          isClearable
                          isDisabled={operationLoading}
                        />
                      )}
                    />
                    {addItemErrors.item_id && (
                      <p className="text-xs text-red-500 mt-1">
                        {addItemErrors.item_id.message}
                      </p>
                    )}
                  </div>

                  {/* Quantities - only show if item selected */}
                  {/* Quantities - only show if item selected */}
                  {/* Quantities - only show if item selected */}
                  {addItemMethods.watch("item_id") && (
                    <>
                      {/* Disclaimer if purchase and usage units are the same */}
                      {addItemMethods.watch("packaging_units")?.code_name ===
                        addItemMethods.watch("quantity_units")
                          ?.code_name && (
                        <div className="flex items-start gap-2 mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            This item uses{" "}
                            <strong>
                              {
                                addItemMethods.watch("quantity_units")
                                  ?.code_name
                              }
                            </strong>{" "}
                            as both purchase and usage unit. Use either field,
                            but not both.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-4">
                        {/* Left header */}
                        <div className="pt-2">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                            QTY
                          </span>
                        </div>

                        {/* Right stacked rows */}
                        <div className="flex flex-col gap-3 flex-1">
                          {/* Purchase Unit Qty */}
                          <div className="flex items-center gap-2">
                            <input
                              id="packaging_quantity"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              {...addItemMethods.register(
                                "packaging_quantity",
                                {
                                  valueAsNumber: true,
                                }
                              )}
                              className="w-full max-w-[140px] p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 
                       bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200 text-center"
                              disabled={operationLoading}
                            />

                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-20">
                                Purchase Unit
                              </span>

                              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                {addItemMethods.watch("packaging_units")
                                  ?.code_name || "Pkg"}
                                (s)
                              </span>
                            </div>
                          </div>
                          {addItemErrors.packaging_quantity && (
                            <p className="text-xs text-red-500">
                              {addItemErrors.packaging_quantity.message}
                            </p>
                          )}

                          {/* Usage Unit Qty */}
                          <div className="flex items-center gap-2">
                            <input
                              id="quantity"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              {...addItemMethods.register("quantity", {
                                valueAsNumber: true,
                              })}
                              className="w-full max-w-[140px] p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 
                       bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200 text-center"
                              disabled={operationLoading}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-20">
                                Usage Unit
                              </span>

                              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                {addItemMethods.watch("quantity_units")
                                  ?.code_name || "Units"}
                                (s)
                              </span>
                            </div>
                          </div>
                          {(addItemErrors.quantity || addItemErrors.root) && (
                            <p className="text-xs text-red-500">
                              {addItemErrors.quantity?.message ||
                                addItemErrors.root?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-neutral-200 dark:border-neutral-600 mt-6">
                  <div className="flex justify-end gap-3 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetAddItem();
                        setShowAddItemModal(false);
                      }}
                      className="px-4 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                      disabled={operationLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow hover:bg-primary/90 transition disabled:cursor-not-allowed flex items-center"
                      disabled={operationLoading}
                    >
                      Save Item
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </FormProvider>
        )}

        {/* Stock Adjustment Modal */}
        {showStockAdjustmentModal && selectedItem && (
          <FormProvider {...stockAdjustmentMethods}>
            <form
              onSubmit={handleStockAdjustmentSubmit(handleStockAdjustment)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            >
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-600 px-6 py-4">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Adjust: {selectedItem.item_name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      resetStockAdjustment();
                      setShowStockAdjustmentModal(false);
                      setSelectedItem(null);
                    }}
                    className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    disabled={operationLoading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-5 px-6 py-5">
                  {/* Quantities */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1 text-xs pl-2 font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      QTY
                    </label>
                    {/* Purchase Units */}
                    <div className="w-full">
                      <div className="flex  items-center gap-2">
                        <Controller
                          name="counted_quantity_packaging"
                          control={stockAdjustmentControl}
                          render={({ field }) => (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="w-24 p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-center"
                              disabled={operationLoading}
                            />
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Purchase Units
                          </span>

                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {selectedItem.packaging_units.code_name ||
                              "Purchase"}
                            (s)
                          </span>
                        </div>
                      </div>
                      {stockAdjustmentErrors.counted_quantity_packaging && (
                        <p className="text-xs text-red-500 mt-1">
                          {
                            stockAdjustmentErrors.counted_quantity_packaging
                              .message
                          }
                        </p>
                      )}
                    </div>

                    {/* Usage Units */}
                    <div className="w-full flex flex-col">
                      <div>
                        <div className="flex items-center gap-2">
                          <Controller
                            name="counted_quantity_unit"
                            control={stockAdjustmentControl}
                            render={({ field }) => (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null
                                  )
                                }
                                className="w-24 p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-center"
                                disabled={operationLoading}
                              />
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                              Usage Units
                            </span>

                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {selectedItem.unit.code_name || "Usage"}(s)
                            </span>
                          </div>
                        </div>
                      </div>
                      {stockAdjustmentErrors.counted_quantity_unit && (
                        <p className="text-xs text-red-500 mt-1">
                          {stockAdjustmentErrors.counted_quantity_unit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Helper if units match */}
                  {selectedItem.unit.code_name ===
                    selectedItem.packaging_units.code_name && (
                    <div className="flex items-start gap-2 mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        This item uses{" "}
                        <strong>{selectedItem.unit.code_name}</strong> as both
                        purchase and usage unit. Use either field, but not both.
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="type"
                      control={stockAdjustmentControl}
                      render={({ field }) => (
                        <Select
                          options={adjustmentReasons.map((type) => ({
                            value: type,
                            label:
                              type.charAt(0).toUpperCase() +
                              type.slice(1).replace("_", " "),
                          }))}
                          isDisabled={operationLoading}
                          className="my-react-select-container text-sm"
                          classNamePrefix="my-react-select"
                          isClearable
                          value={
                            field.value
                              ? {
                                  value: field.value,
                                  label:
                                    field.value.charAt(0).toUpperCase() +
                                    field.value.slice(1).replace("_", " "),
                                }
                              : null
                          }
                          onChange={(option) =>
                            field.onChange(option ? option.value : "")
                          }
                        />
                      )}
                    />
                    {stockAdjustmentErrors.type && (
                      <p className="text-xs text-red-500 mt-1">
                        {stockAdjustmentErrors.type.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-600 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetStockAdjustment();
                      setShowStockAdjustmentModal(false);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    disabled={operationLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded disabled:opacity-50 flex items-center gap-2"
                    disabled={operationLoading}
                  >
                    Save Adjustment
                  </button>
                </div>
              </div>
            </form>
          </FormProvider>
        )}

        {/* Bulk Add Items Modal (Create Mode Only) */}
        {!isEditMode && showAddItemModal && (
          <BulkAddItemsModal
            onSubmit={handleAddNewItem}
            onCancel={() => setShowAddItemModal(false)}
            operationLoading={operationLoading}
            batchableItemsEndpoint={endpoints.getPurchaseBatchableItemsBulk}
          />
        )}

        {showBatchesCount && (
          <ConfirmDialog
            title="Maximum Open Entries Reached"
            message={
              <div>
                There are currently{" "}
                <span className="font-bold">
                  {openBatchesCount} open batch(es)
                </span>
                . The maximum limit of 10 open batches has been reached. Please
                close an existing batch before creating a new one.
              </div>
            }
            confirmLabel="Go to List"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => router.push(routes.purchaseBatches)}
            onCancel={() => setShowBatchesCount(false)}
          />
        )}

        {isConfirmSubmitOpen && (
          <ConfirmDialog
            title={isEditMode ? "Confirm Update" : "Confirm Creation"}
            message={
              <div>
                These changes will immediately affect stock quantities for the
                selected items.
              </div>
            }
            confirmLabel="Save"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleSubmit(handleSaveBatch)}
            onCancel={() => setIsConfirmSubmitOpen(false)}
          />
        )}

        {isConfirmCloseOpen && (
          <ConfirmDialog
            title="Confirm Close Batch"
            message={
              <div>
                {!operationLoading ? (
                  remainingItems.length > 0 ? (
                    <>
                      <p>
                        The following items have remaining quantities and will
                        be rolled over to a new batch:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {remainingItems.slice(0, 10).map((item) => (
                          <span
                            key={item.item_id}
                            className="inline-flex items-center px-2 py-1 text-sm font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 rounded"
                          >
                            {item.item_name} ({formatNumber(item.quantity)})
                          </span>
                        ))}
                        {remainingItems.length > 10 && (
                          <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 rounded">
                            and more
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    "Are you sure you want to close this batch? This action cannot be undone."
                  )
                ) : (
                  <div className="flex gap-1 items-center font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
            }
            confirmLabel="Close Batch"
            cancelLabel="Don't Close"
            destructive
            onConfirm={handleCloseBatch}
            onCancel={() => setIsConfirmCloseOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default PurchaseBatchForm;
