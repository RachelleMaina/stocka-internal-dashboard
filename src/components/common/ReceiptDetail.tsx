"use client";

import { useState } from "react";
import { Sale } from "@/lib/mockSales";
import {QRCodeSVG} from "qrcode.react";
import emailjs from "emailjs-com";
import { X } from "lucide-react";

// Mock ESC/POS for thermal printing (simplified)
const mockPrintToThermal = (content: string) => {
  console.log("Sending to thermal printer:\n", content);
  // In production, use escpos-buffer to send to USB/network printer
  // Example:
  // import { Printer, USB } from 'escpos-buffer';
  // const printer = new Printer(new USB());
  // printer.text(content).cut().close();
};

interface ReceiptDetailProps {
  sale: Sale;
  onClose: () => void;
}

export default function ReceiptDetail({ sale, onClose }: ReceiptDetailProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const date = new Date(sale.timestamp)?.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Filter priced items and modifiers
  const pricedItems = sale.items.flatMap((item) => {
    const baseItem = {
      name: item.variantName ? `${item.name} ${item.variantName}` : item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    };
    const modifiers = (item.modifiers || [])
      .filter((mod) => mod.price > 0)
      .map((mod) => ({
        name: mod.name,
        price: mod.price,
        quantity: item.quantity,
        total: mod.price * item.quantity,
      }));
    return [baseItem, ...modifiers];
  });

  // Generate plain text for thermal printer
  const generatePrintContent = () => {
    let content = `
Iano Liquor Store
PO. BOX 5423-00200 NAIROBI KENYA
Tel: 0200000
KRA PIN: P089898989
${date}
Transaction #: ${sale.transactionId}
------------------------------
Item              Qty       Total
------------------------------
`;
    pricedItems.forEach((item) => {
      const name = item.name.padEnd(18, " ").slice(0, 18);
      const qty = `${item.quantity} x ${item.price?.toLocaleString()}`.padEnd(10, " ");
      const total = `Ksh. ${item.total?.toLocaleString()}`.padStart(10, " ");
      content += `${name}${qty}${total}\n`;
    });
    content += `
------------------------------
Total: Ksh. ${sale.total?.toLocaleString()}
Tendered: Ksh. ${sale.tendered?.toLocaleString()}
Change: Ksh. ${sale.change?.toLocaleString()}
------------------------------
You were served by: ${sale.servedBy}
------------------------------
`;
    return content;
  };

  // Handle thermal printing
  const handlePrint = () => {
    setIsPrinting(true);
    const content = generatePrintContent();
    mockPrintToThermal(content);
    setTimeout(() => setIsPrinting(false), 1000); // Simulate print delay
  };

  // Handle email sharing
  const handleEmail = () => {
    setIsSharing(true);
    const templateParams = {
      to_email: "customer@example.com", // Replace with user input in production
      subject: `Receipt #${sale.transactionId} from Iano Liquor Store`,
      message: `
        <h2>Sales Receipt</h2>
        <p><strong>Iano Liquor Store</strong></p>
        <p>PO. BOX 5423-00200 NAIROBI KENYA, Tel: 0200000</p>
        <p>KRA PIN: P089898989</p>
        <p>${date}</p>
        <p>Transaction #: ${sale.transactionId}</p>
        <hr>
        <table>
          <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
          ${pricedItems
            .map(
              (item) =>
                `<tr><td>${item.name}</td><td>${item.quantity} x ${item.price?.toLocaleString()}</td><td>Ksh. ${item.total?.toLocaleString()}</td></tr>`
            )
            .join("")}
        </table>
        <hr>
        <p><strong>Total:</strong> Ksh. ${sale.total?.toLocaleString()}</p>
        <p><strong>Tendered:</strong> Ksh. ${sale.tendered?.toLocaleString()}</p>
        <p><strong>Change:</strong> Ksh. ${sale.change?.toLocaleString()}</p>
        <hr>
        <p>You were served by: ${sale.servedBy}</p>
        <p><a href="https://ianoliquorstore.com/receipt/${sale.transactionId}">View Receipt</a></p>
      `,
    };

    // Mock email (replace with emailjs.init and service ID in production)
    console.log("Sending email:", templateParams);
    setTimeout(() => setIsSharing(false), 1000);
  };

  // Handle WhatsApp sharing
  const handleWhatsApp = () => {
    setIsSharing(true);
    const text = encodeURIComponent(
      `Iano Liquor Store Receipt\n` +
        `Transaction #: ${sale.transactionId}\n` +
        `${date}\n` +
        `Items:\n` +
        pricedItems
          .map(
            (item) =>
              `- ${item.name}: ${item.quantity} x ${item.price?.toLocaleString()} = Ksh. ${item.total.toLocaleString()}`
          )
          .join("\n") +
        `\nTotal: Ksh. ${sale.total?.toLocaleString()}\n` +
        `Tendered: Ksh. ${sale.tendered?.toLocaleString()}\n` +
        `Change: Ksh. ${sale.change?.toLocaleString()}\n` +
        `Served by: ${sale.servedBy}\n` +
        `View: https://ianoliquorstore.com/receipt/${sale.transactionId}`
    );
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
    setTimeout(() => setIsSharing(false), 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full h-[90vh] rounded-t-xl p-6 animate-slide-up overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 bg-neutral-100 rounded-full"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="text-center">
          {/* Header */}
          <h3 className="text-lg font-bold">Sales Receipt</h3>
          <p className="font-semibold">Iano Liquor Store</p>
          <p className="text-sm">PO. BOX 5423-00200 NAIROBI KENYA, Tel: 0200000</p>
          <p className="text-sm">KRA PIN: P089898989</p>
          <p className="text-sm">{date}</p>
          <p className="text-sm">Transaction #: {sale.transactionId}</p>
          <div className="my-4 border-t border-dashed border-neutral-400" />
          {/* Body */}
          <div className="text-left">
            <div className="grid grid-cols-3 font-semibold text-sm mb-2">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Total</span>
            </div>
            {pricedItems.map((item, index) => (
              <div key={index} className="grid grid-cols-3 text-sm mb-1">
                <span>{item.name}</span>
                <span className="text-center">
                  {item.quantity} x {item.price?.toLocaleString()}
                </span>
                <span className="text-right">
                  Ksh. {item.total?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="my-4 border-t border-dashed border-neutral-400" />
          {/* Totals */}
          <div className="text-right text-sm">
            <p>Total: Ksh. {sale.total?.toLocaleString()}</p>
            <p>Tendered: Ksh. {sale.tendered?.toLocaleString()}</p>
            <p>Change: Ksh. {sale.change?.toLocaleString()}</p>
          </div>
          <div className="my-4 border-t border-dashed border-neutral-400" />
          {/* Served By */}
          <p className="text-sm text-center">
            You were served by: {sale.servedBy}
          </p>
          <div className="my-4 border-t border-dashed border-neutral-400" />
          {/* QR Code */}
          <div className="flex justify-center">
            <QRCodeSVG
              value={`https://ianoliquorstore.com/receipt/${sale.transactionId}`}
              size={128}
              level="M"
            />
          </div>
          {/* Action Buttons */}
          {/* <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`px-4 py-2 rounded-md ${
                isPrinting ? "bg-neutral-300" : "bg-primary hover:bg-primary/80"
              } text-white`}
            >
              {isPrinting ? "Printing..." : "Print"}
            </button>
            <button
              onClick={handleEmail}
              disabled={isSharing}
              className={`px-4 py-2 rounded-md ${
                isSharing ? "bg-neutral-300" : "bg-indigo-500 hover:bg-indigo-400"
              } text-white`}
            >
              Email
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={isSharing}
              className={`px-4 py-2 rounded-md ${
                isSharing ? "bg-neutral-300" : "bg-green-500 hover:bg-green-400"
              } text-white`}
            >
              WhatsApp
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}