import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Item } from "../../types/item";
import { Category } from "../../types/category";
import ReusableTable from "./ReusableTable";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { saveAs } from "file-saver";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ItemsReport: React.FC = () => {
  const [reportType, setReportType] = useState<"OUT_OF_STOCK" | "LOW_STOCK" | "FAST_MOVING" | "STOCK_VALUE">("OUT_OF_STOCK");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [lowStockThreshold] = useState(10);

  const [items] = useState<Item[]>([
    { id: 1, name: "Smartphone", categoryId: 1, buyingPrice: 500, sellingPrice: 599.99, barcode: "123456789012", sku: "SMRT123", trackStock: true, stock: 50, variants: [] },
    { id: 2, name: "T-Shirt", categoryId: 2, buyingPrice: 15, sellingPrice: 19.99, barcode: "987654321098", sku: "TSH456", trackStock: true, stock: 0, variants: [] },
    { id: 3, name: "Red Wine", categoryId: 4, buyingPrice: 20, sellingPrice: 29.99, barcode: "456789123456", sku: "WINE789", trackStock: true, stock: 5, variants: [] },
  ]);

  const [categories] = useState<Category[]>([
    { id: 1, name: "Electronics" },
    { id: 2, name: "Clothing" },
    { id: 3, name: "Groceries" },
    { id: 4, name: "Wines" },
  ]);

  const [orders] = useState([
    {
      id: 1,
      customerId: 1,
      date: "2025-04-15T14:30:00Z",
      total: 619.98,
      items: [
        { itemId: 1, name: "Smartphone", quantity: 1, price: 599.99 },
        { itemId: 2, name: "T-Shirt", quantity: 1, price: 19.99 },
      ],
      userId: 1,
    },
    {
      id: 2,
      customerId: 2,
      date: "2025-04-14T10:00:00Z",
      total: 89.97,
      items: [
        { itemId: 3, name: "Red Wine", quantity: 3, price: 29.99 },
      ],
      userId: 2,
    },
  ]);

  const filteredItems = items.filter(
    (i) => !categoryId || i.categoryId === categoryId
  );

  const outOfStockItems = filteredItems.filter((i) => i.trackStock && i.stock === 0);
  const lowStockItems = filteredItems.filter((i) => i.trackStock && i.stock > 0 && i.stock <= lowStockThreshold);
  const fastMovingItems = filteredItems
    .map((item) => {
      const quantitySold = orders.reduce(
        (sum, o) => sum + (o.items.find((oi) => oi.itemId === item.id)?.quantity || 0),
        0
      );
      return { ...item, quantitySold };
    })
    .filter((i) => i.quantitySold > 0)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10);
  const totalStockValue = filteredItems.reduce(
    (sum, i) => sum + (i.trackStock ? i.stock * i.sellingPrice : 0),
    0
  );

  const barData = {
    labels: fastMovingItems.map((i) => i.name),
    datasets: [
      {
        label: "Quantity Sold",
        data: fastMovingItems.map((i) => i.quantitySold),
        backgroundColor: "#36A2EB",
      },
    ],
  };

  const handleExport = () => {
    let csv: string;
    let filename: string;

    switch (reportType) {
      case "OUT_OF_STOCK":
        csv = [
          "Item Name,SKU,Category",
          ...outOfStockItems.map((i) =>
            [i.name, i.sku, categories.find((c) => c.id === i.categoryId)?.name || "Unknown"].join(",")
          ),
        ].join("\n");
        filename = "out_of_stock.csv";
        break;
      case "LOW_STOCK":
        csv = [
          "Item Name,SKU,Stock,Category",
          ...lowStockItems.map((i) =>
            [i.name, i.sku, i.stock, categories.find((c) => c.id === i.categoryId)?.name || "Unknown"].join(",")
          ),
        ].join("\n");
        filename = "low_stock.csv";
        break;
      case "FAST_MOVING":
        csv = [
          "Item Name,SKU,Quantity Sold,Category",
          ...fastMovingItems.map((i) =>
            [i.name, i.sku, i.quantitySold, categories.find((c) => c.id === i.categoryId)?.name || "Unknown"].join(",")
          ),
        ].join("\n");
        filename = "fast_moving_items.csv";
        break;
      case "STOCK_VALUE":
        csv = [
          "Item Name,SKU,Stock,Value,Category",
          ...filteredItems.map((i) =>
            [
              i.name,
              i.sku,
              i.stock,
              (i.stock * i.sellingPrice).toFixed(2),
              categories.find((c) => c.id === i.categoryId)?.name || "Unknown",
            ].join(",")
          ),
          `,,Total,${totalStockValue.toFixed(2)},`,
        ].join("\n");
        filename = "stock_value.csv";
        break;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, filename);
  };

  const itemColumns = [
    { key: "name", label: "Item Name" },
    { key: "sku", label: "SKU" },
    {
      key: "categoryId",
      label: "Category",
      render: (item: Item) => categories.find((c) => c.id === item.categoryId)?.name || "Unknown",
    },
    ...(reportType === "LOW_STOCK" || reportType === "STOCK_VALUE"
      ? [{ key: "stock", label: "Stock" }]
      : []),
    ...(reportType === "FAST_MOVING"
      ? [{ key: "quantitySold", label: "Quantity Sold" }]
      : []),
    ...(reportType === "STOCK_VALUE"
      ? [
          {
            key: "value",
            label: "Value",
            render: (item: Item) => `$${(item.stock * item.sellingPrice).toFixed(2)}`,
          },
        ]
      : []),
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Items Reports</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="border px-3 py-2 rounded"
          >
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="FAST_MOVING">Fast Moving</option>
            <option value="STOCK_VALUE">Total Stock Value</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reportType === "OUT_OF_STOCK" && (
        <ReusableTable
          data={outOfStockItems}
          columns={itemColumns}
          searchKey="name"
          pageSize={10}
        />
      )}

      {reportType === "LOW_STOCK" && (
        <ReusableTable
          data={lowStockItems}
          columns={itemColumns}
          searchKey="name"
          pageSize={10}
        />
      )}

      {reportType === "FAST_MOVING" && (
        <div>
          <div className="mb-6">
            <Bar
              data={barData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
          <ReusableTable
            data={fastMovingItems}
            columns={itemColumns}
            searchKey="name"
            pageSize={10}
          />
        </div>
      )}

      {reportType === "STOCK_VALUE" && (
        <div>
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="text-sm font-medium">Total Stock Value</h3>
            <p className="text-lg font-bold">${totalStockValue.toFixed(2)}</p>
          </div>
          <ReusableTable
            data={filteredItems}
            columns={itemColumns}
            searchKey="name"
            pageSize={10}
          />
        </div>
      )}

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

export default ItemsReport;