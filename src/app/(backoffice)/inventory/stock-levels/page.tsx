"use client";

import AddItemModal from "@/components/backoffice/AddItemModal";
import ItemDetailsModal from "@/components/backoffice/ProductDetails";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DropdownMenu } from "@/components/common/DropdownActionMenu";
import PageEmptyState from "@/components/common/EmptyPageState";
import { FilterBar } from "@/components/common/FilterBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import { Item } from "@/types/item";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { FileText, MoreVertical, Package, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Select from "react-select";

function StockLevelsCard({
  item,
  removeItemConfirmation,
  openItemDetails,
}: {
  item: Item;
  removeItemConfirmation: () => void;
  openItemDetails: () => void;
}) {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {item.item_name}
          </h3>
        </div>
        <div className="relative">
          <div className="flex items-center gap-1 ">
            <Permission resource={"stock_levels"} action={"read"}>
              <button
                onClick={removeItemConfirmation}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </Permission>
            <DropdownMenu
              trigger={
                <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition">
                  <MoreVertical className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </div>
              }
              items={[
                {
                  label: "View Details",
                  icon: (
                    <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  ),
                  onClick: openItemDetails,
                  resource: "items",
                  action: "read",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Item Category */}
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {item?.category_name || "Uncategorized"}
      </p>

      {/* Prices */}
      <div className="flex justify-between items-center text-sm mt-2">
        <span className="text-neutral-700 dark:text-neutral-300">
          Qty: {formatNumber(item.available_quantity)}
        </span>
        <span className="text-neutral-700 dark:text-neutral-300 mb-1.5">
          Unit Cost: Ksh. {formatNumber(item.buying_price)}
        </span>
      </div>

      {/* SKU / Barcode / Tax */}
      <div className="flex flex-wrap justify-between items-center text-sm text-neutral-600 dark:text-neutral-400 gap-4">
        <div className="flex items-center gap-1">
          {/* <SkuIcon className="w-4 h-4" />
          <span>{item.sku || item.product_code || "—"}</span> */}
        </div>

        <span className="text-neutral-700 dark:text-neutral-300 mb-1.5">
          Total Cost: Ksh. {formatNumber(item.total_buying_price)}
        </span>
      </div>
    </div>
  );
}

export default function StockedItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState<Item | null>(null);
  const [isRemoveConfirm, setisRemoveConfirm] = useState(false);
  const [itemToRemove, setitemToRemove] = useState<Item | null>(null);
  const [category, setCategory] = useState<any>(null);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [section, setSection] = useState<any>(null);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [statusCount, setStatusCount] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<Option[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [storeLocations, setStoreLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { business_profile, active_store_profile } = useAppState();

  const router = useRouter();

  const fetchItems = useCallback(
    async (page: number, searchTerm: string) => {
      if (!active_store_profile) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/api/store-locations/${active_store_profile.store_location_id}/stock-levels`,
          {
            params: {
              search: searchTerm,
              page,
              limit: pagination.limit,
              category_id: category?.value || null,
              section_id: section?.value || null,
              status: status?.value || null,
            },
          }
        );

        const {
          data,
          pagination: responsePagination,
          stock_on_hand_total_value,
          status_counts,
          facets,
        } = response.data.data;
        setItems(data);
        setPagination({
          totalItems: Number(responsePagination.totalItems),
          totalPages: Number(responsePagination.totalPages),
          limit: Number(responsePagination.limit),
        });
        setTotalValue(stock_on_hand_total_value);
        const newCategoryOptions = facets.categories.map((cat: any) => ({
          label: cat.name,
          value: cat.id,
        }));
        const newSectionOptions = facets.sections.map((sect: any) => ({
          label: sect.name,
          value: sect.id,
        }));
        const newStatusOptions = facets.statuses.map((sect: any) => ({
          label: sect.name,
          value: sect.id,
        }));
        setCategoryOptions(newCategoryOptions);
        setSectionOptions(newSectionOptions);
        setStatusOptions(newStatusOptions);
        setStatusCount(status_counts);
      } catch (error: any) {
      } finally {
        setLoading(false);
      }
    },
    [
      active_store_profile,
      pagination.limit,
      category?.value,
      section?.value,
      status?.value,
    ]
  );

  // Debounced fetchItems function
  const debouncedfetchItems = useCallback(
    debounce((page: number, searchTerm: string) => {
      fetchItems(page, searchTerm);
    }, 300),
    [fetchItems]
  );

  // useEffect to trigger fetchItems on relevant changes
  useEffect(() => {
    if (active_store_profile) {
      debouncedfetchItems(currentPage, search);
      return () => {
        debouncedfetchItems.cancel(); // Cancel pending debounced calls on cleanup
      };
    }
  }, [currentPage, active_store_profile, debouncedfetchItems, search]);

  // Fetch store locations only when dialog is opened
  useEffect(() => {
    if (isRemoveConfirm && itemToRemove) {
      const fetchStore = async () => {
        setStoresLoading(true);
        try {
          const response = await api.get(
            `/api/items/${itemToRemove.id}/store-locations`
          );

          setStoreLocations(response?.data?.data);
          setSelectedLocations([]); // Reset selections
          setStoresLoading(false);
        } catch (err) {
          console.log(err);
          setStoresLoading(false);
        }
      };
      fetchStore();
    }
  }, [isRemoveConfirm, itemToRemove]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search input change
  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1); // Reset to first page on search
    debouncedfetchItems(1, searchTerm);
  };

  const openAddForm = () => {
    setIsFormOpen(true);
  };
  const closeAddForm = () => {
    setIsFormOpen(false);
  };

  const handleAddItems = async (data: any) => {
    const payload = {
      item_id: data.itemId,
      quantity: data.quantity,
      categories: data.categoryIds,
      store_location_ids: data.store_location_ids,
    };
    try {
      await api.post(`/api/store-locations/stock-levels`, payload);
      toast.success("Item(s) added.");
      closeAddForm();
      fetchItems(1, "");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add item(s).");
    }

    // Handle response
  };

  const openItemDetails = (item: Item) => {
    setCurrentItem(item);
    setShowItemDetails(item);
  };

  const onCloseItemDetails = () => {
    setCurrentItem(null);
    setShowItemDetails(null);
  };

  const removeItemConfirmation = (item: Item) => {
    setitemToRemove(item);
    setisRemoveConfirm(true);
  };

  const onRemoveItem = async (id: string) => {
    if (selectedLocations.length === 0) {
      setError("Please select at least one store location");
      return;
    }
    setOperationLoading(true);
    try {
      await api.patch(`/api/store-locations/stock-levels/${id}`, {
        store_location_ids: storeLocations.map((loc) => loc.store_location_id),
      });
      toast.success(`Item removed.`);
      setisRemoveConfirm(false);
      setitemToRemove(null);
      fetchItems(1, "");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to remove item.`);
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "sku",
      label: "SKU",
      render: (item: Item) => item?.sku || "—",
    },
    {
      key: "item",
      label: "Product",
      render: (item: Item) => <div>{item.item_name}</div>,
    },
    {
      key: "cat",
      label: "Category",
      render: (item: Item) => item?.category_name || "Uncategorized",
    },
    {
      key: "unit_cost",
      label: "Unit Cost (Ksh.)",
      align: "right",
      render: (item: Item) => formatNumber(item.buying_price),
    },
    {
      key: "quantity",
      label: "Qty",
      align: "right",
      render: (item: Item) => formatNumber(item.available_quantity),
    },
    {
      key: "total_cost",
      label: "Total Cost (Ksh.)",
      align: "right",
      render: (item: Item) => formatNumber(item.total_buying_price),
    },
    {
      key: "status",
      label: "Status",
      render: (item: Item) => {
        const statusStyles = {
          "In Stock":
            "bg-green-100 text-green-800 dark:bg-green-800 dark:text-neutral-100",
          "Low Stock":
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-neutral-100",
          "Out of Stock":
            "bg-red-100 text-red-800 dark:bg-red-800 dark:text-neutral-100",
          Reserved:
            "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-neutral-100",
        };

        const style =
          statusStyles[item.status as keyof typeof statusStyles] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-neutral-100";

        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${style}`}
          >
            {item.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align:"right",
      render: (item: Item) => {
        return (
          <div className="flex items-center gap-3 justify-end">
            <Permission resource={"stock_levels"} action={"delete"}>
              <button
                onClick={() => removeItemConfirmation(item)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </Permission>
            <DropdownMenu
              trigger={
                <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition">
                  <MoreVertical className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </div>
              }
              items={[
                {
                  label: "View Details",
                  icon: (
                    <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  ),
                  onClick: () => openItemDetails(item),
                  resource: "stock_levels",
                  action: "read",
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"stock_levels"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Stock Levels"
          breadcrumbs={[
            { name: "Inventory", onClick: () => router.push(routes.inventory) },
            { name: "Stock Levels" },
          ]}
          actions={[
            {
              title: "Add More Items",
              onClick: openAddForm,
              resource: "stock_levels",
              action: "create",
            },
          ]}
          filters={   <FilterBar
            searchQuery={search}
            onSearchChange={handleSearchChange}
            facets={[
              {
                label: "Status",
                options: statusOptions,
                value: status,
                onChange: (value) => {
                  setStatus(value);
                  setCurrentPage(1);
                },
              },
              {
                label: "Category",
                options: categoryOptions,
                value: category,
                onChange: (value) => {
                  setCategory(value);
                  setCurrentPage(1);
                },
              },
              {
                label: "Sections",
                options: sectionOptions,
                value: section,
                onChange: (value) => {
                  setSection(value);
                  setCurrentPage(1);
                },
              },
            ]}
          />}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1 mx-2 mt-2 ">
          <div className="p-3 bg-white dark:bg-neutral-800 shadow-sm flex  flex-col items-center gap-4">
            <div className="flex flex-col items-center w-full">
              <p className="text-xs mb-1 text-neutral-700 dark:text-neutral-300 ">
                Total Stock Value
              </p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Ksh. {formatNumber(totalValue || 0)}
              </p>
            </div>
          </div>
          <div className="md:col-span-3">
            <StockStatusCard
              totalItems={pagination.totalItems}
              statusCounts={statusCount}
            />
          </div>
        </div>
        <div className="p-3 rounded-md bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
       
          <div className="">
            {items.length > 0 ? (
              <>
                <ReusableTable
                  data={items}
                  columns={columns}
                  pageSize={pagination.limit}
                  pagination={{ ...pagination, currentPage }}
                  onPageChange={handlePageChange}
                  renderCard={(item) => (
                    <StockLevelsCard
                      key={item.id}
                      item={item}
                      removeItemConfirmation={() =>
                        removeItemConfirmation(item)
                      }
                      openItemDetails={() => openItemDetails(item)}
                    />
                  )}
                />
              </>
            ) : (
              <PageEmptyState icon={Package} description="No products found." />
            )}
          </div>

          {showItemDetails && (
            <ItemDetailsModal item={currentItem} onClose={onCloseItemDetails} />
          )}
          {isFormOpen && (
            <AddItemModal
              onClose={closeAddForm}
              onSubmit={handleAddItems}
              store_locations={
                business_profile?.filter(
                  (loc) =>
                    loc.store_location_id ===
                      active_store_profile?.store_location_id ||
                    loc.parent_store_location_id ===
                      active_store_profile?.store_location_id
                ) ?? []
              }
              modes={[
                {
                  value: "single",
                  label: "Add Single Product",
                  description:
                    "Make one product available in this store and track its stock quantity.",
                },
                {
                  value: "catalogue",
                  label: "Add All Products",
                  description:
                    "Make all products available in this store and track their stock, with option to filter by category.",
                },
              ]}
            />
          )}

          {isRemoveConfirm && itemToRemove && (
            <ConfirmDialog
              title="Remove Item"
              message={
                <div className="space-y-4">
                  <p>
                    Please select the store locations from which to remove the
                    item <strong>{itemToRemove?.item_name}</strong>.
                  </p>
                  <div>
                    <label
                      htmlFor="store-locations"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Store Locations
                    </label>
                    <Select
                      id="store-locations"
                      isMulti
                      isDisabled={storesLoading}
                      loading={storesLoading}
                      options={storeLocations?.map((loc) => ({
                        value: loc.store_location_id,
                        label: loc.store_location_name,
                      }))}
                      value={selectedLocations.map((id) => {
                        const loc = storeLocations.find(
                          (l) => l.store_location_id === id
                        );
                        return {
                          value: id,
                          label: loc?.store_location_name || "",
                        };
                      })}
                      onChange={(selected) => {
                        setSelectedLocations(
                          selected ? selected.map((option) => option.value) : []
                        );
                        setError(null);
                      }}
                      className="my-react-select-container"
                      classNamePrefix="my-react-select"
                      placeholder="Select branch..."
                    />
                    {error && (
                      <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                  </div>
                </div>
              }
              confirmLabel="Remove"
              cancelLabel="Cancel"
              destructive
              onConfirm={() => onRemoveItem(itemToRemove.id)}
              onCancel={() => {
                setisRemoveConfirm(false);
                setitemToRemove(null);
                setSelectedLocations([]);
                setError(null);
              }}
            />
          )}
        </div>
      </div>
    </Permission>
  );
}

const StockStatusCard = ({
  totalItems,
  statusCounts,
}: {
  totalItems: number;
  statusCounts: {
    in_stock_count?: number | null;
    low_stock_count?: number | null;
    out_of_stock_count?: number | null;
    reserved_count?: number | null;
  };
}) => {
  // Define status configurations
  const statuses = [
    {
      key: "in_stock_count",
      name: "In Stock",
      color: "bg-green-500",
      id: "in_stock",
    },
    {
      key: "low_stock_count",
      name: "Low Stock",
      color: "bg-yellow-500",
      id: "low_stock",
    },
    {
      key: "out_of_stock_count",
      name: "Out of Stock",
      color: "bg-red-500",
      id: "out_of_stock",
    },
  ];

  // Map statuses with counts (default to 0) and calculate percentages
  const validStatuses = statuses.map((status) => ({
    ...status,
    count: statusCounts?.[status.key] ?? 0,
    percentage:
      totalItems > 0 ? ((statusCounts[status.key] ?? 0) / totalItems) * 100 : 0,
  }));

  // Filter statuses for legend (exclude 0 or null counts)
  const legendStatuses = validStatuses.filter((status) => status.count > 0);

  return (
    <div className="p-3 bg-white dark:bg-neutral-800 shadow-sm flex flex-col gap-2 w-full">
      {/* Total Items */}
      <div className="flex gap-1 items-center w-full">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          {formatNumber(totalItems || 0)}
        </p>
        <p className="text-xs mb-1 text-neutral-700 dark:text-neutral-300">
          Products
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex w-full h-1 overflow-hidden gap-1">
        {validStatuses.map((status) => (
          <div
            key={status.id}
            className={`${status.color} h-full transition-all duration-500 rounded-full`}
            style={{ width: `${status.percentage}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      {legendStatuses.length > 0 && (
        <div className="flex flex-row gap-4 items-center">
          {legendStatuses.map((status) => (
            <div key={status.id} className="flex items-center gap-0.5">
              <span className={`w-2 h-3 rounded-full ${status.color}`} />
              <div className="flex flex-row items-center gap-0.5">
                <span className="text-xs text-neutral-600 dark:text-neutral-300">
                  {status.name}:
                </span>
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-300">
                  {formatNumber(status.count)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
