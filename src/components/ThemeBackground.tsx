import React from 'react';
import { ThemeId } from '../types';

interface ThemeBackgroundProps {
  theme: ThemeId;
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. TAVERN THEME BACKGROUND */}
      {theme === 'tavern' && (
        <div className="absolute inset-0 bg-[#0c0805]">
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="hearthGlow" cx="50%" cy="80%" r="60%">
                <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#b44200" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#4a1804" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0a0502" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="woodBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2e1a0c" />
                <stop offset="50%" stopColor="#1a0e06" />
                <stop offset="100%" stopColor="#0d0703" />
              </linearGradient>
              <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe680" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#e8c84a" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#c2781b" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="barrelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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
            <ellipse cx="540" cy="1650" rx="360" ry="420" fill="url(#hearthGlow)" />
            
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
            <polygon points="0,0 1080,0 1080,180 0,260" fill="url(#woodBeam)" />
            <polygon points="0,200 1080,120 1080,220 0,310" fill="#140b05" />
            <polygon points="0,0 220,0 120,900 0,850" fill="url(#woodBeam)" />
            <polygon points="860,0 1080,0 1080,850 960,900" fill="url(#woodBeam)" />
            
            {/* Hanging Lanterns from Beams */}
            {/* Left Lantern */}
            <line x1="160" y1="350" x2="160" y2="580" stroke="#080402" strokeWidth="6" />
            <ellipse cx="160" cy="640" rx="200" ry="200" fill="url(#candleGlow)" />
            <polygon points="130,580 190,580 175,660 145,660" fill="#1f1107" stroke="#e8c84a" strokeWidth="2" />
            <ellipse cx="160" cy="620" rx="10" ry="16" fill="#fff199" />

            {/* Right Lantern */}
            <line x1="920" y1="350" x2="920" y2="580" stroke="#080402" strokeWidth="6" />
            <ellipse cx="920" cy="640" rx="200" ry="200" fill="url(#candleGlow)" />
            <polygon points="890,580 950,580 935,660 905,660" fill="#1f1107" stroke="#e8c84a" strokeWidth="2" />
            <ellipse cx="920" cy="620" rx="10" ry="16" fill="#fff199" />

            {/* Stacks of Rustic Beer Barrels on Sides */}
            {/* Left Barrels */}
            <ellipse cx="140" cy="1650" rx="120" ry="140" fill="url(#barrelGrad)" stroke="#0d0703" strokeWidth="4" />
            <path d="M 40 1600 Q 140 1560 240 1600" stroke="#543118" strokeWidth="8" fill="none" />
            <path d="M 40 1700 Q 140 1660 240 1700" stroke="#543118" strokeWidth="8" fill="none" />

            <ellipse cx="260" cy="1750" rx="110" ry="130" fill="url(#barrelGrad)" stroke="#0d0703" strokeWidth="4" />
            <path d="M 170 1710 Q 260 1675 350 1710" stroke="#543118" strokeWidth="7" fill="none" />

            {/* Right Barrels */}
            <ellipse cx="940" cy="1650" rx="120" ry="140" fill="url(#barrelGrad)" stroke="#0d0703" strokeWidth="4" />
            <path d="M 840 1600 Q 940 1560 1040 1600" stroke="#543118" strokeWidth="8" fill="none" />
            <path d="M 840 1700 Q 940 1660 1040 1700" stroke="#543118" strokeWidth="8" fill="none" />

            {/* Floating Warm Golden Candle Embers */}
            <circle cx="320" cy="980" r="3" fill="#ffe680" opacity="0.8" />
            <circle cx="780" cy="1120" r="4" fill="#ffd700" opacity="0.7" />
            <circle cx="500" cy="850" r="2.5" fill="#ffb74d" opacity="0.9" />
            <circle cx="620" cy="1300" r="3.5" fill="#ffe082" opacity="0.75" />
          </svg>

          {/* Vignette Overlay for Crisp UI Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080503]/90 via-[#0c0805]/75 to-[#080503]/90" />
        </div>
      )}

      {/* 2. SPRING MONASTERY COURTYARD THEME BACKGROUND */}
      {theme === 'spring' && (
        <div className="absolute inset-0 bg-[#071209]">
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="springSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#142c1b" />
                <stop offset="40%" stopColor="#193822" />
                <stop offset="80%" stopColor="#254a2a" />
                <stop offset="100%" stopColor="#0f2014" />
              </linearGradient>
              <radialGradient id="springSun" cx="75%" cy="25%" r="45%">
                <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="monasteryStone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#202e23" />
                <stop offset="100%" stopColor="#0d170f" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect width="1080" height="1920" fill="url(#springSky)" />
            <rect width="1080" height="1920" fill="url(#springSun)" />

            {/* Ancient Monastery Stone Walls & Arches */}
            {/* Left Monastery Wing with Romanesque Arches */}
            <path d="M 0 450 L 380 350 L 380 1920 L 0 1920 Z" fill="url(#monasteryStone)" />
            <path d="M 80 650 Q 180 500 280 650 L 280 1100 L 80 1100 Z" fill="#081009" />
            <path d="M 80 1250 Q 180 1100 280 1250 L 280 1700 L 80 1700 Z" fill="#081009" />
            
            {/* Ivy Creepers on Stone */}
            <path d="M 0 500 Q 120 540 80 700 Q 160 760 120 950 Q 200 1020 150 1200" stroke="#22543d" strokeWidth="12" fill="none" />
            <path d="M 40 460 Q 140 500 100 680" stroke="#38a169" strokeWidth="6" fill="none" />
            <circle cx="95" cy="620" r="14" fill="#276749" />
            <circle cx="140" cy="780" r="18" fill="#2f855a" />
            <circle cx="110" cy="980" r="16" fill="#276749" />

            {/* Right Monastery Bell Tower in Distance */}
            <polygon points="760,200 840,80 920,200" fill="#1b281e" />
            <rect x="760" y="200" width="160" height="1720" fill="url(#monasteryStone)" />
            <rect x="800" y="320" width="80" height="140" rx="40" fill="#070f08" />

            {/* Blossoming Cherry Trees in Monastery Courtyard */}
            {/* Tree Trunks */}
            <path d="M 940 1920 Q 900 1400 820 1100 Q 720 900 640 750" stroke="#27180e" strokeWidth="32" fill="none" strokeLinecap="round" />
            <path d="M 820 1100 Q 890 950 980 820" stroke="#27180e" strokeWidth="20" fill="none" strokeLinecap="round" />

            {/* Lush Pink & White Flower Blossom Clouds */}
            <ellipse cx="640" cy="720" rx="200" ry="140" fill="#fbcfe8" opacity="0.65" />
            <ellipse cx="780" cy="680" rx="180" ry="130" fill="#f472b6" opacity="0.55" />
            <ellipse cx="940" cy="780" rx="160" ry="120" fill="#fdf2f8" opacity="0.75" />
            <ellipse cx="720" cy="600" rx="150" ry="100" fill="#f9a8d4" opacity="0.6" />

            {/* Floating Blossom Petals Drifting in the Gentle Wind */}
            {[
              { cx: 340, cy: 750, r: 8, fill: '#fbcfe8' },
              { cx: 480, cy: 920, r: 6, fill: '#f472b6' },
              { cx: 560, cy: 1100, r: 9, fill: '#fdf2f8' },
              { cx: 280, cy: 1250, r: 7, fill: '#fbcfe8' },
              { cx: 420, cy: 1450, r: 8, fill: '#f472b6' },
              { cx: 650, cy: 1350, r: 10, fill: '#fdf2f8' },
              { cx: 510, cy: 1680, r: 7, fill: '#fbcfe8' },
              { cx: 360, cy: 1780, r: 9, fill: '#f472b6' },
            ].map((petal, idx) => (
              <ellipse
                key={idx}
                cx={petal.cx}
                cy={petal.cy}
                rx={petal.r}
                ry={petal.r * 0.6}
                fill={petal.fill}
                opacity="0.85"
                transform={`rotate(${idx * 35}, ${petal.cx}, ${petal.cy})`}
              />
            ))}
          </svg>

          {/* Vignette Overlay for UI Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050a06]/90 via-[#071209]/75 to-[#050a06]/90" />
        </div>
      )}

      {/* 3. WINTER NIGHT FORTRESS THEME BACKGROUND */}
      {theme === 'winter' && (
        <div className="absolute inset-0 bg-[#050b14]">
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="winterNightSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#040914" />
                <stop offset="40%" stopColor="#09182d" />
                <stop offset="75%" stopColor="#0f2644" />
                <stop offset="100%" stopColor="#06101f" />
              </linearGradient>
              <radialGradient id="torchGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffb74d" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#f57c00" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#b71c1c" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="snowStone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e2c3d" />
                <stop offset="100%" stopColor="#0b131c" />
              </linearGradient>
            </defs>

            {/* Dark Starry Winter Night Sky */}
            <rect width="1080" height="1920" fill="url(#winterNightSky)" />

            {/* Distant Stars */}
            {[
              { x: 120, y: 150, r: 2 }, { x: 320, y: 100, r: 1.5 }, { x: 540, y: 220, r: 2.5 },
              { x: 720, y: 140, r: 1.8 }, { x: 920, y: 260, r: 2 }, { x: 220, y: 380, r: 1.5 },
              { x: 440, y: 460, r: 2.2 }, { x: 810, y: 410, r: 1.6 }, { x: 980, y: 100, r: 2.5 }
            ].map((star, idx) => (
              <circle key={idx} cx={star.x} cy={star.y} r={star.r} fill="#e2e8f0" opacity="0.8" />
            ))}

            {/* Massive Medieval Fortress Ramparts with Snow Caps */}
            {/* Main Central Keep & Towers */}
            <polygon points="440,550 540,380 640,550" fill="#121b27" />
            <rect x="460" y="550" width="160" height="1370" fill="url(#snowStone)" />
            {/* Snow on top of keep */}
            <path d="M 435 550 Q 540 530 645 550" stroke="#e2e8f0" strokeWidth="10" fill="none" strokeLinecap="round" />

            {/* Left Rampart Wall & Battlement */}
            <polygon points="0,680 460,780 460,1920 0,1920" fill="url(#snowStone)" />
            {/* Left Castle Battlements */}
            {[0, 90, 180, 270, 360].map((bx, idx) => (
              <g key={idx}>
                <rect x={bx} y={670 + idx * 18} width="60" height="40" fill="#162230" />
                {/* Snow Cap */}
                <rect x={bx - 4} y={666 + idx * 18} width="68" height="8" rx="4" fill="#f1f5f9" />
              </g>
            ))}

            {/* Right Rampart Wall & Battlement */}
            <polygon points="620,780 1080,680 1080,1920 620,1920" fill="url(#snowStone)" />
            {[660, 750, 840, 930, 1020].map((bx, idx) => (
              <g key={idx}>
                <rect x={bx} y={750 - idx * 14} width="60" height="40" fill="#162230" />
                {/* Snow Cap */}
                <rect x={bx - 4} y={746 - idx * 14} width="68" height="8" rx="4" fill="#f1f5f9" />
              </g>
            ))}

            {/* Flaming Torches on Castle Walls with Fiery Glows */}
            {/* Left Torch */}
            <ellipse cx="220" cy="850" rx="160" ry="160" fill="url(#torchGlow)" />
            <rect x="215" y="850" width="10" height="45" fill="#451a03" />
            <path d="M 210 850 Q 220 810 225 830 Q 230 810 235 850 Z" fill="#ffedd5" />
            <path d="M 213 850 Q 220 820 223 835 Q 227 820 232 850 Z" fill="#fb923c" />

            {/* Center-Right Torch */}
            <ellipse cx="540" cy="720" rx="180" ry="180" fill="url(#torchGlow)" />
            <rect x="535" y="720" width="10" height="45" fill="#451a03" />
            <path d="M 530 720 Q 540 680 545 700 Q 550 680 555 720 Z" fill="#ffedd5" />

            {/* Right Torch */}
            <ellipse cx="860" cy="850" rx="160" ry="160" fill="url(#torchGlow)" />
            <rect x="855" y="850" width="10" height="45" fill="#451a03" />
            <path d="M 850 850 Q 860 810 865 830 Q 870 810 875 850 Z" fill="#ffedd5" />

            {/* Soft Falling Snowflakes */}
            {[
              { cx: 160, cy: 300, r: 3.5 }, { cx: 380, cy: 450, r: 4.5 }, { cx: 620, cy: 280, r: 3 },
              { cx: 840, cy: 420, r: 5 }, { cx: 290, cy: 680, r: 3.5 }, { cx: 480, cy: 920, r: 4 },
              { cx: 720, cy: 1100, r: 4.5 }, { cx: 150, cy: 1250, r: 3.5 }, { cx: 890, cy: 1350, r: 4 },
              { cx: 340, cy: 1550, r: 5 }, { cx: 580, cy: 1680, r: 3.5 }, { cx: 790, cy: 1820, r: 4.5 }
            ].map((flake, idx) => (
              <circle key={idx} cx={flake.cx} cy={flake.cy} r={flake.r} fill="#ffffff" opacity="0.8" />
            ))}
          </svg>

          {/* Vignette Overlay for UI Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#03060c]/90 via-[#050b14]/75 to-[#03060c]/90" />
        </div>
      )}

      {/* 4. SKY CITADEL (CETATEA CERULUI) FANTASY THEME BACKGROUND */}
      {theme === 'sky' && (
        <div className="absolute inset-0 bg-[#0c0818]">
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="skyTwilight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a0933" />
                <stop offset="35%" stopColor="#3b1154" />
                <stop offset="65%" stopColor="#6b1d52" />
                <stop offset="85%" stopColor="#a33d3b" />
                <stop offset="100%" stopColor="#e27c38" />
              </linearGradient>
              <radialGradient id="sunBurst" cx="50%" cy="60%" r="50%">
                <stop offset="0%" stopColor="#ffd54f" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#ff7043" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="floatingIslandRock" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2c1a3b" />
                <stop offset="40%" stopColor="#1b1026" />
                <stop offset="100%" stopColor="#0b0610" />
              </linearGradient>
              <linearGradient id="goldTower" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5c3614" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#7a4b18" />
              </linearGradient>
            </defs>

            {/* Dramatic Twilight Sunset Sky */}
            <rect width="1080" height="1920" fill="url(#skyTwilight)" />
            <rect width="1080" height="1920" fill="url(#sunBurst)" />

            {/* High Floating Cloud Layers */}
            <ellipse cx="240" cy="650" rx="340" ry="120" fill="#4a154b" opacity="0.5" />
            <ellipse cx="880" cy="720" rx="380" ry="140" fill="#5c194e" opacity="0.5" />

            {/* Central Floating Fantasy Sky Island with Golden Spires */}
            {/* Inverted Floating Island Mountain Base */}
            <polygon points="260,1100 820,1100 680,1480 540,1620 400,1450" fill="url(#floatingIslandRock)" />
            
            {/* Hanging Roots & Crystal Veins */}
            <path d="M 460 1350 Q 480 1520 470 1680" stroke="#ffd700" strokeWidth="4" fill="none" opacity="0.6" />
            <path d="M 600 1350 Q 580 1550 590 1720" stroke="#ffd700" strokeWidth="3" fill="none" opacity="0.5" />

            {/* Golden Citadel Castle with Tall Spires */}
            {/* Center Grand Spire */}
            <polygon points="500,750 540,420 580,750" fill="url(#goldTower)" />
            <rect x="510" y="750" width="60" height="350" fill="url(#goldTower)" />

            {/* Left Tower */}
            <polygon points="360,850 395,560 430,850" fill="url(#goldTower)" />
            <rect x="375" y="850" width="40" height="250" fill="#3d2110" />

            {/* Right Tower */}
            <polygon points="650,850 685,560 720,850" fill="url(#goldTower)" />
            <rect x="665" y="850" width="40" height="250" fill="#3d2110" />

            {/* Citadel Palace Walls & Golden Arches */}
            <rect x="360" y="980" width="360" height="120" fill="#2d170a" stroke="#d4af37" strokeWidth="3" />
            <path d="M 480 1100 Q 540 1020 600 1100 Z" fill="#ffd54f" opacity="0.8" />

            {/* Lower Billowing Sunset Cloud Waves */}
            <ellipse cx="180" cy="1650" rx="380" ry="180" fill="#882e43" opacity="0.7" />
            <ellipse cx="540" cy="1720" rx="420" ry="200" fill="#ba4837" opacity="0.7" />
            <ellipse cx="920" cy="1640" rx="360" ry="170" fill="#e27c38" opacity="0.65" />
            <ellipse cx="540" cy="1840" rx="600" ry="220" fill="#4d122f" opacity="0.85" />
          </svg>

          {/* Vignette Overlay for UI Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080410]/90 via-[#0c0818]/75 to-[#080410]/90" />
        </div>
      )}

      {/* 5. BATTLEFIELD AT SUNSET (CÂMPUL DE LUPTĂ) THEME BACKGROUND */}
      {theme === 'battlefield' && (
        <div className="absolute inset-0 bg-[#120505]">
          <svg
            viewBox="0 0 1080 1920"
            className="w-full h-full object-cover opacity-60"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="battleSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1f0707" />
                <stop offset="30%" stopColor="#4a0f0f" />
                <stop offset="60%" stopColor="#7a1c12" />
                <stop offset="85%" stopColor="#c0392b" />
                <stop offset="100%" stopColor="#e67e22" />
              </linearGradient>
              <radialGradient id="sunsetDisc" cx="50%" cy="70%" r="45%">
                <stop offset="0%" stopColor="#f39c12" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#d35400" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="mistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3d1414" stopOpacity="0" />
                <stop offset="50%" stopColor="#5c1d1d" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1a0606" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Dramatic Fiery Red-Orange Sunset Sky */}
            <rect width="1080" height="1920" fill="url(#battleSky)" />
            <rect width="1080" height="1920" fill="url(#sunsetDisc)" />

            {/* Barren Silhouettes of Twisted Dry Trees */}
            {/* Left Barren Tree */}
            <path
              d="M 140 1920 L 160 1450 Q 180 1300 120 1150 Q 80 1050 40 980"
              stroke="#0f0303"
              strokeWidth="28"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 160 1400 Q 240 1280 290 1180" stroke="#0f0303" strokeWidth="16" fill="none" strokeLinecap="round" />
            <path d="M 120 1150 Q 170 1080 210 1020" stroke="#0f0303" strokeWidth="10" fill="none" strokeLinecap="round" />

            {/* Right Barren Tree */}
            <path
              d="M 960 1920 L 930 1480 Q 900 1320 980 1160 Q 1040 1040 1080 960"
              stroke="#0f0303"
              strokeWidth="26"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 930 1420 Q 850 1300 800 1220" stroke="#0f0303" strokeWidth="14" fill="none" strokeLinecap="round" />

            {/* Rugged Battleground Hills & Ridge */}
            <polygon points="0,1500 380,1420 720,1470 1080,1380 1080,1920 0,1920" fill="#140505" />
            <polygon points="0,1650 480,1580 880,1620 1080,1560 1080,1920 0,1920" fill="#0d0303" />

            {/* Tattered Medieval Heraldic Banners Planted in Ground */}
            {/* Banner 1: Left Golden Lion / Red Flag */}
            <line x1="260" y1="1300" x2="310" y2="1680" stroke="#3d2112" strokeWidth="9" />
            {/* Spear Tip */}
            <polygon points="255,1280 265,1280 260,1250" fill="#a0a0a0" />
            {/* Tattered Red Cloth */}
            <path d="M 262 1290 L 390 1340 L 360 1410 L 400 1460 L 275 1420 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="2" />
            <polygon points="300,1340 330,1350 315,1380" fill="#e8c84a" />

            {/* Banner 2: Center-Right Blue Dragon / Torn Standard */}
            <line x1="780" y1="1350" x2="740" y2="1700" stroke="#3d2112" strokeWidth="8" />
            <polygon points="775,1330 785,1330 780,1300" fill="#a0a0a0" />
            <path d="M 778 1340 L 670 1380 L 690 1440 L 640 1490 L 760 1460 Z" fill="#1e3a8a" stroke="#172554" strokeWidth="2" />

            {/* Swords & Shields Stuck in the Earth */}
            {/* Stuck Sword */}
            <line x1="520" y1="1520" x2="550" y2="1640" stroke="#cbd5e1" strokeWidth="7" />
            <line x1="500" y1="1540" x2="545" y2="1525" stroke="#d4af37" strokeWidth="6" />
            {/* Round Shield */}
            <ellipse cx="610" cy="1620" rx="35" ry="25" fill="#78350f" stroke="#e8c84a" strokeWidth="4" />
            <circle cx="610" cy="1620" r="8" fill="#e8c84a" />

            {/* Low Battlefield Fog and Light Mist */}
            <rect x="0" y="1300" width="1080" height="620" fill="url(#mistGrad)" />
            <ellipse cx="540" cy="1550" rx="500" ry="80" fill="#521515" opacity="0.35" />
          </svg>

          {/* Vignette Overlay for UI Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0202]/90 via-[#120505]/75 to-[#0a0202]/90" />
        </div>
      )}
    </div>
  );
};
