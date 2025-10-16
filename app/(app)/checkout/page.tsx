'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  features: Array<{ name: string; included: boolean }>;
  limits: any;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planSlug = searchParams?.get('plan');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planSlug) {
      router.push('/pricing');
      return;
    }

    fetchPlanDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSlug]);

  async function fetchPlanDetails() {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();

      if (data.success) {
        const selectedPlan = data.plans.find((p: Plan) => p.slug === planSlug);
        if (selectedPlan) {
          setPlan(selectedPlan);
        } else {
          setError('Plan not found');
        }
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
      setError('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (!plan) return;

    setProcessing(true);
    setError(null);

    try {
      // If it's the free plan, just create the subscription
      if (parseFloat(plan.price) === 0) {
        const response = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: plan.slug,
            billingPeriod: 'monthly',
          }),
        });

        const data = await response.json();

        if (data.success) {
          router.push('/subscription?success=true');
        } else {
          setError(data.message || 'Failed to activate free plan');
        }
      } else {
        // For paid plans, create Square checkout session
        const response = await fetch('/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: plan.slug,
          }),
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
          // Redirect to Square checkout
          window.location.href = data.checkoutUrl;
        } else {
          setError(data.message || 'Failed to initiate checkout');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function formatPrice(price: string, currency: string = 'USD'): string {
    const amount = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/pricing">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/pricing" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Pricing
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
        <p className="text-gray-600 mb-8">Review your plan selection and confirm your subscription.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Plan Summary</h2>

              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold">{plan.name}</span>
                  <span className="text-3xl font-bold">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-lg text-gray-600 font-normal">/month</span>
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              {plan.trialDays > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 text-sm font-medium">
                    🎉 {plan.trialDays}-day free trial included
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    You won&apos;t be charged until {new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Included Features:</h3>
                <ul className="space-y-2">
                  {plan.features
                    .filter((f) => f.included)
                    .map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature.name}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {plan.limits && Object.keys(plan.limits).length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">Usage Limits:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.limits.quotes !== undefined && (
                      <li>
                        • {plan.limits.quotes === null ? 'Unlimited' : plan.limits.quotes} quotes/month
                      </li>
                    )}
                    {plan.limits.products !== undefined && (
                      <li>
                        • {plan.limits.products === null ? 'Unlimited' : plan.limits.products} products
                      </li>
                    )}
                    {plan.limits.storage && <li>• {plan.limits.storage} storage</li>}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          {/* Payment Information */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Payment Information</h2>

              {parseFloat(plan.price) === 0 ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-medium">No payment required</p>
                    <p className="text-blue-600 text-sm mt-1">
                      The Free plan requires no payment information.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="w-full py-6 text-lg"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Activate Free Plan'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Button
                      onClick={handleSubscribe}
                      disabled={processing}
                      className="w-full py-6 text-lg"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By subscribing, you agree to our Terms of Service and Privacy Policy.
                      You can cancel your subscription at any time.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Secure Checkout</h3>
              <p className="text-xs text-gray-600">
                Your payment information is processed securely through Square. We never store your
                credit card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
