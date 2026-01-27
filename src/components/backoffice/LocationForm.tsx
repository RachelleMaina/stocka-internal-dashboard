import React, { useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import Select from "react-select";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";

const schema = Joi.object({
  store_location_name: Joi.string().trim().min(1).required().messages({
    "string.base": "Location name must be a string",
    "string.empty": "Location name is required",
    "string.min": "Location name must be non-empty",
    "any.required": "Location name is required",
  }),
  // store_type: Joi.string().valid("hospitality", "retail").required().messages({
  //   "string.base": "Store type must be a string",
  //   "any.only": "Store type must be either 'hospitality' or 'retail'",
  //   "any.required": "Store type is required",
  // }),
  is_storage: Joi.boolean().required(),
  is_pos: Joi.boolean().required(),
}).custom((value, helpers) => {
  if (!value.is_storage && !value.is_pos) {
    return helpers.error("any.custom", {
      message: "At least one of Storage or POS must be selected",
    });
  }
  return value;
}, "custom validation");

type LocationFormValues = {
  store_location_name: string;
  store_type: string;
  is_storage: boolean;
  is_pos: boolean;
};

type StoreLocation = {
  id: string;
  store_location_name: string;
  store_type: string;
  is_storage: boolean;
  is_pos: boolean;
  business_location_id: string;
  parent_location_id?: string;
};

export default function LocationForm({
  business_location_id,
  parent_location_id,
  location,
  onSave,
  onClose,
}: {
  business_location_id: string;
  parent_location_id?: string;
  location?: StoreLocation;
  onSave: (
    payload: LocationFormValues & {
      business_location_id: string;
      parent_location_id?: string;
      id?: string;
    }
  ) => void;
  onClose: () => void;
}) {
  const methods = useForm<LocationFormValues>({
    resolver: joiResolver(schema),
    defaultValues: {
      store_location_name: location?.store_location_name || "",
      // store_type: location?.store_type || "retail",
      is_storage: location?.is_storage || false,
      is_pos: location?.is_pos || false,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = methods;

  useEffect(() => {
    if (location) {
      reset({
        store_location_name: location.store_location_name,
        // store_type: location.store_type,
        is_storage: location.is_storage,
        is_pos: location.is_pos,
      });
    }
  }, [location, reset]);

  const storeTypeOptions = [
    { value: "hospitality", label: "Restaurant/Hotel" },
    { value: "retail", label: "Shop/Store" },
  ];

  const onSubmit = (data: LocationFormValues) => {
    onSave({
      ...data,
      business_location_id,
      ...(parent_location_id && { parent_location_id }),
      ...(location && { id: location.id }),
    });
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-y-auto w-full md:w-120 p-4"><ModalHeader
          title={
            location
              ? parent_location_id
                ? "Edit Section"
                : "Edit Location"
              : parent_location_id
              ? "Add Section"
              : "Add Location"
          }
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Location Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {parent_location_id ? "Section name" : "Location Name"}
              </label>
              <input
                type="text"
                {...register("store_location_name")}
                className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={
                  parent_location_id ? "E.g., Pantry" : "E.g., CBD Shop"
                }
              />
              {errors.store_location_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.store_location_name.message}
                </p>
              )}
            </div>

            {/* Store Type */}
            {/* <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                What type of store is this?
              </label>
              <Controller
                name="store_type"
                control={control}
                render={({ field }) => (
                  <Select
                    options={storeTypeOptions}
                    value={storeTypeOptions.find((opt) => opt.value === field.value)}
                    onChange={(option) => field.onChange(option?.value)}
                    placeholder="Select store type"
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                  />
                )}
              />
              {errors.store_type && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.store_type.message}
                </p>
              )}
            </div> */}

            {/* Storage and POS */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {parent_location_id
                  ? "How is this section used?"
                  : "How is this location used?"}
              </label>
              <div className="flex flex-col gap-2 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("is_storage")}
                    className="h-4 w-4 text-primary border-neutral-300 dark:border-neutral-600 rounded focus:ring-indigo-500 dark:bg-neutral-800"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Do you store inventory here?
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("is_pos")}
                    className="h-4 w-4 text-primary border-neutral-300 dark:border-neutral-600 rounded focus:ring-indigo-500 dark:bg-neutral-800"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {parent_location_id
                      ? "Do you sell from this section"
                      : "Do you sell from this location?"}
                  </span>
                </label>
              </div>
              {errors.is_storage?.type === "any.custom" && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.is_storage.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <NeutralButton onClick={onClose}>Cancel</NeutralButton>
              <PrimaryButton>Save</PrimaryButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
