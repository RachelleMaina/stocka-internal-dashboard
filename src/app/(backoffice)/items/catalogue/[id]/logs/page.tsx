"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ReusableTable from "@/components/common/ReusableTable";
import { useItemLogs } from "@/hooks/useItems";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const COLUMNS = [
  { key: "performed_at", label: "Date Modified" },
  { key: "performed_by", label: "Performed By" },
  { key: "action", label: "Action" },
  { key: "details", label: "Notes" },
  { key: "changes", label: "Changes" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Created Item" },
  { value: "approve_item", label: "Approved Item" },
  { value: "reject_item", label: "Rejected Item" },
  { value: "activate_item", label: "Activated Item" },
  { value: "deactivate_item", label: "Deactivated Item" },
];

const ItemLogsPage = () => {
  const router = useRouter();
  const { id } = useParams();

  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedLog, setSelectedLog] = useState<any>(null);

  const params = useMemo(
    () => ({
      item_id: id,
      action: actionFilter || undefined,
      performed_by: userFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: currentPage,
      limit: 10,
    }),
    [id, actionFilter, userFilter, dateFrom, dateTo, currentPage]
  );

  const { data: response, isLoading } = useItemLogs(params);

  const logs = response?.logs || [];
  const pagination = response?.pagination;

  const uniqueUsers = useMemo(() => {
    const users = [...new Set(logs.map((log: any) => log.performed_by_name))];
    return users.sort();
  }, [logs]);

  const formatDate = (isoString: string) => {
    return format(parseISO(isoString), "MMM dd, yyyy hh:mm a");
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      create: "Created Item",
      approve_item: "Approved Item",
      reject_item: "Rejected Item",
      activate_item: "Activated Item",
      deactivate_item: "Deactivated Item",
    };
    return map[action] || action;
  };

  const openChangesModal = (log: any) => {
    setSelectedLog(log);
  };

  const closeChangesModal = () => {
    setSelectedLog(null);
  };

  const renderChangeDiff = () => {
    if (!selectedLog) return null;

    const changes = selectedLog.changes;

    // Special handling for create
    if (changes.action === "create" && changes.item_data) {
      const data = changes.item_data;
      return (
        <div className="space-y-2">
          <p className="font-medium">New Item Created:</p>
          <div className="pl-4 space-y-1 text-sm">
            {Object.entries(data).map(([key, value]: [string, any]) => (
              <div key={key}>
                <span className="font-medium capitalize">
                  {key.replace(/_/g, " ")}:
                </span>{" "}
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // For activate/deactivate
    if (changes.new_state || changes.previous_state) {
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-2 text-red-600">Previous State</p>
            <pre className="bg-neutral-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(changes.previous_state, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-medium mb-2 text-green-600">New State</p>
            <pre className="bg-neutral-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(changes.new_state, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    // Generic fallback
    return (
      <pre className="bg-neutral-100 p-4 rounded text-xs overflow-auto">
        {JSON.stringify(changes, null, 2)}
      </pre>
    );
  };

  const tableData = useMemo(() => {
    return logs.map((log: any) => ({
      id: log.id,
      performed_at: formatDate(log.performed_at),
      performed_by: log.performed_by_name,
      action: getActionLabel(log.changes.action || ""),
      action_raw: log.changes.action,
      details: log.notes || log.reason,
      changes: log.changes,
      full_log: log,
    }));
  }, [logs]);

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="text-neutral-700 hover:text-neutral-900"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Item Activity Logs</h1>
      </div>

      {/* Filters */}
      <div className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Performed By
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((user: string) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <ReusableTable
        data={tableData}
        columns={COLUMNS}
        pagination={pagination}
        onPageChange={setCurrentPage}
        loading={isLoading}
        scopedColumns={{
          performed_at: (log) => (
            <td className="text-sm">{log.performed_at}</td>
          ),
          performed_by: (log) => (
            <td className="font-medium">{log.performed_by}</td>
          ),
          action: (log) => <td>{log.action}</td>,
          details: (log) => <td>{log.details || "--"}</td>,
          changes: (log) => (
            <td className="text-center">
              <button
                onClick={() => openChangesModal(log.full_log)}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 mx-auto"
              >
                View Changes
              </button>
            </td>
          ),
        }}
      />

      {/* Changes Modal */}
      {selectedLog && (
        <ConfirmDialog
          title="Log Details & Changes"
          message={
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Action:</span>{" "}
                  {getActionLabel(selectedLog.changes.action || "")}
                </div>
                <div>
                  <span className="font-medium">Performed By:</span>{" "}
                  {selectedLog.performed_by_name}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {formatDate(selectedLog.performed_at)}
                </div>
                {selectedLog.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Notes:</span>{" "}
                    {selectedLog.notes}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-3">Changes:</p>
                {renderChangeDiff()}
              </div>
            </div>
          }
          confirmLabel="Close"
          onConfirm={closeChangesModal}
          onCancel={closeChangesModal}
          destructive={false}
          hideCancel={true}
        />
      )}
    </div>
  );
};

export default ItemLogsPage;
