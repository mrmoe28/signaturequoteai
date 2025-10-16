'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PlanFeature {
  name: string;
  description?: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  features: PlanFeature[];
  limits: any;
  isPopular: boolean;
  displayOrder: number;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planSlug: string) {
    setSubscribing(planSlug);

    try {
      // Check if user is authenticated
      const authResponse = await fetch('/api/auth/me');
      const authData = await authResponse.json();

      if (!authData.user) {
        // Redirect to sign in
        window.location.href = `/auth/sign-in?redirect=/pricing?plan=${planSlug}`;
        return;
      }

      // Redirect to checkout/payment page
      window.location.href = `/checkout?plan=${planSlug}`;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setSubscribing(null);
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

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Choose Your Plan</h1>
        <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Start with a free plan and upgrade as you grow.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        {plans.filter(plan => plan.slug !== 'enterprise').map((plan) => (
          <div
            key={plan.id}
            className={`
              relative rounded-xl md:rounded-2xl border-2 p-5 md:p-8 flex flex-col
              ${
                plan.isPopular
                  ? 'border-blue-500 shadow-2xl md:scale-105'
                  : 'border-gray-200 shadow-lg'
              }
              transition-all hover:shadow-2xl
            `}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">{plan.description}</p>

              <div className="mb-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-gray-600 text-base md:text-lg">
                  /month
                </span>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 md:gap-3">
                  {feature.included ? (
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm md:text-base ${feature.included ? '' : 'text-gray-400'}`}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            {/* Limits */}
            {plan.limits && Object.keys(plan.limits).length > 0 && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm font-semibold mb-2">Includes:</p>
                <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                  {plan.limits.quotes !== undefined && (
                    <li>
                      • {plan.limits.quotes === null ? 'Unlimited quotes/month' : plan.slug === 'free' ? `${plan.limits.quotes} quotes free` : `${plan.limits.quotes} quotes/month`}
                    </li>
                  )}
                  {plan.limits.products !== undefined && (
                    <li>
                      • {plan.limits.products === null ? 'Unlimited' : plan.limits.products} products
                    </li>
                  )}
                  {plan.limits.storage && <li>• {plan.limits.storage} storage</li>}
                  {plan.limits.users !== undefined && (
                    <li>
                      • {plan.limits.users === null ? 'Unlimited' : plan.limits.users} team members
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={() => handleSubscribe(plan.slug)}
              disabled={subscribing === plan.slug}
              className={`
                w-full py-4 md:py-6 text-base md:text-lg font-semibold
                ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                    : 'bg-gray-900 hover:bg-gray-800'
                }
              `}
            >
              {subscribing === plan.slug ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : parseFloat(plan.price) === 0 ? (
                'Get Started Free'
              ) : (
                `Subscribe to ${plan.name}`
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 md:mt-20 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Frequently Asked Questions</h2>

        <div className="space-y-4 md:space-y-6">
          <div>
            <h3 className="font-semibold text-sm md:text-base mb-2">Can I change plans later?</h3>
            <p className="text-sm md:text-base text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm md:text-base mb-2">What payment methods do you accept?</h3>
            <p className="text-sm md:text-base text-gray-600">
              We accept all major credit cards (Visa, MasterCard, American Express) via Square.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm md:text-base mb-2">Can I cancel anytime?</h3>
            <p className="text-sm md:text-base text-gray-600">
              Absolutely. You can cancel your subscription at any time. No questions asked.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm md:text-base mb-2">Do you offer refunds?</h3>
            <p className="text-sm md:text-base text-gray-600">
              We do not offer refunds on paid plans. You can cancel your subscription at any time to prevent future charges.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-12 md:mt-20 text-center px-4">
        <p className="text-sm md:text-base text-gray-600 mb-4">
          Have questions or need a custom plan?
        </p>
        <Link href="/contact">
          <Button variant="outline" size="lg" className="text-sm md:text-base">
            Contact Sales
          </Button>
        </Link>
      </div>
    </div>
  );
}
