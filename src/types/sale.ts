export interface SaleItem {
    id: string;
    item_id: string;
    discount: number;
    quantity: number;
    subtotal: number;
    item_name: string;
    created_at: string;
    updated_at: string;
    tax_amount: number;
    unit_price: number;
    store_location_id: string;
    business_location_id: string;
  }
  
  export interface Sale {
    id: string;
    business_location_id: string;
    store_location_id: string;
    user_id: string;
    notes: string | null;
    payment_details: any | null;
    total_amount: string;
    tax_amount: string;
    receipt_number: string;
    etims_status: 'unsigned' | 'signed' | string;
    etims_details: Record<string, any>;
    sale_date: string;
    created_at: string;
    updated_at: string;
    items: SaleItem[];
  }
  