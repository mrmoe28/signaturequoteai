/**
 * Feature Gating System
 *
 * Controls access to features based on subscription plans
 */

export type FeatureName =
  | 'unlimited_quotes'
  | 'square_payment_links'
  | 'advanced_analytics'
  | 'custom_branding'
  | 'api_access'
  | 'priority_support'
  | 'team_collaboration'
  | 'custom_integrations';

export type UsageMetric = 'quotes' | 'products' | 'emails' | 'users' | 'storage';

export interface PlanLimits {
  quotes: number | null; // null = unlimited
  products: number | null;
  storage: string;
  emails: number | null;
  users: number | null;
  apiCalls?: number | null;
}

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: string;
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface UsageData {
  metric: UsageMetric;
  current: number;
  limit: number | null; // null = unlimited
  percentage: number; // 0-100
}

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(
  subscription: UserSubscription | null,
  feature: FeatureName
): boolean {
  // No subscription = Free plan
  if (!subscription) {
    // Free plan has Square payment links enabled
    const freeFeatures: FeatureName[] = ['square_payment_links'];
    return freeFeatures.includes(feature);
  }

  const planSlug = subscription.plan.slug.toLowerCase();

  // Enterprise has access to everything
  if (planSlug === 'enterprise') {
    return true;
  }

  // Pro plan feature access
  if (planSlug === 'pro') {
    const proFeatures: FeatureName[] = [
      'unlimited_quotes',
      'square_payment_links',
      'advanced_analytics',
      'custom_branding',
      'api_access',
      'priority_support',
    ];
    return proFeatures.includes(feature);
  }

  // Free plan features
  if (planSlug === 'free') {
    const freeFeatures: FeatureName[] = ['square_payment_links'];
    return freeFeatures.includes(feature);
  }

  return false;
}

/**
 * Check if user has reached their usage limit for a metric
 */
export function hasReachedLimit(
  subscription: UserSubscription | null,
  metric: UsageMetric,
  currentUsage: number
): boolean {
  if (!subscription) {
    // Free plan limits (should match database)
    const freeLimits: Record<UsageMetric, number> = {
      quotes: 5,
      products: 50,
      emails: 10,
      users: 1,
      storage: 100, // MB
    };
    return currentUsage >= freeLimits[metric];
  }

  const limit = subscription.plan.limits[metric];

  // null = unlimited
  if (limit === null) {
    return false;
  }

  // Parse string limits (like "5GB" for storage)
  if (typeof limit === 'string') {
    // Handle storage limits
    if (metric === 'storage') {
      const limitValue = parseStorageLimit(limit);
      return currentUsage >= limitValue;
    }
  }

  // Numeric limit check
  return currentUsage >= (limit as number);
}

/**
 * Get usage percentage for a metric
 */
export function getUsagePercentage(
  subscription: UserSubscription | null,
  metric: UsageMetric,
  currentUsage: number
): number {
  const limit = subscription?.plan.limits[metric];

  // Unlimited = 0% (never reaches 100%)
  if (limit === null) {
    return 0;
  }

  if (typeof limit === 'string' && metric === 'storage') {
    const limitValue = parseStorageLimit(limit);
    return Math.min(100, Math.round((currentUsage / limitValue) * 100));
  }

  const numericLimit = limit as number;
  return Math.min(100, Math.round((currentUsage / numericLimit) * 100));
}

/**
 * Get user's current plan name
 */
export function getPlanName(subscription: UserSubscription | null): string {
  return subscription?.plan.name || 'Free';
}

/**
 * Check if user can perform an action (combines feature + usage checks)
 */
export function canPerformAction(
  subscription: UserSubscription | null,
  action: {
    feature?: FeatureName;
    metric?: UsageMetric;
    currentUsage?: number;
  }
): { allowed: boolean; reason?: string } {
  // Check feature access first
  if (action.feature && !hasFeatureAccess(subscription, action.feature)) {
    return {
      allowed: false,
      reason: `This feature requires a Pro plan. You are currently on the ${getPlanName(subscription)} plan.`,
    };
  }

  // Check usage limits
  if (action.metric && action.currentUsage !== undefined) {
    if (hasReachedLimit(subscription, action.metric, action.currentUsage)) {
      const limit = subscription?.plan.limits[action.metric] || getFreePlanLimit(action.metric);
      return {
        allowed: false,
        reason: `You have reached your ${action.metric} limit (${limit}). Upgrade to Pro for unlimited ${action.metric}.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get upgrade message for blocked feature
 */
export function getUpgradeMessage(
  feature?: FeatureName,
  metric?: UsageMetric
): string {
  if (feature) {
    const featureMessages: Record<FeatureName, string> = {
      unlimited_quotes: 'Upgrade to Pro for unlimited quotes',
      square_payment_links: 'Square payment links are available on all plans',
      advanced_analytics: 'Upgrade to Pro to access advanced analytics and reporting',
      custom_branding: 'Upgrade to Pro to customize your quote branding',
      api_access: 'Upgrade to Pro to access the API',
      priority_support: 'Upgrade to Pro for priority customer support',
      team_collaboration: 'Upgrade to Enterprise for team collaboration features',
      custom_integrations: 'Upgrade to Enterprise for custom integrations',
    };
    return featureMessages[feature];
  }

  if (metric) {
    const metricMessages: Record<UsageMetric, string> = {
      quotes: 'Upgrade to Pro for unlimited quotes',
      products: 'Upgrade to Pro for access to all products in our catalog',
      emails: 'Upgrade to Pro for 500 emails per month',
      users: 'Upgrade to Pro for more team members',
      storage: 'Upgrade to Pro for 5GB of storage',
    };
    return metricMessages[metric];
  }

  return 'Upgrade to Pro to unlock this feature';
}

/**
 * Helper: Parse storage limits like "5GB" to MB
 */
function parseStorageLimit(limit: string): number {
  const match = limit.match(/^(\d+(?:\.\d+)?)(MB|GB|TB)$/i);
  if (!match) return 0;

  const [, value, unit] = match;
  const numValue = parseFloat(value);

  switch (unit.toUpperCase()) {
    case 'MB':
      return numValue;
    case 'GB':
      return numValue * 1024;
    case 'TB':
      return numValue * 1024 * 1024;
    default:
      return 0;
  }
}

/**
 * Helper: Get free plan limits
 */
function getFreePlanLimit(metric: UsageMetric): number | string {
  const freeLimits: Record<UsageMetric, number | string> = {
    quotes: 5,
    products: 50,
    emails: 10,
    users: 1,
    storage: '100MB',
  };
  return freeLimits[metric];
}

/**
 * Get all usage data for display
 */
export function getAllUsageData(
  subscription: UserSubscription | null,
  currentUsage: Record<UsageMetric, number>
): UsageData[] {
  const metrics: UsageMetric[] = ['quotes', 'products', 'emails', 'users', 'storage'];

  return metrics.map(metric => {
    const current = currentUsage[metric] || 0;
    const limit = subscription?.plan.limits[metric] || getFreePlanLimit(metric);
    const numericLimit = typeof limit === 'string' ? parseStorageLimit(limit) : limit;

    return {
      metric,
      current,
      limit: numericLimit,
      percentage: getUsagePercentage(subscription, metric, current),
    };
  });
}
