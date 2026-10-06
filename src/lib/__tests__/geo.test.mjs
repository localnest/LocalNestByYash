import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateHaversineDistance, 
  isSocietyCovered, 
  calculateTravelCharge 
} from '../geo.ts';

const mockSocieties = [
  {
    id: 'soc-1',
    communityId: 'comm-1',
    name: 'Greenfield Heights',
    addressLine: 'Channasandra Main Rd, Whitefield',
    locality: 'Whitefield',
    city: 'Bengaluru',
    pincode: '560066',
    latitude: 12.9830,
    longitude: 77.7510,
    totalFlats: 1790,
    isActive: true,
  },
  {
    id: 'soc-2',
    communityId: 'comm-1',
    name: 'Silver Oak Palms',
    addressLine: 'Varthur Kodi, Whitefield',
    locality: 'Varthur',
    city: 'Bengaluru',
    pincode: '560066',
    latitude: 12.9601,
    longitude: 77.7472,
    totalFlats: 950,
    isActive: true,
  },
  {
    id: 'soc-3',
    communityId: 'comm-2',
    name: 'Royal Palms Residency',
    addressLine: 'Kaikondrahalli, Sarjapur Rd',
    locality: 'Sarjapur Road',
    city: 'Bengaluru',
    pincode: '560035',
    latitude: 12.9152,
    longitude: 77.6845,
    totalFlats: 2100,
    isActive: true,
  },
];

test('Geo: Haversine distance returns correct geographic distance in km', () => {
  // Identical point
  assert.equal(calculateHaversineDistance(12.9830, 77.7510, 12.9830, 77.7510), 0);

  // Whitefield to Varthur Kodi (~2.6 km)
  const distVarthur = calculateHaversineDistance(12.9830, 77.7510, 12.9601, 77.7472);
  assert.ok(distVarthur >= 2.4 && distVarthur <= 2.8, `Expected ~2.6 km, got ${distVarthur}`);

  // Whitefield to Sarjapur Kaikondrahalli (~10.4 km)
  const distSarjapur = calculateHaversineDistance(12.9830, 77.7510, 12.9152, 77.6845);
  assert.ok(distSarjapur >= 9.8 && distSarjapur <= 11.0, `Expected ~10.4 km, got ${distSarjapur}`);
});

test('Geo: Provider with 3 km radius does not cover society 10 km away', () => {
  const provider3km = {
    id: 'prov-local',
    businessName: 'Local Whitefield Laundry',
    categoryId: 'cat-laundry',
    description: 'Local services',
    phone: '+91 99999 11111',
    status: 'VERIFIED',
    rating: 4.8,
    reviewCount: 50,
    completedOrders: 100,
    onTimeRate: 98,
    supportedSocieties: ['soc-1', 'soc-2'],
    startingPrice: 40,
    startingPriceUnit: 'per item',
    baseLocation: { label: 'Whitefield', pincode: '560066', latitude: 12.9830, longitude: 77.7510 },
    maxServiceDistanceKm: 3,
    coverageMode: 'RADIUS',
    excludedSocietyIds: [],
  };

  // Covers Greenfield Heights (0 km)
  assert.equal(isSocietyCovered(provider3km, mockSocieties[0]), true);

  // Covers Silver Oak Palms (~2.6 km <= 3 km)
  assert.equal(isSocietyCovered(provider3km, mockSocieties[1]), true);

  // DOES NOT cover Royal Palms Residency (~10.4 km > 3 km)
  assert.equal(isSocietyCovered(provider3km, mockSocieties[2]), false);
});

test('Geo: Provider with 12 km radius covers all societies in range', () => {
  const provider12km = {
    id: 'prov-wide',
    businessName: 'City Wide Cleaning',
    categoryId: 'cat-cleaning',
    description: 'Wide coverage',
    phone: '+91 99999 22222',
    status: 'VERIFIED',
    rating: 4.9,
    reviewCount: 120,
    completedOrders: 300,
    onTimeRate: 97,
    supportedSocieties: ['soc-1', 'soc-2', 'soc-3'],
    startingPrice: 499,
    startingPriceUnit: 'per service',
    baseLocation: { label: 'Whitefield Hub', pincode: '560066', latitude: 12.9830, longitude: 77.7510 },
    maxServiceDistanceKm: 12,
    coverageMode: 'RADIUS',
    excludedSocietyIds: [],
  };

  assert.equal(isSocietyCovered(provider12km, mockSocieties[0]), true);
  assert.equal(isSocietyCovered(provider12km, mockSocieties[1]), true);
  assert.equal(isSocietyCovered(provider12km, mockSocieties[2]), true);
});

test('Geo: Excluded societies are blocked even within radius', () => {
  const providerWithExclusion = {
    id: 'prov-excluded',
    businessName: 'Exclusion Test Provider',
    categoryId: 'cat-laundry',
    description: 'Exclusion test',
    phone: '+91 99999 33333',
    status: 'VERIFIED',
    rating: 4.8,
    reviewCount: 10,
    completedOrders: 20,
    onTimeRate: 100,
    supportedSocieties: ['soc-1'],
    startingPrice: 50,
    startingPriceUnit: 'per item',
    baseLocation: { label: 'Whitefield', pincode: '560066', latitude: 12.9830, longitude: 77.7510 },
    maxServiceDistanceKm: 5,
    coverageMode: 'RADIUS',
    excludedSocietyIds: ['soc-2'], // Excludes soc-2 even though within 2.6 km
  };

  assert.equal(isSocietyCovered(providerWithExclusion, mockSocieties[0]), true);
  assert.equal(isSocietyCovered(providerWithExclusion, mockSocieties[1]), false); // Excluded!
});

test('Geo: Selected societies mode strictly respects manual list', () => {
  const providerManual = {
    id: 'prov-manual',
    businessName: 'Society Gate Exclusive Car Wash',
    categoryId: 'cat-carwash',
    description: 'Gate exclusive',
    phone: '+91 99999 44444',
    status: 'VERIFIED',
    rating: 4.9,
    reviewCount: 15,
    completedOrders: 50,
    onTimeRate: 100,
    supportedSocieties: ['soc-1'],
    startingPrice: 500,
    startingPriceUnit: 'per month',
    baseLocation: { label: 'Greenfield Basement', pincode: '560066', latitude: 12.9830, longitude: 77.7510 },
    maxServiceDistanceKm: 10,
    coverageMode: 'SELECTED_SOCIETIES',
  };

  assert.equal(isSocietyCovered(providerManual, mockSocieties[0]), true);
  assert.equal(isSocietyCovered(providerManual, mockSocieties[1]), false);
  assert.equal(isSocietyCovered(providerManual, mockSocieties[2]), false);
});

test('Geo: Travel charges calculated with free radius and maximum cap', () => {
  const providerWithTravelCharge = {
    baseLocation: { label: 'Whitefield', pincode: '560066', latitude: 12.9830, longitude: 77.7510 },
    freeServiceRadiusKm: 2,
    travelChargePerKm: 20,
    maxTravelCharge: 150,
  };

  // Society 0 (0 km) -> Free (within 2 km)
  assert.equal(calculateTravelCharge(providerWithTravelCharge, mockSocieties[0]), 0);

  // Society 1 (~2.6 km) -> (2.6 - 2.0) = 0.6 km * 20 = ₹12
  const chargeSoc2 = calculateTravelCharge(providerWithTravelCharge, mockSocieties[1]);
  assert.ok(chargeSoc2 >= 10 && chargeSoc2 <= 14, `Expected ~₹12, got ${chargeSoc2}`);

  // Society 2 (~10.4 km) -> (10.4 - 2.0) = 8.4 km * 20 = ₹168 -> Capped at ₹150!
  const chargeSoc3 = calculateTravelCharge(providerWithTravelCharge, mockSocieties[2]);
  assert.equal(chargeSoc3, 150, `Expected cap of ₹150, got ${chargeSoc3}`);
});
