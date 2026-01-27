"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import { AlertTriangle, Check, Info } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface BatchItem {
  item_id: string;
  item_name?: string; // Populated from getProductionBatchService
  original_quantity: number;
  remaining_quantity: number;
  wasted_quantity: number;
  carry_forward_quantity: number;
}

interface BatchPerformance {
  sold: {
    quantity: number;
    cost_value: number;
    revenue_value: number;
    margin_value: number;
    gross_margin_percent: number;
    sell_through_percent: number;
  };
  remaining: {
    quantity: number;
    cost_value: number;
  };
  carry_forward: {
    quantity: number;
    cost_value: number;
    carry_forward_cost_percent: number;
  };
  wasted: {
    quantity: number;
    cost_value: number;
    wastage_percent: number;
  };
  items_metrics: Array<{
    item_id: string;
    sold: number;
    remaining: number;
    wasted: number;
    carry_forward: number;
    revenue: number;
  }>;
}

interface ProductionBatch {
  production_batch_name: string;
  items: Array<{
    item_id: string;
    item_name: string;
    original_quantity: number;
    remaining_quantity: number;
    wasted_quantity: number;
    carry_forward_quantity: number;
  }>;
}

const Metric = ({ label, value, className = "" }) => (
  <div>
    <span className="text-xs text-neutral-600 dark:text-neutral-400 block text-center">
      {label}
    </span>
    <span
      className={`text-sm block text-center text-neutral-900 dark:text-neutral-100 ${className}`}
    >
      {formatNumber(value)}
    </span>
  </div>
);

const ProductionBatchReport = () => {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<BatchPerformance | null>({});
  const [batchItems, setBatchItems] = useState<ProductionBatch | null>(null);
  const [batchName, setBatchName] = useState<string>("");
  const { backoffice_user_profile } = useAppState();
  const { id: batchId } = useParams();

  const router = useRouter();
  const store_location_id = backoffice_user_profile.store_location_id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch performance metrics
        const performanceResponse = await api.get(
          endpoints.getBatchPerformance(store_location_id, batchId)
        );
        setPerformance(performanceResponse.data.data?.batch);

        // Fetch batch details for item names and batch name

        const batchResponse = await api.get(
          endpoints.getProductionBatch(store_location_id, batchId)
        );

        setBatchName(batchResponse?.data?.data.production_batch_name);

        setBatchItems(performanceResponse.data.data?.items || []);
      } catch (error: any) {
        console.log(error);
        toast.error(
          error?.response?.data?.message || "Failed to load batch report data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId, backoffice_user_profile]);

  const metrics = [
    {
      key: "gross_margin",
      title: "Gross Margin", // (sold_value ÷ available_for_sale_value) × 100
      description: "% of profit made.",
      value:
        performance?.metrics?.gross_margin_percent > 0
          ? Math.round(performance?.metrics?.gross_margin_percent || 0)
          : 0,
      good: performance?.metrics?.gross_margin_percent >= 70,
      action: "Consider stocking items that match demand better.",
    },
    {
      key: "demand_fit",
      title: "Sales Efficiency", // (sold_value ÷ available_for_sale_value) × 100
      description: "% of available stock sold.",
      value:
        performance?.metrics?.sales_efficiency_percent > 0
          ? Math.round(performance?.metrics?.sales_efficiency_percent || 0)
          : 0,
      good: performance?.metrics?.sales_efficiency_percent >= 70,
      action: "Consider stocking items that match demand better.",
    },
    {
      key: "Wastage",
      title: "Wastage", // (wasted_value ÷ total_input_value) × 100
      description: "% of stock lost or spoiled.",
      value:
        performance?.metrics?.wastage_percent > 0
          ? Math.round(performance?.metrics?.wastage_percent || 0)
          : 0,

      good: performance?.metrics?.wastage_percent <= 5, // threshold example
      action: "Track wastage sources and tighten controls.",
    },

    {
      key: "cash_flow",
      title: "Capital in Inventory", // (carry_forward_value ÷ total_input_value) × 100
      description: "% of capital in remaining items.",
      value:
        performance?.metrics?.capital_in_inventory_percent > 0
          ? Math.round(performance?.metrics?.capital_in_inventory_percent || 0)
          : 0,

      good: performance?.metrics?.capital_in_inventory_percent <= 15,
      action: "Move old stock faster or reduce over-purchasing.",
    },
  ];

  const calculateBatchPercentages = () => {
    const {
      produced,
      sold,
      wasted,
      carry_forward_out,
      carry_forward_in,
      remaining,
    } = performance;

    if (produced === 0) {
      return {
        percentSold: 0,
        percentWasted: 0,
        percentCarryForwardOut: 0,
        percentCarryForwardIn: 0,
        percentRemaining: 0,
      };
    }

    return {
      percentSold: Math.round((Math.abs(sold) / produced) * 100),
      percentWasted: Math.round((wasted / produced) * 100),
      percentCarryForwardOut: Math.round((carry_forward_out / produced) * 100),
      percentCarryForwardIn: Math.round((carry_forward_in / produced) * 100),
      percentRemaining: Math.round((remaining / produced) * 100),
    };
  };

  const columns = [
    {
      key: "item_name",
      label: "Item",
      render: (item: BatchItem) => (
        <div className="font-medium">{item.item_name}</div>
      ),
    },
    {
      key: "quantities",
      label: "Quantities",
      render: (item: BatchItem) => (
        <div className="grid grid-cols-3 gap-1 text-xs text-center">
          <Metric label="Produced" value={item.produced} />
          <Metric label="Sold" value={item.sold} className="text-green-500" />
          <Metric label="Rem" value={item.remaining || 0} />
          <Metric
            label="Wasted"
            value={item.wasted || 0}
            className="text-red-500"
          />
          <Metric label="C.Fwd" value={item.carry_forward_out || 0} />
          <Metric label="B.Fwd" value={item.carry_forward_in || 0} />
        </div>
      ),
    },
    {
      key: "financials",
      label: "Financials",
      render: (item: BatchItem) => (
        <div className="grid grid-cols-3 gap-1 text-xs text-center">
          <Metric
            label="Cost"
            value={Math.abs(Math.round(item.total_cost || 0))}
          />
          <Metric
            label="Revenue"
            value={Math.abs(Math.round(item.total_revenue || 0))}
            className="text-green-500"
          />
          <Metric
            label="Margin"
            value={
              item.gross_profit > 0 ? Math.round(item.gross_profit || 0) : 0
            }
            className={
              (item.gross_profit || 0) >= 0 ? "text-green-500" : "text-red-500"
            }
          />
        </div>
      ),
    },
    {
      key: "percentages",
      label: "Performance",
      render: (item: BatchItem) => (
        <div className="grid grid-cols-2 gap-1 text-xs text-center">
          <Metric
            label="Margin %"
            value={`${Math.round(item?.metrics?.gross_margin_percent || 0)}%`}
            className={
              item?.metrics?.gross_margin_percent >= 0
                ? "text-green-500"
                : "text-red-500"
            }
          />
          <Metric
            label="Sales Eff  %"
            value={`${Math.round(
              item?.metrics?.sales_efficiency_percent || 0
            )}%`}
            className="text-green-500"
          />
          <Metric
            label="Wastage  %"
            value={`${Math.round(item?.metrics?.wastage_percent || 0)}%`}
            className="text-red-500"
          />
          <Metric
            label="Capital Inv  %"
            value={`${Math.round(
              item?.metrics?.capital_in_inventory_percent || 0
            )}%`}
          />
        </div>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="reports" action={"production_batches"} isPage={true}>
      <BreadcrumbWithActions
        label={`${batchName} Report`}
        breadcrumbs={[
          { name: "Production", onClick: () => router.push(routes.production) },
          {
            name: "Batches",
            onClick: () => router.push(routes.productionBatches),
          },
          { name: batchName },
        ]}
        actions={[]}
      />
      <div className="m-3">
        <section className="pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Batch Performance
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700 mb-6 overflow-hidden">
            <div
              className="h-2 rounded-full bg-green-600 dark:bg-green-400 transition-all"
              style={{ width: `${calculateBatchPercentages().percentSold}%` }}
            />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
            {[
              {
                label: "Brought Forward",
                value: performance.carry_forward_in,
                percent: `${
                  calculateBatchPercentages().percentCarryForwardIn
                }%`,
                color: "blue",
              },

              {
                label: "Produced",
                value: performance.produced,
                percent: "100%",
                color: "green",
              },
              {
                label: "In Stock",
                value: performance.remaining,
                percent: `${calculateBatchPercentages().percentRemaining}%`,
                color: "yellow",
              },
              {
                label: "Carried Forward",
                value: performance.carry_forward_out,
                percent: `${
                  calculateBatchPercentages().percentCarryForwardOut
                }%`,
                color: "blue",
              },
              {
                label: "Wasted",
                value: performance.wasted,
                percent: `${calculateBatchPercentages().percentWasted}%`,
                color: "red",
              },
              {
                label: "Sold",
                value: Math.abs(performance.sold || 0),
                percent: `${calculateBatchPercentages().percentSold}%`,
                color: "green",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 flex flex-col relative"
              >
                <span
                  className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary dark:text-white`}
                >
                  {metric.percent}
                </span>
                <p className="text-2xl font-bold text-center mt-2">
                  {metric.value ?? 0}
                </p>
                <p className="text-sm font-medium text-center text-neutral-600 dark:text-neutral-300">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 my-6">
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(Math.abs(Math.round(performance.total_cost || 0)))}
              </p>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Total Cost
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(Math.abs(Math.round(performance.total_revenue || 0)))}
              </p>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Total Revenue
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p
                className={`text-xl font-bold ${
                  (performance.gross_profit || 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {performance.gross_profit > 0
                  ? formatNumber(Math.round(performance.gross_profit || 0))
                  : 0}
              </p>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Gross Margin
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {metrics.map((metric) => {
              const radius = 46;
              const stroke = 6;
              const normalizedRadius = radius - stroke / 2;
              const circumference = normalizedRadius * 2 * Math.PI;

              const progress = metric.value || 0;
              const strokeDashoffset =
                circumference - (progress / 100) * circumference;

              return (
                <div
                  key={metric.key}
                  className="py-4 px-1 rounded-lg bg-white dark:bg-neutral-800 shadow-sm flex flex-col items-center text-center gap-2"
                >
                  {/* Title */}
                  <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                    {metric.title}
                  </h3>

                  {/* Circular Progress */}
                  <div className="relative my-3">
                    <svg height={radius * 2} width={radius * 2}>
                      <circle
                        stroke="currentColor"
                        className="text-gray-200 dark:text-neutral-700"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                      />
                      <circle
                        stroke={
                          metric.performance === "good" ? "#16a34a" : "#dc2626"
                        }
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + " " + circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        transform={`rotate(-90 ${radius} ${radius})`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                      {Math.round(progress)}%
                    </div>
                  </div>

                  {/* Info / Footnote */}
                  <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Info className="w-3 h-3 shrink-0" />
                    <p>{metric.description}</p>
                  </div>

                  {/* Action (only for bad performance) */}
                  {metric.performance === "bad" && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {metric.action}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Items Table */}
        {batchItems?.length && (
          <div className="mb-6 md:p-3 rounded-lg shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800">
            <ReusableTable data={batchItems} columns={columns} />
          </div>
        )}
      </div>
    </Permission>
  );
};

export default ProductionBatchReport;
