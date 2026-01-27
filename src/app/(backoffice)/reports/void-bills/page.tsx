"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import DateRangePicker from "@/components/common/DateRangePicker";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import SaleDetailsModal from "@/components/common/SaleDetails";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatDate, formatNumber } from "@/lib/utils/helpers";
import { VoidBill } from "@/types/sale";
import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const VoidBills: React.FC = () => {
  const [voidBills, setVoidBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [currentSale, setCurrentSale] = useState<VoidBill | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDateTime, setStartDateTime] = useState<Date | null>(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [endDateTime, setEndDateTime] = useState<Date | null>(
    new Date(new Date().setHours(23, 59, 59, 999))
  );
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

  const fetchVoidBills = async (page: number) => {
    try {
      const response = await api.post(
        endpoints.getVoidBillsReport(store_location_id),
        {
          businessLocationId: business_location_id,
          startDateTime,
          endDateTime,
          searchTerm: "",
          page,
          limit: pagination.limit,
        }
      );

      const {
        data,
        pagination: responsePagination,
        totals,
      } = response.data.data;
      setVoidBills(data);
      setPagination({
        totalItems: Number(responsePagination.totalItems),
        totalPages: Number(responsePagination.totalPages),
        limit: Number(responsePagination.limit),
        currentPage: Number(responsePagination.currentPage),
      });
      setTotals(totals);
    } catch (error: any) {
      console.error("Error fetching voidBills:", error);
      toast.error("Failed to load voidBills data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDateTime && endDateTime && active_store_profile) {
      fetchVoidBills(pagination.currentPage);
    }
  }, [
    startDateTime,
    endDateTime,
    pagination.currentPage,
    active_store_profile,
  ]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const onCloseSaleDetails = () => {
    setCurrentSale(null);
    setShowSaleDetails(false);
  };

  const columns = [
    {
      key: "bill_number",
      label: "Bill No.",
      render: (item: any) => <div>{item.bill_number}</div>,
    },
    {
      key: "date",
      label: "Date",
      render: (item: any) => <div>{formatDate(item.updated_at)}</div>,
    },
    {
      key: "total_sales",
      label: "Total Amount (KSh)",
      render: (item: any) => `${formatNumber(item.total_amount)}`,
    },

    {
      key: "user",
      label: "User",
      render: (item: any) => <div>{item?.user?.user_name}</div>,
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"reports"} action={"void_bills"} isPage={true}>
      <div className="h-full">
        <div className="bg-white dark:bg-neutral-800 shadow-sm">
          <BreadcrumbWithActions
            label="Void Bills"
            breadcrumbs={[
              { name: "Reports", onClick: () => router.push(routes.reports) },
              { name: "Void Bills" },
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
          </div>
        </div>
        <div className="flex md:hidden bg-white justify-end p-3">
          <button
            className="flex gap-1 items-center px-3 py-2.5 font-medium text-sm rounded bg-primary/10 dark:bg-neutral-100 text-black dark:text-white"
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
                    fetchVoidBills(pagination.currentPage);
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
          {voidBills.length > 0 ? (
            <div className="md:p-3 shadow-sm bg-white dark:bg-neutral-900 md:dark:bg-neutral-800">
              <ReusableTable
                data={voidBills}
                columns={columns}
                pageSize={pagination.limit}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            <div className="text-center text-neutral-500 dark:text-neutral-400 p-4">
              No data available for the selected criteria.
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

export default VoidBills;
