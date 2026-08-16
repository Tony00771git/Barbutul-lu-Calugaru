import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateAssets() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const iconSvgPath = path.join(publicDir, 'icon.svg');
  const maskableSvgPath = path.join(publicDir, 'icon-maskable.svg');

  const iconSvgBuffer = fs.readFileSync(iconSvgPath);
  const maskableSvgBuffer = fs.readFileSync(maskableSvgPath);

  console.log('Generating 192x192 and 512x512 standard icons...');
  await sharp(iconSvgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(iconSvgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(iconSvgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));

  console.log('Generating 192x192 and 512x512 maskable icons with safe area padding...');
  await sharp(maskableSvgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));
  await sharp(maskableSvgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));

  console.log('Generating mobile and desktop screenshots for PWABuilder store listing...');
  
  // Mobile screenshot SVG
  const mobileSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#221206"/>
        <stop offset="60%" stop-color="#120904"/>
        <stop offset="100%" stop-color="#080402"/>
      </radialGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffe680"/>
        <stop offset="50%" stop-color="#e8c84a"/>
        <stop offset="100%" stop-color="#b8860b"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    
    <!-- Top Header -->
    <rect width="1080" height="160" fill="#140a04" opacity="0.95"/>
    <text x="60" y="105" fill="#e8c84a" font-family="sans-serif" font-size="52" font-weight="bold">🍺 BARBUTUL LU' CĂLUGĂRU</text>
    
    <!-- Hero Title -->
    <text x="540" y="380" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="64" font-weight="900">JOC MEDIEVAL DE BĂUT</text>
    <text x="540" y="450" text-anchor="middle" fill="#a89a80" font-family="sans-serif" font-size="34">Barbut Clasic • Duel 1v1 Trivia • Tabla Mănăstirii</text>
    
    <!-- Mode Cards -->
    <rect x="100" y="560" width="880" height="340" rx="32" fill="#1e1208" stroke="#e8c84a" stroke-width="4"/>
    <text x="160" y="660" fill="#ffe680" font-family="sans-serif" font-size="48" font-weight="bold">🎲 Mod Clasic &amp; Păcănele</text>
    <text x="160" y="730" fill="#d0c4b0" font-family="sans-serif" font-size="32">Aruncă zarurile și trage de maneta slot machine!</text>
    <rect x="160" y="780" width="260" height="70" rx="20" fill="#e8c84a"/>
    <text x="290" y="828" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="32" font-weight="bold">JOACĂ ACUM</text>
    
    <rect x="100" y="940" width="880" height="340" rx="32" fill="#1e1208" stroke="#e8c84a" stroke-width="4"/>
    <text x="160" y="1040" fill="#ffe680" font-family="sans-serif" font-size="48" font-weight="bold">⚔️ Duel 1v1 Trivia Online</text>
    <text x="160" y="1110" fill="#d0c4b0" font-family="sans-serif" font-size="32">Întrebări rapide de cultură generală &amp; bucluc!</text>
    <rect x="160" y="1160" width="260" height="70" rx="20" fill="#e8c84a"/>
    <text x="290" y="1208" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="32" font-weight="bold">PROVOACĂ</text>

    <rect x="100" y="1320" width="880" height="340" rx="32" fill="#1e1208" stroke="#e8c84a" stroke-width="4"/>
    <text x="160" y="1420" fill="#ffe680" font-family="sans-serif" font-size="48" font-weight="bold">🏰 Tabla Mănăstirii</text>
    <text x="160" y="1490" fill="#d0c4b0" font-family="sans-serif" font-size="32">30 de chilii tematice cu provocări și pedepse.</text>
    <rect x="160" y="1540" width="260" height="70" rx="20" fill="#e8c84a"/>
    <text x="290" y="1588" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="32" font-weight="bold">PORNEȘTE</text>
  </svg>`;

  // Desktop screenshot SVG
  const desktopSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="bgD" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#241408"/>
        <stop offset="60%" stop-color="#120904"/>
        <stop offset="100%" stop-color="#080402"/>
      </radialGradient>
      <linearGradient id="goldD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffe680"/>
        <stop offset="50%" stop-color="#e8c84a"/>
        <stop offset="100%" stop-color="#b8860b"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#bgD)"/>
    
    <!-- Header -->
    <rect width="1920" height="100" fill="#140a04" opacity="0.95"/>
    <text x="80" y="65" fill="#e8c84a" font-family="sans-serif" font-size="38" font-weight="bold">🍺 BARBUTUL LU' CĂLUGĂRU</text>
    
    <!-- Title -->
    <text x="960" y="240" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="56" font-weight="900">JOC MEDIEVAL DE BĂUT PENTRU GAȘCĂ</text>
    <text x="960" y="295" text-anchor="middle" fill="#a89a80" font-family="sans-serif" font-size="26">Zaruri, Păcănele, Trivia 1v1 și Boardgame Interactiv</text>
    
    <!-- 3 Columns -->
    <rect x="180" y="380" width="460" height="520" rx="24" fill="#1e1208" stroke="#e8c84a" stroke-width="3"/>
    <text x="410" y="470" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="36" font-weight="bold">🎲 Barbut Clasic</text>
    <text x="410" y="530" text-anchor="middle" fill="#d0c4b0" font-family="sans-serif" font-size="22">Reguli canonice și slot machine</text>
    
    <rect x="730" y="380" width="460" height="520" rx="24" fill="#1e1208" stroke="#e8c84a" stroke-width="3"/>
    <text x="960" y="470" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="36" font-weight="bold">⚔️ Duel 1v1 Trivia</text>
    <text x="960" y="530" text-anchor="middle" fill="#d0c4b0" font-family="sans-serif" font-size="22">Răspunsuri rapide &amp; clasament</text>
    
    <rect x="1280" y="380" width="460" height="520" rx="24" fill="#1e1208" stroke="#e8c84a" stroke-width="3"/>
    <text x="1510" y="470" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="36" font-weight="bold">🏰 Tabla Mănăstirii</text>
    <text x="1510" y="530" text-anchor="middle" fill="#d0c4b0" font-family="sans-serif" font-size="22">30 chilii pline de provocări</text>
  </svg>`;

  await sharp(Buffer.from(mobileSvg)).png().toFile(path.join(publicDir, 'screenshot-mobile.png'));
  await sharp(Buffer.from(desktopSvg)).png().toFile(path.join(publicDir, 'screenshot-desktop.png'));

  console.log('All PWA assets generated successfully!');
}

generateAssets().catch(console.error);
