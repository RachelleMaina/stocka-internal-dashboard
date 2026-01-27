
'use client';
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { endpoints } from "@/constants/endpoints";
import { useAppState } from "@/lib/context/AppState";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function BatchTimelineChart() {
  const { backoffice_user_profile } = useAppState();
  const store_location_id = backoffice_user_profile?.store_location_id;
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const res = await api.get(endpoints.getBatchGrossMarginTrend(store_location_id));
        // Transform data: shorten batch_name, format date, limit to last 7 batches
        const transformedData = res?.data?.data?.trend
          .map(item => ({
            ...item,
            sold_revenue: Math.abs(item.sold_revenue), // Positive for visualization
            batch_name: item.batch_name
              .replace("Batch 08/09/2025", "Batch")
              .replace(" - Rollover", " (R)")
              .substring(0, 10), // Truncate for minimal design
            formatted_date: new Date(item.batch_date).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            }), // e.g., "7th Sep"
          }))
          .slice(-7) || []; // Last 7 batches
        setData(transformedData);
      } catch (err) {
        console.error("Failed to fetch batch trend:", err);
      }
    };
    if (store_location_id) {
      fetchTrend();
    }
  }, [store_location_id]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4">
      {/* Revenue Chart */}
      <div className="w-full sm:w-1/2">
        <ChartCard title="Batch Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
              <XAxis
                dataKey="formatted_date"
                stroke="#6b7280"
                tick={{ fontSize: 8, fill: "#6b7280" }}
                height={60}
                interval={0} // Show all dates
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 8, fill: "#6b7280" }}
                label={{ value: "KES", angle: -90, position: "insideLeft", offset: -5, fill: "#6b7280", fontSize: 10 }}
                tickFormatter={(value) => value.toLocaleString()}
                tickCount={5}
              />
              <Tooltip
                formatter={(value) => `KES ${value.toLocaleString()}`}
                labelFormatter={(label, payload) =>
                  `Batch: ${payload[0]?.payload?.batch_name || "Unknown"} - Date: ${label}`
                }
                contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none", padding: "6px" }}
              />
              <Area
                type="monotone"
                dataKey="sold_revenue"
                name="Revenue"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.1} // Subtle tint
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Profit Chart */}
      <div className="w-full sm:w-1/2">
        <ChartCard title="Batch Profit">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
              <XAxis
                dataKey="formatted_date"
                stroke="#6b7280"
                tick={{ fontSize: 8, fill: "#6b7280" }}
                height={60}
                interval={0} // Show all dates
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 8, fill: "#6b7280" }}
                label={{ value: "KES", angle: -90, position: "insideLeft", offset: -5, fill: "#6b7280", fontSize: 10 }}
                tickFormatter={(value) => value.toLocaleString()}
                tickCount={5}
              />
              <Tooltip
                formatter={(value) => `KES ${value.toLocaleString()}`}
                labelFormatter={(label, payload) =>
                  `Batch: ${payload[0]?.payload?.batch_name || "Unknown"} - Date: ${label}`
                }
                contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none", padding: "6px" }}
              />
              <Area
                type="monotone"
                dataKey="gross_margin_value"
                name="Profit"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.1} // Subtle tint
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm">
      <h2 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-3">{title}</h2>
      {children}
    </div>
  );
}