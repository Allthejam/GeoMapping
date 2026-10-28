/**
 * @fileOverview Surveyor Offline Map Tile Utility
 * Manages pre-fetching and caching of satellite and topographic map tiles
 * so field surveyors can operate in cellular dead zones.
 */

export const CACHE_NAME_TILES = 'geomapping-tiles-v1';

// Convert Lat/Lng to Slippy Map tile X and Y
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const rad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n);
  return { x, y };
}

// Get the tile URL based on map type (Esri World Imagery or Topo)
export function getTileUrl(x: number, y: number, z: number, mapType: 'satellite' | 'terrain' = 'satellite'): string {
  if (mapType === 'satellite') {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  }
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
}

/**
 * Pre-fetches tiles for the current surveyor position and radius into the Service Worker cache.
 */
export async function cacheAreaTiles(
  centerLat: number,
  centerLng: number,
  zoom: number,
  mapType: 'satellite' | 'terrain' = 'satellite',
  onProgress?: (loaded: number, total: number) => void
): Promise<{ success: boolean; count: number; error?: string }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { success: false, count: 0, error: 'Cache API not supported' };
  }

  try {
    const cache = await caches.open(CACHE_NAME_TILES);
    const tileUrls: string[] = [];

    // Cache current zoom level and adjacent zoom levels (zoom - 1, zoom, zoom + 1)
    const zoomLevels = [Math.max(12, zoom - 1), zoom, Math.min(19, zoom + 1)];

    for (const z of zoomLevels) {
      const { x: cx, y: cy } = latLngToTile(centerLat, centerLng, z);
      // Fetch a 3x3 grid around center tile
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const url = getTileUrl(cx + dx, cy + dy, z, mapType);
          if (!tileUrls.includes(url)) {
            tileUrls.push(url);
          }
        }
      }
    }

    let loaded = 0;
    const total = tileUrls.length;

    // Fetch and store each tile
    for (const url of tileUrls) {
      try {
        const existing = await cache.match(url);
        if (!existing) {
          const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (resp && resp.status === 200) {
            await cache.put(url, resp);
          }
        }
      } catch (err) {
        // Individual tile fail shouldn't stop overall batch
      }
      loaded++;
      if (onProgress) onProgress(loaded, total);
    }

    return { success: true, count: loaded };
  } catch (e: any) {
    return { success: false, count: 0, error: e?.message || 'Failed to cache tiles' };
  }
}

/**
 * Returns the number of map tiles currently cached offline.
 */
export async function getCachedTileCount(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) return 0;
  try {
    const cache = await caches.open(CACHE_NAME_TILES);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

/**
 * Purges the offline tile cache.
 */
export async function clearOfflineTileCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    return await caches.delete(CACHE_NAME_TILES);
  } catch {
    return false;
  }
}
