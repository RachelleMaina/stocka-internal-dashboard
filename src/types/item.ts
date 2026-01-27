export interface Item {
  id: string;
  business_location_id: string;
  item_name: string;
  is_service: boolean;
  category_id: string | null;
  buying_price: string; // in string format, e.g., "200.00"
  selling_price: string;
  barcode: string | null;
  sku: string;
  product_code: string;
  country_code: string;

  quantity_units: UnitInfo;
  packaging_units: UnitInfo;

  conversion_factor: string; // stringified decimal
  product_type: {
    code: string;
    code_name: string;
  };

  tax_type: {
    code: string;
    code_name: string;
    code_description: string;
  };

  tracks_stock: boolean;
  low_stock_threshold: number;
  is_made_here: boolean;
  is_sold: boolean;
  is_active: boolean;
  is_purchased: boolean;

  created_at: string; // ISO timestamp
  updated_at: string;

  category_name: string | null;

  margin: number;
  margin_percentage: number;
}

interface UnitInfo {
  code: string;
  code_name: string;
  code_description: string;
}


export interface ItemVariant {
  id: string | number;
  option_values: string[]; // e.g., ["S", "Red"]
  sku: string;
  barcode: string;
  buying_price: number;
  selling_price: number;
}

export interface ItemOption {
  name: string; // e.g., "Size", "Color"
  values: string[]; // e.g., ["S", "M", "L"]
}

export interface CartItem {
  id: string;
  item_id: string;
  item_name: string;
  unit_price: number;
    cost: number;
  quantity: number;
  tracks_stock: boolean;
  tax_amount: number;
discount:number;
}

export interface ModifierGroup {
  id: string;
  business_location_id: string;
  group_name: string;
  is_required: boolean;
  min_choices: number;
  max_choices: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Modifier {
  id: string;
  business_location_id: string;
  group_id: string;
  modifier_name: string;
  linked_item_id?: string;
  price_change: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}