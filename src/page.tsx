"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAppState } from "@/lib/context/AppState";
import { Role } from "@/types/user";
import PageSkeleton from "@/components/common/PageSkeleton";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import { FormProvider, useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Users, Package, User, Tag, Boxes, Receipt, Truck } from "lucide-react";
import Select from 'react-select';

type FormValues = {
  role_name: string;
  role_type: string;
permissions: string[];
};


// 🌐 Global resources
const globalResources = {
users: {
  label: "User Accounts",
  icon: Users,
  actions: ["create", "read", "update", "delete"],
},
items: {
  label: "Products",
  icon: Package,
  actions: ["create", "read", "update", "delete"],
},
customers: {
  label: "Customers",
  icon: User,
  actions: ["create", "read", "update"],
},
categories: {
  label: "Product Categories",
  icon: Tag,
  actions: ["read", "update"],
},
};

// 🏬 Store-specific resources
const storeResources = {
inventory: {
  label: "Inventory Stock",
  icon: Boxes,
  actions: ["read", "update", "count"],
},
sales: {
  label: "Sales Receipts",
  icon: Receipt,
  actions: ["read", "review"],
},
orders: {
  label: "Supplier Orders",
  icon: Truck,
  actions: ["create", "read", "update", "delete"],
},
};

// 📖 Action descriptors
const actionMap = {
create: {
  title: "Add New",
  description: (res: string) => `Allow adding new ${res}`,
},
read: {
  title: "View",
  description: (res: string) => `Allow viewing ${res}`,
},
update: {
  title: "Edit",
  description: (res: string) => `Allow editing ${res}`,
},
delete: {
  title: "Remove",
  description: (res: string) => `Allow deleting ${res}`,
},
review: {
  title: "Review",
  description: (res: string) => `Allow reviewing submitted ${res}`,
},
count: {
  title: "Count",
  description: (_res: string) => `Allow physical stock counts`,
},
};

const schema = Joi.object<FormValues>({
  role_type: Joi.string().required().label("Role Type"),
role_name: Joi.string().required().label("Role Name"),
permissions: Joi.array().items(Joi.string()).label("Permissions"),
});


export default function AddRolePage() {
      const [operationLoading, setOperationLoading] = useState(false);
 
 const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
 
    const { backoffice_user_profile } = useAppState();

    const params = useParams();
    const { id } = params;
  const router = useRouter();
  
    const methods = useForm<FormValues>({
      defaultValues: { role_name: role?.role_name || "",  role_type: role?.role_type || "pos", permissions: role?.permissions ||[] },
  resolver: joiResolver(schema),
});

const { register, handleSubmit, setValue, watch, formState } = methods;
  const permissions = watch("permissions");
  const roleType = watch("role_type");
   // Set default select value if not provided
useEffect(() => {
  if (!role?.role_type) {
    setValue("role_type", "pos");
  }
}, [role, setValue]);
  
  useEffect(() => {
    if (id) {
      fetchRole();
    }else setLoading(false)
    }, [id]);
  
  const fetchRole = async () => {
  
      try {
        const response = await api.get(`/api/roles/${id}`);
        const role = response.data.data;
        setRole(role);
        setLoading(false);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load role");
        setLoading(false); // Set loading to false even on error
      }
  
    };
    
      const handleSaveRole = async (payload: Role) => {
        setOperationLoading(true);
        if (role) {
          try {
            await api.patch(`/api/roles/${role.id}`, payload);
                toast.success("Role updated.");
              router.push("/roles/")
              } catch (error) {
                toast.error(
                  error?.response?.data?.message || "Failed to update role."
                );
              } finally {
                setOperationLoading(false);
              }
        } else {
          try {
            await api.post(`/api/roles`, payload);
                toast.success("Role created.");
                router.push("/roles/")
              } catch (error) {
                toast.error(
                  error?.response?.data?.message || "Failed to create role."
                );
              } finally {
                setOperationLoading(false);
              }
        }
  };
  
 
 

  
  const togglePermission = (perm: string) => {
    const updated = permissions.includes(perm)
      ? permissions.filter((p) => p !== perm)
      : [...permissions, perm];
    setValue("permissions", updated);
  };

  const handleSelectChange = (selectedOption: any) => {
    setValue('role_type', selectedOption.value);
    // Clear permissions when switching role type to avoid invalid state
    setValue('permissions', []);
  };

  const roleTypeOptions = [
    { value: 'pos', label: 'POS' },
    { value: 'backoffice', label: 'Backoffice' },
    ];
    
  

    const renderPermissions = (
    scope: "global" | string,
    resources: typeof globalResources,
    sectionTitle: string
    ) => {
        const allPermissions = Object.entries(resources).flatMap(
            ([resourceKey, { actions }]) =>
              actions.map((actionKey) => `${scope}:${resourceKey}:${actionKey}`)
          );
        
          const allSelected = allPermissions.every((perm) =>
            permissions.includes(perm)
          );
        
          const toggleAll = () => {
            const updated = allSelected
              ? permissions.filter((perm) => !allPermissions.includes(perm))
              : Array.from(new Set([...permissions, ...allPermissions]));
            setValue("permissions", updated);
          };
    return (
      <div className="mb-10">
   
       <div className="flex items-center justify-between mb-2">
  <h2 className="text-lg font-semibold">{sectionTitle}</h2>
  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="accent-neutral-800 dark:accent-neutral-200"
          />
          <span>{allSelected ? "Deselect All" : "Select All"}</span>
        </label>
</div>




        {Object.entries(resources).map(([resourceKey, { label, icon: Icon, actions }]) => (
          <div key={resourceKey} className="mb-6">
            <h3 className="font-medium text-base mb-2 flex items-center gap-2">
              <Icon className="w-5 h-5" /> {label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {actions.map((actionKey) => {
                const permissionKey = `${scope}:${resourceKey}:${actionKey}`;
                const selected = permissions.includes(permissionKey);
                const action = actionMap[actionKey];
                if (!action) return null;

                return (
                  <div
                    key={actionKey}
                    onClick={() => togglePermission(permissionKey)}
                    className={`cursor-pointer rounded-lg border p-4 transition shadow-sm flex gap-3 items-start ${
                      selected
                        ? "bg-neutral-800 text-white border-neutral-700"
                        : "bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600 hover:border-neutral-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={selected}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold">{action.title}</div>
                      <p className="text-sm mt-1">
                        {action.description(label.toLowerCase())}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

   


  if (loading) { return <PageSkeleton />;
  }


  return (
    <div className="">
           <BreadcrumbWithActions
        label={id ? "Edit Role" : "Add Role"}
  breadcrumbs={ { name: role?.role_name || "Add New Role"},}
        actions={[
          {
            title: id ? "Edit Role" : "Add Role",
           onClick:handleSubmit(handleSaveRole)
        
          },
         
        ]}
  
      />
             <div className="p-3">

<FormProvider {...methods}>
    <form onSubmit={handleSubmit(handleSaveRole)} className="space-y-8">
      {/* Role Name Input */}
      <div>
        <label className="block font-medium mb-1">Role Name</label>
        <input
          type="text"
          {...register("role_name")}
          className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md p-2 bg-white dark:bg-neutral-900"
          placeholder="e.g. Cashier"
        />
        {formState.errors.role_name && (
          <p className="text-red-500 text-sm mt-1">
            {formState.errors.role_name.message}
          </p>
        )}
      </div>

      {/* Role Type Select */}
      <div className="mt-4">
        <label className="block font-medium mb-1">User Type</label>
        <Select
          options={roleTypeOptions}
          value={roleTypeOptions.find(option => option.value === roleType)}
          onChange={handleSelectChange}
          className="w-full"
          placeholder="Select User Type"
        />
        {formState.errors.role_type && (
          <p className="text-red-500 text-sm mt-1">
            {formState.errors.role_type.message}
          </p>
        )}
      </div>

      <hr className="border-neutral-300 dark:border-neutral-600" />

      {/* Conditionally Render Permissions */}
      {roleType === "backoffice" &&
        renderPermissions("global", globalResources, "Backoffice Permissions")}

      {roleType === "pos" &&
        renderPermissions(backoffice_user_profile?.store_location_id, storeResources, "POS Permissions")}

 
    </form>
  </FormProvider>
      </div>
      </div>
  );
}
