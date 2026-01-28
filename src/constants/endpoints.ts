export const endpoints = {
listAccounts:"/internal/accounts",
createAccount:"/internal/accounts",





 login: "/auth/login",
 me: "/internal/profiles/me",

  //Items
  items: "/items",
  approveItems: "/items/audit/approve",
  rejectItems: "/items/audit/reject",
  getItem: (id: string) => `/items/${id}` as const,
  updateItems: `/items`,
  deleteItem: (id: string) => `/items/${id}` as const,

  itemLogs: "/items/audit/logs",
  itemApprovalRequests: "/items/audit/approval-requests",

  // Dropdown / Reference Data
  getPackagingUnits: "/reference/packaging-units" as const,
  getUnitsOfQuantity: "/reference/units-of-quantity" as const,
  getItemClassCodes: "/reference/item-class-codes" as const,
  getProductCodes: "/reference/product-types" as const, 
  getTaxTypes: "/reference/tax-types" as const,
  getCategories: "/categories" as const,
  getStorageAreas: "/storage-areas" as const,
  getSalesChannels: "/sales-channels" as const,


  itemUomList: "/uoms",
  itemsForUoms: "/uoms/items",
  upsertUoms: "/uoms",
  approveUoms: "/uoms/approve",

  sellingPrices: "/selling-prices/items",
  updateSellingPrices: "/selling-prices",

  storageAreas: "/storage-areas",
  approveStorageAreas: "/storage-areas/approve",
  rejectStorageAreas: "/storage-areas/reject",
  toggleStorageAreaStatus:(id:string)=>`/storage-areas/${id}/status`,
  updateStorageArea:(id:string)=>`/storage-areas/${id}`,
  storageAreasApprovalRequests: "/storage-areas/approval-requests",

  salesChannels: "/sales-channels",
  approveSalesChannels: "/sales-channels/approve",
  rejectSalesChannels: "/sales-channels/reject",
  toggleSalesChannelStatus:(id:string)=>`/sales-channels/${id}/status`,
  updateSalesChannel:(id:string)=>`/sales-channels/${id}`,
  salesChannelsApprovalRequests: "/sales-channels/approval-requests",

  dailyProductions: (id:string) => `/sales-channels/${id}/daily-production`,
  dailyProductionItems: (date:string, id:string) => `/sales-channels/${id}/daily-production/items/${date}`,
  approveDailyProduction: (id:string) => `/sales-channels/${id}/daily-production/approve`,
  rejectDailyProduction: (id:string) => `/sales-channels/${id}/daily-production/reject`,
  dailyProductionApprovalRequests: (id:string) => `/sales-channels/${id}/daily-production/approval-requests`,


  saleItems:(id:string)=>`/sales-channels/${id}/items`,
  removeSaleItems:(id:string)=>`/sales-channels/${id}/remove-items`,
  addSaleItems:(id:string)=>`/sales-channels/${id}/add-items`,
  saleItemsSelection:(id:string)=> `/sales-channels/${id}/item-selection`,
  approveSaleItems: (id:string)=> `/sales-channels/${id}/items/approve`,
  rejectSaleItems: (id:string)=> `/sales-channels/${id}/items/reject`,
  saleItemsApprovalRequests: (id:string)=> `/sales-channels/${id}/items/approval-requests`,

  dailySalesSummary: (id:string) => `/sales-channels/${id}/daily-sales`,
salesTransactions: (id:string) => `/sales-channels/${id}/sales-transactions`,
  paymentMethods: "/sales/payment-methods",
  customersSearch: "/customers/search",


      getSellableItems: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/items-for-sale`,
   getStockApprovals: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/stock-approvals`,
  stockAdjust: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/stock-approvals`,
    approveStockApproval: (store_location_id: string, id:string) =>
    `api/v1/store-locations/${store_location_id}/stock-approvals/${id}/approve`,
    updateStockApproval: (store_location_id: string, id:string) =>
    `api/v1/store-locations/${store_location_id}/stock-approvals/${id}`,
  //Categories
  getCategories: "/categories",
  

   getSales: () =>
    `api/v1/sales/list`,
  createSale: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/sales/create`,
 submitSale: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/sales/create`,

  //Devices
  getDevice: (device_key: string) => `api/v1/devices/${device_key}`,
  getDevices: "api/v1/devices",
  deactivateDevice: (id: string) => `api/v1/devices/${id}/deactivate`,
  createDevice: "api/v1/devices/",
  updateDevice: (id: string) => `api/v1/devices/${id}`,

  //POS sync
  posSync: (business_location_id: string, store_location_id: string) =>
    `api/v1/pos-sync/${business_location_id}/${store_location_id}`,

  //Recipes
  getRecipes: "api/v1/recipes",
  getRecipe: (id: string) => `api/v1/recipes/${id}`,
  createRecipe: "api/v1/recipes",
  updateRecipe: (id: string) => `api/v1/recipes/${id}`,
  deleteRecipe: (id: string) => `api/v1/recipes/${id}`,
  getIngredient: `api/v1/recipes/ingredients/`,


  //Modifier Groups
    getModifierGroups: "api/v1/modifier-groups",
  createModifierGroup: "api/v1/modifier-groups",
  updateModifierGroup: (id: string) => `api/v1/modifier-groups/${id}`,
  deactivateModifierGroup: (id: string) => `api/v1/modifier-groups/${id}`,

   // Modifier endpoints
  getModifiers: "api/v1/modifiers",
  createModifier: "api/v1/modifiers",
  updateModifier: (id: string) => `api/v1/modifiers/${id}`,
  deactivateModifier: (id: string) => `api/v1/modifiers/${id}`,
  getItemsForModifierSelect: "api/v1/modifiers/modifier-items",
    linkModifierGroupToItem: "api/v1/item-modifier-groups",
  unlinkModifierGroupFromItem: "api/v1/item-modifier-groups",
  getLinkedItemsForModifierGroup: (group_id: string) => `api/v1/item-modifier-groups/${group_id}/items`,


  //Bills
  getVoidBills: (id: string) => `api/v1/store-locations/${id}/bills/void`,
  getOpenBills: (id: string) => `api/v1/store-locations/${id}/bills/open`,
  updateBillStatus: (id: string) => `api/v1/bills/${id}/status`,
  mergeBill: (id: string) => `api/v1/bills/${id}/merge`,
  splitBill: (store_location_id:string, remaining_bill_id: string) => `api/v1/store-locations/${store_location_id}/bills/${remaining_bill_id}/split`,
  closeBill: (store_location_id:string, bill_id: string) => `api/v1/store-locations/${store_location_id}/bills/${bill_id}/close`,

  // Production Batches
  listProductionBatches: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches`,
    addProductionBatchItem: (store_location_id: string, id:string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/add-item`,
  createProductionBatch: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches`,
  getOpenBatchStatus: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/open`,
  getProductionBatch: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}`,
  updateProductionBatch: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/update`,
  closeProductionBatch: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/close`,
  listProductionBatchItems: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/items`,
  getProductionBatchableItems: `api/v1/items/production-batches/batchable-items`,
   getProductionBatchableItemsBulk:  `api/v1/items/production-batches/bulk-batchable-items`,
  getBatchRemainingItems: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/remaining-items`,
  getBatchPerformance: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/performance`,
    getBatchGrossMarginTrend: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/gross-margin`,
  adjustProductionBatchStock: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/production-batches/${id}/adjust-stock`,

    // Purchase Batches
  listPurchaseBatches: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches`,
  addPurchaseBatchItem: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}/add-item`,
  createPurchaseBatch: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches`,
  getOpenPurchaseBatchStatus: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/open`,
  getPurchaseBatch: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}`,
  updatePurchaseBatch: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}`,
  adjustPurchaseBatchStock: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}/adjust-stock`,
  closePurchaseBatch: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}/close`,
  listPurchaseBatchItems: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}/items`,
  getPurchaseBatchableItems: `api/v1/items/purchase-batches/batchable-items`,
  getPurchaseBatchableItemsBulk: `api/v1/items/purchase-batches/bulk-batchable-items`,
  getPurchaseBatchRemainingItems: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}/remaining-items`,
  getPurchaseBatchPerformance: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/purchase-batches/${id}/performance`,

  //Stock counts
  listStockCounts: (store_location_id: string) =>
    `/store-locations/${store_location_id}/stock-counts`,
  createStockCount: (store_location_id: string) =>
    `/store-locations/${store_location_id}/stock-counts`,
  getStockCount: (store_location_id: string, stock_count_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}`,
  submitStockCountItem: (store_location_id: string, stock_count_id: string, item_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}/items/${item_id}/count`,
  removeStockCountItem: (store_location_id: string, stock_count_id: string, item_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}/items/${item_id}/remove`,
  addStockCountItem: (store_location_id: string, stock_count_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}/items`,
  closeStockCount: (store_location_id: string, stock_count_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}/close`,
  getStockCountVariance: (store_location_id: string, stock_count_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}/variance`,
  getStockCountVarianceSummary: (store_location_id: string, stock_count_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/${stock_count_id}/variance-summary`,
  getStockCountItemsByType: (store_location_id: string) =>
    `/store-locations/${store_location_id}/stock-counts/stock-count-items`,
  
  //Inventory Endpoints
     getReportItems: "api/v1/reports/stock-movement-items",
   getStockCard: "api/v1/reports/stock-card",
  getSlowFastMovers: "api/v1/reports/slow-fast-movers",
  getConsumptionProduction: (production_batch_id: string) => `api/v1/reports/consumption-production/${production_batch_id}`,
  getWastageShrinkage: "api/v1/reports/wastage-shrinkage",
  getSalesVsStockBalance: "api/v1/reports/sales-stock-balance",


  //Reports
      getDashboardMetrics: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/reports/dashboard-metrics`,
        getSalesReport: (store_location_id: string) =>
    `/store-locations/${store_location_id}/reports/sales`,
   getVoidBillsReport: (store_location_id: string) =>
    `/store-locations/${store_location_id}/reports/void-bills`,

  //Customers
        // Customer endpoints
getCustomers:() =>
    `api/v1/customers`,
getCustomerById:(id: string) => `/customers/${id}`,
createCustomer:() =>`/customers`,
updateCustomer:(id: string) => `/customers/${id}`,
deactivateCustomer:(id: string) => `/customers/${id}/deactivate`,


        // Supplier endpoints
getSuppliers:() =>
    `api/v1/suppliers`,
getSupplierById:(id: string) => `/suppliers/${id}`,
createSupplier:() =>`/suppliers`,
updateSupplier:(id: string) => `/suppliers/${id}`,
deactivateSupplier:(id: string) => `/suppliers/${id}/deactivate`,


  //Mpesa Integration
  getMpesaCredentials: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/mpesa/credentials`,
updateMpesaCredentials: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/mpesa/credentials`,
  createMpesaCredentials: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/mpesa/credentials`,
    deleteMpesaCredentials: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/mpesa/credentials`,

      //ETIMS Credentials
  getEtimsCredentials: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/credentials`,

  createEtimsCredentials: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/credentials`,

  updateEtimsCredentials: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/credentials/${id}`,

  deleteEtimsCredentials: (store_location_id: string, id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/credentials/${id}`,

  // ETIMS Items
createEtimsItem: (store_location_id: string) =>
  `api/v1/store-locations/${store_location_id}/etims/items`,

getEtimsItems: (store_location_id: string) =>
  `api/v1/store-locations/${store_location_id}/etims/items`,

getEtimsItemById: (store_location_id: string, item_id: string) =>
  `api/v1/store-locations/${store_location_id}/etims/items/${item_id}`,

updateEtimsItem: (store_location_id: string, item_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/items/${item_id}`,


//Etims Stock
etimsStockAdjust: (store_location_id: string) =>
  `api/v1/store-locations/${store_location_id}/etims/stock/adjust`,

  // ETIMS Customers
createEtimsCustomer: () =>
  `api/v1/etims/customers`,

getEtimsCustomers: () =>
  `api/v1/etims/customers`,

getEtimsCustomerById: (item_id: string) =>
  `api/v1/etims/customers/${item_id}`,

updateEtimsCustomer: (item_id: string) =>
    `api/v1/etims/customers/${item_id}`,


  // ETIMSSuppliers
createEtimsSupplier: () =>
  `api/v1/etims/suppliers`,

getEtimsSuppliers: () =>
  `api/v1/etims/suppliers`,


updateEtimsSupplier: (item_id: string) =>
    `api/v1/etims/suppliers/${item_id}`,

  // ETIMS Customers
getEtimsSales: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/sales`,
retryEtimsSale: (store_location_id: string, id:string) =>
  `api/v1/store-locations/${store_location_id}/etims/sales/${id}/retry`,
getEtimsCreditNotes: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/sales/credit-notes`,

//Purchases
getEtimsPurchases: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/purchases`,

//Branches
getEtimsBranches: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/branches`,
getEtimsNotices: (store_location_id: string) =>
    `api/v1/store-locations/${store_location_id}/etims/notices`,

//Reverse Invoices
getEtimsReverseInvoices: (store_location_id: string) =>
  `api/v1/store-locations/${store_location_id}/etims/reverse-invoices`,
};

