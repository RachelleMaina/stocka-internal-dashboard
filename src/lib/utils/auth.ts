import { PosUserProfile } from "@/types/user";


export interface UserProfile {
  session_id: string;
  user_id: string;
  profile_id: string;
  phone: string;
  email: string;
  full_name: string;
}

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("backoffice_user_profile");
    return data ? (JSON.parse(data) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const getCurrentPosUser = (): PosUserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("pos_user_profile");
    return data ? (JSON.parse(data) as PosUserProfile) : null;
  } catch {
    return null;
  }
};

export const getCurrentBusiness = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("business_profile");
    return data ? (JSON.parse(data) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const getCurrentBusinessLocation = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("backoffice_business_location");
    return data ? (JSON.parse(data) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const getActiveLocation = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
       const business = localStorage.getItem("business_profile");
    const data = localStorage.getItem("active_store_profile") ?? business?.[0];
    return data ? (JSON.parse(data) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const getCurrentDevice = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("pos_device_profile");
    return data ? (JSON.parse(data) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const logoutBackofficeUser = () => {
  if (typeof window === "undefined") return;

  // Clear localStorage
  localStorage.removeItem("backoffice_user_profile");
  localStorage.removeItem("business_profile");
  localStorage.removeItem("session_id");
  localStorage.removeItem("active_store_profile");
  localStorage.removeItem("backoffice_business_location");
  
  // Clear cookies
  document.cookie = "backoffice_user_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "business_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "active_store_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};


export const logoutPosUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pos_user_profile");
};