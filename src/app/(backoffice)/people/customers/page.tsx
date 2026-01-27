"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CustomerForm from "@/components/backoffice/CustomerForm";
import PageEmptyState from "@/components/common/EmptyPageState";
import { FilterBar } from "@/components/common/FilterBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { Customer } from "@/types/customer";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { Edit, Plus, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [kraLoading, setKraLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isKraModalOpen, setIsKraModalOpen] = useState(false);
  const [selectedKraCustomer, setSelectedKraCustomer] =
    useState<Customer | null>(null);
  const [modalKraPin, setModalKraPin] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<boolean | null>(true);
  const [isEtimsRegistered, setIsEtimsRegistered] = useState<boolean | null>(
    null
  );
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);

  const { backoffice_user_profile } = useAppState();
  const isKraRegistered = true; // Assuming business is KRA-registered, similar to ItemsPage

  const router = useRouter();

  const fetchCustomers = useCallback(
    async (page: number, search: string) => {
      try {
        const response = await api.get(endpoints.getCustomers(), {
          params: {
            status,
            is_etims_registered: isEtimsRegistered,
            search,
            page,
            limit: pagination?.limit,
          },
        });
        const { data, pagination: pag } = response?.data?.data;
        setCustomers(data);
        setPagination(pag);
        setCount(pag?.totalItems || 0);
        setLoading(false);
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message || "Failed to fetch customers."
        );
        setLoading(false);
      }
    },
    [pagination?.limit, status, isEtimsRegistered]
  );

  const debouncedFetchCustomers = useCallback(
    debounce((page: number, searchTerm: string) => {
      fetchCustomers(page, searchTerm);
    }, 300),
    [fetchCustomers]
  );

  useEffect(() => {
    debouncedFetchCustomers(currentPage, search);
    return () => {
      debouncedFetchCustomers.cancel();
    };
  }, [currentPage, debouncedFetchCustomers, search, status, isEtimsRegistered]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1);
    debouncedFetchCustomers(1, searchTerm);
  };

  const openAddForm = () => {
    setCurrentCustomer(null);
    setIsFormOpen(true);
  };

  const openEditForm = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const openKraModal = (customer: Customer) => {
    setSelectedKraCustomer(customer);
    setModalKraPin(customer.kra_pin || null);
    setIsKraModalOpen(true);
  };

  const handleSaveCustomer = async (customerData: {
    customer_name: string;
    contact_phone: string;
    contact_email: string | null;
    address: string | null;
    kra_pin: string | null;
  }) => {
    setOperationLoading(true);
    try {
      if (currentCustomer) {
        // Update
        await api.put(
          endpoints.updateCustomer(currentCustomer.id),
          customerData
        );
        toast.success("Customer updated successfully.");
      } else {
        // Create
        await api.post(endpoints.createCustomer(), {
          ...customerData,
          business_location_id: backoffice_user_profile?.business_location_id,
        });
        toast.success("Customer created successfully.");
      }
      setIsFormOpen(false);
      setCurrentCustomer(null);
      fetchCustomers(currentPage, search);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${currentCustomer ? "update" : "create"} customer.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setOperationLoading(true);
    try {
      await api.patch(endpoints.deactivateCustomer(customerToDelete.id));
      toast.success("Customer deleted successfully.");
      setIsDeleteOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(currentPage, search);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete customer."
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleKraPush = async () => {
    if (!modalKraPin) {
      toast.error("Please provide a KRA PIN.");
      return;
    }

    setKraLoading(true);
    try {
      const kraPayload = {
        kra_pin: modalKraPin,
        customer_id: selectedKraCustomer?.id,
      };

      let response;
      const hasEtimsId = !!selectedKraCustomer?.etims_customer_id;
      if (hasEtimsId) {
        response = await api.patch(
          endpoints.updateEtimsCustomer(selectedKraCustomer!.id),
          kraPayload
        );
      } else {
        response = await api.post(endpoints.createEtimsCustomer(), kraPayload);
      }

      const updatedCustomer = response.data.data;
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedKraCustomer?.id ? updatedCustomer : c
        )
      );
      toast.success(
        `Customer ${
          hasEtimsId ? "updated" : "registered"
        } in eTIMS successfully.`
      );
      setIsKraModalOpen(false);
      setSelectedKraCustomer(null);
      setModalKraPin(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to push to KRA.");
    } finally {
      setKraLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Customer Name",
        render: (customer: Customer) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {customer.customer_name}
            </span>
          </div>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        render: (customer: Customer) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {customer.contact_phone}
            </span>
          </div>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (customer: Customer) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {customer.contact_email || "No email"}
          </span>
        ),
      },
      {
        key: "address",
        label: "Address",
        render: (customer: Customer) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {customer.address || "No address"}
          </span>
        ),
      },
      {
        key: "kra_pin",
        label: "KRA PIN",
        render: (customer: Customer) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {customer.kra_pin || "No KRA PIN"}
          </span>
        ),
      },

      {
        key: "status",
        label: "Status",
        align: "center",
        render: (customer: Customer) => (
          <span
            className={clsx(
              "inline-flex px-2 py-1 rounded-full text-xs font-medium",
              customer.is_active ? " text-green-500" : " text-red-500"
            )}
          >
            {customer.is_active ? "Active" : "Deactivated"}
          </span>
        ),
      },
      {
        key: "created",
        label: "Created",
        align: "center",
        render: (customer: Customer) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {new Date(customer.created_at).toLocaleDateString()}
          </span>
        ),
      },
    {
  key: "etims",
  label: "ETIMS",
  align: "center",
  render: (customer: Customer) => {
    if (!isKraRegistered) {
      return <span className="text-neutral-500 text-xs">—</span>;
    }

    const isLoading =
      kraLoading && selectedKraCustomer?.id === customer.id;

    if (customer.is_etims_registered) {
      return (
        <span className="text-xs font-medium text-green-500">
          Registered
        </span>
      );
    }

    return (
      <Permission resource="customers" action="update">
        <button
          onClick={() => openKraModal(customer)}
          disabled={isLoading}
          className={clsx(
            "text-xs font-medium text-primary underline",
            isLoading && "opacity-60"
          )}
        >
          {isLoading ? "Syncing..." : "Register"}
        </button>
      </Permission>
    );
  },
},
      {
        key: "actions",
        label: "Actions",
        align: "right",
        render: (customer: Customer) => (
          <div className="flex items-center gap-2 justify-end">
            <Permission resource="customers" action="update">
              <button
                onClick={() => openEditForm(customer)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-600"
                aria-label="Edit customer"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Permission>
            <Permission resource="customers" action="delete">
              <button
                onClick={() => openDeleteConfirmation(customer)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-600"
                aria-label="Delete customer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </Permission>
          </div>
        ),
      },
    ],
    [
      isKraRegistered,
      kraLoading,
      selectedKraCustomer?.id,
      openEditForm,
      openDeleteConfirmation,
      openKraModal,
    ]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="customers" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="New Customer"
          breadcrumbs={[
            { name: "Customers", onClick: () => router.push(routes.customers) },
            { name: `Customers List (${count})` },
          ]}
          actions={[
            {
              title: "Add Customer",
              icon: <Plus className="w-4 h-4" />,
              onClick: openAddForm,
              resource: "customers",
              action: "create",
            },
          ]}
        />
        <div className="p-3 bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="p-3">
            <FilterBar
              isActive={status}
              onToggleActive={(value) => setStatus(value)}
              isEtimsRegistered={isEtimsRegistered}
              onToggleIsEtimsRegistered={(value) => setIsEtimsRegistered(value)}
              searchQuery={search}
              onSearchChange={handleSearchChange}
              facets={[]}
            />
          </div>
          {customers?.length > 0 ? (
            <ReusableTable
              data={customers}
              columns={columns}
              pageSize={pagination?.limit}
              pagination={{ ...pagination, currentPage }}
              onPageChange={handlePageChange}
            />
          ) : (
            <PageEmptyState
              icon={User}
              description="No customers found."
              action={{
                label: "Add Customer",
                onClick: openAddForm,
                resource: "customers",
                action: "create",
              }}
            />
          )}
        </div>

        {isFormOpen && (
          <CustomerForm
            customer={currentCustomer}
            operationLoading={operationLoading}
            onSave={handleSaveCustomer}
            onClose={() => {
              setIsFormOpen(false);
              setCurrentCustomer(null);
            }}
          />
        )}

        {isDeleteOpen && customerToDelete && (
          <ConfirmDialog
            title="Delete Customer"
            message={
              <>
                Are you sure you want to delete the customer{" "}
                <strong>{customerToDelete.customer_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleDeleteCustomer}
            onCancel={() => {
              setIsDeleteOpen(false);
              setCustomerToDelete(null);
            }}
            loading={operationLoading}
          />
        )}

        {isKraModalOpen && selectedKraCustomer && (
          <ConfirmDialog
            title={
              selectedKraCustomer.etims_customer_id
                ? "Update Customer in KRA"
                : "Register Customer in KRA"
            }
            message={
              <div className="space-y-4">
                <p>
                  Please confirm the KRA PIN for{" "}
                  {selectedKraCustomer.etims_customer_id
                    ? "updating"
                    : "registering"}{" "}
                  the customer in eTIMS:
                </p>
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    KRA PIN
                  </label>
                  <input
                    type="text"
                    value={modalKraPin || ""}
                    onChange={(e) => setModalKraPin(e.target.value || null)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A123456789B"
                  />
                </div>
              </div>
            }
            confirmLabel="Push to KRA"
            cancelLabel="Cancel"
            onConfirm={handleKraPush}
            onCancel={() => {
              setIsKraModalOpen(false);
              setSelectedKraCustomer(null);
              setModalKraPin(null);
            }}
            loading={kraLoading}
          />
        )}
      </div>
    </Permission>
  );
}
