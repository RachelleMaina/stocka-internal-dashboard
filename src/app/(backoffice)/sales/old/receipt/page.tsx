// app/receipt/[id]/page.tsx
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

import { Printer } from "lucide-react";
import EtimsReceipt from "@/components/common/EtimsReceipt";

interface PageProps {
  params: { id: string };
}

export default async function PublicReceiptPage({ params }: PageProps) {
  const { id } = params;

  let sale: any = null;
  let businessInfo: any = null;

  try {
    const [saleRes, businessRes] = await Promise.all([
      api.get(`/sales/public/${id}`),
      api.get(`/business/public`),
    ]);

    sale = saleRes.data.data;
    businessInfo = businessRes.data.data;
  } catch (error) {
    console.error("Failed to load receipt:", error);
    notFound();
  }

  if (!sale) notFound();

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{businessInfo.name}</h1>
          <p className="text-sm text-gray-600">
            {businessInfo.address} • PIN: {businessInfo.pin}
          </p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 print:p-0 print:shadow-none print:rounded-none print:bg-white">
          <EtimsReceipt
            etimsDetails={sale.etims_details}
            businessInfo={{
              name: businessInfo.name,
              pin: businessInfo.pin,
              address: businessInfo.address,
              logoUrl:
                businessInfo.logo_url ||
                `https://via.placeholder.com/120x80/1a1a1a/ffffff.png?text=${encodeURIComponent(
                  businessInfo.name.slice(0, 2).toUpperCase()
                )}`,
            }}
            saleInfo={{
              receipt_number: sale.receipt_number,
              sale_date: sale.sale_date,
              customer_name: sale.customer_name,
              total_amount: sale.total_amount,
              tax_amount: sale.tax_amount,
            }}
            items={sale.items || []}
            payments={sale.payments || []}
          />
        </div>

        {/* === ONLY DOWNLOAD BUTTON === */}
        <div className="flex justify-center mt-6 print:hidden">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
          >
            <Printer className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 print:hidden">
          Click "Download PDF" and choose "Save as PDF" in the print dialog.
        </p>
      </div>

      {/* === PRINT STYLES (FOR PDF) === */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}