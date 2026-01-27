import React, { useMemo, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import CreatableSelect from "react-select/creatable";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { unitsOfQuantity, packagingUnits } from "../../data/kraDataTypes";

const isStandardUom = (list, code) => list.some((u) => u.code === code);

export default function UomConfigForm({ uomConfig, onSave, onClose }) {
  const [customQuantityUnits, setCustomQuantityUnits] = useState([]);
  const [customPackagingUnits, setCustomPackagingUnits] = useState([]);

  const methods = useForm({
    defaultValues: {
      quantity_unit_code: uomConfig?.quantity_units[0]?.code || "",
      packaging_unit_code: uomConfig?.packaging_units[0]?.code || "",
      conversion_factor: uomConfig?.conversion_factor || 1,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = methods;

  const quantityUnitCode = watch("quantity_unit_code");
  const packagingUnitCode = watch("packaging_unit_code");

  const combinedQuantityUnits = useMemo(
    () => [...unitsOfQuantity, ...customQuantityUnits],
    [customQuantityUnits]
  );
  const combinedPackagingUnits = useMemo(
    () => [...packagingUnits, ...customPackagingUnits],
    [customPackagingUnits]
  );

  const quantityUnitOptions = combinedQuantityUnits.map((u) => ({
    value: u.code,
    label: u.code_name,
  }));
  const packagingUnitOptions = combinedPackagingUnits.map((u) => ({
    value: u.code,
    label: u.code_name,
  }));

  const handleCreateUnit = (label, setCustomUnits) => {
    const code = label.toUpperCase().slice(0, 6).replace(/\s+/g, "_");
    const newUnit = {
      code,
      code_name: label,
      code_description: label,
      sort_order: 999,
    };
    setCustomUnits((prev) => [...prev, newUnit]);
    return code;
  };

  const onSubmit = (data) => {
    const selectedQuantityUnit = combinedQuantityUnits.find((u) => u.code === data.quantity_unit_code);
    const selectedPackagingUnit = combinedPackagingUnits.find((u) => u.code === data.packaging_unit_code);

    const isCustomQuantityUnit = !isStandardUom(unitsOfQuantity, data.quantity_unit_code);
    const isCustomPackagingUnit = !isStandardUom(packagingUnits, data.packaging_unit_code);

    const payload = {
      id: uomConfig?.id,
      business_location_id: uomConfig?.business_location_id || "",
      quantity_units: {
        ...selectedQuantityUnit,
        is_custom: isCustomQuantityUnit,
      },
      packaging_units: {
        ...selectedPackagingUnit,
        is_custom: isCustomPackagingUnit,
      },
      conversion_factor: data.conversion_factor,
    };

    onSave(payload);
  };

  const showConversionFactor = quantityUnitCode && packagingUnitCode;
  const selectedQuantityUnit = combinedQuantityUnits.find((u) => u.code === quantityUnitCode);
  const selectedPackagingUnit = combinedPackagingUnits.find((u) => u.code === packagingUnitCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-y-auto w-full md:w-120 p-4">
        <ModalHeader
          title={uomConfig?.id ? "Edit UOM" : "New UOM"}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* I Buy In */}
              <div className="flex-1">
                <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  I Buy/Make In
                </label>
                <Controller
                  name="packaging_unit_code"
                  control={control}
                  rules={{ required: "Buying unit is required" }}
                  render={({ field }) => (
                    <CreatableSelect
                      options={packagingUnitOptions}
                      value={packagingUnitOptions.find((opt) => opt.value === field.value)}
                      onChange={(option) => field.onChange(option?.value || "")}
                      onCreateOption={(label) => {
                        const newCode = handleCreateUnit(label, setCustomPackagingUnits);
                        field.onChange(newCode);
                      }}
                      placeholder="Search or create"
                      className="my-react-select-container"
                      classNamePrefix="my-react-select"
                      isClearable
                    />
                  )}
                />
                {errors.packaging_unit_code && (
                  <p className="text-sm text-red-500 mt-1">{errors.packaging_unit_code.message}</p>
                )}
              </div>

              {/* I Sell/Use In */}
              <div className="flex-1">
                <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  I Sell/Use In
                </label>
                <Controller
                  name="quantity_unit_code"
                  control={control}
                  rules={{ required: "Selling unit is required" }}
                  render={({ field }) => (
                    <CreatableSelect
                      options={quantityUnitOptions}
                      value={quantityUnitOptions.find((opt) => opt.value === field.value)}
                      onChange={(option) => field.onChange(option?.value || "")}
                      onCreateOption={(label) => {
                        const newCode = handleCreateUnit(label, setCustomQuantityUnits);
                        field.onChange(newCode);
                      }}
                      placeholder="Search or create"
                      className="my-react-select-container"
                      classNamePrefix="my-react-select"
                      isClearable
                    />
                  )}
                />
                {errors.quantity_unit_code && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity_unit_code.message}</p>
                )}
              </div>
            </div>

            {showConversionFactor && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-3">
                  Conversion
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-neutral-700 dark:text-neutral-200">
                    1 {selectedPackagingUnit?.code_name} =
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    {...register("conversion_factor", {
                      required: "Conversion factor is required",
                      min: { value: 0.0001, message: "Must be positive" },
                    })}
                    className="w-24 px-3 py-1 border rounded shadow-sm focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
                    placeholder="e.g., 1"
                  />
                  <span className="text-neutral-700 dark:text-neutral-200">
                    {selectedQuantityUnit?.code_name}(s)
                  </span>
                </div>
                {errors.conversion_factor && (
                  <p className="text-sm text-red-500 mt-1">{errors.conversion_factor.message}</p>
                )}
              </div>
            )}

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
