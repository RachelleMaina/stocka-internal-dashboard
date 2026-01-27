"use client";

import CreateAccountForm from "@/components/common/CreateAccountForm";
import Modal from "@/components/common/Modal";
import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import TableSelectionSummaryBar from "@/components/common/TableSelectionSummaryBar";
import Tabs from "@/components/common/Tabs";
import { useAccounts, useCreateAccount, useUpdateAccount } from "@/hooks/useAccounts";

import clsx from "clsx";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Tab {
  key: string;
  label: string;
}

const TABS: Tab[] = [
  { key: "all", label: "All Accounts" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { key: "account_name", label: "Account Name" },
  { key: "owner_name", label: "Owner" },
  { key: "contact_email", label: "Email" },
  { key: "contact_phone", label: "Phone" },
  { key: "industry", label: "Industry" },
  { key: "outlets_count", label: "Outlets" },
  { key: "status", label: "Status" },
];

const AccountsPage = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState<Tab["key"]>("all");

  // Search (debounced)
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query params
  const queryParams = useMemo(
    () => ({
      status: activeTab === "all" ? undefined : activeTab,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 20,
    }),
    [activeTab, debouncedSearch, currentPage]
  );

  // Hooks
  const { data: accountsResponse, isLoading } = useAccounts({ params: queryParams });
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();

  const accounts = accountsResponse?.accounts || [];
  const pagination = accountsResponse?.pagination;

  // Transform for table
  const tableData = useMemo(() => {
    return accounts.map((account) => ({
      ...account,
      owner_name: `${account.first_name} ${account.last_name}`,
      rawAccount: account,
    }));
  }, [accounts]);

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (row: any) => {
    setSelectedAccount(row.rawAccount);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleSubmit = async (payload: any) => {
    try {
      if (selectedAccount) {
        await updateAccountMutation.mutateAsync({
          id: selectedAccount.id,
          ...payload,
        });
        toast.success("Account updated successfully");
      } else {
        await createAccountMutation.mutateAsync(payload);
        toast.success("Account created successfully");
      }
      handleModalClose();
    } catch (error) {
      toast.error(selectedAccount ? "Failed to update account" : "Failed to create account");
      throw error;
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title="Accounts"
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search accounts..."
        searchWidth="w-72"
        buttons={[
          {
            label: "Create Account",
            icon: Plus,
            onClick: handleCreateAccount,
            variant: "primary",
          },
        ]}
      />

      <div className="mx-4">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <TableSelectionSummaryBar
          selectedCount={0}
          totalAvailable={accounts.length}
          emptyMessage="No accounts found. Click 'Create Account' to get started."
        />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          loading={isLoading}
          onRowClick={handleRowClick}
          clickableRows
          pagination={pagination}
          onPageChange={setCurrentPage}
          scopedColumns={{
            account_name: (row) => (
              <td className="underline text-primary hover:text-primary/80 cursor-pointer font-medium">
                {row.account_name}
              </td>
            ),
            industry: (row) => (
              <td>
                <span className="capitalize">
                  {row.industry?.replace(/_/g, " ")}
                </span>
              </td>
            ),
            outlets_count: (row) => (
              <td className="text-center">
                {row.outlets_count || 0}
              </td>
            ),
            status: (row) => (
              <td>
                <span
                  className={clsx(
                    "px-3 py-1 text-xs font-medium rounded-full",
                    row.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                      : "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200"
                  )}
                >
                  {row.status || "active"}
                </span>
              </td>
            ),
          }}
          emptyMessage="No accounts found in this filter. Try changing tab or search."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedAccount ? `Edit Account: ${selectedAccount.account_name}` : "Create New Account"}
        size="xl"
        height="full"
      >
        <CreateAccountForm
          onSubmit={handleSubmit}
          onCancel={handleModalClose}
          initialData={selectedAccount}
          isLoading={createAccountMutation.isPending || updateAccountMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default AccountsPage;