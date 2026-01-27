"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Package, Plus, Copy, AlertTriangle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import clsx from "clsx";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import FloatingInput from "@/components/common/FloatingInput";
import { routes } from "@/constants/routes";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface UomConfig {
  id: string;
  quantity_units: { code: string; code_name: string };
  packaging_units: { code: string; code_name: string };
  conversion_factor: number;
}

interface BreakdownConfigItem {
  item_id: string;
  qty: number;
}

interface FormData {
  item_name: string;
  purchase_cost: number;
  quantity_units?: { code: string; code_name: string } | null;
  packaging_units?: { code: string; code_name: string } | null;
  conversion_factor?: number;
  store_location_id: string;
  purchase_date: string;
  initial_quantity: number;
  breakdown_config: {
    items: BreakdownConfigItem[];
    remaining_quantity: number;
    status: string;
    opened_at: string;
    closed_at: null;
  };
  notes?: string;
}

interface SimpleItem {
  id: string;
  item_name: string;
}

const bulkItemSchema = Joi.object({
  item_name: Joi.string().min(2).max(100).required().label("Name").messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "string.min": "Name should have at least 2 characters.",
    "string.max": "Name should not exceed 100 characters.",
    "any.required": "Name is required.",
  }),
  purchase_cost: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .label("Purchase Cost")
    .custom((value, helpers) => {
      const strValue = value.toString().replace(".", "");
      if (strValue.length > 10) {
        return helpers.error("number.maxDigits", { limit: 10 });
      }
      return value;
    })
    .messages({
      "number.base": "Purchase Cost must be a valid number.",
      "number.min": "Purchase Cost must be greater than or equal to 0.",
      "number.precision": "Purchase Cost can have up to 2 decimal places.",
      "number.maxDigits": "Purchase Cost cannot exceed 10 digits.",
      "any.required": "Purchase Cost is required.",
    }),
  quantity_units: Joi.object({
    code: Joi.string().optional().label("Unit Code"),
    code_name: Joi.string().optional().label("Unit Name"),
  })
    .allow(null)
    .optional()
    .label("Units of Quantity")
    .messages({
      "object.base": "Units of quantity must be a valid object.",
    }),
  packaging_units: Joi.object({
    code: Joi.string().optional().label("Packaging Unit Code"),
    code_name: Joi.string().optional().label("Packaging Unit Name"),
  })
    .allow(null)
    .optional()
    .label("Packaging Units")
    .messages({
      "object.base": "Packaging units must be a valid object.",
    }),
  conversion_factor: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .label("Conversion Factor")
    .messages({
      "number.base": "Conversion Factor must be a valid number.",
      "number.min": "Conversion Factor must be greater than or equal to 0.",
      "number.precision": "Conversion Factor can have up to 2 decimal places.",
    }),
  store_location_id: Joi.string().uuid().required().label("Store Location").messages({
    "string.uuid": "Store Location must be a valid UUID.",
    "any.required": "Store Location is required.",
  }),
  purchase_date: Joi.string().isoDate().required().label("Purchase Date").messages({
    "string.isoDate": "Purchase Date must be a valid date.",
    "any.required": "Purchase Date is required.",
  }),
  initial_quantity: Joi.number()
    .min(1)
    .precision(2)
    .required()
    .label("Initial Quantity")
    .messages({
      "number.base": "Initial Quantity must be a valid number.",
      "number.min": "Initial Quantity must be greater than or equal to 1.",
      "number.precision": "Initial Quantity can have up to 2 decimal places.",
      "any.required": "Initial Quantity is required.",
    }),
  breakdown_config: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          item_id: Joi.string().uuid().required().label("Child Item ID"),
          qty: Joi.number().min(1).precision(2).required().label("Child Quantity"),
        })
      )
      .min(1)
      .required()
      .label("Child Items"),
    remaining_quantity: Joi.number().min(0).precision(2).required().label("Remaining Quantity"),
    status: Joi.string().valid("open").required().label("Status"),
    opened_at: Joi.string().isoDate().required().label("Opened At"),
    closed_at: Joi.any().allow(null).optional(),
  }).required().label("Breakdown Configuration"),
  notes: Joi.string().allow("").optional().label("Notes").messages({
    "string.base": "Notes must be a string.",
  }),
}).options({ stripUnknown: true });

const AddBulkItemForm = () => {
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [uomConfigs, setUomConfigs] = useState<UomConfig[]>([]);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [payload, setPayload] = useState({});

  const { business_profile } = useAppState();
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: joiResolver(bulkItemSchema),
    defaultValues: {
      item_name: "",
      purchase_cost: 0,
      quantity_units: null,
      packaging_units: null,
      conversion_factor: 1,
      store_location_id: "",
      purchase_date: new Date().toISOString().split("T")[0], // Current date: 2025-07-21
      initial_quantity: 0,
      breakdown_config: {
        items: [],
        remaining_quantity: 0,
        status: "open",
        opened_at: new Date().toISOString(), // e.g., 2025-07-21T05:17:00Z
        closed_at: null,
      },
      notes: "",
    },
  });

  const {
    handleSubmit,
    register,
    watch,
    reset,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = methods;

  const items = watch("breakdown_config.items");
  const initial_quantity = watch("initial_quantity");
  const selectedUomConfigId = watch("quantity_units")?.code;

  // Update remaining_quantity when initial_quantity changes
  useEffect(() => {
    setValue("breakdown_config.remaining_quantity", initial_quantity);
  }, [initial_quantity, setValue]);

  // Fetch uom configs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const uomResponse = await api.get("/api/uoms");
        setUomConfigs(uomResponse.data.data);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Searchable dropdown for simple items
  const loadItemOptions = async (inputValue: string) => {
    try {
      const response = await api.get(`/api/items?type=is_simple_item&search=${inputValue}`);
      return response.data.data.map((item: any) => ({
        value: item.id,
        label: item.item_name,
      }));
    } catch (error: any) {
      toast.error("Failed to search items");
      return [];
    }
  };

  const handleSaveItem = async (data?: any, confirmAction: string) => {
    const values = data || payload;
    setOperationLoading(true);
    try {
      // Create item in items table
      const itemResponse = await api.post("/api/items", {
        item_name: values.item_name,
        buying_price: values.purchase_cost,
        selling_price: null,
        quantity_units: values.quantity_units,
        packaging_units: values.packaging_units,
        conversion_factor: values.conversion_factor || 1,
        store_locations: [{ store_location_id: values.store_location_id }],
        is_service: false,
        is_simple_item: false,
        is_bulk_item: true,
        is_sold: false,
        is_purchased: true,
        is_active: true,
        is_made_here: false,
      });

      const itemId = itemResponse.data.data.id;

      // Create bulk item in bulk_items table
      await api.post("/api/bulk-items", {
        item_id: itemId,
        purchase_date: values.purchase_date,
        purchase_cost: values.purchase_cost,
        initial_quantity: values.initial_quantity,
        remaining_quantity: values.breakdown_config.remaining_quantity,
        breakdown_config: { items: values.breakdown_config.items },
        status: values.breakdown_config.status,
        opened_at: values.breakdown_config.opened_at,
        closed_at: values.breakdown_config.closed_at,
        notes: values.notes,
      });

      toast.success("Bulk item purchase created.");

      if (confirmAction === "saveAndAdd") {
        reset({
          item_name: "",
          purchase_cost: 0,
          quantity_units: null,
          packaging_units: null,
          conversion_factor: 1,
          store_location_id: "",
          purchase_date: new Date().toISOString().split("T")[0],
          initial_quantity: 0,
          breakdown_config: {
            items: [],
            remaining_quantity: 0,
            status: "open",
            opened_at: new Date().toISOString(),
            closed_at: null,
          },
          notes: "",
        });
      } else if (confirmAction === "duplicate") {
        const currentValues = getValues();
        reset({
          ...currentValues,
          item_name: "",
        });
      } else {
        router.push(routes.purchases);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save bulk item purchase.");
    } finally {
      setOperationLoading(false);
      setIsConfirmSubmitOpen(false);
    }
  };

  const handleConfirmSubmit =
    (action: "save" | "saveAndAdd" | "duplicate") => async (data: FormData) => {
      const payload = { ...data };
      setPayload(payload);
      setConfirmAction(action);
      setIsConfirmSubmitOpen(true);
    };

  const addItem = () => {
    setValue("breakdown_config.items", [...items, { item_id: "", qty: 0 }]);
  };

  const removeItem = (index: number) => {
    setValue("breakdown_config.items", items.filter((_, i) => i !== index));
  };

  const selectedUomConfig = uomConfigs.find((uom) => uom.quantity_units?.code === selectedUomConfigId);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="items" action="create" isPage={true}>
      <div className="">
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4 flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 dark:text-blue-300 flex-shrink-0" />
          <div className="text-sm text-neutral-800 dark:text-neutral-200">
            <p className="font-semibold">What is a Bulk Item Purchase?</p>
            <p>
              A bulk item purchase involves buying a large item that is broken down into smaller units for sale. For example, a mtumba bale might contain 40 shirts and 60 socks. You record the purchase details, including the cost and child items, to track the inventory.
            </p>
            <p className="mt-2">
              <span className="font-medium">Insights Provided:</span> Track total profit by comparing purchase cost to sales of child items, monitor sales performance per child item, and view remaining quantities to manage stock effectively.
            </p>
          </div>
        </div>
        <BreadcrumbWithActions
          label="Add Bulk Item Purchase"
          breadcrumbs={[
            { name: "Purchases", onClick: () => router.push(routes.purchases) },
            { name: "Add New Bulk Item Purchase" },
          ]}
          actions={[
            {
              title: "Save Changes",
              onClick: handleSubmit(handleConfirmSubmit("save")),
              disabled: operationLoading,
              resource: "items",
              action: "create",
            },
            {
              title: "Save and Add Another",
              onClick: handleSubmit(handleConfirmSubmit("saveAndAdd")),
              disabled: operationLoading,
              resource: "items",
              action: "create",
            },
            {
              title: "Save and Duplicate",
              onClick: handleSubmit(handleConfirmSubmit("duplicate")),
              disabled: operationLoading,
              resource: "items",
              action: "create",
            },
          ]}
        />
        <div className="p-3">
          <FormProvider {...methods}>
            <form className="w-full mx-auto space-y-3">
              {/* Basic Details */}
              <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md p-3 space-y-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                      Basic Details
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Provide the details of the bulk item purchase, including its name, cost, packaging, location, and child items.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <FloatingInput
                        id="item_name"
                        label="Bulk Item Name"
                        required
                        register={register("item_name")}
                        error={errors.item_name?.message}
                        backgroundClass="bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <div>
                      <FloatingInput
                        id="purchase_cost"
                        label="Purchase Cost"
                        required
                        type="text"
                        register={register("purchase_cost", {
                          setValueAs: (v) => {
                            const str = String(v).trim();
                            if (str === "") return undefined;
                            const parsed = parseFloat(str.replace(/,/g, ""));
                            return isNaN(parsed) ? undefined : parsed;
                          },
                          validate: {
                            isNumber: (v) => (typeof v === "number" && !isNaN(v)) || "Must be a valid number.",
                            hasTwoDecimals: (v) =>
                              /^\d+(\.\d{1,2})?$/.test(String(v)) || "Maximum 2 decimal places allowed.",
                          },
                        })}
                        error={errors.purchase_cost?.message}
                        backgroundClass="bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <FloatingInput
                        id="purchase_date"
                        label="Purchase Date"
                        required
                        type="date"
                        register={register("purchase_date")}
                        error={errors.purchase_date?.message}
                        backgroundClass="bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <div>
                      <FloatingInput
                        id="initial_quantity"
                        label="Initial Quantity"
                        required
                        type="number"
                        register={register("initial_quantity", { valueAsNumber: true })}
                        error={errors.initial_quantity?.message}
                        backgroundClass="bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Store Location <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="store_location_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={business_profile?.map((location) => ({
                            value: location.store_location_id || location.id,
                            label:
                              location.store_location_name ||
                              location.location_name + (location.is_default ? " (Main)" : ""),
                          }))}
                          value={business_profile
                            ?.map((location) => ({
                              value: location.store_location_id || location.id,
                              label:
                                location.store_location_name ||
                                location.location_name + (location.is_default ? " (Main)" : ""),
                            }))
                            .find((opt) => opt.value === field.value)}
                          onChange={(option) => field.onChange(option?.value || "")}
                          placeholder="Select Store Location"
                          className="my-react-select-container"
                          classNamePrefix="my-react-select"
                        />
                      )}
                    />
                    {errors.store_location_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.store_location_id.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      I Sell In
                    </label>
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
                              label: uom.quantity_units?.code_name || "Unknown",
                              uom,
                            }))
                            .find((opt) => opt.value === field.value?.code)}
                          onChange={(option) => field.onChange(option?.uom?.quantity_units || null)}
                          placeholder="Select Unit of Measure"
                          className="my-react-select-container"
                          classNamePrefix="my-react-select"
                          isClearable
                        />
                      )}
                    />
                    {errors.quantity_units && (
                      <p className="text-red-500 text-sm mt-1">{errors.quantity_units.message}</p>
                    )}
                  </div>
                  {selectedUomConfig && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Packaging Unit
                        </label>
                        <Controller
                          name="packaging_units"
                          control={control}
                          render={({ field }) => (
                            <Select
                              options={uomConfigs.map((uom) => ({
                                value: uom.packaging_units?.code,
                                label: uom.packaging_units?.code_name || "Unknown",
                                uom,
                              }))}
                              value={uomConfigs
                                .map((uom) => ({
                                  value: uom.packaging_units?.code,
                                  label: uom.packaging_units?.code_name || "Unknown",
                                  uom,
                                }))
                                .find((opt) => opt.value === field.value?.code)}
                              onChange={(option) => field.onChange(option?.uom?.packaging_units || null)}
                              placeholder="Select Packaging Unit"
                              className="my-react-select-container"
                              classNamePrefix="my-react-select"
                              isClearable
                            />
                          )}
                        />
                        {errors.packaging_units && (
                          <p className="text-red-500 text-sm mt-1">{errors.packaging_units.message}</p>
                        )}
                      </div>
                      <div>
                        <FloatingInput
                          id="conversion_factor"
                          label="Conversion Factor"
                          type="number"
                          register={register("conversion_factor", { valueAsNumber: true })}
                          error={errors.conversion_factor?.message}
                          backgroundClass="bg-white dark:bg-neutral-800"
                        />
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {selectedUomConfig.conversion_factor} {selectedUomConfig.quantity_units?.code_name} (s) = 1 {selectedUomConfig.packaging_units?.code_name}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Child Items <span className="text-red-500">*</span>
                    </label>
                    {items.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 mb-3">
                        <Controller
                          name={`breakdown_config.items[${index}].item_id`}
                          control={control}
                          render={({ field }) => (
                            <AsyncSelect
                              cacheOptions
                              defaultOptions
                              loadOptions={loadItemOptions}
                              value={items[index].item_id ? { value: item.item_id, label: item.item_id } : null}
                              onChange={(option) => field.onChange(option?.value || "")}
                              placeholder="Search and select child item"
                              className="my-react-select-container flex-1"
                              classNamePrefix="my-react-select"
                            />
                          )}
                        />
                        <FloatingInput
                          id={`breakdown_config.items[${index}].qty`}
                          label="Quantity"
                          required
                          type="number"
                          register={register(`breakdown_config.items[${index}].qty`, {
                            valueAsNumber: true,
                          })}
                          error={errors.breakdown_config?.items?.[index]?.qty?.message}
                          backgroundClass="bg-white dark:bg-neutral-800"
                          className="w-full sm:w-1/4"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {errors.breakdown_config?.items && (
                      <p className="text-red-500 text-sm mt-1">{errors.breakdown_config.items.message}</p>
                    )}
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-2 px-4 py-2 border border-primary rounded text-primary text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Child Item
                    </button>
                  </div>
                  <div>
                    <FloatingInput
                      id="notes"
                      label="Notes"
                      type="textarea"
                      register={register("notes")}
                      error={errors.notes?.message}
                      backgroundClass="bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md p-3 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Permission resource="items" action="create">
                    <button
                      type="button"
                      onClick={handleSubmit(handleConfirmSubmit("saveAndAdd"))}
                      disabled={operationLoading}
                      className={clsx(
                        "flex items-center justify-center gap-2 px-4 py-2 border border-primary rounded text-primary text-sm font-medium",
                        "disabled:cursor-not-allowed dark:disabled:text-primary",
                        "sm:w-auto w-full"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      Save and Add Another
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit(handleConfirmSubmit("duplicate"))}
                      disabled={operationLoading}
                      className={clsx(
                        "flex items-center justify-center gap-2 px-4 py-2 border border-primary rounded text-primary text-sm font-medium",
                        "disabled:cursor-not-allowed",
                        "sm:w-auto w-full"
                      )}
                    >
                      <Copy className="w-4 h-4" />
                      Save and Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit(handleConfirmSubmit("save"))}
                      disabled={operationLoading}
                      className={clsx(
                        "px-4 py-2 bg-primary text-white text-sm font-medium rounded",
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
            title="Confirm Bulk Item Purchase Creation"
            message={
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1 text-red-700 dark:text-red-400" />
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>You're about to create a new bulk item purchase.</p>
                  <p className="text-red-700 dark:text-red-400">
                    This will record the purchase and allow breaking into child items for sale.
                  </p>
                  <p>Ensure all details, especially child items and quantities, are correct before proceeding.</p>
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
            onConfirm={() => handleSaveItem(payload, confirmAction)}
            onCancel={() => setIsConfirmSubmitOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default AddBulkItemForm;