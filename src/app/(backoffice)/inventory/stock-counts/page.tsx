"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { ArrowRight, BarChart, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StockCount {
  id: string;
  stock_count_name: string;
  count_type: "general" | "production_batch" | "purchase_batch";
  is_active: boolean;
  created_at: string;
  items_count: number;
  business_location_id: string;
  store_location_id: string;
  staff_details: { id: string; user_name: string };
  notes?: string;
}

const StockCountCard: React.FC<{ stockCount: StockCount }> = ({
  stockCount,
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {stockCount.stock_count_name}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {new Date(stockCount.created_at).toLocaleDateString()}
          </p>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {stockCount.count_type.replace("_", " ").toUpperCase()}
            </span>
            {stockCount.is_active ? (
              <span className="text-green-600 dark:text-green-400">Active</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Closed</span>
            )}
          </div>
          {stockCount.notes && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {stockCount.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end">
          {stockCount.is_active ? (
              <Permission resource="stock_counts" action="update">
            <Link
              href={`${routes.stockCountForm}/${stockCount.id}`}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="View Details"
            >
              <ArrowRight className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
              </Permission>
          ) : (
                <Permission resource="report" action="stock_counts">
            <Link
              href={`${routes.stockCountReport}/${stockCount.id}`}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="View Report"
            >
              <BarChart className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </Link>
                </Permission>
          )}

         
            
        </div>
      </div>
    </div>
  );
};

const StockCounts: React.FC = () => {
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { backoffice_business_location, backoffice_user_profile } =
    useAppState();
  const router = useRouter();
  const store_location_id = backoffice_user_profile.store_location_id;
  useEffect(() => {
    fetchData();
  }, [store_location_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        endpoints.listStockCounts(store_location_id)
      );
      setStockCounts(response.data.data || []);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.error || "Failed to fetch stock counts."
      );
      setLoading(false);
    }
  };

  const openAddForm = () => {
    router.push(routes.stockCountForm);
  };

  const columns = [
    {
      key: "stock_count_name",
      label: "Stock Count",
      render: (stockCount: StockCount) => (
        <div className="flex flex-col gap-1">
          {stockCount.stock_count_name || "-"}
        </div>
      ),
    },
    {
      key: "count_type",
      label: "Type",
      render: (stockCount: StockCount) => (
        <div className="flex flex-col gap-1">
          {stockCount.count_type.replace("_", " ").toUpperCase()}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (stockCount: StockCount) => (
        <div className="flex flex-col gap-1">
          {new Date(stockCount.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (stockCount: StockCount) => (
        <div className="flex flex-col gap-1">
          {stockCount.is_active ? (
            <span className="text-green-600 dark:text-green-400">Active</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Closed</span>
          )}
        </div>
      ),
    },
    {
      key: "items_count",
      label: "Items",
      render: (stockCount: StockCount) => (
        <div className="flex flex-col gap-1">{stockCount.items_count}</div>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (stockCount: StockCount) => (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {stockCount.notes || "No notes"}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (stockCount: StockCount) => (
        <div className="flex items-center gap-2 justify-end">
          {stockCount.is_active && (
            <Permission resource="stock_counts" action="update">
              <Link
                href={`${routes.stockCountForm}/${stockCount.id}`}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                aria-label="Enter Counts"
              >
                <ArrowRight className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
            </Permission>
          )}
          <Permission resource="report" action="stock_counts">
            <Link
              href={`${routes.stockCountReport}/${stockCount.id}`}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="View Report"
            >
              <BarChart className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </Link>
          </Permission>
        </div>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="stock_counts" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Stock Count"
          breadcrumbs={[
            { name: "Inventory", onClick: () => router.push(routes.inventory) },
            { name: "Stock Counts" },
          ]}
          actions={[
            {
              title: "New Stock Count",
              onClick: openAddForm,
              icon: <Plus className="w-4 h-4" />,
              resource: "stock_counts",
              action: "create",
            },
          ]}
        />
        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {stockCounts.length > 0 ? (
            <ReusableTable
              data={stockCounts}
              columns={columns}
              renderCard={(stockCount: StockCount) => (
                <StockCountCard key={stockCount.id} stockCount={stockCount} />
              )}
            />
          ) : (
            <PageEmptyState icon={Plus} description="No stock counts found." />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default StockCounts;
