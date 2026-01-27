import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { StockTakeEntry, ItemStockCount } from "../../types/stockTake";
import { Item } from "../../types/item";
import { Category } from "../../types/category";
import ReusableTable from "./ReusableTable";
import DateRangePicker from "./DateRangePicker";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import { saveAs } from "file-saver";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const VarianceReport: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString());
  const [endDate, setEndDate] = useState(new Date().toISOString());
  const [sectionId, setSectionId] = useState<number | undefined>(undefined);

  const [items] = useState<Item[]>([
    { id: 1, name: "Smartphone", categoryId: 1, buyingPrice: 500, sellingPrice: 599.99, barcode: "123456789012", sku: "SMRT123", trackStock: true, stock: 50, variants: [] },
    { id: 2, name: "T-Shirt", categoryId: 2, buyingPrice: 15, sellingPrice: 19.99, barcode: "987654321098", sku: "TSH456", trackStock: true, stock: 100, variants: [] },
    { id: 3, name: "Red Wine", categoryId: 4, buyingPrice: 20, sellingPrice: 29.99, barcode: "456789123456", sku: "WINE789", trackStock: true, stock: 20, variants: [] },
  ]);

  const [categories] = useState<Category[]>([
    { id: 1, name: "Electronics" },
    { id: 2, name: "Clothing" },
    { id: 3, name: "Groceries" },
    { id: 4, name: "Wines" },
  ]);

  const [stockTakeSections] = useState([
    { id: 1, name: "All Stock", categoryIds: [] },
    { id: 2, name: "Wines Stock", categoryIds: [4] },
  ]);

  const [stockTakeEntries] = useState<StockTakeEntry[]>([
    {
      id: 1,
      sectionId: 1,
      datetime: "2025-04-15T14:30:00Z",
      status: "COMPLETED",
      userId: 1,
      counts: [
        { itemId: 1, expectedQuantity: 50, countedQuantity: 48, notes: "Missing 2 units" },
        { itemId: 2, expectedQuantity: 100, countedQuantity: 100 },
      ],
    },
    {
      id: 2,
      sectionId: 2,
      datetime: "2025-04-14T10:00:00Z",
      status: "COMPLETED",
      userId: 1,
      counts: [{ itemId: 3, expectedQuantity: 20, countedQuantity: 18 }],
    },
  ]);

  const filteredEntries = stockTakeEntries.filter(
    (e) =>
      new Date(e.datetime) >= new Date(startDate) &&
      new Date(e.datetime) <= new Date(endDate) &&
      (!sectionId || e.sectionId === sectionId)
  );

  const variances = filteredEntries.flatMap((e) =>
    e.counts.map((c) => ({
      ...c,
      item: items.find((i) => i.id === c.itemId),
      entryDate: e.datetime,
      variance: c.expectedQuantity - c.countedQuantity,
    }))
  ).filter((v) => v.item && v.variance !== 0);

  const lineData = {
    labels: filteredEntries.map((e) => new Date(e.datetime).toLocaleDateString()),
    datasets: [
      {
        label: "Total Variance",
        data: filteredEntries.map((e) =>
          e.counts.reduce((sum, c) => sum + Math.abs(c.expectedQuantity - c.countedQuantity), 0)
        ),
        borderColor: "#FF6384",
        fill: false,
      },
    ],
  };

  const handleExport = () => {
    const csv = [
      "Item Name,SKU,Category,Expected,Counted,Variance,Date,Notes",
      ...variances.map((v) =>
        [
          v.item!.name,
          v.item!.sku,
          categories.find((c) => c.id === v.item!.categoryId)?.name || "Unknown",
          v.expectedQuantity,
          v.countedQuantity,
          v.variance,
          new Date(v.entryDate).toLocaleString(),
          v.notes || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "variance_report.csv");
  };

  const columns = [
    {
      key: "itemName",
      label: "Item Name",
      render: (v: any) => v.item.name,
    },
    {
      key: "sku",
      label: "SKU",
      render: (v: any) => v.item.sku,
    },
    {
      key: "category",
      label: "Category",
      render: (v: any) => categories.find((c) => c.id === v.item.categoryId)?.name || "Unknown",
    },
    { key: "expectedQuantity", label: "Expected" },
    { key: "countedQuantity", label: "Counted" },
    { key: "variance", label: "Variance" },
    {
      key: "entryDate",
      label: "Date",
      render: (v: any) => new Date(v.entryDate).toLocaleString(),
    },
    {
      key: "notes",
      label: "Notes",
      render: (v: any) => v.notes || "-",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Variance Report</h2>

      <div className="mb-6">
        <DateRangePicker
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Stock Take Section</label>
        <select
          value={sectionId || ""}
          onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : undefined)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Sections</option>
          {stockTakeSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <Line
          data={lineData}
          options={{
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>

      <ReusableTable data={variances} columns={columns} searchKey="itemName" pageSize={10} />

      <button
        onClick={handleExport}
        className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
      >
        Export as CSV
      </button>

      <Toaster position="top-right" />
    </div>
  );
};

export default VarianceReport;