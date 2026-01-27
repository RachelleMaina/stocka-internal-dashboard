// app/backoffice/credit_notes/page.tsx
"use client";

import CreditNoteDetailsModal from "@/components/backoffice/ProductDetails";
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
import { CreditNote } from "@/types/credit_note";
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



export default function CreditNotesPage() {
  const [credit_notes, setCreditNotes] = useState<CreditNote[]>([]);
  const [currentCreditNote, setCurrentCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [kraLoading, setKraLoading] = useState(false);
  const [showCreditNoteDetails, setShowCreditNoteDetails] = useState<CreditNote | null>(null);
 
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);

  const [credit_noteToAdjust, setCreditNoteToAdjust] = useState<CreditNote | null>(null);
  const [selectedKraCreditNote, setSelectedKraCreditNote] = useState<CreditNote | null>(null);
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
    totalCreditNotes: 0,
    totalPages: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);

  const { backoffice_user_profile } = useAppState();
   const store_location_id = backoffice_user_profile?.store_location_id;
  const isKraRegistered = true;

  const router = useRouter();

  const fetchCreditNotes = useCallback(
    async (page: number, search: string) => {
      try {
        const response = await api.get(endpoints.getEtimsCreditNotes(store_location_id), {
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

        setCreditNotes(data);
        setPagination(pag);
        setCount(pag?.totalCreditNotes || 0);
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
    [category?.value, type?.value, pagination.limit, status, store_location_id]
  );

  // Debounced fetchCreditNotes function
  const debouncedfetchCreditNotes = useCallback(
    debounce((page: number, searchTerm: string) => {
      fetchCreditNotes(page, searchTerm);
    }, 300),
    [fetchCreditNotes]
  );

  // useEffect to trigger fetchCreditNotes on relevant changes
  useEffect(() => {
    debouncedfetchCreditNotes(currentPage, search);
    return () => {
      debouncedfetchCreditNotes.cancel(); // Cancel pending debounced calls on cleanup
    };
  }, [currentPage, debouncedfetchCreditNotes, search, category, status]);

 

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  const openAddForm = () => {
    router.push(`${routes.simpleCreditNoteForm}`);
  };

 

  const openStockAdjustModal = useCallback((credit_note: CreditNote) => {
    setCreditNoteToAdjust(credit_note);
    setAdjustmentType("ADD");
    setMovementType(null);
    setQuantity(0);
    setShowStockAdjustModal(true);
  }, []);

 

  const onCloseCreditNoteDetails = () => {
    setCurrentCreditNote(null);
    setShowCreditNoteDetails(null);
  };



  const handleAdjustStock = async () => {
    if (!movementType || quantity <= 0) {
      toast.error("Please select movement type and enter a valid quantity.");
      return;
    }

    setOperationLoading(true);
    try {

      const payload = {
          credit_note_id: credit_noteToAdjust?.id,
          action: adjustmentType,
        movement_type: movementType.value, 
        quantity,
      };
      const response = await api.put(endpoints.etimsStockAdjust(store_location_id), payload);
     
      toast.success("Stock adjusted successfully.");
      setShowStockAdjustModal(false);
      setCreditNoteToAdjust(null);
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
         key: "date",
         label: "Date",
         render: (sale: Sale) => {
         
           return (
             <div className="flex sales-center gap-3">
               
               <div className="flex flex-col gap-1 text-neutral-800 dark:text-neutral-100">
                 <p className="font-medium truncate">{sale.date}</p>
              
               </div>
             </div>
           );
         },
       },
       {
         key: "time",
         label: "Time",
         render: (sale: Sale) => (
           <span className="inline-flex sales-center gap-1 text-neutral-800 dark:text-neutral-100">
            
             {sale?.time}
           </span>
         ),
       },
       {
         key: "receipt_no",
         label: "Receipt No.",
         render: (sale: Sale) => (
         <span className="text-neutral-800 dark:text-neutral-100">
             {sale?.receipt_number}
           </span>
         ),
       },
       {
         key: "invoice_no",
         label: "Invoice No.",
         render: (sale: Sale) => (
           <span className="text-neutral-800 dark:text-neutral-100">
             {sale?.invoice_number}
           </span>
         ),
       },
          {
         key: "status",
         label: "Status",
         render: (sale: Sale) => (
           <span className="text-neutral-800 dark:text-neutral-100">
             {sale?.status}
           </span>
         ),
       },
          {
         key: "sale_qty",
         label: "Stock Qty",
         render: (sale: Sale) => {
         
           return (
             <div className="flex sales-center gap-3">
               
               <div className="flex sales-center gap-1 text-neutral-800 dark:text-neutral-100">
                 <p className="font-medium truncate">{sale.stock_quantity}</p>
                   <button
               onClick={() => openStockAdjustModal(sale)}
               className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200 dark:hover:bg-neutral-700"
               aria-label="Adjust Stock"
             >
               <Edit className="w-4 h-4" />
             </button>
               </div>
             </div>
           );
         },
       },
     ];
 
  
 
 
     return [...baseColumns];
   }, [
     
    
     router,
  
   ]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"credit_notes"} action={"read"} isPage={true}>
      <div className="h-full ">
        <div className="">
          <BreadcrumbWithActions
            label="New CreditNote"
            breadcrumbs={[
              { name: "CreditNotes", onClick: () => router.push(routes.credit_notes) },
              { name: `CreditNotes List (${count})` },
            ]}
            actions={[
              {
                title: "Add CreditNote",
                icon: <Plus className="w-4 h-4" />,
                onClick: openAddForm,
                resource: "credit_notes",
                action: "create",
              },
         
            ]}
          />
        </div>
        <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
        
          {credit_notes.length > 0 ? (
            <ReusableTable
              data={credit_notes}
              columns={columns}
              pageSize={pagination.limit}
              pagination={{ ...pagination, currentPage }}
              onPageChange={handlePageChange}
           
            />
          ) : (
            <PageEmptyState icon={Package} description="No credit_notes found." />
          )}
        </div>

        {showCreditNoteDetails && currentCreditNote && (
          <CreditNoteDetailsModal
            credit_noteId={currentCreditNote.id}
            onClose={onCloseCreditNoteDetails}
          />
        )}

      
     

        {showStockAdjustModal && credit_noteToAdjust && (
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
                      {credit_noteToAdjust.stock_quantity}
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
                      {credit_noteToAdjust.stock_quantity +
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
              setCreditNoteToAdjust(null);
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