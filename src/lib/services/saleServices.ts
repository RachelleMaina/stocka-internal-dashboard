import { CartItem } from "@/types/item";
import { v4 as uuidv4 } from "uuid";
import { api } from "../api";
import db from "./db";
import { getCurrentDevice } from "../utils/auth";
import { generateTransactionNumber } from "../utils/helpers";

const SALES_TABLE = "sales";

interface SaleItemPayload {
  item_id: string;
  item_name: string; // Added
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_amount?: number;
  track_stock: boolean;
}

interface PaymentDetail {
  method: string;
  amount: number | string;
  [key: string]: any;
}




const buildPayload = (sale) => ({
  business_location_id: sale.business_location_id,
  store_location_id: sale.store_location_id,
  user: sale.user,
  device: sale.device,
  notes: sale.notes,
  change: sale.change,
  payment_details: sale.payment_details,
  receipt_number: sale.receipt_number,
  receipt_prefix: sale.receipt_prefix,
  items: sale.items.map((item) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    category_name: item.category_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    cost: item.cost,
    discount: item.discount,
    tax_amount: item.tax_amount,
    tracks_stock: item.tracks_stock,
  })),
});

// Single sync
export const syncSingleSale = async (temp_id: string) => {
  const sale = await db.sales.get(temp_id);
  if (!sale || sale.sync_status === "synced") {
    return { message: "Already synced or not found" };
  }

  try {
    const payload = buildPayload(sale);
    const response = await api.post(
      `/api/store-locations/${sale.store_location_id}/sale`,
      payload
    );

    const result = response.data;
    if (result?.error) {
      throw new Error(result.error);
    }

    await db.sales.update(temp_id, {
      sync_status: "synced",
      sale_id: result?.data?.sale_id,
      receipt_number: result?.data?.receipt_number,
      error: null,
    });

    return {
      message: "Sale synced",
      sale_id: result.sale_id,
      receipt_number: result.receipt_number,
    };
  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.message || err.message || "Sync failed";

    await db.sales.update(temp_id, {
      sync_status: "failed",
      error: errorMessage,
    });

    return { error: errorMessage };
  }
};

// Sync all pending/failed
export const syncSales = async () => {
  const pendingSales = await db.sales
    .where("sync_status")
    .anyOf(["pending", "failed"])
    .toArray();

  for (const sale of pendingSales) {
    await syncSingleSale(sale.temp_id);
  }

  const [pending, failed] = await Promise.all([
    db.sales.where("sync_status").equals("pending").count(),
    db.sales.where("sync_status").equals("failed").count(),
  ]);

  return {
    message: "All sales attempted",
    pending,
    failed,
  };
};

export async function registerSalesSync() {

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("SYNC_SALES");
    } catch (error) {
      console.error("Failed to register sales sync", error);
    }
  } else {
    console.warn("Background Sync not supported");
  }
}


export const saveSaleService = async (sale: any) => {
  const temp_id = uuidv4();
  const receipt_number = generateTransactionNumber();
  const device = getCurrentDevice();
  if (!device) {
    return {
      success: false,
      message: "Invalid device",
    };
  }

 

  // Prepare sale object for IndexedDB
  const saleData = {
    ...sale,
    temp_id,
    receipt_number,
    device,
  };

  // Save sale to IndexedDB
  try {
    const savePromise = db.sales.add(saleData);
    await Promise.race([
      savePromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("IndexedDB save timeout")), 5000)
      ),
    ]);
  } catch (error: any) {
    console.warn(`Failed to save sale to IndexedDB: ${error.message}`);
    return {
      success: false,
      message: `Failed to save sale.`,
    };
  }

  // Attempt to register background sync
  try {
    console.log("Registering background sync");
    const syncPromise = registerSalesSync(); // Note: Original code had temp_id, but function doesn't use it
    await Promise.race([
      syncPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Background sync timeout")), 5000)
      ),
    ]);
    console.log("Background sync registered");
  } catch (error: any) {
    console.warn(`Failed to register background sync: ${error.message}`);
  }

  return {
    success: true,
    temp_id,
    receipt_number,
    message: "Sale saved offline. Sync will be attempted in background.",
  };
};


// export const saveAndSyncSaleService = async (
//   business_location_id: string,
//   store_location_id: string,
//   user: {
//     id: string;
//     user_name: string;
//     email: string | null;
//     phone: string | null;
//   },
//   notes: string | null,
//   change: number,
//   payment_details: PaymentDetail[] | null,
//   items: CartItem[],
//   receipt_prefix?: string
// ) => {
//   const temp_id = uuidv4();
//   const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
//   const blid_prefix = business_location_id.slice(0, 4).toUpperCase();

//   // Validate device from localStorage
//   const device = JSON.parse(localStorage.getItem("pos_device_profile") || "{}");

//   if (!device.id || !device.device_key) {
//     return {
//       success: false,
//       temp_id,
//       receipt_number: "",
//       message: "Invalid or inactive device",
//     };
//   }

//   // Get local sale count for temporary receipt_number
//   const sale_count = await db.sales
//     .where("business_location_id")
//     .equals(business_location_id)
//     .count();
//   const receipt_number = `offline_${blid_prefix}_${date}_${(sale_count + 1)
//     .toString()
//     .padStart(3, "0")}`;

//   // Calculate totals
//   const total_amount = items.reduce((sum, item) => {
//     const subtotal =
//       item.quantity * item.unit_price -
//       (item.discount || 0) +
//       (item.tax_amount || 0);
//     return sum + subtotal;
//   }, 0);
//   const tax_amount = items.reduce(
//     (sum, item) => sum + (item.tax_amount || 0),
//     0
//   );

//   // Normalize payment_details
//   const normalized_payment_details = payment_details?.map((payment) => ({
//     ...payment,
//     amount:
//       typeof payment.amount === "string"
//         ? parseFloat(payment.amount)
//         : payment.amount,
//   }));

//   // Prepare sale object
//   const sale = {
//     temp_id,
//     business_location_id,
//     store_location_id,
//     user,
//     device: {
//       device_id: device.device_id,
//       device_key: device.device_key,
//       device_name: device.device_name,
//     },
//     notes: notes || null,
//     payment_details: normalized_payment_details || null,
//     total_amount,
//     tax_amount,
//     change,
//     sync_status: "pending" as "pending" | "synced" | "failed",
//     receipt_number,
//     receipt_prefix: receipt_prefix || null,
//     etims_status: "unsigned",
//     etims_details: {},
//     sale_date: new Date().toISOString().slice(0, 10),
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString(),
//     items: items.map((item) => ({
//       item_id: item.item_id,
//       item_name: item.item_name || item.name || "Unknown",
//       category_name: item.category_name,
//       quantity: item.quantity,
//       unit_price: item.unit_price,
//       cost: item.cost,
//       discount: item.discount || 0,
//       tax_amount: item.tax_amount || 0,
//       tracks_stock: item.tracks_stock,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     })),
//   };

//   // Save sale to IndexedDB
//   try {
//     await db.sales.add(sale);
//   } catch (error) {
//     return {
//       success: false,
//       temp_id,
//       receipt_number,
//       message: `Failed to save sale offline: ${error.message}`,
//     };
//   }

//   // Check if online and attempt to sync
//   if (navigator.onLine) {
//     try {
//       const payload = {
//         business_location_id: sale.business_location_id,
//         store_location_id: sale.store_location_id,
//         user: sale.user,
//         device: sale.device,
//         notes: sale.notes,
//         change: sale.change,
//         payment_details: sale.payment_details,
//         receipt_number: sale.receipt_number,
//         receipt_prefix: sale.receipt_prefix,
//         items: sale.items.map((item) => ({
//           item_id: item.item_id,
//           item_name: item.item_name,
//           category_name: item.category_name,
//           quantity: item.quantity,
//           unit_price: item.unit_price,
//           cost: item.cost,
//           discount: item.discount,
//           tax_amount: item.tax_amount,
//           tracks_stock: item.tracks_stock,
//         })),
//       };

      // const response = await api.post(
      //   `/api/store-locations/${sale.store_location_id}/sale`,
      //   payload
      // );
      // const result = response.data;

//       if (result.error) {
//         await db.sales.update(temp_id, {
//           sync_status: "failed",
//           error: result.error,
//         });
//         return {
//           success: false,
//           temp_id,
//           receipt_number,
//           message: `Sale saved offline but sync failed: ${result.error}`,
//         };
//       }

//       await db.sales.update(temp_id, {
//         sync_status: "synced",
//         sale_id: result?.data?.sale_id,
//         receipt_number: result?.data?.receipt_number,
//         error: null,
//       });

//       return {
//         success: true,
//         temp_id,
//         receipt_number: result?.data?.receipt_number || receipt_number,
//         sale_id: result?.data?.sale_id,
//         message: "Sale saved and synced successfully",
//       };
//     } catch (error) {
//       const errorMessage =
//         error.response?.data?.message || error.message || "Sync failed";
//       await db.sales.update(temp_id, {
//         sync_status: "failed",
//         error: errorMessage,
//       });
//       return {
//         success: false,
//         temp_id,
//         receipt_number,
//         message: `Sale saved offline but sync failed: ${errorMessage}`,
//       };
//     }
//   } else {
//     // Register background sync

//     if ("serviceWorker" in navigator && "SyncManager" in window) {
//       const registration = await navigator.serviceWorker.ready;

//       console.log(`Registering sync for sale ${temp_id}`);
//       await registration.sync.register(`sync-sale-${temp_id}`);
//     }
//   }

//   return {
//     success: true,
//     temp_id,
//     receipt_number,
//     message: "Sale saved offline. Will sync when online.",
//   };
// };
