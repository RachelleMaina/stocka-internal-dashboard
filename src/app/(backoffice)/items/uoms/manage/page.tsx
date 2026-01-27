"use client";

import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import TableSelectionSummaryBar from "@/components/common/TableSelectionSummaryBar";
import Tabs from "@/components/common/Tabs";
import { routes } from "@/constants/routes";
import {
  useItemForUoms,
  useUomOptions,
  useUpdateItemUoMs,
} from "@/hooks/useItems";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Select from "react-select";

const TABS = [
  { key: "all", label: "All" },
  { key: "with_uoms", label: "With UoMs" },
  { key: "without_uoms", label: "Missing UoMs" },
];

const COLUMNS = [
  { key: "item_name", label: "Item Name" },
  { key: "base_uoq", label: "Quantity Units" },
  { key: "packaging_unit", label: "Packaging Units" },
  { key: "qty_in_packaging", label: "Qty in Packaging" },
];

const SELECT_MIN_WIDTH = "150px";

const SetUoMsPage = () => {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState("all");

  // Search states
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Selection state (stores item.id)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search & reset on tab/search change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setSelectedItemIds([]);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 10,
      uom_status: activeTab,
    }),
    [debouncedSearch, currentPage, activeTab]
  );

  const { data: itemsResponse, isLoading: loadingItems } = useItemForUoms({
    params,
  });

  const { data: options, isLoading: loadingOptions } = useUomOptions();
  const updateMutation = useUpdateItemUoMs();

  const items = useMemo(() => itemsResponse?.items || [], [itemsResponse]);
  const pagination = itemsResponse?.pagination;

  const { control, handleSubmit, setValue, reset } = useForm();

  // Auto-fill form when items load
  useEffect(() => {
    if (!items.length || !options) return;

    reset(); // Clear previous form state
    items.forEach((item: any) => {
      const id = item.id;

      // Packaging Unit
      if (item.packaging_unit?.code) {
        const pu = options.packagingUnits?.find(
          (u: any) => u.code === item.packaging_unit.code
        );
        if (pu)
          setValue(`${id}.packaging_select`, {
            label: pu.name,
            value: pu.code,
          });
      }
      setValue(
        `${id}.packaging_is_purchased`,
        item.packaging_unit?.is_purchased ?? false
      );
      setValue(
        `${id}.packaging_is_sold`,
        item.packaging_unit?.is_sold ?? false
      );

      // Base UoQ
      if (item.unit_of_quantity?.code) {
        const uoq = options.unitsOfQuantity?.find(
          (u: any) => u.code === item.unit_of_quantity.code
        );
        if (uoq)
          setValue(`${id}.uoq_select`, { label: uoq.name, value: uoq.code });
      }
      setValue(
        `${id}.qty_in_packaging`,
        item.unit_of_quantity?.quantity_in_packaging || ""
      );
      setValue(
        `${id}.uoq_is_purchased`,
        item.unit_of_quantity?.is_purchased ?? false
      );
      setValue(`${id}.uoq_is_sold`, item.unit_of_quantity?.is_sold ?? false);
    });
  }, [items, options, setValue, reset]);

  // Dynamic columns (inputs only show when row is selected)
  const allColumns = useMemo(
    () =>
      COLUMNS.map((col) => {
        if (col.key === "select") return col;

        return {
          ...col,
          render: (row: any) => {
            const itemId = items[row.index]?.id;
            const isSelected = selectedItemIds.includes(itemId);

            if (!isSelected) {
              // View/read-only mode - show actual values
              switch (col.key) {
                case "item_name":
                  return (
                    <td className="font-medium">
                      {items[row.index]?.item_name || "--"}
                    </td>
                  );
                case "packaging_unit":
                  return (
                    <td>
                      {items[row.index]?.packaging_unit?.display_name || "--"}
                    </td>
                  );
                case "qty_in_packaging":
                  return (
                    <td className="text-center font-medium">
                      {items[row.index]?.unit_of_quantity
                        ?.quantity_in_packaging ?? "--"}
                    </td>
                  );
                case "base_uoq":
                  return (
                    <td>
                      {items[row.index]?.unit_of_quantity?.display_name || "--"}
                    </td>
                  );
                default:
                  return <td>--</td>;
              }
            }

            // Editable mode when selected
            switch (col.key) {
              case "packaging_unit":
                return (
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Controller
                          control={control}
                          name={`${itemId}.packaging_select`}
                          render={({ field }) => (
                            <Select
                              {...field}
                              options={options?.packagingUnits?.map(
                                (u: any) => ({
                                  label: u.name,
                                  value: u.code,
                                })
                              )}
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minWidth: SELECT_MIN_WIDTH,
                                }),
                              }}
                              className="my-react-select-container text-sm"
                              classNamePrefix="my-react-select"
                              isDisabled={!isSelected}
                              isClearable={isSelected}
                            />
                          )}
                        />
                      </div>

                      {/* Packaging Unit flags */}
                      <div className="flex items-center gap-6">
                        <Controller
                          control={control}
                          name={`${itemId}.packaging_is_purchased`}
                          render={({ field }) => (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={!isSelected}
                                className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                              />
                              Purchased
                            </label>
                          )}
                        />
                        <Controller
                          control={control}
                          name={`${itemId}.packaging_is_sold`}
                          render={({ field }) => (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={!isSelected}
                                className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                              />
                              Sold
                            </label>
                          )}
                        />
                      </div>
                    </div>
                  </td>
                );

              case "base_uoq":
                return (
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Controller
                          control={control}
                          name={`${itemId}.uoq_select`}
                          render={({ field }) => (
                            <Select
                              {...field}
                              options={options?.unitsOfQuantity?.map(
                                (u: any) => ({
                                  label: u.name,
                                  value: u.code,
                                })
                              )}
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              className="my-react-select-container text-sm"
                              classNamePrefix="my-react-select"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minWidth: SELECT_MIN_WIDTH,
                                }),
                              }}
                              isDisabled={!isSelected}
                              isClearable={isSelected}
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-6">
                        <Controller
                          control={control}
                          name={`${itemId}.uoq_is_purchased`}
                          render={({ field }) => (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={!isSelected}
                                className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                              />
                              Purchased
                            </label>
                          )}
                        />
                        <Controller
                          control={control}
                          name={`${itemId}.uoq_is_sold`}
                          render={({ field }) => (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={!isSelected}
                                className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                              />
                              Sold
                            </label>
                          )}
                        />
                      </div>
                    </div>
                  </td>
                );

              case "qty_in_packaging":
                return (
                  <td>
                    <Controller
                      control={control}
                      name={`${itemId}.qty_in_packaging`}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="1"
                          disabled={!isSelected}
                          className={`w-20 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                            !isSelected
                              ? "bg-neutral-100 opacity-70 dark:bg-neutral-800"
                              : ""
                          }`}
                        />
                      )}
                    />
                  </td>
                );

              default:
                return <td>—</td>;
            }
          },
        };
      }),
    [items, control, options, selectedItemIds]
  );

  const tableData = useMemo(() => {
  
    return items.map((item: any, index: number) => ({
      id: item.id,
      index,
      real_id: item.id,
    }));
  }, [items]);

  const onSubmit = (data: any) => {
    if (selectedItemIds.length === 0) {
      toast.error("Please select at least one item");
      return;
    }


  const hasPending = selectedItemIds.some((itemId) => {
    const originalItem = items.find((i) => i.id === itemId);
    return originalItem?.approval_status === "pending";
  });

  if (hasPending) {
    toast.error(
      "One or more selected items are already pending approval. Please wait until they are processed.",
      { duration: 6000 }
    );
    return;
  }

    const payload: any[] = [];

    selectedItemIds.forEach((itemId) => {
      const originalItem = items.find((i) => i.id === itemId);
      const rowData = data[itemId] || {};

      const packagingSelect = rowData.packaging_select;
      const uoqSelect = rowData.uoq_select;
      const qtyInPackaging = rowData.qty_in_packaging
        ? Number(rowData.qty_in_packaging)
        : 1;

      if (!uoqSelect?.value) {
        toast.error(`Quantity unit is required for selected item`);
        return;
      }

      const effectivePackaging = packagingSelect || {
        value: "NT",
        label: "Net",
      };

      // 1. Packaging Unit (parent)
      payload.push({
        id: originalItem.packaging_unit?.uom_id || null,
        item_id: itemId,
        display_name: effectivePackaging.label,
        quantity_in_packaging: null,
        packaging_unit_code: effectivePackaging.value,
        is_sold: rowData.packaging_is_sold,
        is_purchased: rowData.packaging_is_purchased,
      });

      // 2. Quantity Unit (child)
      payload.push({
        id: originalItem.unit_of_quantity?.uom_id || null,
        item_id: itemId,
        display_name: uoqSelect.label,
        quantity_in_packaging: qtyInPackaging,
        quantity_unit_code: uoqSelect.value,
        parent_packaging_display_name: effectivePackaging.label,
        is_sold: rowData.uoq_is_sold,
        is_purchased: rowData.uoq_is_purchased,
      });
    });

    if (payload.length === 0) {
      toast.success("No changes to save");
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          `Successfully submitted uoms for approval`
        );
        setSelectedItemIds([]);
        router.push(routes.listUoms);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to submit UOM changes");
      },
    });
  };

  // Handle row selection
  const handleRowSelect = (selected: any[]) => {
    setSelectedItemIds(selected.map((row) => row.id));
  };

  return (
    <div>
      <PageHeader
        title="Manage UoMs"
        breadcrumb="Items"
        breadcrumbPath={routes.listUoms}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items..."
        searchWidth="w-52"
        buttons={[
          {
            label: "Save Selected",
            icon: Save,
            onClick: handleSubmit(onSubmit),
            variant: "primary",
            disabled: selectedItemIds.length === 0 || updateMutation.isPending,
          },
        ]}
      />

      <div className="mx-4">
        {/* Tabs */}
        <div className="mmb-5">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(key) => {
              setActiveTab(key);
              setSelectedItemIds([]);
              setCurrentPage(1);
            }}
          />
        </div>
        <TableSelectionSummaryBar
          selectedCount={selectedItemIds.length}
          totalAvailable={items.length}
          emptyMessage="Select items to set UoMs"
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ReusableTable
            data={tableData}
            columns={allColumns}
            loading={loadingItems || loadingOptions}
            enableRowSelection={true}
            onRowSelect={handleRowSelect}
            selectedIds={selectedItemIds}
            pagination={pagination}
            onPageChange={setCurrentPage}
            scopedColumns={{
              item_name: (row) => (
                <td>
                  {items[row.index]?.brand_name} {items[row.index]?.item_name || "--"}
                </td>
              ),
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default SetUoMsPage;
