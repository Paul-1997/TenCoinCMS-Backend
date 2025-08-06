import { ProductStatus } from '@prisma/client';

// 廠商類型
export interface Vendor {
  id: string;
  name: string;
}

// API 回應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分頁回應類型
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 產品相關類型
export interface CreateProductRequest {
  name: string;
  barcode: string;
  costPrice: number;
  sellPrice: number;
  vendors: string[];
  imagePath?: string;
  tags?: string[];
  note?: string;
}

export interface UpdateProductRequest {
  name?: string;
  barcode?: string;
  costPrice?: number;
  sellPrice?: number;
  vendors?: string[];
  imagePath?: string;
  status?: ProductStatus;
  isOrdered?: boolean;
  tags?: string[];
  note?: string;
}

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  status?: ProductStatus;
  isOrdered?: boolean;
  keyword?: string;
  tags?: string[];
  vendors?: string[];
}

// 訂單相關類型
export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  note?: string;
}

export interface UpdateOrderRequest {
  items?: CreateOrderItemRequest[];
  note?: string;
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

// 統計資料類型
export interface DashboardStats {
  totalProducts: number;
  outOfStockProducts: number;
  orderedProducts: number;
  totalOrders: number;
  todayOrders: number;
} 