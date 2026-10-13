import { useState } from 'react';
import type { Subscription, SubscriptionStatus } from '../types.ts';

export function useSubscriptionSlice(initialSubscriptions: Subscription[] = []) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);

  const updateSubscriptionStatus = (id: string, status: SubscriptionStatus) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s)),
    );
  };

  const addSubscription = (subscription: Subscription) => {
    setSubscriptions((prev) => [subscription, ...prev]);
  };

  return {
    subscriptions,
    setSubscriptions,
    updateSubscriptionStatus,
    addSubscription,
  };
}
