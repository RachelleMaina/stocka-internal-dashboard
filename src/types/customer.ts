export interface Customer {
  id: string;
  business_location_id: string;
  store_location_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
}