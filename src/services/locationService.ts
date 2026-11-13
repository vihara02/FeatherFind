import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  locationName?: string;
}

export const POPULAR_BIRDING_HOTSPOTS = [
  { name: 'Sinharaja Forest Reserve (Kudawa)', latitude: 6.4428, longitude: 80.4578, habitat: 'Wet Zone Rainforest' },
  { name: 'Sinharaja Forest Reserve (Pitadeniya)', latitude: 6.3752, longitude: 80.5281, habitat: 'Wet Zone Rainforest' },
  { name: 'Kitulgala Forest Reserve / Makandawa', latitude: 6.9902, longitude: 80.4125, habitat: 'Wet Zone Rainforest' },
  { name: 'Horton Plains National Park', latitude: 6.8028, longitude: 80.8091, habitat: 'Montane Cloud Forest' },
  { name: 'Hakgala Strict Nature Reserve', latitude: 6.9281, longitude: 80.8203, habitat: 'Montane Cloud Forest' },
  { name: 'Knuckles Conservation Forest', latitude: 7.4167, longitude: 80.7500, habitat: 'Montane Cloud Forest' },
  { name: 'Bundala National Park (Ramsar)', latitude: 6.1950, longitude: 81.2280, habitat: 'Wetlands, Tanks & Mangroves' },
  { name: 'Wilpattu National Park', latitude: 8.4550, longitude: 80.0150, habitat: 'Dry Zone Woodlands & Scrublands' },
  { name: 'Yala (Ruhuna) National Park', latitude: 6.3680, longitude: 81.5240, habitat: 'Dry Zone Woodlands & Scrublands' },
  { name: 'Udawalawe National Park', latitude: 6.4740, longitude: 80.8870, habitat: 'Dry Zone Woodlands & Scrublands' },
  { name: 'Kumana National Park', latitude: 6.5500, longitude: 81.6830, habitat: 'Wetlands, Tanks & Mangroves' },
  { name: 'Anawilundawa Bird Sanctuary', latitude: 7.6970, longitude: 79.8250, habitat: 'Wetlands, Tanks & Mangroves' },
  { name: 'Vankalai Sanctuary, Mannar', latitude: 8.9050, longitude: 79.9210, habitat: 'Coastal Shores & Estuaries' },
  { name: 'Bodhinagala Forest Hermitage', latitude: 6.7865, longitude: 80.1580, habitat: 'Wet Zone Rainforest' },
];

export async function getCurrentGPSLocation(): Promise<LocationCoordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    let locationName = '';
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (places && places.length > 0) {
        const p = places[0];
        const parts = [p.name, p.district || p.subregion, p.city, p.region].filter(Boolean);
        locationName = parts.length > 0 ? parts.join(', ') : `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
      }
    } catch (e) {
      locationName = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
    }

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      locationName: locationName || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
    };
  } catch (error) {
    console.error('Failed to get GPS location:', error);
    return null;
  }
}
