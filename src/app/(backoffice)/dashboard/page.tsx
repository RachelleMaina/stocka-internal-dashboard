"use client";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import { Permission } from "@/components/common/Permission";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface KPI {
  sales_revenue_today: number;
  gross_profit_today: number;
  number_of_sales_today: number;
  average_spend_per_sale: number;
  sales_revenue_yesterday: number;
  gross_profit_yesterday: number;
  number_of_sales_yesterday: number;
  average_spend_per_sale_yesterday: number;
}

interface TrendData {
  date: string;
  sold_revenue: number;
  gross_profit: number;
}

interface SellingItem {
  item_id: string;
  item_name: string;
  quantity_sold: number;
  revenue: number;
}

interface LowStockItem {
  item_id: string;
  item_name: string;
  current_stock: number;
}

interface WastageItem {
  item_id: string;
  item_name: string;
  quantity_wasted: number;
  cost_lost: number;
}

interface DashboardMetrics {
  kpis: KPI;
  trend: TrendData[];
  top_selling_items: SellingItem[];
  low_stock_items: LowStockItem[];
  wastage_items: WastageItem[];
}

const Dashboard: React.FC = () => {
  const { backoffice_user_profile } = useAppState();
  const store_location_id = backoffice_user_profile?.store_location_id;
  const business_location_id = backoffice_user_profile?.business_location_id;
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    kpis: {
      sales_revenue_today: 0,
      gross_profit_today: 0,
      number_of_sales_today: 0,
      average_spend_per_sale: 0,
      sales_revenue_yesterday: 0,
      gross_profit_yesterday: 0,
      number_of_sales_yesterday: 0,
      average_spend_per_sale_yesterday: 0,
    },
    trend: [],
    top_selling_items: [],
    low_stock_items: [],
    wastage_items: [],
  });
  const router = useRouter();

  useEffect(() => {
    const fetchMetrics = async () => {
      if (store_location_id && business_location_id) {
        try {
          const response = await api.get(
            endpoints.getDashboardMetrics(store_location_id)
          );
          setMetrics(response.data?.data);
        } catch (err) {
          console.error("Failed to fetch dashboard metrics:", err);
        }
      }
    };
    fetchMetrics();
  }, [store_location_id, business_location_id]);

  const calculateChange = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    const change = ((today - yesterday) / yesterday) * 100;
    return Number.isFinite(change) ? Math.round(change * 10) / 10 : 0;
  };

  const creditSubKpis = [
    {
      label: "No. of Sales",
      value: metrics.kpis.credit_sale_count_today?.toLocaleString(),
      change: calculateChange(
        metrics.kpis.credit_sale_count_today,
        metrics.kpis.credit_sale_count_yesterday
      ),
    },
    {
      label: "Revenue",
      value: `KES ${metrics.kpis.credit_revenue_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.credit_revenue_today,
        metrics.kpis.credit_revenue_yesterday
      ),
    },
    {
      label: "COGS",
      value: `KES ${metrics.kpis.credit_cogs_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.credit_cogs_today,
        metrics.kpis.credit_cogs_yesterday
      ),
    },

    {
      label: "Profit",
      value: `KES ${(
        metrics.kpis.credit_revenue_today - metrics.kpis.credit_cogs_today
      )?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.credit_revenue_today - metrics.kpis.credit_cogs_today,
        metrics.kpis.credit_revenue_yesterday -
          metrics.kpis.credit_cogs_yesterday
      ),
    },
  ];

  const complimentarySubKpis = [
    {
      label: "No. of Sales",
      value: metrics.kpis.complimentary_sale_count_today?.toLocaleString(),
      change: calculateChange(
        metrics.kpis.complimentary_sale_count_today,
        metrics.kpis.complimentary_sale_count_yesterday
      ),
    },
    {
      label: "Revenue",
      value: `KES ${metrics.kpis.complimentary_revenue_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.complimentary_revenue_today,
        metrics.kpis.complimentary_revenue_yesterday
      ),
    },
    {
      label: "COGS",
      value: `KES ${metrics.kpis.complimentary_cogs_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.complimentary_cogs_today,
        metrics.kpis.complimentary_cogs_yesterday
      ),
    },
  ];
  const salesSubKpis = [
    {
      label: "No. of Sales",
      value: metrics.kpis.number_of_sales_today?.toLocaleString(),
      change: calculateChange(
        metrics.kpis.number_of_sales_today,
        metrics.kpis.number_of_sales_yesterday
      ),
    },
    {
      label: "Revenue",
      value: `KES ${metrics.kpis.sales_revenue_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.sales_revenue_today,
        metrics.kpis.sales_revenue_yesterday
      ),
    },
    {
      label: "Gross Profit",
      value: `KES ${metrics.kpis.gross_profit_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.gross_profit_today,
        metrics.kpis.gross_profit_yesterday
      ),
    },

    {
      label: "Avg Spend per Sale",
      value: `KES ${metrics.kpis.average_spend_per_sale?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.average_spend_per_sale,
        metrics.kpis.average_spend_per_sale_yesterday
      ),
    },
  ];
   const shrinkageSubKpis = [
    {
      label: "No. of Items",
      value: metrics.kpis.shrinkage_count_today?.toLocaleString(),
      change: calculateChange(
        metrics.kpis.shrinkage_count_today,
        metrics.kpis.shrinkage_count_yesterday
      ),
     },
       {
      label: "Lost Revenue",
      value: `KES ${metrics.kpis.shrinkage_revenue_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.shrinkage_revenue_today,
        metrics.kpis.shrinkage_revenue_yesterday
      ),
    },
    {
      label: "Lost Capital",
      value: `KES ${metrics.kpis.shrinkage_cost_today?.toLocaleString()}`,
      change: calculateChange(
        metrics.kpis.shrinkage_cost_today,
        metrics.kpis.shrinkage_cost_yesterday
      ),
    },

  ];

  return (
    <Permission resource={"reports"} action={"dashboard"} isPage={true}>
      <BreadcrumbWithActions
        label="See Report"
        breadcrumbs={[{ name: "Dashboard" }]}
        actions={[
          {
            title: "Full Report",
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => router.push(routes.sales),
            resource: "reports",
            action: "sales",
          },
        ]}
      />{" "}
      <div className="flex flex-col gap-6 p-4">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
   
          <GroupKpiCard title="All Sales Today" subKpis={salesSubKpis} />
          <GroupKpiCard title="Credit Sales Today" subKpis={creditSubKpis} />
          <GroupKpiCard
            title="Complimentary Sales Today"
            subKpis={complimentarySubKpis}
          />
           <GroupKpiCard
            title="Shrinkage Today"
            subKpis={shrinkageSubKpis}
          />
        </div>

        {/* Combined Revenue and Profit Trend */}
        <div className="w-full">
          <ChartCard title="Revenue & Profit Trend (Last 7 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={metrics.trend}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E7490" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  interval={0}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  label={{
                    value: "KES",
                    angle: -90,
                    position: "insideLeft",
                    offset: -5,
                    fill: "#6b7280",
                    fontSize: 10,
                  }}
                  tickFormatter={(value) => value.toLocaleString()}
                  tickCount={5}
                />
                <Tooltip
                  formatter={(value, name) => {
                   return [
                      `KES ${value.toLocaleString()}`, name,
                    ]
                  }}
                  labelFormatter={(label) => `Day: ${label}`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "none",
                    padding: "6px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sold_revenue"
                  name="Revenue"
                  stroke="#0E7490"
                  fill="url(#colorRevenue)"
                  fillOpacity={0.4}
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="gross_profit"
                  name="Profit"
                  stroke="#F97316"
                  fill="url(#colorProfit)"
                  fillOpacity={0.4}
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Top Selling Items */}
          <Card title="Top 5 Selling Items (Last 7 Days)">
            <table className="w-full text-sm text-neutral-800 dark:text-neutral-200">
              <thead>
                <tr className="bg-primary/10 dark:bg-neutral-700 text-left text-[13px] text-neutral-800 dark:text-neutral-300">
                  <th className="text-left p-2 border-b border-primary/10 dark:border-neutral-600">
                    Item Name
                  </th>
                  <th className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                    Qty Sold
                  </th>
                  <th className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.top_selling_items.map((item, index) => (
                  <tr key={item.item_id || index}>
                    <td className="p-2 border-b border-primary/10 dark:border-neutral-600">
                      {item.item_name}
                    </td>
                    <td className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                      {item.quantity_sold.toLocaleString()}{" "}
                      {item?.quantity_units?.code_name}(s)
                    </td>
                    <td className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                      KES {item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {!store_location_id ? (
            //   {/* Low Stock Items */}
            <Card title="Low Stock Items (≤ 5 Units)">
              <table className="w-full text-sm text-neutral-800 dark:text-neutral-200">
                <thead>
                  <tr className="bg-primary/10 dark:bg-neutral-700 text-left text-[13px] text-neutral-800 dark:text-neutral-300">
                    <th className="text-left p-2 border-b border-primary/10 dark:border-neutral-600">
                      Item Name
                    </th>
                    <th className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                      Current Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.low_stock_items.map((item, index) => (
                    <tr key={item.item_id || index}>
                      <td className="p-2 border-b border-primary/10 dark:border-neutral-600">
                        {item.item_name}
                      </td>
                      <td className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                        {item.current_stock.toLocaleString()}{" "}
                        {item?.quantity_units?.code_name}(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            //   {/* Wastage Items */}
            <Card title="Wastage Items (Last 7 Days)">
              <table className="w-full text-sm text-neutral-800 dark:text-neutral-200">
                <thead>
                  <tr className="bg-primary/10 dark:bg-neutral-700 text-left text-[13px] text-neutral-800 dark:text-neutral-300">
                    <th className="text-left p-2 border-b border-primary/10 dark:border-neutral-600">
                      Item Name
                    </th>
                    <th className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                      Qty Wasted
                    </th>
                    <th className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                      Cost Lost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.shrinkage_items?.map((item, index) => (
                    <tr key={item.item_id || index}>
                      <td className="p-2 border-b border-primary/10 dark:border-neutral-600">
                        {item.item_name}
                      </td>
                      <td className="text-right p-2 border-b border-primary/10 dark:border-neutral-600">
                        {item.quantity_wasted?.toLocaleString()}{" "}
                        {item?.quantity_units?.code_name}(s)
                      </td>
                      <td className="text-right p-2 border-b border-primary/10 dark:border-neutral-700">
                        KES {item.cost_lost?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </Permission>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, change }) => {
  const changeColor = change >= 0 ? "text-green-500" : "text-red-500";
  const changeSymbol = change >= 0 ? "+" : "";

  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm">
      <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {title}
      </h3>
      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-2">
        {value}
      </p>
      <p className={`text-xs ${changeColor} mt-1`}>
        {changeSymbol}
        {change}% vs yesterday
      </p>
    </div>
  );
};

const GroupKpiCard: React.FC<GroupKpiCardProps> = ({ title, subKpis }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col">
      {/* Title */}
      <h2 className="font-bold text-neutral-800 dark:text-neutral-200 mb-3">
        {title}
      </h2>

      {/* Sub KPIs */}
      <div className="flex-1 space-y-3">
        {subKpis.map((sub, index) => {
          const isPositive = sub.change >= 0;
          const changeColor = isPositive ? "text-green-600" : "text-red-500";
          const changeSymbol = isPositive ? "▲" : "▼";

          return (
            <div key={index} className="flex justify-between items-baseline">
              {/* Left: label + value */}
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {sub.label}
                </p>
                <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {sub.value}
                </p>
              </div>

              {/* Right: change */}
              <p
                className={`text-xs font-medium flex items-center gap-1 ${changeColor}`}
              >
                {changeSymbol}
                {Math.abs(sub.change)}%{" "}
                <span className="text-neutral-400">vs yesterday</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm">
      <h2 className="font-bold text-neutral-800 dark:text-neutral-200 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
};

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm">
      <h2 className="font-bold text-neutral-800 dark:text-neutral-200 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
};

export default Dashboard;
