import Stripe from 'stripe';

// Initialize Stripe (only on server-side)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    missions: 3,
    features: ['3 missions per week', 'Basic progress tracking', 'Community support'],
  },
  premium: {
    name: 'Premium',
    price: 500, // $5.00 in cents
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    missions: -1, // unlimited
    features: [
      'Unlimited missions',
      'AI voice conversations with Sunny',
      'Advanced progress analytics',
      'Parent dashboard',
      'Priority support',
      'Downloadable progress reports',
    ],
  },
  annual: {
    name: 'Annual',
    price: 5000, // $50.00 in cents
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || '',
    missions: -1,
    features: [
      'All Premium features',
      '2 months free ($60 value for $50)',
      'Early access to new features',
      'Priority feature requests',
    ],
  },
};

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer: params.customerId,
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return session;
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  return subscription;
}

/**
 * Reactivate subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}
