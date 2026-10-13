import { useState } from 'react';
import type { Category, ServiceType, Provider } from '../types.ts';

export function useCatalogSlice(
  initialCategories: Category[] = [],
  initialServiceTypes: ServiceType[] = [],
  initialProviders: Provider[] = [],
) {
  const [categories] = useState<Category[]>(initialCategories);
  const [serviceTypes] = useState<ServiceType[]>(initialServiceTypes);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const updateProvider = (id: string, updates: Partial<Provider>) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  return {
    categories,
    serviceTypes,
    providers,
    searchQuery,
    setSearchQuery,
    updateProvider,
  };
}
