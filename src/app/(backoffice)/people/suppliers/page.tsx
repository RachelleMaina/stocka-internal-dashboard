"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import { FilterBar } from "@/components/common/FilterBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import SupplierForm from "@/components/backoffice/SupplierForm";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { Supplier } from "@/types/supplier";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { Edit, Plus, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [kraLoading, setKraLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isKraModalOpen, setIsKraModalOpen] = useState(false);
  const [selectedKraSupplier, setSelectedKraSupplier] =
    useState<Supplier | null>(null);
  const [modalKraPin, setModalKraPin] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
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

  const fetchSuppliers = useCallback(
    async (page: number, search: string) => {
      try {
        const response = await api.get(endpoints.getSuppliers(), {
          params: {
            status,
            is_etims_registered: isEtimsRegistered,
            search,
            page,
            limit: pagination?.limit,
          },
        });
        const { data, pagination: pag } = response?.data?.data;
        setSuppliers(data);
        setPagination(pag);
        setCount(pag?.totalItems || 0);
        setLoading(false);
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message || "Failed to fetch suppliers."
        );
        setLoading(false);
      }
    },
    [pagination?.limit, status, isEtimsRegistered]
  );

  const debouncedFetchSuppliers = useCallback(
    debounce((page: number, searchTerm: string) => {
      fetchSuppliers(page, searchTerm);
    }, 300),
    [fetchSuppliers]
  );

  useEffect(() => {
    debouncedFetchSuppliers(currentPage, search);
    return () => {
      debouncedFetchSuppliers.cancel();
    };
  }, [currentPage, debouncedFetchSuppliers, search, status, isEtimsRegistered]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1);
    debouncedFetchSuppliers(1, searchTerm);
  };

  const openAddForm = () => {
    setCurrentSupplier(null);
    setIsFormOpen(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteOpen(true);
  };

  const openKraModal = (supplier: Supplier) => {
    setSelectedKraSupplier(supplier);
    setModalKraPin(supplier.kra_pin || null);
    setIsKraModalOpen(true);
  };

  const handleSaveSupplier = async (supplierData: {
    supplier_name: string;
    contact_phone: string;
    contact_email: string | null;
    address: string | null;
    kra_pin: string | null;
  }) => {
    setOperationLoading(true);
    try {
      if (currentSupplier) {
        // Update
        await api.put(
          endpoints.updateSupplier(currentSupplier.id),
          supplierData
        );
        toast.success("Supplier updated successfully.");
      } else {
        // Create
        await api.post(endpoints.createSupplier(), {
          ...supplierData,
          business_location_id: backoffice_user_profile?.business_location_id,
        });
        toast.success("Supplier created successfully.");
      }
      setIsFormOpen(false);
      setCurrentSupplier(null);
      fetchSuppliers(currentPage, search);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${currentSupplier ? "update" : "create"} supplier.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    setOperationLoading(true);
    try {
      await api.patch(endpoints.deactivateSupplier(supplierToDelete.id));
      toast.success("Supplier deleted successfully.");
      setIsDeleteOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers(currentPage, search);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete supplier."
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
        supplier_id: selectedKraSupplier?.id,
      };

      let response;
      const hasEtimsId = !!selectedKraSupplier?.etims_supplier_id;
      if (hasEtimsId) {
        response = await api.patch(
          endpoints.updateEtimsSupplier(selectedKraSupplier!.id),
          kraPayload
        );
      } else {
        response = await api.post(endpoints.createEtimsSupplier(), kraPayload);
      }

      const updatedSupplier = response.data.data;
      setSuppliers((prev) =>
        prev.map((c) =>
          c.id === selectedKraSupplier?.id ? updatedSupplier : c
        )
      );
      toast.success(
        `Supplier ${
          hasEtimsId ? "updated" : "registered"
        } in eTIMS successfully.`
      );
      setIsKraModalOpen(false);
      setSelectedKraSupplier(null);
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
        label: "Supplier Name",
        render: (supplier: Supplier) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {supplier.supplier_name}
            </span>
          </div>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        render: (supplier: Supplier) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {supplier.contact_phone}
            </span>
          </div>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (supplier: Supplier) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {supplier.contact_email || "No email"}
          </span>
        ),
      },
      {
        key: "address",
        label: "Address",
        render: (supplier: Supplier) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {supplier.address || "No address"}
          </span>
        ),
      },
      {
        key: "kra_pin",
        label: "KRA PIN",
        render: (supplier: Supplier) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {supplier.kra_pin || "No KRA PIN"}
          </span>
        ),
      },

      {
        key: "status",
        label: "Status",
        align: "center",
        render: (supplier: Supplier) => (
          <span
            className={clsx(
              "inline-flex px-2 py-1 rounded-full text-xs font-medium",
              supplier.is_active ? " text-green-500" : " text-red-500"
            )}
          >
            {supplier.is_active ? "Active" : "Deactivated"}
          </span>
        ),
      },
      {
        key: "created",
        label: "Created",
        align: "center",
        render: (supplier: Supplier) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {new Date(supplier.created_at).toLocaleDateString()}
          </span>
        ),
      },
    {
  key: "etims",
  label: "ETIMS",
  align: "center",
  render: (supplier: Supplier) => {
    if (!isKraRegistered) {
      return <span className="text-neutral-500 text-xs">—</span>;
    }

    const isLoading =
      kraLoading && selectedKraSupplier?.id === supplier.id;

    if (supplier.is_etims_registered) {
      return (
        <span className="text-xs font-medium text-green-500">
          Registered
        </span>
      );
    }

    return (
      <Permission resource="suppliers" action="update">
        <button
          onClick={() => openKraModal(supplier)}
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
        render: (supplier: Supplier) => (
          <div className="flex items-center gap-2 justify-end">
            <Permission resource="suppliers" action="update">
              <button
                onClick={() => openEditForm(supplier)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-600"
                aria-label="Edit supplier"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Permission>
            <Permission resource="suppliers" action="delete">
              <button
                onClick={() => openDeleteConfirmation(supplier)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-600"
                aria-label="Delete supplier"
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
      selectedKraSupplier?.id,
      openEditForm,
      openDeleteConfirmation,
      openKraModal,
    ]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="suppliers" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="New Supplier"
          breadcrumbs={[
            { name: "Suppliers", onClick: () => router.push(routes.suppliers) },
            { name: `Suppliers List (${count})` },
          ]}
          actions={[
            {
              title: "Add Supplier",
              icon: <Plus className="w-4 h-4" />,
              onClick: openAddForm,
              resource: "suppliers",
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
          {suppliers?.length > 0 ? (
            <ReusableTable
              data={suppliers}
              columns={columns}
              pageSize={pagination?.limit}
              pagination={{ ...pagination, currentPage }}
              onPageChange={handlePageChange}
            />
          ) : (
            <PageEmptyState
              icon={User}
              description="No suppliers found."
              action={{
                label: "Add Supplier",
                onClick: openAddForm,
                resource: "suppliers",
                action: "create",
              }}
            />
          )}
        </div>

        {isFormOpen && (
          <SupplierForm
            supplier={currentSupplier}
            operationLoading={operationLoading}
            onSave={handleSaveSupplier}
            onClose={() => {
              setIsFormOpen(false);
              setCurrentSupplier(null);
            }}
          />
        )}

        {isDeleteOpen && supplierToDelete && (
          <ConfirmDialog
            title="Delete Supplier"
            message={
              <>
                Are you sure you want to delete the supplier{" "}
                <strong>{supplierToDelete.supplier_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={handleDeleteSupplier}
            onCancel={() => {
              setIsDeleteOpen(false);
              setSupplierToDelete(null);
            }}
            loading={operationLoading}
          />
        )}

        {isKraModalOpen && selectedKraSupplier && (
          <ConfirmDialog
            title={
              selectedKraSupplier.etims_supplier_id
                ? "Update Supplier in KRA"
                : "Register Supplier in KRA"
            }
            message={
              <div className="space-y-4">
                <p>
                  Please confirm the KRA PIN for{" "}
                  {selectedKraSupplier.etims_supplier_id
                    ? "updating"
                    : "registering"}{" "}
                  the supplier in eTIMS:
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
              setSelectedKraSupplier(null);
              setModalKraPin(null);
            }}
            loading={kraLoading}
          />
        )}
      </div>
    </Permission>
  );
}
