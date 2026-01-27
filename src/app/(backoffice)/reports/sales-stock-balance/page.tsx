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
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { endpoints } from "@/constants/endpoints";
import PageEmptyState from "@/components/common/EmptyPageState";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SeriesPoint {
  date: string;
  sales: number;
  closing_balance: number;
}

interface SalesVsStockBalance {
  item_id: string;
  item_name: string;
  series: SeriesPoint[];
}

const SeriesCard = ({
  point,
}: {
  point: SeriesPoint;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {point.date}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Sales: {point.sales} • Closing Balance: {point.closing_balance}
          </p>
        </div>
      </div>
    </div>
  );
};

const SalesVsStockBalancePage: React.FC = () => {
  const [report, setReport] = useState<SalesVsStockBalance | null>(null);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { backoffice_user_profile } = useAppState();
  const router = useRouter();

  const fetchItems = async () => {
    try {
   const response = await api.get(endpoints.getReportItems);
      setItems(response.data.data);
    } catch (error: any) {
      console.log(error);
    }
  };

 

  const fetchSalesVsStockBalance = async (startDate: string, endDate: string) => {
    if (!selectedItemId) return;
    try {
      const response = await api.get(endpoints.getSalesVsStockBalance, {
        params: { item_id: selectedItemId, store_location_id: backoffice_user_profile.store_location_id, start_date: startDate, end_date: endDate },
      });
      setReport(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const chartData = report
    ? {
        labels: report.series.map((point) => point.date),
        datasets: [
          {
            label: "Sales",
            data: report.series.map((point) => point.sales),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.1,
          },
          {
            label: "Closing Balance",
            data: report.series.map((point) => point.closing_balance),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            tension: 0.1,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Sales vs Stock Balance" },
    },
  };

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (point: SeriesPoint) => <div>{point.date}</div>,
    },
    {
      key: "sales",
      label: "Sales",
      render: (point: SeriesPoint) => <div>{point.sales}</div>,
    },
    {
      key: "closing_balance",
      label: "Closing Balance",
      render: (point: SeriesPoint) => <div>{point.closing_balance}</div>,
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"inventory-reports"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Sales vs Stock Balance"
          breadcrumbs={[
            { name: "Reports", onClick: () => router.push(routes.reports) },
            { name: "Sales vs Stock Balance" },
          ]}
          actions={[]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col min-w-[180px] w-full sm:w-auto">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Item
                </label>
                <Select
                  options={items.map((item) => ({ value: item.id, label: item.item_name }))}
                  value={selectedItemId ? { value: selectedItemId, label: items.find((item) => item.id === selectedItemId)?.item_sname } : null}
                  onChange={(option) => setSelectedItemId(option?.value || null)}
                  className="my-react-select-container"
                  classNamePrefix="my-react-select"
                  placeholder="Select an item"
                />
              </div>
              
            </div>
            <DateRangePicker
              onChange={(startDate, endDate) => fetchSalesVsStockBalance(startDate, endDate)}
            />
          </div>

          {report && report.series.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Chart</h2>
                <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Data</h2>
                <ReusableTable
                  data={report.series}
                  columns={columns}
                  renderCard={(point: SeriesPoint) => <SeriesCard key={point.date} point={point} />}
                />
              </div>
            </div>
          ) : (
            <PageEmptyState icon={Plus} description="No sales or stock data found." />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default SalesVsStockBalancePage;
