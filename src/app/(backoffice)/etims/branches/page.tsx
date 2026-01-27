// app/backoffice/branches/page.tsx
"use client";

import SupplierDetailsModal from "@/components/backoffice/ProductDetails";
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
import { Branch } from "@/types/branch";
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



export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentSupplier, setCurrentSupplier] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [kraLoading, setKraLoading] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState<Branch | null>(null);
 
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);

  const [supplierToAdjust, setSupplierToAdjust] = useState<Branch | null>(null);
  const [selectedKraSupplier, setSelectedKraSupplier] = useState<Branch | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "REDUCE">("ADD");
  const [movementType, setMovementType] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<any>(null);
  const [type, setType] = useState<any>(null);
  const [status, setStatus] = useState<boolean | null>(true);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [pagination, setPagination] = useState({
    totalBranches: 0,
    totalPages: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);

  const { backoffice_user_profile } = useAppState();
   const store_location_id = backoffice_user_profile?.store_location_id;
  const isKraRegistered = true;

  const router = useRouter();

  const fetchBranches = useCallback(
    async (page: number, search: string) => {
      try {
        const response = await api.get(endpoints.getEtimsBranches(store_location_id), {
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

        setBranches(data);
        setPagination(pag);
        setCount(pag?.totalBranches || 0);
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
    [category?.value, type?.value, pagination?.limit, status, store_location_id]
  );

  // Debounced fetchBranches function
  const debouncedfetchBranches = useCallback(
    debounce((page: number, searchTerm: string) => {
      fetchBranches(page, searchTerm);
    }, 300),
    [fetchBranches]
  );

  // useEffect to trigger fetchBranches on relevant changes
  useEffect(() => {
    debouncedfetchBranches(currentPage, search);
    return () => {
      debouncedfetchBranches.cancel(); // Cancel pending debounced calls on cleanup
    };
  }, [currentPage, debouncedfetchBranches, search, category, status]);

 

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  const openAddForm = () => {
    router.push(`${routes.simpleSupplierForm}`);
  };

 

  const openStockAdjustModal = useCallback((branch: Branch) => {
    setSupplierToAdjust(branch);
    setAdjustmentType("ADD");
    setMovementType(null);
    setQuantity(0);
    setShowStockAdjustModal(true);
  }, []);

 

  const onCloseSupplierDetails = () => {
    setCurrentSupplier(null);
    setShowSupplierDetails(null);
  };



  const handleAdjustStock = async () => {
    if (!movementType || quantity <= 0) {
      toast.error("Please select movement type and enter a valid quantity.");
      return;
    }

    setOperationLoading(true);
    try {

      const payload = {
          supplier_id: supplierToAdjust?.id,
          action: adjustmentType,
        movement_type: movementType.value, 
        quantity,
      };
      const response = await api.put(endpoints.etimsStockAdjust(store_location_id), payload);
     
      toast.success("Stock adjusted successfully.");
      setShowStockAdjustModal(false);
      setSupplierToAdjust(null);
      setAdjustmentType("ADD");
      setMovementType(null);
      setQuantity(0);
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
        key: "branch_office_id",
        label: "ID",
        render: (branch: Branch) => {
        
          return (
            <div className="flex branches-center gap-3">
              
              <div className="flex flex-col gap-1 text-neutral-800 dark:text-neutral-100">
                <p className="font-medium truncate">{branch.branch_office_id}</p>
             
              </div>
            </div>
          );
        },
      },
         {
        key: "branch_office_name",
        label: "Name",
        render: (branch: Branch) => {
        
          return (
            <div className="flex branches-center gap-3">
              
              <div className="flex flex-col gap-1 text-neutral-800 dark:text-neutral-100">
                <p className="font-medium truncate">{branch.branch_office_name}</p>
             
              </div>
            </div>
          );
        },
      },
    
      {
        key: "manager_email",
        label: "Email",
        render: (branch: Branch) => (
          <span className="text-neutral-800 dark:text-neutral-100">
            {branch?.manager_email}
          </span>
        ),
      },
       {
        key: "manager_contact",
        label: "Phone",
        render: (branch: Branch) => (
          <span className="text-neutral-800 dark:text-neutral-100">
            {branch?.manager_contact}
          </span>
        ),
      },
        {
        key: "tax_pin",
        label: "PIN",
        render: (branch: Branch) => (
          <span className="inline-flex branches-center gap-1 text-neutral-800 dark:text-neutral-100">
           
            {branch?.tax_pin}
          </span>
        ),
      },
   
        {
        key: "sub_county_name",
        label: "County",
        render: (branch: Branch) => (
          <span className="text-neutral-800 dark:text-neutral-100">
            {branch?.sub_county_name}
          </span>
        ),
      },
         {
        key: "tax_locality_name",
        label: "Locality",
        render: (branch: Branch) => (
          <span className="text-neutral-800 dark:text-neutral-100">
            {branch?.tax_locality_name}
          </span>
        ),
      },
    ];

 


    return [...baseColumns];
  }, [
    isKraRegistered,
    kraLoading,
    selectedKraSupplier?.id,
    router,
    openStockAdjustModal,
  ]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"branches"} action={"read"} isPage={true}>
      <div className="h-full ">
        <div className="">
          <BreadcrumbWithActions
            label="New Branch"
            breadcrumbs={[
              { name: "Branches", onClick: () => router.push(routes.branches) },
              { name: `Branches List (${count})` },
            ]}
            actions={[
              {
                title: "Add Branch",
                icon: <Plus className="w-4 h-4" />,
                onClick: openAddForm,
                resource: "branches",
                action: "create",
              },
         
            ]}
          />
        </div>
        <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
        
          {branches.length > 0 ? (
            <ReusableTable
              data={branches}
              columns={columns}
              pageSize={pagination?.limit}
              pagination={{ ...pagination, currentPage }}
              onPageChange={handlePageChange}
           
            />
          ) : (
            <PageEmptyState icon={Package} description="No branches found." />
          )}
        </div>

        {showSupplierDetails && currentSupplier && (
          <SupplierDetailsModal
            supplierId={currentSupplier.id}
            onClose={onCloseSupplierDetails}
          />
        )}

      
     

        {showStockAdjustModal && supplierToAdjust && (
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
                      setAdjustmentType(option?.value as "ADD" | "REDUCE")
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
                    options={allMovementOptions}
                    value={movementType}
                    onChange={setMovementType}
                    placeholder="Select movement type"
                    className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Current Quantity
                    </label>
                    <p className="text-neutral-800 dark:text-neutral-100">
                      {supplierToAdjust.stock_quantity}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Quantity After Adjustment
                    </label>
                    <p
                      className={clsx(
                        "font-medium",
                        adjustmentType === "ADD" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {supplierToAdjust.stock_quantity +
                        (adjustmentType === "ADD" ? quantity : -quantity)}
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
              setSupplierToAdjust(null);
              setAdjustmentType("ADD");
              setMovementType(null);
              setQuantity(0);
            }}
            loading={operationLoading}
          />
        )}
      </div>
    </Permission>
  );
}