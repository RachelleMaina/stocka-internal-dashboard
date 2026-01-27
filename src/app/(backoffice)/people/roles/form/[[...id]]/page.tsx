"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageSkeleton from "@/components/common/PageSkeleton";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { Role } from "@/types/user";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Select from "react-select";
import { Permission } from "@/components/common/Permission";
import clsx from "clsx";

type FormValues = {
  role_name: string;
  role_type: string;
  permissions: string[];
};

// Function to format resource and action labels (remove underscores, title case)
const formatLabel = (text: string) => {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const schema = Joi.object<FormValues>({
  role_type: Joi.string()
    .required()
    .valid("pos", "backoffice")
    .label("Role Type")
    .messages({
      "string.base": "Role Type must be a string",
      "string.empty": "Role Type is required",
      "any.required": "Role Type is required",
      "any.only": "Role Type must be either 'pos' or 'backoffice'",
    }),
  role_name: Joi.string().required().label("Role Name").messages({
    "string.base": "Role Name must be a string",
    "string.empty": "Role Name is required",
    "any.required": "Role Name is required",
  }),
  permissions: Joi.array().items(Joi.string()).label("Permissions").messages({
    "array.base": "Permissions must be an array of strings",
    "string.base": "Each permission must be a string",
  }),
}).options({ stripUnknown: true });

export default function AddRolePage() {
  const [operationLoading, setOperationLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionsData, setPermissionsData] = useState<{ [key: string]: string[] }>({});

  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const methods = useForm<FormValues>({
    defaultValues: {
      role_name: "",
      role_type: "pos",
      permissions: [],
    },
    resolver: joiResolver(schema),
  });

  const { register, handleSubmit, setValue, watch, reset, formState } = methods;
  const permissions = watch("permissions");
  const roleType = watch("role_type");

  useEffect(() => {
    fetchPermissions();
    if (id) {
      fetchRole();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!role) return;
    reset({
      role_name: role.role_name || "",
      role_type: role.role_type || "pos",
      permissions: role.permissions || [],
    });
  }, [role, reset]);

  const fetchRole = async () => {
    try {
      const response = await api.get(`/api/roles/${id}`);
      setRole(response.data.data);
      setLoading(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load role");
      setLoading(false);
    }
  };

 const fetchPermissions = async () => {
  try {
    const response = await api.get("/api/auth/permissions");
    const { backoffice_permissions, pos_permissions } = response.data.data;

    setPermissionsData(roleType === "backoffice" ? backoffice_permissions : pos_permissions);
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to load permissions");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchPermissions();
  }, [roleType]); // Refetch permissions when role_type changes

  const handleSaveRole = async (payload: FormValues) => {
    setOperationLoading(true);

    try {
      if (role) {
        await api.patch(`/api/roles/${role.id}`, payload);
        toast.success("Role updated.");
      } else {
        await api.post(`/api/roles`, payload);
        toast.success("Role created.");
      }
      router.push(routes.roles);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${role ? "update" : "create"} role.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSelectChange = (selectedOption: { value: string } | null) => {
    setValue("role_type", selectedOption ? selectedOption.value : "pos");
    setValue("permissions", []); // Clear permissions on role type change
  };

  const roleTypeOptions = [
    { value: "pos", label: "POS" },
    { value: "backoffice", label: "Backoffice" },
  ];

  const renderPermissions = (permissionsData: { [key: string]: string[] }, sectionTitle: string) => {
    const allPermissions = Object.entries(permissionsData).flatMap(([moduleKey, actions]) =>
      actions.map((actionKey: string) => `${moduleKey}:${actionKey}`)
    );

    const allSelected = allPermissions.every((perm) => permissions.includes(perm));

    const toggleAll = () => {
      const updated = allSelected
        ? permissions.filter((perm) => !allPermissions.includes(perm))
        : Array.from(new Set([...permissions, ...allPermissions]));
      setValue("permissions", updated);
    };

    return (
      <div>
        <div className="mb-4 pb-3 flex items-center justify-between border-b border-neutral-300 dark:border-neutral-600">
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">
            {sectionTitle}
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-primary"
            />
            <span>{allSelected ? "Deselect All" : "Select All"}</span>
          </label>
        </div>
        {Object.entries(permissionsData).map(([moduleKey, actions]) => {
          const moduleAllPermissions = actions.map(
            (actionKey: string) => `${moduleKey}:${actionKey}`
          );
          const moduleFullSelected = moduleAllPermissions.every(
            (perm: string) => permissions.includes(perm)
          );

          const toggleModuleFull = () => {
            const updated = moduleFullSelected
              ? permissions.filter((p) => !moduleAllPermissions.includes(p))
              : Array.from(new Set([...permissions, ...moduleAllPermissions]));
            setValue("permissions", updated);
          };

          return (
            <div
              key={moduleKey}
              className="mb-4 pb-4 border-b border-neutral-300 dark:border-neutral-600"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-sm">{formatLabel(moduleKey)}</h3>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={moduleFullSelected}
                    onChange={toggleModuleFull}
                    className="accent-primary"
                  />
                  <span>{moduleFullSelected ? "Deselect All" : "Select All"}</span>
                </label>
              </div>
              <div className="ml-2 mb-3">
                <div className="flex flex-wrap gap-2">
                  {actions.map((actionKey: string) => {
                    const permissionKey = `${moduleKey}:${actionKey}`;
                    const selected = permissions.includes(permissionKey);
                    return (
                      <div
                        key={actionKey}
                        onClick={() => togglePermission(permissionKey)}
                        className={`flex items-start gap-2 rounded border-2 p-2 px-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          selected
                            ? "border-primary dark:border-primary bg-indigo-50 dark:bg-neutral-700"
                            : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                        }`}
                        role="checkbox"
                        aria-checked={selected}
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && togglePermission(permissionKey)
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => togglePermission(permissionKey)}
                          className="accent-primary mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-200">
                            {formatLabel(actionKey)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const togglePermission = (perm: string) => {
    const updated = permissions.includes(perm)
      ? permissions.filter((p) => p !== perm)
      : [...permissions, perm];
    setValue("permissions", updated);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission
      resource="roles"
      action={id ? "update" : "create"}
      isPage={true}
    >
      <div className="">
        <BreadcrumbWithActions
          label={id ? "Edit Role" : "Add Role"}
          breadcrumbs={[
            { name: "People", onClick: () => router.push(routes.people) },
            { name: "Roles", onClick: () => router.push(routes.roles) },
            { name: id ? role?.role_name || "Role" : "Add New Role" },
          ]}
          actions={[
            {
              title: "Save Changes",
              resource: "roles",
              action: id ? "update" : "create",
              onClick: handleSubmit(handleSaveRole),
              disabled: operationLoading,
            },
          ]}
        />
        <div className="p-3 bg-white dark:bg-neutral-800">
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(handleSaveRole)}
              className="w-full max-w-[460px] md:w-full px-6 space-y-3"
            >
              {/* Role Info */}
              <section className="pb-6 space-y-2">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-100">
                      Role Name
                    </label>
                    <input
                      type="text"
                      {...register("role_name")}
                      className="w-full text-sm border-2 border-neutral-300 dark:border-neutral-600 rounded p-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      placeholder="e.g. Cashier"
                    />
                    {formState.errors.role_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {formState.errors.role_name.message}
                      </p>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-100">
                      Role Type
                    </label>
                    <Select
                      options={roleTypeOptions}
                      value={roleTypeOptions.find(
                        (opt) => opt.value === roleType
                      )}
                      onChange={handleSelectChange}
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                      placeholder="Select Role Type"
                    />
                    {formState.errors.role_type && (
                      <p className="text-red-500 text-sm mt-1">
                        {formState.errors.role_type.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Permissions */}
              <section className="pb-6 space-y-2">
                <div className="space-y-2">
                  {renderPermissions(
                    permissionsData,
                    roleType === "backoffice"
                      ? "Backoffice Permissions"
                      : "Pos Permissions"
                  )}
                </div>
              </section>

              {/* Action Buttons */}
              <section className="p-3">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Permission resource="roles" action="create">
                    <button
                      type="button"
                      onClick={handleSubmit(handleSaveRole)}
                      disabled={operationLoading}
                      className={clsx(
                        "px-4 py-1.5 bg-primary text-white text-sm font-medium rounded",
                        "disabled:cursor-not-allowed",
                        "sm:w-auto w-full"
                      )}
                    >
                      Save
                    </button>
                  </Permission>
                </div>
              </section>
            </form>
          </FormProvider>
        </div>
      </div>
    </Permission>
  );
}
