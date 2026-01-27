"use client";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import DateRangePicker from "@/components/common/DateRangePicker";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatDate } from "@/lib/utils/helpers";
import { Plus, Settings2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AsyncSelect from "react-select/async";

interface StockMovement {
  date: string;
  type: string;
  reference: string;
  first_name?: string;
  last_name?: string;
  in: number;
  out: number;
  balance: number;
  unit_cost?: number;
  unit_price?: number;
}

interface StockCard {
  item_id: string;
  item_name: string;
  store_location: string;
  movements: StockMovement[];
}
const formatNumber = (num: number) => {
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

const formatType = (type: string) => {
  if (!type) return "";
  return type
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words
};

const StockCardRow = ({ movement }: { movement: StockMovement }) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="w-full flex justify-between gap-2 font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            <span>{formatType(movement.type)}</span> {movement.date}
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Quantity: {formatNumber(movement.quantity)}{" "}
            {movement?.quantity_units?.code_name}s • Balance:{" "}
            {movement.balance} {movement?.quantity_units?.code_name}s •{" "}
            {movement.user}
          </p>
        </div>
      </div>
    </div>
  );
};

const StockCardPage: React.FC = () => {
  const [stockCard, setStockCard] = useState<StockCard | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // Prevent concurrent fetches
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const { backoffice_user_profile } = useAppState();
  const router = useRouter();

  const loadItems = async (inputValue: string) => {
    try {
      const response = await api.get(endpoints.getReportItems, {
        params: { search: inputValue },
      });
      return response.data.data.map((item: any) => ({
        value: item.id,
        label: item.item_name,
      }));
    } catch (error) {
      console.error("Error fetching items:", error);
      return [];
    }
  };

  const fetchStockCard = async () => {
    if (
      !selectedItem?.value ||
      !backoffice_user_profile?.store_location_id ||
      !dateRange ||
      isFetching
    )
      return;
    setIsModalOpen(false);
    try {
      setIsFetching(true);
      setLoading(true);
      const response = await api.get(endpoints.getStockCard, {
        params: {
          item_id: selectedItem.value,
          store_location_id: backoffice_user_profile.store_location_id,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
        },
      });
      setStockCard(response.data.data || {});
      setItemName(response.data.data?.item_name || '');
    } catch (error) {
      setStockCard({});
      setItemName('')
      console.error("Error fetching stock card:", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    // Only update dateRange if it’s different to prevent unnecessary resets
    if (
      !dateRange ||
      dateRange.startDate !== startDate ||
      dateRange.endDate !== endDate
    ) {
      setDateRange({ startDate, endDate });
    }
  };

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (movement: StockMovement) => <div>{formatDate(movement.date)}</div>,
    },
    {
      key: "type",
      label: "Type",
      render: (movement: StockMovement) => (
        <div>{formatType(movement.type)}</div>
      ),
    },

    {
      key: "quantity",
      label: "Quantity",
      render: (movement: StockMovement) => (
        <div>
          {formatNumber(movement.quantity) || "-"}{" "}
          {movement?.quantity_units?.code_name}s
        </div>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      render: (movement: StockMovement) => (
        <div>
          {formatNumber(movement.balance)}{" "}
          {movement?.quantity_units?.code_name}s
        </div>
      ),
    },
    // {
    //   key: "unit_cost",
    //   label: "Unit Cost",
    //   render: (movement: StockMovement) => (
    //     <div>{movement.unit_cost ? `${movement.unit_cost}` : "—"}</div>
    //   ),
    // },
    // {
    //   key: "unit_price",
    //   label: "Unit Price",
    //   render: (movement: StockMovement) => (
    //     <div>{movement.unit_price ? `${movement.unit_price}` : "—"}</div>
    //   ),
    // },
    {
      key: "user",
      label: "User",
      render: (movement: StockMovement) => <div>{movement.user}</div>,
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"reports"} action={"stock_card"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Stock Card"
          breadcrumbs={[
            { name: "Reports", onClick: () => router.push(routes.reports) },
            { name: "Stock Card" },
            { name: itemName || "No Item" },
          ]}
          actions={[
            {
              icon: <Settings2 size={16} />,
              title: "Select Filters",
              onClick: () => setIsModalOpen(true),
              resource: "reports",
              action: "stock_card",
            },
          ]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {stockCard && stockCard?.movements?.length > 0 ? (
            <ReusableTable
              data={stockCard.movements}
              columns={columns}
              renderCard={(movement: StockMovement,) => (
                <StockCardRow
                  key={movement.date + movement.reference  + movement.type}
                  movement={movement}
                />
              )}
            />
          ) : (
            <PageEmptyState
              icon={Plus}
              description="No records found. Please refine the filters."
            />
          )}
        </div>
        {isModalOpen && (
          // {/* Filter Modal for All Screens */}
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className=" w-full m-3 pb-14 bg-white  dark:bg-neutral-800  rounded-lg shadow-md md:max-w-2xl overflow-y-auto max-h-[90vh] p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Filters
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-600 dark:text-neutral-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-4 mt-6">
                <DateRangePicker onChange={handleDateRangeChange} />
                <div className="flex flex-col min-w-[180px] w-full mt-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Item
                  </label>
                  <AsyncSelect
                    cacheOptions
                    loadOptions={loadItems}
                    value={selectedItem}
                    onChange={(option) => setSelectedItem(option)}
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                    placeholder="Search item"
                    isClearable
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 font-semibold bg-neutral-900 dark:bg-neutral-700 text-white dark:text-neutral-100 rounded px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={fetchStockCard}
                  disabled={!selectedItem?.value || !dateRange || isFetching}
                  className="flex-1 bg-primary font-semibold text-white rounded px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Permission>
  );
};

export default StockCardPage;
