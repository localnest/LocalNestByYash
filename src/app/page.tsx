'use client';

import React from 'react';
import { useMarketplace } from '@/lib/store';
import AuthScreen from '@/components/AuthScreen';
import ResidentOnboarding from '@/components/ResidentOnboarding';
import ProviderOnboarding from '@/components/ProviderOnboarding';
import ProviderDashboard from '@/components/ProviderDashboard';
import AdminPanel from '@/components/AdminPanel';
import ResidentDispatchCenter from '@/components/ResidentDispatchCenter';

export default function HomePage() {
  const { currentUser } = useMarketplace();

  // 1. If not logged in, show segregated Auth Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // 2. If logged in but onboarding is incomplete, show respective onboarding flow
  if (!currentUser.isOnboarded) {
    if (currentUser.role === 'PROVIDER') {
      return <ProviderOnboarding />;
    }
    return <ResidentOnboarding />;
  }

  // 3. If logged in and onboarded, route strictly to their role portal
  if (currentUser.role === 'PROVIDER') {
    return <ProviderDashboard />;
  }

  if (currentUser.role === 'ADMIN') {
    return <AdminPanel />;
  }

  return <ResidentDispatchCenter />;
}
