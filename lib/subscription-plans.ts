/**
 * Subscription Plans Configuration
 *
 * Define your subscription tiers, features, and limits here.
 * These will be synced with Square and stored in NeonDB.
 */

export interface PlanFeature {
  name: string;
  description?: string;
  included: boolean;
}

export interface PlanLimits {
  quotes?: number | null; // Number of quotes per month (null = unlimited)
  products?: number | null; // Number of products in catalog
  storage?: string | null; // Storage limit (e.g., '1GB', '10GB')
  emails?: number | null; // Number of emails per month
  users?: number | null; // Number of team members
  apiCalls?: number | null; // API calls per month
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // Monthly price in dollars
  yearlyPrice?: number; // Yearly price in dollars (if different)
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  trialDays: number;
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular?: boolean;
  displayOrder: number;

  // Square-specific (will be populated after sync)
  squareCatalogId?: string;
  squareVariationId?: string;
}

/**
 * Default Subscription Plans
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    description: 'Perfect for trying out our platform',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    trialDays: 0,
    displayOrder: 1,
    features: [
      { name: 'Basic quote generation', included: true },
      { name: 'Email quotes to customers', included: true },
      { name: 'PDF export', included: true },
      { name: 'Product catalog access', included: true },
      { name: 'Square payment links', included: false },
      { name: 'Priority support', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'Advanced analytics', included: false },
    ],
    limits: {
      quotes: 5, // 5 quotes free (total, not per month)
      products: 50, // Up to 50 products
      storage: '100MB',
      emails: 10,
      users: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    description: 'For growing businesses',
    price: 29,
    yearlyPrice: 290, // ~2 months free
    currency: 'USD',
    billingPeriod: 'monthly',
    trialDays: 14,
    isPopular: true,
    displayOrder: 2,
    features: [
      { name: 'Unlimited quotes', included: true },
      { name: 'Email quotes to customers', included: true },
      { name: 'PDF export', included: true },
      { name: 'Product catalog access', included: true },
      { name: 'Square payment links', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
    ],
    limits: {
      quotes: null, // Unlimited
      storage: '5GB',
      emails: 500,
      apiCalls: 10000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For large teams and high-volume businesses',
    price: 99,
    yearlyPrice: 990, // ~2 months free
    currency: 'USD',
    billingPeriod: 'monthly',
    trialDays: 30,
    displayOrder: 3,
    features: [
      { name: 'Unlimited quotes', included: true },
      { name: 'Email quotes to customers', included: true },
      { name: 'PDF export', included: true },
      { name: 'Product catalog access', included: true },
      { name: 'Square payment links', included: true },
      { name: 'Priority support', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
    ],
    limits: {
      quotes: null, // Unlimited
      products: null, // Unlimited
      storage: '50GB',
      emails: null, // Unlimited
      users: null, // Unlimited
      apiCalls: null, // Unlimited
    },
  },
];

/**
 * Get plan by slug
 */
export function getPlanBySlug(slug: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.slug === slug);
}

/**
 * Get plan by ID
 */
export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

/**
 * Get all active plans
 */
export function getActivePlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Check if a feature is included in a plan
 */
export function isPlanFeatureIncluded(planSlug: string, featureName: string): boolean {
  const plan = getPlanBySlug(planSlug);
  if (!plan) return false;

  const feature = plan.features.find(f => f.name === featureName);
  return feature?.included ?? false;
}

/**
 * Get plan limit for a specific metric
 */
export function getPlanLimit(planSlug: string, metric: keyof PlanLimits): number | null {
  const plan = getPlanBySlug(planSlug);
  if (!plan) return 0;

  const limit = plan.limits[metric];
  if (limit === null || limit === undefined) return null; // Unlimited
  if (typeof limit === 'number') return limit;

  // Handle string limits like '1GB'
  return null;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Calculate yearly savings
 */
export function getYearlySavings(plan: SubscriptionPlan): number {
  if (!plan.yearlyPrice) return 0;
  const monthlyYearly = plan.price * 12;
  return monthlyYearly - plan.yearlyPrice;
}
