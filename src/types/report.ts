export interface User {
    id: number;
    name: string;
  }
  
  export interface ReportFilters {
    startDate: string; // ISO string
    endDate: string;
    categoryId?: number;
    userId?: number;
    customerId?: number;
  }