
import { MetadataRoute } from 'next'

/**
 * Generates a standard XML sitemap for search engine indexing.
 * Only includes professional public-facing routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.gps-mapping.allthejam.co.uk';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/install`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}
