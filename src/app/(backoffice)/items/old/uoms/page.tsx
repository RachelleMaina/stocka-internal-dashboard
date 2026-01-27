"use client";

import UomForm from "@/components/backoffice/UomForm";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils/helpers";
import { Uom } from "@/types/item";
import { Edit, Plus, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const UomCard = ({
  uom,
  onDelete,
  onEdit,
}: {
  uom: Uom;
  onDelete: (uom: Uom) => void;
  onEdit: (uom: Uom) => void;
}) => {
  return (
<div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-start gap-2">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {uom?.packaging_units?.code_name} to{" "}
            {uom?.quantity_units?.code_name} (s)
          </h3>
        </div>
        

          <div className="flex gap-2">
              <Permission resource={"uoms"} action={"update"}>
          <button
            onClick={() => onEdit(uom)}
            className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200"
            aria-label="Edit"
          >
            <Edit className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            </Permission>
              <Permission resource={"uoms"} action={"delete"}>
          <button
            onClick={() => onDelete(uom)}
            className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
            </Permission>
        </div>
        </div>
           </div>
      <div>
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 line-clamp-1">
            1 {uom?.packaging_units?.code_name} ={" "}
            {formatNumber(uom?.conversion_factor)}{" "}
            {uom?.quantity_units?.code_name} (s)
          </span>
        </div>
   
      </div>
  );
};

const Uoms: React.FC = () => {
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUom, setCurrentUom] = useState<Uom | null>(null);
  const [uomToDelete, setUomToDelete] = useState<Uom | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchUoms();
  }, []);

  const fetchUoms = async () => {
    try {
      const response = await api.get(`/api/uoms`);
      const uoms = response.data.data;
      setUoms(uoms);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };
  const handleSaveUom = async (uom: Uom) => {
    setOperationLoading(true);
    if (currentUom) {
      try {
        await api.patch(`/api/uoms/${currentUom.id}`, uom);
        toast.success("Uom updated.");
        setIsFormOpen(false);
        setCurrentUom(null); // Reset form and state
        fetchUoms(); // Fetch updated list ofuoms
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to update uom.");
      } finally {
        setOperationLoading(false);
      }
    } else {
      try {
        await api.post(`/api/uoms`, uom);
        toast.success("Uom created.");
        setIsFormOpen(false);
        setCurrentUom(null); // Reset form and state
        fetchUoms(); // Fetch updated list ofuoms
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to create uom.");
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const openAddForm = () => {
    setIsFormOpen(true);
  };

  const openEditForm = (uom: Uom) => {
    setCurrentUom(uom);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (uom: Uom) => {
    setUomToDelete(uom);
    setIsDeleteOpen(true);
  };

  const handleDeleteUom = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.delete(`/api/uoms/${id}`);
      toast.success("Uom deleted.");
      setIsDeleteOpen(false);
      setUomToDelete(null);
      fetchUoms();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete uom.");
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "buying_unit",
      label: "Buying Units",
      render: (uom: Uom) => (
        <div className="font-medium flex flex-col gap-1">
          {uom.packaging_units?.code_name}
        </div>
      ),
    },
    {
      key: "selling_unit",
      label: "Selling/Usage Units",
      render: (uom: Uom) => (
        <div className="font-medium flex flex-col gap-1">
          {uom.quantity_units?.code_name}
        </div>
      ),
    },
    {
      key: "conversion_factor",
      label: "Conversion Factor",
      render: (uom: Uom) => (
        <div className="font-medium flex flex-col gap-1">
          {formatNumber(uom?.conversion_factor)}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (uom: Uom) => {
        return (
          <div className="flex items-center gap-2 justify-end">
             <Permission resource={"uoms"} action={"update"}>
            <button
              onClick={() => openEditForm(uom)}
                       className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition" >
              <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </button>
            </Permission>
              <Permission resource={"uoms"} action={"delete"}>
            <button
              onClick={() => openDeleteConfirmation(uom)}
                          className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition" aria-label="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </Permission>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
     <Permission resource={"uoms"} action={"read"} isPage={true}>
    <div className="h-full">
      <BreadcrumbWithActions
        label="Add Uom"
        breadcrumbs={[
          { name: "Items", onClick: () => router.push(routes.items) },
          { name: "Uoms" },
        ]}
        actions={[
          {
            title: "Add Uom",
            icon:<Plus/>,
            onClick: openAddForm,
            resource: "uoms",
            action: "create"
          },
        ]}
      />

      <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
        {uoms.length > 0 ? (
          <ReusableTable
            data={uoms}
            columns={columns}
            
            renderCard={(uom: Uom) => (
              <UomCard
                key={uom.id}
                uom={uom}
                onEdit={() => openEditForm(uom)}
                onDelete={() => openDeleteConfirmation(uom)}
              />
            )}
          />
        ) : (
          <PageEmptyState icon={Shield} description="No uoms found." />
        )}
      </div>

      {isFormOpen && (
        <UomForm
          uomConfig={currentUom}
          onSave={handleSaveUom}
          onClose={() => {
            setIsFormOpen(false);
            setCurrentUom(null);
          }}
        />
      )}
      {isDeleteOpen && uomToDelete && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={
            <>
              Are you sure you want to delete the uom{" "}
              <strong>
                {uomToDelete.packaging_units?.[0]?.code_name} -{" "}
                {uomToDelete.quantity_units?.[0]?.code_name}
              </strong>
              ?
            </>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive
          onConfirm={() => handleDeleteUom(uomToDelete.id)}
          onCancel={() => {
            setIsDeleteOpen(false);
            setUomToDelete(null);
          }}
        />
      )}
    </div>
    </Permission>
  );
};

export default Uoms;
