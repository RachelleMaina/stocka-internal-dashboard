"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ReusableTable from "@/components/common/ReusableTable";
import { Switch } from "@/components/common/Switch";
import { useApproveUoMs, useItemUomList } from "@/hooks/useItems";
import clsx from "clsx";
import { ArrowLeft, Search, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const TABS = {
  APPROVED: "approved",
  PENDING: "pending",
};

const COLUMNS = [
  { key: "item_uom_name", label: "Item & UoM" },
  { key: "purchased", label: "Purchased" },
  { key: "sold", label: "Sold" },
  { key: "status", label: "Status" },
];

const UoMsListPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS.PENDING);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      approval: activeTab === TABS.APPROVED ? "approved" : "pending",
    }),
    [activeTab, debouncedSearch]
  );

  const { data: response, isLoading } = useItemUomList(params);
  const approveMutation = useApproveUoMs();

  const uoms = response?.uoms || [];

  const tableData = useMemo(() => {
    return uoms.map((uom: any) => {
      const qtySuffix =
        uom.quantity_in_packaging > 1
          ? ` of ${uom.quantity_in_packaging}`
          : "";

      return {
        id: uom.id, // direct from service
        item_uom_name: `${uom.item.item_name} (${uom.display_name}${qtySuffix})`,
        brand_name: uom.item.brand_name,
        purchased: uom.is_purchased,
        sold: uom.is_sold,
        status: uom.approval_status || "pending",
        item_id: uom.item.id,
        uom_id: uom.id,
      };
    });
  }, [uoms]);

  const handleApprove = () => {
    if (selectedRows.length === 0) return;
    setShowConfirm(true);
  };

  const confirmApprove = () => {
    approveMutation.mutate(selectedRows, {
      onSuccess: () => {
        toast.success(`${selectedRows.length} UoM(s) approved successfully!`);
        setSelectedRows([]);
        setShowConfirm(false);
      },
      onError: () => {
        toast.error("Failed to approve UoMs");
        setShowConfirm(false);
      },
    });
  };

  const selectedCount = selectedRows.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg">Loading UoMs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Units of Measure</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search item or UoM..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => router.push("/items/uoms/form")}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white font-medium text-sm rounded hover:bg-primary/90"
          >
            <Settings size={18} />
            Manage UoMs
          </button>
        </div>
      </div>

      {/* Tabs + Approve Button */}
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            {(["approved", "pending"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedRows([]);
                }}
                className={clsx(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                )}
              >
                {tab === "approved" ? "Approved" : "Pending Approval"}
              </button>
            ))}
          </div>
          {activeTab === TABS.PENDING && (
            <button
              onClick={handleApprove}
              disabled={selectedCount === 0 || approveMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {approveMutation.isPending
                ? "Approving..."
                : `Approve Selected (${selectedCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {tableData.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg">No UoMs found.</p>
        </div>
      ) : (
        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          enableRowSelection={activeTab === TABS.PENDING}
          onRowSelect={(selected) =>
            setSelectedRows(selected.map((row: any) => row.id))
          }
          selectedIds={selectedRows}
          scopedColumns={{
            item_uom_name: (row) => (
              <td>
                <div>
                  <div className="font-medium">{row.item_uom_name}</div>
                  {row.brand_name && (
                    <div className="text-sm text-neutral-500">{row.brand_name}</div>
                  )}
                </div>
              </td>
            ),
            purchased: (row) => (
              <td>
                <div className="flex justify-center">
                  <Switch checked={row.purchased} disabled />
                </div>
              </td>
            ),
            sold: (row) => (
              <td>
                <div className="flex justify-center">
                  <Switch checked={row.sold} disabled />
                </div>
              </td>
            ),
            status: (row) => (
              <td>
              
                  {row.status === "approved" ? "Approved" : "Pending"}
               
              </td>
            ),
          }}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Approve UoMs"
          message={
            <p>
              Are you sure you want to approve <strong>{selectedCount}</strong>{" "}
              UoM(s)?
            </p>
          }
          confirmLabel="Approve"
          cancelLabel="Cancel"
          onConfirm={confirmApprove}
          onCancel={() => setShowConfirm(false)}
          destructive={false}
        />
      )}
    </div>
  );
};

export default UoMsListPage;