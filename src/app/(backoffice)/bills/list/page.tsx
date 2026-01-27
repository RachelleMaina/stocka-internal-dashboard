"use client";

import CreateBillForm from "@/components/common/CreateBillForm";
import { DropdownMenu } from "@/components/common/DropdownActionMenu";
import Modal from "@/components/common/Modal";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import TableSelectionSummaryBar from "@/components/common/TableSelectionSummaryBar";
import Tabs from "@/components/common/Tabs";
import {
  useAddPayment,
  useBills,
  useCreateBill,
  useUpdateBill,
  useVoidBill,
  useWaiters,
} from "@/hooks/useBills";
import clsx from "clsx";
import { Ban, MoreHorizontal, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Tab {
  key: string;
  label: string;
}

const TABS: Tab[] = [
  { key: "all", label: "All Bills" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Not Paid" },
];

const COLUMNS = [
  { key: "bill_number", label: "Bill No" },
  { key: "bill_date", label: "Date" },
  { key: "reference", label: "Reference" },
  { key: "waiter", label: "Waiter" },
  { key: "total_amount", label: "Total",},
  { key: "payment_method", label: "Payment" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" }, // ← New column
];

const BillsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelName = searchParams.get('channelName');
  const channelId  = searchParams.get('channelId');
  // Tabs
  const [activeTab, setActiveTab] = useState<Tab["key"]>("all");

  // Filter by waiter
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null);

  // Search (debounced)
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [billToPay, setBillToPay] = useState<any>(null);

  // Void confirmation
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [billToVoid, setBillToVoid] = useState<any>(null);

  const paymentMethods = [
    { code: "01", name: "Cash" },
    { code: "04", name: "M-Pesa" },
    { code: "10", name: "Card" },
    { code: "10", name: "Complimentary" },
  ];

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
      status: activeTab === "all" ? undefined : activeTab,
      waiterId: selectedWaiter || undefined,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 20,
    }),
    [activeTab, selectedWaiter, debouncedSearch, currentPage]
  );

  // Hooks
  const { data: billsResponse, isLoading } = useBills({ params: queryParams });
  const { data: waiters = [] } = useWaiters();
  const createBillMutation = useCreateBill();
  const updateBillMutation = useUpdateBill();
  const addPaymentMutation = useAddPayment();
  const voidBillMutation = useVoidBill();

  const bills = billsResponse?.bills || [];
  const pagination = billsResponse?.pagination;

  // Transform for table
  const tableData = useMemo(() => {
    return bills.map((bill) => ({
      ...bill
    }));
  }, [bills]);

  const handleCreateBill = () => {
    setSelectedBill(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (row: any) => {
    setSelectedBill(row.rawBill);
    setIsModalOpen(true);
  };

  const handleAddPayment = (row: any) => {
    setBillToPay(row.rawBill);
    setShowPaymentDialog(true);
  };

  const handleVoidBill = (row: any) => {
    setBillToVoid(row.rawBill);
    setShowVoidDialog(true);
  };

  const confirmVoid = () => {
    if (!billToVoid) return;

    voidBillMutation.mutate(
      { billId: billToVoid.id },
      {
        onSuccess: () => {
          toast.success(`Bill #${billToVoid.id} voided successfully`);
          setShowVoidDialog(false);
          setBillToVoid(null);
        },
        onError: () => {
          toast.error("Failed to void bill");
        },
      }
    );
  };

  const handleSelectPayment = (methodName: string) => {
    if (!billToPay) return;

    addPaymentMutation.mutate(
      { billId: billToPay.id, method: methodName },
      {
        onSuccess: () => {
          toast.success(
            `Payment added: ${methodName} for bill #${billToPay.id}`
          );
          setShowPaymentDialog(false);
          setBillToPay(null);
        },
        onError: () => {
          toast.error("Failed to add payment");
        },
      }
    );
  };

// In BillsPage component
const waitersWithWalkIn = useMemo(() => {
    return [
      { value: 'walk-in', label: 'Walk-in Customer', isWalkIn: true },
      ...(waiters || []),
    ];
  }, [waiters]);

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title="Bills"
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search bills..."
        searchWidth="w-72"
        filters={waiters}
        selectedFilter={
          waiters.find((opt) => opt.value === selectedWaiter) || null
        }
        onFilterChange={(value) => setSelectedWaiter(value || null)}
        filterPlaceholder="Filter by Waiter / Walk-in"
        buttons={[
          {
            label: "Create Bill",
            icon: Plus,
            onClick: handleCreateBill,
            variant: "primary",
          },
        ]}
      />

      <div className="mx-4">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <TableSelectionSummaryBar
          selectedCount={0}
          totalAvailable={bills.length}
          emptyMessage="No bills found. Click 'Create Bill' to get started."
        />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          loading={isLoading}
          onRowClick={handleRowClick}
          clickableRows
          pagination={pagination}
          onPageChange={setCurrentPage}
          scopedColumns={{
            bill_number: (row) => (
              <td className="underline text-primary hover:text-primary/80 cursor-pointer font-medium">
                {row.bill_number}
              </td>
            ),
            status: (row) => (
              <td>
                <span
                  className={clsx(
                    "px-3 py-1 text-xs font-medium rounded-full",
                    row.status === "Paid"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                  )}
                >
                  {row.status}
                </span>
              </td>
            ),
            total: (row) => (
              <td className="text-right font-medium"> KES {row.total}</td>
            ),
            payment_method: (row) => (
              <td>
                {row.payment ? (
                  <span className="font-medium">{row.payment}</span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddPayment(row);
                    }}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Payment
                  </button>
                )}
              </td>
            ),
            actions: (row) => (
              <td className="text-center">
                {row.isPending && (
                  <DropdownMenu
                    trigger={
                      <div className="cursor-pointer p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <MoreHorizontal className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                    }
                    items={[
                      {
                        label: "Void Bill",
                        icon: (
                          <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ),
                        onClick: () => handleVoidBill(row),
                       
                      },
                    ]}
                  />
                )}
              </td>
            ),
          }}
          emptyMessage="No bills found in this filter. Try changing tab or waiter."
        />
      </div>
      <Modal
  isOpen={isModalOpen}
//   onClose={handleModalClose}
  title={selectedBill ? `Bill #${selectedBill.id}` : 'Create New Bill'}
  size="xl"
  height="full"
>
  <CreateBillForm
    onSubmit={async (payload) => {
      try {
        if (selectedBill) {
          await updateBillMutation.mutateAsync({
            id: selectedBill.id,
            ...payload,
          });
          toast.success('Bill updated');
        } else {
          await createBillMutation.mutateAsync(payload);
          toast.success('Bill created');
        }
        // handleModalClose();
      } catch {
        toast.error('Failed to save bill');
      }
    }}
    channelId={channelId}
    waiters={waitersWithWalkIn}  
    initialWaiter={selectedWaiter}            // pre-selected if any
    initialDate={selectedBill?.createdAt || undefined}
    initialData={selectedBill}
  />
</Modal>
      {/* Add Payment Dialog */}
      {showPaymentDialog && billToPay && (
        <Modal
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setBillToPay(null);
          }}
          title={`Add Payment for Bill #${billToPay.id}`}
          size="sm"
        >
          <div className="space-y-6 p-6">
            <p className="text-neutral-700 dark:text-neutral-300">
              Total:{" "}
              <span className="font-bold">
                KES {billToPay.totalAmount?.toLocaleString() || "0"}
              </span>
            </p>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.code}
                    onClick={() => handleSelectPayment(method.name)}
                    className="px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowPaymentDialog(false)}
                className="px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Void Confirmation Dialog */}
      {showVoidDialog && billToVoid && (
        <Modal
          isOpen={showVoidDialog}
          onClose={() => {
            setShowVoidDialog(false);
            setBillToVoid(null);
          }}
          title={`Void Bill #${billToVoid.id}`}
          size="sm"
        >
          <div className="space-y-6 p-6">
            <p className="text-neutral-700 dark:text-neutral-300">
              Are you sure you want to void this bill?
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Total: KES {billToVoid.totalAmount?.toLocaleString() || "0"}
              Table: {billToVoid.tableNumber || "—"}
              Waiter: {billToVoid.waiterName || "Walk-in"}
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowVoidDialog(false)}
                className="px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmVoid}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Void Bill
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BillsPage;
