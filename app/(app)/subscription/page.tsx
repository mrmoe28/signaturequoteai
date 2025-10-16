'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  CreditCard,
  Package,
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  price: string;
  currency: string;
  billingPeriod: string;
  cancelAt?: string;
  canceledAt?: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  billingPeriod: string;
  features: Array<{ name: string; included: boolean }>;
  limits: any;
}

interface SubscriptionInfo {
  isAuthenticated: boolean;
  userId?: string;
  tier: 'free' | 'pro' | 'enterprise';
  subscription: Subscription | null;
  plan?: Plan;
  features: any[];
  limits: any;
}

interface UsageData {
  quotes: { current: number; limit: number | null };
  products: { current: number; limit: number | null };
  storage: { current: string; limit: string };
}

export default function SubscriptionPage() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
    fetchUsage();
  }, []);

  async function fetchSubscriptionInfo() {
    try {
      const response = await fetch('/api/subscriptions/me');
      const data = await response.json();

      if (data.success !== false) {
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      const response = await fetch('/api/subscriptions/usage');
      const data = await response.json();

      if (data.success) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  }

  async function handleCancelSubscription() {
    if (!subscriptionInfo?.subscription) return;

    const confirmed = confirm(
      'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.'
    );

    if (!confirmed) return;

    setActionLoading('cancel');

    try {
      const response = await fetch(
        `/api/subscriptions/${subscriptionInfo.subscription.id}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'User initiated',
            cancelImmediately: false,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Subscription canceled successfully');
        fetchSubscriptionInfo();
      } else {
        alert(data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePauseSubscription() {
    if (!subscriptionInfo?.subscription) return;

    setActionLoading('pause');

    try {
      const response = await fetch(
        `/api/subscriptions/${subscriptionInfo.subscription.id}/pause`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Subscription paused successfully');
        fetchSubscriptionInfo();
      } else {
        alert(data.message || 'Failed to pause subscription');
      }
    } catch (error) {
      console.error('Pause error:', error);
      alert('Failed to pause subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResumeSubscription() {
    if (!subscriptionInfo?.subscription) return;

    setActionLoading('resume');

    try {
      const response = await fetch(
        `/api/subscriptions/${subscriptionInfo.subscription.id}/resume`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Subscription resumed successfully');
        fetchSubscriptionInfo();
      } else {
        alert(data.message || 'Failed to resume subscription');
      }
    } catch (error) {
      console.error('Resume error:', error);
      alert('Failed to resume subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'canceled':
        return 'text-red-600 bg-red-50';
      case 'past_due':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function calculateUsagePercentage(current: number, limit: number | null): number {
    if (limit === null) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!subscriptionInfo?.isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your subscription details.
          </p>
          <Link href="/auth/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { subscription, plan, tier, limits } = subscriptionInfo;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription</h1>
        <p className="text-gray-600">Manage your plan and billing</p>
      </div>

      {/* Current Plan Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{plan?.name || tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</h2>
              {subscription && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              )}
            </div>
            <p className="text-gray-600">{plan?.description}</p>
          </div>
          <Package className="w-8 h-8 text-blue-600" />
        </div>

        {subscription ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-lg font-semibold">
                  ${subscription.price}/{subscription.billingPeriod === 'monthly' ? 'mo' : 'yr'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Current Period</p>
                <p className="text-lg font-semibold">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Renewal</p>
                <p className="text-lg font-semibold">
                  {subscription.cancelAt
                    ? `Cancels on ${formatDate(subscription.cancelAt)}`
                    : `Renews ${formatDate(subscription.currentPeriodEnd)}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">You are currently on the free plan</p>
            <Link href="/pricing">
              <Button>Upgrade Plan</Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Usage Card */}
      {usage && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-6">Usage This Period</h3>

          <div className="space-y-6">
            {/* Quotes Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Quotes</span>
                <span className="text-sm text-gray-600">
                  {usage.quotes.current} / {usage.quotes.limit === null ? 'Unlimited' : usage.quotes.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${calculateUsagePercentage(usage.quotes.current, usage.quotes.limit)}%`,
                  }}
                />
              </div>
            </div>

            {/* Products Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Products</span>
                <span className="text-sm text-gray-600">
                  {usage.products.current} / {usage.products.limit === null ? 'Unlimited' : usage.products.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${calculateUsagePercentage(usage.products.current, usage.products.limit)}%`,
                  }}
                />
              </div>
            </div>

            {/* Storage Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Storage</span>
                <span className="text-sm text-gray-600">
                  {usage.storage.current} / {usage.storage.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: '25%' }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Features Card */}
      {plan && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-6">Plan Features</h3>

          <div className="grid md:grid-cols-2 gap-4">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                {feature.included ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={feature.included ? '' : 'text-gray-400'}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {subscription ? (
          <>
            {subscription.status === 'active' && !subscription.cancelAt && (
              <>
                <Link href="/pricing">
                  <Button variant="outline">
                    Change Plan
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={handlePauseSubscription}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'pause' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Pause Subscription'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={!!actionLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  {actionLoading === 'cancel' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              </>
            )}

            {subscription.status === 'paused' && (
              <Button onClick={handleResumeSubscription} disabled={!!actionLoading}>
                {actionLoading === 'resume' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Resume Subscription'
                )}
              </Button>
            )}

            {subscription.cancelAt && subscription.status === 'active' && (
              <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  Your subscription will be canceled on {formatDate(subscription.cancelAt)}.
                  You can continue to use all features until then.
                </p>
              </div>
            )}
          </>
        ) : (
          <Link href="/pricing">
            <Button>Upgrade to Pro</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
