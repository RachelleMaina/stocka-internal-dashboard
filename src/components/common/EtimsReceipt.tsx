// components/sales/EtimsReceipt.tsx
"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatNumber } from "@/lib/utils/helpers";

interface SaleItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  taxable_amount?: number;
  tax_amount?: number;
  item_tax_type_code?: string;
}

interface SalePayment {
  payment_type_name: string;
  amount: number;
}

interface EtimsDetails {
  transaction_id?: string;
  invoice_number?: string;
  invoice_date?: string;
  buyer_name?: string;
  buyer_pin?: string;
  items?: SaleItem[];
  totals?: {
    subtotal?: number;
    vat?: number;
    grand_total?: number;
  };
  qr_data?: string;
  signed_xml?: string;
  tax_rate?: number;
}

interface EtimsReceiptProps {
  etimsDetails?: EtimsDetails | null;
  businessInfo: {
    name: string;
    pin: string;
    address?: string;
    logoUrl?: string;
  };
  saleInfo: {
    receipt_number: string;
    sale_date: string;
    customer_name?: string;
    total_amount: number;
    tax_amount: number;
  };
  items?: SaleItem[];
  payments?: SalePayment[];
}

const EtimsReceipt: React.FC<EtimsReceiptProps> = ({
  etimsDetails,
  businessInfo,
  saleInfo,
  items = [],
  payments = [],
}) => {
  const isEtims = !!etimsDetails;

  // === Resolve data ===
  const {
    transaction_id = "",
    invoice_number = saleInfo.receipt_number,
    invoice_date = saleInfo.sale_date,
    buyer_name = saleInfo.customer_name ?? "Walk-in Customer",
    buyer_pin = "",
    items: etimsItems = [],
    totals: etimsTotals = {},
    qr_data = transaction_id || invoice_number,
    signed_xml = "",
    tax_rate = 16,
  } = etimsDetails ?? {};

  const receiptItems = isEtims ? etimsItems : items;
  const receiptPayments = payments;

  const subtotal = isEtims
    ? etimsTotals.subtotal ?? saleInfo.total_amount
    : saleInfo.total_amount;

  const vat = isEtims
    ? etimsTotals.vat ?? saleInfo.tax_amount
    : saleInfo.tax_amount;

  const grandTotal = subtotal + vat;

  // === Logo fallback ===
  const logoUrl =
    businessInfo.logoUrl ||
    `https://via.placeholder.com/120x80/1a1a1a/ffffff.png?text=${encodeURIComponent(
      businessInfo.name.slice(0, 2).toUpperCase()
    )}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt font-mono text-xs leading-tight max-w-[80mm] mx-auto bg-white p-3 print:p-0 print:m-0 print:max-w-none">
      {/* Print Button */}
      <div className="print:hidden text-center mb-3">
        <button
          onClick={handlePrint}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
        >
          Print Receipt
        </button>
      </div>

      {/* Header */}
      <div className="text-center border-b border-dashed pb-2 mb-2">
        <img
          src={logoUrl}
          alt="Business Logo"
          className="w-20 h-14 mx-auto mb-1 object-contain"
        />
        <h1 className="font-bold text-sm">{businessInfo.name}</h1>
        <p className="text-xs">
          PIN: <strong>{businessInfo.pin}</strong>
        </p>
        {businessInfo.address && <p className="text-xs">{businessInfo.address}</p>}
        <p className="font-bold text-xs mt-1">
          {isEtims ? "eTIMS TAX INVOICE" : "TAX INVOICE"}
        </p>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0 text-xs mb-2">
        <div>
          <p>
            <strong>Inv #:</strong> {invoice_number}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(invoice_date).toLocaleString("en-KE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="text-right">
          {isEtims && (
            <p>
              <strong>Trans ID:</strong> {transaction_id}
            </p>
          )}
          <p>
            <strong>Buyer:</strong> {buyer_name}
          </p>
          {buyer_pin && (
            <p>
              <strong>PIN:</strong> {buyer_pin}
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-b border-dashed py-1 mb-2">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-bold">Item</th>
              <th className="text-center font-bold">Qty</th>
              <th className="text-right font-bold">Price</th>
              <th className="text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {receiptItems.map((it, i) => (
              <tr key={i}>
                <td className="text-left pr-1">{it.item_name}</td>
                <td className="text-center">{it.quantity}</td>
                <td className="text-right">{formatNumber(it.unit_price)}</td>
                <td className="text-right font-medium">
                  {formatNumber(it.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments (non-eTIMS only) */}
      {!isEtims && receiptPayments.length > 0 && (
        <div className="mb-2 text-xs">
          <p className="font-bold">Payments:</p>
          {receiptPayments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>{p.payment_type_name}</span>
              <span>{formatNumber(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-dashed pt-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal (excl. VAT):</span>
          <span>{formatNumber(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT ({tax_rate}%):</span>
          <span>{formatNumber(vat)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{formatNumber(grandTotal)}</span>
        </div>
      </div>

      {/* QR Code (eTIMS only) */}
      {isEtims && (
        <div className="text-center my-3">
          <p className="text-xs mb-1">Verify with KRA</p>
          <div className="inline-block border border-black p-1 bg-white">
            <QRCodeSVG
              value={qr_data}
              size={100}
              level="M"
              includeMargin
              imageSettings={{
                src: logoUrl,
                height: 20,
                width: 20,
                excavate: true,
              }}
            />
          </div>
          <p className="text-xs mt-1">eTIMS Verified</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs border-t border-dashed pt-2 mt-3">
        <p className="font-bold">Thank You!</p>
        <p>
          {isEtims
            ? "Valid eTIMS Tax Invoice"
            : "Valid Tax Invoice"}
        </p>
        <p className="mt-1 text-[10px] opacity-70">
          Powered by {businessInfo.name}
        </p>
      </div>

      {/* Thermal Printer CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body,
          html {
            margin: 0 !important;
            padding: 0 !important;
            font-family: "Courier New", monospace;
            font-size: 10px;
            line-height: 1.3;
          }
          .receipt {
            width: 72mm !important;
            max-width: 72mm !important;
            padding: 4mm !important;
            box-sizing: border-box;
          }
          img {
            max-width: 60px !important;
            max-height: 40px !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          th,
          td {
            padding: 1px 0;
            border: none;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Force black text */
          * {
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EtimsReceipt;