import { Sale } from "@/lib/mockSales";

interface ReceiptCardProps {
  sale: Sale;
  onClick: () => void;
}

export default function ReceiptCard({ sale, onClick }: ReceiptCardProps) {
  const date = new Date(sale.timestamp)?.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="p-4 bg-white rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">
            Transaction #{sale.transactionId}
          </h3>
          <p className="text-sm text-neutral-500">{date}</p>
        </div>
        <p className="font-bold">
          Ksh. {sale.total?.toLocaleString()}
        </p>
      </div>
    </div>
  );
}