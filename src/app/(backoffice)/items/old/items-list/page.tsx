// app/backoffice/items/page.tsx
"use client";

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
import { taxTypes } from "@/data/kraDataTypes";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { useMemo, useCallback } from "react";
import {
  Edit,
  ExternalLink,
  FileText,
  MoreVertical,
  Package,
  Plus,
  Tag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import { endpoints } from "@/constants/endpoints";

const kraItemClassOptions = [
  { value: "99011000", label: "Exempt Goods(Paragraph 1 - 99)" },
  { value: "99011100", label: "Exempt Goods(Paragraph 100 - 146)" },
  { value: "99012000", label: "Zero Rated Goods" },
];

const adjustmentTypeOptions = [
  { value: "ADD", label: "Add" },
  { value: "DEDUCT", label: "Deduct" },
];

// Updated allMovementOptions with added 'local_type' mapping to your stock_movements types
// This is a suggested mapping based on semantic similarity; adjust as needed for exact business logic
const allMovementOptions: Option[] = [
  { value: "01", label: "Import", local_type: "purchase" },
  { value: "02", label: "Purchase", local_type: "purchase" },
  { value: "03", label: "Return", local_type: "purchase_return" },
  { value: "04", label: "Stock Movement", local_type: "transfer_in" }, // or transfer_out based on direction
  { value: "05", label: "Processing", local_type: "production_out" },
  { value: "06", label: "Adjustment", local_type: "add_adjustment" },
  { value: "11", label: "Sale", local_type: "sale" },
  { value: "12", label: "Return", local_type: "sales_return" },
  { value: "13", label: "Stock Movement", local_type: "transfer_out" }, // or transfer_in
  { value: "14", label: "Processing", local_type: "production_in" },
  { value: "15", label: "Discarding", local_type: "wastage" }, // or damage/theft
  { value: "16", label: "Adjustment", local_type: "remove_adjustment" },
];

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [kraLoading, setKraLoading] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState<Item | null>(null);
  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);
  const [kraModalOpen, setKraModalOpen] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [itemToStatusChange, setItemToStatusChange] = useState<Item | null>(
    null
  );
  const [itemToAdjust, setItemToAdjust] = useState<Item | null>(null);
  const [selectedKraItem, setSelectedKraItem] = useState<Item | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "DEDUCT">("ADD");
  const [movementType, setMovementType] = useState<any>(null);
  const [packagingQuantity, setPackagingQuantity] = useState<number>(0);
  const [usageQuantity, setUsageQuantity] = useState<number>(0);
  const [movementOptions, setMovementOptions] = useState<Option[]>(allMovementOptions);
  const [modalItemClass, setModalItemClass] = useState<string | null>(null);
  const [modalTaxType, setModalTaxType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<any>(null);
  const [type, setType] = useState<any>(null);
  const [status, setStatus] = useState<boolean | null>(true);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);

  const { backoffice_user_profile } = useAppState();
  const store_location_id = backoffice_user_profile?.store_location_id;
  const isKraRegistered = true;

  const router = useRouter();

  const fetchItems = useCallback(
    async (page: number, search: string) => {
      try {
        const response = await api.get(endpoints.getItems, {
          params: {
            status,
            category_id: category?.value || null,
            type: type?.value || null,
            search,
            page,
            limit: pagination.limit,
            store_location_id,
          },
        });
        const { items, pagination: pag, facets } = response?.data;

        setItems(items);
        setPagination(pag);
        setCount(pag?.totalItems || 0);
        // Update category options from facets
        const newCategoryOptions = facets.categories.map((cat: any) => ({
          label: cat.name,
          value: cat.id,
        }));
        setCategoryOptions(newCategoryOptions);

        const newTypeOptions = facets.types.map((type: any) => ({
          label: type.type,
          value: type.value,
        }));
        setTypeOptions(newTypeOptions);

        setLoading(false);
      } catch (error: any) {
        console.log(error);
        setLoading(false);
      }
    },
    [category?.value, type?.value, pagination.limit, status, store_location_id]
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
    debouncedfetchItems(currentPage, search);
    return () => {
      debouncedfetchItems.cancel(); // Cancel pending debounced calls on cleanup
    };
  }, [currentPage, debouncedfetchItems, search, category, status]);

  useEffect(() => {
    // Filter movement options based on adjustment type
    const filteredOptions = allMovementOptions.filter((opt) =>
      adjustmentType === "ADD"
        ? opt.value.startsWith("0")
        : opt.value.startsWith("1")
    );
    setMovementOptions(filteredOptions);
    setMovementType(null); // Reset selection when type changes
  }, [adjustmentType]);

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
    router.push(`${routes.simpleItemForm}`);
  };

  const openAddServiceForm = () => {
    router.push(`${routes.serviceForm}`);
  };

  const openEditForm = (item: Item) => {
    if (item?.types?.includes("service")) {
      router.push(`${routes.serviceForm}/${item.id}`);
    } else {
      router.push(`${routes.simpleItemForm}/${item.id}`);
    }
  };

  const openStockAdjustModal = useCallback((item: Item) => {
    setItemToAdjust(item);
    setAdjustmentType("ADD");
    setMovementType(null);
    setPackagingQuantity(0);
    setUsageQuantity(0);
    setShowStockAdjustModal(true);
  }, []);

  const openItemDetails = (item: Item) => {
    setCurrentItem(item);
    setShowItemDetails(item);
  };

  const onCloseItemDetails = () => {
    setCurrentItem(null);
    setShowItemDetails(null);
  };

  const openStatusChangeConfirmation = (item: Item) => {
    setItemToStatusChange(item);
    setIsStatusChangeOpen(true);
  };

  const openKraModal = (item: Item) => {
    setSelectedKraItem(item);
    setModalItemClass(item.item_class_code || null);
    setModalTaxType(item.tax_type?.code || null);
    setKraModalOpen(true);
  };

  const handleKraPush = async () => {
    if (!modalItemClass || !modalTaxType) {
      toast.error("Please select both Item Class Code and Tax Type.");
      return;
    }

    setKraLoading(true);
    try {
      const kraPayload = {
        item_class_code: modalItemClass,
        tax_type_code: modalTaxType,
        item_id: selectedKraItem.id
      };

      let response;
      const hasEtimsId = !!selectedKraItem?.etims_item_id;
      if (hasEtimsId) {
        response = await api.patch(endpoints.updateEtimsItem(store_location_id, selectedKraItem.id), kraPayload);
      } else {
        response = await api.post(endpoints.createEtimsItem(store_location_id), kraPayload);
      }

      const updatedItem = response.data.data;
      setItems((prev) =>
        prev.map((i) => (i.id === selectedKraItem?.id ? updatedItem : i))
      );
      toast.success(
        `Item ${hasEtimsId ? "updated" : "registered"} in eTIMS successfully.`
      );
      setKraModalOpen(false);
      setSelectedKraItem(null);
      setModalItemClass(null);
      setModalTaxType(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to push to KRA."
      );
    } finally {
      setKraLoading(false);
    }
  };

  const handleStatusChangeItem = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.patch(`/api/items/${id}/status`, {
        is_active: !itemToStatusChange?.is_active,
      });
      toast.success(
        `Item ${itemToStatusChange?.is_active ? "Deactivated" : "Activated"}.`
      );
      setIsStatusChangeOpen(false);
      setItemToStatusChange(null);
      fetchItems(1, "");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${
            itemToStatusChange?.is_active ? "deactivate" : "activate"
          } item.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if ((!movementType || (!packagingQuantity && !usageQuantity)) ) {
      toast.error("Please select movement type and enter at least one quantity (packaging or usage).");
      return;
    }

    setOperationLoading(true);
    try {
      // Calculate usage qty if only packaging provided (or vice versa)
      const finalUsageQty = usageQuantity || (packagingQuantity / (itemToAdjust?.conversion_factor || 1));
      const finalPackagingQty = packagingQuantity || (usageQuantity * (itemToAdjust?.conversion_factor || 1));

      const payload = {
        item_id: itemToAdjust?.id,
        movement_type: movementType?.value,
        packaging_quantity: finalPackagingQty,
        usage_quantity: finalUsageQty,
        action: adjustmentType,
      };
      const response = await api.post(endpoints.stockAdjust(store_location_id), payload);
      const updatedItem = response.data.data;
      setItems((prev) =>
        prev.map((i) => (i.id === itemToAdjust?.id ? updatedItem : i))
      );
      toast.success("Stock adjusted successfully.");
      setShowStockAdjustModal(false);
      setItemToAdjust(null);
      setAdjustmentType("ADD");
      setMovementType(null);
      setPackagingQuantity(0);
      setUsageQuantity(0);
    } catch (error: any) {
    
      toast.error(
        error?.response?.data?.message || "Failed to adjust stock."
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "item",
        label: "Product",
        render: (item) => {
          const words = item.item_name?.split(" ") || [];
          const initials =
            words.length >= 2
              ? words[0][0]?.toUpperCase() + words[1][0]?.toUpperCase()
              : words[0]?.substring(0, 2).toUpperCase();

          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center font-semibold text-neutral-700 dark:text-white">
                {initials}
              </div>
              <div className="flex flex-col gap-1 text-neutral-800 dark:text-neutral-100">
                <p className="font-medium truncate">{item.item_name}</p>

                <div className="flex flex-wrap gap-2 text-xs">
                  {item.has_modifiers && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`${routes.modifiers}?item_id=${item.id}`)
                      }
                      className="px-2 py-0.5 rounded-full bg-primary text-white hover:opacity-90 transition"
                    >
                      Modifiers
                    </button>
                  )}
                  {item.is_made_here && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`${routes.recipesForm}/${item.id}`)
                      }
                      className="text-primary hover:underline"
                    >
                      View recipe
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "category",
        label: "Category",
        render: (item) => (
          <span className="inline-flex items-center gap-1 text-neutral-800 dark:text-neutral-100">
            <Tag className="w-3 h-3" />
            {item?.category_name || "Uncategorized"}
          </span>
        ),
      },
      {
        key: "pricing",
        label: "Buy / Sell (Ksh.)",
        render: (item) => (
          <div className="text-neutral-800 dark:text-neutral-100 leading-tight">
            <div className="flex items-center justify-between w-52">
              <span>Buy: {formatNumber(item.buying_price)}</span>
              <span className="flex items-center gap-2">
                Sell: {formatNumber(item.selling_price)}
                <button
                  onClick={() => openEditForm(item)}
                  className="text-primary hover:opacity-80 transition"
                  aria-label="Edit Price"
                >
                  <Edit className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </span>
            </div>
            {item.margin !== undefined && (
              <span className="text-sm text-green-600 dark:text-green-400">
                +{formatNumber(item.margin)} profit
              </span>
            )}
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => (
          <span
            className={clsx(
              "font-medium text-sm",
              item.is_active
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            )}
          >
            {item.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "item_qty",
        label: "Stock Qty",
        render: (item: Item) => {
          const tracksStock = item.tracks_stock ?? false;
          const hasStoreAssignment = item.stock_quantity !== undefined && item.stock_quantity >= 0; // Assuming backend sets to -1 or null if not assigned
          const packagingQty = item.stock_quantity * (item.conversion_factor || 1); // Calculate packaging from usage
          const usageQty = item.stock_quantity; // Backend stores usage

          if (!tracksStock) {
            return (
              <span className="text-neutral-500 text-sm">Not tracked</span>
            );
          }

          if (!hasStoreAssignment) {
            return (
              <div className="flex flex-col gap-2">
                <span className="text-neutral-500 text-sm">Not in store</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {/* TODO: Add to store CTA - e.g., open modal to assign to store */ }}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Add to Store
                  </button>
                  <button
                    onClick={() => {/* TODO: Remove from store CTA */ }}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="border border-neutral-200 dark:border-neutral-700 rounded p-2 bg-neutral-50 dark:bg-neutral-800">
                
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.packaging_units?.code_name || 'Units'}: {formatNumber(packagingQty, 3)}</p>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-700 rounded p-2 bg-neutral-50 dark:bg-neutral-800">
              
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.quantity_units?.code_name || 'Units'}: {formatNumber(usageQty, 3)}</p>
                </div>
              </div>
              <button
                onClick={() => openStockAdjustModal(item)}
                className="text-primary hover:opacity-80 text-xs"
                aria-label="Adjust Stock"
              >
                Adjust
              </button>
            </div>
          );
        },
      },
      {
        key: "tax",
        label: "Tax",
        render: (item) => (
          <span className="text-neutral-800 dark:text-neutral-100">
            {item?.tax_type?.code_name
              ? isNaN(parseFloat(item.tax_type.code_name))
                ? item.tax_type.code_name
                : `${formatNumber(item.tax_type.code_name)}%`
              : "—"}
          </span>
        ),
      },
    ];

    const etimsColumn = isKraRegistered
      ? [
          {
            key: "etims",
            label: "eTIMS",
            render: (item) => {
              if (!item.is_sold)
                return <span className="text-neutral-500 text-xs">—</span>;


              const isLoading = kraLoading && selectedKraItem?.id === item.id;

              return (
                <Permission resource="items" action="update">
                  <button
                    onClick={() => openKraModal(item)}
                    disabled={isLoading}
                    className={clsx(
                      "text-xs font-medium",
                      item.is_etims_registered
                        ? "text-yellow-600 dark:text-yellow-400 hover:underline"
                        : "text-primary hover:underline",
                      isLoading && "opacity-60"
                    )}
                  >
                    {isLoading
                      ? "Syncing..."
                      : item.is_etims_registered
                      ? "Update on eTIMS"
                      : "Register"}
                  </button>
                </Permission>
              );
            },
          },
        ]
      : [];

    const actionsColumn = {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center gap-3 justify-end">
          <Permission resource="items" action="update">
            <button
              onClick={() => openEditForm(item)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-primary transition hover:opacity-80"
              aria-label="Edit"
            >
              <Edit className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </Permission>
          <DropdownMenu
            trigger={
              <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <MoreVertical className="w-4 h-4" />
              </div>
            }
            items={[
              {
                label: item.is_active ? "Deactivate" : "Activate",
                icon: item.is_active ? (
                  <ToggleLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                ) : (
                  <ToggleRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                ),
                onClick: () => openStatusChangeConfirmation(item),
                resource: "items",
                action: "update",
              },
              {
                label: "View Details",
                icon: (
                  <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                ),
                onClick: () => openItemDetails(item),
                resource: "items",
                action: "read",
              },
            ]}
          />
        </div>
      ),
    };

    return [...baseColumns, ...etimsColumn, actionsColumn];
  }, [
    isKraRegistered,
    kraLoading,
    selectedKraItem?.id,
    router,
    openEditForm,
    openStatusChangeConfirmation,
    openItemDetails,
    openStockAdjustModal,
  ]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"items"} action={"read"} isPage={true}>
      <div className="h-full ">
        <div className="">
          <BreadcrumbWithActions
            label="New Item"
            breadcrumbs={[
              { name: "Items", onClick: () => router.push(routes.items) },
              { name: `Items List (${count})` },
            ]}
            actions={[
              {
                title: "Add Item",
                icon: <Plus className="w-4 h-4" />,
                onClick: openAddForm,
                resource: "items",
                action: "create",
              },

            ]}
          />
        </div>
        <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="p-3">
            <FilterBar
              isActive={status}
              onToggleActive={(value) => setStatus(value)}
              searchQuery={search}
              onSearchChange={handleSearchChange}
              facets={[
                {
                  label: "Category",
                  options: categoryOptions,
                  value: category,
                  onChange: (value) => {
                    setCategory(value);
                    setPagination((prev) => ({ ...prev, current_page: 1 }));
                  },
                },
                {
                  label: "Type",
                  options: typeOptions,
                  value: type,
                  onChange: (value) => {
                    setType(value);
                    setPagination((prev) => ({ ...prev, current_page: 1 }));
                  },
                },
              ]}
            />
          </div>
          {items.length > 0 ? (
            <ReusableTable
              data={items}
              columns={columns}
              pageSize={pagination.limit}
              pagination={{ ...pagination, currentPage }}
              onPageChange={handlePageChange}

            />
          ) : (
            <PageEmptyState icon={Package} description="No products found." />
          )}
        </div>

        {showItemDetails && currentItem && (
          <ItemDetailsModal
            itemId={currentItem.id}
            onClose={onCloseItemDetails}
          />
        )}

        {isStatusChangeOpen && itemToStatusChange && (
          <ConfirmDialog
            title={itemToStatusChange.is_active ? "Deactivate" : "Activate"}
            message={
              <>
                Are you sure you want to{" "}
                {itemToStatusChange.is_active ? "Deactivate" : "Activate"} the
                item <strong>{itemToStatusChange.item_name}</strong>?
              </>
            }
            confirmLabel={
              itemToStatusChange.is_active ? "Deactivate" : "Activate"
            }
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleStatusChangeItem(itemToStatusChange.id)}
            onCancel={() => {
              setIsStatusChangeOpen(false);
              setItemToStatusChange(null);
            }}
          />
        )}

        {kraModalOpen && selectedKraItem && (
          <ConfirmDialog
            title={selectedKraItem.etims_item_id ? "Update Item in KRA" : "Register Item in KRA"}
            message={
              <div className="space-y-4">
                <p>
                  Please confirm the following details for{" "}
                  {selectedKraItem.etims_item_id ? "updating" : "registering"} the item in eTIMS:
                </p>
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Item Class Code
                  </label>
                  <Select
                    options={kraItemClassOptions}
                    value={
                      modalItemClass
                        ? kraItemClassOptions.find(
                            (opt) => opt.value === modalItemClass
                          )
                        : null
                    }
                    onChange={(option) =>
                      setModalItemClass(option?.value || null)
                    }
                    placeholder="Select Item Class Code"
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Tax Type
                  </label>
                  <Select
                    options={taxTypes.map((tax) => ({
                      value: tax.code,
                      label: tax.code_name,
                    }))}
                    value={
                      modalTaxType
                        ? {
                            value: modalTaxType,
                            label:
                              taxTypes.find((t) => t.code === modalTaxType)
                                ?.code_name || "",
                          }
                        : null
                    }
                    onChange={(option) =>
                      setModalTaxType(option?.value || null)
                    }
                    placeholder="Select Tax Type"
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                    isClearable
                  />
                </div>
              </div>
            }
            confirmLabel="Push to KRA"
            cancelLabel="Cancel"
            onConfirm={handleKraPush}
            onCancel={() => {
              setKraModalOpen(false);
              setSelectedKraItem(null);
              setModalItemClass(null);
              setModalTaxType(null);
            }}
            loading={kraLoading}
          />
        )}

        {showStockAdjustModal && itemToAdjust && (
          <ConfirmDialog
            title="Adjust Stock"
            message={
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Adjustment Type
                  </label>
                  <Select
                    options={adjustmentTypeOptions}
                    value={
                      adjustmentType
                        ? adjustmentTypeOptions.find(
                            (opt) => opt.value === adjustmentType
                          )
                        : null
                    }
                    onChange={(option) =>
                      setAdjustmentType(option?.value as "ADD" | "DEDUCT")
                    }
                    placeholder="Select adjustment type"
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                    isClearable={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Movement Type
                  </label>
                  <Select
                    options={movementOptions}
                    value={movementType}
                    onChange={setMovementType}
                    placeholder="Select movement type"
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                    isClearable
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Packaging Quantity
                    </label>
                    <input
                      type="text"
                      value={packagingQuantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setPackagingQuantity(parseFloat(val) || 0);
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter packaging qty"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {itemToAdjust.packaging_units?.code_name || 'Packaging Units'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Usage Quantity
                    </label>
                    <input
                      type="text"
                      value={usageQuantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setUsageQuantity(parseFloat(val) || 0);
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter usage qty"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {itemToAdjust.quantity_units?.code_name || 'Usage Units'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                  <p><strong>Disclaimer:</strong> If packaging and usage units are the same (conversion factor = 1), enter in one field only. Do not use both if they are similar to avoid double-counting.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Current Usage Quantity
                    </label>
                    <p className="text-neutral-800 dark:text-neutral-100">
                      {formatNumber(itemToAdjust.stock_quantity, 3)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Quantity After Adjustment (Usage)
                    </label>
                    <p
                      className={clsx(
                        "font-medium",
                        adjustmentType === "ADD" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {formatNumber(
                        itemToAdjust.stock_quantity +
                          (adjustmentType === "ADD" ? usageQuantity : -usageQuantity),
                        3
                      )}
                    </p>
                  </div>
                </div>
              </div>
            }
            confirmLabel="Adjust Stock"
            cancelLabel="Cancel"
            onConfirm={handleAdjustStock}
            onCancel={() => {
              setShowStockAdjustModal(false);
              setItemToAdjust(null);
              setAdjustmentType("ADD");
              setMovementType(null);
              setPackagingQuantity(0);
              setUsageQuantity(0);
            }}
            loading={operationLoading}
          />
        )}
      </div>
    </Permission>
  );
}