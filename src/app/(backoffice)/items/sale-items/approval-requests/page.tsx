"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import StatusBadge from "@/components/common/StatusBadge";
import Tabs from "@/components/common/Tabs";
import { routes } from "@/constants/routes";
import {
  useApproveSalesItemsRequests,
  useRejectSalesItemsRequests,
  useSaleItemsApprovalRequests,
} from "@/hooks/useSaleItems";
import { format, parseISO } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

const COLUMNS = [
  { key: "requested_at", label: "Requested On" },
  { key: "requested_by", label: "Requested By" },
  { key: "item_name", label: "Item" },
  { key: "channel_name", label: "Sales Channel" },
  { key: "action", label: "Action" },
  { key: "notes", label: "Notes" },
  { key: "status", label: "Status" },
  { key: "changes", label: "Details" },
  { key: "reject_action", label: "" },
];

const REJECT_REASONS = [
  { value: "duplicate", label: "Duplicate Item in Channel" },
  { value: "incorrect_channel", label: "Wrong Sales Channel" },
  { value: "not_suitable", label: "Not Suitable for Channel" },
  { value: "pricing_issue", label: "Pricing Inconsistency" },
  { value: "missing_info", label: "Missing Required Info" },
  { value: "other", label: "Other" },
];

const SalesItemsApprovalRequestsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelName = searchParams.get("channelName");
  const  channelId  = searchParams.get("channelId");


  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const approveMutation = useApproveSalesItemsRequests();
  const rejectMutation = useRejectSalesItemsRequests();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [activeTab]);



  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 20,
     status:activeTab
    }),
    [debouncedSearch, currentPage, activeTab]
  );

  const { data: response, isLoading } = useSaleItemsApprovalRequests({
    channelId: channelId as string,
    params,
  });

  const requests = response?.requests || [];
  const pagination = response?.pagination;
  const selectedCount = selectedRows.length;

  const tableData = useMemo(() => {
    return requests.map((req: any) => {
      const changes = req.changes || {};
      const itemData = changes.item || {};
      const channelData = changes.sales_channel || {};

      return {
        id: req.id,
        requested_at: format(
          parseISO(req.requested_at),
          "MMM dd, yyyy hh:mm a"
        ),
        requested_by: req.requested_by_name,
        item_name: `${itemData.brand_name || ""} ${
          itemData.item_name || "--"
        }`.trim(),
        channel_name: channelData.channel_name || "--",
        action: changes.action || "Add Item",
        notes: req.notes || "--",
        status: req.status,
        full_request: req,
      };
    });
  }, [requests]);

  const handleBulkApprove = () => {
    if (selectedRows.length === 0) return;
    setShowApproveConfirm(true);
  };

  const confirmBulkApprove = () => {
    approveMutation.mutate(
      { channelId: channelId as string, requestIds: selectedRows },
      {
        onSuccess: () => {
          toast.success(
            `${selectedRows.length} sales item request(s) approved successfully!`
          );
          setSelectedRows([]);
          setShowApproveConfirm(false);
          router.push(`${routes.listSalesItems}?channelName=${encodeURIComponent(channelName)}&channelId=${channelId}`);
        },
        onError: () => {
          toast.error("Failed to approve sales item requests");
          setShowApproveConfirm(false);
        },
      }
    );
  };

  const openChangesModal = (request: any) => {
    setSelectedRequest(request.full_request);
  };

  const closeChangesModal = () => {
    setSelectedRequest(null);
  };

  const openRejectDialog = (requestId: string) => {
    setRejectRequestId(requestId);
    setRejectReason("");
  };

  const closeRejectDialog = () => {
    setRejectRequestId(null);
    setRejectReason("");
  };

  const confirmReject = () => {
    if (!rejectRequestId || !rejectReason) {
      toast.error("Please select a rejection reason");
      return;
    }

    rejectMutation.mutate(
      {
        channelId: channelId as string,
        request_ids: [rejectRequestId],
        reason: rejectReason,
      },
      {
        onSuccess: () => {
          toast.success("Sales item request rejected successfully!");
          closeRejectDialog();
        },
        onError: () => {
          toast.error("Failed to reject sales item request");
        },
      }
    );
  };

  const renderChangeDiff = () => {
    if (!selectedRequest) return null;

    const changes = selectedRequest.changes || {};
    const item = changes.item || {};
    const channel = changes.sales_channel || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-medium mb-1">Item:</p>
            <p className="text-base font-semibold">
              {item.brand_name} {item.item_name}
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Sales Channel:</p>
            <p className="text-base font-semibold">
              {channel.channel_name || "--"}
            </p>
          </div>
        </div>

        {selectedRequest.notes && (
          <div>
            <p className="font-medium mb-1">Notes:</p>
            <p className="text-sm text-neutral-700">{selectedRequest.notes}</p>
          </div>
        )}
      </div>
    );
  };
 

  return (
    <div>
      <PageHeader
        title={`Approve ${channelName} Items`}
                  breadcrumb="Items"
        breadcrumbPath={`${routes.listSalesItems}?channelName=${encodeURIComponent(channelName)}&channelId=${channelId}`}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items..."
        searchWidth="w-52"
        buttons={[
          {
            label: "Approve Selected",
            icon: CheckCircle,
            onClick: handleBulkApprove,
            variant: "primary",
          },
        ]}
      />

      <div className="mx-4">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(key) => {
            setActiveTab(key);
            setSelectedRows([]);
          }}
        />

        {/* Table */}
        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          pagination={pagination}
          onPageChange={setCurrentPage}
          loading={isLoading}
          enableRowSelection={true}
          onRowSelect={(selected) =>
            setSelectedRows(selected.map((r: any) => r.id))
          }
          selectedIds={selectedRows}
          scopedColumns={{
            requested_at: (req) => <td>{req.requested_at}</td>,
            requested_by: (req) => <td>{req.requested_by}</td>,
            item_name: (req) => <td>{req.item_name}</td>,
            channel_name: (req) => <td>{req.channel_name}</td>,
            action: (req) => (
              <td>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {req.action}
                </span>
              </td>
            ),
            notes: (req) => (
              <td className="text-sm text-neutral-600">{req.notes}</td>
            ),
            status: (req) => {
              return (
                <td>
                  <StatusBadge status={req.status} />
                </td>
              );
            },
            changes: (req) => (
              <td className="text-center">
                <button
                  onClick={() => openChangesModal(req)}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View Details →
                </button>
              </td>
            ),
            reject_action: (req) => (
              <td className="text-center">
                {activeTab !== TABS.REJECTED && req.status !== "rejected" && (
                  <button
                    onClick={() => openRejectDialog(req.id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm font-medium mx-auto"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                )}
              </td>
            ),
          }}
        />

        {/* Bulk Approve Confirmation */}
        {showApproveConfirm && (
          <ConfirmDialog
            title="Approve Sales Item Requests"
            message={
              <p>
                Are you sure you want to approve{" "}
                <strong>{selectedCount}</strong> selected sales item request(s)?
              </p>
            }
            confirmLabel="Approve"
            cancelLabel="Cancel"
            onConfirm={confirmBulkApprove}
            onCancel={() => setShowApproveConfirm(false)}
            destructive={false}
          />
        )}

        {/* Individual Reject Dialog */}
        {rejectRequestId && (
          <ConfirmDialog
            title="Reject Sales Item Request"
            message={
              <div className="space-y-4">
                <p>Are you sure you want to reject this sales item request?</p>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a reason...</option>
                    {REJECT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            }
            confirmLabel="Reject"
            cancelLabel="Cancel"
            onConfirm={confirmReject}
            onCancel={closeRejectDialog}
            destructive={true}
            confirmDisabled={!rejectReason}
          />
        )}

        {/* Details Modal */}
        {selectedRequest && (
          <ConfirmDialog
            title="Sales Item Request Details"
            message={
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Requested By:</span>{" "}
                    {selectedRequest.requested_by_name}
                  </div>
                  <div>
                    <span className="font-medium">Requested On:</span>{" "}
                    {format(
                      parseISO(selectedRequest.requested_at),
                      "MMM dd, yyyy hh:mm a"
                    )}
                  </div>
                  {selectedRequest.approved_at && (
                    <div>
                      <span className="font-medium">Approved On:</span>{" "}
                      {format(
                        parseISO(selectedRequest.approved_at),
                        "MMM dd, yyyy hh:mm a"
                      )}
                    </div>
                  )}
                  {selectedRequest.approved_by_name && (
                    <div>
                      <span className="font-medium">Approved By:</span>{" "}
                      {selectedRequest.approved_by_name}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">{renderChangeDiff()}</div>
              </div>
            }
            confirmLabel="Close"
            onConfirm={closeChangesModal}
            onCancel={closeChangesModal}
            hideCancel={true}
            destructive={false}
          />
        )}
      </div>
    </div>
  );
};

export default SalesItemsApprovalRequestsPage;
