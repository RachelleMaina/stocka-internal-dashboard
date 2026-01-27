// types/discount.ts
export interface Discount {
    id: number;
    name: string;
    type: "BOGO" | "PRICE" | "PERCENTAGE" | "HAPPY_HOUR";
    amount: number; // For PRICE ($ off), PERCENTAGE (%), BOGO (% off reward), HAPPY_HOUR (%)
    bogoTriggerItemId?: number; // For BOGO: Item ID to buy
    bogoRewardItemId?: number; // For BOGO: Item ID to discount
    bogoTriggerQuantity?: number; // For BOGO: Buy X
    bogoRewardQuantity?: number; // For BOGO: Get Y
    startDate?: string; // ISO string, e.g., "2025-04-15T00:00:00Z"
    endDate?: string; // ISO string
    happyHourDays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
    happyHourStartTime?: string; // e.g., "15:00" (3:00 PM)
    happyHourEndTime?: string; // e.g., "17:00" (5:00 PM)
    applicableItemIds: number[]; // Items this discount applies to
    applicableCategoryIds: number[]; // Categories this discount applies to
    applicableBundleIds: number[]; // Bundles this discount applies to
  }