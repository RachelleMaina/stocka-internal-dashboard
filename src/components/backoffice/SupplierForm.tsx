"use client";

import React from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import PhoneInput from "react-phone-number-input";
import { Supplier, SupplierFormData } from "@/types/supplier";

// Update SupplierFormData to include only supplier_name, phone, email, address, and kra_pin
export interface SupplierFormData {
  supplier_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  kra_pin: string | null;
}

// Define Joi validation schema for the form
const supplierSchema = Joi.object({
  supplier_name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .label("Supplier Name")
    .messages({
      "string.empty": "Supplier name is required.",
      "string.min": "Supplier name should have at least 2 characters.",
      "string.max": "Supplier name should not exceed 255 characters.",
    }),
  phone: Joi.string()
    .min(10)
    .required()
    .label("Phone")
    .messages({
      "string.empty": "Phone number is required.",
      "string.min": "Phone number must be valid.",
    }),
  email: Joi.string()
    .allow(null)
    .allow("")
    .optional()
    .email({ tlds: { allow: false } })
    .label("Email")
    .messages({
      "string.email": "Please enter a valid email address.",
    }),
  address: Joi.string()
    .allow(null)
    .allow("")
    .max(255)
    .optional()
    .label("Address")
    .messages({
      "string.max": "Address should not exceed 255 characters.",
    }),
  kra_pin: Joi.string()
    .allow(null)
    .allow("")
    .max(50)
    .optional()
    .label("KRA PIN")
    .messages({
      "string.max": "KRA PIN should not exceed 50 characters.",
    }),
});

export default function SupplierForm({
  supplier,
  operationLoading,
  onSave,
  onClose,
}: {
  supplier: Supplier | null;
  operationLoading: boolean;
  onSave: (payload: {
    supplier_name: string;
    contact_phone: string;
    contact_email: string | null;
    address: string | null;
    kra_pin: string | null;
  }) => void;
  onClose: () => void;
}) {
  const methods = useForm<SupplierFormData>({
    resolver: joiResolver(supplierSchema),
    defaultValues: {
      supplier_name: supplier?.supplier_name || "",
      phone: supplier?.contact_phone || supplier?.phone || "",
      email: supplier?.contact_email || supplier?.email || "",
      address: supplier?.address || "",
      kra_pin: supplier?.kra_pin || "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    control,
  } = methods;

  const phoneValue = watch("phone");
  const onSubmit = (data: SupplierFormData) => {
    // Map form data to backend payload
    onSave({
      supplier_name: data.supplier_name,
      contact_phone: data.phone,
      contact_email: data.email || null,
      address: data.address || null,
      kra_pin: data.kra_pin || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 p-6 m-3 rounded-lg w-full max-w-md shadow-lg [--bg:#ffffff] [--border:#e5e7eb] [--border-hover:#d1d5db] [--bg-selected:#f3f4f6] [--bg-hover:#f9fafb] [--text:#1f2937] [--text-hover:#111827] dark:[--bg:#1f2937] dark:[--border:#4b5563] dark:[--border-hover:#6b7280] dark:[--bg-selected:#374151] dark:[--bg-hover:#4b5563] dark:[--text:#f3f4f6] dark:[--text-hover:#ffffff]">
        <ModalHeader
          title={supplier?.id ? "Edit Supplier" : "New Supplier"}
          onClose={onClose}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Supplier Name *
              </label>
              <input
                {...register("supplier_name")}
                className="mt-1 w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-300 placeholder-neutral-400"
                placeholder="John Doe"
              />
              {errors.supplier_name && (
                <p className="text-sm text-red-500 mt-1">{errors.supplier_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Phone *
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    country="KE"
                    international
                    defaultCountry="KE"
                    value={field.value}
                    onChange={(val) => field.onChange(val || "")}
                    className="w-full text-sm text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded px-3 
                      [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md 
                      [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-800
                      [&_.PhoneInputInput]:border-l
                      [&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-600
                      [&_.PhoneInputInput]:focus:outline-none 
                      [&_.PhoneInput]:flex [&_.PhoneInput]:rounded [&_.PhoneInput]:border [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-600 [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-800"
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Email (Optional)
              </label>
              <input
                type="email"
                {...register("email")}
                className="mt-1 w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-300 placeholder-neutral-400"
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Address (Optional)
              </label>
              <input
                {...register("address")}
                className="mt-1 w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-300 placeholder-neutral-400"
                placeholder="123 Main St, Nairobi"
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                KRA PIN (Optional)
              </label>
              <input
                {...register("kra_pin")}
                className="mt-1 w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-300 placeholder-neutral-400"
                placeholder="A123456789B"
              />
              {errors.kra_pin && (
                <p className="text-sm text-red-500 mt-1">{errors.kra_pin.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <NeutralButton onClick={onClose}>Cancel</NeutralButton>
              <PrimaryButton disabled={operationLoading}>
                {operationLoading ? "Saving..." : "Save Supplier"}
              </PrimaryButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}