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

interface ProductionBatch {
  id: string;
  business_location_id: string;
  store_location_id: string;
  staff_details: { created_by: { id: string; name: string } };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  related_id?: string;
  notes?: string;
  items: Array<{
    id: string;
    item_id: string;
    original_quantity: number;
    remaining_quantity: number;
    wasted_quantity: number;
    carry_forward_quantity: number;
    selling_price?: number;
    notes?: string;
  }>;
}

interface Item {
  id: string;
  name: string;
}

const ProductionBatchCard = ({ batch }: { batch: ProductionBatch }) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {batch.production_batch_name}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {new Date(batch.created_at).toLocaleDateString()}
          </p>
          <div className="flex flex-col gap-1">
            {batch.is_active ? (
              <span className="text-green-600 dark:text-green-400">Active</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Closed</span>
            )}
          </div>
          {batch.notes && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {batch.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end">
          {batch.is_active && (
              <Permission resource="production_batches" action="update">
            <Link
              href={`${routes.productionBatchForm}/${batch.id}`}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="View Details"
            >
              <ArrowRight className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
              </Permission>
          )}
            <Permission resource="reports" action="production_batches">
          <Link
            href={`${routes.productionBatchReport}/${batch.id}`}
            className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
            aria-label="View Details"
          >
            <BarChart className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </Link>
            </Permission>
        </div>
      </div>
    </div>
  );
};

const ProductionBatches: React.FC = () => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const { backoffice_business_location, backoffice_user_profile } =
    useAppState();

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch batches
      const batchesResponse = await api.get(
        endpoints.listProductionBatches(
          backoffice_user_profile.store_location_id
        )
      );
      setBatches(batchesResponse.data.data.data || []);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch data.");
      setLoading(false);
    }
  };

  const openAddForm = () => {
    router.push(`${routes.productionBatchForm}`);
  };

  const columns = [
    {
      key: "production_batch_name",
      label: "Batch Name",
      render: (batch: ProductionBatch) => (
        <div className="flex flex-col gap-1">
          {batch.production_batch_name || "-"}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (batch: ProductionBatch) => (
        <div className="flex flex-col gap-1">
          {new Date(batch.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (batch: ProductionBatch) => (
        <div className="flex flex-col gap-1">
          {batch.is_active ? (
            <span className="text-green-600 dark:text-green-400">Active</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Closed</span>
          )}
        </div>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (batch: ProductionBatch) => (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {batch.notes || "No notes"}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (batch: ProductionBatch) => (
        <div className="flex items-center gap-2 justify-end">
          {batch.is_active && (
           <Permission resource="production_batches" action="update">
            <Link
              href={`${routes.productionBatchForm}/${batch.id}`}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="View Details"
            >
              <ArrowRight className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
              </Permission>
          )}
            <Permission resource="reports" action="production_batches">
          <Link
            href={`${routes.productionBatchReport}/${batch.id}`}
            className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
            aria-label="View Details"
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
    <Permission resource="production_batches" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Production Batch"
          breadcrumbs={[
            {
              name: "Production",
              onClick: () => router.push(routes.production),
            },
            { name: "Batches" },
          ]}
          actions={[
            {
              title: "New Entry",
              onClick: openAddForm,
              icon: <Plus className="w-4 h-4" />,
              resource: "production_batches",
              action: "create",
            },
          ]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {batches.length > 0 ? (
            <ReusableTable
              data={batches}
              columns={columns}
              renderCard={(batch: ProductionBatch) => (
                <ProductionBatchCard key={batch.id} batch={batch} />
              )}
            />
          ) : (
            <PageEmptyState
              icon={Plus}
              description="No production batches found."
            />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default ProductionBatches;
