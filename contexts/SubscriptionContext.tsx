import { useUser } from 'expo-superwall';
import React, { createContext, useCallback, useContext, useMemo } from 'react';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { subscriptionStatus } = useUser();

  const value = useMemo(() => {
    const status = subscriptionStatus?.status ?? 'UNKNOWN';
    return {
      isSubscribed: status === 'ACTIVE',
      isLoading: status === 'UNKNOWN',
      subscriptionStatus: status as 'ACTIVE' | 'INACTIVE' | 'UNKNOWN',
    };
  }, [subscriptionStatus]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
