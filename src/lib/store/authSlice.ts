import { useState } from 'react';
import type { UserRole } from '../types.ts';

export interface AuthState {
  currentRole: UserRole;
  currentUserId: string;
  isLoggedIn: boolean;
}

export function useAuthSlice() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [currentUserId, setCurrentUserId] = useState<string>('user-resident-1');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  return {
    currentRole,
    currentUserId,
    isLoggedIn,
    switchRole,
    setCurrentUserId,
    setIsLoggedIn,
  };
}
