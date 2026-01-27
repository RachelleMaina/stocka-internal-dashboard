"use client";

import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, X } from "lucide-react";
import { useState } from "react";
import AsteriskBorder from "./AsteriskBorder";

type SaleItem = {
  item_name: string;
  unit_price: number;
  quantity: number;
};

type PaymentDetail = {
  method: string;
  amount: number;
};

type Sale = {
  created_at: string;
  receipt_number: string;
  items: SaleItem[];
  total_amount: number;
  payment_details: PaymentDetail[];
  change: number;
  user: { user_name: string };
};

type SaleDetailModalProps = {
  sale: Sale;
  onClose: () => void;
};

const SaleDetailsModal = ({ sale, onClose }: SaleDetailModalProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const { pos_device_profile } = useAppState();

  const date = new Date(sale.created_at)?.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const getTotalItems = (item: SaleItem) => {
    const subtotal = item.unit_price * item.quantity;
    const discount = 0;
    const total = subtotal - discount;
    return total;
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageCenter = pageWidth / 2;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(pos_device_profile?.business_location?.location_name || "Business Location", pageCenter, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("PO. BOX 5423-00200", pageCenter, 28, { align: "center" });
    doc.text("Nairobi, Kenya", pageCenter, 34, { align: "center" });
    doc.text("Tel: 0200000", pageCenter, 40, { align: "center" });
    doc.text("KRA PIN: P089898989", pageCenter, 46, { align: "center" });
    doc.text(`Date: ${date}`, pageCenter, 52, { align: "center" });
    doc.text(`Transaction #: ${sale.receipt_number}`, pageCenter, 58, { align: "center" });

    // Asterisk Separator
    doc.text("*".repeat(50), 20, 66);

    // Items table
    autoTable(doc, {
      startY: 70,
      head: [["Item", "Qty (Price)", "Total"]],
      body: sale.items.map((item) => [
        item.item_name,
        `${item.quantity} x ${formatNumber(item.unit_price)}`,
        `KES ${formatNumber(getTotalItems(item))}`,
      ]),
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2, textColor: [17, 24, 39], halign: "left" },
      headStyles: { fontStyle: "bold", textColor: [17, 24, 39], halign: "left" },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50, halign: "left" },
        2: { cellWidth: 50, halign: "right" },
      },
      margin: { left: 20, right: 20 },
    });

    let y = (doc as any).lastAutoTable.finalY + 4;
    doc.text("*".repeat(50), 20, y);

    // Totals
    autoTable(doc, {
      startY: y + 4,
      body: [
        ["Total", `KES ${formatNumber(sale.total_amount)}`],
        ["Tendered", `KES ${formatNumber(sale.payment_details?.reduce((total, curr) => total + curr.amount, 0))}`],
        ["Change", `KES ${formatNumber(sale.change)}`],
        ["Cashier", sale.user.user_name],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2, textColor: [17, 24, 39], halign: "left" },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 90, halign: "right" },
      },
      margin: { left: 20, right: 20 },
    });

    y = (doc as any).lastAutoTable.finalY + 4;
    doc.text("*".repeat(50), 20, y);

    // Payment Details
    doc.text("Payment Details", pageCenter, y + 8, { align: "center" });
    autoTable(doc, {
      startY: y + 12,
      head: [["Method", "Amount"]],
      body: sale.payment_details?.map((t) => [
        t.method.charAt(0).toUpperCase() + t.method.slice(1),
        `KES ${formatNumber(t.amount)}`,
      ]),
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2, textColor: [17, 24, 39], halign: "left" },
      headStyles: { fontStyle: "bold", textColor: [17, 24, 39], halign: "left" },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 90, halign: "right" },
      },
      margin: { left: 20, right: 20 },
    });

    y = (doc as any).lastAutoTable.finalY + 4;
    doc.text("*".repeat(50), 20, y);

    // Thank You
    y += 8;
    doc.text("Thank you!", pageCenter, y, { align: "center" });

    // Powered By
    y += 6;
    doc.text("Powered by Stocka", pageCenter, y, { align: "center" });
    doc.text("www.stocka.solutions", pageCenter, y + 6, { align: "center" });

    doc.save(`receipt_${sale.receipt_number}.pdf`);
    setIsGenerating(false);
  };

  const renderContent = () => (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-neutral-800 dark:text-white">
          Sales Receipt
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            aria-label="Download PDF"
          >
            <Download className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-0.5 flex flex-col items-center justify-center">
        <h3 className="dark:text-neutral-100">
          {pos_device_profile?.business_location?.location_name}
        </h3>

        <p className="text-sm">Date: {date}</p>
        <p className="text-sm">Transaction #: {sale.receipt_number}</p>
      </div>
      <div className="my-2 border-t border-dashed border-neutral-400" />

      {/* Body */}
      <div className="w-full">
        <div className="grid grid-cols-3 font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
          <span>Item</span>
          <span>Qty (Price)</span>
          <span className="text-right">Total</span>
        </div>
        {sale?.items?.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-3 text-sm text-neutral-700 dark:text-neutral-300"
          >
            <span className="line-clamp-2">{item.item_name}</span>
            <span>
              {item.quantity} x {formatNumber(item.unit_price)}
            </span>
            <span className="text-right">
              KES {formatNumber(getTotalItems(item))}
            </span>
          </div>
        ))}
      </div>
      <div className="my-2 border-t border-dashed border-neutral-400" />

      {/* Totals */}
      <div className="text-left text-sm space-y-1 text-neutral-800 dark:text-neutral-200">
        <div className="flex justify-between">
          <span>Total</span>
          <span>KES {formatNumber(sale.total_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tendered</span>
          <span>
            KES{" "}
            {formatNumber(
              sale.payment_details?.reduce(
                (total, curr) => total + curr.amount,
                0
              )
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Change</span>
          <span>KES {formatNumber(sale.change)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier</span>
          <span>{sale?.user?.user_name}</span>
        </div>
      </div>
      <div className="my-2 border-t border-dashed border-neutral-400" />

      {/* Payment Details */}
      <div className="text-sm">
        <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          Payment Details
        </p>
        {sale.payment_details?.map((t, idx) => (
          <div
            key={idx}
            className="flex justify-between text-neutral-700 dark:text-neutral-300"
          >
            <span className="capitalize">{t.method}</span>
            <span>KES {formatNumber(t.amount)}</span>
          </div>
        ))}
      </div>

      <AsteriskBorder />
      {/* Thank You */}
      <div className="flex flex-col items-center text-sm">
        <p>Thank you!</p>
        <p>Powered by Stocka</p>
        <p>
          <a
            href="https://stocka.solutions"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.stocka.solutions
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl p-4 w-full h-[calc(100vh-64px)] overflow-y-auto max-w-lg mx-auto"
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default SaleDetailsModal;