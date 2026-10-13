/**
 * Centralized Feature Flags Configuration
 * Allows gradual rollouts and runtime switching of monetization and dispatch models.
 */

export interface FeatureFlags {
  ENABLE_MEMBERSHIP_BILLING: boolean;
  ENABLE_FLAT_COMMISSION: boolean;
  ENABLE_INSTANT_PAYOUTS: boolean;
  ENABLE_GOOGLE_OAUTH: boolean;
  ENABLE_REALTIME_DISPATCH: boolean;
  ENABLE_CHAT_RETENTION_FILTER: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  ENABLE_MEMBERSHIP_BILLING: true,
  ENABLE_FLAT_COMMISSION: true,
  ENABLE_INSTANT_PAYOUTS: false,
  ENABLE_GOOGLE_OAUTH: true,
  ENABLE_REALTIME_DISPATCH: true,
  ENABLE_CHAT_RETENTION_FILTER: true,
};

const overrides: Partial<FeatureFlags> = {};

export function getFeatureFlags(): FeatureFlags {
  return {
    ...DEFAULT_FLAGS,
    ...overrides,
  };
}

export function isFeatureEnabled(key: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return Boolean(flags[key]);
}

export function setFeatureFlagOverride(key: keyof FeatureFlags, value: boolean): void {
  overrides[key] = value;
}

export function clearFeatureFlagOverrides(): void {
  for (const key of Object.keys(overrides) as (keyof FeatureFlags)[]) {
    delete overrides[key];
  }
}
