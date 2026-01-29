"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";

import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import Tabs from "@/components/common/Tabs";
import Modal from "@/components/common/Modal";


import { usePermissions } from "@/hooks/usePermissions"; 
import RoleModal from "@/components/RoleModal";
import { useRoles, useUpdateRole, useCreateRole, useToggleRoleStatus } from "@/hooks/useRoles";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/common/StatusBadge";
import { format, parseISO } from "date-fns";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { routes } from "@/constants/routes";
const TABS = [
  { key: "all", label: "All" },
  { key: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { key: "role_name", label: "Role Name" },
  { key: "updated_at", label: "Last Updated" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const PosRolesPage = () => {
  const appContext = "pos";
  const searchParams = useSearchParams();
  const outletId = searchParams.get('outlet_id'); 
  const accountId = searchParams.get('account_id'); 

  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<{
      id: string;
      is_active: boolean;
    } | null>(null);
  

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query params for roles
  const roleParams = useMemo(
    () => ({
      app_context: appContext,
      outlet_id: outletId,
      account_id: accountId,
      status: activeTab === "all" ? undefined : activeTab,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 20,
    }),
    [activeTab, debouncedSearch, currentPage]
  );

  const { data: rolesResponse, isLoading: rolesLoading } = useRoles({ params: roleParams });

  // Fetch permissions for the POS context (for modal multi-select)
  const { data: permissionsResponse } = usePermissions({
    params: { app_context: appContext, limit: 500 },
  });
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const toggleMutation = useToggleRoleStatus();

  const roles = rolesResponse?.roles || [];
  const permissions = permissionsResponse?.permissions || [];
  const pagination = rolesResponse?.pagination;

  const tableData = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      permission_count: role.permission_ids?.length || 0,
      status: role.is_active ? "Active" : "Inactive",
      rawRole: role,
    }));
  }, [roles]);

  const handleAddNew = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setSelectedRole(row.rawRole);
    setIsModalOpen(true);
  };

   // Open confirmation before toggle
   const requestToggle = (roleId: string, currentStatus: boolean) => {
    setPendingToggle({ id: roleId, is_active: !currentStatus });
    setIsConfirmOpen(true);
  };

  // Confirm and execute toggle
  const confirmToggle = async () => {
    if (!pendingToggle) return;

    const { id, is_active } = pendingToggle;

    try {
      await toggleMutation.mutateAsync({ id, is_active });
      toast.success(
        `Role ${is_active ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      toast.error("Failed to update role status");
    } finally {
      setIsConfirmOpen(false);
      setPendingToggle(null);
    }
  };


  const handleModalSubmit = async (formData: any) => {
    try {
      // Prepare the full payload with outlet_id and account_id
      const fullPayload = {
        ...formData,
        outlet_id: outletId,  
        account_id: accountId, 
      };
  
      if (selectedRole) {
        // Update: send IDs in the payload (backend will use as query params if needed)
        await updateMutation.mutateAsync({
          id: selectedRole.id,
          ...fullPayload,
        });
        toast.success("Role updated successfully");
      } else {
        // Create: send IDs in the payload
        await createMutation.mutateAsync(fullPayload);
        toast.success("Role created successfully");
      }
  
      setIsModalOpen(false);
      setSelectedRole(null);
    } catch (err) {
      toast.error(selectedRole ? "Failed to update role" : "Failed to create role");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  return (
    <div>
      <PageHeader
        title="POS Roles"
        breadcrumb="Roles"
        breadcrumbPath={routes.roles}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search roles..."
        searchWidth="w-72"
        buttons={[
          {
            label: "Add Role",
            icon: Plus,
            onClick: handleAddNew,
            variant: "primary",
          },
        ]}
      />

      <div className="mx-4 mt-5">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          loading={rolesLoading}
          pagination={pagination}
          onPageChange={setCurrentPage}
             scopedColumns={{
                    updated_at: (row) => (
                      <td>
                        {" "}
                        {row.updated_at
                          ? format(parseISO(row.created_at), "dd MMM yyyy, HH:mm")
                          : "--"}
                      </td>
                    ),
                    description: (row) => (
                      <td className="max-w-md truncate">{row.description}</td>
                    ),
                    status: (row) => (
                      <td>
                        <StatusBadge status={row.is_active ? "active" : "inactive"} />
                      </td>
                    ),
                    actions: (row) => (
                      <td className="flex items-center gap-4">
                        {/* Edit — neutral */}
                        <span
                          onClick={() => handleEdit(row)}
                          className="cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors"
                        >
                          Edit
                        </span>
        
                        {/* Activate / Deactivate — semantic */}
                        <span
                          onClick={() => requestToggle(row.id, row.is_active)}
                          className={clsx(
                            "cursor-pointer transition-colors",
                            row.is_active
                              ? "text-neutral-600 dark:text-neutral-300 hover:text-red-600"
                              : "text-neutral-600 dark:text-neutral-300 hover:text-primary"
                          )}
                        >
                          {row.is_active ? "Deactivate" : "Activate"}
                        </span>
                      </td>
                    ),
                  }}
          emptyMessage="No POS roles found."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedRole ? `Edit Role: ${selectedRole.role_name}` : "Add New POS Role"}
        size="xl"
        height="full"
      >
        <RoleModal
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          initialData={selectedRole}
          permissions={permissions} 
          appContext={appContext}
          isLoading={false} 
        />
      </Modal>

         {/* Confirm Dialog for Deactivate/Activate */}
         {isConfirmOpen && (
        <ConfirmDialog
          onCancel={() => {
            setIsConfirmOpen(false);
            setPendingToggle(null);
          }}
          onConfirm={confirmToggle}
          title={
            pendingToggle?.is_active
              ? "Activate Permission"
              : "Deactivate Permission"
          }
          message={
            pendingToggle?.is_active
              ? "Activating this permission will make it available to roles again. Continue?"
              : "Deactivating this permission will remove it from all roles until reactivated. This action cannot be undone without reactivation. Continue?"
          }
          confirmLabel={pendingToggle?.is_active ? "Activate" : "Deactivate"}
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
};

export default PosRolesPage;