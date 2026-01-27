"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { Plus, ListChecks, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import Select from "react-select";
import { useSalesChannels } from "@/hooks/useSettings";
import { useSalesTransactions } from "@/hooks/useSales";
import CreateSaleForm from "@/components/common/CreateSaleForm";
import clsx from "clsx";
import toast from "react-hot-toast";



type Transaction = {
  id: string;
  date: string;
  customer_name?: string;
  total_amount: number;
  payment_method: string;
  status: "completed" | "pending" | "cancelled";
  channel_name?: string;
};

type ChannelOption = { value: string; label: string };

const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "total", label: "Total Amount", align: "right" as const },
  { key: "payment_method", label: "Payment Method" },
  { key: "status", label: "Status" },
  { key: "action", label: "" },
];

const SalesTransactionsPage = () => {
  const router = useRouter();

  const { data: channelsResponse } = useSalesChannels();
  const channelOptions: ChannelOption[] = useMemo(
    () =>
      channelsResponse?.sales_channels?.map((ch: any) => ({
        value: ch.id,
        label: ch.channel_name,
      })) || [],
    [channelsResponse]
  );

  const [selectedChannel, setSelectedChannel] = useState<ChannelOption | null>(null);

  useEffect(() => {
    if (!selectedChannel && channelOptions.length > 0) {
      setSelectedChannel(channelOptions[0]);
    }
  }, [channelOptions, selectedChannel]);

  // Default date range: today only
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const params = useMemo(() => {
    if (!selectedChannel?.value) return null;

    return {
      from: dateFrom,
      to: dateTo,
    };
  }, [dateFrom, dateTo, selectedChannel]);

  const { data: transactionsData, isLoading } = useSalesTransactions(
    selectedChannel?.value || "",
    params || {}
  );

  const tableData = useMemo(() => {
    return (transactionsData?.sales || []).map((t: Transaction) => ({
      id: t.id,
      date: format(parseISO(t.sale_date), "MMM dd, yyyy hh:mm a"),
      customer: t.customer_name || "Walk-in",
      total: t.total_amount,
      payment_method: t.payment_method,
      status: t.status,
    }));
  }, [transactionsData]);

  const handleDateChange = (field: "from" | "to", value: string) => {
    if (field === "from") setDateFrom(value);
    else setDateTo(value);
  };

  const handleNewSale = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaleCreated = () => {
    setIsModalOpen(false);
    toast.success("Sale created successfully!");
    // Optional: refetch transactions
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6 relative">
      <PageHeader
        title="Sales Transactions"
        buttons={[
          {
            label: "Add Sale",
            icon: Plus,
            onClick: handleNewSale,
            variant: "primary",
          },
          {
            label: "Approval Logs",
            icon: ListChecks,
            onClick: () => router.push("/sales/approvals"),
            variant: "secondary",
          },
        ]}
      />

      {/* Filters – now only date range + channel */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-6">
          {/* Channel Filter */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Sales Channel
            </label>
            <Select
              value={selectedChannel}
              onChange={(option) => setSelectedChannel(option)}
              options={channelOptions}
              placeholder="Select a channel"
              className="text-sm"
              classNamePrefix="react-select"
              isSearchable
            />
          </div>

          {/* Date Range */}
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateChange("from", e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateChange("to", e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards (filtered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-neutral-700 mb-2">Total Gross Sales</h3>
          <p className="text-3xl font-bold text-neutral-900">
            KES {transactionsData?.summary?.gross_sales?.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-neutral-700 mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-green-600">
            {transactionsData?.summary?.total_transactions ?? "0"}
          </p>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <ReusableTable
        data={tableData}
        columns={COLUMNS}
        loading={isLoading}
        scopedColumns={{
        
          customer: (row) => <td>{row.customer || "Walk-in"}</td>,
          total: (row) => (
            <td className="text-right font-medium">
              KES {row.total.toLocaleString()}
            </td>
          ),
          payment_method: (row) => <td>{row.payment_method}</td>,
          status: (row) => (
            <td>
              <span
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  row.status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
                  row.status === "pending" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
                  row.status === "cancelled" && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                )}
              >
                {row.status}
              </span>
            </td>
          ),
          action: (row) => (
            <td className="text-center">
              <button
                onClick={() => router.push(`/sales/${row.id}`)}
                className="text-primary hover:text-primary/80 flex items-center justify-center gap-1 mx-auto"
              >
                View
                <ArrowRight size={14} />
              </button>
            </td>
          ),
        }}
        emptyMessage="No sales transactions found for the selected period and channel."
      />

      {/* Custom Modal for Create Sale */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Create New Sale
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X size={24} className="text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <CreateSaleForm
                  onSubmit={handleSaleCreated}
                  initialDate={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesTransactionsPage;