
"use client";

import { useEffect, useState } from "react";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";

import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import Select from "react-select";

import { routes } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { endpoints } from "@/constants/endpoints";
import PageEmptyState from "@/components/common/EmptyPageState";

interface Ingredient {
  item: string;
  qty: number;
}

interface ConsumptionProduction {
  production_batch_id: string;
  product: string;
  ingredients_used: Ingredient[];
  finished_goods: { item: string; qty: number };
}

const IngredientCard = ({
  ingredient,
}: {
  ingredient: Ingredient;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {ingredient.item}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Quantity: {ingredient.qty}
          </p>
        </div>
      </div>
    </div>
  );
};

const ConsumptionProductionPage: React.FC = () => {
  const [report, setReport] = useState<ConsumptionProduction | null>(null);
  const [productionBatches, setProductionBatches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { backoffice_business_location,backoffice_user_profile } = useAppState();
  const router = useRouter();

  const fetchProductionBatches = async () => {
    try {
         const batchesResponse = await api.get(endpoints.productionBatches(backoffice_user_profile.store_location_id));
           setProductionBatches(batchesResponse.data.data.data || []);
     
    } catch (error: any) {
      console.log(error);
    }
  };

  const fetchConsumptionProduction = async () => {
    if (!selectedBatchId) return;
    try {
      const response = await api.get(endpoints.getConsumptionProduction(selectedBatchId));
      setReport(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchConsumptionProduction();
    }
  }, [selectedBatchId]);

  const columns = [
    {
      key: "item",
      label: "Item",
      render: (ingredient: Ingredient) => <div>{ingredient.item}</div>,
    },
    {
      key: "qty",
      label: "Quantity",
      render: (ingredient: Ingredient) => <div>{ingredient.qty}</div>,
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"inventory-reports"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Consumption vs Production"
          breadcrumbs={[
            { name: "Reports", onClick: () => router.push(routes.reports) },
            { name: "Consumption vs Production" },
          ]}
          actions={[]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="mb-4">
            <div className="flex flex-col min-w-[180px] w-full sm:w-auto">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Production Batch
              </label>
              <Select
                options={productionBatches.map((batch) => ({ value: batch.id, label: batch.production_batch_name }))}
                value={selectedBatchId ? { value: selectedBatchId, label: productionBatches.find((batch) => batch.id === selectedBatchId)?.production_batch_name } : null}
                onChange={(option) => setSelectedBatchId(option?.value || null)}
                className="my-react-select-container"
                classNamePrefix="my-react-select"
                placeholder="Select a production batch"
              />
            </div>
          </div>

          {report && report.ingredients_used.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Ingredients Used</h2>
                <ReusableTable
                  data={report.ingredients_used}
                  columns={columns}
                  renderCard={(ingredient: Ingredient) => <IngredientCard key={ingredient.item} ingredient={ingredient} />}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Finished Goods</h2>
                <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4">
                  <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100">{report.finished_goods.item}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Quantity: {report.finished_goods.qty}</p>
                </div>
              </div>
            </div>
          ) : (
            <PageEmptyState icon={Plus} description="No production data found." />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default ConsumptionProductionPage;
