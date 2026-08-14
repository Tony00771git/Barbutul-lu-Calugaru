import React from 'react';

export interface MedievalAvatar {
  id: string;
  nameRo: string;
  nameEn: string;
  descRo: string;
  descEn: string;
  bgColor: string;
  borderColor: string;
  emojiFallback: string;
  renderSvg: (className?: string) => React.ReactNode;
}

export const MEDIEVAL_AVATARS: MedievalAvatar[] = [
  {
    id: 'monk_drunk',
    nameRo: 'Călugăr Beat',
    nameEn: 'Drunk Monk',
    descRo: 'Robă maro, cană de bere în mână, obraji roșii',
    descEn: 'Brown robe, beer mug in hand, rosy cheeks',
    bgColor: '#3a2510',
    borderColor: '#e8c84a',
    emojiFallback: '🍺',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background Aura */}
        <circle cx="50" cy="50" r="46" fill="#3a2510" />
        <circle cx="50" cy="50" r="44" stroke="#d4af37" strokeWidth="2" strokeDasharray="4 2" />
        
        {/* Brown Cowl / Robe */}
        <path d="M22 92 C22 68 32 54 40 50 C40 50 26 48 26 36 C26 22 36 12 50 12 C64 12 74 22 74 36 C74 48 60 50 60 50 C68 54 78 68 78 92 Z" fill="#6d4c2b" />
        <path d="M30 92 C34 72 42 62 50 62 C58 62 66 72 70 92 Z" fill="#52391e" />
        
        {/* Monk Tonsure Head & Face */}
        <ellipse cx="50" cy="38" rx="17" ry="19" fill="#f8cfab" />
        {/* Rosy Drunk Cheeks */}
        <ellipse cx="40" cy="42" rx="4.5" ry="3.5" fill="#f87171" opacity="0.85" />
        <ellipse cx="60" cy="42" rx="4.5" ry="3.5" fill="#f87171" opacity="0.85" />
        <ellipse cx="50" cy="37" rx="3.5" ry="2.5" fill="#ef4444" opacity="0.75" />
        
        {/* Tonsure Hair Ring */}
        <path d="M33 34 C31 22 41 18 50 18 C59 18 69 22 67 34 C64 24 58 23 50 23 C42 23 36 24 33 34 Z" fill="#382513" />
        <circle cx="50" cy="22" r="7" fill="#f8cfab" />
        
        {/* Happy Drunk Eyes & Eyebrows */}
        <path d="M39 33 Q43 30 46 33" stroke="#2b1a0d" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 33 Q57 30 61 33" stroke="#2b1a0d" strokeWidth="2" strokeLinecap="round" />
        {/* Goofy Smile */}
        <path d="M42 46 Q50 53 58 45" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round" fill="#b91c1c" />
        <path d="M47 47 Q50 49 53 47" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

        {/* Big Frothy Wooden Beer Mug in Hand */}
        <rect x="63" y="58" width="18" height="24" rx="3" fill="#854d0e" stroke="#eab308" strokeWidth="1.5" />
        <line x1="63" y1="66" x2="81" y2="66" stroke="#ca8a04" strokeWidth="1.5" />
        <line x1="63" y1="74" x2="81" y2="74" stroke="#ca8a04" strokeWidth="1.5" />
        {/* Mug Handle */}
        <path d="M81 63 C86 63 87 75 81 77" stroke="#ca8a04" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* White Beer Foam Overflowing */}
        <ellipse cx="72" cy="58" rx="10" ry="4" fill="#ffffff" />
        <circle cx="66" cy="56" r="3.5" fill="#fef08a" />
        <circle cx="73" cy="54" r="4" fill="#ffffff" />
        <circle cx="78" cy="56" r="3.5" fill="#fef08a" />
        <path d="M68 62 Q69 67 67 70" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'archer',
    nameRo: 'Arcaș din Pădure',
    nameEn: 'Forest Archer',
    descRo: 'Glugă verde-închis, arc pe umăr, privire ageră',
    descEn: 'Dark green hood, bow over shoulder, keen gaze',
    bgColor: '#0f291e',
    borderColor: '#4ade80',
    emojiFallback: '🏹',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#0f291e" />
        <circle cx="50" cy="50" r="44" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
        
        {/* Leather Armor & Green Tunic */}
        <path d="M22 92 C22 70 32 58 40 54 L60 54 C68 58 78 70 78 92 Z" fill="#14532d" />
        <path d="M38 60 L62 60 L56 92 L44 92 Z" fill="#78350f" />

        {/* Wooden Longbow over Shoulder */}
        <path d="M20 90 Q12 50 32 18" stroke="#a16207" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <line x1="20" y1="88" x2="32" y2="20" stroke="#fef08a" strokeWidth="1" />
        <rect x="25" y="44" width="7" height="12" rx="2" fill="#451a03" />

        {/* Deep Green Archer Hood */}
        <path d="M28 42 C28 18 42 10 50 10 C58 10 72 18 72 42 C72 54 62 58 50 62 C38 58 28 54 28 42 Z" fill="#166534" />
        <path d="M36 34 C36 24 44 18 50 18 C56 18 64 24 64 34 C64 44 56 50 50 50 C44 50 36 44 36 34 Z" fill="#14532d" />

        {/* Determined Face inside Hood */}
        <ellipse cx="50" cy="38" rx="12" ry="13" fill="#fcd34d" />
        {/* Keen Eyes */}
        <path d="M43 36 L47 38" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M57 36 L53 38" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hood Shadow & Mouth */}
        <path d="M38 28 Q50 33 62 28" fill="#14532d" />
        <line x1="47" y1="44" x2="53" y2="44" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        
        {/* Feather in Hood */}
        <path d="M66 22 Q76 12 70 8 Q62 14 64 22 Z" fill="#ef4444" />
        <line x1="64" y1="22" x2="72" y2="10" stroke="#fee2e2" strokeWidth="1" />
      </svg>
    ),
  },
  {
    id: 'priestess',
    nameRo: 'Preoteasă Sfântă',
    nameEn: 'Holy Priestess',
    descRo: 'Robă albă-aurie, simbol sfânt la gât, privire senină',
    descEn: 'White-golden robe, holy amulet, serene gaze',
    bgColor: '#2c2514',
    borderColor: '#fbbf24',
    emojiFallback: '🕊️',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#241e12" />
        <circle cx="50" cy="50" r="44" stroke="#fbbf24" strokeWidth="2" />
        
        {/* Golden Halo / Sunburst */}
        <circle cx="50" cy="36" r="24" stroke="#fef08a" strokeWidth="2" strokeDasharray="3 3" />
        
        {/* White & Gold Robes */}
        <path d="M22 92 C22 68 34 56 42 52 L58 52 C66 56 78 68 78 92 Z" fill="#f8fafc" />
        <path d="M40 52 L60 52 L56 92 L44 92 Z" fill="#fef08a" />
        <path d="M48 52 L52 52 L52 92 L48 92 Z" fill="#eab308" />

        {/* White Veil with Gold Trim */}
        <path d="M28 36 C28 18 36 12 50 12 C64 12 72 18 72 36 C72 56 64 66 64 74 L36 74 C36 66 28 56 28 36 Z" fill="#f1f5f9" />
        <path d="M30 24 Q50 18 70 24" stroke="#eab308" strokeWidth="3" fill="none" />

        {/* Serene Face */}
        <ellipse cx="50" cy="38" rx="13" ry="15" fill="#fde68a" />
        {/* Calm closed/gentle eyes */}
        <path d="M42 36 Q46 39 48 36" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 36 Q54 39 58 36" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        {/* Serene gentle smile */}
        <path d="M46 44 Q50 47 54 44" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />

        {/* Holy Cross / Sun Amulet */}
        <circle cx="50" cy="62" r="7" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1.5" />
        <path d="M50 58 L50 66 M46 62 L54 62" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="52" x2="48" y2="57" stroke="#eab308" strokeWidth="1.5" />
        <line x1="58" y1="52" x2="52" y2="57" stroke="#eab308" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'knight',
    nameRo: 'Cavaler de Oțel',
    nameEn: 'Steel Knight',
    descRo: 'Armură gri-oțel, pană roșie mare pe coif',
    descEn: 'Steel-grey armor, big red feather plume on visor',
    bgColor: '#161e2e',
    borderColor: '#94a3b8',
    emojiFallback: '⚔️',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#161e2e" />
        <circle cx="50" cy="50" r="44" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />

        {/* Red Plume Feather on Top */}
        <path d="M50 14 C40 2 28 6 36 20 C40 18 46 16 50 18 C54 16 60 18 64 20 C72 6 60 2 50 14 Z" fill="#ef4444" />
        <path d="M50 16 Q54 6 42 4" stroke="#fee2e2" strokeWidth="1.5" strokeLinecap="round" />

        {/* Steel Pauldrons & Breastplate */}
        <path d="M22 92 C22 66 32 56 42 54 L58 54 C68 56 78 66 78 92 Z" fill="#475569" />
        <path d="M30 68 L70 68 L64 92 L36 92 Z" fill="#334155" />
        <circle cx="50" cy="74" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />

        {/* Steel Helmet */}
        <path d="M32 32 C32 18 40 16 50 16 C60 16 68 18 68 32 C68 44 64 56 50 56 C36 56 32 44 32 32 Z" fill="#64748b" stroke="#cbd5e1" strokeWidth="2" />
        
        {/* Helmet Visor Plate with Slits */}
        <path d="M34 32 L66 32 L62 46 L38 46 Z" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Eye Slits (Glow inside) */}
        <line x1="39" y1="38" x2="47" y2="38" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="53" y1="38" x2="61" y2="38" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        {/* Breath holes */}
        <circle cx="45" cy="42" r="1" fill="#cbd5e1" />
        <circle cx="50" cy="42" r="1" fill="#cbd5e1" />
        <circle cx="55" cy="42" r="1" fill="#cbd5e1" />

        {/* Neck Guard */}
        <path d="M38 52 L62 52 L66 60 L34 60 Z" fill="#475569" />
      </svg>
    ),
  },
  {
    id: 'wizard',
    nameRo: 'Vrăjitor Înțelept',
    nameEn: 'Elder Wizard',
    descRo: 'Robă violet-stelată, toiag magic, barbă albă lungă',
    descEn: 'Starry purple robe, magic staff, long white beard',
    bgColor: '#1e1433',
    borderColor: '#c084fc',
    emojiFallback: '🧙‍♂️',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#1e1433" />
        <circle cx="50" cy="50" r="44" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />

        {/* Magic Staff on Side */}
        <line x1="82" y1="14" x2="72" y2="92" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <circle cx="82" cy="14" r="7" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
        <circle cx="82" cy="14" r="4" fill="#e0f2fe" />

        {/* Starry Purple Robe */}
        <path d="M22 92 C22 68 34 58 42 54 L58 54 C66 58 78 68 78 92 Z" fill="#581c87" />
        {/* Stars on robe */}
        <path d="M32 74 L34 76 L32 78 L30 76 Z" fill="#fef08a" />
        <path d="M64 80 L66 82 L64 84 L62 82 Z" fill="#fef08a" />

        {/* Wizard Face */}
        <ellipse cx="50" cy="38" rx="12" ry="12" fill="#fde68a" />
        {/* Wise Eyes with Eyebrows */}
        <path d="M42 34 L47 36" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <path d="M58 34 L53 36" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <circle cx="45" cy="38" r="1.5" fill="#1e1b4b" />
        <circle cx="55" cy="38" r="1.5" fill="#1e1b4b" />

        {/* Long White Wizard Beard */}
        <path d="M36 44 C36 74 44 88 50 88 C56 88 64 74 64 44 C60 48 56 50 50 50 C44 50 40 48 36 44 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        
        {/* Pointy Wizard Hat with Brim */}
        <ellipse cx="50" cy="28" rx="26" ry="6" fill="#3b0764" stroke="#c084fc" strokeWidth="1.5" />
        <path d="M32 27 L48 4 Q54 6 52 14 L68 27 Z" fill="#6b21a8" />
        <path d="M46 6 Q56 4 54 12" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Hat Band with Golden Buckle */}
        <path d="M34 26 Q50 29 66 26" stroke="#eab308" strokeWidth="3.5" fill="none" />
      </svg>
    ),
  },
  {
    id: 'blacksmith',
    nameRo: 'Fierar Musculos',
    nameEn: 'Iron Blacksmith',
    descRo: 'Șorț de piele, ciocan mare, față arsă de soare',
    descEn: 'Leather apron, giant hammer, sun-baked face',
    bgColor: '#2a1608',
    borderColor: '#f97316',
    emojiFallback: '🔨',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#2a1608" />
        <circle cx="50" cy="50" r="44" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />

        {/* Heavy Blacksmith Hammer in Background */}
        <rect x="22" y="16" width="16" height="10" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
        <line x1="30" y1="26" x2="16" y2="82" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />

        {/* Muscular Shoulders & Leather Apron */}
        <path d="M20 92 C20 64 30 52 40 48 L60 48 C70 52 80 64 80 92 Z" fill="#c2410c" />
        <path d="M34 52 L66 52 L62 92 L38 92 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
        <line x1="38" y1="52" x2="44" y2="48" stroke="#451a03" strokeWidth="3" />
        <line x1="62" y1="52" x2="56" y2="48" stroke="#451a03" strokeWidth="3" />

        {/* Strong Sun-Tanned Face & Bushy Beard */}
        <ellipse cx="50" cy="34" rx="14" ry="14" fill="#ea580c" opacity="0.9" />
        <ellipse cx="50" cy="34" rx="13" ry="13" fill="#f97316" />
        {/* Bushy Hair & Bandana */}
        <path d="M32 26 C32 14 40 12 50 12 C60 12 68 14 68 26 Z" fill="#451a03" />
        <path d="M32 24 Q50 20 68 24" stroke="#ef4444" strokeWidth="3" fill="none" />

        {/* Thick Beard & Mustache */}
        <path d="M36 36 C36 54 44 62 50 62 C56 62 64 54 64 36 C60 40 56 42 50 42 C44 42 40 40 36 36 Z" fill="#451a03" />
        
        {/* Fierce Eyes */}
        <path d="M42 30 L47 32" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M58 30 L53 32" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="45" cy="33" r="1.5" fill="#000" />
        <circle cx="55" cy="33" r="1.5" fill="#000" />
      </svg>
    ),
  },
  {
    id: 'bard',
    nameRo: 'Bard Cântăreț',
    nameEn: 'Minstrel Bard',
    descRo: 'Pălărie cu pană, lăută medievală, zâmbet șmecher',
    descEn: 'Feathered beret, wooden lute, cunning smirk',
    bgColor: '#261b0c',
    borderColor: '#eab308',
    emojiFallback: '🪕',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#261b0c" />
        <circle cx="50" cy="50" r="44" stroke="#eab308" strokeWidth="2" strokeDasharray="4 2" />

        {/* Medieval Lute / Mandolin on Side */}
        <ellipse cx="26" cy="68" rx="12" ry="16" fill="#854d0e" stroke="#ca8a04" strokeWidth="2" />
        <circle cx="26" cy="66" r="4" fill="#1c1917" />
        <line x1="26" y1="52" x2="20" y2="18" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
        <rect x="18" y="16" width="6" height="8" fill="#713f12" />

        {/* Fancy Colorful Doublet */}
        <path d="M24 92 C24 70 34 58 42 54 L58 54 C66 58 76 70 76 92 Z" fill="#991b1b" />
        <path d="M42 54 L50 92 L58 54 Z" fill="#ca8a04" />

        {/* Charming Face */}
        <ellipse cx="52" cy="38" rx="13" ry="14" fill="#fed7aa" />
        {/* Cunning Winking Eyes */}
        <path d="M44 34 Q48 31 50 34" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        {/* Wink eye */}
        <path d="M56 36 L62 36" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
        {/* Smirking smile */}
        <path d="M47 45 Q54 48 60 43" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" />

        {/* Flamboyant Bard Hat with Feather */}
        <path d="M30 26 C30 14 42 12 66 14 C76 16 78 26 68 30 C56 32 38 32 30 26 Z" fill="#047857" />
        <path d="M68 20 Q84 4 72 2 Q60 8 64 22 Z" fill="#e11d48" />
        <line x1="64" y1="22" x2="76" y2="4" stroke="#fff" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'thief',
    nameRo: 'Hoț din Umbră',
    nameEn: 'Shadow Rogue',
    descRo: 'Glugă neagră, eșarfă peste față, privire tăioasă',
    descEn: 'Black hood, face scarf mask, sharp piercing eyes',
    bgColor: '#09090b',
    borderColor: '#71717a',
    emojiFallback: '🗡️',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#09090b" />
        <circle cx="50" cy="50" r="44" stroke="#52525b" strokeWidth="2" strokeDasharray="4 2" />

        {/* Twin Daggers behind */}
        <line x1="18" y1="20" x2="82" y2="84" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="20" x2="18" y2="84" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="18" cy="20" r="3" fill="#eab308" />
        <circle cx="82" cy="20" r="3" fill="#eab308" />

        {/* Dark Cloak & Leather Tunic */}
        <path d="M22 92 C22 68 32 56 40 52 L60 52 C68 56 78 68 78 92 Z" fill="#18181b" />
        <path d="M38 58 L62 58 L58 92 L42 92 Z" fill="#27272a" />

        {/* Black Rogue Hood */}
        <path d="M26 40 C26 14 40 8 50 8 C60 8 74 14 74 40 C74 58 64 64 50 68 C36 64 26 58 26 40 Z" fill="#18181b" stroke="#27272a" strokeWidth="2" />
        <path d="M34 32 C34 20 42 16 50 16 C58 16 66 20 66 32 C66 42 58 48 50 48 C42 48 34 42 34 32 Z" fill="#09090b" />

        {/* Face Scarf Covering Mouth & Nose */}
        <path d="M34 38 Q50 44 66 38 L62 56 Q50 64 38 56 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />

        {/* Piercing Glowing Eyes */}
        <ellipse cx="44" cy="33" rx="4" ry="2" fill="#fbbf24" />
        <ellipse cx="56" cy="33" rx="4" ry="2" fill="#fbbf24" />
        <circle cx="44" cy="33" r="1.5" fill="#000" />
        <circle cx="56" cy="33" r="1.5" fill="#000" />
      </svg>
    ),
  },
  {
    id: 'princess',
    nameRo: 'Prințesă Nobilă',
    nameEn: 'Noble Princess',
    descRo: 'Rochie roșu-auriu, coroniță strălucitoare, atitudine mândră',
    descEn: 'Red-golden royal dress, sparkling tiara, proud poise',
    bgColor: '#2b0e14',
    borderColor: '#fb7185',
    emojiFallback: '👑',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#2b0e14" />
        <circle cx="50" cy="50" r="44" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />

        {/* Royal Red & Gold Gown */}
        <path d="M22 92 C22 68 34 54 42 50 L58 50 C66 54 78 68 78 92 Z" fill="#9f1239" />
        <path d="M38 50 L62 50 L58 92 L42 92 Z" fill="#fbbf24" />
        <path d="M46 54 L54 54 L52 92 L48 92 Z" fill="#be123c" />

        {/* Long Flowing Golden / Auburn Hair */}
        <path d="M30 36 C30 18 36 14 50 14 C64 14 70 18 70 36 C70 58 66 70 64 78 L36 78 C34 70 30 58 30 36 Z" fill="#b45309" />

        {/* Beautiful Regal Face */}
        <ellipse cx="50" cy="36" rx="12" ry="14" fill="#fde68a" />
        
        {/* Elegant Eyes & Proud Eyebrows */}
        <path d="M42 33 Q46 31 48 34" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 33 Q54 31 52 34" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        <circle cx="45" cy="35" r="1.5" fill="#1e3a8a" />
        <circle cx="55" cy="35" r="1.5" fill="#1e3a8a" />
        {/* Rosy Blush */}
        <circle cx="41" cy="40" r="2.5" fill="#fda4af" />
        <circle cx="59" cy="40" r="2.5" fill="#fda4af" />
        {/* Proud Red Lips */}
        <path d="M46 44 Q50 46 54 44" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />

        {/* Gold Tiara / Crown with Ruby Jewels */}
        <path d="M38 20 L42 12 L50 17 L58 12 L62 20 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <circle cx="50" cy="15" r="2" fill="#ef4444" />
        <circle cx="42" cy="15" r="1.5" fill="#3b82f6" />
        <circle cx="58" cy="15" r="1.5" fill="#3b82f6" />
      </svg>
    ),
  },
  {
    id: 'executioner',
    nameRo: 'Călău Caraghios',
    nameEn: 'Giggle Executioner',
    descRo: 'Glugă neagră, secure uriașă, caricatural și glumeț',
    descEn: 'Black hood, oversized giant axe, goofy comic vibe',
    bgColor: '#181212',
    borderColor: '#ef4444',
    emojiFallback: '🪓',
    renderSvg: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#181212" />
        <circle cx="50" cy="50" r="44" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />

        {/* Giant Comic Battle Axe in Background */}
        <line x1="78" y1="12" x2="68" y2="92" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M78 12 C88 8 92 24 82 32 C78 28 76 22 78 12 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
        <path d="M76 14 C68 10 66 24 74 30 Z" fill="#64748b" />

        {/* Chunky executioner body in dark leather */}
        <path d="M22 92 C22 66 32 54 40 50 L60 50 C68 54 78 66 78 92 Z" fill="#27272a" />
        <rect x="36" y="56" width="28" height="36" fill="#18181b" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx="50" cy="74" r="4" fill="#eab308" />

        {/* Black Executioner Hood covering entire head */}
        <path d="M30 38 C30 16 38 12 50 12 C62 12 70 16 70 38 C70 54 62 62 50 62 C38 62 30 54 30 38 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />

        {/* Two Cutout Eye Holes (Goofy / Funny Cartoon Expression) */}
        <ellipse cx="43" cy="34" rx="5" ry="5.5" fill="#fef08a" />
        <ellipse cx="57" cy="34" rx="5" ry="5.5" fill="#fef08a" />
        <circle cx="43" cy="34" r="2.5" fill="#000" />
        <circle cx="57" cy="34" r="2.5" fill="#000" />
        
        {/* Goofy smirking mouth cutout */}
        <path d="M44 48 Q50 54 56 48" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const getAvatarById = (idOrEmoji?: string): MedievalAvatar => {
  if (!idOrEmoji) return MEDIEVAL_AVATARS[0];
  const found = MEDIEVAL_AVATARS.find(a => a.id === idOrEmoji);
  if (found) return found;
  
  // Try matching emoji
  const byEmoji = MEDIEVAL_AVATARS.find(a => a.emojiFallback === idOrEmoji);
  if (byEmoji) return byEmoji;

  return MEDIEVAL_AVATARS[0];
};
