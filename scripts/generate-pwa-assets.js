import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#2a1a0e"/>
      <stop offset="70%" stop-color="#140c06"/>
      <stop offset="100%" stop-color="#080402"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe680"/>
      <stop offset="50%" stop-color="#e8c84a"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
    <linearGradient id="beerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" fill="url(#bgGrad)"/>
  <rect width="472" height="472" x="20" y="20" rx="64" fill="none" stroke="url(#goldGrad)" stroke-width="8" opacity="0.85"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-dasharray="8 6" opacity="0.6"/>

  <g transform="translate(0, 10)">
    <path d="M 330 210 C 410 210, 410 350, 330 350" fill="none" stroke="url(#goldGrad)" stroke-width="26" stroke-linecap="round"/>
    <path d="M 170 180 L 180 390 C 180 405, 330 405, 330 390 L 340 180 Z" fill="url(#beerGrad)" stroke="url(#goldGrad)" stroke-width="12" stroke-linejoin="round"/>
    <path d="M 155 180 C 145 150, 185 130, 205 150 C 220 125, 260 120, 280 145 C 300 125, 345 135, 345 160 C 365 160, 370 195, 340 200 C 310 200, 170 200, 155 180 Z" fill="#ffffff" stroke="#f0ebe0" stroke-width="6"/>
    <path d="M 190 195 C 190 230, 205 230, 205 195" fill="#ffffff"/>
    <path d="M 270 195 C 270 245, 285 245, 285 195" fill="#ffffff"/>

    <g transform="translate(255, 295)" stroke="#ffe680" stroke-width="6" stroke-linecap="round" fill="none">
      <circle cx="0" cy="0" r="22" stroke="#ffe680" stroke-width="4" opacity="0.7"/>
      <line x1="0" y1="-32" x2="0" y2="32"/>
      <line x1="-30" y1="0" x2="30" y2="0"/>
    </g>

    <g transform="translate(135, 350) rotate(-15)">
      <rect width="60" height="60" rx="12" fill="#241408" stroke="url(#goldGrad)" stroke-width="4"/>
      <circle cx="30" cy="30" r="5" fill="#ffe680"/>
      <circle cx="16" cy="16" r="5" fill="#ffe680"/>
      <circle cx="44" cy="44" r="5" fill="#ffe680"/>
    </g>
    <g transform="translate(325, 360) rotate(15)">
      <rect width="60" height="60" rx="12" fill="#241408" stroke="url(#goldGrad)" stroke-width="4"/>
      <circle cx="18" cy="18" r="5" fill="#ffe680"/>
      <circle cx="42" cy="18" r="5" fill="#ffe680"/>
      <circle cx="18" cy="42" r="5" fill="#ffe680"/>
      <circle cx="42" cy="42" r="5" fill="#ffe680"/>
    </g>
  </g>
</svg>
`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGradM" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#2a1a0e"/>
      <stop offset="70%" stop-color="#140c06"/>
      <stop offset="100%" stop-color="#080402"/>
    </radialGradient>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe680"/>
      <stop offset="50%" stop-color="#e8c84a"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
    <linearGradient id="beerGradM" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <g transform="translate(61.44, 61.44) scale(0.76)">
    <rect width="472" height="472" x="20" y="20" rx="64" fill="none" stroke="url(#goldGradM)" stroke-width="8" opacity="0.85"/>
    <circle cx="256" cy="256" r="180" fill="none" stroke="url(#goldGradM)" stroke-width="4" stroke-dasharray="8 6" opacity="0.6"/>

    <g transform="translate(0, 10)">
      <path d="M 330 210 C 410 210, 410 350, 330 350" fill="none" stroke="url(#goldGradM)" stroke-width="26" stroke-linecap="round"/>
      <path d="M 170 180 L 180 390 C 180 405, 330 405, 330 390 L 340 180 Z" fill="url(#beerGradM)" stroke="url(#goldGradM)" stroke-width="12" stroke-linejoin="round"/>
      <path d="M 155 180 C 145 150, 185 130, 205 150 C 220 125, 260 120, 280 145 C 300 125, 345 135, 345 160 C 365 160, 370 195, 340 200 C 310 200, 170 200, 155 180 Z" fill="#ffffff" stroke="#f0ebe0" stroke-width="6"/>
      <path d="M 190 195 C 190 230, 205 230, 205 195" fill="#ffffff"/>
      <path d="M 270 195 C 270 245, 285 245, 285 195" fill="#ffffff"/>

      <g transform="translate(255, 295)" stroke="#ffe680" stroke-width="6" stroke-linecap="round" fill="none">
        <circle cx="0" cy="0" r="22" stroke="#ffe680" stroke-width="4" opacity="0.7"/>
        <line x1="0" y1="-32" x2="0" y2="32"/>
        <line x1="-30" y1="0" x2="30" y2="0"/>
      </g>

      <g transform="translate(135, 350) rotate(-15)">
        <rect width="60" height="60" rx="12" fill="#241408" stroke="url(#goldGradM)" stroke-width="4"/>
        <circle cx="30" cy="30" r="5" fill="#ffe680"/>
        <circle cx="16" cy="16" r="5" fill="#ffe680"/>
        <circle cx="44" cy="44" r="5" fill="#ffe680"/>
      </g>
      <g transform="translate(325, 360) rotate(15)">
        <rect width="60" height="60" rx="12" fill="#241408" stroke="url(#goldGradM)" stroke-width="4"/>
        <circle cx="18" cy="18" r="5" fill="#ffe680"/>
        <circle cx="42" cy="18" r="5" fill="#ffe680"/>
        <circle cx="18" cy="42" r="5" fill="#ffe680"/>
        <circle cx="42" cy="42" r="5" fill="#ffe680"/>
      </g>
    </g>
  </g>
</svg>
`;

const mobileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <radialGradient id="bgM" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#221206"/>
      <stop offset="60%" stop-color="#120904"/>
      <stop offset="100%" stop-color="#080402"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bgM)"/>
  <rect width="1080" height="160" fill="#140a04" opacity="0.95"/>
  <text x="60" y="105" fill="#e8c84a" font-family="sans-serif" font-size="52" font-weight="bold">🍺 BARBUTUL LU' CĂLUGĂRU</text>
  <text x="540" y="380" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="64" font-weight="900">JOC MEDIEVAL DE BĂUT</text>
  <text x="540" y="450" text-anchor="middle" fill="#a89a80" font-family="sans-serif" font-size="34">Barbut Clasic • Duel 1v1 Trivia • Tabla Mănăstirii</text>
  <rect x="100" y="560" width="880" height="340" rx="32" fill="#1e1208" stroke="#e8c84a" stroke-width="4"/>
  <text x="160" y="660" fill="#ffe680" font-family="sans-serif" font-size="48" font-weight="bold">🎲 Mod Clasic</text>
  <text x="160" y="730" fill="#d0c4b0" font-family="sans-serif" font-size="32">Aruncă zarurile și încearcă-ți norocul!</text>
  <rect x="100" y="940" width="880" height="340" rx="32" fill="#1e1208" stroke="#e8c84a" stroke-width="4"/>
  <text x="160" y="1040" fill="#ffe680" font-family="sans-serif" font-size="48" font-weight="bold">⚔️ Duel 1v1 Trivia Online</text>
  <text x="160" y="1110" fill="#d0c4b0" font-family="sans-serif" font-size="32">Întrebări rapide și clasament live!</text>
  <rect x="100" y="1320" width="880" height="340" rx="32" fill="#1e1208" stroke="#e8c84a" stroke-width="4"/>
  <text x="160" y="1420" fill="#ffe680" font-family="sans-serif" font-size="48" font-weight="bold">🏰 Tabla Mănăstirii</text>
  <text x="160" y="1490" fill="#d0c4b0" font-family="sans-serif" font-size="32">30 de chilii tematice cu provocări.</text>
</svg>`;

const desktopSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bgDesk" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#241408"/>
      <stop offset="60%" stop-color="#120904"/>
      <stop offset="100%" stop-color="#080402"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bgDesk)"/>
  <rect width="1920" height="100" fill="#140a04" opacity="0.95"/>
  <text x="80" y="65" fill="#e8c84a" font-family="sans-serif" font-size="38" font-weight="bold">🍺 BARBUTUL LU' CĂLUGĂRU</text>
  <text x="960" y="240" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="56" font-weight="900">JOC MEDIEVAL DE BĂUT PENTRU GAȘCĂ</text>
  <rect x="180" y="380" width="460" height="520" rx="24" fill="#1e1208" stroke="#e8c84a" stroke-width="3"/>
  <text x="410" y="470" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="36" font-weight="bold">🎲 Barbut Clasic</text>
  <rect x="730" y="380" width="460" height="520" rx="24" fill="#1e1208" stroke="#e8c84a" stroke-width="3"/>
  <text x="960" y="470" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="36" font-weight="bold">⚔️ Duel 1v1 Trivia</text>
  <rect x="1280" y="380" width="460" height="520" rx="24" fill="#1e1208" stroke="#e8c84a" stroke-width="3"/>
  <text x="1510" y="470" text-anchor="middle" fill="#ffe680" font-family="sans-serif" font-size="36" font-weight="bold">🏰 Tabla Mănăstirii</text>
</svg>`;

async function generateAssets() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const anyBuf = Buffer.from(iconSvg);
  const maskBuf = Buffer.from(maskableSvg);

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg, 'utf8');

  console.log('Writing 192, 512, maskable icons & screenshots to public/...');
  await sharp(anyBuf).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(anyBuf).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(anyBuf).resize(64, 64).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'favicon.png'));

  await sharp(maskBuf).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'icon-maskable-192.png'));
  await sharp(maskBuf).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'icon-maskable-512.png'));

  await sharp(Buffer.from(mobileSvg)).png().toFile(path.join(publicDir, 'screenshot-mobile.png'));
  await sharp(Buffer.from(desktopSvg)).png().toFile(path.join(publicDir, 'screenshot-desktop.png'));

  console.log('All PWA assets written to public directory successfully!');
}

generateAssets().catch(console.error);
