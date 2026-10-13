import type { IDispatchApi } from './port.ts';
import { MockDispatchAdapter } from './mockAdapter.ts';
import { SupabaseDispatchAdapter } from './supabaseAdapter.ts';
import { isSupabaseConfigured } from '../../../lib/supabaseClient.ts';

export type * from './port.ts';
export * from './mockAdapter.ts';
export * from './supabaseAdapter.ts';

let dispatchApiInstance: IDispatchApi | null = null;

export function getDispatchApi(): IDispatchApi {
  if (!dispatchApiInstance) {
    if (isSupabaseConfigured()) {
      dispatchApiInstance = new SupabaseDispatchAdapter();
    } else {
      dispatchApiInstance = new MockDispatchAdapter();
    }
  }
  return dispatchApiInstance;
}

export function setDispatchApi(adapter: IDispatchApi): void {
  dispatchApiInstance = adapter;
}
