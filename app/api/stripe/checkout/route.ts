import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { stripe, createCustomer, createCheckoutSession, STRIPE_CONFIG } from '@/lib/stripe'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const checkoutSchema = z.object({
  planId: z.enum(['pro', 'annual']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId } = checkoutSchema.parse(body)

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await createCustomer(
        user.email!,
        user.name || undefined
      )
      customerId = customer.id

      // Save customer ID to database
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id))
    }

    // Get the plan configuration
    const plan = STRIPE_CONFIG.plans[planId]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Create or get price object from Stripe
    // In production, you'd create these prices in Stripe dashboard
    // For now, we'll create them dynamically
    let priceId: string
    
    try {
      // Try to find existing price first
      const prices = await stripe.prices.list({
        product: await getOrCreateProduct(),
        active: true,
        recurring: {
          interval: plan.interval,
        },
        unit_amount: plan.price,
      })

      if (prices.data.length > 0) {
        priceId = prices.data[0].id
      } else {
        // Create new price
        const price = await stripe.prices.create({
          product: await getOrCreateProduct(),
          unit_amount: plan.price,
          currency: 'usd',
          recurring: {
            interval: plan.interval,
          },
          metadata: {
            planId,
          },
        })
        priceId = price.id
      }
    } catch (error) {
      console.error('Error creating/finding price:', error)
      return NextResponse.json(
        { error: 'Failed to setup pricing' },
        { status: 500 }
      )
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId: user.id,
        planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getOrCreateProduct() {
  const productId = 'signature-quote-crawler-pro'
  
  try {
    // Try to retrieve existing product
    const product = await stripe.products.retrieve(productId)
    return product.id
  } catch (error) {
    // Product doesn't exist, create it
    const product = await stripe.products.create({
      id: productId,
      name: 'Signature QuoteCrawler Pro',
      description: 'Unlimited quotes and premium features for solar professionals',
      images: [], // Add your product images here
      metadata: {
        type: 'subscription',
      },
    })
    return product.id
  }
}