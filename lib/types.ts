import type { z } from 'zod';

// Product Types
export type Vendor = 'SignatureSolar';

export type Product = {
  id: string;
  name: string;
  sku?: string;
  vendor: Vendor;
  category?: string;
  unit: 'ea' | 'ft' | 'pack';
  price: number;
  currency: 'USD';
  url?: string;
  lastUpdated: string; // ISO string
  isActive?: boolean;
};

export type ProductFilter = {
  category?: string;
  vendor?: Vendor;
  sku?: string;
  updated_since?: string; // ISO string
  active_only?: boolean;
};

// Quote Types
export type QuoteItem = {
  id?: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  extended: number;
  notes?: string;
};

export type Customer = {
  company?: string;
  name: string;
  email?: string;
  phone?: string;
  shipTo?: string;
};

export type Quote = {
  id?: string;
  number?: string;
  createdAt?: string;
  validUntil?: string;
  preparedBy?: string;
  leadTimeNote?: string;
  discount?: number;
  shipping?: number;
  tax?: number;
  items: QuoteItem[];
  subtotal: number;
  total: number;
  terms?: string;
  customer: Customer;
};

// Crawler Types
export type CrawlJobType = 'full' | 'category' | 'product';
export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type CrawlJob = {
  id: string;
  type: CrawlJobType;
  status: CrawlJobStatus;
  startedAt?: string;
  completedAt?: string;
  targetUrl?: string;
  productsProcessed: number;
  productsUpdated: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
};

export type CrawlerConfig = {
  delayMs: number;
  maxRetries: number;
  timeoutMs: number;
  userAgent: string;
  respectRobotsTxt: boolean;
};

export type CrawlResult = {
  success: boolean;
  product?: Product;
  error?: string;
  retryAfter?: number;
};

export type CategoryCrawlResult = {
  success: boolean;
  productUrls: string[];
  nextPageUrl?: string;
  error?: string;
};

// API Types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

// Logger Types
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogContext = {
  operation?: string;
  productId?: string;
  url?: string;
  duration?: number;
  error?: Error | string;
  [key: string]: any;
};