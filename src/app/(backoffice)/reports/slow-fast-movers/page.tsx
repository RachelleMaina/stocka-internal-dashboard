"use client";

import { useEffect, useState } from "react";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import DateRangePicker from "@/components/common/DateRangePicker";
import { routes } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { endpoints } from "@/constants/endpoints";
import PageEmptyState from "@/components/common/EmptyPageState";

interface Mover {
  item: string;
  sales_qty: number;
  sales_value: number;
}

interface SlowFastMovers {
  period: string;
  business_location: string;
  fast_movers: Mover[];
  slow_movers: Mover[];
}

const MoverCard = ({
  mover,
}: {
  mover: Mover;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {mover.item}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Sales Qty: {mover.sales_qty} • Sales Value: KES {mover.sales_value}
          </p>
        </div>
      </div>
    </div>
  );
};

const SlowFastMoversPage: React.FC = () => {
  const [report, setReport] = useState<SlowFastMovers | null>(null);
  const [loading, setLoading] = useState(false);
  const { backoffice_business_location } = useAppState();
  const router = useRouter();

  const fetchSlowFastMovers = async (startDate: string, endDate: string) => {
    try {
      const response = await api.get(endpoints.getSlowFastMovers, {
        params: { start_date: startDate, end_date: endDate },
      });
      setReport(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "item",
      label: "Item",
      render: (mover: Mover) => <div>{mover.item}</div>,
    },
    {
      key: "sales_qty",
      label: "Sales Quantity",
      render: (mover: Mover) => <div>{mover.sales_qty}</div>,
    },
    {
      key: "sales_value",
      label: "Sales Value (KES)",
      render: (mover: Mover) => <div>{mover.sales_value}</div>,
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"inventory-reports"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Slow & Fast Movers"
          breadcrumbs={[
            { name: "Reports", onClick: () => router.push(routes.reports) },
            { name: "Slow & Fast Movers" },
          ]}
          actions={[]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="mb-4">
            <DateRangePicker
              onChange={(startDate, endDate) => fetchSlowFastMovers(startDate, endDate)}
            />
          </div>

          {report && (report.fast_movers.length > 0 || report.slow_movers.length > 0) ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Fast Movers</h2>
                <ReusableTable
                  data={report.fast_movers}
                  columns={columns}
                  renderCard={(mover: Mover) => <MoverCard key={mover.item} mover={mover} />}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Slow Movers</h2>
                <ReusableTable
                  data={report.slow_movers}
                  columns={columns}
                  renderCard={(mover: Mover) => <MoverCard key={mover.item} mover={mover} />}
                />
              </div>
            </div>
          ) : (
            <PageEmptyState icon={Plus} description="No movers data found." />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default SlowFastMoversPage;
