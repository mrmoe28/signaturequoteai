import type { z } from 'zod';

// Product Types
export type Vendor = 'SignatureSolar';

export type ProductImage = {
  id: string;
  url: string; // Original source URL
  localPath: string; // Local storage path/URL
  alt?: string;
  isPrimary: boolean;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
};

export type Product = {
  id: string;
  name: string;
  sku?: string;
  vendor: Vendor;
  category?: string;
  unit: 'ea' | 'ft' | 'pack';
  price: number | null;
  currency: 'USD';
  url?: string;
  lastUpdated: string; // ISO string
  isActive?: boolean;
  description?: string;
  // Image fields
  primaryImageUrl?: string; // Quick access to main image
  images: ProductImage[];
  
  // Enhanced product data
  shortDescription?: string;
  specifications?: Record<string, string>;
  features?: string[];
  dimensions?: string;
  weight?: string;
  warranty?: string;
  powerRating?: string;
  voltage?: string;
  efficiency?: string;
  certifications?: string[];
  inStock?: boolean;
  availability?: string;
  stockQuantity?: number;
  metaTitle?: string;
  metaDescription?: string;
  categories?: string[];
  tags?: string[];
  reviews?: {
    averageRating?: number;
    totalReviews?: number;
    reviews?: Array<{
      id: string;
      rating: number;
      comment: string;
      author: string;
      date: string;
    }>;
  };
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
  unitPrice: number | null;
  quantity: number;
  extended: number;
  notes?: string;
  imageUrl?: string;
};

export type Customer = {
  id?: string;
  company?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Quote = {
  id?: string;
  number?: string;
  customerId?: string;
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
  shipTo?: string;
  customer: Customer; // Always populated with customer data

  // Status tracking
  status?: QuoteStatus;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;

  // Payment tracking
  paymentStatus?: PaymentStatus;
  paymentLink?: string;
  paymentId?: string;
  paidAt?: string;

  // Additional metadata
  pdfUrl?: string;
  notes?: string;
  updatedAt?: string;
  deletedAt?: string;
};

// Crawler Types
export type CrawlJobType = 'full' | 'category' | 'product';

export type CompanySettings = {
  id: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxId?: string;
  defaultTerms?: string;
  defaultLeadTime?: string;
  quotePrefix: string;
  createdAt: string;
  updatedAt: string;
};
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