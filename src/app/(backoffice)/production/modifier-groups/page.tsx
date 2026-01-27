
"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import ModifierGroupForm from "@/components/backoffice/ModifierGroupForm";
import ItemModifierGroupForm from "@/components/backoffice/ItemModifierGroupForm";
import { endpoints } from "@/constants/endpoints";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { ModifierGroup } from "@/types/item";
import { Edit, Link, Plus, Trash2, Unlink, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageEmptyState from "@/components/common/EmptyPageState";
import { routes } from "@/constants/routes";
import { useRouter } from "next/navigation";

interface LinkedItem {
  id: string;
  item_name: string;
}


const ModifierGroupCard = ({
  modifierGroup,
  linkedItems,
  onEdit,
  onDelete,
  onLinkItems,
  onUnlinkItem,
}: {
  modifierGroup: ModifierGroup;
  linkedItems: LinkedItem[];
  onEdit: (modifierGroup: ModifierGroup) => void;
  onDelete: (modifierGroup: ModifierGroup) => void;
  onLinkItems: (modifierGroup: ModifierGroup) => void;
  onUnlinkItem: (group_id: string, item_id: string) => void;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {modifierGroup.group_name}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {modifierGroup.is_required ? "Required" : "Optional"} • Min: {modifierGroup.min_choices} • Max: {modifierGroup.max_choices}
          </p>
        </div>
        <div className="flex gap-2">
          <Permission resource={"modifier_groups"} action={"update"}>
            <button
              onClick={() => onEdit(modifierGroup)}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              aria-label="Edit"
            >
              <Edit className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"modifier_groups"} action={"update"}>
            <button
              onClick={() => onLinkItems(modifierGroup)}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              aria-label="Link Items"
            >
              <Link className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"modifier_groups"} action={"delete"}>
            <button
              onClick={() => onDelete(modifierGroup)}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              aria-label="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </Permission>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Linked Items</h4>
        {linkedItems.length > 0 ? (
          <ul className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {linkedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 py-1">
                {item.item_name}
                <Permission resource={"modifier_groups"} action={"update"}>
                  <button
                    onClick={() => onUnlinkItem(modifierGroup.id, item.id)}
                    className="p-1 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                    aria-label="Unlink"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </Permission>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">No items linked</p>
        )}
      </div>
    </div>
  );
};

const ModifierGroups: React.FC = () => {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [linkedItems, setLinkedItems] = useState<{ [key: string]: LinkedItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentModifierGroup, setCurrentModifierGroup] = useState<ModifierGroup | null>(null);
  const [modifierGroupToDelete, setModifierGroupToDelete] = useState<ModifierGroup | null>(null);
  const { backoffice_business_location } = useAppState();

    const router = useRouter();

  useEffect(() => {
    fetchModifierGroups();
  }, []);

  const fetchModifierGroups = async () => {
    try {
      const response = await api.get(endpoints.getModifierGroups);
      const modifierGroups = response.data.data;
      setModifierGroups(modifierGroups);
      // Fetch linked items for each group
      const linkedItemsData: { [key: string]: LinkedItem[] } = {};
      for (const group of modifierGroups) {
        const itemsResponse = await api.get(endpoints.getLinkedItemsForModifierGroup(group.id));
        linkedItemsData[group.id] = itemsResponse.data.data;
      }
      setLinkedItems(linkedItemsData);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleSaveModifierGroup = async (modifierGroup: {
    group_name: string;
    is_required: boolean;
    min_choices: number;
    max_choices: number;
  }) => {
    setOperationLoading(true);
    if (currentModifierGroup) {
      try {
        await api.put(endpoints.updateModifierGroup(currentModifierGroup.id), modifierGroup);
        toast.success("Modifier group updated.");
        setIsFormOpen(false);
        setCurrentModifierGroup(null);
        fetchModifierGroups();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to update modifier group.");
      } finally {
        setOperationLoading(false);
      }
    } else {
      try {
        await api.post(endpoints.createModifierGroup, modifierGroup);
        toast.success("Modifier group created.");
        setIsFormOpen(false);
        setCurrentModifierGroup(null);
        fetchModifierGroups();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to create modifier group.");
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const openAddForm = () => {
    setIsFormOpen(true);
  };

  const openEditForm = (modifierGroup: ModifierGroup) => {
    setCurrentModifierGroup(modifierGroup);
    setIsFormOpen(true);
  };

  const openLinkForm = (modifierGroup: ModifierGroup) => {
    setCurrentModifierGroup(modifierGroup);
    setIsLinkFormOpen(true);
  };

  const openDeleteConfirmation = (modifierGroup: ModifierGroup) => {
    setModifierGroupToDelete(modifierGroup);
    setIsDeleteOpen(true);
  };

  const handleDeleteModifierGroup = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.delete(endpoints.deactivateModifierGroup(id));
      toast.success("Modifier group deleted.");
      setIsDeleteOpen(false);
      setModifierGroupToDelete(null);
      fetchModifierGroups();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete modifier group.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleLinkItems = async (group_id: string, item_ids: string[]) => {
    setOperationLoading(true);
    try {
      for (const item_id of item_ids) {
        await api.post(endpoints.linkModifierGroupToItem, { item_id, group_id });
      }
      toast.success("Items linked successfully.");
      setIsLinkFormOpen(false);
      setCurrentModifierGroup(null);
      fetchModifierGroups();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to link items.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleUnlinkItem = async (group_id: string, item_id: string) => {
    setOperationLoading(true);
    try {
      await api.delete(endpoints.unlinkModifierGroupFromItem, { data: { item_id, group_id } });
      toast.success("Item unlinked successfully.");
      fetchModifierGroups();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to unlink item.");
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "group_name",
      label: "Group Name",
      render: (modifierGroup: ModifierGroup) => (
        <div className="flex flex-col gap-1">{modifierGroup.group_name}</div>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (modifierGroup: ModifierGroup) => (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {modifierGroup.is_required ? "Required" : "Optional"} • Min: {modifierGroup.min_choices} • Max: {modifierGroup.max_choices}
          </p>
        </div>
      ),
    },
    {
      key: "linked_items",
      label: "Linked Items",
      render: (modifierGroup: ModifierGroup) => (
        <div className="flex flex-col gap-1">
          {linkedItems[modifierGroup.id]?.length > 0 ? (
            <ul className="text-sm text-neutral-600 dark:text-neutral-400">
              {linkedItems[modifierGroup.id].map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  {item.item_name}
                  <Permission resource={"modifier_groups"} action={"update"}>
                    <button
                      onClick={() => handleUnlinkItem(modifierGroup.id, item.id)}
                      className="p-1 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                      aria-label="Unlink"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </Permission>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No items linked</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (modifierGroup: ModifierGroup) => (
        <div className="flex items-center gap-2 justify-end">
          <Permission resource={"modifier_groups"} action={"update"}>
            <button
              onClick={() => openEditForm(modifierGroup)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="Edit"
            >
              <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"modifier_groups"} action={"update"}>
            <button
              onClick={() => openLinkForm(modifierGroup)}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              aria-label="Link Items"
            >
              <Link className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          <Permission resource={"modifier_groups"} action={"delete"}>
            <button
              onClick={() => openDeleteConfirmation(modifierGroup)}
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
    <Permission resource={"modifier_groups"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Modifier Group"
          breadcrumbs={[   { name: "Production", onClick: () => router.push(routes.production) },{ name: "Modifier Groups" }]}
          actions={[
            {
              title: "New Modifier Group",
              onClick: openAddForm,
              icon: <Plus className="w-4 h-4" />,
              resource: "modifier_groups",
              action: "create",
            },
          ]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {modifierGroups.length > 0 ? (
            <ReusableTable
              data={modifierGroups}
              columns={columns}
              renderCard={(modifierGroup: ModifierGroup) => (
                <ModifierGroupCard
                     key={modifierGroup.id}
      modifierGroup={modifierGroup}
      linkedItems={linkedItems[modifierGroup.id] || []}
      onEdit={() => openEditForm(modifierGroup)}
      onDelete={() => openDeleteConfirmation(modifierGroup)}
      onLinkItems={() => openLinkForm(modifierGroup)}
      onUnlinkItem={handleUnlinkItem}
                />
              )}
            />
          ) : (
            <PageEmptyState
              icon={Plus}
              description="No modifier groups found."
            />
          )}
        </div>

        {isFormOpen && (
          <ModifierGroupForm
            modifierGroup={currentModifierGroup}
            onSave={handleSaveModifierGroup}
            onClose={() => {
              setIsFormOpen(false);
              setCurrentModifierGroup(null);
            }}
          />
        )}

        {isLinkFormOpen && currentModifierGroup && (
          <ItemModifierGroupForm
            modifierGroup={currentModifierGroup}
            linkedItems={linkedItems[currentModifierGroup.id] || []}
            onSave={handleLinkItems}
            onClose={() => {
              setIsLinkFormOpen(false);
              setCurrentModifierGroup(null);
            }}
          />
        )}

        {isDeleteOpen && modifierGroupToDelete && (
          <ConfirmDialog
            title="Confirm Deletion"
            message={
              <>
                Are you sure you want to delete the modifier group{" "}
                <strong>{modifierGroupToDelete.group_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleDeleteModifierGroup(modifierGroupToDelete.id)}
            onCancel={() => {
              setIsDeleteOpen(false);
              setModifierGroupToDelete(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

export default ModifierGroups;
