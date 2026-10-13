import type { IWalletApi } from './port.ts';
import { MockWalletAdapter } from './mockAdapter.ts';
import { SupabaseWalletAdapter } from './supabaseAdapter.ts';
import { isSupabaseConfigured } from '../../../lib/supabaseClient.ts';

export type * from './port.ts';
export * from './mockAdapter.ts';
export * from './supabaseAdapter.ts';

let walletApiInstance: IWalletApi | null = null;

export function getWalletApi(): IWalletApi {
  if (!walletApiInstance) {
    if (isSupabaseConfigured()) {
      walletApiInstance = new SupabaseWalletAdapter();
    } else {
      walletApiInstance = new MockWalletAdapter();
    }
  }
  return walletApiInstance;
}

export function setWalletApi(adapter: IWalletApi): void {
  walletApiInstance = adapter;
}
