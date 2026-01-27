// types/bundle.ts
export interface Bundle {
    id: number;
    name: string;
    categoryId: number;
    buyingPrice: number;
    sellingPrice: number;
    barcode: string;
    sku: string;
    stock: number;
    components: BundleComponent[];
  }
  
  export interface BundleComponent {
    itemId: number;
    quantity: number; // Quantity of this item per bundle
  }