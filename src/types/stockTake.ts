export type StockTakeStatus = "draft" | "couting" | "review" | "completed";


export interface StockTake {
  id: string;
  stock_take_name: string;
  business_location_id: string;
  user_id: string | null;
  started_at: string;
  submitted_at: string | null;
  status: StockTakeStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  store_location_name: string;
  location_name: string;
  first_name: string | null;
  last_name: string | null;
  total_items: number;
}
export interface StockTakeItemsResponse {
    status: string;
    items: StockTakeItem[];
    totals: {
      counted: number;
      uncounted: number;
    };

}

export interface StockTakeItem {
  id: string;
  business_location_id: string;
  store_location_id: string;
  stock_take_id: string;
  item_id: string;
  expected_quantity: string;
  counted_quantity: string | null;
  difference: string | null;
  created_at: string; 
  updated_at: string; 
  item_name: string;
  sku: string;
  barcode: string;
  product_code: string;
  uom: string;
  category_name: string | null;
}

export interface StockTakeSummary{
      total_counted: number;
      total_items: number;
      issues_count: number;
      stock_take_name: string;
      issues: StockTakeIssue[];
      status: string;
}

export interface StockTakeIssue {
  id: string;
  business_location_id: string;
  store_location_id: string;
  stock_take_id: string;
  item_id: string;
  expected_quantity: string;
  counted_quantity: string;
  difference: string;
  created_at: string; 
  updated_at: string;
  item_name: string;
  sku: string;
  barcode: string;
  product_code: string;
  uom: string;
  category_name: string | null;
}
