# Subscription Paywall Setup Guide

## 🎯 Overview

This guide covers the complete subscription paywall system using Square for payment processing and NeonDB for data storage.

## ✅ What's Already Implemented

### 1. Database Schema (✓ Complete)
- **subscription_plans** - Subscription tiers (Free, Pro, Enterprise)
- **subscriptions** - User subscriptions with Square sync
- **subscription_invoices** - Billing history
- **subscription_usage** - Usage tracking and limits

### 2. Subscription Plans (✓ Complete)
Located in: `lib/subscription-plans.ts`

**Available Plans:**
- **Free**: $0/month - 5 quotes, 50 products, basic features
- **Pro**: $29/month - Unlimited quotes, Square payments, priority support
- **Enterprise**: $99/month - Unlimited everything, team collaboration, SLA

### 3. Database Queries (✓ Complete)
Located in: `lib/db/subscription-queries.ts`

**Functions Available:**
- `getUserSubscription(userId)` - Get active subscription
- `createSubscription(data)` - Create new subscription
- `updateSubscription(id, data)` - Update subscription
- `cancelSubscription(id)` - Cancel subscription
- `incrementUsage(subscriptionId, metric, amount)` - Track usage
- `hasExceededLimit(subscriptionId, metric)` - Check limits

### 4. Square Integration (✓ Complete)
Located in: `lib/square-subscriptions.ts`

**Functions Available:**
- `createSquareSubscription(params)` - Create subscription via Square
- `cancelSquareSubscription(id)` - Cancel in Square
- `pauseSquareSubscription(id)` - Pause subscription
- `resumeSquareSubscription(id)` - Resume subscription
- `syncSubscriptionFromSquare(squareId)` - Sync data from Square

## 🚀 Next Steps: Implementation

### Step 1: Run Database Migrations

```bash
# Generate migration
npx drizzle-kit generate:pg

# Push to database
npx drizzle-kit push:pg
```

### Step 2: Seed Subscription Plans

Create a seed script:

```typescript
// scripts/seed-plans.ts
import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { SUBSCRIPTION_PLANS } from '../lib/subscription-plans';

async function seedPlans() {
  for (const plan of SUBSCRIPTION_PLANS) {
    await db.insert(subscriptionPlans).values({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price.toString(),
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      trialDays: plan.trialDays,
      features: JSON.stringify(plan.features),
      limits: JSON.stringify(plan.limits),
      isPopular: plan.isPopular ? 'true' : 'false',
      displayOrder: plan.displayOrder,
    });
  }

  console.log('✅ Subscription plans seeded successfully');
}

seedPlans();
```

Run it:
```bash
tsx scripts/seed-plans.ts
```

### Step 3: Create Subscription Middleware

Create `lib/subscription-middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from './auth';
import { getUserSubscription } from './db/subscription-queries';
import { getPlanLimit } from './subscription-plans';

export async function requireSubscription(minPlan: 'free' | 'pro' | 'enterprise' = 'free') {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await getUserSubscription(user.id);

  if (!subscription) {
    // No subscription - treat as free plan
    if (minPlan !== 'free') {
      return NextResponse.json(
        { error: 'Subscription required', upgradeUrl: '/pricing' },
        { status: 403 }
      );
    }
  }

  return null; // Authorized
}

export async function checkFeatureAccess(featureName: string) {
  const user = await getUser();
  if (!user) return false;

  const subscription = await getUserSubscription(user.id);
  const planSlug = subscription?.planId || 'free';

  // Check if feature is included in plan
  const { isPlanFeatureIncluded } = await import('./subscription-plans');
  return isPlanFeatureIncluded(planSlug, featureName);
}

export async function checkUsageLimit(metric: string, incrementBy: number = 1) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');

  const subscription = await getUserSubscription(user.id);
  if (!subscription) {
    // Free plan - check free limits
    const limit = getPlanLimit('free', metric as any);
    // ... implement limit check
  }

  const { hasExceededLimit, incrementUsage } = await import('./db/subscription-queries');

  const usage = await hasExceededLimit(subscription.id, metric);

  if (usage.exceeded) {
    return {
      allowed: false,
      current: usage.current,
      limit: usage.limit,
      upgradeUrl: '/pricing',
    };
  }

  // Increment usage
  await incrementUsage(subscription.id, user.id, metric, incrementBy);

  return {
    allowed: true,
    current: usage.current + incrementBy,
    limit: usage.limit,
  };
}
```

### Step 4: Add Webhook Handler

Update `app/api/webhooks/square/route.ts` to handle subscription events:

```typescript
// Add these event handlers
case 'subscription.created':
  await handleSubscriptionCreated(event.data.object);
  break;

case 'subscription.updated':
  await handleSubscriptionUpdated(event.data.object);
  break;

case 'subscription.canceled':
  await handleSubscriptionCanceled(event.data.object);
  break;

case 'invoice.paid':
  await handleInvoicePaid(event.data.object);
  break;
```

### Step 5: Create Subscription API Routes

**Create Subscription** - `app/api/subscriptions/create/route.ts`:

```typescript
import { createSquareSubscription } from '@/lib/square-subscriptions';
import { getUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { planSlug, paymentMethodId } = await request.json();

  const result = await createSquareSubscription({
    userId: user.id,
    planSlug,
    customerEmail: user.email!,
    customerName: user.name || user.email!,
    paymentMethodId,
  });

  return Response.json(result);
}
```

**Cancel Subscription** - `app/api/subscriptions/[id]/cancel/route.ts`:

```typescript
import { cancelSquareSubscription } from '@/lib/square-subscriptions';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { reason, feedback } = await request.json();

  const result = await cancelSquareSubscription(params.id, reason, feedback);

  return Response.json(result);
}
```

### Step 6: Create Pricing Page UI

Create `app/(app)/pricing/page.tsx`:

```typescript
'use client';

import { getActivePlans, formatPrice } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const plans = getActivePlans();

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`
            border rounded-lg p-6
            ${plan.isPopular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
          `}>
            {plan.isPopular && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                Most Popular
              </span>
            )}

            <h2 className="text-2xl font-bold mt-4">{plan.name}</h2>
            <p className="text-gray-600 mt-2">{plan.description}</p>

            <div className="mt-6">
              <span className="text-4xl font-bold">
                {formatPrice(plan.price)}
              </span>
              <span className="text-gray-600">/month</span>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  {feature.included ? '✓' : '×'}
                  <span className={feature.included ? '' : 'text-gray-400'}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <Button className="w-full mt-8">
              {plan.price === 0 ? 'Get Started' : 'Subscribe'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 7: Protect Routes with Middleware

In your API routes:

```typescript
// Example: Protect quote creation
import { checkUsageLimit } from '@/lib/subscription-middleware';

export async function POST(request: Request) {
  // Check if user can create more quotes
  const usage = await checkUsageLimit('quotes', 1);

  if (!usage.allowed) {
    return Response.json({
      error: 'Quota exceeded',
      current: usage.current,
      limit: usage.limit,
      upgradeUrl: usage.upgradeUrl,
    }, { status: 403 });
  }

  // ... proceed with quote creation
}
```

## 🔧 Configuration Checklist

- [ ] Run database migrations
- [ ] Seed subscription plans to database
- [ ] Configure Square webhook URL
- [ ] Set up Square subscription products in Square Dashboard
- [ ] Update Square webhook handler to process subscription events
- [ ] Create subscription management UI
- [ ] Add usage tracking to quote/product creation
- [ ] Test subscription creation flow
- [ ] Test payment processing
- [ ] Test webhook events
- [ ] Test cancellation flow

## 📝 Testing

### Test Subscription Creation:

```bash
curl -X POST http://localhost:3000/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -d '{
    "planSlug": "pro",
    "paymentMethodId": "card_id_from_square"
  }'
```

### Test Usage Limits:

```typescript
const usage = await checkUsageLimit('quotes', 1);
console.log('Can create quote:', usage.allowed);
console.log('Current usage:', usage.current, '/', usage.limit);
```

## 🎨 UI Components Needed

1. **Pricing Page** - Display plans and subscribe buttons
2. **Subscription Dashboard** - Show current plan, usage, billing
3. **Upgrade Modal** - Prompt when limits reached
4. **Payment Form** - Collect payment method via Square
5. **Invoice History** - List past invoices
6. **Usage Meters** - Show quota usage for each metric

## 🔐 Security Considerations

- Always verify webhooks from Square using signature verification
- Never expose subscription IDs in client-side code
- Implement rate limiting on subscription endpoints
- Log all subscription changes for audit trail
- Encrypt sensitive subscription data at rest

## 📚 Resources

- [Square Subscriptions API](https://developer.squareup.com/docs/subscriptions-api/overview)
- [Square Webhooks](https://developer.squareup.com/docs/webhooks/overview)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)

---

**Need help?** Check the implementation files:
- `lib/subscription-plans.ts` - Plan configuration
- `lib/square-subscriptions.ts` - Square integration
- `lib/db/subscription-queries.ts` - Database operations
