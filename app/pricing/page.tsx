'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Check, Zap, Crown } from 'lucide-react'
import { STRIPE_CONFIG, formatPrice } from '@/lib/stripe'

export default function PricingPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const router = useRouter()

  const handleUpgrade = async (planId: 'pro' | 'annual') => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/pricing')
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  const isSubscribed = session?.user?.subscriptionStatus === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start with our free tier and upgrade when you&apos;re ready for unlimited quotes
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={`mr-3 ${billingInterval === 'month' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingInterval === 'year' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Annual
            </span>
            {billingInterval === 'year' && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 relative">
            <div className="text-center mb-8">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $0
                <span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <p className="text-gray-600">Perfect for getting started</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">3 quotes per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Basic PDF export</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Email quotes to customers</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Product price tracking</span>
              </li>
            </ul>

            <Button 
              className="w-full"
              variant="outline"
              disabled
            >
              Current Plan
            </Button>
          </div>

          {/* Pro Monthly/Annual */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-8 relative lg:scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-8">
              <Crown className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Pro {billingInterval === 'year' ? 'Annual' : 'Monthly'}
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {billingInterval === 'year' 
                  ? formatPrice(STRIPE_CONFIG.plans.annual.price / 12).replace('.00', '')
                  : formatPrice(STRIPE_CONFIG.plans.pro.price)
                }
                <span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              {billingInterval === 'year' && (
                <p className="text-green-600 font-medium">
                  {formatPrice(STRIPE_CONFIG.plans.annual.price)} billed annually
                </p>
              )}
              <p className="text-gray-600 mt-2">Everything you need to scale</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700 font-medium">Unlimited quotes</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Professional PDF branding</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Priority customer support</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Custom company branding</span>
              </li>
              {billingInterval === 'year' && (
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 font-medium">20% annual discount</span>
                </li>
              )}
            </ul>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleUpgrade(billingInterval === 'year' ? 'annual' : 'pro')}
              disabled={loading !== null || isSubscribed}
            >
              {loading === (billingInterval === 'year' ? 'annual' : 'pro') ? (
                'Redirecting...'
              ) : isSubscribed ? (
                'Current Plan'
              ) : (
                `Upgrade to Pro ${billingInterval === 'year' ? 'Annual' : ''}`
              )}
            </Button>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 relative">
            <div className="text-center mb-8">
              <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                Custom
              </div>
              <p className="text-gray-600">For large teams and integrations</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Everything in Pro</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">API access</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Custom integrations</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Dedicated support</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Custom onboarding</span>
              </li>
            </ul>

            <Button 
              className="w-full"
              variant="outline"
              onClick={() => window.location.href = 'mailto:sales@example.com'}
            >
              Contact Sales
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access 
                to Pro features until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                What happens to my quotes if I downgrade?
              </h3>
              <p className="text-gray-600">
                All your existing quotes remain accessible. You&apos;ll just be limited to 3 new quotes 
                per month on the free plan.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you&apos;re not satisfied, 
                contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}