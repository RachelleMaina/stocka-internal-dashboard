import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Order, OrderItem } from "../../types/customer";
import { Item } from "../../types/item";
import { Category } from "../../types/category";
import { User } from "../../types/report";
import { Customer } from "../../types/customer";
import ReusableTable from "./ReusableTable";
import DateRangePicker from "./DateRangePicker";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import { Pie } from "react-chartjs-2";
import { saveAs } from "file-saver";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const SalesReport: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString());
  const [endDate, setEndDate] = useState(new Date().toISOString());
  const [reportType, setReportType] = useState<"DATE" | "ITEM" | "USER" | "CATEGORY">("DATE");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);

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

  const [users] = useState<User[]>([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const [customers] = useState<Customer[]>([
    { id: 1, name: "John Doe", email: "john@example.com", phone: "555-123-4567", tags: ["VIP"], status: "ACTIVE", createdBy: 1, updatedBy: 1, createdAt: "2025-04-01T10:00:00Z", updatedAt: "2025-04-01T10:00:00Z" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "555-987-6543", tags: ["Regular"], status: "ACTIVE", createdBy: 1, updatedBy: 1, createdAt: "2025-04-02T12:00:00Z", updatedAt: "2025-04-02T12:00:00Z" },
  ]);

  const [orders] = useState<Order[]>([
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

  const filteredOrders = orders.filter(
    (o) =>
      new Date(o.date) >= new Date(startDate) &&
      new Date(o.date) <= new Date(endDate) &&
      (!categoryId || o.items.some((i) => items.find((it) => it.id === i.itemId)?.categoryId === categoryId)) &&
      (!userId || o.userId === userId) &&
      (!customerId || o.customerId === customerId)
  );

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = filteredOrders.length;
  const avgOrderValue = orderCount ? totalSales / orderCount : 0;

  const salesByItem = items.map((item) => {
    const itemOrders = filteredOrders.filter((o) => o.items.some((i) => i.itemId === item.id));
    const quantity = itemOrders.reduce((sum, o) => sum + (o.items.find((i) => i.itemId === item.id)?.quantity || 0), 0);
    const revenue = itemOrders.reduce((sum, o) => sum + (o.items.find((i) => i.itemId === item.id)?.quantity || 0) * (o.items.find((i) => i.itemId === item.id)?.price || 0), 0);
    return { ...item, quantity, revenue };
  }).filter((i) => i.quantity > 0);

  const salesByUser = users.map((user) => {
    const userOrders = filteredOrders.filter((o) => o.userId === user.id);
    const total = userOrders.reduce((sum, o) => sum + o.total, 0);
    return { ...user, total, orderCount: userOrders.length };
  }).filter((u) => u.orderCount > 0);

  const salesByCategory = categories.map((cat) => {
    const catItems = items.filter((i) => i.categoryId === cat.id);
    const catOrders = filteredOrders.filter((o) => o.items.some((i) => catItems.some((ci) => ci.id === i.itemId)));
    const total = catOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (catItems.some((ci) => ci.id === i.itemId) ? i.quantity * i.price : 0), 0), 0);
    return { ...cat, total };
  }).filter((c) => c.total > 0);

  const pieData = {
    labels: salesByCategory.map((c) => c.name),
    datasets: [
      {
        data: salesByCategory.map((c) => c.total),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  const handleExport = () => {
    let csv: string;
    let filename: string;

    switch (reportType) {
      case "DATE":
        csv = [
          "Order ID,Date,Customer,User,Total",
          ...filteredOrders.map((o) =>
            [
              o.id,
              new Date(o.date).toLocaleString(),
              customers.find((c) => c.id === o.customerId)?.name || "Unknown",
              users.find((u) => u.id === o.userId)?.name || "Unknown",
              o.total.toFixed(2),
            ].join(",")
          ),
        ].join("\n");
        filename = "sales_by_date.csv";
        break;
      case "ITEM":
        csv = [
          "Item Name,SKU,Quantity Sold,Revenue",
          ...salesByItem.map((i) =>
            [i.name, i.sku, i.quantity, i.revenue.toFixed(2)].join(",")
          ),
        ].join("\n");
        filename = "sales_by_item.csv";
        break;
      case "USER":
        csv = [
          "User Name,Order Count,Total Sales",
          ...salesByUser.map((u) =>
            [u.name, u.orderCount, u.total.toFixed(2)].join(",")
          ),
        ].join("\n");
        filename = "sales_by_user.csv";
        break;
      case "CATEGORY":
        csv = [
          "Category Name,Total Sales",
          ...salesByCategory.map((c) => [c.name, c.total.toFixed(2)].join(","))
        ].join("\n");
        filename = "sales_by_category.csv";
        break;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, filename);
  };

  const dateColumns = [
    { key: "id", label: "Order ID" },
    {
      key: "date",
      label: "Date",
      render: (order: Order) => new Date(order.date).toLocaleString(),
    },
    {
      key: "customerId",
      label: "Customer",
      render: (order: Order) => customers.find((c) => c.id === order.customerId)?.name || "Unknown",
    },
    {
      key: "userId",
      label: "User",
      render: (order: Order) => users.find((u) => u.id === order.userId)?.name || "Unknown",
    },
    {
      key: "total",
      label: "Total",
      render: (order: Order) => `$${order.total.toFixed(2)}`,
    },
  ];

  const itemColumns = [
    { key: "name", label: "Item Name" },
    { key: "sku", label: "SKU" },
    { key: "quantity", label: "Quantity Sold" },
    {
      key: "revenue",
      label: "Revenue",
      render: (item: any) => `$${item.revenue.toFixed(2)}`,
    },
  ];

  const userColumns = [
    { key: "name", label: "User Name" },
    { key: "orderCount", label: "Order Count" },
    {
      key: "total",
      label: "Total Sales",
      render: (user: any) => `$${user.total.toFixed(2)}`,
    },
  ];

  const categoryColumns = [
    { key: "name", label: "Category Name" },
    {
      key: "total",
      label: "Total Sales",
      render: (cat: any) => `$${cat.total.toFixed(2)}`,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sales Reports</h2>

      <div className="mb-6">
        <DateRangePicker
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="border px-3 py-2 rounded"
          >
            <option value="DATE">By Date</option>
            <option value="ITEM">By Item</option>
            <option value="USER">By User</option>
            <option value="CATEGORY">By Category</option>
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
        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <select
            value={userId || ""}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : undefined)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Customer</label>
          <select
            value={customerId || ""}
            onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : undefined)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Customers</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reportType === "DATE" && (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="text-sm font-medium">Total Sales</h3>
              <p className="text-lg font-bold">${totalSales.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="text-sm font-medium">Order Count</h3>
              <p className="text-lg font-bold">{orderCount}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="text-sm font-medium">Avg Order Value</h3>
              <p className="text-lg font-bold">${avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
          <ReusableTable data={filteredOrders} columns={dateColumns} searchKey="id" pageSize={10} />
        </div>
      )}

      {reportType === "ITEM" && (
        <ReusableTable data={salesByItem} columns={itemColumns} searchKey="name" pageSize={10} />
      )}

      {reportType === "USER" && (
        <ReusableTable data={salesByUser} columns={userColumns} searchKey="name" pageSize={10} />
      )}

      {reportType === "CATEGORY" && (
        <div>
          <div className="mb-6 max-w-md mx-auto">
            <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
          </div>
          <ReusableTable data={salesByCategory} columns={categoryColumns} searchKey="name" pageSize={10} />
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

export default SalesReport;