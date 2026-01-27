import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import ModalHeader from "../common/ModalHeader";
import { Device } from "@/types/device";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";

type DeviceFormValues = {
  device_name: string;
};

export default function DeviceForm({
  device,
  onSave,
  onClose,
}: {
  device: Device;
  onSave: (payload: {
    id: string;
    locationId: string;
    categoryIds?: string[];
  }) => void;
  onClose: () => void;
}) {
  const methods = useForm<DeviceFormValues>({
    defaultValues: {
      device_name: device?.device_name || "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-md shadow-lg [--bg:#ffffff] [--border:#e5e7eb] [--border-hover:#d1d5db] [--bg-selected:#f3f4f6] [--bg-hover:#f9fafb] [--text:#1f2937] [--text-hover:#111827] dark:[--bg:#1f2937] dark:[--border:#4b5563] dark:[--border-hover:#6b7280] dark:[--bg-selected:#374151] dark:[--bg-hover:#4b5563] dark:[--text:#f3f4f6] dark:[--text-hover:#ffffff]">
        <ModalHeader
          title={device?.id ? "Edit Device" : "New Device"}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4 p-4">
            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Device Name
              </label>
              <input
                type="text"
                {...register("device_name", {
                  required: "Device name is required",
                })}
                className="w-full mt-1  px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-700 bg-white  text-neutral-900 dark:text-neutral-300 placeholder-neutral-400  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter device name"
              />
              {errors.device_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.device_name.message}
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
