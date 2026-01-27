"use client";

import BooleanBadge from "@/components/common/BooleanBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { useApproveUoMs, useItemUomList } from "@/hooks/useItems";
import { getItemName } from "@/lib/utils/helpers";
import { CheckCircle, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";


const COLUMNS = [
  { key: "item_uom_name", label: "Item" },
  { key: "level", label: "Level" },
  { key: "purchased", label: "Purchased" },
  { key: "sold", label: "Sold" },
];

const UoMsListPage = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
    }),
    [debouncedSearch]
  );

  const { data: response, isLoading } = useItemUomList({params});
  const pagination = response?.pagination;
  const approveMutation = useApproveUoMs();

  const uoms = useMemo(() => response?.uoms || [], [response]);

  const tableData = useMemo(() => {
    return uoms.map((uom: any) => {
      return {
        id: uom.id,
        item_uom_name: getItemName(uom),
        purchased: uom.is_purchased,
        sold: uom.is_sold,
        status: uom.approval_status,
        item_id: uom.item_id,
        uom_id: uom.id,
        level: uom.level,
      };
    });
  }, [uoms]);

  const confirmApprove = () => {
    approveMutation.mutate(selectedRows, {
      onSuccess: () => {
        toast.success(`${selectedRows.length} UoM(s) approved successfully!`);
        setSelectedRows([]);
        setShowConfirm(false);
      },
      onError: () => {
        toast.error("Failed to approve UoMs");
        setShowConfirm(false);
      },
    });
  };

  const selectedCount = selectedRows.length;



  return (
    <div>
      <PageHeader
        title="Units of Measure"
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search uoms..."
        searchWidth="w-52"
        buttons={[
          {
            label: "Manage Uoms",
            icon: Settings,
            onClick: () => router.push(routes.manageUoms),
            variant: "primary",
          },
          {
            label: "Approve Uoms",
            icon: CheckCircle,
            onClick: () => router.push(routes.approveUoms),
            variant: "accent",
          },
        ]}
      />
      <div className="mx-4">
        <div className="border-b border-neutral-200 dark:border-neutral-700 mt-10" />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          loading={isLoading}
          pagination={pagination}
          scopedColumns={{
            item_uom_name: (row) => (
              <td className="font-medium text-neutral-900 dark:text-neutral-100">
                {row.brand_name} {row.item_uom_name}
              </td>
            ),

            level: (row) => (
              <td className="text-neutral-800 dark:text-neutral-200 capitalize">
                {row.level || "--"}
              </td>
            ),

            purchased: (row) => {
              return (
                <td>
                  <BooleanBadge
                    value={row.purchased}
                    trueLabel="Purchased"
                    falseLabel="Not Purchased"
                  />
                </td>
              );
            },

            sold: (row) => {
              return (
                <td>
                  <BooleanBadge
                    value={row.sold}
                    trueLabel="Sold"
                    falseLabel="Not Sold"
                  />
                </td>
              );
            },
          }}
        />
      </div>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Approve UoMs"
          message={
            <p>
              Are you sure you want to approve <strong>{selectedCount}</strong>{" "}
              UoM(s)?
            </p>
          }
          confirmLabel="Approve"
          cancelLabel="Cancel"
          onConfirm={confirmApprove}
          onCancel={() => setShowConfirm(false)}
          destructive={false}
        />
      )}
    </div>
  );
};

export default UoMsListPage;
