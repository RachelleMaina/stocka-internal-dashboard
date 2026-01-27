"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface MpesaCredential {
  id: string;
  business_location_id: string;
  store_location_id: string;
  consumer_key: string;
  consumer_secret: string;
  shortcode: string;
  passkey?: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  consumer_key: string;
  consumer_secret: string;
  shortcode: string;
  passkey?: string;
}

const credentialSchema = Joi.object({
  consumer_key: Joi.string().required().label("Consumer Key").messages({
    "string.empty": "Consumer key is required.",
    "any.required": "Consumer key is required.",
  }),
  consumer_secret: Joi.string().required().label("Consumer Secret").messages({
    "string.empty": "Consumer secret is required.",
    "any.required": "Consumer secret is required.",
  }),
  shortcode: Joi.string().required().label("Shortcode").messages({
    "string.empty": "Shortcode is required.",
    "any.required": "Shortcode is required.",
  }),
  passkey: Joi.string().allow("").optional().label("Passkey"),
}).options({ stripUnknown: true });

const MpesaCredentialsPage = () => {
  const router = useRouter();
  const { backoffice_user_profile } = useAppState();
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [credentials, setCredentials] = useState<MpesaCredential[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const methods = useForm<FormData>({
    resolver: joiResolver(credentialSchema),
    defaultValues: {
      consumer_key: "",
      consumer_secret: "",
      shortcode: "",
      passkey: "",
    },
  });

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = methods;

  const store_location_id = backoffice_user_profile?.store_location_id;
  const user_business_location_id = backoffice_user_profile?.business_location_id;

  useEffect(() => {
    if (store_location_id) {
      loadCredentials();
    }
  }, [store_location_id]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.getMpesaCredentials(store_location_id));
      const fetchedCredentials = response.data.data || [];
      setCredentials(fetchedCredentials);

      if (fetchedCredentials.length > 1) {
        toast.error("Multiple credentials found for this store. Please contact support.");
        return;
      }

    
        const cred = fetchedCredentials;
        setEditingId(cred.id);
        reset({
          consumer_key: cred.consumer_key,
          consumer_secret: cred.consumer_secret,
          shortcode: cred.shortcode,
          passkey: cred.passkey || "",
        });
     
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setOperationLoading(true);
    try {
      const payload = data;
      const url = editingId
        ? endpoints.updateMpesaCredentials(store_location_id)
        : endpoints.createMpesaCredentials(store_location_id);
      const method = editingId ? "put" : "post";
      const response = await api[method](url, payload);
      toast.success(editingId ? "Credential updated successfully." : "Credential created successfully.");
      
      // Reload to populate if created
        await loadCredentials();
        router.push(routes.settings)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${editingId ? "update" : "create"} credential.`);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setOperationLoading(true);
    try {
      await api.delete(endpoints.deleteMpesaCredentials(store_location_id));
      toast.success("Credential deleted successfully.");
        
        router.push(routes.settings)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete credential.");
    } finally {
      setOperationLoading(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission
      resource="mpesa_credentials"
      action="read"
      isPage={true}
    >
      <BreadcrumbWithActions
        label="M-Pesa Integration"
        breadcrumbs={[
          { name: "Settings", onClick: () => router.push(routes.settings) },
          { name: "M-Pesa Integration" },
        ]}
        actions={[]}
      />
      <div className="p-4 m-1 flex justify-center">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 max-w-[460px]">
            {/* Credentials Form */}
            <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-600 p-5">
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 mb-4">
                {editingId ? "Update M-Pesa Credential" : "Add M-Pesa Credential"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="consumer_key"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Consumer Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="consumer_key"
                    type="text"
                    {...register("consumer_key")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter consumer key"
                    disabled={operationLoading}
                  />
                  {errors.consumer_key && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.consumer_key.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="consumer_secret"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Consumer Secret <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="consumer_secret"
                    type="text"
                    {...register("consumer_secret")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter consumer secret"
                    disabled={operationLoading}
                  />
                  {errors.consumer_secret && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.consumer_secret.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="shortcode"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Shortcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shortcode"
                    type="text"
                    {...register("shortcode")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter shortcode"
                    disabled={operationLoading}
                  />
                  {errors.shortcode && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.shortcode.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="passkey"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Passkey (Optional)
                  </label>
                  <input
                    id="passkey"
                    type="text"
                    {...register("passkey")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter passkey"
                    disabled={operationLoading}
                  />
                  {errors.passkey && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.passkey.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="flex-1 bg-primary text-white font-medium py-2 px-4 rounded hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {operationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingId ? "Update Credential" : "Create Credential"
                    )}
                  </button>
   
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition disabled:opacity-50"
                      disabled={operationLoading}
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </FormProvider>

        {isConfirmDeleteOpen && (
          <ConfirmDialog
            title="Confirm Delete"
            message={`Are you sure you want to delete the M-Pesa credentials? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirmDeleteOpen(false)}
          />
        )}
      </div>
    </Permission>
  );
};

export default MpesaCredentialsPage;