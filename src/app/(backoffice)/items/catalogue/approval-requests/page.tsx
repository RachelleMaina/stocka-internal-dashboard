'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Search, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReusableTable from '@/components/common/ReusableTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useApprovalRequests, useApproveRequests, useRejectRequests } from '@/hooks/useItems';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import PageHeader from '@/components/common/PageHeader';
import { routes } from '@/constants/routes';
import Tabs from '@/components/common/Tabs';
import TableSelectionSummaryBar from '@/components/common/TableSelectionSummaryBar';
import StatusBadge from '@/components/common/StatusBadge';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

const COLUMNS = [
  { key: 'requested_at', label: 'Requested On' },
  { key: 'requested_by', label: 'Requested By' },
  { key: 'item_name', label: 'Item' },
  { key: 'action', label: 'Action' },
  { key: 'notes', label: 'Notes' },
  { key: 'status', label: 'Status' },
  { key: 'changes', label: 'Changes' },
  { key: 'reject_action', label: '' },
];

const REJECT_REASONS = [
  { value: 'duplicate', label: 'Duplicate Item' },
  { value: 'incorrect_info', label: 'Incorrect Information' },
  { value: 'not_needed', label: 'Not Needed in Catalogue' },
  { value: 'brand_issue', label: 'Brand Not Approved' },
  { value: 'pricing_issue', label: 'Pricing Issue' },
  { value: 'other', label: 'Other' },
];

const ItemApprovalRequestsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const approveMutation = useApproveRequests();
  const rejectMutation = useRejectRequests();

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


  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: 20,
    target_table:"items",
    status:activeTab
  }), [debouncedSearch, currentPage, activeTab]);

  const { data: response, isLoading } = useApprovalRequests(params);

  const requests = response?.requests || [];
  const pagination = response?.pagination;
  const selectedCount = selectedRows.length;

  const tableData = useMemo(() => {
    return requests.map((req: any) => ({
      id: req.id,
      item_id: req.item_id,
      requested_at: format(parseISO(req.requested_at), 'MMM dd, yyyy hh:mm a'),
      requested_by: req.requested_by_name,
      item_name: `${req?.item?.brand_name || ""} ${req?.item?.name}`,
      action: req?.changes?.type,
      notes:req?.notes,
      status: req.status,
      full_request: req,
    }));
  }, [requests]);

  const handleBulkApprove = () => {
    if (selectedRows.length === 0) return;
    setShowApproveConfirm(true);
  };

  const confirmBulkApprove = () => {
    approveMutation.mutate(selectedRows, {
      onSuccess: () => {
        toast.success(`${selectedRows.length} request(s) approved successfully!`);
        setSelectedRows([]);
        setShowApproveConfirm(false);
      },
      onError: () => {
        toast.error('Failed to approve requests');
        setShowApproveConfirm(false);
      },
    });
  };

  const openChangesModal = (request: any) => {
    setSelectedRequest(request.full_request);
  };

  const closeChangesModal = () => {
    setSelectedRequest(null);
  };

  const openRejectDialog = (requestId: string) => {
    setRejectRequestId(requestId);
    setRejectReason('');
  };

  const closeRejectDialog = () => {
    setRejectRequestId(null);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectRequestId || !rejectReason) {
      toast.error('Please select a rejection reason');
      return;
    }

    rejectMutation.mutate(
      { request_ids: [rejectRequestId], reason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Request rejected successfully!');
          closeRejectDialog();
        },
        onError: () => {
          toast.error('Failed to reject request');
        },
      }
    );
  };

  const renderChangeDiff = () => {
    if (!selectedRequest || !selectedRequest.changes) return null;

    const data = selectedRequest.changes?.details;

    return (
      <div className="space-y-3">
        <p className="font-medium">Item Details:</p>
        <div className="grid grid-cols-2 gap-4 text-sm bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          {Object.entries(data).map(([key, value]: [string, any]) => (
            <div key={key}>
              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
              <span className="text-neutral-700">{String(value ?? '--')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div >
        <PageHeader
              title="Approve Items"
              breadcrumb="All Items"
                     breadcrumbPath={routes.listItems}
              searchValue={searchInput}
              searchOnChange={setSearchInput}
              searchPlaceholder="Search items..."
              searchWidth="w-52"
              buttons={[
                {
                  label: 'Approve Selected',
                  icon: CheckCircle,
                  onClick:handleBulkApprove,
                  variant: 'primary',
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
        onRowSelect={(selected) => setSelectedRows(selected.map((r: any) => r.id))}
        selectedIds={selectedRows}
        scopedColumns={{
         
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
                View Changes
              </button>
            </td>
          ),
          reject_action: (req) => (
            <td className="text-center">
              {activeTab != TABS.REJECTED && req.status != 'rejected' && (
                <button
                  onClick={() => openRejectDialog(req.id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm font-medium mx-auto"
                >
            
                  Reject
                </button>
              )}
            </td>
          ),
        }}
      />
</div>
      {/* Bulk Approve Confirmation */}
      {showApproveConfirm && (
        <ConfirmDialog
          title="Approve Requests"
          message={<p>Are you sure you want to approve <strong>{selectedCount}</strong> selected request(s)?</p>}
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
          title="Reject Request"
          message={
            <div className="space-y-4">
              <p>Are you sure you want to reject this request?</p>
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
                    <option key={r.value} value={r.value}>{r.label}</option>
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

      {/* Changes Modal */}
      {selectedRequest && (
        <ConfirmDialog
          title="Request Details"
          message={
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="flex flex-col gap-2 text-sm">
                <div><span className="font-medium">Requested By:</span> {selectedRequest.requested_by_name}</div>
                <div><span className="font-medium">Requested On:</span> {format(parseISO(selectedRequest.requested_at), 'MMM dd, yyyy hh:mm a')}</div>
               
                {selectedRequest.notes && (
                  <div className="col-span-2"><span className="font-medium">Notes:</span> {selectedRequest.notes}</div>
                )}
              </div>

              <div className="border-t border-neutral-300 pt-4">
                {renderChangeDiff()}
              </div>
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
  );
};

export default ItemApprovalRequestsPage;