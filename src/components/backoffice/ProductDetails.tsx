
import React, { useEffect, useState } from "react";
import ModalHeader from "../common/ModalHeader";
import { formatNumber } from "@/lib/utils/helpers";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import PageSkeleton from "../common/PageSkeleton";

type ItemDetailModalProps = {
  itemId: string;
  onClose: () => void;
};

interface ModifierGroup {
  id: string;
  group_name: string;
  is_required: boolean;
  min_choices: number;
  max_choices: number;
}

interface Item {
  id: string;
  item_name: string;
  category_name?: string;
  sku?: string;
  product_code: string;
  country_code: string;
  buying_price: number | null;
  selling_price: number | null;
  base_price: number | null;
  margin: number | null;
  margin_percentage: number | null;
  tax_type?: { code: string; code_name: string };
  packaging_units?: { code: string; code_name: string };
  quantity_units?: { code: string; code_name: string };
  conversion_factor: number | null;
  tracks_stock: boolean;
  low_stock_threshold: number | null;
  is_sold: boolean;
  is_purchased: boolean;
  is_active: boolean;
  is_made_here: boolean;
  is_service: boolean;
  is_simple_item: boolean;
  is_bulk_item: boolean;
  types: string[];
  modifier_groups?: ModifierGroup[];
  service_details?: {
    base_price: number | null;
    has_commission: boolean;
    commission_type: string;
    commission_value: number | null;
    allow_custom_price: boolean;
    service_duration_hours: number;
  };
}

const ItemDetailsModal = ({ itemId, onClose }: ItemDetailModalProps) => {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/api/items/${itemId}`);
        setItem(response.data?.data);
      
        setLoading(false);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch item details.");
        toast.error(err?.response?.data?.message || "Failed to fetch item details.");
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-md shadow-md w-full max-w-3xl p-6">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-md shadow-md w-full max-w-3xl p-6">
          <ModalHeader title="Error" onClose={onClose} />
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {error || "Item not found."}
          </div>
          <div className="text-right mt-6">
            <button
              onClick={onClose}
              className="bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-semibold px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render function for simple or bulk item pricing
  const renderSimpleItemPricing = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Buying Price</span>
        <span className="font-medium">
          {item.buying_price !== null ? `KSh ${formatNumber(item.buying_price)}` : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Selling Price</span>
        <span className="font-medium">
          {item.selling_price !== null ? `KSh ${formatNumber(item.selling_price)}` : "—"}
        </span>
      </div>
     
      <div className="flex justify-between">
        <span>Tax Type</span>
        <span className="font-medium">{item.tax_type?.code_name || "—"}</span>
      </div>
    </div>
  );

  // Render function for service pricing
  const renderServicePricing = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Base Price</span>
        <span className="font-medium">
          {item.service_details?.base_price !== null && item.service_details?.base_price !== undefined
            ? `KSh ${formatNumber(item.service_details.base_price)}`
            : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Has Commission</span>
        <span className="font-medium">
          {item.service_details?.has_commission ? "Yes" : "No"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Commission Type</span>
        <span className="font-medium">
          {item.service_details?.commission_type
            ? item.service_details.commission_type.charAt(0).toUpperCase() +
              item.service_details.commission_type.slice(1)
            : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Commission Value</span>
        <span className="font-medium">
          {item.service_details?.commission_value !== null && item.service_details?.commission_value !== undefined
            ? `KSh ${formatNumber(item.service_details.commission_value)}`
            : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Allow Custom Price</span>
        <span className="font-medium">
          {item.service_details?.allow_custom_price ? "Yes" : "No"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Service Duration</span>
        <span className="font-medium">
          {item.service_details?.service_duration_hours !== undefined
            ? `${item.service_details.service_duration_hours} hour${item.service_details.service_duration_hours !== 1 ? "s" : ""}`
            : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Tax Type</span>
        <span className="font-medium">{item.tax_type?.code_name || "—"}</span>
      </div>
    </div>
  );

  // Render function for modifier groups
  const renderModifierGroups = () => (
    <div className="space-y-2 text-sm">
      {item.modifier_groups && item.modifier_groups.length > 0 ? (
        item.modifier_groups.map((group) => (
          <div key={group.id} className="flex justify-between">
            <span>{group.group_name}</span>
            <span className="font-medium">
              {group.is_required ? "Required" : "Optional"} • Min: {group.min_choices} • Max: {group.max_choices}
            </span>
          </div>
        ))
      ) : (
        <div className="text-neutral-500 dark:text-neutral-400">
          No modifier groups assigned.
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-md shadow-md w-full max-w-3xl overflow-y-auto max-h-[90vh] p-6">
        <ModalHeader title="Product Details" onClose={onClose} />

        {/* Basic Info */}
        <section className="border border-neutral-400 dark:border-neutral-600 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium border-b border-neutral-400 dark:border-neutral-600 pb-2 mb-2">
            Product Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Name</span>
              <span className="font-medium">{item.item_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Category</span>
              <span className="font-medium">{item?.category?.category_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>SKU</span>
              <span className="font-medium">{item.sku || "—"}</span>
            </div>
            {/* <div className="flex justify-between">
              <span>Product Code</span>
              <span className="font-medium">{item.product_code}</span>
            </div>
            <div className="flex justify-between">
              <span>Country</span>
              <span className="font-medium">{item.country_code}</span>
            </div> */}
          </div>
        </section>

        {/* Pricing & Tax */}
        <section className="border border-neutral-400 dark:border-neutral-600 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium border-b border-neutral-400 dark:border-neutral-600 pb-2 mb-2">
            Pricing & Tax
          </h3>
          {item.is_service ? renderServicePricing() : renderSimpleItemPricing()}
        </section>

        {/* Modifier Groups */}
        <section className="border border-neutral-400 dark:border-neutral-600 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium border-b border-neutral-400 dark:border-neutral-600 pb-2 mb-2">
            Modifier Groups
          </h3>
          {renderModifierGroups()}
        </section>

        {/* Packaging & Inventory */}
        <section className="border border-neutral-400 dark:border-neutral-600 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium border-b border-neutral-400 dark:border-neutral-600 pb-2 mb-2">
            Packaging & Inventory
          </h3>
          {item.is_service ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              No packaging or inventory details available for services.
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Packaging Unit</span>
                <span className="font-medium">{item.packaging_units?.code_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity Unit</span>
                <span className="font-medium">{item.quantity_units?.code_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Conversion Factor</span>
                <span className="font-medium">
                  {item.conversion_factor !== null ? Number(item.conversion_factor).toFixed(2) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tracks Stock</span>
                <span className="font-medium">{item.tracks_stock ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Threshold</span>
                <span className="font-medium">{item.low_stock_threshold || "—"}</span>
              </div>
            </div>
          )}
        </section>

        {/* Flags */}
        <section className="border border-neutral-400 dark:border-neutral-600 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium border-b border-neutral-400 dark:border-neutral-600 pb-2 mb-2">
            Extra Info
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex gap-2">
              <span>Sold:</span>
              <span className="font-medium">{item.is_sold ? "Yes" : "No"}</span>
            </div>
            <div className="flex gap-2">
              <span>Purchased:</span>
              <span className="font-medium">{item.is_purchased ? "Yes" : "No"}</span>
            </div>
            <div className="flex gap-2">
              <span>Active:</span>
              <span className="font-medium">{item.is_active ? "Yes" : "No"}</span>
            </div>
            <div className="flex gap-2">
              <span>Made Here:</span>
              <span className="font-medium">{item.is_made_here ? "Yes" : "No"}</span>
            </div>
            <div className="flex gap-2">
              <span>Is a Service:</span>
              <span className="font-medium">{item.is_service ? "Yes" : "No"}</span>
            </div>
          </div>
        </section>

        <div className="text-right">
          <button
            onClick={onClose}
            className="bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-semibold px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
