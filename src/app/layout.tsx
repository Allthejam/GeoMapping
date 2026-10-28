
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gps-mapping.allthejam.co.uk'),
  title: {
    default: 'GeoMapping - Professional GPS Land Mapping & Auditing',
    template: '%s | GeoMapping'
  },
  description: 'Surveyor-grade GPS measurement for agriculture and property management. Differentiate between total ownership and net productive land with our hierarchical audit engine.',
  keywords: ['GPS mapping', 'land measurement', 'acreage calculator', 'offline GPS', 'agriculture tech', 'field survey', 'boundary mapping', 'estate management', 'land audit'],
  authors: [{ name: 'GeoMapping Systems' }],
  creator: 'GeoMapping Systems',
  publisher: 'GeoMapping Systems',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://www.gps-mapping.allthejam.co.uk',
    siteName: 'GeoMapping',
    title: 'GeoMapping - GPS Precision Mapping',
    description: 'Professional grade GPS measurement for land and distance audits.',
    images: [
      {
        url: 'https://picsum.photos/seed/geo-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'GeoMapping Mapping Interface Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeoMapping - GPS Precision Mapping',
    description: 'Professional grade GPS measurement for land and distance audits.',
    images: ['https://picsum.photos/seed/geo-og/1200/630'],
    creator: '@geomapping',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GeoMapping',
  },
};

export const viewport: Viewport = {
  themeColor: '#2D5BFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full overflow-hidden">
              <AppSidebar />
              <SidebarInset className="flex flex-col relative flex-1 overflow-hidden pb-16 md:pb-0">
                {children}
              </SidebarInset>
              <BottomNav />
            </div>
          </SidebarProvider>
          <Toaster />
          <ServiceWorkerRegister />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
