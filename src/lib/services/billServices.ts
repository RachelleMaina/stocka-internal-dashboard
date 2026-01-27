import { CartItem } from "@/types/item";
import { v4 as uuidv4 } from "uuid";
import { api } from "../api";
import db from "./db";
import { getCurrentDevice } from "../utils/auth";
import { generateTransactionNumber } from "../utils/helpers";

export interface TableSlot {
  id: number; // Auto-incremented by Dexie
  table_number: string;
  status: "available" | "occupied";
}

export interface SaleItem {
  item_id: string;
  item_name: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  cost: number;
  discount: number;
  tax_amount: number;
  tracks_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  business_location_id: string;
  store_location_id: string;
  table_number: string;
  tag: {
    tag_name: string;
    tag_color: string;
  } | null;
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
  sync_status: "pending" | "synced" | "failed";
  bill_number: string;
  bill_prefix?: string;
  bill_date: string;
  created_at: string;
  updated_at: string;
  bill_id?: string;
  error?: string | null;
  items: SaleItem[];
  status?: "active" | "voided"; // Added for voided bills
}

export interface BillTag {
  id: string;
  tag_name: string;
  tag_color: string;
  created_at: string;
}

export const bulkGenerateTableSlotsService = async (
  table_count: number,
  prefix?: string
): Promise<{ success: boolean; message: string; removableCount?: number }> => {
  console.log("Starting bulkGenerateTableSlotsService", {
    table_count,
    prefix,
  });
  try {
    // Validate table_count
    if (
      table_count < 0 ||
      table_count > 300 ||
      !Number.isInteger(table_count)
    ) {
      return {
        success: false,
        message: "Table count is invalid.",
      };
    }

    const basePrefix = prefix || "Table";

    // Run in a transaction for data consistency
    return await db.transaction("rw", db.table_slots, async () => {
      // Get existing tables
      const existingTables = await db.table_slots.toArray();
      const availableTables = existingTables.filter(
        (t) => t.status === "available"
      );
      const occupiedTables = existingTables.filter(
        (t) => t.status === "occupied"
      );
      const currentCount = existingTables.length;
      const existingTableNumbers = new Set(
        existingTables.map((t) => t.table_number)
      );

      // Case 1: table_count === 0 (remove all available tables)
      if (table_count === 0) {
        if (occupiedTables.length > 0) {
          return {
            success: false,
            message: `Cannot remove all tables: ${occupiedTables.length} are occupied`,
            removableCount: availableTables.length,
          };
        }
        await db.table_slots.bulkDelete(existingTables.map((t) => t.id));

        return {
          success: true,
          message: "All table slots removed",
        };
      }

      // Check prefix change
      const hasPrefixChanged = availableTables.some(
        (t) => !t.table_number.startsWith(`${basePrefix}-`)
      );

      // Calculate target count for available tables (total = occupied + available)
      const targetAvailableCount = table_count - occupiedTables.length;
      if (targetAvailableCount < 0) {
        return {
          success: false,
          message: `Cannot reduce to ${table_count} tables: ${occupiedTables.length} are occupied`,
          removableCount: availableTables.length,
        };
      }

      // Delete all available tables to enforce sequential numbering
      if (availableTables.length > 0) {
        await db.table_slots.bulkDelete(availableTables.map((t) => t.id));
      }

      // Generate new available tables
      const newTables: Omit<TableSlot, "id">[] = [];
      let nextIndex = 1;

      // Ensure sequential table_number values
      for (let i = 0; i < targetAvailableCount; i++) {
        let table_number: string;
        do {
          table_number = `${basePrefix}-${nextIndex}`;
          nextIndex++;
        } while (existingTableNumbers.has(table_number));

        newTables.push({
          table_number,
          status: "available",
        });
        existingTableNumbers.add(table_number);
      }

      // Save new tables
      if (newTables.length > 0) {
        await db.table_slots.bulkAdd(newTables);
      }

      return {
        success: true,
        message: hasPrefixChanged
          ? "Table slots updated with new prefix"
          : currentCount === table_count
          ? "Table count unchanged"
          : currentCount < table_count
          ? "Table slots added successfully"
          : "Table slots removed successfully",
      };
    });
  } catch (error) {
    console.error(`Error in bulkGenerateTableSlotsService: ${error.message}`);
    return {
      success: false,
      message: `Failed to generate table slots: ${error.message}`,
    };
  }
};

export const getTableSlotsService = async (): Promise<{
  success: boolean;
  table_slots: TableSlot[];
  message: string;
}> => {
  try {
    const table_slots = await db.table_slots.toArray();

    return {
      success: true,
      table_slots,
      message: "Table slots fetched successfully",
    };
  } catch (error) {
    console.error(`Error in getTableSlotsService: ${error.message}`);
    return {
      success: false,
      table_slots: [],
      message: `Failed to fetch table slots: ${error.message}`,
    };
  }
};

export const getOfflineBillsService = async (store_location_id: string) => {
  if (!store_location_id?.trim()) {
    return { error: 'Store location ID is required', status: 400 };
  }

  try {
    const data: Bill[] = await db.bills
      .where('store_location_id')
      .equals(store_location_id)
      .and((bill) => ['pending', 'failed'].includes(bill.sync_status || ''))
      .sortBy('created_at');

    return data;
  } catch (error: any) {
    return {
      error: `Failed to fetch offline bills: ${error.message}`,
      status: 500,
    };
  }
};

const buildPayload = (bill: Bill) => ({
  business_location_id: bill.business_location_id,
  store_location_id: bill.store_location_id,
  table_number: bill.table_number,
  user: bill.user,
  customer: bill.customer,
  device: bill.device,
  notes: bill.notes,
  bill_number: bill.bill_number,
  bill_prefix: bill.bill_prefix,
  tag:bill.tag,
  items: bill.items.map((item) => ({
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

export const syncSingleBill = async (id: string) => {
  const bill = await db.bills.get(id);
  if (!bill || bill.sync_status === "synced") {
    return { message: "Already synced or not found" };
  }

  try {
    const payload = buildPayload(bill);
    const response = await api.post(
      `/api/store-locations/${bill.store_location_id}/bill`,
      payload
    );

    const result = response.data;
    if (result?.error) {
      throw new Error(result.error);
    }

    await db.bills.update(id, {
      sync_status: "synced",
      bill_id: result?.data?.bill_id,
      bill_number: result?.data?.bill_number,
      error: null,
    });

    return {
      message: "Bill synced",
      bill_id: result.bill_id,
      bill_number: result.bill_number,
    };
  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.message || err.message || "Sync failed";

    await db.bills.update(id, {
      sync_status: "failed",
      error: errorMessage,
    });

    return { error: errorMessage };
  }
};

export const syncBills = async () => {
  const pendingBills = await db.bills
    .where("sync_status")
    .anyOf(["pending", "failed"])
    .toArray();

  for (const bill of pendingBills) {
    await syncSingleBill(bill.id);
  }

  const [pending, failed] = await Promise.all([
    db.bills.where("sync_status").equals("pending").count(),
    db.bills.where("sync_status").equals("failed").count(),
  ]);

  return {
    message: "All bills attempted",
    pending,
    failed,
  };
};

export async function registerBillsSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("SYNC_BILLS");
    } catch (error) {
      console.error("Failed to register bills sync", error);
    }
  } else {
    console.warn("Background Sync not supported");
  }
}

export const saveBillService = async (newBill: Bill) => {
  const {
    business_location_id,
    store_location_id,
    table_number,
    user,
    customer,
    notes,
    items,
    tag
  } = newBill;
  const bill_number = generateTransactionNumber();
  const device = getCurrentDevice();

  if (!device) {
    return {
      success: false,
      message: "Invalid device",
    };
  }

  const total_amount = items.reduce(
    (sum, item) => sum + (item.total_price || 0),
    0
  );

  const bill: Bill = {
    id: uuidv4(), // Generate UUID for bill
    business_location_id,
    store_location_id,
    table_number,
    user,
    customer,
    device: {
      device_id: device.id || "",
      device_key: device.device_key || "",
      device_name: device.device_name || "",
    },
    tag: tag ?{
      tag_name: tag.tag_name,
      tag_color:tag.tag_color
    }:null,
    notes: notes || null,
    total_amount,
    sync_status: "pending",
    bill_number,
    bill_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items,
    status: "active", // Default status
  };

  // Save bill and update table status in a transaction
  try {
    await db.transaction("rw", db.bills, db.table_slots, async () => {
      const savePromise = db.bills.add(bill);
      await Promise.race([
        savePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("IndexedDB save timeout")), 5000)
        ),
      ]);

      // Update table status to occupied
     await db.table_slots.where("table_number").equals(table_number).modify({
        status: "occupied",
      });
    });
  } catch (error) {
    console.warn(error);
    return {
      success: false,
      bill_number,
      message: `Failed to save bill.`,
    };
  }

  // Attempt to register background sync
  try {
    console.log("Registering background sync");
    const syncPromise = registerBillsSync();
    await Promise.race([
      syncPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Background sync timeout")), 2000)
      ),
    ]);
    console.log("Background sync registered");
  } catch (error) {
    console.warn(`Failed to register background sync: ${error.message}`);
  }

  return {
    success: true,
    bill_number,
    message: "Bill saved.",
  };
};

export const voidBillService = async (
  billId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(billId, "billid");
    await db.bills.update(billId, { status: "voided", updated_at: new Date().toISOString() });
    return { success: true, message: "Bill voided successfully." };
  } catch (error: any) {
    console.log(error);
    return { success: false, message: `Failed to void bill: ${error.message}` };
  }
};

export const updateBillService = async (
  billId: string,
  updatedBill: {
    items: SaleItem[];
    total_amount: number;
    created_at: string;
    notes: string;
    store_location_id: string;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    await db.bills.update(billId, {
      ...updatedBill,
      updated_at: new Date().toISOString(),
    });
    return { success: true, message: "Bill updated successfully" };
  } catch (error: any) {
    console.error(`Failed to update bill: ${error.message}`);
    return {
      success: false,
      message: `Failed to update bill: ${error.message}`,
    };
  }
};

export const updateTableStatusService = async (
  tableNumber: string,
  status: "occupied" | "available"
): Promise<{ success: boolean; message: string }> => {
  try {
    // First find the table by table_number
    const table = await db.table_slots.where("table_number").equals(tableNumber).first();
    
    if (!table) {
      return {
        success: false,
        message: `Table ${tableNumber} not found.`,
      };
    }

    // Update the table using its ID
    await db.table_slots.update(table.id, { status });

    return { success: true, message: `Table ${tableNumber} status updated successfully` };
  } catch (error: any) {
    console.error(`Failed to update table status: ${error.message}`);
    return {
      success: false,
      message: `Failed to update table ${tableNumber} status.`,
    };
  }
};

export const getAvailableTablesService = async (): Promise<TableSlot[]> => {
  try {
    const tables = await db.table_slots
      .where("status")
      .equals("available")
      .toArray();
    return tables.slice(0, 3); // Return first 3 available tables
  } catch (error: any) {
    console.error(`Failed to fetch available tables: ${error.message}`);
    return [];
  }
};

// Bill Tags Services - Updated to use Dexie/IndexedDB
export const getBillTagsService = async (): Promise<{
  success: boolean;
  tags: BillTag[];
  message: string;
}> => {
  try {
    const tags = await db.bill_tags.toArray();
    
    // Sort by creation date (newest first)
    const sortedTags = tags.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      success: true,
      tags: sortedTags,
      message: "Bill tags fetched successfully",
    };
  } catch (error) {
    console.error(`Error in getBillTagsService: ${error.message}`);
    return {
      success: false,
      tags: [],
      message: `Failed to fetch bill tags: ${error.message}`,
    };
  }
};

export const createBillTagService = async (
  tag: { tag_name: string; tag_color: string }
): Promise<{ success: boolean; tag: BillTag; message: string }> => {
  try {
    // Validate input
    if (!tag.tag_name?.trim()) {
      return {
        success: false,
        tag: {} as BillTag,
        message: "Tag name is required",
      };
    }

    if (!tag.tag_color) {
      return {
        success: false,
        tag: {} as BillTag,
        message: "Tag color is required",
      };
    }

    // Check for duplicate tag name
    const existingTags = await db.bill_tags.where("tag_name").equals(tag.tag_name.trim()).toArray();
    if (existingTags.length > 0) {
      return {
        success: false,
        tag: {} as BillTag,
        message: "A tag with this name already exists",
      };
    }

    const newTag: BillTag = {
      id: uuidv4(),
      tag_name: tag.tag_name.trim(),
      tag_color: tag.tag_color,
      created_at: new Date().toISOString(),
    };

    await db.bill_tags.add(newTag);

    return {
      success: true,
      tag: newTag,
      message: "Bill tag created successfully",
    };
  } catch (error) {
    console.error(`Error in createBillTagService: ${error.message}`);
    return {
      success: false,
      tag: {} as BillTag,
      message: `Failed to create bill tag: ${error.message}`,
    };
  }
};

export const deleteBillTagService = async (
  tagId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if tag exists
    const tag = await db.bill_tags.get(tagId);
    if (!tag) {
      return {
        success: false,
        message: "Tag not found",
      };
    }

    await db.bill_tags.delete(tagId);

    return {
      success: true,
      message: "Bill tag deleted successfully",
    };
  } catch (error) {
    console.error(`Error in deleteBillTagService: ${error.message}`);
    return {
      success: false,
      message: `Failed to delete bill tag: ${error.message}`,
    };
  }
};

// Additional utility functions for bill tags
export const bulkDeleteAllBillTagsService = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const allTags = await db.bill_tags.toArray();
    if (allTags.length === 0) {
      return {
        success: true,
        message: "No tags to delete",
      };
    }

    await db.bill_tags.bulkDelete(allTags.map(tag => tag.id));

    return {
      success: true,
      message: `${allTags.length} bill tags deleted successfully`,
    };
  } catch (error) {
    console.error(`Error in bulkDeleteAllBillTagsService: ${error.message}`);
    return {
      success: false,
      message: `Failed to delete bill tags: ${error.message}`,
    };
  }
};

export const updateBillTagService = async (
  tagId: string,
  updates: Partial<{ tag_name: string; tag_color: string }>
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate updates
    if (updates.tag_name && !updates.tag_name.trim()) {
      return {
        success: false,
        message: "Tag name cannot be empty",
      };
    }

    // Check for duplicate tag name if updating name
    if (updates.tag_name) {
      const existingTags = await db.bill_tags.where("tag_name").equals(updates.tag_name.trim()).toArray();
      const currentTag = await db.bill_tags.get(tagId);
      
      if (existingTags.length > 0 && existingTags.every(tag => tag.id !== tagId)) {
        return {
          success: false,
          message: "A tag with this name already exists",
        };
      }
    }

    await db.bill_tags.update(tagId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Bill tag updated successfully",
    };
  } catch (error) {
    console.error(`Error in updateBillTagService: ${error.message}`);
    return {
      success: false,
      message: `Failed to update bill tag: ${error.message}`,
    };
  }
};