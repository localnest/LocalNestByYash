import type { Society, Provider, ProviderLocation } from './types.ts';

export interface KnownLocality {
  label: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export const BENGALURU_LOCALITIES: KnownLocality[] = [
  {
    label: 'Whitefield (Channasandra / ITPL)',
    pincode: '560066',
    latitude: 12.983,
    longitude: 77.751,
  },
  { label: 'Varthur Kodi', pincode: '560066', latitude: 12.9601, longitude: 77.7472 },
  { label: 'Marathahalli', pincode: '560037', latitude: 12.955, longitude: 77.701 },
  {
    label: 'Kaikondrahalli / Sarjapur Road',
    pincode: '560035',
    latitude: 12.9152,
    longitude: 77.6845,
  },
  {
    label: 'Bellandur / Outer Ring Road',
    pincode: '560103',
    latitude: 12.9304,
    longitude: 77.6784,
  },
  { label: 'HSR Layout', pincode: '560102', latitude: 12.9121, longitude: 77.6446 },
  { label: 'Indiranagar', pincode: '560038', latitude: 12.9784, longitude: 77.6408 },
  { label: 'Koramangala', pincode: '560034', latitude: 12.9352, longitude: 77.6245 },
  { label: 'Electronic City Phase 1', pincode: '560100', latitude: 12.8452, longitude: 77.6602 },
];

/**
 * Calculates great-circle distance between two coordinates using the Haversine formula (in km).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 2.4 km)
}

/**
 * Convenience helper to calculate distance from provider's base location to a society.
 */
export function getDistanceToSociety(
  provider: Pick<Provider, 'baseLocation'>,
  society: Pick<Society, 'latitude' | 'longitude'>,
): number | null {
  if (!provider.baseLocation || society.latitude === undefined || society.longitude === undefined) {
    return null;
  }
  return calculateHaversineDistance(
    provider.baseLocation.latitude,
    provider.baseLocation.longitude,
    society.latitude,
    society.longitude,
  );
}

/**
 * Checks if a society is within the provider's active coverage rules.
 */
export function isSocietyCovered(
  provider: Provider,
  society: Society,
  _allSocieties?: Society[],
): boolean {
  // 1. If explicit coverage mode is 'SELECTED_SOCIETIES', use manual list
  if (provider.coverageMode === 'SELECTED_SOCIETIES') {
    return provider.supportedSocieties?.includes(society.id) ?? false;
  }

  // 2. If 'RADIUS' mode
  if (provider.coverageMode === 'RADIUS' || (!provider.coverageMode && provider.baseLocation)) {
    // Check if explicitly excluded
    if (provider.excludedSocietyIds && provider.excludedSocietyIds.includes(society.id)) {
      return false;
    }

    // If coordinates exist on both
    if (
      provider.baseLocation &&
      society.latitude !== undefined &&
      society.longitude !== undefined
    ) {
      const dist = calculateHaversineDistance(
        provider.baseLocation.latitude,
        provider.baseLocation.longitude,
        society.latitude,
        society.longitude,
      );
      const maxDistance = provider.maxServiceDistanceKm ?? 10;
      return dist <= maxDistance;
    }

    // Fallback if coordinates missing: check supportedSocieties list
    return provider.supportedSocieties?.includes(society.id) ?? false;
  }

  // 3. Fallback for legacy data without coverageMode: use supportedSocieties
  return provider.supportedSocieties?.includes(society.id) ?? false;
}

/**
 * Returns all societies covered by a provider.
 */
export function getCoveredSocieties(provider: Provider, societies: Society[]): Society[] {
  return societies.filter((s) => isSocietyCovered(provider, s, societies));
}

/**
 * Returns all active providers that cover a specific society.
 */
export function getProvidersForSociety(providers: Provider[], society: Society): Provider[] {
  return providers.filter((p) => isSocietyCovered(p, society));
}

/**
 * Calculates applicable travel charge (₹) for a booking.
 * Applicable if provider has travelChargePerKm configured and distance exceeds freeServiceRadiusKm.
 */
export function calculateTravelCharge(
  provider: Pick<
    Provider,
    'baseLocation' | 'freeServiceRadiusKm' | 'travelChargePerKm' | 'maxTravelCharge'
  >,
  society: Pick<Society, 'latitude' | 'longitude'>,
): number {
  if (!provider.travelChargePerKm || provider.travelChargePerKm <= 0) {
    return 0;
  }

  if (!provider.baseLocation || society.latitude === undefined || society.longitude === undefined) {
    return 0;
  }

  const distance = calculateHaversineDistance(
    provider.baseLocation.latitude,
    provider.baseLocation.longitude,
    society.latitude,
    society.longitude,
  );

  const freeRadius = provider.freeServiceRadiusKm ?? 0;
  if (distance <= freeRadius) {
    return 0;
  }

  const chargeableKm = distance - freeRadius;
  let charge = Math.round(chargeableKm * provider.travelChargePerKm);

  if (provider.maxTravelCharge && charge > provider.maxTravelCharge) {
    charge = provider.maxTravelCharge;
  }

  return charge;
}
