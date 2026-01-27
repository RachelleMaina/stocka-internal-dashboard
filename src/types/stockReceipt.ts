

export interface DirectPurchasePackagingUnit {
  code: string;
  code_name: string;
  code_description: string;
}

export interface DirectPurchaseItem {
  notes: string | null;
  status: "draft" | "confirmed" | string;
  item_id: string;
  item_name: string;
  condition: string;
  packaging_units: DirectPurchasePackagingUnit;
  ordered_quantity: number | null;
  received_quantity: number;
  conversion_factor: string; // e.g. "1.0000"
  ordered_unit_cost: string | null; // can be parsed as number
  received_unit_cost: string; // can be parsed as number
}

export interface DirectPurchaseStaffDetails {
  created_by: {
    id: string;
    name: string;
    email: string;
    phone: string;
    timestamp: string;
  };
}

export interface DirectPurchase {
  id: string;
  stock_receipt_number: number;
  stock_receipt_name: string;
  reference: string | null;
  store_location_id: string;
  source_store_location_id: string | null;
  business_location_id: string;
  supplier_details: any | null;
  staff_details: DirectPurchaseStaffDetails | null;
  receipt_type: "direct_purchase" | string;
  receipt_type_display: string;
  status: "draft" | "confirmed" | string;
  ordered_date: string | null;
  received_date: string | null;
  notes: string | null;
  items: DirectPurchaseItem[];
  started_at: string;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

