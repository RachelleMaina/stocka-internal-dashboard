import { Customer, Order, OrderItem } from "../../types/customer";
import ReusableTable from "./ReusableTable";

interface CustomerOrdersModalProps {
  customer: Customer;
  orders: Order[];
  items?: OrderItem[];
  onClose: () => void;
}

const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  customer,
  orders,
  onClose,
}) => {
  const columns = [
    {
      key: "date",
      label: "Date",
      render: (order: Order) => new Date(order.date).toLocaleString(),
    },
    {
      key: "items",
      label: "Items",
      render: (order: Order) =>
        order.items.map((i) => `${i.name} (x${i.quantity})`).join(", "),
    },
    {
      key: "total",
      label: "Total",
      render: (order: Order) => `$${order.total.toFixed(2)}`,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">{customer.name}'s Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found for this customer.</p>
        ) : (
          <ReusableTable data={orders} columns={columns} searchKey="date" pageSize={5} />
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersModal;