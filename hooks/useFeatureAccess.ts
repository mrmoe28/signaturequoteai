'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  hasFeatureAccess,
  hasReachedLimit,
  canPerformAction,
  getUpgradeMessage,
  getPlanName,
  type FeatureName,
  type UsageMetric,
  type UserSubscription,
} from '@/lib/feature-gating';

interface UseFeatureAccessResult {
  // Subscription data
  subscription: UserSubscription | null;
  loading: boolean;
  planName: string;

  // Feature checks
  hasAccess: (feature: FeatureName) => boolean;
  checkLimit: (metric: UsageMetric, currentUsage: number) => boolean;
  canDo: (action: {
    feature?: FeatureName;
    metric?: UsageMetric;
    currentUsage?: number;
  }) => { allowed: boolean; reason?: string };

  // Upgrade prompt helpers
  showUpgradePrompt: (feature?: FeatureName, metric?: UsageMetric) => void;
  upgradePromptProps: {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    currentPlan: string;
    feature?: string;
  };
}

export function useFeatureAccess(): UseFeatureAccessResult {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradePromptState, setUpgradePromptState] = useState({
    isOpen: false,
    message: '',
    feature: undefined as string | undefined,
  });

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/me');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        // No subscription = Free plan
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = useCallback(
    (feature: FeatureName): boolean => {
      return hasFeatureAccess(subscription, feature);
    },
    [subscription]
  );

  const checkLimit = useCallback(
    (metric: UsageMetric, currentUsage: number): boolean => {
      return !hasReachedLimit(subscription, metric, currentUsage);
    },
    [subscription]
  );

  const canDo = useCallback(
    (action: {
      feature?: FeatureName;
      metric?: UsageMetric;
      currentUsage?: number;
    }) => {
      return canPerformAction(subscription, action);
    },
    [subscription]
  );

  const showUpgradePrompt = useCallback(
    (feature?: FeatureName, metric?: UsageMetric) => {
      const message = getUpgradeMessage(feature, metric);
      setUpgradePromptState({
        isOpen: true,
        message,
        feature: feature || metric,
      });
    },
    []
  );

  const closeUpgradePrompt = useCallback(() => {
    setUpgradePromptState({
      isOpen: false,
      message: '',
      feature: undefined,
    });
  }, []);

  return {
    subscription,
    loading,
    planName: getPlanName(subscription),
    hasAccess,
    checkLimit,
    canDo,
    showUpgradePrompt,
    upgradePromptProps: {
      isOpen: upgradePromptState.isOpen,
      onClose: closeUpgradePrompt,
      message: upgradePromptState.message,
      currentPlan: getPlanName(subscription),
      feature: upgradePromptState.feature,
    },
  };
}
