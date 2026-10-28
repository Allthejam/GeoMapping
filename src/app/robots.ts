
import { MetadataRoute } from 'next'

/**
 * Technical SEO Control: Defines which areas of the application are 
 * visible to search engine crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.gps-mapping.allthejam.co.uk';

  return {
    rules: {
      userAgent: '*',
      // Public facing landing pages are open for crawling
      allow: ['/', '/about', '/install', '/contact'],
      // Private app routes and administrative tools are strictly blocked
      disallow: [
        '/admin/', 
        '/login', 
        '/register', 
        '/history/', 
        '/measure', 
        '/profile', 
        '/audit',
        '/api/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
