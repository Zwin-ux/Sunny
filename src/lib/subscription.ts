/**
 * Subscription utilities for Sunny AI
 * Handles subscription tiers, feature gates, and billing logic
 */

export type SubscriptionTier = 'free' | 'premium' | 'annual';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface SubscriptionFeatures {
  maxMissionsPerWeek: number;
  hasVoice: boolean;
  hasAdvancedAnalytics: boolean;
  hasParentDashboard: boolean;
  hasPrioritySupport: boolean;
  hasDownloadableReports: boolean;
  hasCustomLearningPaths: boolean;
}

/**
 * Get features for a subscription tier
 */
export function getSubscriptionFeatures(tier: SubscriptionTier): SubscriptionFeatures {
  switch (tier) {
    case 'free':
      return {
        maxMissionsPerWeek: 3,
        hasVoice: false,
        hasAdvancedAnalytics: false,
        hasParentDashboard: false,
        hasPrioritySupport: false,
        hasDownloadableReports: false,
        hasCustomLearningPaths: false,
      };

    case 'premium':
    case 'annual':
      return {
        maxMissionsPerWeek: -1, // unlimited
        hasVoice: true,
        hasAdvancedAnalytics: true,
        hasParentDashboard: true,
        hasPrioritySupport: true,
        hasDownloadableReports: true,
        hasCustomLearningPaths: true,
      };

    default:
      return getSubscriptionFeatures('free');
  }
}

/**
 * Check if user can use voice feature
 */
export function canUseVoice(subscription: UserSubscription): boolean {
  const features = getSubscriptionFeatures(subscription.tier);
  return features.hasVoice && subscription.status === 'active';
}

/**
 * Check if user can start a new mission
 */
export function canStartMission(
  subscription: UserSubscription,
  missionsThisWeek: number
): boolean {
  const features = getSubscriptionFeatures(subscription.tier);
  
  // Unlimited missions
  if (features.maxMissionsPerWeek === -1) {
    return true;
  }

  // Check weekly limit
  return missionsThisWeek < features.maxMissionsPerWeek;
}

/**
 * Get remaining missions for the week
 */
export function getRemainingMissions(
  subscription: UserSubscription,
  missionsThisWeek: number
): number | 'unlimited' {
  const features = getSubscriptionFeatures(subscription.tier);
  
  if (features.maxMissionsPerWeek === -1) {
    return 'unlimited';
  }

  return Math.max(0, features.maxMissionsPerWeek - missionsThisWeek);
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Get upgrade message for feature
 */
export function getUpgradeMessage(feature: keyof SubscriptionFeatures): string {
  const messages: Record<keyof SubscriptionFeatures, string> = {
    maxMissionsPerWeek: 'Upgrade to Premium for unlimited missions!',
    hasVoice: 'Unlock Sunny\'s voice with Premium! 🎙️',
    hasAdvancedAnalytics: 'Get detailed insights with Premium analytics',
    hasParentDashboard: 'Access the Parent Dashboard with Premium',
    hasPrioritySupport: 'Get priority support with Premium',
    hasDownloadableReports: 'Download progress reports with Premium',
    hasCustomLearningPaths: 'Create custom learning paths with Premium',
  };

  return messages[feature] || 'Upgrade to Premium for more features!';
}

/**
 * Calculate subscription price
 */
export function getSubscriptionPrice(tier: SubscriptionTier): {
  amount: number;
  currency: string;
  interval: 'month' | 'year';
} {
  switch (tier) {
    case 'free':
      return { amount: 0, currency: 'USD', interval: 'month' };
    
    case 'premium':
      return { amount: 5, currency: 'USD', interval: 'month' };
    
    case 'annual':
      return { amount: 50, currency: 'USD', interval: 'year' };
    
    default:
      return { amount: 0, currency: 'USD', interval: 'month' };
  }
}

/**
 * Format price for display
 */
export function formatPrice(tier: SubscriptionTier): string {
  const price = getSubscriptionPrice(tier);
  
  if (price.amount === 0) {
    return 'Free';
  }

  if (tier === 'annual') {
    return `$${price.amount}/year`;
  }

  return `$${price.amount}/month`;
}
