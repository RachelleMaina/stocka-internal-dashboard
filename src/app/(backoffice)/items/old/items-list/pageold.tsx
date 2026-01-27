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

function ItemCard({
  manageRecipe,
  item,
  onEdit,
  openStatusChangeConfirmation,
  openItemDetails,
}: {
  manageRecipe: () => void;
  item: Item;
  onEdit: () => void;
  openStatusChangeConfirmation: () => void;
  openItemDetails: () => void;
}) {
  const words = item.item_name?.split(" ") || [];
  const initials =
    words.length >= 2
      ? words[0][0]?.toUpperCase() + words[1][0]?.toUpperCase()
      : words[0]?.substring(0, 2).charAt(0)?.toUpperCase() +
        words[0]?.substring(1, 2)?.toLowerCase();

  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          {/* Initials Placeholder */}
          <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center font-semibold text-neutral-700 dark:text-white">
            {initials}
          </div>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1 text-sm">
              {item.item_name}
            </h3>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1">
          <Permission resource="items" action="update">
            <button
              onClick={onEdit}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-700"
              aria-label="Edit"
            >
              <Edit className="w-4 h-4" />
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
                onClick: openStatusChangeConfirmation,
                resource: "items",
                action: "update",
              },
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

      {/* Details Section */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Category and Tax */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
            <Tag className="w-3 h-3" />
            <span>{item?.category_name || "Uncategorized"}</span>
          </div>
          <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
            <Tag className="w-3 h-3" />
            <span>
              Tax:{" "}
              {item?.tax_type?.code_name
                ? isNaN(parseFloat(item.tax_type.code_name))
                  ? item.tax_type.code_name
                  : `${formatNumber(item.tax_type.code_name)}%`
                : "—"}
            </span>
          </div>
        </div>
        {/* Pricing */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
            <span>Buy: {formatNumber(item.buying_price)}</span>
            <span>Sell: {formatNumber(item.selling_price)}</span>
          </div>
          {item.margin !== undefined && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              +{formatNumber(item.margin)} profit
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {(item.has_modifiers || item.is_made_here) && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-200 dark:border-neutral-600 pt-3">
          {item.has_modifiers && (
            <button
              type="button"
              onClick={() =>
                router.push(`${routes.modifiers}?item_id=${item.id}`)
              }
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary text-white hover:bg-primary-dark transition"
            >
              <ExternalLink className="w-4 h-4" />
              Modifiers
            </button>
          )}
          {item.is_made_here && (
            <button
              type="button"
              onClick={manageRecipe}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary text-white hover:bg-primary-dark transition"
            >
              <ExternalLink className="w-4 h-4" />
              Recipe
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [kraLoading, setKraLoading] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState<Item | null>(null);
  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);
  const [kraModalOpen, setKraModalOpen] = useState(false);
  const [itemToStatusChange, setItemToStatusChange] = useState<Item | null>(
    null
  );
  const [selectedKraItem, setSelectedKraItem] = useState<Item | null>(null);
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
        const response = await api.get("/api/items", {
          params: {
            status,
            category_id: category?.value || null,
            type: type?.value || null,
            search,
            page,
            limit: pagination.limit,
          },
        });
        const { data, pagination: pag, facets } = response?.data?.data;

        setItems(data);
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
    [category?.value, type?.value, pagination.limit, status]
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
    if (item?.type?.includes("item")) {
      router.push(`${routes.serviceForm}/${item.id}`);
    } else {
      router.push(`${routes.simpleItemForm}/${item.id}`);
    }
  };

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
        item_id:selectedKraItem.id
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

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "item",
        label: "Product",
        render: (item: Item) => {
          const words = item.item_name?.split(" ") || [];
          const initials =
            words.length >= 2
              ? words[0][0]?.toUpperCase() + words[1][0]?.toUpperCase()
              : words[0]?.substring(0, 2).charAt(0)?.toUpperCase() +
                words[0]?.substring(1, 2)?.toLowerCase();

          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center font-semibold text-neutral-700 dark:text-white">
                {initials}
              </div>
              <div className="flex flex-col gap-1 text-neutral-800 dark:text-neutral-100">
                <p className="font-medium truncate">{item.item_name}</p>
                <div className="flex flex-wrap gap-2">
                  {item.has_modifiers && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`${routes.modifiers}?item_id=${item.id}`)
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs  bg-primary text-white hover:bg-primary-dark transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Modifiers
                    </button>
                  )}
                  {item.is_made_here && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`${routes.recipesForm}/${item.id}`)
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary text-white hover:bg-primary-dark transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Recipe
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
        render: (item: Item) => (
          <span className="inline-flex items-center gap-1 text-neutral-800 dark:text-neutral-100">
            <Tag className="w-3 h-3" />
            {item?.category_name || "Uncategorized"}
          </span>
        ),
      },
      {
        key: "pricing",
        label: "Price (Ksh.)",
        render: (item: Item) => (
          <div className="text-neutral-800 dark:text-neutral-100 leading-tight">
            <div className="flex justify-between gap-4 w-40">
              <span>Buy: {formatNumber(item.buying_price)}</span>
              <span>Sell: {formatNumber(item.selling_price)}</span>
            </div>
            {item.margin !== undefined && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{formatNumber(item.margin)} profit
              </span>
            )}
          </div>
        ),
      },
      {
        key: "tax",
        label: "Tax",
        render: (item: Item) => (
          <span className="text-neutral-800 dark:text-neutral-100">
            {item?.tax_type?.code_name
              ? isNaN(parseFloat(item.tax_type.code_name))
                ? item.tax_type.code_name
                : `${formatNumber(item.tax_type.code_name)}%`
              : "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item: Item) => (
          <span
            className={clsx(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              item.is_active
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-neutral-100"
                : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-neutral-100"
            )}
          >
            {item.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
    ];

    const etimsColumn = isKraRegistered
      ? [
          {
            key: "etims",
            label: "eTIMS",
            render: (item: Item) => {
              if (!item.is_sold) {
                return <span className="text-neutral-500 dark:text-neutral-400 text-xs">—</span>;
              }
              const hasEtimsId = !!item.etims_item_id;
              const isLoading = kraLoading && selectedKraItem?.id === item.id;
              return (
                <Permission resource="items" action="update">
                  <button
                    onClick={() => openKraModal(item)}
                    disabled={isLoading}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-medium rounded-full transition disabled:opacity-50",
                      hasEtimsId
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    )}
                  >
                    {isLoading ? "..." : hasEtimsId ? "Update" : "Push"}
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
      render: (item: Item) => (
        <div className="flex items-center gap-3 justify-end">
          <Permission resource="items" action="update">
            <button
              onClick={() => openEditForm(item)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-700"
              aria-label="Edit"
            >
              <Edit className="w-4 h-4" />
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
              // {
              //   title: "Add Service",
              //   icon: <Plus className="w-4 h-4" />,
              //   onClick: openAddServiceForm,
              //   description:"Add description",
              //   resource: "items",
              //   action: "create",
              // },
              //    {
              //   title: "Add Bulk Item",
              //   icon: <Plus className="w-4 h-4" />,
              //   onClick: ()=>router.push(`${routes.bulkItemForm}`),
              //   description:"Add description",
              //   resource: "items",
              //   action: "create",
              // },
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
              renderCard={(item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  manageRecipe={() =>
                    router.push(`${routes.recipesForm}/${item.id}`)
                  }
                  onEdit={() => openEditForm(item)}
                  openStatusChangeConfirmation={() =>
                    openStatusChangeConfirmation(item)
                  }
                  openItemDetails={() => openItemDetails(item)}
                />
              )}
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
      </div>
    </Permission>
  );
}