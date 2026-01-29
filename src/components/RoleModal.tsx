// components/roles/RoleModal.tsx
import React, { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import clsx from "clsx";

type RoleFormData = {
  role_name: string;
  permission_ids: string[];
};

interface RoleModalProps {
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  permissions: any[]; // [{ id, code, description, module, is_active, ... }]
  appContext: string;
  isLoading?: boolean;
}

const RoleModal: React.FC<RoleModalProps> = ({
  onSubmit,
  onCancel,
  initialData,
  permissions,
  appContext,
  isLoading = false,
}) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<RoleFormData>({
    defaultValues: initialData
      ? {
          role_name: initialData.role_name,
          permission_ids: initialData.permission_ids || [],
        }
      : {
          role_name: "",
          permission_ids: [],
        },
  });

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map = new Map<string, any[]>();

    permissions.forEach((perm) => {
      const module = perm.module || "Other";
      if (!map.has(module)) map.set(module, []);
      map.get(module)!.push(perm);
    });

    // Sort modules alphabetically
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const onFormSubmit = async (data: RoleFormData) => {
    await onSubmit({
      role_name: data.role_name.trim(),
      app_context: appContext,
      permission_ids: data.permission_ids,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Role Name */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Role Name
        </label>
        <input
          {...register("role_name", { required: "Role name is required" })}
          className={clsx(
            "w-full px-4 py-2 border rounded ",
            "border-neutral-300 dark:border-neutral-700 focus:border-primary focus:ring-2 focus:ring-primary/30",
            errors.role_name && "border-red-500"
          )}
        />
        {errors.role_name && <p className="text-red-500 text-sm mt-1">{errors.role_name.message}</p>}
      </div>

      {/* Permissions - grouped by module */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Permissions
        </label>

        <div className="max-h-[360px] overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded  p-3 space-y-6">
          {groupedPermissions.map(([moduleName, perms]) => (
            <div key={moduleName} className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                {moduleName}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-2 cursor-pointer group"
                  >
                    <Controller
                      control={control}
                      name="permission_ids"
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          value={perm.id}
                          checked={field.value.includes(perm.id)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, perm.id]
                              : field.value.filter((id) => id !== perm.id);
                            field.onChange(newValue);
                          }}
                       
                          className="
                          w-4 h-4
                          rounded
                          text-[14px]
                          border-neutral-300 dark:border-neutral-700
                          bg-white dark:bg-neutral-800
                          accent-primary dark:accent-primary/90
                          focus:ring-primary focus:ring-offset-0
                        "/>
                      )}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {perm.code}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {perm.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {errors.permission_ids && (
          <p className="text-red-500 text-sm mt-1">{errors.permission_ids.message}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            "px-8 py-2 bg-primary text-white rounded font-medium transition-colors",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
          )}
        >
          {isLoading ? "Saving..." : initialData ? "Update Role" : "Create Role"}
        </button>
      </div>
    </form>
  );
};

export default RoleModal;