export type Coordinate = {
  lat: number;
  lng: number;
  alt?: number | null;
};

/**
 * Calculates the Haversine distance between two points in kilometers.
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the area of a polygon in square meters.
 */
export function calculateArea(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;
  
  const radius = 6378137; // Earth's radius in meters
  let area = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % coordinates.length];
    
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const lng1 = p1.lng * Math.PI / 180;
    const lng2 = p2.lng * Math.PI / 180;
    
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = area * radius * radius / 2;
  return Math.abs(area);
}

/**
 * Calculates the centroid (geometric center) of a set of coordinates.
 */
export function calculateCentroid(coords: Coordinate[]): Coordinate {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  
  let lat = 0;
  let lng = 0;
  
  for (const coord of coords) {
    lat += coord.lat;
    lng += coord.lng;
  }
  
  return {
    lat: lat / coords.length,
    lng: lng / coords.length
  };
}

export function formatArea(metersSq: number, unit: 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqmi'): string {
  switch (unit) {
    case 'sqm': return `${Math.round(metersSq).toLocaleString()} m²`;
    case 'sqft': return `${Math.round(metersSq * 10.7639).toLocaleString()} ft²`;
    case 'acres': return `${(metersSq * 0.000247105).toFixed(4)} ac`;
    case 'hectares': return `${(metersSq * 0.0001).toFixed(4)} ha`;
    case 'sqmi': return `${(metersSq * 0.0000003861).toFixed(4)} sq mi`;
  }
}

export function formatDistance(km: number, unit: 'km' | 'miles' | 'meters'): string {
  switch (unit) {
    case 'km': return `${km.toFixed(3)} km`;
    case 'miles': return `${(km * 0.621371).toFixed(3)} mi`;
    case 'meters': return `${(km * 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;
  }
}
