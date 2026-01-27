"use client";

import PageSkeleton from "@/components/common/PageSkeleton";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Store, AlertTriangle, Copy, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";
import clsx from "clsx";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import FloatingInput from "@/components/common/FloatingInput";
import { routes } from "@/constants/routes";
import { Permission } from "@/components/common/Permission";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface StoreLocationData {
  store_location_id: string;
}

interface FormData {
  item_name: string;
  category_id?: string;
  base_price: number;
  service_duration_hours: number;
  commission_type: string;
  commission_value: number;
  has_commission: boolean;
  allow_custom_price: boolean;
  tax_type: {
    code: string;
    code_name: string;
  } | null;
  store_locations: StoreLocationData[];
}

const taxTypes = [
  { code: "vat", code_name: "VAT" },
  { code: "non-vat", code_name: "Non-VAT" },
  { code: "exempt", code_name: "Exempt" },
];

const serviceSchema = Joi.object({
  item_name: Joi.string().min(2).max(100).required().label("Name").messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "string.min": "Name should have at least 2 characters.",
    "string.max": "Name should not exceed 100 characters.",
    "any.required": "Name is required.",
  }),
  category_id: Joi.string().uuid().allow(null).optional().label("Category").messages({
    "string.uuid": "Category must be a valid UUID.",
  }),
  base_price: Joi.number().min(0).precision(2).required().label("Base Price").messages({
    "number.base": "Base Price must be a valid number.",
    "number.min": "Base Price must be greater than or equal to 0.",
    "number.precision": "Base Price can have up to 2 decimal places.",
    "any.required": "Base Price is required.",
  }),
  service_duration_hours: Joi.number().min(0).precision(2).optional().label("Duration (Hours)").messages({
    "number.base": "Duration must be a valid number.",
    "number.min": "Duration must be greater than or equal to 0.",
    "number.precision": "Duration can have up to 2 decimal places.",
  }),
  commission_type: Joi.string().valid("fixed", "percentage").required().label("Commission Type").messages({
    "string.base": "Commission Type must be a string.",
    "any.only": "Commission Type must be 'fixed' or 'percentage'.",
    "any.required": "Commission Type is required.",
  }),
  commission_value: Joi.when("has_commission", {
    is: true,
    then: Joi.number().min(0).precision(2).required().label("Commission Value"),
    otherwise: Joi.number().allow(0),
  }).messages({
    "number.base": "Commission Value must be a valid number.",
    "number.min": "Commission Value must be greater than or equal to 0.",
    "number.precision": "Commission Value can have up to 2 decimal places.",
    "any.required": "Commission Value is required when commission is enabled.",
  }),
  has_commission: Joi.boolean().required().label("Enable Commission").messages({
    "boolean.base": "Enable Commission must be true or false.",
    "any.required": "Enable Commission is required.",
  }),
  allow_custom_price: Joi.boolean().required().label("Prompt for Custom Price").messages({
    "boolean.base": "Prompt for Custom Price must be true or false.",
    "any.required": "Prompt for Custom Price is required.",
  }),
  tax_type: Joi.object({
    code: Joi.string().valid("vat", "non-vat", "exempt").optional().label("Tax Code"),
    code_name: Joi.string().optional().label("Tax Name"),
  }).unknown(true).custom((value, helpers) => {
    if (value === null) return value;
    if (typeof value !== "object" || Object.keys(value).length === 0) {
      return helpers.error("object.min");
    }
    return value;
  }).required().label("Tax Type").messages({
    "object.base": "Tax type is required.",
    "object.min": "Tax type cannot be empty.",
  }),
  store_locations: Joi.array().items(
    Joi.object({
      store_location_id: Joi.string().uuid().required().label("Store Location ID"),
    })
  ).optional().label("Store Locations"),
}).options({ stripUnknown: true });

const ServiceForm = () => {
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [service, setService] = useState<any | null>(null);
  const [categories, setCategories] = useState<{ id: string; category_name: string }[]>([]);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");

  const [payload, setPayload] = useState({});
  const { business_profile } = useAppState();
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const defaultStoreLocations = useMemo(
    () => business_profile?.map((location) => ({
      store_location_id: location.store_location_id || location.id,
    })) || [],
    [business_profile]
  );

  const methods = useForm<FormData>({
    resolver: joiResolver(serviceSchema),
    defaultValues: {
      item_name: "",
      category_id: undefined,
      base_price: 0,
      service_duration_hours: 0,
      commission_type: "fixed",
      commission_value: 0,
      has_commission: false,
      allow_custom_price: false,
      tax_type: { code: "non-vat", code_name: "Non-VAT" },
      store_locations: defaultStoreLocations,
    },
  });

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
    getValues,
    watch,
  } = methods;

  const has_commission = watch("has_commission");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catResponse = await api.get("/api/categories");
        setCategories(catResponse.data.data);

        if (id) {
          const serviceResponse = await api.get(`/api/items/${id}`);
          const serviceData = serviceResponse.data.data;
          setService(serviceData);
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
    if (!service) return;

    reset({
      item_name: service.item_name || "",
      category_id: service.category_id || undefined,
      base_price: service.service_details?.base_price || 0,
      service_duration_hours: service.service_details?.service_duration_hours || 0,
      commission_type: service.service_details?.commission_type || "fixed",
      commission_value: service.service_details?.commission_value || 0,
      has_commission: service.service_details?.has_commission || false,
      allow_custom_price: service.service_details?.allow_custom_price || false,
      tax_type: service.tax_type || { code: "non-vat", code_name: "Non-VAT" },
      store_locations: service.store_locations || defaultStoreLocations,
    });
  }, [service, reset, defaultStoreLocations]);

  const handleSaveService = async (data?: any, confirmAction: string) => {
    const values = id ? payload : data;
    setOperationLoading(true);
    try {
      const payloadWithServiceDetails = {
        ...values,
        is_service: true,
        service_details: {
          base_price: values.base_price,
          service_duration_hours: values.service_duration_hours || 0,
          commission_type: values.has_commission ? values.commission_type : "fixed",
          commission_value: values.has_commission ? values.commission_value : 0,
          has_commission: values.has_commission,
          allow_custom_price: values.allow_custom_price,
        },
      };
      if (id) {
        await api.patch(`/api/items/services/${id}`, payloadWithServiceDetails);
        toast.success("Service updated.");
      } else {
        await api.post(`/api/items/services`, payloadWithServiceDetails);
        toast.success("Service created.");
      }

      if (confirmAction === "saveAndAdd") {
        reset({
          item_name: "",
          category_id: undefined,
          base_price: 0,
          service_duration_hours: 0,
          commission_type: "fixed",
          commission_value: 0,
          has_commission: false,
          allow_custom_price: false,
          tax_type: { code: "non-vat", code_name: "Non-VAT" },
          store_locations: defaultStoreLocations,
        });
      } else if (confirmAction === "duplicate") {
        const currentValues = getValues();
        reset({
          ...currentValues,
          item_name: "",
        });
      } else {
        router.push(routes.servicesList);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save service.");
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
        store_locations: data.store_locations.length > 0 ? data.store_locations : undefined,
      };
      setPayload(payload);
      setConfirmAction(action);

      if (id) {
        setIsConfirmSubmitOpen(true);
      } else {
        await handleSaveService(payload, action);
      }
    };

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
          label={id ? "Edit Service" : "Add Service"}
          breadcrumbs={[
            { name: "Items", onClick: () => router.push(routes.items) },
            {
              name: "Items List",
              onClick: () => router.push(routes.itemsList),
            },
            {
              name: id ? service?.item_name || "Edit Service" : "Add New Service",
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
       <div className="p-3 bg-white dark:bg-neutral-800">
  <FormProvider {...methods}>
    <form className="w-full max-w-[460px] md:w-full mx-auto space-y-3">
      {/* Service Details */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Service Details
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FloatingInput
                id="item_name"
                label="Service Name"
                required
                register={register("item_name")}
                error={errors.item_name?.message}
                backgroundClass="bg-white dark:bg-neutral-800"
                className="text-sm"
              />
            </div>
            <div>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FloatingInput
                id="base_price"
                label="Base Price"
                required
                type="text"
                backgroundClass="bg-white dark:bg-neutral-800"
                register={register("base_price", {
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
                error={errors.base_price?.message}
                className="text-sm"
              />
            </div>
            <div>
              <FloatingInput
                id="service_duration_hours"
                label="Duration (Hours)"
                type="text"
                backgroundClass="bg-white dark:bg-neutral-800"
                register={register("service_duration_hours", {
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
                error={errors.service_duration_hours?.message}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Commission Details */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Commission Details
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_commission"
              {...register("has_commission")}
              className="h-6 w-6 text-primary accent-primary border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-800"
            />
            <label
              htmlFor="has_commission"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Enable Commission for Service Providers
            </label>
          </div>
          {has_commission && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Commission Type <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="commission_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={[
                        { value: "fixed", label: "Fixed" },
                        { value: "percentage", label: "Percentage" },
                      ]}
                      value={[
                        { value: "fixed", label: "Fixed" },
                        { value: "percentage", label: "Percentage" },
                      ].find((opt) => opt.value === field.value)}
                      onChange={(option) =>
                        field.onChange(option?.value || "fixed")
                      }
                      placeholder="Select Commission Type"
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                    />
                  )}
                />
                {errors.commission_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.commission_type.message}
                  </p>
                )}
              </div>
              <div>
                <FloatingInput
                  id="commission_value"
                  label="Commission Value"
                  required
                  type="text"
                  backgroundClass="bg-white dark:bg-neutral-800"
                  register={register("commission_value", {
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
                  error={errors.commission_value?.message}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow_custom_price"
              {...register("allow_custom_price")}
              className="h-6 w-6 text-primary accent-primary border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-800"
            />
            <label
              htmlFor="allow_custom_price"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Prompt for Custom Price at POS
            </label>
          </div>
        </div>
      </section>

      {/* Tax Type */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Tax Type
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Tax Type <span className="text-red-500">*</span>
            </label>
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

      {/* Available At Locations */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Available At Locations
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
                  const updatedStoreLocations = selectedIds.map((id) => ({
                    store_location_id: id,
                  }));
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
      <section className="p-3">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Permission resource="items" action={id ? "update" : "create"}>
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
              onClick={handleSubmit(handleConfirmSubmit("duplicate"))}
              disabled={operationLoading}
              className={clsx(
                "flex items-center justify-center gap-2 px-4 py-1.5 border-2 border-primary rounded text-primary text-sm font-medium",
                "disabled:cursor-not-allowed dark:disabled:text-primary",
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
            title="Confirm Service Changes"
            message={
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1 text-red-700 dark:text-red-400" />
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>You're about to update this service.</p>
                  <p className="text-red-700 dark:text-red-400">
                    These changes will immediately affect how this service is
                    displayed and sold across all terminals.
                  </p>
                  <p>
                    Make sure you're not unintentionally overwriting
                    existing prices or settings used by cashiers.
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
            onConfirm={handleSaveService}
            onCancel={() => setIsConfirmSubmitOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default ServiceForm;