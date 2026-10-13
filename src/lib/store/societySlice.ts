import { useState } from 'react';
import type { Society, SocietyNotice } from '../types.ts';

export function useSocietySlice(
  initialSocieties: Society[] = [],
  initialNotices: SocietyNotice[] = [],
) {
  const [societies] = useState<Society[]>(initialSocieties);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(
    initialSocieties[0] || null,
  );
  const [notices, setNotices] = useState<SocietyNotice[]>(initialNotices);

  const selectSociety = (societyId: string) => {
    const found = societies.find((s) => s.id === societyId);
    if (found) setSelectedSociety(found);
  };

  const addNotice = (notice: Omit<SocietyNotice, 'id' | 'createdAt'>) => {
    const newNotice: SocietyNotice = {
      ...notice,
      id: `notice-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setNotices((prev) => [newNotice, ...prev]);
  };

  return {
    societies,
    selectedSociety,
    notices,
    selectSociety,
    addNotice,
  };
}
