"use client";

import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { useSellingPrices } from "@/hooks/useItems";
import { useSalesChannels } from "@/hooks/useSettings";
import { getItemName } from "@/lib/utils/helpers";
import { CheckCircle, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SellingPricesListPage = () => {
  const router = useRouter();

  // Search states
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch sales channels
  const { data: channelsResponse, isLoading: loadingChannels } = useSalesChannels();
  const salesChannels = channelsResponse?.sales_channels || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading: pricesLoading } = useSellingPrices({
    params: {
      limit: 20,
      price_status: "priced",
      search: debouncedSearch || undefined,
      page: currentPage,
    },
  });

  const items = response?.items || [];
  const pagination = response?.pagination;

  // Build dynamic columns from sales channels
  const dynamicColumns = useMemo(() => {
    return salesChannels.map((channel: any) => ({
      key: `channel_${channel._id || channel.id || channel.sales_channel_id}`,
      label: channel.name || channel.channel_name || channel.code || "Unnamed Channel",
    }));
  }, [salesChannels]);

  const allColumns = useMemo(() => [
    { key: "item_name", label: "Item Name" },
    ...dynamicColumns,
  ], [dynamicColumns]);

  // Transform data: extract selling price per channel
  const tableData = useMemo(() => {
    return items.map((item: any) => {
      const row: any = {
        id: item.id,
        item_name: getItemName(item),
      };

      salesChannels.forEach((channel: any) => {
        const channelId = channel._id || channel.id || channel.sales_channel_id;
        const key = `channel_${channelId}`;

        const priceObj = item.prices?.find((p: any) => {
          const priceChannelId = p.sales_channel_id || p.channel_id || p.sales_channel?._id;
          return priceChannelId === channelId;
        });

        row[key] = priceObj?.selling_price ?? null;
      });

      return row;
    });
  }, [items, salesChannels]);

  const isLoading = pricesLoading || loadingChannels;

  return (
    <div>
      <PageHeader
        title="Selling Prices"
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items..."
        searchWidth="w-72"
        buttons={[
          {
            label: "Manage Prices",
            icon: Settings,
            onClick: () => router.push(routes.addSellingPrices),
            variant: "primary",
          },
          {
            label: "Approve Prices",
            icon: CheckCircle,
            onClick: () => router.push(routes.approveSellingPrices),
            variant: "accent",
          },
        ]}
      />

      <div className="mx-4 mt-5">
        <div className="border-b border-neutral-200 dark:border-neutral-700 mt-10" />

        <ReusableTable
          data={tableData}
          columns={allColumns}
          loading={isLoading}
          pagination={pagination}
          onPageChange={setCurrentPage}
          scopedColumns={{
            item_name: (row) => (
              <td>{row.item_name}</td>
            ),
            ...salesChannels.reduce((acc, channel) => {
              const channelId = channel._id || channel.id || channel.sales_channel_id;
              const key = `channel_${channelId}`;

              acc[key] = (row: any) => {
                const price = row[key];
                return (
                  <td>
                    {price != null ? `KES ${Number(price).toLocaleString()}` : "—"}
                  </td>
                );
              };
              return acc;
            }, {} as Record<string, (row: any) => JSX.Element>),
          }}
          emptyMessage={
            loadingChannels
              ? "Loading sales channels..."
              : "No selling prices configured yet."
          }
        />
      </div>
    </div>
  );
};

export default SellingPricesListPage;