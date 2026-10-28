import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GeoMapping - GPS Precision Mapping',
    short_name: 'GeoMapping',
    description: 'Professional grade GPS measurement for land and distance.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2D5BFF',
    icons: [
      {
        src: 'https://placehold.co/192x192/2D5BFF/ffffff/png?text=Geo',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/2D5BFF/ffffff/png?text=GeoMapping',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
