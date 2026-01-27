"use client";
import Skeleton from "react-loading-skeleton";
import { useState, useEffect } from "react";
import Select from "react-select";
import { Category } from "../../types/category";
import { StoreLocation } from "../../types/storeLocation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";
import { StockTake } from "@/types/stockTake";
import { selectStyles } from "@/lib/utils/helpers";

interface StockTakeFormProps {
  stockTake: StockTake;
  onSave: (payload: { id: string; locationId: string; categoryIds?: string[] }) => void;
  onClose: () => void;
}

const StockTakeForm: React.FC<StockTakeFormProps> = ({ stockTake, onSave, onClose }) => {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationsAndCategories();
  }, []);

  const fetchLocationsAndCategories = async () => {
    try {
      const [locationsResponse, categoriesResponse] = await Promise.all([
        api.get("/api/store-locations"),
        api.get("/api/categories"),
      ]);
      setLocations(locationsResponse.data.data);
      setCategories(categoriesResponse.data.data);
      setLoading(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load data");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) {
      toast.error("Please select a location");
      return;
    }
    onSave({
      id: stockTake?.id,
      locationId,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    });
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-md shadow-lg [--bg:#ffffff] [--border:#e5e7eb] [--border-hover:#d1d5db] [--bg-selected:#f3f4f6] [--bg-hover:#f9fafb] [--text:#1f2937] [--text-hover:#111827] dark:[--bg:#1f2937] dark:[--border:#4b5563] dark:[--border-hover:#6b7280] dark:[--bg-selected:#374151] dark:[--bg-hover:#4b5563] dark:[--text:#f3f4f6] dark:[--text-hover:#ffffff]">
        <ModalHeader title="New Stock Take" onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Location Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Store Location
            </label>
            {loading ? (
              <Skeleton height={38} className="rounded-md" />
            ) : locations.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No locations available
              </p>
            ) : (
              <Select
                options={locations.map((loc) => ({
                  value: loc.id,
                  label: `${loc.store_location_name} (${loc.item_count})`,
                }))}
                onChange={(option) => setLocationId(option?.value || null)}
                placeholder="Select a location"
                styles={selectStyles}
                isClearable
              />
            )}
          </div>

          {/* Category Selection */}
          {locationId && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Categories (Optional)
              </label>
              {loading ? (
                <Skeleton height={38} className="rounded-md" />
              ) : categories.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No categories available
                </p>
              ) : (
                <Select
                  isMulti
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.category_name,
                  }))}
                  onChange={(options) => setCategoryIds(options.map((opt) => opt.value))}
                  placeholder="Select categories"
                  styles={selectStyles}
                  isClearable
                />
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <NeutralButton onClick={onClose}>Cancel</NeutralButton>
            <PrimaryButton disabled={!locationId}>Create Entry</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTakeForm;