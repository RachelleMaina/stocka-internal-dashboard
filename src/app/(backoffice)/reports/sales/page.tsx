"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import DateRangePicker from "@/components/common/DateRangePicker";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import SaleDetailsModal from "@/components/common/SaleDetails";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { SummaryCard } from "@/components/common/SummaryCard";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import { Sale } from "@/types/sale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Select from "react-select";

const handleDownloadSalesSummaryPDF = async (
  businessLocationId: string,
  storeLocationId: string,
  startDateTime?: string,
  endDateTime?: string,
  searchTerm?: string,
  activeStoreProfile?: any
) => {
  try {
    const viewModes = [
      { mode: "transaction", title: "By Transaction" },
      { mode: "product", title: "By Product" },
      { mode: "category", title: "By Category" },
      { mode: "user", title: "By User" },
      { mode: "payment_method", title: "By Payment Method" },
      { mode: "section", title: "By Section" },
      { mode: "credit", title: "Credit Sales" },
      { mode: "complimentary", title: "Complimentary Sales" },
    ];
    const responses = await Promise.all(
      viewModes.map(({ mode }) =>
        api.post(endpoints.getSalesReport(storeLocationId), {
          businessLocationId,
          startDateTime,
          endDateTime,
          searchTerm: searchTerm?.trim() || "",
          groupBy: mode,
          page: 1,
          limit: 1000,
        })
      )
    );

    const salesData: { [key: string]: any } = {};
    let sharedTotals: any = null;

    viewModes.forEach(({ mode }, index) => {
      const { data, totals } = responses[index].data.data;
      if (data.length > 0) {
        salesData[mode] = { data, totals };
        if (!sharedTotals) sharedTotals = totals;
      }
    });

    if (Object.keys(salesData).length === 0) {
      throw new Error("No sales data available for the selected criteria");
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(
      activeStoreProfile?.store_location_name?.toUpperCase() || "POS",
      105,
      10,
      { align: "center" }
    );
    doc.setFontSize(14);
    doc.text("Sales Summary Report", 105, y, { align: "center" });
    y += 8;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Location: ${activeStoreProfile?.store_location_name || "—"}`,
      10,
      y
    );
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 200, y, {
      align: "right",
    });
    y += 6;
    doc.text(
      `Date Range: ${
        startDateTime ? new Date(startDateTime).toLocaleDateString() : "Today"
      } - ${
        endDateTime ? new Date(endDateTime).toLocaleDateString() : "Today"
      }`,
      10,
      y
    );
    doc.text(`Prepared By: Stocka`, 200, y, { align: "right" });
    y += 6;
    if (searchTerm?.trim()) {
      doc.text(`Search: ${searchTerm.trim()}`, 200, y, { align: "right" });
    }
    y += 10;
    doc.setLineWidth(0.2);
    doc.line(10, y, 200, y);
    y += 8;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Summary", 10, y);
    y += 10;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total Amount", `KSh ${formatNumber(sharedTotals?.total_sales || 0)}`],
        ["Transactions", formatNumber(sharedTotals?.total_sales_count || 0)],
        [
          "Total Margin",
          `KSh ${formatNumber(sharedTotals?.total_profit || 0)}`,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 90, halign: "right" },
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: 0,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fontStyle: "bold",
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    for (const { mode, title } of viewModes) {
      const data = salesData[mode]?.data;
      if (!data || data.length === 0) continue;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, 10, y);
      y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);

      let columns: Array<{ header: string; dataKey: string; width?: number }> =
        [];
      let tableData: Array<{ [key: string]: string }> = [];

      switch (mode) {
        case "product":
          columns = [
            { header: "Product", dataKey: "item_name", width: null },
            { header: "Qty Sold", dataKey: "sales_count", width: 20 },
            { header: "Total Sales", dataKey: "total_sales", width: 30 },
            { header: "Margin", dataKey: "profit", width: 30 },
          ];
          tableData = data.map((item: any) => ({
            item_name: item.item_name || "—",
            sales_count: formatNumber(parseInt(item.sales_count)) || "—",
            total_sales:
              `KSh ${formatNumber(parseFloat(item.total_sales))}` || "—",
            profit: `KSh ${formatNumber(parseFloat(item.profit))}` || "—",
          }));
          break;
        case "category":
          columns = [
            { header: "Category", dataKey: "category_name", width: null },
            { header: "Qty Sold", dataKey: "sales_count", width: 20 },
            { header: "Total Sales", dataKey: "total_sales", width: 30 },
            { header: "Margin", dataKey: "profit", width: 30 },
          ];
          tableData = data.map((item: any) => ({
            category_name: item.category_name || "—",
            sales_count: formatNumber(parseInt(item.sales_count)) || "—",
            total_sales:
              `KSh ${formatNumber(parseFloat(item.total_sales))}` || "—",
            profit: `KSh ${formatNumber(parseFloat(item.profit))}` || "—",
          }));
          break;
        case "user":
          columns = [
            { header: "User", dataKey: "user_name", width: null },
            { header: "Phone", dataKey: "phone", width: 30 },
            { header: "Qty Sold", dataKey: "sales_count", width: 20 },
            { header: "Total Sales", dataKey: "total_sales", width: 30 },
            { header: "Margin", dataKey: "profit", width: 30 },
          ];
          tableData = data.map((item: any) => ({
            user_name: item?.user_name || "—",
            phone: item?.phone || "—",
            sales_count: formatNumber(parseInt(item.sales_count)) || "—",
            total_sales:
              `KSh ${formatNumber(parseFloat(item.total_sales))}` || "—",
            profit: `KSh ${formatNumber(parseFloat(item.profit))}` || "—",
          }));
          break;
        case "payment_method":
          columns = [
            { header: "Method", dataKey: "method", width: null },
            { header: "Qty Sold", dataKey: "sales_count", width: 20 },
            { header: "Total Sales", dataKey: "total_sales", width: 30 },
            { header: "Margin", dataKey: "profit", width: 30 },
          ];
          tableData = data.map((item: any) => ({
            method: (item.method || "—").toUpperCase(),
            sales_count: formatNumber(parseInt(item.sales_count)) || "—",
            total_sales:
              `KSh ${formatNumber(parseFloat(item.total_sales))}` || "—",
            profit: `KSh ${formatNumber(parseFloat(item.profit))}` || "—",
          }));
          break;
      }

      autoTable(doc, {
        startY: y,
        head: [columns.map((col) => col.header)],
        body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
        columnStyles: Object.fromEntries(
          columns.map((col, i) => [
            i,
            { cellWidth: col.width ? col.width : "auto" },
          ])
        ),
        styles: {
          fontSize: 10,
          cellPadding: 2,
          lineWidth: 0.1,
          lineColor: 0,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fontStyle: "bold",
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
        },
        didDrawCell: (data: any) => {
          if (
            data.section === "body" &&
            data.row.index < tableData.length - 1
          ) {
            doc.setLineDashPattern([], 0);
            doc.line(
              data.cell.x,
              data.cell.y + data.cell.height,
              data.cell.x + data.cell.width,
              data.cell.y + data.cell.height
            );
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Approved By:", 10, y);
    doc.line(40, y, 72, y);

    const startDate = startDateTime
      ? new Date(startDateTime).toISOString().slice(0, 10)
      : "today";
    const endDate = endDateTime
      ? new Date(endDateTime).toISOString().slice(0, 10)
      : "today";
    doc.save(`sales_summary_${startDate}_${endDate}.pdf`);
  } catch (error) {
    console.error("Failed to generate sales summary PDF:", error);
    toast.error("Unable to generate sales summary PDF");
  }
};

const Sales: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDateTime, setStartDateTime] = useState<Date | null>(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [endDateTime, setEndDateTime] = useState<Date | null>(
    new Date(new Date().setHours(23, 59, 59, 999))
  );
  const [viewMode, setViewMode] = useState<
    | "transaction"
    | "product"
    | "category"
    | "user"
    | "payment_method"
    | "section"
    | "credit"
    | "complimentary"
  >("product");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    limit: 10,
    currentPage: 1,
  });
  const [totals, setTotals] = useState<any>({});
  const { active_store_profile } = useAppState();
  const store_location_id = active_store_profile.store_location_id;
  const business_location_id = active_store_profile.business_location_id;
  const router = useRouter();

  const fetchSales = async (page: number) => {
    try {
      const response = await api.post(
        endpoints.getSalesReport(store_location_id),
        {
          businessLocationId: business_location_id,
          startDateTime,
          endDateTime,
          searchTerm: "",
          groupBy: viewMode,
          page,
          limit: pagination.limit,
        }
      );

      const {
        data,
        pagination: responsePagination,
        totals,
      } = response.data.data;
      setSales(data);
      setPagination({
        totalItems: Number(responsePagination.totalItems),
        totalPages: Number(responsePagination.totalPages),
        limit: Number(responsePagination.limit),
        currentPage: Number(responsePagination.currentPage),
      });
      setTotals(totals);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDateTime && endDateTime && active_store_profile) {
      fetchSales(pagination.currentPage);
    }
  }, [
    startDateTime,
    endDateTime,
    viewMode,
    pagination.currentPage,
    active_store_profile,
  ]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleDownloadClick = async () => {
    setDownloading(true);
    await handleDownloadSalesSummaryPDF(
      business_location_id,
      store_location_id,
      startDateTime,
      endDateTime,
      "",
      active_store_profile
    );
    setDownloading(false);
  };

  const openSaleDetails = (sale: Sale) => {
    setCurrentSale(sale);
    setShowSaleDetails(true);
  };

  const onCloseSaleDetails = () => {
    setCurrentSale(null);
    setShowSaleDetails(false);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "sales_count",
        label: "Transactions",
        render: (item: any) => <div>{item.sales_count}</div>,
      },
      {
        key: "total_sales",
        label: "Total Amount (KSh)",
        render: (item: any) =>
          `${formatNumber(item.total_sales ?? item.total_amount)}`,
      },

      {
        key: "profit",
        label: "Margin (KSh)",
        render: (item: any) =>
          `${formatNumber(
            item.profit ?? Number(item.total_amount) - Number(item.total_cost)
          )}`,
      },
    ];

    switch (viewMode) {
      case "transaction":
        return [
          {
            key: "receipt_number",
            label: "Receipt",
            render: (item: Sale) => (
              <div
                className="cursor-pointer text-primary hover:underline"
                onClick={() => openSaleDetails(item)}
              >
                {item.receipt_number}
              </div>
            ),
          },
          {
            key: "total_amount",
            label: "Total Amount (KSh)",
            render: (item: Sale) => `${formatNumber(item.total_amount)}`,
          },
          // {
          //   key: "total_cost",
          //   label: "Total Cost (KSh)",
          //   render: (item: Sale) => `${formatNumber(item.total_cost)}`,
          // },
          {
            key: "profit",
            label: "Margin (KSh)",
            render: (item: Sale) =>
              `${formatNumber(
                Number(item.total_amount) - Number(item.total_cost)
              )}`,
          },
        ];
      case "product":
        return [
          {
            key: "item_name",
            label: "Product",
            render: (item: any) => <div>{item.item_name}</div>,
          },
          ...baseColumns,
        ];
      case "category":
        return [
          {
            key: "category_name",
            label: "Category",
            render: (item: any) => <div>{item.category_name}</div>,
          },
          ...baseColumns,
        ];
      case "user":
        return [
          {
            key: "user_name",
            label: "User",
            render: (item: any) => <div>{item?.user_name}</div>,
          },
          {
            key: "phone",
            label: "Phone",
            render: (item: any) => <div>{item?.phone || "—"}</div>,
          },
          ...baseColumns,
        ];
      case "payment_method":
        return [
          {
            key: "method",
            label: "Method",
            render: (item: any) => (
              <div className="uppercase">{item.method}</div>
            ),
          },
          ...baseColumns,
        ];
      case "section":
        return [
          {
            key: "section_name",
            label: "Section",
            render: (item: any) => <div>{item.section_name}</div>,
          },
          ...baseColumns,
        ];
      case "credit":
        return [
          {
            key: "customer_name",
            label: "Customer",
            render: (item: any) => <div>{item.customer_name}</div>,
          },
          ...baseColumns,
        ];
      case "complimentary":
        return [
          {
            key: "customer_name",
            label: "Customer",
            render: (item: any) => <div>{item.customer_name}</div>,
          },
          ...baseColumns,
        ];
      default:
        return baseColumns;
    }
  }, [viewMode]);

  const viewOptions = [
    { value: "transaction", label: "By Transaction" },
    { value: "product", label: "By Product" },
    { value: "category", label: "By Category" },
    { value: "user", label: "By User" },
    { value: "payment_method", label: "By Payment Method" },
    { value: "section", label: "By Section" },
    { value: "credit", label: "Credit Sales" },
    { value: "complimentary", label: "Complimentary Sales" },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"reports"} action={"sales"} isPage={true}>
      <div className="h-full">
        <div className="bg-white dark:bg-neutral-800 shadow-sm">
          <BreadcrumbWithActions
            label="Sales"
            breadcrumbs={[
              { name: "Reports", onClick: () => router.push(routes.reports) },
              { name: "Sales" },
            ]}
            actions={[
              {
                icon: <Download className="w-4 h-4" />,
                title: downloading ? "Downloading..." : "Download",
                onClick: handleDownloadClick,
                resource: "reports",
                action: "sales",
                disabled: downloading,
              },
            ]}
          />

          {/* Inline Filters for Desktop */}
          <div className="hidden sm:flex items-end pt-3 px-3 pb-3 gap-4 whitespace-nowrap ">
            <div className="min-w-[250px] flex-shrink-0">
              <DateRangePicker
                onChange={(start, end) => {
                  setStartDateTime(start);
                  setEndDateTime(end);
                }}
                defaultStart={startDateTime}
                defaultEnd={endDateTime}
              />
            </div>
            <div className="min-w-[200px] flex-shrink-0">
              <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Report Type
              </label>
              <Select
                value={viewOptions.find((opt) => opt.value === viewMode)}
                onChange={(option) =>
                  setViewMode(option?.value as typeof viewMode)
                }
                options={viewOptions}
                className="my-react-select-container text-sm"
                classNamePrefix="my-react-select"
              />
            </div>
          </div>
        </div>
        <div className="flex md:hidden bg-white dark:bg-neutral-800 justify-end p-3">
          <button
            className="flex gap-1 items-center px-3 py-2.5 font-medium text-sm rounded bg-primary/10 dark:bg-neutral-100 text-black"
            onClick={() => setShowFilters(true)}
          >
            <Settings2 size={16} />
            <span>Filters</span>
          </button>
        </div>
        {/* Filters Modal for Mobile */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 sm:hidden">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Filters
              </h2>
              <div className="space-y-4">
                <div>
                  <DateRangePicker
                    onChange={(start, end) => {
                      setStartDateTime(start);
                      setEndDateTime(end);
                    }}
                    defaultStart={startDateTime}
                    defaultEnd={endDateTime}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    Report Type
                  </label>
                  <Select
                    value={viewOptions.find((opt) => opt.value === viewMode)}
                    onChange={(option) =>
                      setViewMode(option?.value as typeof viewMode)
                    }
                    options={viewOptions}
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    fetchSales(pagination.currentPage);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-2 space-y-2">
          <div className="hidden sm:grid grid-cols-3 gap-2">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <SummaryCard
                  title="Transactions"
                  value={formatNumber(totals?.total_sales_count) || 0}
                />
                <SummaryCard
                  title="Total Amount"
                  value={`KSh ${formatNumber(totals?.total_sales) || 0}`}
                />
                <SummaryCard
                  title="Total Margin"
                  value={`KSh ${formatNumber(totals?.total_profit) || 0}`}
                />
              </>
            )}
          </div>

          <div className="flex sm:hidden">
            <div className="w-full flex justify-between bg-neutral-100 dark:bg-neutral-800 rounded-md p-3 mt-1 mb-1 text-center text-neutral-700 dark:text-neutral-300 text-sm font-semibold">
              <div className="flex-1">
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  Total Amount
                </div>
                <div className="mt-1 text-neutral-900 dark:text-neutral-100">
                  KSh {formatNumber(totals?.total_sales) || 0}
                </div>
              </div>
              <div className="flex-1 border-x border-neutral-300 dark:border-neutral-600 mx-3">
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  Transactions
                </div>
                <div className="mt-1 text-neutral-900 dark:text-neutral-100">
                  {formatNumber(totals?.total_sales_count) || 0}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  Total Margin
                </div>
                <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                  KSh {formatNumber(totals?.total_profit) || 0}
                </div>
              </div>
            </div>
          </div>

          {sales.length > 0 ? (
            <div className="md:p-3 shadow-sm bg-white dark:bg-neutral-900 md:dark:bg-neutral-800">
              <ReusableTable
                data={sales}
                columns={columns}
                pageSize={pagination.limit}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            <div className="text-center text-neutral-500 dark:text-neutral-400 p-4">
              No sales data available for the selected criteria.
            </div>
          )}
        </div>

        {showSaleDetails && (
          <SaleDetailsModal sale={currentSale} onClose={onCloseSaleDetails} />
        )}
      </div>
    </Permission>
  );
};

export default Sales;
