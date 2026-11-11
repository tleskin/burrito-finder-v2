export interface BurritoSpot {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  price?: string;
  distanceMiles?: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  url: string;
  imageUrl?: string;
}

export interface BurritoSearchResponse {
  spots: BurritoSpot[];
  demo: boolean;
  center: { lat: number; lon: number };
}

/** Fun mock spots used when no Google Places API key is configured. */
export function mockSpots(centerLat: number, centerLon: number): BurritoSpot[] {
  const spots: Array<Omit<BurritoSpot, "lat" | "lon" | "distanceMiles"> & { dLat: number; dLon: number }> = [
    {
      id: "mock-1",
      name: "El Camino Real",
      rating: 4.5,
      reviewCount: 231,
      price: "$$",
      address: "123 Mission St",
      city: "Burritoville",
      state: "CA",
      zip: "94110",
      url: "https://www.google.com/maps/search/?api=1&query=El+Camino+Real",
      dLat: 0.012,
      dLon: 0.008,
    },
    {
      id: "mock-2",
      name: "The Wrapped Wonder",
      rating: 4.0,
      reviewCount: 154,
      price: "$",
      address: "456 Tortilla Ave",
      city: "Burritoville",
      state: "CA",
      zip: "94110",
      url: "https://www.google.com/maps/search/?api=1&query=The+Wrapped+Wonder",
      dLat: -0.009,
      dLon: 0.014,
    },
    {
      id: "mock-3",
      name: "Casa del Burrito Grande",
      rating: 5.0,
      reviewCount: 89,
      price: "$$",
      address: "789 Salsa Blvd",
      city: "Burritoville",
      state: "CA",
      zip: "94110",
      url: "https://www.google.com/maps/search/?api=1&query=Casa+del+Burrito+Grande",
      dLat: 0.004,
      dLon: -0.011,
    },
    {
      id: "mock-4",
      name: "Midnight Munchies Taqueria",
      rating: 3.5,
      reviewCount: 412,
      price: "$",
      address: "321 Queso Ln",
      city: "Burritoville",
      state: "CA",
      zip: "94110",
      url: "https://www.google.com/maps/search/?api=1&query=Midnight+Munchies+Taqueria",
      dLat: -0.015,
      dLon: -0.006,
    },
  ];

  return spots.map((s) => {
    const lat = centerLat + s.dLat;
    const lon = centerLon + s.dLon;
    const { dLat, dLon, ...rest } = s;
    void dLat;
    void dLon;
    return {
      ...rest,
      lat,
      lon,
      distanceMiles: haversineMiles(centerLat, centerLon, lat, lon),
    };
  });
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
