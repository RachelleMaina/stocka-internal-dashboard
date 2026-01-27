"use client";

import { useEffect, useState } from "react";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import Select from "react-select";
import DateRangePicker from "@/components/common/DateRangePicker";
import { routes } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { endpoints } from "@/constants/endpoints";
import PageEmptyState from "@/components/common/EmptyPageState";

interface Wastage {
  item: string;
  qty: number;
  value: number;
  reason: string;
}

interface WastageShrinkage {
  period: string;
  store_location: string;
  wastage: Wastage[];
}

const WastageCard = ({
  wastage,
}: {
  wastage: Wastage;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {wastage.item}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Quantity: {wastage.qty} • Value: KES {wastage.value} • Reason: {wastage.reason}
          </p>
        </div>
      </div>
    </div>
  );
};

const WastageShrinkagePage: React.FC = () => {
  const [report, setReport] = useState<WastageShrinkage | null>(null);
  const [loading, setLoading] = useState(false);
  const { backoffice_user_profile } = useAppState();
  const router = useRouter();

 
  const fetchWastageShrinkage = async (startDate: string, endDate: string) => {
  
    try {
      const response = await api.get(endpoints.getWastageShrinkage, {
        params: {store_location_id: backoffice_user_profile.store_location_id, start_date: startDate, end_date: endDate },
      });
      setReport(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    } finally {
      setLoading(false)
    }
  };

  

  const columns = [
    {
      key: "item",
      label: "Item",
      render: (wastage: Wastage) => <div>{wastage.item}</div>,
    },
    {
      key: "qty",
      label: "Quantity",
      render: (wastage: Wastage) => <div>{wastage.qty}</div>,
    },
    {
      key: "value",
      label: "Value (KES)",
      render: (wastage: Wastage) => <div>{wastage.value}</div>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (wastage: Wastage) => <div>{wastage.reason}</div>,
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"inventory-reports"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Wastage & Shrinkage"
          breadcrumbs={[
            { name: "Reports", onClick: () => router.push(routes.reports) },
            { name: "Wastage & Shrinkage" },
          ]}
          actions={[]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="mb-4 flex flex-col gap-4">
           
            <DateRangePicker
              onChange={(startDate, endDate) => fetchWastageShrinkage(startDate, endDate)}
            />
          </div>

          {report && report.wastage.length > 0 ? (
            <ReusableTable
              data={report.wastage}
              columns={columns}
              renderCard={(wastage: Wastage) => <WastageCard key={wastage.item} wastage={wastage} />}
            />
          ) : (
            <PageEmptyState icon={Plus} description="No wastage or shrinkage data found." />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default WastageShrinkagePage;
