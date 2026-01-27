"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { Role } from "@/types/user";
import { Edit, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const RoleCard = ({
  role,
  onDelete,
  onEdit,
}: {
  role: Role;
  copiedKey: string;
  onDelete: (role: Role) => void;
  onEdit: (role: Role) => void;
  onCopy: (key: string | null) => void;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {role.role_name}
          </h3>
          <span
            className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200`}
          >
            {role.role_type}
          </span>
        </div>

        <div className="flex gap-2">
          <Permission resource={"roles"} action={"update"}>
            <button
              onClick={() => onEdit(role)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition"
            >
              <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"roles"} action={"delete"}>
            <button
              onClick={() => onDelete(role)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 "
              aria-label="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </Permission>
        </div>
      </div>
    </div>
  );
};

const Roles: React.FC = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get(`/api/roles`);
      const roles = response.data.data;
      setRoles(roles);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false); // Set loading to false even on error
    }
  };

  const openAddForm = () => {
    router.push(`${routes.roleForm}`);
  };

  const openEditForm = (role: Role) => {
    router.push(`${routes.roleForm}/${role.id}`);
  };

  const openDeleteConfirmation = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteOpen(true);
  };

  const handleDeleteRole = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.delete(`/api/roles/${id}`);
      toast.success("Role deleted.");
      setIsDeleteOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete role.");
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "role_name",
      label: "Role",
      render: (role: Role) => <div>{role.role_name}</div>,
    },
    {
      key: "role_type",
      label: "Type",
      render: (role: Role) => (
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200`}
          >
            {role.role_type}
          </span>
        </div>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (role: Role) => {
        return (
          <div className="flex items-center gap-2 justify-end">
            <Permission resource={"roles"} action={"update"}>
              <button
                onClick={() => openEditForm(role)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition"
              >
                <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              </button>
            </Permission>
            <Permission resource={"roles"} action={"delete"}>
              <button
                onClick={() => openDeleteConfirmation(role)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </Permission>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"roles"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Role"
          breadcrumbs={[
            { name: "People", onClick: () => router.push(routes.people) },
            { name: "Roles" },
          ]}
          actions={[
            {
              title: "Add Role",
              onClick: openAddForm,
              resource: "roles",
              action: "create",
            },
          ]}
        />

        <div className="p-3 bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {roles.length > 0 ? (
            <ReusableTable
              data={roles}
              columns={columns}
              usePagination
              pageSize={10}
              renderCard={(role: Role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={() => openEditForm(role)}
                  onDelete={() => openDeleteConfirmation(role)}
                />
              )}
            />
          ) : (
            <PageEmptyState icon={Shield} description="No roles found." />
          )}
        </div>

        {isDeleteOpen && roleToDelete && (
          <ConfirmDialog
            title="Confirm Deletion"
            message={
              <>
                Are you sure you want to delete the role{" "}
                <strong>{roleToDelete.role_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleDeleteRole(roleToDelete.id)}
            onCancel={() => {
              setIsDeleteOpen(false);
              setRoleToDelete(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

export default Roles;
