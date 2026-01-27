"use client";
import { useState, useCallback } from "react";
import AsyncSelect from "react-select/async";
import Skeleton from "react-loading-skeleton";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { debounce } from "lodash";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { selectStyles } from "@/lib/utils/helpers";

interface AddStockTakeItemFormProps {
  storeLocationId: string;
  onSave: (item_id: string) => void;
  onClose: () => void;
}

const AddStockTakeItemForm: React.FC<AddStockTakeItemFormProps> = ({
  storeLocationId,
  onSave,
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = useState<{ value: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = async (searchTerm: string) => {
    if (searchTerm) {
      try {
        const response = await api.get(`/api/store-locations/${storeLocationId}/items`, {
          params: { search: searchTerm },
        });
        return response.data.data.map((item: any) => ({
          value: item.id,
          label: item.item_name,
        }));
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load items");
        return [];
      }
    }
  };

  const debouncedFetchItems = useCallback(
  
    debounce((inputValue: string, callback: (options: any) => void) => {
      fetchItems(inputValue).then(callback);
    }, 300),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   if(selectedItem) onSave(selectedItem.value);
     
  };

 

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-md shadow-lg [--bg:#ffffff] [--border:#e5e7eb] [--border-hover:#d1d5db] [--bg-selected:#f3f4f6] [--bg-hover:#f9fafb] [--text:#1f2937] [--text-hover:#111827] [--text-placeholder:#6b7280] dark:[--bg:#1f2937] dark:[--border:#4b5563] dark:[--border-hover:#6b7280] dark:[--bg-selected:#374151] dark:[--bg-hover:#4b5563] dark:[--text:#f3f4f6] dark:[--text-hover:#ffffff] dark:[--text-placeholder:#9ca3af]"
        aria-live="polite"
      >
        <ModalHeader title="Add Item to Stock Take" onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Item Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Select Item
            </label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={debouncedFetchItems}
              onChange={(option) => setSelectedItem(option)}
              placeholder="Search for an item..."
              styles={selectStyles}
              isClearable
              isDisabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <NeutralButton onClick={onClose} disabled={loading}>
              Cancel
            </NeutralButton>
            <PrimaryButton disabled={!selectedItem || loading}>
              Add Item
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockTakeItemForm;