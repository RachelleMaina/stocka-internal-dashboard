'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Search, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReusableTable from '@/components/common/ReusableTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useStorageAreaApprovalRequests, useStorageAreaApproveRequests, useStorageAreaRejectRequests } from '@/hooks/useSettings';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TABS = {
  ALL: 'all',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

const COLUMNS = [
  { key: 'requested_at', label: 'Requested On' },
  { key: 'requested_by', label: 'Requested By' },
  { key: 'storage_name', label: 'Storage Area Name' },
  { key: 'status', label: 'Status' },
  { key: 'changes', label: 'Details' },
  { key: 'reject_action', label: '' },
];

const REJECT_REASONS = [
  { value: 'duplicate', label: 'Duplicate Storage Area' },
  { value: 'incorrect_name', label: 'Incorrect or Unclear Name' },
  { value: 'not_needed', label: 'Not Needed' },
  { value: 'naming_convention', label: 'Does Not Follow Naming Convention' },
  { value: 'other', label: 'Other' },
];

const StorageAreaApprovalRequestsPage = () => {
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

  const approveMutation = useStorageAreaApproveRequests();
  const rejectMutation = useStorageAreaRejectRequests();

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

  const getTabParams = (tab: string) => {
    switch (tab) {
      case TABS.PENDING: return { status: 'pending' };
      case TABS.REJECTED: return { status: 'rejected' };
      case TABS.ALL:
      default: return {};
    }
  };

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: 20,
    ...getTabParams(activeTab),
  }), [debouncedSearch, currentPage, activeTab]);

  const { data: response, isLoading } = useStorageAreaApprovalRequests(params);

  const requests = response?.requests || [];
  const pagination = response?.pagination;
  const selectedCount = selectedRows.length;

  const tableData = useMemo(() => {
    return requests.map((req: any) => {

      return {
        id: req.id,
        requested_at: format(parseISO(req.requested_at), 'MMM dd, yyyy hh:mm a'),
        requested_by: req.requested_by_name,
        storage_name: req.storage_area?.name,
        notes: req.notes || '--',
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
    approveMutation.mutate(selectedRows, {
      onSuccess: () => {
        toast.success(`${selectedRows.length} storage area request(s) approved successfully!`);
        setSelectedRows([]);
        setShowApproveConfirm(false);
      },
      onError: () => {
        toast.error('Failed to approve storage area requests');
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
          toast.success('Storage area request rejected successfully!');
          closeRejectDialog();
        },
        onError: () => {
          toast.error('Failed to reject storage area request');
        },
      }
    );
  };

  const renderChangeDiff = () => {
    if (!selectedRequest) return null;

    const changes = selectedRequest.changes || {};

    return (
      <div className="space-y-4">
        <div className="text-sm">
          <p className="font-medium mb-2">Proposed Storage Area Name:</p>
          <p className="text-lg font-semibold text-neutral-900">{changes.name || '--'}</p>
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

  const renderTopActions = () => {
    if (selectedCount > 0) {
      return (
        <button
          onClick={handleBulkApprove}
          disabled={approveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 disabled:opacity-50"
        >
          <CheckCircle size={18} />
          {approveMutation.isPending ? 'Approving...' : `Approve Selected (${selectedCount})`}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-neutral-700 hover:text-neutral-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Storage Area Approval Requests</h1>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            {(['all', 'pending', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'py-3 px-2 border-b-2 font-medium text-sm capitalize transition-colors',
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                )}
              >
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>

          <div>{renderTopActions()}</div>
        </div>
      </div>

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
            const badgeStyles = {
              pending: 'bg-yellow-100 text-yellow-800',
              approved: 'bg-green-100 text-green-800',
              rejected: 'bg-red-100 text-red-800',
            }[req.status] || 'bg-neutral-100 text-neutral-800';

            return (
              <td>
                <span className={clsx('px-3 py-1 text-xs font-medium rounded-full capitalize', badgeStyles)}>
                  {req.status}
                </span>
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
              {activeTab !== TABS.REJECTED && req.status !== 'rejected' && (
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
          title="Approve Storage Area Requests"
          message={<p>Are you sure you want to approve <strong>{selectedCount}</strong> selected storage area request(s)?</p>}
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
          title="Reject Storage Area Request"
          message={
            <div className="space-y-4">
              <p>Are you sure you want to reject this storage area request?</p>
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

      {/* Details Modal */}
      {selectedRequest && (
        <ConfirmDialog
          title="Storage Area Request Details"
          message={
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Requested By:</span> {selectedRequest.requested_by_name}</div>
                <div><span className="font-medium">Requested On:</span> {format(parseISO(selectedRequest.requested_at), 'MMM dd, yyyy hh:mm a')}</div>
                {selectedRequest.approved_at && (
                  <div><span className="font-medium">Approved On:</span> {format(parseISO(selectedRequest.approved_at), 'MMM dd, yyyy hh:mm a')}</div>
                )}
                {selectedRequest.approved_by_name && (
                  <div><span className="font-medium">Approved By:</span> {selectedRequest.approved_by_name}</div>
                )}
              </div>

              <div className="border-t pt-4">
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

export default StorageAreaApprovalRequestsPage;