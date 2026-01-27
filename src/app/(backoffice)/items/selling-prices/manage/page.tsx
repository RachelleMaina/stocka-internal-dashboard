"use client";

import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import TableSelectionSummaryBar from "@/components/common/TableSelectionSummaryBar";
import Tabs from "@/components/common/Tabs";
import { routes } from "@/constants/routes";
import { useBulkUpdateSellingPrice, useSellingPrices } from "@/hooks/useItems";
import { useSalesChannels } from "@/hooks/useSettings";
import { getItemName } from "@/lib/utils/helpers";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

const TABS = [
  { key: "all", label: "All" },
  { key: "with_uoms", label: "With UoMs" },
  { key: "without_uoms", label: "Missing UoMs" },
];

const EditSellingPricesPage = () => {
  const router = useRouter();

  // Search states
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<keyof typeof TABS>("all");

  // Selection state (using item_uom_option_id)
  const [selectedUomOptionIds, setSelectedUomOptionIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch sales channels
  const { data: channelsResponse, isLoading: loadingChannels } = useSalesChannels();
  const salesChannels = channelsResponse?.sales_channels || [];

  // Debounce search & reset on tab/search change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setSelectedUomOptionIds([]);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update params when tab changes
  const params = useMemo(
    () => ({
      limit: 20,
      status: "active",
      search: debouncedSearch || undefined,
      page: currentPage,
      price_status: activeTab === "all" ? undefined : activeTab.toLowerCase(),
    }),
    [debouncedSearch, currentPage, activeTab]
  );

  const { data: itemsResponse, isLoading: loadingItems } = useSellingPrices({
    params,
  });

  const bulkUpdate = useBulkUpdateSellingPrice();

  const items = itemsResponse?.items || [];
  const pagination = itemsResponse?.pagination;

  const { control, handleSubmit, setValue, reset } = useForm();

  // Auto-populate form with existing prices — per channel
  useEffect(() => {
    if (!items.length || !salesChannels.length) return;

    reset();

    items.forEach((item: any) => {
      const uomOptionId = item.id;

      (item.prices || []).forEach((price: any) => {
        const channelId =
          price.sales_channel_id ||
          price.channel_id ||
          price.sales_channel?._id ||
          price.sales_channel?.id;

        if (channelId) {
          const fieldName = `${uomOptionId}.channel_${channelId}`;
          setValue(fieldName, price.selling_price || "");
        }
      });
    });
  }, [items, salesChannels, setValue, reset]);

  // Dynamic columns — one per sales channel
  const dynamicColumns = useMemo(() => {
    return salesChannels.map((channel: any) => {
      const channelId = channel._id || channel.id || channel.sales_channel_id;
      const channelName = channel.name || channel.channel_name || channel.code || "Unnamed";

      return {
        key: `channel_${channelId}`,
        label: channelName,
        render: (row: any) => {
          const uomOptionId = row.id;
          const isSelected = selectedUomOptionIds.includes(uomOptionId);
          const currentPrice = row[`channel_${channelId}`] ?? null;

          return (
            <td className="text-center">
              {isSelected ? (
                <Controller
                  control={control}
                  name={`${uomOptionId}.channel_${channelId}`}
                  defaultValue={currentPrice ?? ""}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      className="w-28 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mx-auto text-neutral-900 dark:text-neutral-100"
                    />
                  )}
                />
              ) : (
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  {currentPrice != null
                    ? `KES ${Number(currentPrice).toLocaleString()}`
                    : "--"}
                </span>
              )}
            </td>
          );
        },
      };
    });
  }, [control, selectedUomOptionIds, salesChannels]);

  const allColumns = useMemo(
    () => [{ key: "item_name", label: "Item Name" }, ...dynamicColumns],
    [dynamicColumns]
  );

  const tableData = useMemo(() => {
    return items.map((item: any) => {
      const row: any = {
        id: item.id,
        item_id: item.item_id,
        item_name: getItemName(item),
      };

      salesChannels.forEach((channel: any) => {
        const channelId = channel._id || channel.id || channel.sales_channel_id;
        const priceObj = item.prices?.find((p: any) => {
          const pChannelId =
            p.sales_channel_id ||
            p.channel_id ||
            p.sales_channel?._id ||
            p.sales_channel?.id;
          return pChannelId === channelId;
        });

        row[`channel_${channelId}`] = priceObj?.selling_price ?? null;
      });

      return row;
    });
  }, [items, salesChannels]);

  const onSubmit = (data: any) => {
    const updates: any[] = [];

    selectedUomOptionIds.forEach((uomOptionId) => {
      const formData = data[uomOptionId];
      if (!formData) return;

      const row = tableData.find((r) => r.id === uomOptionId);
      if (!row) return;

      salesChannels.forEach((channel: any) => {
        const channelId = channel._id || channel.id || channel.sales_channel_id;
        const fieldKey = `channel_${channelId}`;
        const sellingPrice = formData[fieldKey];

        if (
          sellingPrice !== "" &&
          sellingPrice !== undefined &&
          sellingPrice !== null
        ) {
          updates.push({
            item_id: row.item_id,
            item_uom_option_id: uomOptionId,
            sales_channel_id: channelId,           // ← changed from pricing_tier_code
            display_name: channel.name || channel.channel_name || "Channel Price",
            selling_price: Number(sellingPrice),
            is_active: true,
            sort_order: 999,
            notes: null,
          });
        }
      });
    });

    if (updates.length === 0) {
      toast.success("No price changes to save");
      return;
    }

    if (updates.length > 200) {
      toast.error("Cannot update more than 200 prices at once");
      return;
    }

    bulkUpdate.mutate(updates, {
      onSuccess: (response: any) => {
        const pendingCount = response?.pending?.length || 0;
        if (pendingCount > 0) {
          toast("Some prices are pending approval", { duration: 6000 });
        } else {
          toast.success(`${updates.length} prices updated successfully!`);
        }
        setSelectedUomOptionIds([]);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update prices");
      },
    });
  };

  // Handle row selection
  const handleRowSelect = (selected: any[]) => {
    setSelectedUomOptionIds(selected.map((row) => row.id));
  };

  const isLoading = loadingItems || (salesChannels.length === 0 && !loadingChannels);

  return (
    <div>
      <PageHeader
        title="Manage Selling Prices"
        breadcrumb="Items"
        breadcrumbPath={routes.listSellingPrices}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items..."
        searchWidth="w-72"
        buttons={[
          {
            label: "Save Selected",
            icon: Save,
            onClick: handleSubmit(onSubmit),
            variant: "primary",
            disabled: selectedUomOptionIds.length === 0 || bulkUpdate.isPending,
          },
        ]}
      />
      <div className="mx-4">
        {/* Tabs */}
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(key) => {
            setActiveTab(key);
            setSelectedUomOptionIds([]);
          }}
        />

        <TableSelectionSummaryBar
          selectedCount={selectedUomOptionIds.length}
          totalAvailable={items.length}
          emptyMessage="Select items to edit prices"
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ReusableTable
            data={tableData}
            columns={allColumns}
            loading={isLoading}
            enableRowSelection={true}
            onRowSelect={handleRowSelect}
            selectedIds={selectedUomOptionIds}
            pagination={pagination}
            onPageChange={setCurrentPage}
            scopedColumns={{
              item_name: (row) => (
                <td className="font-medium">{row.item_name}</td>
              ),
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default EditSellingPricesPage;