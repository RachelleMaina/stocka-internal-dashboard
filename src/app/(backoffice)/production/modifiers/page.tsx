"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import ModifierForm from "@/components/backoffice/ModifierForm";
import { endpoints } from "@/constants/endpoints";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { Modifier, ModifierGroup } from "@/types/item";
import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import PageEmptyState from "@/components/common/EmptyPageState";
import { routes } from "@/constants/routes";
import { useRouter } from "next/navigation";

const ModifierCard = ({
  modifier,
  onEdit,
  onDelete,
}: {
  modifier: Modifier;
  onEdit: (modifier: Modifier) => void;
  onDelete: (modifier: Modifier) => void;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {modifier.modifier_name}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Group: {modifier.group_name} • Price Change: KES{" "}
            {modifier.price_change}
            {modifier.linked_item_name &&
              ` • Linked Item: ${modifier.linked_item_name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Permission resource={"modifiers"} action={"update"}>
            <button
              onClick={() => onEdit(modifier)}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              aria-label="Edit"
            >
              <Edit className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"modifiers"} action={"delete"}>
            <button
              onClick={() => onDelete(modifier)}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              aria-label="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </Permission>
        </div>
      </div>
    </div>
  );
};

const Modifiers: React.FC = () => {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentModifier, setCurrentModifier] = useState<Modifier | null>(null);
  const [modifierToDelete, setModifierToDelete] = useState<Modifier | null>(
    null
  );
  const { backoffice_business_location } = useAppState();

  const router = useRouter();
  
  useEffect(() => {
    fetchModifierGroups();
    fetchModifiers();
  }, [selectedGroupId]);

  const fetchModifierGroups = async () => {
    try {
      const response = await api.get(endpoints.getModifierGroups);
      setModifierGroups(response.data.data);
    } catch (error: any) {
      console.log(error);
      toast.error("Failed to fetch modifier groups.");
    }
  };

  const fetchModifiers = async () => {
    try {
      const response = await api.get(endpoints.getModifiers, {
        params: { group_id: selectedGroupId },
      });
      const modifiers = response.data.data;
      setModifiers(modifiers);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleSaveModifier = async (modifier: {
    group_id: string;
    modifier_name: string;
    linked_item_id?: string;
    price_change: number;
  }) => {
    setOperationLoading(true);
    if (currentModifier) {
      try {
        await api.put(endpoints.updateModifier(currentModifier.id), modifier);
        toast.success("Modifier updated.");
        setIsFormOpen(false);
        setCurrentModifier(null);
        fetchModifiers();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to update modifier."
        );
      } finally {
        setOperationLoading(false);
      }
    } else {
      try {
        await api.post(endpoints.createModifier, modifier);
        toast.success("Modifier created.");
        setIsFormOpen(false);
        setCurrentModifier(null);
        fetchModifiers();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to create modifier."
        );
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const openAddForm = () => {
    setIsFormOpen(true);
  };

  const openEditForm = (modifier: Modifier) => {
    setCurrentModifier(modifier);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (modifier: Modifier) => {
    setModifierToDelete(modifier);
    setIsDeleteOpen(true);
  };

  const handleDeleteModifier = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.delete(endpoints.deactivateModifier(id));
      toast.success("Modifier deleted.");
      setIsDeleteOpen(false);
      setModifierToDelete(null);
      fetchModifiers();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete modifier."
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "modifier_name",
      label: "Modifier Name",
      render: (modifier: Modifier) => (
        <div className="flex flex-col gap-1">{modifier.modifier_name}</div>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (modifier: Modifier) => (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Group: {modifier.group_name} • Price Change: KES{" "}
            {modifier.price_change}
            {modifier.linked_item_name &&
              ` • Linked Item: ${modifier.linked_item_name}`}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (modifier: Modifier) => (
        <div className="flex items-center gap-2 justify-end">
          <Permission resource={"modifiers"} action={"update"}>
            <button
              onClick={() => openEditForm(modifier)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="Edit"
            >
              <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"modifiers"} action={"delete"}>
            <button
              onClick={() => openDeleteConfirmation(modifier)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
        </div>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"modifiers"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Modifier"
          breadcrumbs={[
            {
              name: "Production",
              onClick: () => router.push(routes.production),
            },
            { name: "Modifiers" },
          ]}
          actions={[
            {
              title: "New Modifier",
              onClick: openAddForm,
              icon: <Plus className="w-4 h-4" />,
              resource: "modifiers",
              action: "create",
            },
          ]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Filter by Modifier Group
            </label>
            <Select
              options={[
                { value: "", label: "All Groups" },
                ...modifierGroups.map((group) => ({
                  value: group.id,
                  label: group.group_name,
                })),
              ]}
              value={
                selectedGroupId
                  ? {
                      value: selectedGroupId,
                      label:
                        modifierGroups.find(
                          (group) => group.id === selectedGroupId
                        )?.group_name || "All Groups",
                    }
                  : { value: "", label: "All Groups" }
              }
              onChange={(option) => setSelectedGroupId(option?.value || null)}
              className="my-react-select-container"
              classNamePrefix="my-react-select"
              placeholder="Select a group"
            />
          </div>

          {modifiers.length > 0 ? (
            <ReusableTable
              data={modifiers}
              columns={columns}
              renderCard={(modifier: Modifier) => (
                <ModifierCard
                  key={modifier.id}
                  modifier={modifier}
                  onEdit={() => openEditForm(modifier)}
                  onDelete={() => openDeleteConfirmation(modifier)}
                />
              )}
            />
          ) : (
            <PageEmptyState icon={Plus} description="No modifiers found." />
          )}
        </div>

        {isFormOpen && (
          <ModifierForm
            modifier={currentModifier}
            modifierGroups={modifierGroups}
            operationLoading={operationLoading}
            onSave={handleSaveModifier}
            onClose={() => {
              setIsFormOpen(false);
              setCurrentModifier(null);
            }}
          />
        )}

        {isDeleteOpen && modifierToDelete && (
          <ConfirmDialog
            title="Confirm Deletion"
            message={
              <>
                Are you sure you want to delete the modifier{" "}
                <strong>{modifierToDelete.modifier_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleDeleteModifier(modifierToDelete.id)}
            onCancel={() => {
              setIsDeleteOpen(false);
              setModifierToDelete(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

export default Modifiers;
