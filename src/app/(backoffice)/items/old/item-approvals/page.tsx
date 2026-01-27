// app/backoffice/stock-approvals/page.tsx
"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import { FilterBar } from "@/components/common/FilterBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Check, Clock, Edit, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import { endpoints } from "@/constants/endpoints";

export default function StockApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [approvalToApprove, setApprovalToApprove] = useState<any>(null);
  const [approvalToEdit, setApprovalToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    adjustment_type: "ADD",
    quantity_to_adjust: 0,
    etims_movement_code: "",
    movement_type_name: "",
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [statusOptions] = useState([
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ]);
  const [adjustmentTypeOptions] = useState([
    { value: "ADD", label: "Add" },
    { value: "DEDUCT", label: "Deduct" },
  ]);

  const { backoffice_user_profile } = useAppState();
  const businessLocationId = backoffice_user_profile?.business_location_id;
  const storeLocationId = backoffice_user_profile?.store_location_id; 
  const router = useRouter();

  const allMovementOptions: Option[] = [
  { value: "01", label: "Import", local_type: "purchase" },
  { value: "02", label: "Purchase", local_type: "purchase" },
  { value: "03", label: "Return", local_type: "purchase_return" },
  { value: "04", label: "Stock Movement", local_type: "transfer_in" }, // or transfer_out based on direction
  { value: "05", label: "Processing", local_type: "production_out" },
  { value: "06", label: "Adjustment", local_type: "add_adjustment" },
  { value: "11", label: "Sale", local_type: "sale" },
  { value: "12", label: "Return", local_type: "sales_return" },
  { value: "13", label: "Stock Movement", local_type: "transfer_out" }, // or transfer_in
  { value: "14", label: "Processing", local_type: "production_in" },
  { value: "15", label: "Discarding", local_type: "wastage" }, // or damage/theft
  { value: "16", label: "Adjustment", local_type: "remove_adjustment" },
];

  const fetchApprovals = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.getStockApprovals(storeLocationId), {
        params: {
          page,
          limit: pagination.limit,
          status: status?.value || null,
          search,
        },
      });
      const { data, pagination: pag } = response?.data?.data || {};
      setApprovals(data || []);
      setPagination(pag || pagination);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessLocationId) {
      fetchApprovals(1);
    }
  }, [businessLocationId, status?.value, search]);

  const handlePageChange = (page: number) => {
    fetchApprovals(page);
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusChange = (value: any) => {
    setStatus(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const openApproveConfirmation = (approval: any) => {
    setApprovalToApprove(approval);
    setIsApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!approvalToApprove) return;

    setOperationLoading(true);
    try {
      const response = await api.post(
        endpoints.approveStockApproval(storeLocationId, approvalToApprove.id),
        { approver_id: backoffice_user_profile?.id }
      );
      toast.success("Approval processed successfully");
      setIsApproveOpen(false);
      setApprovalToApprove(null);
      fetchApprovals(pagination.currentPage);
    } catch (error: any) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Failed to approve");
    } finally {
      setOperationLoading(false);
    }
  };

  const openEditModal = (approval: any) => {
    setApprovalToEdit(approval);
    setEditForm({
      adjustment_type: approval.adjustment_type,
      quantity_to_adjust: approval.quantity_to_adjust,
      etims_movement_code: approval.etims_movement_code,
      movement_type_name: approval.movement_type_name,
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitEdit = async () => {
    if (!approvalToEdit || !editForm.quantity_to_adjust || !editForm.etims_movement_code) {
      toast.error("Please fill all required fields");
      return;
    }

    setOperationLoading(true);
    try {
      const updateData = {
        adjustment_type: editForm.adjustment_type,
        quantity_to_adjust: parseFloat(editForm.quantity_to_adjust),
        etims_movement_code: editForm.etims_movement_code,
        movement_type_name: allMovementOptions.find(opt => opt.value === editForm.etims_movement_code)?.local_type || editForm.movement_type_name,
      };
      await api.patch(endpoints.updateStockApproval(storeLocationId, approvalToEdit.id), updateData);
      toast.success("Approval updated successfully");
      setIsEditOpen(false);
      setApprovalToEdit(null);
      setEditForm({ adjustment_type: "ADD", quantity_to_adjust: 0, etims_movement_code: "", movement_type_name: "" });
      fetchApprovals(pagination.currentPage);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update approval");
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: "item",
      label: "Item",
      render: (approval: any) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <p className="font-medium">{approval.item_name}</p>
            <p className="text-sm text-neutral-500">{approval.movement_type_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "store",
      label: "Store",
      render: (approval: any) => (
        <span className="text-neutral-800 dark:text-neutral-100">
          {approval.store_name}
        </span>
      ),
    },
    {
      key: "adjustment",
      label: "Adjustment",
      render: (approval: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{approval.adjustment_type}</span>
          <span className="text-sm">{approval.quantity_to_adjust} units</span>
          <span className="text-xs text-neutral-500">
            From: {approval.previous_quantity}
          </span>
        </div>
      ),
    },
    {
      key: "note",
      label: "Note",
      render: (approval: any) => (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {approval.note || "N/A"}
        </p>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (approval: any) => (
        <span
          className={clsx(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            approval.status === "pending"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              : approval.status === "approved"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          )}
        >
          {approval.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
          {approval.status === "approved" && <Check className="w-3 h-3 mr-1" />}
          {approval.status === "rejected" && <X className="w-3 h-3 mr-1" />}
          {approval.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (approval: any) => (
        <div className="flex items-center justify-end gap-2">
          {approval.status === "pending" && (
            <>
              <Permission resource="stock" action="update">
                <button
                  onClick={() => openEditModal(approval)}
                  disabled={operationLoading}
                  className="p-1.5 text-neutral-500 hover:text-primary transition"
                  aria-label="Edit Approval"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </Permission>
              <Permission resource="stock" action="approve">
                <button
                  onClick={() => openApproveConfirmation(approval)}
                  disabled={operationLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition"
                >
                  Approve
                </button>
              </Permission>
            </>
          )}
        </div>
      ),
    },
  ], [operationLoading]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="stock" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Stock Approvals"
          breadcrumbs={[
            { name: "Stock", onClick: () => router.push(routes.stock) },
            { name: "Approvals" },
          ]}
          actions={[] /* Add if needed */}
        />
        <div className="p-3 bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="p-3">
            <FilterBar
              isActive={false}
              onToggleActive={() => {}} // Not used here
              searchQuery={search}
              onSearchChange={handleSearchChange}
              facets={[
                {
                  label: "Status",
                  options: statusOptions,
                  value: status,
                  onChange: handleStatusChange,
                },
              ]}
            />
          </div>
          {approvals.length > 0 ? (
            <ReusableTable
              data={approvals}
              columns={columns}
              pageSize={pagination.limit}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          ) : (
            <PageEmptyState 
              icon={Clock} 
              description="No approvals found." 
            />
          )}
        </div>

        {isApproveOpen && approvalToApprove && (
          <ConfirmDialog
            title="Approve Stock Adjustment"
            message={
              <div className="space-y-4">
                <p>
                  Are you sure you want to approve the stock adjustment for <strong>{approvalToApprove.item_name}</strong>?
                </p>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Type:</strong></p>
                    <p className="font-medium">{approvalToApprove.adjustment_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Quantity:</strong></p>
                    <p className="font-medium">{approvalToApprove.quantity_to_adjust}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><strong>From:</strong></p>
                    <p className="font-medium">{approvalToApprove.previous_quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Movement:</strong></p>
                    <p className="font-medium">{approvalToApprove.etims_movement_code} - {approvalToApprove.movement_type_name}</p>
                  </div>
                </div>
                {approvalToApprove.note && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Note:</strong> {approvalToApprove.note}
                  </p>
                )}
              </div>
            }
            confirmLabel="Approve"
            cancelLabel="Cancel"
            onConfirm={handleApprove}
            onCancel={() => {
              setIsApproveOpen(false);
              setApprovalToApprove(null);
            }}
            loading={operationLoading}
          />
        )}

        {isEditOpen && approvalToEdit && (
          <ConfirmDialog
            title="Edit Stock Approval"
            message={
              <div className="space-y-4">
                <p>
                  Edit the details for <strong>{approvalToEdit.item_name}</strong> approval.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Adjustment Type
                    </label>
                    <Select
                      options={adjustmentTypeOptions}
                      value={adjustmentTypeOptions.find(opt => opt.value === editForm.adjustment_type)}
                      onChange={(option) => handleEditChange('adjustment_type', option?.value || 'ADD')}
                      placeholder="Select type"
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                      isClearable={false}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Quantity to Adjust
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={editForm.quantity_to_adjust}
                      onChange={(e) => handleEditChange('quantity_to_adjust', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Movement Type
                    </label>
                    <Select
                      options={allMovementOptions}
                      value={allMovementOptions.find(opt => opt.value === editForm.etims_movement_code)}
                      onChange={(option) => {
                        handleEditChange('etims_movement_code', option?.value || '');
                        handleEditChange('movement_type_name', option?.local_type || '');
                      }}
                      placeholder="Select movement"
                      className="my-react-select-container text-sm"
                      classNamePrefix="my-react-select"
                      isClearable={false}
                    />
                  </div>
                </div>
              </div>
            }
            confirmLabel="Save Changes"
            cancelLabel="Cancel"
            onConfirm={handleSubmitEdit}
            onCancel={() => {
              setIsEditOpen(false);
              setApprovalToEdit(null);
              setEditForm({ adjustment_type: "ADD", quantity_to_adjust: 0, etims_movement_code: "", movement_type_name: "" });
            }}
            loading={operationLoading}
          />
        )}
      </div>
    </Permission>
  );
}