import Dexie, { Table } from "dexie";

interface SaleItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_amount: number;
  track_stock: boolean;
  created_at: string;
  updated_at: string;
}

interface Sale {
  temp_id: string; // Indexed
  business_location_id: string; // Indexed
  store_location_id: string; // Indexed
  user_id: string;
  is_complimentary: boolean;
  is_credit: boolean;
  user: {
    id: string;
    user_name: string;
    email: string | null;
    phone: string | null;
  };
  device: { device_id: string; device_key: string; device_name: string | null };
  notes?: string | null;
  payment_details?: Array<{
    method: string;
    amount: number;
    transaction_id?: string;
  }> | null;
  total_amount: number;
  change: number;
  tax_amount: number;
  sync_status: "pending" | "synced" | "failed"; // Indexed
  receipt_number: string; // Indexed
  receipt_prefix?: string;
  etims_status: string;
  etims_details: object;
  sale_date: string; // Indexed
  created_at: string;
  updated_at: string;
  sale_id?: string;
  error?: string | null;
  items: SaleItem[];
}

interface Bill {
  temp_id: string; // Indexed
  business_location_id: string; // Indexed
  store_location_id: string; // Indexed
    table_number: string;
  user: {
    id: string;
    user_name: string;
    email: string | null;
    phone: string | null;
  };
   customer: {
    id: string;
    user_name: string;
    email: string | null;
    phone: string | null;
  };
  device: { device_id: string; device_key: string; device_name: string | null };
  notes?: string | null;
  total_amount: number;
  sync_status: "pending" | "synced" | "failed"; // Indexed
  bill_number: string; // Indexed
  bill_prefix?: string;
  bill_date: string; // Indexed
  created_at: string;
  updated_at: string;
  bill_id?: string;
  error?: string | null;
  items: SaleItem[];
}


export interface Item {
  id: string; // Indexed
  business_location_id: string; // Indexed
  item_name: string; // Indexed for search
  selling_price: number;
  buying_price: number; // optional if shown
  barcode: string | null; // Indexed
  sku: string; // Indexed
  product_code: string; // Indexed
  is_service: boolean; // Indexed
  country_code: string; // Indexed
  allow_custom_price: boolean; // Added
  category: {
    category_id: string;
    category_name: string;
    color_hex: string | null;
  } | null;
  store_locations: {
    store_location_id: string;
    store_location_name: string;
  }[];
}

interface User {
  id: string; // Indexed
  user_name: string; // Indexed
  phone: string | null; // Indexed
  email: string | null; // Indexed
  color_hex: string | null;
  is_active: boolean; // Indexed
  created_at: string;
  updated_at: string;
  profile: {
    business_location_id: string;
    store_location_id: string;
    display_name: string | null;
    user_type: "pos" | "backoffice" | "platform";
    pin: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  role: {
    role_name: string;
    role_type: "pos" | "backoffice" | "platform";
    permissions: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  store_locations: {
    store_location_id: string;
    store_location_name: string;
  }[];
}

export interface StoreLocation {
  id: string; // primary key
  business_location_id: string;
  store_location_name: string;
}

export interface Category {
  id: string;
  business_location_id: string;
  category_name: string;
  color_hex: string | null;
}

export interface Menu {
  store_location_id: string;
  categories: {
    id: string | "Uncategorized";
    name: string;
    color: string | null;
    items: {
      id: string;
      name: string;
      price: number;
      allowCustomPrice: boolean;
    }[];
  }[];
}

export interface Session {
  id: string; // always "active" Use id = 'active' as the constant key so there's always one session.
  business_location_id: string;
}

export interface TableSlot {
  id?: number;
  table_number: string;
  status: "available" | "occupied";
}

export interface BillTag {
  id: string;
  tag_name: string;
  tag_color: string;
  created_at: string;
}

class StockaDB extends Dexie {
  sales!: Table<Sale>;
   bills!: Table<Bill>;
  items!: Table<Item>;
  users!: Table<User>;
  store_locations!: Table<StoreLocation>;
  categories!: Table<Category>;
  menu!: Table<Menu>;
  session!: Table<Session, string>;
  table_slots!: Table<TableSlot>;
  bill_tags!: Table<BillTag>;
  

  constructor() {
    super("stocka_indexed_db");

    this.version(7).stores({
      sales:
        "temp_id, business_location_id, store_location_id, sync_status, receipt_number, sale_date, created_at",
      items:
        "id, business_location_id, [business_location_id+store_locations.store_location_id], item_name, barcode, sku, product_code, country_code, is_service, allow_custom_price",
      users: "id, user_name, phone, email, is_active",
      store_locations: "id, business_location_id, store_location_name",
      categories: "id, business_location_id, category_name",
      menu: "store_location_id",
      session: "id",
      bills:
        "++id, business_location_id, store_location_id, sync_status, bill_number, bill_date, created_at",
      table_slots: "++id, table_number, status",
      bill_tags: "id, tag_name, tag_color, created_at",
    });
  }
}

const db = new StockaDB();
export default db;
