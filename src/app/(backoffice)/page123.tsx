"use client";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Clock4,
  Warehouse,
  Activity,
  Loader2,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from "chart.js";
import { useState, useEffect } from "react";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const BackOfficeDashboard = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

  const kpiData = [
    { icon: <TrendingUp className="text-primary" />, title: "Sales Today", value: "KES 12,000" },
    { icon: <Clock4 className="text-primary" />, title: "Yesterday", value: "KES 9,800" },
    { icon: <AlertTriangle className="text-red-600" />, title: "Low Stock", value: "3 items" },
  ];

  const salesTrend = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "KES Sales",
        data: [3000, 4000, 4500, 6000, 5000, 7000, 8000],
        borderColor: "#84cc16",
        backgroundColor: "rgba(132, 204, 22, 0.2)",
      },
    ],
  };

  const recentSales = [
    { id: 1, time: "10:05 AM", detail: "KES 1,500 by cashier John" },
    { id: 2, time: "10:30 AM", detail: "KES 3,000 by cashier Mary" },
  ];

  const stockMoves = [
    { id: 1, time: "9:45 AM", detail: "Issued 20x Soda to Bar" },
    { id: 2, time: "10:15 AM", detail: "Received 5x Rice bags" },
  ];

  const pending = ["2 stock takes not submitted", "3 adjustments pending approval"];

  return (
    <div className="p-6 space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            {item.icon}
            <div>
              <p className="text-sm text-gray-500">{item.title}</p>
              <p className="text-xl font-semibold">{loading ? <SkeletonLine /> : item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <select className="p-2 rounded border border-gray-300">
          <option>Location A</option>
          <option>Location B</option>
        </select>
        <select className="p-2 rounded border border-gray-300">
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
          <option>Custom Range</option>
        </select>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <BarChart3 size={20} /> Sales Trend
        </h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : (
          <Line data={salesTrend} />
        )}
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityCard icon={<Activity />} title="Recent Sales" items={recentSales} loading={loading} />
        <ActivityCard icon={<Warehouse />} title="Stock Movements" items={stockMoves} loading={loading} />
      </div>

      {/* Pending Issues */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} /> Pending Issues
        </h3>
        {loading ? (
          <ul className="space-y-2">
            <SkeletonLine />
            <SkeletonLine />
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {pending.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BackOfficeDashboard;

// Reusable ActivityCard
const ActivityCard = ({ icon, title, items, loading }: any) => (
  <div className="bg-white p-4 rounded-xl shadow">
    <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
      {icon} {title}
    </h4>
    <ul className="space-y-2 text-sm text-gray-600">
      {loading
        ? [1, 2].map((i) => <SkeletonLine key={i} />)
        : items.map((item: any) => (
            <li key={item.id}>
              <span className="font-medium">{item.time}:</span> {item.detail}
            </li>
          ))}
    </ul>
  </div>
);

// Reusable Skeleton line
const SkeletonLine = () => (
  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
);
