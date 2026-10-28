const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure output directories exist
const publicIconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'src', 'app');

if (!fs.existsSync(publicIconsDir)) fs.mkdirSync(publicIconsDir, { recursive: true });

// Master High-Resolution SVG (512x512 Standard)
const standardSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#070D1E"/>
      <stop offset="50%" stop-color="#0B1530"/>
      <stop offset="100%" stop-color="#11224D"/>
    </linearGradient>

    <!-- Vibrant Cobalt Glow Gradient -->
    <linearGradient id="primaryGrad" x1="120" y1="100" x2="400" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D2FF"/>
      <stop offset="50%" stop-color="#2D5BFF"/>
      <stop offset="100%" stop-color="#7B2CBF"/>
    </linearGradient>

    <!-- Surveyor Ring Glow -->
    <linearGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#2D5BFF" stop-opacity="0.2"/>
    </linearGradient>

    <!-- Land Polygon Gradient -->
    <linearGradient id="polyGrad" x1="140" y1="160" x2="380" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2D5BFF" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#00F0FF" stop-opacity="0.15"/>
    </linearGradient>

    <!-- Radial Glow Behind Pin -->
    <radialGradient id="centerGlow" cx="256" cy="240" r="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D2FF" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#2D5BFF" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#070D1E" stop-opacity="0"/>
    </radialGradient>

    <!-- Drop Shadows -->
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <!-- Background Squircle with Subtle Border -->
  <rect x="8" y="8" width="496" height="496" rx="116" fill="url(#bgGrad)"/>
  <rect x="8" y="8" width="496" height="496" rx="116" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>

  <!-- Radial Light Pool -->
  <circle cx="256" cy="240" r="180" fill="url(#centerGlow)"/>

  <!-- Geodesic Grid & Contour Lines -->
  <g opacity="0.18" stroke="#00D2FF" stroke-width="1.5">
    <!-- Latitude rings -->
    <circle cx="256" cy="256" r="190" stroke-dasharray="6 8"/>
    <circle cx="256" cy="256" r="130" stroke-dasharray="4 6"/>
    <circle cx="256" cy="256" r="70"/>
    <!-- Meridian axes -->
    <line x1="256" y1="40" x2="256" y2="472" stroke-dasharray="3 6"/>
    <line x1="40" y1="256" x2="472" y2="256" stroke-dasharray="3 6"/>
    <line x1="100" y1="100" x2="412" y2="412" stroke-dasharray="2 8" opacity="0.5"/>
    <line x1="100" y1="412" x2="412" y2="100" stroke-dasharray="2 8" opacity="0.5"/>
  </g>

  <!-- Surveyed Polygon Boundary (Net Land Audit) -->
  <g filter="url(#glowFilter)">
    <polygon points="170,160 360,140 400,320 280,390 140,310" 
      fill="url(#polyGrad)" 
      stroke="#00F0FF" 
      stroke-width="5" 
      stroke-linejoin="round"
      stroke-dasharray="12 6"
    />
  </g>

  <!-- Surveyor Polygon Vertex Nodes -->
  <g fill="#FFFFFF">
    <circle cx="170" cy="160" r="7" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="360" cy="140" r="7" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="400" cy="320" r="7" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="280" cy="390" r="7" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="140" cy="310" r="7" stroke="#00D2FF" stroke-width="3"/>
  </g>

  <!-- Central Precision Surveyor Map Pin -->
  <g filter="url(#pinShadow)">
    <!-- Pin Body -->
    <path d="M256 120 C207.4 120 168 159.4 168 208 C168 274 256 372 256 372 C256 372 344 274 344 208 C344 159.4 304.6 120 256 120 Z" 
      fill="url(#primaryGrad)" 
      stroke="#FFFFFF" 
      stroke-width="8" 
      stroke-linejoin="round"
    />
    
    <!-- Pin Lens Ring (Target Crosshair) -->
    <circle cx="256" cy="208" r="44" fill="#070D1E" stroke="#FFFFFF" stroke-width="6"/>
    
    <!-- Satellite Reticle Inner Pulse -->
    <circle cx="256" cy="208" r="22" fill="#00F0FF"/>
    <circle cx="256" cy="208" r="10" fill="#FFFFFF"/>

    <!-- Reticle Ticks -->
    <line x1="256" y1="156" x2="256" y2="170" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
    <line x1="256" y1="246" x2="256" y2="260" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
    <line x1="204" y1="208" x2="218" y2="208" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
    <line x1="294" y1="208" x2="308" y2="208" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Modern Technical Apex Glint -->
  <circle cx="230" cy="155" r="12" fill="#FFFFFF" opacity="0.35"/>
</svg>
`;

// Maskable SVG (Has 18% safe-zone margin for Android adaptive icon shapes)
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#070D1E"/>
      <stop offset="50%" stop-color="#0B1530"/>
      <stop offset="100%" stop-color="#11224D"/>
    </linearGradient>
    <linearGradient id="mPri" x1="160" y1="140" x2="360" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D2FF"/>
      <stop offset="50%" stop-color="#2D5BFF"/>
      <stop offset="100%" stop-color="#7B2CBF"/>
    </linearGradient>
    <linearGradient id="mPoly" x1="160" y1="180" x2="350" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2D5BFF" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#00F0FF" stop-opacity="0.15"/>
    </linearGradient>
    <radialGradient id="mCenterGlow" cx="256" cy="245" r="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D2FF" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#070D1E" stop-opacity="0"/>
    </radialGradient>
    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="15" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
  </defs>

  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#mBg)"/>

  <!-- Light pool -->
  <circle cx="256" cy="245" r="140" fill="url(#mCenterGlow)"/>

  <!-- Scaled Elements Inside Safe Zone (80% circle) -->
  <g transform="translate(51, 51) scale(0.80)">
    <!-- Geodesic Grid -->
    <g opacity="0.22" stroke="#00D2FF" stroke-width="1.8">
      <circle cx="256" cy="256" r="180" stroke-dasharray="6 8"/>
      <circle cx="256" cy="256" r="120" stroke-dasharray="4 6"/>
      <line x1="256" y1="50" x2="256" y2="462" stroke-dasharray="3 6"/>
      <line x1="50" y1="256" x2="462" y2="256" stroke-dasharray="3 6"/>
    </g>

    <!-- Survey Polygon -->
    <polygon points="170,160 360,140 400,320 280,390 140,310" 
      fill="url(#mPoly)" 
      stroke="#00F0FF" 
      stroke-width="5" 
      stroke-linejoin="round"
      stroke-dasharray="10 5"
    />

    <!-- Vertex nodes -->
    <circle cx="170" cy="160" r="7" fill="#FFF" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="360" cy="140" r="7" fill="#FFF" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="400" cy="320" r="7" fill="#FFF" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="280" cy="390" r="7" fill="#FFF" stroke="#00D2FF" stroke-width="3"/>
    <circle cx="140" cy="310" r="7" fill="#FFF" stroke="#00D2FF" stroke-width="3"/>

    <!-- Map Pin -->
    <g filter="url(#mShadow)">
      <path d="M256 120 C207.4 120 168 159.4 168 208 C168 274 256 372 256 372 C256 372 344 274 344 208 C344 159.4 304.6 120 256 120 Z" 
        fill="url(#mPri)" 
        stroke="#FFFFFF" 
        stroke-width="8" 
        stroke-linejoin="round"
      />
      <circle cx="256" cy="208" r="44" fill="#070D1E" stroke="#FFFFFF" stroke-width="6"/>
      <circle cx="256" cy="208" r="22" fill="#00F0FF"/>
      <circle cx="256" cy="208" r="10" fill="#FFFFFF"/>
      
      <line x1="256" y1="156" x2="256" y2="170" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
      <line x1="256" y1="246" x2="256" y2="260" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
      <line x1="204" y1="208" x2="218" y2="208" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
      <line x1="294" y1="208" x2="308" y2="208" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
    </g>
  </g>
</svg>
`;

// Social Preview / Open Graph Image (1200x630)
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ogBg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#070D1E"/>
      <stop offset="60%" stop-color="#0B1530"/>
      <stop offset="100%" stop-color="#142657"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="100" y1="260" x2="700" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00D2FF"/>
      <stop offset="100%" stop-color="#2D5BFF"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogBg)"/>

  <!-- Left: Branding & Value Proposition -->
  <g transform="translate(100, 140)">
    <!-- Pill Badge -->
    <rect x="0" y="0" width="220" height="40" rx="20" fill="rgba(45,91,255,0.18)" stroke="#2D5BFF" stroke-width="1.5"/>
    <text x="24" y="25" fill="#00D2FF" font-family="Inter, sans-serif" font-weight="900" font-size="12" letter-spacing="3">GPS LAND INTELLIGENCE</text>

    <!-- Main Title -->
    <text x="0" y="115" fill="url(#textGrad)" font-family="Inter, sans-serif" font-weight="900" font-size="64" letter-spacing="-1">GeoMapping</text>
    <text x="0" y="165" fill="#2D5BFF" font-family="Inter, sans-serif" font-weight="900" font-size="42">Professional Surveyor Suite</text>

    <!-- Subtitle -->
    <text x="0" y="235" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="500" font-size="20">
      Hierarchical Gross &amp; Net Land Audits • Real-time GPS Walk / Draw
    </text>
    <text x="0" y="270" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="500" font-size="20">
      Bank-Grade Estate Reports • Full Offline Field Caching
    </text>

    <!-- Key Metrics Badges -->
    <g transform="translate(0, 320)">
      <rect x="0" y="0" width="160" height="52" rx="14" fill="#0F1E3D" stroke="rgba(255,255,255,0.1)"/>
      <text x="20" y="32" fill="#00D2FF" font-family="Inter, sans-serif" font-weight="900" font-size="16">WGS 84</text>
      <text x="88" y="32" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="600" font-size="12">Geodesic</text>

      <rect x="180" y="0" width="160" height="52" rx="14" fill="#0F1E3D" stroke="rgba(255,255,255,0.1)"/>
      <text x="200" y="32" fill="#10B981" font-family="Inter, sans-serif" font-weight="900" font-size="16">Offline</text>
      <text x="260" y="32" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="600" font-size="12">Cached</text>

      <rect x="360" y="0" width="160" height="52" rx="14" fill="#0F1E3D" stroke="rgba(255,255,255,0.1)"/>
      <text x="380" y="32" fill="#F59E0B" font-family="Inter, sans-serif" font-weight="900" font-size="16">Genkit AI</text>
      <text x="460" y="32" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="600" font-size="12">Insights</text>
    </g>
  </g>

  <!-- Right: Floating Master Icon Graphic -->
  <g transform="translate(740, 115) scale(0.78)">
    ${standardSvg.replace('<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
  </g>
</svg>
`;

async function generateAll() {
  console.log('Generating complete icon suite...');

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);
  const ogBuffer = Buffer.from(ogSvg);

  // Targets: size, filename, source, folder
  const icons = [
    // PWA & Android Standard
    { size: 512, file: 'icon-512x512.png', src: standardBuffer, dir: publicIconsDir },
    { size: 192, file: 'icon-192x192.png', src: standardBuffer, dir: publicIconsDir },
    
    // Android Adaptive Maskable Icons
    { size: 512, file: 'icon-maskable-512x512.png', src: maskableBuffer, dir: publicIconsDir },
    { size: 192, file: 'icon-maskable-192x192.png', src: maskableBuffer, dir: publicIconsDir },

    // Apple iOS Touch Icons
    { size: 180, file: 'apple-touch-icon.png', src: standardBuffer, dir: publicIconsDir },
    { size: 180, file: 'apple-touch-icon.png', src: standardBuffer, dir: publicDir },
    { size: 152, file: 'apple-touch-icon-152x152.png', src: standardBuffer, dir: publicIconsDir },
    { size: 167, file: 'apple-touch-icon-167x167.png', src: standardBuffer, dir: publicIconsDir },

    // Web Favicons
    { size: 48, file: 'favicon-48x48.png', src: standardBuffer, dir: publicIconsDir },
    { size: 32, file: 'favicon-32x32.png', src: standardBuffer, dir: publicIconsDir },
    { size: 16, file: 'favicon-16x16.png', src: standardBuffer, dir: publicIconsDir },

    // Root shortcuts for search engines & browsers
    { size: 192, file: 'icon-192.png', src: standardBuffer, dir: publicDir },
    { size: 512, file: 'icon-512.png', src: standardBuffer, dir: publicDir },
    { size: 32, file: 'favicon.png', src: standardBuffer, dir: publicDir },
  ];

  for (const item of icons) {
    const outPath = path.join(item.dir, item.file);
    await sharp(item.src)
      .resize(item.size, item.size)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ Created: ${item.file} (${item.size}x${item.size}) in ${path.basename(item.dir)}/`);
  }

  // Create favicon.ico (multi-layer ICO with 16, 32, 48)
  const ico32Buffer = await sharp(standardBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), ico32Buffer);
  console.log('✓ Created: favicon.ico in public/ and src/app/');

  // Generate OpenGraph Social Card (1200x630)
  await sharp(ogBuffer)
    .resize(1200, 630)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ Created: og-image.png (1200x630) in public/');

  console.log('All icons generated successfully!');
}

generateAll().catch(console.error);
