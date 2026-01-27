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
  item_name?: string; // Populated from getPurchaseBatchService
  quantity: number;
  remaining_quantity: number;
  wasted_quantity: number;
  carry_forward_quantity: number;
  unit_cost?: number;
  unit_price?: number;
}

interface Document {
  doc_type: string; // e.g., "Invoice", "LPO"
  doc_number: string; // Manual document number
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
    cost: number;
    gross_profit: number;
    gross_margin_percent: number;
    sales_efficiency_percent: number;
    wastage_percent: number;
    capital_in_inventory_percent: number;
  }>;
  total_cost: number;
  total_revenue: number;
  gross_profit: number;
  purchased: number;
  carry_forward_in: number;
  carry_forward_out: number;
}

interface PurchaseBatch {
  purchase_batch_name: string;
  documents: Document[];
  items: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    remaining_quantity: number;
    wasted_quantity: number;
    carry_forward_quantity: number;
    unit_cost?: number;
    unit_price?: number;
  }>;
}

const Metric = ({ label, value, className = "" }) => (
  <div>
    <span className="text-xs text-neutral-600 dark:text-neutral-400 block text-center">{label}</span>
    <span className={`text-sm block text-center text-neutral-900 dark:text-neutral-100 ${className}`}>
      {formatNumber(value)}
    </span>
  </div>
);

const PurchaseBatchReport = () => {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<BatchPerformance | null>(null);
  const [batchItems, setBatchItems] = useState<PurchaseBatch | null>(null);
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
          endpoints.getPurchaseBatchPerformance(store_location_id, batchId)
        );
        setPerformance(performanceResponse.data.data?.batch);

        // Fetch batch details for item names, documents, and batch name
        const batchResponse = await api.get(
          endpoints.getPurchaseBatch(store_location_id, batchId)
        );

        setBatchName(batchResponse?.data?.data.purchase_batch_name);
        setBatchItems(performanceResponse.data.data?.items);
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message || "Failed to load batch report data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId, store_location_id]);

  const metrics = [
    {
      key: "gross_margin",
      title: "Gross Margin",
      description: "% of profit made.",
      value: performance?.metrics?.gross_margin_percent
        ? Math.round(performance.metrics.gross_margin_percent)
        : 0,
      good: performance?.metrics?.gross_margin_percent >= 70,
      action: "Consider stocking items that match demand better.",
    },
    {
      key: "demand_fit",
      title: "Sales Efficiency",
      description: "% of available stock metrics.",
      value: performance?.metrics?.sales_efficiency_percent
        ? Math.round(performance.metrics.sales_efficiency_percent)
        : 0,
      good: performance?.metrics?.sales_efficiency_percent >= 70,
      action: "Consider stocking items that match demand better.",
    },
    {
      key: "wastage",
      title: "Wastage",
      description: "% of stock lost or spoiled.",
      value: performance?.metrics?.wastage_percent
        ? Math.round(performance.metrics.wastage_percent)
        : 0,
 
    },
    {
      key: "cash_flow",
      title: "Capital in Inventory",
      description: "% of capital in remaining items.",
      value: performance?.metrics?.capital_in_inventory_percent
        ? Math.round(performance.metrics.capital_in_inventory_percent)
        : 0,
   
    },
  ];

  const calculateBatchPercentages = () => {
    const { purchased, sold, wasted, carry_forward_out, carry_forward_in, remaining } =
      performance || { purchased: 0, sold: 0, wasted: 0, carry_forward_out: 0, carry_forward_in: 0, remaining: 0 };

    if (purchased === 0) {
      return {
        percentSold: 0,
        percentWasted: 0,
        percentCarryForwardOut: 0,
        percentCarryForwardIn: 0,
        percentRemaining: 0,
      };
    }

    return {
      percentSold: Math.round(sold.quantity > 0 ?(Math.abs(sold.quantity ) / purchased) * 100 :0),
      percentWasted: Math.round((wasted.quantity / purchased) * 100),
      percentCarryForwardOut: Math.round((carry_forward_out / purchased) * 100),
      percentCarryForwardIn: Math.round((carry_forward_in / purchased) * 100),
      percentRemaining: Math.round((remaining.quantity / purchased) * 100),
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
        <div className="grid grid-cols-4 gap-1 text-xs text-center">
          <Metric label="Purchased" value={item.purchased} />
          <Metric label="Sold" value={item.sold} className="text-green-500" />
          <Metric label="Rem" value={item.remaining || 0} />
          <Metric label="Wasted" value={item.wasted || 0} className="text-red-500" />
          <Metric label="C.Fwd" value={item.carry_forward || 0} />
          <Metric label="B.Fwd" value={item.carry_forward_in || 0} />
        </div>
      ),
    },
    {
      key: "financials",
      label: "Financials",
      render: (item: BatchItem) => (
        <div className="grid grid-cols-3 gap-1 text-xs text-center">
          <Metric label="Cost" value={Math.abs(Math.round(item.total_cost || 0))} />
          <Metric label="Revenue" value={Math.abs(Math.round(item.total_revenue || 0))} className="text-green-500" />
          <Metric
            label="Margin"
            value={item.gross_profit > 0 ? Math.round(item.gross_profit || 0) : 0}
            className={(item.gross_profit || 0) >= 0 ? "text-green-500" : "text-red-500"}
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
            className={item?.metrics?.gross_margin_percent >= 0 ? "text-green-500" : "text-red-500"}
          />
          <Metric
            label="Sales Eff %"
            value={`${Math.round(item?.metrics?.sales_efficiency_percent || 0)}%`}
            className="text-green-500"
          />
          <Metric
            label="Wastage %"
            value={`${Math.round(item?.metrics?.wastage_percent || 0)}%`}
            className="text-red-500"
          />
          <Metric
            label="Capital Inv %"
            value={`${Math.round(item?.metrics?.capital_in_inventory_percent || 0)}%`}
          />
        </div>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="reports" action="purchase_batches" isPage={true}>
      <BreadcrumbWithActions
        label={`${batchName} Report`}
        breadcrumbs={[
          { name: "Purchases", onClick: () => router.push(routes.purchaseBatches) },
          { name: "Batches", onClick: () => router.push(routes.purchaseBatches) },
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
                value: performance?.carry_forward_in || 0,
                percent: `${calculateBatchPercentages().percentCarryForwardIn || 0}%`,
                color: "blue",
              },
              {
                label: "Purchased",
                value: performance?.purchased || 0,
                percent: "100%",
                color: "green",
              },
              {
                label: "In Stock",
                value: performance?.remaining|| 0,
                percent: `${calculateBatchPercentages().percentRemaining || 0}%`,
                color: "yellow",
              },
              {
                label: "Carried Forward",
                value: performance?.carry_forward_out || 0,
                percent: `${calculateBatchPercentages().percentCarryForwardOut || 0}%`,
                color: "blue",
              },
              {
                label: "Wasted",
                value: performance?.wasted || 0,
                percent: `${calculateBatchPercentages().percentWasted || 0}%`,
                color: "red",
              },
              {
                label: "Sold",
                value: Math.abs(performance?.sold || 0),
                percent: `${calculateBatchPercentages().percentSold || 0}%`,
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
                {formatNumber(Math.abs(Math.round(performance?.total_cost || 0)))}
              </p>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Total Cost
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(Math.abs(Math.round(performance?.total_revenue || 0)))}
              </p>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Total Revenue
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p
                className={`text-xl font-bold ${
                  (performance?.gross_profit || 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {performance?.gross_profit > 0
                  ? formatNumber(Math.round(performance.gross_profit))
                  : 0}
              </p>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Gross Margin
              </p>
            </div>
          </div>

          {/* Metrics */}
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
                        stroke={metric.good ? "#16a34a" : "#dc2626"}
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

                  
                </div>
              );
            })}
          </div>
        </section>

        {/* Items Table */}
        {batchItems?.length > 0 && (
          <div className="mb-6 md:p-3 rounded-lg shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800">
            <ReusableTable data={batchItems} columns={columns} />
          </div>
        )}
      </div>
    </Permission>
  );
};

export default PurchaseBatchReport;