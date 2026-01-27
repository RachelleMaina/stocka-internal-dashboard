export interface Role {
    id: string;
    role_name: string;
    permissions: string[]; // Each string follows the format: "<resource_id>:<resource_name>:<action>"
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
  }
export interface WorkingHour {
  day: string; // e.g., "monday"
  start: string; // e.g., "09:00" or ""
  end: string; // e.g., "17:00" or ""
  is_enabled: boolean; // e.g., true or false
}

export interface User {
  id: string; // UUID
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  user_is_active: boolean;
  color_hex: string; // Hex code, e.g., "#335a99"
  profile_id: string; // UUID
  display_name: string;
  user_type: "pos" | "backoffice";
  pin: string | null; // 4-digit PIN for pos, null for backoffice
  working_hours: WorkingHour[] | null; // Array of 7 objects or null
  profile_is_active: boolean;
  role_name: string;
  role_id: string | null; // UUID, nullable per schema
  role_type: "pos" | "backoffice" | "platform";
  store_location_ids: string[]; // Array of UUIDs
}
export interface UserRole {
  id: string;
  role_name: string;
  permissions: string[];
}

export interface PosUserProfile {
  user_id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  color_hex: string;
  business_location_id: string;
  store_location_id: string;
  user_type: "pos" | "backoffice"; 
  role: UserRole;
}
