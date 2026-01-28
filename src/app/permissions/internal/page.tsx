"use client";

import clsx from "clsx";
import { Plus } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Modal from "@/components/common/Modal";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import StatusBadge from "@/components/common/StatusBadge";
import Tabs from "@/components/common/Tabs";
import PermissionModal from "@/components/PermissionsModal";
import {
  useCreatePermission,
  usePermissions,
  useTogglePermissionStatus,
  useUpdatePermission,
} from "@/hooks/usePermissions";
import { format, parseISO } from "date-fns";
import { routes } from "@/constants/routes";

const TABS = [
  { key: "all", label: "All" },
  { key: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "description", label: "Description" },
  { key: "module", label: "Module" },
  { key: "status", label: "Status" },
  { key: "updated_at", label: "Last Updated" },
  { key: "actions", label: "Actions" },
];

interface PermissionsInternalPageProps {
  appContext: "internal"; // or pass dynamically if reused
}

const PermissionsInternalPage: React.FC<PermissionsInternalPageProps> = ({
  appContext = "internal",
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);

  // New: confirm dialog state
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

  // Query params
  const queryParams = useMemo(
    () => ({
      app_context: appContext,
      status: activeTab === "all" ? undefined : activeTab,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 20,
    }),
    [activeTab, debouncedSearch, currentPage, appContext]
  );

  const { data: permissionsResponse, isLoading } = usePermissions({
    params: queryParams,
  });
  const createMutation = useCreatePermission();
  const updateMutation = useUpdatePermission();
  const toggleMutation = useTogglePermissionStatus();

  const permissions = permissionsResponse?.permissions || [];
  const pagination = permissionsResponse?.pagination;

  // Transform for table
  const tableData = useMemo(() => {
    return permissions.map((perm) => ({
      ...perm,
      status: perm.is_active ? "Active" : "Inactive",
      rawPermission: perm,
    }));
  }, [permissions]);

  const handleAddNew = () => {
    setSelectedPermission(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setSelectedPermission(row.rawPermission);
    setIsModalOpen(true);
  };

  // Open confirmation before toggle
  const requestToggle = (permissionId: string, currentStatus: boolean) => {
    setPendingToggle({ id: permissionId, is_active: !currentStatus });
    setIsConfirmOpen(true);
  };

  // Confirm and execute toggle
  const confirmToggle = async () => {
    if (!pendingToggle) return;

    const { id, is_active } = pendingToggle;

    try {
      await toggleMutation.mutateAsync({ id, is_active });
      toast.success(
        `Permission ${is_active ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      toast.error("Failed to update permission status");
    } finally {
      setIsConfirmOpen(false);
      setPendingToggle(null);
    }
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      if (selectedPermission) {
        await updateMutation.mutateAsync({
          id: selectedPermission.id,
          ...formData,
        });
        toast.success("Permission updated");
      } else {
        await createMutation.mutateAsync({
          ...formData,
          app_context: appContext,
        });
        toast.success("Permission created");
      }
      setIsModalOpen(false);
      setSelectedPermission(null);
    } catch (err) {
      toast.error(selectedPermission ? "Failed to update" : "Failed to create");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPermission(null);
  };

  return (
    <div>
      <PageHeader
        title={`${appContext} Permissions`}
        breadcrumb="Permissions"
        breadcrumbPath={routes.permissions}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search permissions..."
        searchWidth="w-72"
        buttons={[
          {
            label: "Add Permission",
            icon: Plus,
            onClick: handleAddNew,
            variant: "primary",
          },
        ]}
      />

      <div className="mx-4 mt-10">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          loading={isLoading}
          pagination={pagination}
          onPageChange={setCurrentPage}
          scopedColumns={{
            updated_at: (row) => (
              <td>
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
          emptyMessage={`No ${appContext} permissions found.`}
        />
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={
          selectedPermission
            ? `Edit Permission: ${selectedPermission.code}`
            : `Add New ${appContext} Permission`
        }
        size="lg"
      >
        <PermissionModal
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          initialData={selectedPermission}
          modules={[
            "Sales",
            "Billing",
            "Inventory",
            "Users",
            "Reports",
            "Settings",
            "Discounts",
            "Dashboard",
            "Customers",
            "Payments",
            "Other",
          ]}
          isLoading={createMutation.isPending || updateMutation.isPending}
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

export default PermissionsInternalPage;
