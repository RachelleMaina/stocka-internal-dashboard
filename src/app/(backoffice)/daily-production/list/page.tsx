"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, Plus, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import ReusableTable from "@/components/common/ReusableTable";
import Select from "react-select";
import { useSalesChannels } from "@/hooks/useSettings";
import { useDailyProductionSummary } from "@/hooks/useProduction";
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

type ProductionDay = {
  date: string;
  day: string;
  gross_sales: number;
  estimated_profit: number;
  percent_vs_yesterday: string;
  production_status: "not_started" | "pending_approval" | "approved" | "closed";
  production_record_id: string | null;
};

type SummaryData = {
  days: number;
  from: string;
  to: string;
};

type ProductionResponse = {
  success: boolean;
  period: SummaryData;
  summary: {
    gross_sales: number;
    estimated_profit: number;
  };
  daily_summary: ProductionDay[];
};

type ChannelOption = {
  value: string;
  label: string;
};

const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "gross_sales", label: "Gross Sales" },
  { key: "estimated_profit", label: "Estimated Profit" },
  { key: "percent_vs_yesterday", label: "% vs Yesterday" },
  { key: "status", label: "Status" },
  { key: "action", label: "" },
];

const DailyProductionPage = () => {
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

  const [selectedChannel, setSelectedChannel] = useState<ChannelOption | null>(
    null
  );

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
  } = useDailyProductionSummary(selectedChannel?.value || "", params || {});

  const data = response as ProductionResponse | undefined;

  // Store the initial 7-day data separately for the chart (unaffected by filters)
  const [fixedChartData, setFixedChartData] = useState<ProductionDay[]>([]);

  useEffect(() => {
    if (data?.daily_summary && daysBack === 7 && !customFrom && !customTo) {
      // Save the first load of 7 days for chart
      setFixedChartData(data.daily_summary);
    }
  }, [data, daysBack, customFrom, customTo]);

  // Prepare chart data from fixed 7-day snapshot
  const chartData = useMemo(() => {
    if (!fixedChartData.length) return [];

    // Reverse for chronological order (oldest → newest)
    const last7 = fixedChartData.slice(0, 7).reverse();

    return last7.map((day) => ({
      name: format(parseISO(day.date), "EEE"),
      sales: day.gross_sales,
      profit: day.estimated_profit,
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Approved
          </span>
        );
      case "pending_approval":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
            Pending Approval
          </span>
        );
      case "closed":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Closed
          </span>
        );
      default: // not_started or unknown
        return <span className="">--</span>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Daily Production"
        buttons={[
          {
            label: "New Production Entry",
            icon: Plus,
            onClick: () => router.push("/production/new"),
            variant: "primary",
          },
          {
            label: "Approval Logs",
            icon: ListChecks,
            onClick: () => router.push("/production/approvals"),
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

              {/* Area for Sales */}
              <Area
                type="monotone"
                dataKey="sales"
                name="Gross Sales"
                stroke="#139F9E"
                fill="#139F9E"
                fillOpacity={0.3}
              />

              {/* Area for Profit */}
              <Area
                type="monotone"
                dataKey="profit"
                name="Estimated Profit"
                stroke="#D9A066"
                fill="#D9A066"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="px-4 mb-12">
        {/* Filters + Action Header */}
        <div className="mb-12">
          <div className="flex justify-between flex-wrap items-center gap-6">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mt-4">
              Production Entries
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white  border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl p-6">
            <h3 className="text-neutral-700 dark:text-neutral-200 mb-2">
              Total Gross Sales
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              KES {data?.summary.gross_sales.toLocaleString() ?? "0"}
            </p>
          </div>

          <div className="bg-white  border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl p-6">
            <h3 className="text-neutral-700 dark:text-neutral-200 mb-2">
              Estimated Profit
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              KES {data?.summary.estimated_profit.toLocaleString() ?? "0"}
            </p>
          </div>
        </div>

        {/* Daily Production Table */}
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

            gross_sales: (day) => <td>{day.gross_sales.toLocaleString()}</td>,
            estimated_profit: (day) => (
              <td>{day.estimated_profit.toLocaleString()}</td>
            ),
            percent_vs_yesterday: (day) => (
              <td>
                <span
                  className={clsx(
                    "font-medium",
                    day.percent_vs_yesterday.startsWith("-")
                      ? "text-red-600"
                      : "text-green-600"
                  )}
                >
                  {day.percent_vs_yesterday}
                </span>
              </td>
            ),
            status: (day) => (
              <td>{renderStatusBadge(day.production_status)}</td>
            ),
            action: (day) => (
              <td>
                {day.production_record_id && (
                  <button
                    onClick={() =>
                      router.push(`/production/${day.production_record_id}`)
                    }
                    className="text-primary hover:text-primary/80 flex items-center justify-center gap-1 mx-auto"
                  >
                    View
                    <ArrowRight size={14} />
                  </button>
                )}
              </td>
            ),
          }}
          emptyMessage="No production data for the selected period and channel."
        />
      </div>
    </div>
  );
};

export default DailyProductionPage;
