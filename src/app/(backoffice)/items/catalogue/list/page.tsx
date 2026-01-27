"use client";

import BooleanBadge from "@/components/common/BooleanBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DropdownMenu } from "@/components/common/DropdownActionMenu";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import StatusBadge from "@/components/common/StatusBadge";
import Tabs from "@/components/common/Tabs";
import { routes } from "@/constants/routes";
import { useActivateItem, useItems } from "@/hooks/useItems";
import clsx from "clsx";
import {
  Ban,
  CheckCircle,
  FileText,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'inactive', label: 'Inactive' },
];
const COLUMNS = [
  { key: "full_name", label: "Item Name" },
  { key: "product_type", label: "Product Type" },
  { key: "tax_type", label: "Tax Type" },
  { key: "created_by", label: "Created By" },
  { key: "item_features", label: "Item Features" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const ItemsListPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deactivateItemId, setDeactivateItemId] = useState<string | null>(null);
  const [activateItemId, setActivateItemId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [activeTab]);



  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 10,
     status:activeTab
    }),
    [activeTab, debouncedSearch, currentPage]
  );

  const { data: response, isLoading } = useItems({ params });
  const activateMutation = useActivateItem();

  const items = response?.items || [];
  const counts = response?.counts || {
    all: 0,
    pending: 0,
    rejected: 0,
    inactive: 0,
  };
  const pagination = response?.pagination;

  const tableData = useMemo(() => {
    return items.map((item: any) => ({
      id: item.id,
      full_name:
        `${item.brand_name || ""} ${item.item_name || ""}`.trim() || "--",
      ...item,
    }));
  }, [items]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openDeactivateConfirmation = (itemId: string) => {
    setDeactivateItemId(itemId);
  };

  const closeDeactivateConfirmation = () => {
    setDeactivateItemId(null);
  };

  const confirmDeactivate = () => {
    if (!deactivateItemId) return;

    activateMutation.mutate(
      { itemId: deactivateItemId, status: "inactive" },
      {
        onSuccess: () => {
          toast.success("Item deactivated successfully!");
          closeDeactivateConfirmation();
        },
        onError: () => {
          toast.error("Failed to deactivate item");
        },
      }
    );
  };

  const openActivateConfirmation = (itemId: string) => {
    setActivateItemId(itemId);
  };

  const closeActivateConfirmation = () => {
    setActivateItemId(null);
  };

  const confirmActivate = () => {
    if (!activateItemId) return;

    activateMutation.mutate(
      { itemId: activateItemId, status: "active" },
      {
        onSuccess: () => {
          toast.success("Item activated successfully!");
          closeActivateConfirmation();
        },
        onError: () => {
          toast.error("Failed to activate item");
        },
      }
    );
  };

  const openItemDetails = (item: any) => {
    router.push(`/items/${item.id}`);
  };

  const renderActions = (item: any) => {
    if (activeTab === TABS.ALL) {
      return (
        <DropdownMenu
          trigger={
            <div>
              <MoreHorizontal className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
            </div>
          }
          items={[
            {
              label: item.is_active ? "Deactivate" : "Activate",
              icon: item.is_active ? (
                <CheckCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              ) : (
                <Ban className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              ),
              onClick: () => {
                if (item.is_active) {
                  openDeactivateConfirmation(item.id);
                } else {
                  openActivateConfirmation(item.id);
                }
              },
              resource: "items",
              action: "update",
            },
            // {
            //   label: "View Details",
            //   icon: <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />,
            //   onClick: () => openItemDetails(item),
            //   resource: "items",
            //   action: "read",
            // },
            // {
            //   label: "Logs",
            //   icon: <History className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />,
            //   onClick: () => router.push(`/items/catalogue/${item.id}/logs`),
            //   resource: "items",
            //   action: "read",
            // },
          ]}
        />
      );
    }

    if (activeTab === TABS.INACTIVE) {
      return (
        <button
          onClick={() => openActivateConfirmation(item.id)}
          className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm font-medium"
        >
          Activate
        </button>
      );
    }

    return null;
  };

  return (
    <div>
      <PageHeader
        title="Items"
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items..."
        searchWidth="w-52"
        buttons={[
          {
            label: "New Item",
            icon: Plus,
            onClick: () => router.push(routes.addItems),
            variant: "secondary",
          },
          {
            label: "Edit Items",
            icon: Pencil,
            onClick: () => router.push(routes.editItems),
            variant: "primary",
          },
          {
            label: "Approve Items",
            icon: CheckCircle,
            count: counts.pending + counts.rejected,
            onClick: () => router.push(routes.approveItems),
            variant: "accent",
          },
        ]}
      />
      <div className="mx-4 mt-10">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(key) => {
            setActiveTab(key);
            setSelectedRows([]);
          }}
        />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          enableRowSelection={
            activeTab === TABS.PENDING || activeTab === TABS.REJECTED
          }
          onRowSelect={(selected) =>
            setSelectedRows(selected.map((row: any) => row.id))
          }
          selectedIds={selectedRows}
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={isLoading}
          scopedColumns={{
            full_name: (item) => <td>{item.full_name}</td>,
            product_type: (item) => <td>{item.product_type_name || "--"}</td>,
            tax_type: (item) => <td>{item.tax_type_name || "--"}</td>,
            created_by: (item) => <td>{item.created_by || "--"}</td>,
            item_features: (item) => (
              <td className="flex flex-wrap gap-1.5">
                {item.is_sold && (
                 <BooleanBadge
                                   value={false}
                                   trueLabel="Sold"
                                   falseLabel="Sold"
                                 />
                )}
                {item.is_purchased && (
                  <BooleanBadge
                  value={false}
                  trueLabel="Purchased"
                  falseLabel="Purchased"
                />
                 
                )}
                {item.is_made_here && (
                      <BooleanBadge
                      value={false}
                      trueLabel="Made Here"
                      falseLabel="Made Here"
                    />
                  
                )}
                {item.tracks_stock && (
                      <BooleanBadge
                      value={false}
                      trueLabel="Tracks Stock"
                      falseLabel="Tracks Stock"
                    />
                  
                )}
              
              </td>
            ),
           
            status: (item) => {
            
              return (
                <td>
                  <StatusBadge status={item?.is_active ? "active": "inactive"}/>
                </td>
              );
            },

            actions: (item) => (
              <td className="text-center">{renderActions(item)}</td>
            ),
          }}
        />
      </div>

      {deactivateItemId && (
        <ConfirmDialog
          title="Deactivate Item"
          message={
            <p>
              Are you sure you want to <strong>deactivate</strong> this item?
              <br />
              It will no longer be available for use in transactions.
            </p>
          }
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          onConfirm={confirmDeactivate}
          onCancel={closeDeactivateConfirmation}
          destructive={true}
        />
      )}

      {activateItemId && (
        <ConfirmDialog
          title="Activate Item"
          message={
            <p>
              Are you sure you want to <strong>activate</strong> this item?
              <br />
              It will become available for use in transactions.
            </p>
          }
          confirmLabel="Activate"
          cancelLabel="Cancel"
          onConfirm={confirmActivate}
          onCancel={closeActivateConfirmation}
          destructive={false}
        />
      )}
    </div>
  );
};

export default ItemsListPage;