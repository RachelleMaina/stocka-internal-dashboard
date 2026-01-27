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
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface EtimsCredential {
  id: string;
  business_location_id: string;
  store_location_id: string;
  taxpayer_pin: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  taxpayer_pin: string;
  api_key: string;
}

const credentialSchema = Joi.object({
  taxpayer_pin: Joi.string().required().label("Taxpayer PIN").messages({
    "string.empty": "Taxpayer PIN is required.",
    "any.required": "Taxpayer PIN is required.",
  }),
  api_key: Joi.string().required().label("API Key").messages({
    "string.empty": "API Key is required.",
    "any.required": "API Key is required.",
  }),
}).options({ stripUnknown: true });

const EtimsCredentialsPage = () => {
  const router = useRouter();
  const { backoffice_user_profile } = useAppState();
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [credentials, setCredentials] = useState<EtimsCredential[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const methods = useForm<FormData>({
    resolver: joiResolver(credentialSchema),
    defaultValues: {
      taxpayer_pin: "",
      api_key: "",
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
      const response = await api.get(endpoints.getEtimsCredentials(store_location_id));
      const fetchedCredentials = response.data.data || [];
      setCredentials(fetchedCredentials);

      if (fetchedCredentials.length > 1) {
        toast.error("Multiple ETIMS credentials found for this store. Please contact support.");
        return;
      }

      const cred = fetchedCredentials[0];
      if (cred) {
        setEditingId(cred.id);
        reset({
          taxpayer_pin: cred.taxpayer_pin,
          api_key: cred.api_key,
        });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch ETIMS credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setOperationLoading(true);
    try {
      const payload = data;
      const url = editingId
        ? endpoints.updateEtimsCredentials(store_location_id, editingId)
        : endpoints.createEtimsCredentials(store_location_id);
      const method = editingId ? "put" : "post";
      await api[method](url, payload);

      toast.success(editingId ? "ETIMS credential updated successfully." : "ETIMS credential created successfully.");

      await loadCredentials();
      router.push(routes.settings);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${editingId ? "update" : "create"} ETIMS credential.`);
    } finally {
      setOperationLoading(false);
    }
  };

  const confirmDelete = async () => {
    setOperationLoading(true);
    try {
      await api.delete(endpoints.deleteEtimsCredentials(store_location_id, editingId));
      toast.success("ETIMS credential deleted successfully.");
      router.push(routes.settings);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete ETIMS credential.");
    } finally {
      setOperationLoading(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <Permission resource="etims_credentials" action="read" isPage={true}>
      <BreadcrumbWithActions
        label="ETIMS Integration"
        breadcrumbs={[
          { name: "Settings", onClick: () => router.push(routes.settings) },
          { name: "ETIMS Integration" },
        ]}
        actions={[]}
      />

      <div className="p-4 m-1 flex justify-center">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 max-w-[460px]">
            <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-600 p-5">
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 mb-4">
                {editingId ? "Update ETIMS Credential" : "Add ETIMS Credential"}
              </h2>

              <div className="space-y-4">
                {/* Taxpayer PIN */}
                <div>
                  <label
                    htmlFor="taxpayer_pin"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    Taxpayer PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="taxpayer_pin"
                    type="text"
                    {...register("taxpayer_pin")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter taxpayer PIN"
                    disabled={operationLoading}
                  />
                  {errors.taxpayer_pin && (
                    <p className="text-sm text-red-500 mt-1">{errors.taxpayer_pin.message}</p>
                  )}
                </div>

                {/* API Key */}
                <div>
                  <label
                    htmlFor="api_key"
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-1"
                  >
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="api_key"
                    type="text"
                    {...register("api_key")}
                    className="w-full p-2 h-10 rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-200"
                    placeholder="Enter API key"
                    disabled={operationLoading}
                  />
                  {errors.api_key && <p className="text-sm text-red-500 mt-1">{errors.api_key.message}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="flex-1 bg-primary text-white font-medium py-2 px-4 rounded hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {operationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingId ? "Update Credential" : "Create Credential"
                    )}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
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
            message="Are you sure you want to delete the ETIMS credentials? This action cannot be undone."
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

export default EtimsCredentialsPage;
