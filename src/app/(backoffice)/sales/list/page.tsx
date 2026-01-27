"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, Plus, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import ReusableTable from "@/components/common/ReusableTable";
import Select from "react-select";
import { useSalesChannels } from "@/hooks/useSettings";
import { useDailySalesSummary } from "@/hooks/useSales"
import clsx from "clsx";

// Recharts imports
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/common/PageHeader";

type SalesDay = {
  date: string;
  day: string;
  transactions: number;
  gross_sales: number;
  tax: number;
  complimentary: number;
  net_sales: number;
};

type SummaryData = {
  days: number;
  from: string;
  to: string;
};

type SalesResponse = {
  success: boolean;
  period: SummaryData;
  summary: {
    total_transactions: number;
    gross_sales: number;
    total_tax: number;
    complimentary: number;
    net_sales: number;
  };
  daily_summary: SalesDay[];
};

type ChannelOption = {
  value: string;
  label: string;
};

const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "transactions", label: "Transactions" },
  { key: "gross_sales", label: "Gross Sales" },
  { key: "tax", label: "Tax" },
  { key: "complimentary", label: "Complimentary" },
  { key: "net_sales", label: "Net Sales" },
];

const DailySalesPage = () => {
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

  // Auto-select first channel on load
  useEffect(() => {
    if (!selectedChannel && channelOptions.length > 0) {
      setSelectedChannel(channelOptions[0]);
    }
  }, [channelOptions, selectedChannel]);

  const [daysBack, setDaysBack] = useState<number>(7);
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const params = useMemo(() => {
    if (!selectedChannel?.value) return null;

    const base =
      customFrom && customTo
        ? { from: customFrom, to: customTo }
        : { days: daysBack };

    return base;
  }, [daysBack, customFrom, customTo, selectedChannel]);

  const {
    data: response,
    isLoading: isLoadingData,
    error,
  } = useDailySalesSummary(selectedChannel?.value || "", params || {});

  const data = response?.data as SalesResponse | undefined;

  // Store initial 7-day data for fixed chart
  const [fixedChartData, setFixedChartData] = useState<SalesDay[]>([]);

  useEffect(() => {
    if (data?.daily_summary && daysBack === 7 && !customFrom && !customTo) {
      setFixedChartData(data.daily_summary);
    }
  }, [data, daysBack, customFrom, customTo]);

  const chartData = useMemo(() => {
    if (!fixedChartData.length) return [];

    const last7 = fixedChartData.slice(0, 7).reverse();

    return last7.map((day) => ({
      name: format(parseISO(day.date), "EEE"),
      sales: day.gross_sales,
      net: day.net_sales,
    }));
  }, [fixedChartData]);

  const tableData = useMemo(() => {
    return (data?.daily_summary || []).map((day, index) => ({
      id: day.date,
      index,
      ...day,
    }));
  }, [data]);

  const handleQuickDays = (days: number) => {
    setCustomFrom("");
    setCustomTo("");
    setDaysBack(days);
  };

  const handleCustomRange = () => {
    if (customFrom && customTo) {
      // Validate if needed
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title="Daily Sales"
        buttons={[
          {
            label: "New Sale",
            icon: Plus,
            onClick: () => router.push("/sales/new"),
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

      {/* Fixed 7-Day Area Chart */}
      <div className="mb-12 px-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mt-4">
          Last 7 Days Trend
        </h3>

        <div className="h-80 w-full">
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#d1d5db"
                strokeWidth={0.8}
                strokeDasharray="3 3"
                strokeOpacity={0.35}
              />

              <XAxis dataKey="name" stroke="#6b7280" />

              <Tooltip
                formatter={(value: number) => `KES ${value.toLocaleString()}`}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Legend verticalAlign="top" height={36} />

              <Area
                type="monotone"
                dataKey="sales"
                name="Gross Sales"
                stroke="#139F9E"
                fill="#139F9E"
                fillOpacity={0.3}
              />

              <Area
                type="monotone"
                dataKey="net"
                name="Net Sales"
                stroke="#D9A066"
                fill="#D9A066"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + Action Header */}
      <div className="mb-12 px-4">
        <div className="flex justify-between flex-wrap items-center gap-6">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mt-4">
            Daily Sales Entries
          </h3>
          <div className="flex flex-wrap items-end gap-6">
            {/* Channel Filter */}
            <div className="min-w-[250px]">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                Sales Channel
              </label>
              <Select
                value={selectedChannel}
                onChange={(option) => setSelectedChannel(option)}
                options={channelOptions}
                placeholder="Select a channel"
                className="my-react-select-container text-sm"
                classNamePrefix="my-react-select"
                isSearchable={true}
              />
            </div>

            {/* Custom Range */}
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm"
                />
              </div>
              <button
                onClick={handleCustomRange}
                className="px-4 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 px-4">
        <div className="bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl p-6">
          <h3 className="text-neutral-700 dark:text-neutral-200 mb-2">
            Total Gross Sales
          </h3>
          <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            KES {data?.summary.gross_sales.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl p-6">
          <h3 className="text-neutral-700 dark:text-neutral-200 mb-2">
            Total Net Sales
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            KES {data?.summary.net_sales.toLocaleString() ?? "0"}
          </p>
        </div>
      </div>

      {/* Daily Sales Table */}
      <ReusableTable
        data={tableData}
        columns={COLUMNS}
        loading={isLoadingData}
        scopedColumns={{
          date: (day) => (
            <td>
              {day.day} {format(parseISO(day.date), "MMM dd, yyyy")}
            </td>
          ),
          transactions: (day) => <td>{day.transactions}</td>,
          gross_sales: (day) => (
            <td>{day.gross_sales.toLocaleString()}</td>
          ),
          tax: (day) => <td>{day.tax.toLocaleString()}</td>,
          complimentary: (day) => (
            <td>{day.complimentary.toLocaleString()}</td>
          ),
          net_sales: (day) => (
            <td>
              {day.net_sales.toLocaleString()}
            </td>
          ),
          action: (day) => (
            <td className="text-center">
              <button
                onClick={() => router.push(`/sales/${day.date}/details`)}
                className="text-primary hover:text-primary/80 flex items-center justify-center gap-1 mx-auto"
              >
                View
                <ArrowRight size={14} />
              </button>
            </td>
          ),
        }}
        emptyMessage="No sales data for the selected period and channel."
      />
    </div>
  );
};

export default DailySalesPage;