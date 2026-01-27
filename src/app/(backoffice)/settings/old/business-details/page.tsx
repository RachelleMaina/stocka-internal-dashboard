"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FloatingInput from "@/components/common/FloatingInput";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import imageCompression from "browser-image-compression";
import clsx from "clsx";
import Joi from "joi";
import { CheckCircle, FileText, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface BusinessLocationData {
  id: string;
  location_name: string;
  location_bio?: string;
  kra_pin?: string;
  is_active: boolean;
  logo?: string;
}

interface FormData {
  location_name: string;
  location_bio?: string;
  kra_pin?: string;
  is_active: boolean;
  logo?: File | null;
}

const locationSchema = Joi.object({
  location_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .label("Location Name")
    .messages({
      "string.base": "Location Name must be a string.",
      "string.empty": "Location Name is required.",
      "string.min": "Location Name should have at least 2 characters.",
      "string.max": "Location Name should not exceed 100 characters.",
      "any.required": "Location Name is required.",
    }),
  location_bio: Joi.string()
    .max(500)
    .allow("")
    .optional()
    .label("Location Bio")
    .messages({
      "string.max": "Location Bio should not exceed 500 characters.",
    }),
  kra_pin: Joi.string().max(50).allow("").optional().label("KRA PIN").messages({
    "string.max": "KRA PIN should not exceed 50 characters.",
  }),
  logo: Joi.any().optional().label("Logo"),
}).options({ stripUnknown: true });

const LocationSettingsForm = () => {
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [location, setLocation] = useState<BusinessLocationData | null>(null);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [payload, setPayload] = useState({});
  const { backoffice_user_profile } = useAppState();
  const router = useRouter();
  const id = backoffice_user_profile?.business_location_id;

  const methods = useForm<FormData>({
    resolver: joiResolver(locationSchema),
    defaultValues: {
      location_name: "",
      location_bio: "",
      kra_pin: "",
      logo: null,
    },
  });

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
    setValue,
    watch,
  } = methods;

  const logo = watch("logo");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast.error("No business location ID found");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await api.get(`/api/business-locations/${id}`);
        const locationData = response.data.data;
        setLocation(locationData);
        setPreviewUrl(locationData.logo || null);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to load location data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!location) return;

    reset({
      location_name: location.location_name || "",
      location_bio: location.location_bio || "",
      kra_pin: location.kra_pin || "",
      is_active: location.is_active || true,
      logo: null,
    });
  }, [location, reset]);

  useEffect(() => {
    if (logo) {
      const url = URL.createObjectURL(logo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (!logo && location?.logo) {
      setPreviewUrl(location.logo);
    } else {
      setPreviewUrl(null);
    }
  }, [logo, location?.logo]);

  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 0.1, // Target size: 100KB
        maxWidthOrHeight: 512, // Reduce resolution
        useWebWorker: true,
      };
      return await imageCompression(file, options);
    } catch (error) {
      toast.error("Failed to compress image");
      throw error;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveLocation = async (data: any) => {
    setOperationLoading(true);
    try {
      let logoBase64 = null;
      if (data.logo) {
        const compressedLogo = await compressImage(data.logo);
        logoBase64 = await fileToBase64(compressedLogo);
      }

      const payload = {
        location_name: data.location_name,
        location_bio: data.location_bio || null,
        kra_pin: data.kra_pin || null,
        logo: logoBase64, // Send as base64 string or null
      };

      await api.patch(`/api/business-locations/${id}`, payload);
      toast.success("Location updated.");
      router.push(routes.settings);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save location.");
    } finally {
      setOperationLoading(false);
      setIsConfirmSubmitOpen(false);
    }
  };

  const handleConfirmSubmit = (data: FormData) => {
    setPayload(data);
    setIsConfirmSubmitOpen(true);
  };

  const handleRemoveLogo = () => {
    setValue("logo", null);
    setPreviewUrl(null);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="business_locations" action="update" isPage={true}>
      <div className="">
        <BreadcrumbWithActions
          label="Edit Business Details"
          breadcrumbs={[
            { name: "Settings", onClick: () => router.push(routes.settings) },
            { name: location?.location_name || "Edit Business Details" },
          ]}
          actions={[
            {
              title: "Save Changes",
              onClick: handleSubmit(handleConfirmSubmit),
              disabled: operationLoading,
              resource: "business_locations",
              action: "update",
            },
          ]}
        />
 <div className="p-3 bg-white dark:bg-neutral-800">
  <FormProvider {...methods}>
    <form className="w-full max-w-[460px] md:w-full mx-auto space-y-3">
      {/* Location Details */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Business Details
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FloatingInput
                id="location_name"
                label="Location Name"
                required
                backgroundClass="bg-white dark:bg-neutral-800"
                register={register("location_name")}
                error={errors.location_name?.message}
            
              />
            </div>
            <div>
              <FloatingInput
                id="kra_pin"
                label="KRA PIN"
                backgroundClass="bg-white dark:bg-neutral-800"
                register={register("kra_pin")}
                error={errors.kra_pin?.message}
            
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="location_bio"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Business Bio
            </label>
            <textarea
              id="location_bio"
              {...register("location_bio")}
              className="mt-1 p-2 block w-full rounded border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 text-sm"
              rows={4}
            />
            {errors.location_bio && (
              <p className="text-red-500 text-sm mt-1">
                {errors.location_bio.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Logo Upload */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Upload Logo
        </h2>
        <div className="space-y-4">
          {previewUrl && (
            <div className="relative w-32 h-32">
              <img
                src={previewUrl}
                alt="Location Logo Preview"
                className="w-full h-full object-contain rounded border border-neutral-200 dark:border-neutral-600"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div>
           
            <Controller
              name="logo"
              control={control}
              render={({ field }) => (
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      try {
                        const compressedFile = await compressImage(file);
                        field.onChange(compressedFile);
                      } catch {
                        field.onChange(null);
                      }
                    } else {
                      field.onChange(null);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-800"
                />
              )}
            />
            {errors.logo && (
              <p className="text-red-500 text-sm mt-1">
                {errors.logo.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="p-3">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Permission resource="business_locations" action="update">
            <button
              type="button"
              onClick={handleSubmit(handleConfirmSubmit)}
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
            title="Confirm Location Changes"
            message={
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1 text-primary" />
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    You&apos;re about to update the settings for this location.
                  </p>
                  <p>These changes will take effect immediately.</p>
                </div>
              </div>
            }
            confirmLabel="Save"
            cancelLabel="Cancel"
            onConfirm={() => handleSaveLocation(payload)}
            onCancel={() => setIsConfirmSubmitOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default LocationSettingsForm;
