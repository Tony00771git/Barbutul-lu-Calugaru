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
    </div>
  );
};
