import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  plans: {
    pro: {
      name: 'Pro Plan',
      description: 'Unlimited quotes and premium features',
      price: 2999, // $29.99 in cents
      interval: 'month' as const,
      features: [
        'Unlimited quotes',
        'Professional PDF branding',
        'Priority customer support',
        'Advanced analytics',
        'Custom company branding',
      ],
    },
    annual: {
      name: 'Pro Annual',
      description: 'Unlimited quotes - Save 20% with annual billing',
      price: 28788, // $287.88 in cents (20% discount)
      interval: 'year' as const,
      features: [
        'Everything in Pro Plan',
        '20% annual discount',
        'Priority support',
        'Early access to new features',
      ],
    },
  },
  webhook: {
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
} as const

export type PlanId = keyof typeof STRIPE_CONFIG.plans

// Helper functions
export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100)
}

export function getPlanById(planId: PlanId) {
  return STRIPE_CONFIG.plans[planId]
}

export async function createCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'signature-quote-crawler',
    },
  })
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
    allow_promotion_codes: true,
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function reactivateSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}