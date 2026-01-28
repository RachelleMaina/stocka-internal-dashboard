export const routes = {
  //Permissions
  permissions:"/permissions",
  listInternalPermissions:"/permissions/internal",
  listBackofficePermissions:"/permissions/backoffice",
  listPosPermissions:"/permissions/pos",


  //Items
listItems:"/items/catalogue/list",
addItems:"/items/catalogue/add",
editItems:"/items/catalogue/edit",
approveItems:"/items/catalogue/approval-requests",
viewItemLogs:"/items/catalogue/logs",

  //Selling Prices
  listSellingPrices:"/items/selling-prices/list",
  addSellingPrices:"/items/selling-prices/manage",
  editSellingPrices:"/items/selling-prices/edit",
  approveSellingPrices:"/items/selling-prices/approval-requests",
  viewSellingPriceLogs:"/items/selling-prices/logs",


    //UOMS
    listUoms:"/items/uoms/list",
    addUoms:"/items/uoms/add",
    editUoms:"/items/uoms/edit",
    approveUoms:"/items/uoms/approval-requests",
    viewUomLogs:"/items/uoms/logs",
  manageUoms:"/items/uoms/manage",
 
   //Sale Items
   listSalesItems:"/items/sale-items/list",
   addSalesItems:"/items/sale-items/add",
   listSalesItemsSalesChannels:"/items/sale-items",
   approveSalesItems:"/items/sale-items/approval-requests",
   saleItems:"/items/sale-items",
   addSaleItems:"/pos/add-pos-items",
   posSalesChannels:"/pos/add-pos-items",
 

//Settings
listStorageAreas:"/settings/storage-areas/list",
listSalesChannels:"/settings/sales-channels/list",

//Bills
listBills:"/bills",
createBill:"/bills",
updateBill:(id:string)=>`/bills/${id}`,
addBillPayment:(id:string)=>`/bills/${id}/payment`,
voidBill:(id:string)=>`/bills/${id}/void`,

    //Pos routes
    sell: "/pos/sell",
    posLogin: "/pos-login",
      posLogout: "/pos/pos-logout",
    posSetup: "/pos/pos-setup",
     pos: "/pos",
    posSales: "/pos/sales",
    posBills: "/pos/bills",
      posCustomers: "/pos/customers",
    // Backoffice routes
    backofficeLogin: "/login",
    register: "/register",
    backoffice: "/dashboard",
    home: "/",
  

 
  quickAddItems: "/items/quick-add-items",
  items: "/items",
    itemApprovals: "/items/item-approvals",
  itemsList: "/items/items-list",
  simpleItemForm: "/items/items-list/simple-item-form",
  bulkItemForm: "/items/items-list/bulk-item-form",
  serviceForm: "/items/items-list/service-form",
  bulkItems: "/items/bulk-items",
  categories: "/items/categories",
  uoms: "/items/uoms",

  //People
  people: "/people",
  staff: "/people/staff",
  staffForm: "/people/staff/form",
  roles: "/people/roles",
  roleForm: "/people/roles/form",

customers:"/people/customers",
suppliers:"/people/suppliers",
  //Stores
  stores: "/stores",
  printers: "/stores/printers",

  //Inventory
  inventory: "/inventory",
  stockLevels: "/inventory/stock-levels",
  purchaseBatches: "/inventory/purchases",
  purchaseBatchForm: "/inventory/purchases/form",
  purchaseBatchReport: "/inventory/purchases/report",
  stockCounts: "/inventory/stock-counts",
  stockCountForm: "/inventory/stock-counts/form",
  stockCountReport: "/inventory/stock-counts/report",
 

  //Purchases

  directPurchases: "/purchases/direct-purchases",
  purchaseOrders: "/purchases/purchase-orders",

  //Production
  production: "/production",
  productionBatches: "/production/batches",
  productionBatchForm: "/production/batches/form",
  productionBatchReport: "/production/batches/report",
  recipes: "/production/recipes",
  recipesForm: "/production/recipes/form",
  modifierGroups: "/production/modifier-groups",
  modifiers: "/production/modifiers",
  //Reports
  reports: "/reports",

  // Sales
    sales2: "/sales",
   salesTransactions: "/sales/sales",

  //Settings
  settings: "/settings",
    devices: "/settings/devices",
  locations: "/settings/locations",
  businessDetails: "/settings/business-details",
  mpesaIntegration: "/settings/mpesa-integration",
  etims: "/etims",
  etimsItems: "/etims/items",
  etimsCustomers: "/etims/customers",
  etimsSuppliers: "/etims/suppliers",
    etimsPurchases: "/etims/purchases",
  etimsSales: "/etims/sales",
  etimsCreditNotes: "/etims/credit_notes",
  etimsBranches: "/etims/branches",
  etimsNotices: "/etims/notices",
  etimsReverseInvoices: "/etims/reverse-invoices",
                       

  //Subscriptions
  subscriptions: "/subscriptions",

  //Reports
  stockCard: "/reports/stock-card",
  sales: "/reports/sales",
  voidBills: "/reports/void-bills",
  slowFatsMovers: "/reports/slow-fast-movers",
  consumptionProduction: "/reports/consumption-production",
  wastageShrinkage: "/reports/wastage-shrinkage",
  salesStockBalance: "/reports/sales-stock-balance",
  grossMarginTrend: "/reports/gross-margin",

  //Sales

  salesList: "/sales/sales-list",
};
