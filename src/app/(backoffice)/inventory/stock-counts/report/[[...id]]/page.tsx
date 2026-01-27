"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import { Cell, Pie, PieChart, Tooltip, Legend } from "recharts";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const COLORS = ["#0E7490", "#F97316", "#EF4444"]; // theft, damage, wastage

const StockCountVarianceReport = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const { backoffice_user_profile } = useAppState();
  const { id: stockCountId } = useParams();
  const router = useRouter();

  const store_location_id = backoffice_user_profile.store_location_id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          endpoints.getStockCountVarianceSummary(store_location_id,stockCountId)
        );
        setReport(response.data.data);
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message ||
            "Failed to load stock variance report."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [stockCountId, store_location_id]);

  if (loading) return <PageSkeleton />;

  const pieData = Object.entries(report.variance_by_reason).map(
    ([reason, data]) => ({
      name: reason.charAt(0).toUpperCase() + reason.slice(1),
      value: data.count,
    })
  );

  return (
    <Permission resource="reports" action="stock_counts" isPage={true}>
      <BreadcrumbWithActions
        label="Stock Count Variance Report"
        breadcrumbs={[
          {
            name: "Inventory",
            onClick: () => router.push(routes.inventory),
          },
          {
            name: "Stock Counts",
            onClick: () => router.push(routes.stockCounts),
          },
          { name: "Variance Report" },
        ]}
        actions={[]}
      />

      <div className="m-3">
        <section className="pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Stock Count Variance Summary
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold">
                {formatNumber(report.total_items)}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Total Items
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-red-600">
                {formatNumber(report.total_variances)}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Variances
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold">
                {report.variance_percentage}%
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Variance %
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-yellow-600">
                {formatNumber(report.total_variance_value)}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Value Lost
              </p>
            </div>
          </div>

          {/* Padded Pie Chart */}
          <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6 flex justify-center">
            <PieChart width={260} height={260}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(val) => formatNumber(val)} />
              <Legend />
            </PieChart>
          </div>
        </section>
      </div>
    </Permission>
  );
};

export default StockCountVarianceReport;
