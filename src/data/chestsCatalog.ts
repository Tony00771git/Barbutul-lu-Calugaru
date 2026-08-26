import { CosmeticRarity, CosmeticRarityMeta, CosmeticItem, ChestDef } from '../types';

export const RARITY_DEFINITIONS: Record<CosmeticRarity, CosmeticRarityMeta> = {
  milspec: {
    rarity: 'milspec',
    nameRo: 'Calitate Militară',
    nameEn: 'Mil-Spec Grade',
    color: '#4b69ff',
    borderClass: 'border-[#4b69ff]',
    bgClass: 'bg-[#4b69ff]/15',
    textClass: 'text-[#4b69ff]',
    glowClass: 'shadow-[0_0_15px_rgba(75,105,255,0.45)]',
    dropChance: 45, // 45%
  },
  restricted: {
    rarity: 'restricted',
    nameRo: 'Interzis',
    nameEn: 'Restricted',
    color: '#8847ff',
    borderClass: 'border-[#8847ff]',
    bgClass: 'bg-[#8847ff]/15',
    textClass: 'text-[#8847ff]',
    glowClass: 'shadow-[0_0_18px_rgba(136,71,255,0.5)]',
    dropChance: 28, // 28%
  },
  classified: {
    rarity: 'classified',
    nameRo: 'Clasificat',
    nameEn: 'Classified',
    color: '#d32ce6',
    borderClass: 'border-[#d32ce6]',
    bgClass: 'bg-[#d32ce6]/15',
    textClass: 'text-[#d32ce6]',
    glowClass: 'shadow-[0_0_22px_rgba(211,44,230,0.55)]',
    dropChance: 16, // 16%
  },
  covert: {
    rarity: 'covert',
    nameRo: 'Secret',
    nameEn: 'Covert',
    color: '#eb4b4b',
    borderClass: 'border-[#eb4b4b]',
    bgClass: 'bg-[#eb4b4b]/20',
    textClass: 'text-[#eb4b4b]',
    glowClass: 'shadow-[0_0_28px_rgba(235,75,75,0.7)]',
    dropChance: 8, // 8%
  },
  rareSpecial: {
    rarity: 'rareSpecial',
    nameRo: '★ Obiect Special Rar ★',
    nameEn: '★ Rare Special Item ★',
    color: '#ffd700',
    borderClass: 'border-[#ffd700]',
    bgClass: 'bg-[#ffd700]/25',
    textClass: 'text-[#ffd700]',
    glowClass: 'shadow-[0_0_35px_rgba(255,215,0,0.85)]',
    dropChance: 3, // 3%
  },
};

// =========================================================================
// COSMETIC ITEMS POOL
// =========================================================================
export const ALL_CHEST_COSMETICS: CosmeticItem[] = [
  // -------------------------------------------------------------
  // 1. MIL-SPEC GRADE (45% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_cardback_rustic_wood',
    type: 'cardBack',
    rarity: 'milspec',
    name: 'Spate Cărți: Lemn Rustic',
    nameEn: 'Card Back: Rustic Oak',
    descRo: 'Model clasic din lemn de stejar băițuit din butoaiele tavernei.',
    descEn: 'Classic rustic oak pattern stained with tavern ale barrels.',
    icon: '🪵',
    exclusiveToChest: true,
    cardBackKey: 'cardback_rustic_wood',
    previewGradient: 'from-[#4a2e18] to-[#26150b]',
  },
  {
    id: 'cosmetic_avatar_tavern_scout',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Cercetașul Tavernei',
    nameEn: 'Avatar: Tavern Scout',
    descRo: 'Vânător vigilent cu hanorac verde și privire ageră.',
    descEn: 'Vigilant woodsman in green tunic with a sharp gaze.',
    icon: '🏹',
    exclusiveToChest: true,
    avatarKey: 'tavern_scout',
  },
  {
    id: 'cosmetic_dice_copper_patina',
    type: 'diceSkin',
    rarity: 'milspec',
    name: 'Zaruri din Cupru Patinat',
    nameEn: 'Weathered Copper Dice',
    descRo: 'Monede vechi topite și turnate în zaruri cu reflexii verzui.',
    descEn: 'Ancient melted pennies forged into green-patina dice.',
    icon: '🪙',
    exclusiveToChest: true,
    diceSkinKey: 'copper',
    previewGradient: 'from-[#b87333] via-[#567d6c] to-[#2a4d3e]',
  },
  {
    id: 'cosmetic_avatar_monk_novice',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Novicele Mănăstirii',
    nameEn: 'Avatar: Monastery Novice',
    descRo: 'Ucenic călugăr zelos la primele sale căni de vin.',
    descEn: 'Eager novice monk having his first taste of sacred wine.',
    icon: '📜',
    exclusiveToChest: true,
    avatarKey: 'monk_novice',
  },
  {
    id: 'cosmetic_cardback_iron_grille',
    type: 'cardBack',
    rarity: 'milspec',
    name: 'Spate Cărți: Grilaj de Fier',
    nameEn: 'Card Back: Iron Grille',
    descRo: 'Pavele de fier forjat din temnița mănăstirească.',
    descEn: 'Heavy wrought iron dungeon lattice.',
    icon: '⛓️',
    exclusiveToChest: true,
    cardBackKey: 'cardback_iron_grille',
    previewGradient: 'from-[#3a3d40] to-[#1c1d1f]',
  },
  {
    id: 'cosmetic_dice_granite_stone',
    type: 'diceSkin',
    rarity: 'milspec',
    name: 'Zaruri din Granit Monahal',
    nameEn: 'Granite Stone Dice',
    descRo: 'Piatră masivă cioplită manual de călugării zidari.',
    descEn: 'Solid mountain stone hand-chiseled by mason monks.',
    icon: '🪨',
    exclusiveToChest: true,
    diceSkinKey: 'granite',
    previewGradient: 'from-[#71717a] to-[#27272a]',
  },

  // -------------------------------------------------------------
  // 2. RESTRICTED (28% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_dice_amethyst_runic',
    type: 'diceSkin',
    rarity: 'restricted',
    name: 'Zaruri de Ametist Runic',
    nameEn: 'Runic Amethyst Dice',
    descRo: 'Cristale violet misterioase ce strălucesc discret la aruncare.',
    descEn: 'Mysterious purple crystal dice glowing with subtle runic light.',
    icon: '🔮',
    exclusiveToChest: true,
    diceSkinKey: 'amethyst',
    previewGradient: 'from-[#a855f7] via-[#7e22ce] to-[#3b0764]',
  },
  {
    id: 'cosmetic_theme_herbal_alchemy',
    type: 'theme',
    rarity: 'restricted',
    name: 'Tema: Laboratorul de Alchimie',
    nameEn: 'Theme: Alchemy Laboratory',
    descRo: 'Retorte de sticlă verde, ierburi sacre și esențe efervescente.',
    descEn: 'Bubbling green vials, mystical herbs & distillation alembics.',
    icon: '🧪',
    exclusiveToChest: true,
    themeKey: 'alchemy',
    previewGradient: 'from-[#143422] via-[#0b1f14] to-[#040a06]',
  },
  {
    id: 'cosmetic_avatar_templar_inquisitor',
    type: 'avatar',
    rarity: 'restricted',
    name: 'Avatar: Inchizitorul Templier',
    nameEn: 'Avatar: Templar Inquisitor',
    descRo: 'Armură argintie cu cruce violetă și privire de oțel.',
    descEn: 'Silver mail with purple cross and steely disciplinary stare.',
    icon: '⚔️',
    exclusiveToChest: true,
    avatarKey: 'templar_inquisitor',
  },
  {
    id: 'cosmetic_cardback_mystic_runes',
    type: 'cardBack',
    rarity: 'restricted',
    name: 'Spate Cărți: Rune Mistice',
    nameEn: 'Card Back: Arcane Runes',
    descRo: 'Sigilii violete strălucitoare care protejează mâna jucătorului.',
    descEn: 'Glowing violet ward seals protecting your secret poker hand.',
    icon: '✨',
    exclusiveToChest: true,
    cardBackKey: 'cardback_mystic_runes',
    previewGradient: 'from-[#581c87] to-[#1e1b4b]',
  },
  {
    id: 'cosmetic_dice_emerald_jade',
    type: 'diceSkin',
    rarity: 'restricted',
    name: 'Zaruri din Jad Smarald',
    nameEn: 'Emerald Jade Dice',
    descRo: 'Lustruite în ape termale, simbol al norocului divin la barbut.',
    descEn: 'Polished in mountain spring waters, totem of celestial luck.',
    icon: '💚',
    exclusiveToChest: true,
    diceSkinKey: 'emerald_jade',
    previewGradient: 'from-[#10b981] via-[#059669] to-[#064e3b]',
  },

  // -------------------------------------------------------------
  // 3. CLASSIFIED (16% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_cardback_crimson_damask',
    type: 'cardBack',
    rarity: 'classified',
    name: 'Spate Cărți: Damasc Sângeriu',
    nameEn: 'Card Back: Crimson Damask',
    descRo: 'Mătase imperială de Damasc brodată cu fire purpurii și aurii.',
    descEn: 'Royal damask silk embroidered with crimson and gold filigree.',
    icon: '🎴',
    exclusiveToChest: true,
    cardBackKey: 'cardback_crimson_damask',
    previewGradient: 'from-[#9f1239] via-[#be123c] to-[#4c0519]',
  },
  {
    id: 'cosmetic_theme_infernal_vault',
    type: 'theme',
    rarity: 'classified',
    name: 'Tema: Bolta Infernală a Păcatelor',
    nameEn: 'Theme: Infernal Sins Vault',
    descRo: 'Candelabre roșii aprinse, flăcări mistice și butoaie vulcanice.',
    descEn: 'Blazing crimson chandeliers, embers & brimstone oak casks.',
    icon: '🔥',
    exclusiveToChest: true,
    themeKey: 'infernal',
    previewGradient: 'from-[#3b0a0a] via-[#220505] to-[#0d0202]',
  },
  {
    id: 'cosmetic_dice_spectral_plasma',
    type: 'diceSkin',
    rarity: 'classified',
    name: 'Zaruri de Plasmă Spectrală',
    nameEn: 'Spectral Plasma Dice',
    descRo: 'Emană scântei magenta și roz neon la fiecare ciocnire pe masă.',
    descEn: 'Emits glowing magenta plasma embers and neon shockwaves on impact.',
    icon: '💖',
    exclusiveToChest: true,
    diceSkinKey: 'plasma_pink',
    previewGradient: 'from-[#ec4899] via-[#d946ef] to-[#701a75]',
  },
  {
    id: 'cosmetic_avatar_archmage_astral',
    type: 'avatar',
    rarity: 'classified',
    name: 'Avatar: Arhimagul Astral',
    nameEn: 'Avatar: Astral Archmage',
    descRo: 'Stăpân al magiei cosmice învăluit în pelerină roz fosforescentă.',
    descEn: 'Master of celestial mysteries draped in glowing arcane robes.',
    icon: '🧙‍♂️',
    exclusiveToChest: true,
    avatarKey: 'archmage_astral',
  },

  // -------------------------------------------------------------
  // 4. COVERT (8% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_dice_bloodfire_dragon',
    type: 'diceSkin',
    rarity: 'covert',
    name: 'Zaruri „Focul Dragonului de Sânge”',
    nameEn: 'Bloodfire Dragon Dice',
    descRo: 'Turnate în inima vulcanului, emană căldură și flăcări sângerii la duble.',
    descEn: 'Forged in magma depths, erupts with fiery crimson flares on doubles.',
    icon: '🐉',
    exclusiveToChest: true,
    diceSkinKey: 'bloodfire',
    previewGradient: 'from-[#dc2626] via-[#991b1b] to-[#450a0a]',
  },
  {
    id: 'cosmetic_cardback_dragon_scale',
    type: 'cardBack',
    rarity: 'covert',
    name: 'Spate Cărți: Solzi de Dragon Roșu',
    nameEn: 'Card Back: Red Dragon Scales',
    descRo: 'Solzi veritabili de dragon legendar cu strălucire rubinie incandescentă.',
    descEn: 'Genuine ancient dragon scales with incandescent ruby reflections.',
    icon: '🛡️',
    exclusiveToChest: true,
    cardBackKey: 'cardback_dragon_scale',
    previewGradient: 'from-[#b91c1c] via-[#7f1d1d] to-[#1c0404]',
  },
  {
    id: 'cosmetic_theme_dragon_hoard',
    type: 'theme',
    rarity: 'covert',
    name: 'Tema: Bârlogul Dragonului de Aur',
    nameEn: 'Theme: Dragon Gold Hoard',
    descRo: 'Mormane de monede aurii, cranii de rubin și suflare de foc.',
    descEn: 'Vast glittering hoard of monastic treasure and embers.',
    icon: '🌋',
    exclusiveToChest: true,
    themeKey: 'dragon_hoard',
    previewGradient: 'from-[#451a03] via-[#290d02] to-[#120401]',
  },
  {
    id: 'cosmetic_avatar_dragon_rider_abbot',
    type: 'avatar',
    rarity: 'covert',
    name: 'Avatar: Starețul Călăreț de Dragoni',
    nameEn: 'Avatar: Dragon-Rider Abbot',
    descRo: 'Mitropolitul legendar călare pe dragonul roșu cu potir de vin în mână.',
    descEn: 'Legendary primate wielding the crimson wyrm with a sacred chalice.',
    icon: '👑',
    exclusiveToChest: true,
    avatarKey: 'dragon_abbot',
  },

  // -------------------------------------------------------------
  // 5. ★ RARE SPECIAL ITEM ★ (3% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_special_emerald_dragon_dagger',
    type: 'diceSkin',
    rarity: 'rareSpecial',
    name: '★ Zaruri din Aur Imperial & Smarald ★',
    nameEn: '★ Imperial Gold & Emerald Dragon Dice ★',
    descRo: 'Obiect mitic legendar cu inserții de aur pur de 24k și raze divine.',
    descEn: 'Mythic treasure forged in 24k solid gold with radiant angelic auras.',
    icon: '⭐',
    exclusiveToChest: true,
    diceSkinKey: 'imperial_gold',
    previewGradient: 'from-[#ffd700] via-[#f59e0b] to-[#78350f]',
  },
  {
    id: 'cosmetic_special_cardback_golden_sovereign',
    type: 'cardBack',
    rarity: 'rareSpecial',
    name: '★ Spate Cărți: Regele Dragon de Aur ★',
    nameEn: '★ Card Back: Sovereign Golden Dragon ★',
    descRo: 'Plăcuțe de aur masiv bătute manual cu blazonul suveran al băuturii.',
    descEn: 'Solid gold relief plates stamped with the royal drinking crest.',
    icon: '🌟',
    exclusiveToChest: true,
    cardBackKey: 'cardback_golden_sovereign',
    previewGradient: 'from-[#fef08a] via-[#eab308] to-[#713f12]',
  },
  {
    id: 'cosmetic_special_theme_celestial_abbey',
    type: 'theme',
    rarity: 'rareSpecial',
    name: '★ Tema: Catedrala Celestă a Berii ★',
    nameEn: '★ Theme: Celestial Beer Cathedral ★',
    descRo: 'Bolți aurite paradisiace, vitralii luminoase și fântâni de bere eternă.',
    descEn: 'Heavenly golden vaults, luminous stained glass & rivers of holy brew.',
    icon: '✨',
    exclusiveToChest: true,
    themeKey: 'celestial',
    previewGradient: 'from-[#382606] via-[#1f1503] to-[#0c0801]',
  },
  {
    id: 'cosmetic_special_avatar_immortal_archimandrite',
    type: 'avatar',
    rarity: 'rareSpecial',
    name: '★ Avatar: Arhimandritul Nemuritor ★',
    nameEn: '★ Avatar: Immortal Archimandrite ★',
    descRo: 'Coroană de aur, aureolă strălucitoare și cel mai mare butoi divin.',
    descEn: 'Blinding halo of pure gold, heavenly crown and divine chalice.',
    icon: '🏆',
    exclusiveToChest: true,
    avatarKey: 'immortal_archimandrite',
  },
];

// =========================================================================
// CHESTS CATALOG
// =========================================================================
export const CHESTS_CATALOG: ChestDef[] = [
  {
    id: 'chest_monastery',
    key: 'monastery_case',
    nameRo: 'Cufărul Mănăstirii',
    nameEn: 'Monastery Case',
    descRo: 'Cufăr tradițional din stejar și fier forjat, cu relicve sacre și zaruri medievale.',
    descEn: 'Traditional oak and iron chest with holy relics and tavern cosmetics.',
    cost: 50, // 50 Drunken Coins
    icon: '📦',
    color: '#ffd700',
    bannerGradient: 'from-amber-950 via-[#361f0b] to-[#1a0f05]',
    items: ALL_CHEST_COSMETICS,
  },
  {
    id: 'chest_dragon_hoard',
    key: 'dragon_case',
    nameRo: 'Cufărul Dragonului de Aur',
    nameEn: 'Golden Dragon Case',
    descRo: 'Comoară ascunsă în peștera dragonului, cu șanse sporite la skinuri de foc și aur.',
    descEn: 'Treasure from the dragon hoard with blazing fiery and golden skins.',
    cost: 75, // 75 Drunken Coins
    icon: '🐉',
    color: '#eb4b4b',
    bannerGradient: 'from-red-950 via-[#3d0d0d] to-[#1a0505]',
    items: ALL_CHEST_COSMETICS.filter(
      (item) => item.rarity !== 'milspec' || item.id.includes('wood') || item.id.includes('scout')
    ),
  },
  {
    id: 'chest_night_crypt',
    key: 'night_case',
    nameRo: 'Cufărul Criptei Eterne',
    nameEn: 'Eternal Crypt Case',
    descRo: 'Păstrat în străfundul criptei, învăluit în mistere și pietre prețioase de ametist.',
    descEn: 'Sealed in the depths of the crypt, imbued with arcane and spectral energy.',
    cost: 45, // 45 Drunken Coins
    icon: '🔮',
    color: '#8847ff',
    bannerGradient: 'from-purple-950 via-[#270e3d] to-[#11051c]',
    items: ALL_CHEST_COSMETICS,
  },
];

// Helper: Pick a random cosmetic item from chest based on exact CS percentages
export function rollChestItem(chest: ChestDef): { winningItem: CosmeticItem; rolledRarity: CosmeticRarity; rolledOdds: number } {
  const items = chest.items && chest.items.length > 0 ? chest.items : ALL_CHEST_COSMETICS;
  
  // Percentages:
  // Mil-Spec: 45% (0 to 45)
  // Restricted: 28% (45 to 73)
  // Classified: 16% (73 to 89)
  // Covert: 8% (89 to 97)
  // Rare Special: 3% (97 to 100)
  const roll = Math.random() * 100;
  let targetRarity: CosmeticRarity = 'milspec';
  let odds = 0.45;

  if (roll < 45) {
    targetRarity = 'milspec';
    odds = 0.45;
  } else if (roll < 73) {
    targetRarity = 'restricted';
    odds = 0.28;
  } else if (roll < 89) {
    targetRarity = 'classified';
    odds = 0.16;
  } else if (roll < 97) {
    targetRarity = 'covert';
    odds = 0.08;
  } else {
    targetRarity = 'rareSpecial';
    odds = 0.03;
  }

  // Filter available items in this chest of that rarity
  let candidates = items.filter((i) => i.rarity === targetRarity);
  if (candidates.length === 0) {
    candidates = ALL_CHEST_COSMETICS.filter((i) => i.rarity === targetRarity);
  }
  if (candidates.length === 0) {
    candidates = items;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    winningItem: chosen,
    rolledRarity: targetRarity,
    rolledOdds: odds,
  };
}

// Generate the full horizontal tape of 70 items with realistic distribution & near-miss suspense
export function generateCaseTape(
  chest: ChestDef,
  winningItem: CosmeticItem,
  targetIndex = 58,
  totalItems = 75
): CosmeticItem[] {
  const pool = chest.items && chest.items.length > 0 ? chest.items : ALL_CHEST_COSMETICS;
  const tape: CosmeticItem[] = [];

  const covertItems = pool.filter((i) => i.rarity === 'covert' || i.rarity === 'rareSpecial');
  const classifiedItems = pool.filter((i) => i.rarity === 'classified');
  const restrictedItems = pool.filter((i) => i.rarity === 'restricted');
  const milspecItems = pool.filter((i) => i.rarity === 'milspec');

  const getRandomFrom = (list: CosmeticItem[]) => {
    if (!list || list.length === 0) return pool[Math.floor(Math.random() * pool.length)];
    return list[Math.floor(Math.random() * list.length)];
  };

  for (let i = 0; i < totalItems; i++) {
    if (i === targetIndex) {
      tape.push(winningItem);
      continue;
    }

    // Near miss tension!
    // If we didn't win a covert or rareSpecial, intentionally place a Covert or Rare Special
    // immediately right before or after the winning slot (classic CS case opening near-miss thrill)
    if (
      (i === targetIndex - 1 || i === targetIndex + 1) &&
      winningItem.rarity !== 'covert' &&
      winningItem.rarity !== 'rareSpecial' &&
      covertItems.length > 0
    ) {
      tape.push(getRandomFrom(covertItems));
      continue;
    }

    // Realistic item tape distribution (lots of milspec & restricted, occasional classified/covert tease)
    const r = Math.random() * 100;
    if (r < 50 && milspecItems.length > 0) {
      tape.push(getRandomFrom(milspecItems));
    } else if (r < 80 && restrictedItems.length > 0) {
      tape.push(getRandomFrom(restrictedItems));
    } else if (r < 94 && classifiedItems.length > 0) {
      tape.push(getRandomFrom(classifiedItems));
    } else if (covertItems.length > 0) {
      tape.push(getRandomFrom(covertItems));
    } else {
      tape.push(getRandomFrom(pool));
    }
  }

  return tape;
}
