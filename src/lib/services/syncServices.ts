import toast from "react-hot-toast";
import { api } from "../api";
import db from "./db";
import { getCurrentDevice } from "../utils/auth";
import { endpoints } from "@/constants/endpoints";

export const pullSync = async (business_location_id, store_location_id) => {
 
  if (!business_location_id && store_location_id) return;
  try {
    const response = await api.get(endpoints.posSync(business_location_id, store_location_id)
    );

    if (response.data.error) {
      toast.error(response.data.error);
      return { success: false, message: response.data.error };
    }

    const { users, items, store_locations, categories, menu } =
      response.data?.data;

    await db.transaction(
      "rw",
      [db.users, db.items, db.store_locations, db.categories, db.menu, db.session],
      async () => {
        // Clear existing data
        await db.users.clear();
        await db.items.clear();
        await db.store_locations.clear();
        await db.categories.clear();
        await db.menu.clear();
        await db.session.clear();
     
        // Save users
        for (const user of users) {
          await db.users.put({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            email: user.email,
            is_superadmin:user.is_superadmin,
            color_hex: user.color_hex,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            profile: user.profile_id
              ? {
                  business_location_id: user.business_location_id,
                  store_locations: user.store_locations, // array
                  display_name: user.display_name,
                  user_type: user.user_type,
                  pin: user.pin,
                  is_active: user.profile_is_active,
                  created_at: user.profile_created_at,
                  updated_at: user.profile_updated_at,
                }
              : null,
            role: user.role_id
              ? {
                  role_name: user.role_name,
                  role_type: user.role_type,
                  permissions: user.permissions,
                  is_active: user.role_is_active,
                  created_at: user.role_created_at,
                  updated_at: user.role_updated_at,
                }
              : null,
            store_locations: user.store_locations,
          });
        }

        // Save items
        await db.items.bulkPut(items);

        // Save store locations
        await db.store_locations.bulkPut(store_locations);

        // Save categories
        await db.categories.bulkPut(categories);

        // Save menus
        await db.menu.bulkPut(menu || []);

 
        
      }
    );
  toast.success("POS synced.");
    return { success: true, message: "POS synced." };
  } catch (error) {
    console.log(error)
    toast.error("Failed to sync.");
    return {
      success: false,
      message:  "Failed to sync POS data",
    };
  }
};
