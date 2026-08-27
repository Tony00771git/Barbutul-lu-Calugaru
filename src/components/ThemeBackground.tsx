import React, { useState } from 'react';
import { ThemeId } from '../types';
import { useApp } from '../context/AppContext';

interface ThemeBackgroundProps {
  theme: ThemeId;
}

const THEME_FALLBACK_PHOTOS: Record<ThemeId, string[]> = {
  tavern: [
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop',
    '/backgrounds/tavern.png',
  ],
  cellar: [
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1920&auto=format&fit=crop',
    '/backgrounds/cellar.png',
  ],
  great_hall: [
    'https://images.unsplash.com/photo-1548625361-16eb1ea1e5d5?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=1920&auto=format&fit=crop',
    '/backgrounds/great_hall.png',
  ],
  dungeon: [
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    '/backgrounds/dungeon.png',
  ],
  crypt: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop',
    '/backgrounds/crypt.png',
  ],
  dragon_lair: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
  ],
  celestial_observatory: [
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1920&auto=format&fit=crop',
  ],
  enchanted_forest: [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1920&auto=format&fit=crop',
  ],
  royal_treasury: [
    'https://images.unsplash.com/photo-1548625361-16eb1ea1e5d5?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop',
  ],
};

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  const { customThemeBackgrounds } = useApp();
  const [photoErrorCount, setPhotoErrorCount] = useState<Record<string, number>>({});

  const userCustomImage = customThemeBackgrounds?.[theme];

  const candidateList = THEME_FALLBACK_PHOTOS[theme] || THEME_FALLBACK_PHOTOS.tavern;
  const currentAttemptIndex = photoErrorCount[theme] || 0;
  const fallbackPhotoUrl = !userCustomImage && currentAttemptIndex < candidateList.length ? candidateList[currentAttemptIndex] : null;

  const activeImageUrl = userCustomImage || fallbackPhotoUrl;

  const handleImageError = () => {
    if (!userCustomImage) {
      setPhotoErrorCount(prev => ({
        ...prev,
        [theme]: (prev[theme] || 0) + 1,
      }));
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. TAVERN THEME: Taverna Călugărilor */}
      {theme === 'tavern' && (
        <div className="absolute inset-0 bg-[#0c0805]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Taverna Călugărilor"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
            />
          )}

          {/* Fallback & Atmospheric SVG Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="tavernHearthGlow" cx="50%" cy="80%" r="60%">
                <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#b44200" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#4a1804" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0a0502" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="tavernWoodBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2e1a0c" />
                <stop offset="50%" stopColor="#1a0e06" />
                <stop offset="100%" stopColor="#0d0703" />
              </linearGradient>
              <radialGradient id="tavernCandleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe680" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#e8c84a" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#c2781b" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="tavernBarrelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1c0f07" />
                <stop offset="30%" stopColor="#3d2110" />
                <stop offset="70%" stopColor="#2c170b" />
                <stop offset="100%" stopColor="#120a04" />
              </linearGradient>
            </defs>

            {/* Dark Stone Tavern Wall */}
            <rect width="1080" height="1920" fill="#0f0a06" />

            {/* Distant Arches and Fireplace Hearth */}
            <path d="M 340 1920 L 340 1400 Q 540 1320 740 1400 L 740 1920 Z" fill="#180c05" />
            <ellipse cx="540" cy="1650" rx="360" ry="420" fill="url(#tavernHearthGlow)" />
            
            {/* Fireplace Flame Silhouettes */}
            <path
              d="M 440 1780 Q 480 1520 540 1580 Q 600 1500 640 1780 Z"
              fill="#ff9922"
              opacity="0.8"
            />
            <path
              d="M 480 1780 Q 520 1560 540 1620 Q 570 1550 600 1780 Z"
              fill="#ffee77"
              opacity="0.9"
            />

            {/* Massive Rustic Ceiling Wooden Beams */}
            <polygon points="0,0 1080,0 1080,180 0,260" fill="url(#tavernWoodBeam)" />
            <polygon points="0,200 1080,120 1080,220 0,310" fill="#140b05" />
            <polygon points="0,0 220,0 120,900 0,850" fill="url(#tavernWoodBeam)" />
            <polygon points="860,0 1080,0 1080,850 960,900" fill="url(#tavernWoodBeam)" />
            
            {/* Hanging Lanterns from Beams */}
            <line x1="160" y1="350" x2="160" y2="580" stroke="#080402" strokeWidth="6" />
            <ellipse cx="160" cy="640" rx="200" ry="200" fill="url(#tavernCandleGlow)" />
            <polygon points="130,580 190,580 175,660 145,660" fill="#1f1107" stroke="#e8c84a" strokeWidth="2" />
            <ellipse cx="160" cy="620" rx="10" ry="16" fill="#fff199" />

            <line x1="920" y1="350" x2="920" y2="580" stroke="#080402" strokeWidth="6" />
            <ellipse cx="920" cy="640" rx="200" ry="200" fill="url(#tavernCandleGlow)" />
            <polygon points="890,580 950,580 935,660 905,660" fill="#1f1107" stroke="#e8c84a" strokeWidth="2" />
            <ellipse cx="920" cy="620" rx="10" ry="16" fill="#fff199" />

            {/* Stacks of Rustic Beer Barrels on Sides */}
            <ellipse cx="140" cy="1650" rx="120" ry="140" fill="url(#tavernBarrelGrad)" stroke="#0d0703" strokeWidth="4" />
            <path d="M 40 1600 Q 140 1560 240 1600" stroke="#543118" strokeWidth="8" fill="none" />
            <path d="M 40 1700 Q 140 1660 240 1700" stroke="#543118" strokeWidth="8" fill="none" />

            <ellipse cx="260" cy="1750" rx="110" ry="130" fill="url(#tavernBarrelGrad)" stroke="#0d0703" strokeWidth="4" />
            <path d="M 170 1710 Q 260 1675 350 1710" stroke="#543118" strokeWidth="7" fill="none" />

            <ellipse cx="940" cy="1650" rx="120" ry="140" fill="url(#tavernBarrelGrad)" stroke="#0d0703" strokeWidth="4" />
            <path d="M 840 1600 Q 940 1560 1040 1600" stroke="#543118" strokeWidth="8" fill="none" />
            <path d="M 840 1700 Q 940 1660 1040 1700" stroke="#543118" strokeWidth="8" fill="none" />

            {/* Floating Warm Golden Candle Embers */}
            <circle cx="320" cy="980" r="3" fill="#ffe680" opacity="0.8" />
            <circle cx="780" cy="1120" r="4" fill="#ffd700" opacity="0.7" />
            <circle cx="500" cy="850" r="2.5" fill="#ffb74d" opacity="0.9" />
            <circle cx="620" cy="1300" r="3.5" fill="#ffe082" opacity="0.75" />
          </svg>

          {/* Vignette Overlay for Crisp UI Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080503]/85 via-[#0c0805]/70 to-[#080503]/90" />
        </div>
      )}

      {/* 2. CELLAR THEME: Pivnița de Bere */}
      {theme === 'cellar' && (
        <div className="absolute inset-0 bg-[#090704]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Pivnița de Bere"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
            />
          )}

          {/* Fallback & Atmospheric SVG Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="cellarVault" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a120b" />
                <stop offset="50%" stopColor="#291b10" />
                <stop offset="100%" stopColor="#0e0a06" />
              </linearGradient>
              <radialGradient id="cellarLanternGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffb347" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#d97706" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#78350f" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="barrelWood" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1f140d" />
                <stop offset="50%" stopColor="#452a1a" />
                <stop offset="100%" stopColor="#1a1009" />
              </linearGradient>
              <linearGradient id="copperStill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#9a3412" />
              </linearGradient>
            </defs>

            {/* Dark Stone Cellar Background */}
            <rect width="1080" height="1920" fill="#0c0805" />

            {/* Romanesque Vaulted Stone Arches */}
            <path d="M 0 0 Q 540 450 1080 0 L 1080 600 Q 540 850 0 600 Z" fill="url(#cellarVault)" />
            <path d="M 120 0 Q 540 360 960 0" stroke="#452a1a" strokeWidth="16" fill="none" />
            <path d="M 240 0 Q 540 280 840 0" stroke="#301d12" strokeWidth="12" fill="none" />

            {/* Massive Stone Pillar on Left */}
            <rect x="0" y="350" width="180" height="1570" fill="#18110a" stroke="#2a1d12" strokeWidth="4" />
            {/* Massive Stone Pillar on Right */}
            <rect x="900" y="350" width="180" height="1570" fill="#18110a" stroke="#2a1d12" strokeWidth="4" />

            {/* Central Copper Brewing Kettle in Background */}
            <ellipse cx="540" cy="1480" rx="190" ry="240" fill="url(#copperStill)" opacity="0.85" />
            <rect x="490" y="1150" width="100" height="180" rx="10" fill="#b45309" />
            <path d="M 440 1200 Q 540 1100 640 1200" stroke="#d97706" strokeWidth="10" fill="none" />

            {/* Hanging Lantern with Amber Glow */}
            <line x1="540" y1="200" x2="540" y2="520" stroke="#1f140d" strokeWidth="6" />
            <ellipse cx="540" cy="580" rx="240" ry="240" fill="url(#cellarLanternGlow)" />
            <polygon points="510,520 570,520 555,600 525,600" fill="#291b10" stroke="#d97706" strokeWidth="2" />
            <circle cx="540" cy="560" r="14" fill="#fed7aa" />

            {/* Stacked Oak Barrels on Left Side */}
            <g>
              <ellipse cx="160" cy="1200" rx="110" ry="130" fill="url(#barrelWood)" stroke="#0e0a06" strokeWidth="4" />
              <path d="M 70 1150 Q 160 1120 250 1150" stroke="#1f140d" strokeWidth="8" fill="none" />
              <path d="M 70 1250 Q 160 1220 250 1250" stroke="#1f140d" strokeWidth="8" fill="none" />

              <ellipse cx="140" cy="1450" rx="120" ry="140" fill="url(#barrelWood)" stroke="#0e0a06" strokeWidth="4" />
              <path d="M 40 1400 Q 140 1360 240 1400" stroke="#1f140d" strokeWidth="8" fill="none" />
              <path d="M 40 1500 Q 140 1460 240 1500" stroke="#1f140d" strokeWidth="8" fill="none" />

              <ellipse cx="220" cy="1680" rx="130" ry="150" fill="url(#barrelWood)" stroke="#0e0a06" strokeWidth="4" />
              <path d="M 110 1630 Q 220 1590 330 1630" stroke="#1f140d" strokeWidth="8" fill="none" />
              <path d="M 110 1730 Q 220 1690 330 1730" stroke="#1f140d" strokeWidth="8" fill="none" />
            </g>

            {/* Stacked Oak Barrels on Right Side */}
            <g>
              <ellipse cx="920" cy="1200" rx="110" ry="130" fill="url(#barrelWood)" stroke="#0e0a06" strokeWidth="4" />
              <path d="M 830 1150 Q 920 1120 1010 1150" stroke="#1f140d" strokeWidth="8" fill="none" />
              <path d="M 830 1250 Q 920 1220 1010 1250" stroke="#1f140d" strokeWidth="8" fill="none" />

              <ellipse cx="940" cy="1450" rx="120" ry="140" fill="url(#barrelWood)" stroke="#0e0a06" strokeWidth="4" />
              <path d="M 840 1400 Q 940 1360 1040 1400" stroke="#1f140d" strokeWidth="8" fill="none" />
              <path d="M 840 1500 Q 940 1460 1040 1500" stroke="#1f140d" strokeWidth="8" fill="none" />

              <ellipse cx="860" cy="1680" rx="130" ry="150" fill="url(#barrelWood)" stroke="#0e0a06" strokeWidth="4" />
              <path d="M 750 1630 Q 860 1590 970 1630" stroke="#1f140d" strokeWidth="8" fill="none" />
              <path d="M 750 1730 Q 860 1690 970 1730" stroke="#1f140d" strokeWidth="8" fill="none" />
            </g>

            {/* Cobblestone Floor Detail */}
            <ellipse cx="540" cy="1880" rx="540" ry="120" fill="#140e09" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060402]/85 via-[#090704]/70 to-[#060402]/90" />
        </div>
      )}

      {/* 3. GREAT HALL THEME: Sala Mare a Mănăstirii */}
      {theme === 'great_hall' && (
        <div className="absolute inset-0 bg-[#080605]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Sala Mare a Mănăstirii"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
            />
          )}

          {/* Fallback & Atmospheric SVG Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hallGothicRoof" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1c1611" />
                <stop offset="40%" stopColor="#2c221a" />
                <stop offset="100%" stopColor="#120e0a" />
              </linearGradient>
              <radialGradient id="chandelierGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe680" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#e8c84a" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#b45309" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="stainedGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="40%" stopColor="#eab308" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Dark Cathedral Hall Background */}
            <rect width="1080" height="1920" fill="#0a0705" />

            {/* Gothic Arched Vaulted Ceiling */}
            <polygon points="540,120 0,650 1080,650" fill="url(#hallGothicRoof)" />
            <line x1="540" y1="120" x2="540" y2="650" stroke="#3d2e22" strokeWidth="12" />
            <line x1="540" y1="120" x2="180" y2="650" stroke="#3d2e22" strokeWidth="10" />
            <line x1="540" y1="120" x2="900" y2="650" stroke="#3d2e22" strokeWidth="10" />

            {/* Center Stained Glass Lancet Window */}
            <path d="M 440 650 L 440 400 Q 540 280 640 400 L 640 650 Z" fill="url(#stainedGlass)" />
            <path d="M 440 650 L 440 400 Q 540 280 640 400 L 640 650 Z" stroke="#1f1812" strokeWidth="6" fill="none" />
            <line x1="540" y1="310" x2="540" y2="650" stroke="#1f1812" strokeWidth="4" />
            <line x1="440" y1="480" x2="640" y2="480" stroke="#1f1812" strokeWidth="4" />

            {/* Grand Chandelier with Ring of Candles */}
            <line x1="540" y1="200" x2="540" y2="580" stroke="#18110b" strokeWidth="6" />
            <ellipse cx="540" cy="680" rx="300" ry="300" fill="url(#chandelierGlow)" />
            {/* Iron Ring */}
            <ellipse cx="540" cy="650" rx="220" ry="45" fill="none" stroke="#2d2117" strokeWidth="12" />
            {/* Chandelier Candles */}
            {[-180, -120, -60, 0, 60, 120, 180].map((offset, idx) => (
              <g key={idx} transform={`translate(${540 + offset}, 630)`}>
                <rect x="-4" y="-20" width="8" height="20" fill="#fef08a" />
                <ellipse cx="0" cy="-28" rx="6" ry="10" fill="#f59e0b" />
                <circle cx="0" cy="-28" r="4" fill="#ffffff" />
              </g>
            ))}

            {/* Tall Stone Cathedral Pillars on Left & Right */}
            <rect x="80" y="550" width="100" height="1370" fill="#1f1711" stroke="#332419" strokeWidth="4" />
            <rect x="900" y="550" width="100" height="1370" fill="#1f1711" stroke="#332419" strokeWidth="4" />

            {/* Long Banquet Feast Table in Foreground */}
            <polygon points="260,1400 820,1400 940,1920 140,1920" fill="#2d1f14" stroke="#422e1e" strokeWidth="6" />
            {/* Table runner cloth */}
            <polygon points="400,1400 680,1400 740,1920 340,1920" fill="#781d1d" opacity="0.85" />

            {/* Metal Flagons and Goblets on Feast Table */}
            <polygon points="460,1500 480,1500 475,1540 465,1540" fill="#d4af37" />
            <polygon points="580,1520 605,1520 600,1565 585,1565" fill="#d4af37" />
            <polygon points="510,1620 540,1620 535,1680 515,1680" fill="#d4af37" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060403]/85 via-[#080605]/70 to-[#060403]/90" />
        </div>
      )}

      {/* 4. DUNGEON THEME: Temnița Mănăstirii */}
      {theme === 'dungeon' && (
        <div className="absolute inset-0 bg-[#070504]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Temnița Mănăstirii"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
            />
          )}

          {/* Fallback & Atmospheric SVG Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="dungeonWall" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#140f0c" />
                <stop offset="50%" stopColor="#241a15" />
                <stop offset="100%" stopColor="#0c0806" />
              </linearGradient>
              <radialGradient id="dungeonTorchGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff9800" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#e65100" stopOpacity="0.55" />
                <stop offset="70%" stopColor="#4e1b00" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Dark Stone Brick Dungeon Wall */}
            <rect width="1080" height="1920" fill="url(#dungeonWall)" />

            {/* Heavy Stone Brick Patterns */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => (
              <g key={row}>
                <line x1="0" y1={row * 200} x2="1080" y2={row * 200} stroke="#0e0a07" strokeWidth="4" />
                {[0, 1, 2, 3, 4].map(col => (
                  <line
                    key={col}
                    x1={col * 240 + (row % 2 === 0 ? 0 : 120)}
                    y1={row * 200}
                    x2={col * 240 + (row % 2 === 0 ? 0 : 120)}
                    y2={(row + 1) * 200}
                    stroke="#0e0a07"
                    strokeWidth="3"
                  />
                ))}
              </g>
            ))}

            {/* Arched Iron-Barred Cell Gate in Center-Left */}
            <path d="M 180 1400 L 180 850 Q 380 700 580 850 L 580 1400 Z" fill="#080503" stroke="#2c1e14" strokeWidth="12" />
            {/* Vertical Iron Bars */}
            {[240, 300, 360, 420, 480, 520].map((barX, idx) => (
              <line key={idx} x1={barX} y1="780" x2={barX} y2="1400" stroke="#3d2c20" strokeWidth="10" />
            ))}
            {/* Horizontal Iron Bands */}
            <line x1="180" y1="950" x2="580" y2="950" stroke="#4f382a" strokeWidth="12" />
            <line x1="180" y1="1250" x2="580" y2="1250" stroke="#4f382a" strokeWidth="12" />

            {/* Wall Chains and Iron Shackles on Right Wall */}
            <path d="M 820 850 Q 850 950 820 1050" stroke="#4a3729" strokeWidth="8" fill="none" />
            <circle cx="820" cy="1060" r="16" fill="none" stroke="#5a4332" strokeWidth="6" />
            <path d="M 920 880 Q 950 980 920 1080" stroke="#4a3729" strokeWidth="8" fill="none" />
            <circle cx="920" cy="1090" r="16" fill="none" stroke="#5a4332" strokeWidth="6" />

            {/* Straw Bed on Flagstone Floor */}
            <ellipse cx="440" cy="1680" rx="340" ry="120" fill="#a16207" opacity="0.75" />
            <ellipse cx="440" cy="1660" rx="300" ry="90" fill="#ca8a04" opacity="0.65" />
            {/* Rough Burlap Sack Blanket */}
            <polygon points="320,1580 560,1560 580,1720 300,1710" fill="#573a24" opacity="0.9" />

            {/* Blazing Wall Torch on Right with Fiery Glow & Sparks */}
            <ellipse cx="880" cy="680" rx="260" ry="260" fill="url(#dungeonTorchGlow)" />
            {/* Torch Sconce Bracket */}
            <line x1="880" y1="720" x2="880" y2="800" stroke="#26170d" strokeWidth="10" />
            <line x1="880" y1="750" x2="940" y2="790" stroke="#26170d" strokeWidth="8" />
            {/* Torch Flame */}
            <path d="M 870 720 Q 880 630 890 670 Q 900 640 905 720 Z" fill="#ffedd5" />
            <path d="M 875 720 Q 880 650 890 685 Q 895 660 900 720 Z" fill="#f97316" />

            {/* Floating Hot Fire Sparks */}
            <circle cx="850" cy="600" r="3" fill="#fdba74" opacity="0.9" />
            <circle cx="890" cy="560" r="2.5" fill="#fed7aa" opacity="0.8" />
            <circle cx="830" cy="540" r="2" fill="#fb923c" opacity="0.7" />
            <circle cx="910" cy="510" r="3" fill="#f97316" opacity="0.85" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050302]/85 via-[#070504]/70 to-[#050302]/90" />
        </div>
      )}

      {/* 5. CRYPT THEME: Cripta Fantomelor Însetate */}
      {theme === 'crypt' && (
        <div className="absolute inset-0 bg-[#020806]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Cripta Fantomelor Însetate"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            />
          )}

          {/* Deep Crypt Gothic Atmospheric Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-75"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="cryptGothicVault" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#03140e" />
                <stop offset="50%" stopColor="#08291e" />
                <stop offset="100%" stopColor="#020d09" />
              </linearGradient>
              <radialGradient id="cryptGhostGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#059669" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#042f22" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="spectralWisp" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="cryptStonePillar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#04120c" />
                <stop offset="50%" stopColor="#0c2d20" />
                <stop offset="100%" stopColor="#051710" />
              </linearGradient>
            </defs>

            {/* Dark Crypt Chamber Background */}
            <rect width="1080" height="1920" fill="url(#cryptGothicVault)" />

            {/* Ambient Spectral Glow Clouds */}
            <ellipse cx="540" cy="850" rx="460" ry="380" fill="url(#cryptGhostGlow)" />
            <ellipse cx="200" cy="1400" rx="300" ry="240" fill="url(#cryptGhostGlow)" opacity="0.6" />
            <ellipse cx="880" cy="1400" rx="300" ry="240" fill="url(#cryptGhostGlow)" opacity="0.6" />

            {/* Gothic Vaulted Ribbed Arches */}
            <path d="M 0 0 Q 540 480 1080 0 L 1080 700 Q 540 1000 0 700 Z" fill="#03100b" opacity="0.9" />
            <path d="M 80 0 Q 540 400 1000 0" stroke="#064e3b" strokeWidth="16" fill="none" />
            <path d="M 200 0 Q 540 320 880 0" stroke="#047857" strokeWidth="10" fill="none" />
            <path d="M 320 0 Q 540 240 760 0" stroke="#059669" strokeWidth="6" fill="none" />

            {/* Massive Stone Crypt Pillars */}
            <rect x="0" y="320" width="160" height="1600" fill="url(#cryptStonePillar)" stroke="#064e3b" strokeWidth="4" />
            <rect x="920" y="320" width="160" height="1600" fill="url(#cryptStonePillar)" stroke="#064e3b" strokeWidth="4" />

            {/* Hanging Spectral Lanterns */}
            <line x1="280" y1="200" x2="280" y2="600" stroke="#020c08" strokeWidth="6" />
            <ellipse cx="280" cy="650" rx="180" ry="180" fill="url(#spectralWisp)" />
            <polygon points="255,600 305,600 295,670 265,670" fill="#02140d" stroke="#34d399" strokeWidth="2" />
            <ellipse cx="280" cy="640" rx="10" ry="16" fill="#a7f3d0" />

            <line x1="800" y1="200" x2="800" y2="600" stroke="#020c08" strokeWidth="6" />
            <ellipse cx="800" cy="650" rx="180" ry="180" fill="url(#spectralWisp)" />
            <polygon points="775,600 825,600 815,670 785,670" fill="#02140d" stroke="#34d399" strokeWidth="2" />
            <ellipse cx="800" cy="640" rx="10" ry="16" fill="#a7f3d0" />

            {/* Center Ancient Crypt Sarcophagus & Mausoleum Altar */}
            <g transform="translate(0, 50)">
              <polygon points="260,1500 820,1500 890,1850 190,1850" fill="#03160e" stroke="#059669" strokeWidth="6" />
              <rect x="340" y="1380" width="400" height="160" rx="12" fill="#062417" stroke="#34d399" strokeWidth="4" />
              <line x1="340" y1="1450" x2="740" y2="1450" stroke="#10b981" strokeWidth="3" />
              {/* Runic Carvings on Tomb */}
              <text x="540" y="1430" fill="#a7f3d0" fontSize="22" fontWeight="bold" textAnchor="middle" opacity="0.85">✝ R.I.P. CĂLUGĂRU' ✝</text>
              <text x="540" y="1500" fill="#6ee7b7" fontSize="16" fontFamily="serif" textAnchor="middle" opacity="0.75">„Aici odihnește cel mai viteaz băutor”</text>
            </g>

            {/* Floating Ghost Apparition Silhouettes & Wisps */}
            <ellipse cx="540" cy="880" rx="40" ry="70" fill="#6ee7b7" opacity="0.35" />
            <circle cx="530" cy="860" r="14" fill="#a7f3d0" opacity="0.5" />
            <circle cx="550" cy="860" r="14" fill="#a7f3d0" opacity="0.5" />
            <ellipse cx="440" cy="980" rx="25" ry="45" fill="#34d399" opacity="0.3" />
            <ellipse cx="640" cy="960" rx="25" ry="45" fill="#34d399" opacity="0.3" />

            {/* Floating Ethereal Mist Particles */}
            <circle cx="340" cy="920" r="4" fill="#a7f3d0" opacity="0.8" />
            <circle cx="720" cy="850" r="5" fill="#6ee7b7" opacity="0.85" />
            <circle cx="480" cy="1120" r="3.5" fill="#34d399" opacity="0.75" />
            <circle cx="620" cy="1220" r="4.5" fill="#a7f3d0" opacity="0.9" />
            <circle cx="540" cy="1300" r="3" fill="#6ee7b7" opacity="0.8" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020504]/85 via-[#04100c]/65 to-[#020504]/90" />
        </div>
      )}

      {/* 6. DRAGON LAIR THEME: Bârlogul Dragonului de Foc */}
      {theme === 'dragon_lair' && (
        <div className="absolute inset-0 bg-[#0f0302]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Bârlogul Dragonului"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            />
          )}

          {/* Volcanic Dragon Lair Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-75"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="dragonLairBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a0705" />
                <stop offset="40%" stopColor="#300d08" />
                <stop offset="80%" stopColor="#200604" />
                <stop offset="100%" stopColor="#0f0201" />
              </linearGradient>
              <radialGradient id="magmaChamberGlow" cx="50%" cy="85%" r="65%">
                <stop offset="0%" stopColor="#ff4500" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#dc2626" stopOpacity="0.6" />
                <stop offset="65%" stopColor="#7f1d1d" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fireTorchGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#ea580c" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#9a3412" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="obsidianPillar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#120403" />
                <stop offset="50%" stopColor="#2a0a07" />
                <stop offset="100%" stopColor="#150504" />
              </linearGradient>
            </defs>

            {/* Volcanic Rock Background */}
            <rect width="1080" height="1920" fill="url(#dragonLairBg)" />

            {/* Giant Magma Cavern Glow */}
            <ellipse cx="540" cy="1650" rx="540" ry="340" fill="url(#magmaChamberGlow)" />

            {/* Cavern Roof Jagged Obsidian Stalactites */}
            <polygon points="0,0 200,0 120,520 0,380" fill="url(#obsidianPillar)" />
            <polygon points="180,0 400,0 280,420 200,0" fill="#180504" />
            <polygon points="680,0 900,0 800,420 680,0" fill="#180504" />
            <polygon points="880,0 1080,0 1080,380 960,520" fill="url(#obsidianPillar)" />

            {/* Massive Obsidian Side Pillars */}
            <polygon points="0,400 160,400 200,1920 0,1920" fill="url(#obsidianPillar)" stroke="#991b1b" strokeWidth="4" />
            <polygon points="920,400 1080,400 1080,1920 880,1920" fill="url(#obsidianPillar)" stroke="#991b1b" strokeWidth="4" />

            {/* Dragon Sconce Torches with Fiery Aura */}
            <ellipse cx="190" cy="800" rx="180" ry="180" fill="url(#fireTorchGlow)" />
            <polygon points="175,760 205,760 195,840 180,840" fill="#240705" stroke="#f59e0b" strokeWidth="2" />
            <ellipse cx="190" cy="780" rx="12" ry="20" fill="#fed7aa" />

            <ellipse cx="890" cy="800" rx="180" ry="180" fill="url(#fireTorchGlow)" />
            <polygon points="875,760 905,760 895,840 880,840" fill="#240705" stroke="#f59e0b" strokeWidth="2" />
            <ellipse cx="890" cy="780" rx="12" ry="20" fill="#fed7aa" />

            {/* Dragon Sculpture / Horned Skull Carving */}
            <g transform="translate(540, 680)">
              <ellipse cx="0" cy="0" rx="130" ry="90" fill="#220604" stroke="#dc2626" strokeWidth="4" />
              {/* Glowing Dragon Eyes */}
              <ellipse cx="-45" cy="-10" rx="16" ry="24" fill="#fbbf24" stroke="#ff4500" strokeWidth="3" />
              <ellipse cx="45" cy="-10" rx="16" ry="24" fill="#fbbf24" stroke="#ff4500" strokeWidth="3" />
              <ellipse cx="-45" cy="-10" rx="5" ry="16" fill="#450a0a" />
              <ellipse cx="45" cy="-10" rx="5" ry="16" fill="#450a0a" />
              {/* Dragon Horns */}
              <path d="M -80 -40 Q -180 -180 -120 -220 Q -90 -160 -40 -70 Z" fill="#140302" stroke="#ef4444" strokeWidth="3" />
              <path d="M 80 -40 Q 180 -180 120 -220 Q 90 -160 40 -70 Z" fill="#140302" stroke="#ef4444" strokeWidth="3" />
            </g>

            {/* Glistening Dragon Treasure Mound & Magma River */}
            <ellipse cx="540" cy="1680" rx="380" ry="160" fill="#78350f" stroke="#fbbf24" strokeWidth="4" />
            {/* Treasure Coins & Chalices */}
            {[-180, -120, -60, 0, 60, 120, 180].map((offset, idx) => (
              <circle key={idx} cx={540 + offset} cy={1650 + (idx % 2 === 0 ? 20 : -10)} r={16 + (idx % 3) * 4} fill={idx % 2 === 0 ? '#fbbf24' : '#f59e0b'} stroke="#ffd700" strokeWidth="2" />
            ))}

            {/* Flying Fiery Embers & Magma Sparks */}
            <circle cx="480" cy="1150" r="4" fill="#ffedd5" opacity="0.95" />
            <circle cx="620" cy="1080" r="3.5" fill="#fdba74" opacity="0.9" />
            <circle cx="410" cy="950" r="3" fill="#f97316" opacity="0.85" />
            <circle cx="670" cy="890" r="4.5" fill="#ef4444" opacity="0.85" />
            <circle cx="530" cy="1320" r="5" fill="#fed7aa" opacity="0.9" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#140403]/85 via-[#1c0806]/65 to-[#0f0201]/90" />
        </div>
      )}

      {/* 7. CELESTIAL OBSERVATORY THEME: Observatorul Astral al Magilor */}
      {theme === 'celestial_observatory' && (
        <div className="absolute inset-0 bg-[#060817]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Observatorul Celest"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            />
          )}

          {/* Astral Observatory Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-75"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="astralBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#080c24" />
                <stop offset="40%" stopColor="#111640" />
                <stop offset="80%" stopColor="#090d29" />
                <stop offset="100%" stopColor="#040512" />
              </linearGradient>
              <radialGradient id="astralNebula" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.6" />
                <stop offset="35%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#312e81" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#c7d2fe" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Deep Night Cosmos Background */}
            <rect width="1080" height="1920" fill="url(#astralBg)" />

            {/* Cosmic Nebula Cloud */}
            <ellipse cx="540" cy="720" rx="460" ry="420" fill="url(#astralNebula)" />

            {/* Gothic Observatory Arched Skylight */}
            <path d="M 60 1920 L 60 700 Q 540 280 1020 700 L 1020 1920 Z" fill="none" stroke="#1e1b4b" strokeWidth="20" />
            <path d="M 140 1920 L 140 760 Q 540 380 940 760 L 940 1920 Z" fill="none" stroke="#312e81" strokeWidth="10" />

            {/* Golden Celestial Astrolabe Rings & Zodiac Armillary Sphere */}
            <g transform="translate(540, 720)">
              {/* Outer Ring */}
              <circle cx="0" cy="0" r="340" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="12 16" opacity="0.75" />
              {/* Mid Ring */}
              <ellipse cx="0" cy="0" rx="280" ry="120" fill="none" stroke="#a5b4fc" strokeWidth="2.5" transform="rotate(-25)" opacity="0.7" />
              <ellipse cx="0" cy="0" rx="280" ry="120" fill="none" stroke="#a5b4fc" strokeWidth="2.5" transform="rotate(25)" opacity="0.7" />
              {/* Inner Armillary Sphere */}
              <circle cx="0" cy="0" r="160" fill="none" stroke="#e0e7ff" strokeWidth="2" strokeDasharray="6 8" opacity="0.8" />
              {/* Central Glowing Orb (Mystic Planet / Moon) */}
              <circle cx="0" cy="0" r="36" fill="url(#moonGlow)" />
            </g>

            {/* Shimmering Constellation Lines & Star Chart Nodes */}
            <g>
              <circle cx="340" cy="520" r="5" fill="#ffffff" />
              <circle cx="460" cy="420" r="6" fill="#fef08a" />
              <circle cx="620" cy="460" r="5.5" fill="#c7d2fe" />
              <circle cx="740" cy="560" r="6" fill="#ffffff" />
              <circle cx="420" cy="940" r="4.5" fill="#ffffff" />
              <circle cx="660" cy="920" r="5" fill="#fef08a" />

              <line x1="340" y1="520" x2="460" y2="420" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
              <line x1="460" y1="420" x2="620" y2="460" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
              <line x1="620" y1="460" x2="740" y2="560" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
              <line x1="420" y1="940" x2="660" y2="920" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
            </g>

            {/* Grand Mage Desk & Astrological Scrolls in Foreground */}
            <polygon points="200,1500 880,1500 960,1920 120,1920" fill="#0c1033" stroke="#4338ca" strokeWidth="6" />
            <polygon points="360,1500 720,1500 760,1920 320,1920" fill="#1e1b4b" opacity="0.8" />

            {/* Floating Starlight Motes */}
            <circle cx="280" cy="850" r="3" fill="#e0e7ff" opacity="0.9" />
            <circle cx="800" cy="780" r="3.5" fill="#c7d2fe" opacity="0.85" />
            <circle cx="510" cy="1150" r="2.5" fill="#ffffff" opacity="0.95" />
            <circle cx="630" cy="1280" r="3" fill="#fef08a" opacity="0.8" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c24]/85 via-[#111640]/65 to-[#040512]/90" />
        </div>
      )}

      {/* 8. ENCHANTED FOREST THEME: Pădurea Vrăjită a Spiridușilor */}
      {theme === 'enchanted_forest' && (
        <div className="absolute inset-0 bg-[#02120a]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Pădurea Vrăjită"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            />
          )}

          {/* Enchanted Grove Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-75"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="forestBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#041a10" />
                <stop offset="40%" stopColor="#082e1c" />
                <stop offset="80%" stopColor="#051c11" />
                <stop offset="100%" stopColor="#020d07" />
              </linearGradient>
              <radialGradient id="forestCanopyGlow" cx="50%" cy="55%" r="55%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
                <stop offset="40%" stopColor="#059669" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="shroomGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Forest Night Background */}
            <rect width="1080" height="1920" fill="url(#forestBg)" />

            {/* Mystic Green Canopy Light */}
            <ellipse cx="540" cy="950" rx="480" ry="420" fill="url(#forestCanopyGlow)" />

            {/* Ancient Silhouetted Fairy Tree Trunks */}
            <path d="M 0,0 L 280,0 Q 180,600 260,1200 Q 140,1600 0,1920 Z" fill="#03140c" />
            <path d="M 1080,0 L 800,0 Q 900,600 820,1200 Q 940,1600 1080,1920 Z" fill="#03140c" />

            {/* Arching Willow Vines & Leaves */}
            <path d="M 160 0 Q 340 400 240 800" stroke="#064e3b" strokeWidth="8" fill="none" />
            <path d="M 920 0 Q 740 400 840 800" stroke="#064e3b" strokeWidth="8" fill="none" />

            {/* Central Glowing Runic Monolith Stone */}
            <polygon points="460,1850 490,1180 590,1180 620,1850" fill="#06291a" stroke="#10b981" strokeWidth="5" />
            <text x="540" y="1420" fill="#6ee7b7" fontSize="38" fontWeight="bold" textAnchor="middle" opacity="0.9">ᛟ ᚱ ᚦ ᚲ</text>
            <text x="540" y="1490" fill="#a7f3d0" fontSize="20" textAnchor="middle" opacity="0.75">Codrul Vrăjit</text>

            {/* Giant Bioluminescent Mushrooms on Sides */}
            <g transform="translate(180, 1550)">
              <ellipse cx="0" cy="0" rx="70" ry="70" fill="url(#shroomGlow)" />
              <path d="M -50 0 Q 0 -50 50 0 Z" fill="#06b6d4" stroke="#67e8f9" strokeWidth="3" />
              <rect x="-8" y="0" width="16" height="50" fill="#ecfeff" rx="4" />
            </g>

            <g transform="translate(900, 1550)">
              <ellipse cx="0" cy="0" rx="70" ry="70" fill="url(#shroomGlow)" />
              <path d="M -50 0 Q 0 -50 50 0 Z" fill="#06b6d4" stroke="#67e8f9" strokeWidth="3" />
              <rect x="-8" y="0" width="16" height="50" fill="#ecfeff" rx="4" />
            </g>

            {/* Dancing Forest Fireflies & Sprite Particles */}
            <circle cx="360" cy="850" r="5" fill="#a7f3d0" opacity="0.95" />
            <circle cx="700" cy="780" r="6" fill="#6ee7b7" opacity="0.9" />
            <circle cx="480" cy="680" r="4.5" fill="#34d399" opacity="0.85" />
            <circle cx="620" cy="980" r="5.5" fill="#67e8f9" opacity="0.9" />
            <circle cx="530" cy="1100" r="4" fill="#a7f3d0" opacity="0.85" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#03140c]/85 via-[#082e1c]/65 to-[#020d07]/90" />
        </div>
      )}

      {/* 9. ROYAL TREASURY THEME: Trezoreria Regală a Boierilor */}
      {theme === 'royal_treasury' && (
        <div className="absolute inset-0 bg-[#160e03]">
          {activeImageUrl && (
            <img
              src={activeImageUrl}
              alt="Trezoreria Regală"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            />
          )}

          {/* Royal Vault Artwork */}
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-75"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="treasuryBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#241705" />
                <stop offset="40%" stopColor="#3d2708" />
                <stop offset="80%" stopColor="#241705" />
                <stop offset="100%" stopColor="#120b02" />
              </linearGradient>
              <radialGradient id="goldVaultGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd700" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="75%" stopColor="#78350f" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="goldColumn" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#382106" />
                <stop offset="50%" stopColor="#69410c" />
                <stop offset="100%" stopColor="#3d2508" />
              </linearGradient>
            </defs>

            {/* Gilded Vault Background */}
            <rect width="1080" height="1920" fill="url(#treasuryBg)" />

            {/* Ambient Golden Radiance */}
            <circle cx="540" cy="960" r="480" fill="url(#goldVaultGlow)" />

            {/* Gilded Cathedral Colonnade with Marble Trim */}
            <rect x="80" y="200" width="100" height="1720" rx="10" fill="url(#goldColumn)" stroke="#ffd700" strokeWidth="4" />
            <rect x="900" y="200" width="100" height="1720" rx="10" fill="url(#goldColumn)" stroke="#ffd700" strokeWidth="4" />

            {/* Grand Golden Arch & Regal Red Velvet Drapery */}
            <path d="M 80 400 Q 540 160 1000 400" fill="none" stroke="#ffd700" strokeWidth="16" />
            <path d="M 120 280 C 350 480, 730 480, 960 280 L 1000 200 L 80 200 Z" fill="#831843" stroke="#f59e0b" strokeWidth="4" opacity="0.85" />

            {/* Royal Crest / Crown in Center Arch */}
            <g transform="translate(540, 420)">
              <polygon points="-50,40 -60,-20 -25,10 0,-40 25,10 60,-20 50,40" fill="#ffd700" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="-60" cy="-20" r="6" fill="#ef4444" />
              <circle cx="0" cy="-40" r="7" fill="#3b82f6" />
              <circle cx="60" cy="-20" r="6" fill="#10b981" />
            </g>

            {/* Overflowing Golden Altar & Royal Treasure Chests */}
            <polygon points="180,1480 900,1480 980,1920 100,1920" fill="#2d1c06" stroke="#ffd700" strokeWidth="6" />
            <polygon points="340,1480 740,1480 800,1920 280,1920" fill="#78350f" opacity="0.8" />

            {/* Mountains of Sparkling Ducats */}
            {[-220, -160, -100, -40, 20, 80, 140, 200].map((offset, idx) => (
              <g key={idx} transform={`translate(${540 + offset}, ${1540 + (idx % 3) * 15})`}>
                <circle cx="0" cy="0" r={16} fill="#ffd700" stroke="#b45309" strokeWidth="2" />
                <circle cx="5" cy="-8" r={12} fill="#fcd34d" stroke="#b45309" strokeWidth="1.5" />
              </g>
            ))}

            {/* Shimmering Golden Dust Motes */}
            <circle cx="380" cy="850" r="4.5" fill="#fef08a" opacity="0.95" />
            <circle cx="680" cy="780" r="5" fill="#ffd700" opacity="0.9" />
            <circle cx="510" cy="650" r="3.5" fill="#fcd34d" opacity="0.85" />
            <circle cx="600" cy="1150" r="4.5" fill="#fef08a" opacity="0.9" />
            <circle cx="450" cy="1250" r="3.5" fill="#ffd700" opacity="0.85" />
          </svg>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1004]/85 via-[#2b1b07]/65 to-[#0f0902]/90" />
        </div>
      )}
    </div>
  );
};
