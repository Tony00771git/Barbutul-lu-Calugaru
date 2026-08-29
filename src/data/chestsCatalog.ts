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
// AUTHENTIC IN-GAME COSMETIC ITEMS POOL (Strictly Profile & In-Game Equippable)
// =========================================================================
export const ALL_CHEST_COSMETICS: CosmeticItem[] = [
  // -------------------------------------------------------------
  // 1. MIL-SPEC GRADE (45% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_avatar_monk_novice',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Novicele Mănăstirii',
    nameEn: 'Avatar: Monastery Novice',
    descRo: 'Ucenic călugăr zelos la primele sale căni de vin sfințit.',
    descEn: 'Eager novice monk having his first taste of sacred ale.',
    icon: '📜',
    exclusiveToChest: false,
    avatarKey: 'monk_novice',
  },
  {
    id: 'cosmetic_avatar_tavern_scout',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Cercetașul Tavernei',
    nameEn: 'Avatar: Tavern Scout',
    descRo: 'Vânător vigilent cu tunică de camuflaj și privire ageră.',
    descEn: 'Vigilant woodsman in green tunic with a sharp gaze.',
    icon: '🏹',
    exclusiveToChest: false,
    avatarKey: 'tavern_scout',
  },
  {
    id: 'cosmetic_avatar_drunken_jester',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Bufonul Regal Însetat',
    nameEn: 'Avatar: Thirsty Royal Jester',
    descRo: 'Căciulă cu clopoței de alamă și zâmbet poznaș.',
    descEn: 'Two-pronged jester cap with brass bells and cheeky grin.',
    icon: '🃏',
    exclusiveToChest: false,
    avatarKey: 'drunken_jester',
  },
  {
    id: 'cosmetic_avatar_executioner',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Călău Caraghios',
    nameEn: 'Avatar: Giggle Executioner',
    descRo: 'Glugă neagră, secure uriașă de luptă și atitudine comică la masă.',
    descEn: 'Black cowl, oversized battle axe and comic tavern demeanor.',
    icon: '🪓',
    exclusiveToChest: false,
    avatarKey: 'executioner',
  },
  {
    id: 'cosmetic_avatar_thief',
    type: 'avatar',
    rarity: 'milspec',
    name: 'Avatar: Hoțul de Buzunare',
    nameEn: 'Avatar: Pickpocket Rogue',
    descRo: 'Mască de piele și degete iuți la masa de barbut.',
    descEn: 'Leather mask and nimble fingers at the craps table.',
    icon: '🗡️',
    exclusiveToChest: false,
    avatarKey: 'thief',
  },
  {
    id: 'cosmetic_dice_copper',
    type: 'diceSkin',
    rarity: 'milspec',
    name: 'Zaruri din Cupru Patinat',
    nameEn: 'Weathered Copper Dice',
    descRo: 'Monede vechi topite și turnate în zaruri cu reflexii verzui.',
    descEn: 'Ancient melted pennies forged into green-patina dice.',
    icon: '🪙',
    exclusiveToChest: false,
    diceSkinKey: 'copper',
    previewGradient: 'from-[#b87333] via-[#567d6c] to-[#2a4d3e]',
  },
  {
    id: 'cosmetic_dice_granite',
    type: 'diceSkin',
    rarity: 'milspec',
    name: 'Zaruri din Granit Monahal',
    nameEn: 'Granite Stone Dice',
    descRo: 'Piatră masivă cioplită manual de călugării zidari.',
    descEn: 'Solid mountain stone hand-chiseled by mason monks.',
    icon: '🪨',
    exclusiveToChest: false,
    diceSkinKey: 'granite',
    previewGradient: 'from-[#71717a] to-[#27272a]',
  },
  {
    id: 'cosmetic_dice_wood',
    type: 'diceSkin',
    rarity: 'milspec',
    name: 'Zaruri din Lemn de Stejar',
    nameEn: 'Oak Wood Dice',
    descRo: 'Lemn binecuvântat de butoi de bere artizanală.',
    descEn: 'Blessed barrel wood imbued with craft ale aroma.',
    icon: '🪵',
    exclusiveToChest: false,
    diceSkinKey: 'wood',
    previewGradient: 'from-[#854d0e] to-[#451a03]',
  },
  {
    id: 'cosmetic_dice_bone',
    type: 'diceSkin',
    rarity: 'milspec',
    name: 'Zaruri din Os Străvechi',
    nameEn: 'Ancient Bone Dice',
    descRo: 'Sculptate manual din relicve străvechi și lustruite.',
    descEn: 'Hand-carved from ancient monastic relics.',
    icon: '🦴',
    exclusiveToChest: false,
    diceSkinKey: 'bone',
    previewGradient: 'from-[#d6d3d1] to-[#78716c]',
  },
  {
    id: 'cosmetic_title_beer_baron',
    type: 'title',
    rarity: 'milspec',
    name: 'Titlu: Baronul Spumei de Butoi 🍺',
    nameEn: 'Title: Baron of the Barrel Foam 🍺',
    descRo: 'Cunoscut pentru setea nepotolită și cinstirea tuturor tovarășilor.',
    descEn: 'Renowned for quenching ungodly thirsts and buying tavern rounds.',
    icon: '🍺',
    exclusiveToChest: false,
    titleKey: 'title_beer_baron',
    titleNameRo: 'Baronul Spumei de Butoi 🍺',
    titleNameEn: 'Baron of the Barrel Foam 🍺',
  },
  {
    id: 'cosmetic_title_archduke',
    type: 'title',
    rarity: 'milspec',
    name: 'Titlu: Arhiducele Berii Artizanale 👑',
    nameEn: 'Title: Archduke of Craft Ale 👑',
    descRo: 'Titlu nobiliar cu insignă aurită pe profilul tău.',
    descEn: 'Noble monastic title badge on your player profile.',
    icon: '👑',
    exclusiveToChest: false,
    titleKey: 'title_archduke',
    titleNameRo: 'Arhiducele Berii Artizanale 👑',
    titleNameEn: 'Archduke of Craft Ale 👑',
  },
  {
    id: 'cosmetic_emote_cheers',
    type: 'emote',
    rarity: 'milspec',
    name: 'Reacție: „Noroc bun!” 🍻',
    nameEn: 'Emote: “Cheers & Good Luck!” 🍻',
    descRo: 'Ciocnește halbele cu toată taverna și sună din fanfară.',
    descEn: 'Clink frosty mugs with the whole tavern.',
    icon: '🍻',
    exclusiveToChest: false,
    emoteKey: 'emote_cheers',
  },
  {
    id: 'cosmetic_emote_roll_heavy',
    type: 'emote',
    rarity: 'milspec',
    name: 'Reacție: „Ai aruncat cu sete!” 🎲',
    nameEn: 'Emote: “Rolled with Power!” 🎲',
    descRo: 'Izbește masa cu zaruri grele și ecou de pivniță.',
    descEn: 'Strike the tavern table with heavy resonant dice.',
    icon: '🎲',
    exclusiveToChest: false,
    emoteKey: 'emote_roll_heavy',
  },

  // -------------------------------------------------------------
  // 2. RESTRICTED (28% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_avatar_princess',
    type: 'avatar',
    rarity: 'restricted',
    name: 'Avatar: Prințesă Nobilă',
    nameEn: 'Avatar: Noble Princess',
    descRo: 'Rochie roșu-auriu, coroniță strălucitoare cu rubine și atitudine mândră.',
    descEn: 'Red-golden royal dress, sparkling ruby tiara and proud poise.',
    icon: '👑',
    exclusiveToChest: false,
    avatarKey: 'princess',
  },
  {
    id: 'cosmetic_avatar_valkyrie',
    type: 'avatar',
    rarity: 'restricted',
    name: 'Avatar: Războinica Valkyrie',
    nameEn: 'Avatar: Valkyrie Shieldmaiden',
    descRo: 'Coif cu aripi de argint, plete blonde și privire de gheață.',
    descEn: 'Silver winged helm, golden braids and fierce glacial gaze.',
    icon: '🛡️',
    exclusiveToChest: false,
    avatarKey: 'valkyrie_shieldmaiden',
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
    exclusiveToChest: false,
    avatarKey: 'templar_inquisitor',
  },
  {
    id: 'cosmetic_avatar_alchemist_plague',
    type: 'avatar',
    rarity: 'restricted',
    name: 'Avatar: Alchimistul Ciumei & Elixirului',
    nameEn: 'Avatar: Plague & Ale Alchemist',
    descRo: 'Mască de piele cu cioc, ochelari de alamă și fiolă verde.',
    descEn: 'Leather beaked doctor mask with brass goggles and potion vial.',
    icon: '🧪',
    exclusiveToChest: false,
    avatarKey: 'alchemist_plague',
  },
  {
    id: 'cosmetic_avatar_bard',
    type: 'avatar',
    rarity: 'restricted',
    name: 'Avatar: Menestrelul Vesel',
    nameEn: 'Avatar: Cheerful Bard',
    descRo: 'Pălărie cu pană de fazan, lăută acordată și voie bună.',
    descEn: 'Feathered cap, tuned lute and festive tavern melodies.',
    icon: '🪕',
    exclusiveToChest: false,
    avatarKey: 'bard',
  },
  {
    id: 'cosmetic_avatar_blacksmith',
    type: 'avatar',
    rarity: 'restricted',
    name: 'Avatar: Fierarul Mănăstirii',
    nameEn: 'Avatar: Monastery Blacksmith',
    descRo: 'Șorț de piele bătut la nicovală și mușchi de fier.',
    descEn: 'Leather apron forged at the anvil with steely grit.',
    icon: '🔨',
    exclusiveToChest: false,
    avatarKey: 'blacksmith',
  },
  {
    id: 'cosmetic_dice_amethyst',
    type: 'diceSkin',
    rarity: 'restricted',
    name: 'Zaruri de Ametist Runic',
    nameEn: 'Runic Amethyst Dice',
    descRo: 'Cristale violet misterioase ce strălucesc discret la aruncare.',
    descEn: 'Mysterious purple crystal dice glowing with subtle runic light.',
    icon: '🔮',
    exclusiveToChest: false,
    diceSkinKey: 'amethyst',
    previewGradient: 'from-[#a855f7] via-[#7e22ce] to-[#3b0764]',
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
    exclusiveToChest: false,
    diceSkinKey: 'emerald_jade',
    previewGradient: 'from-[#10b981] via-[#059669] to-[#064e3b]',
  },
  {
    id: 'cosmetic_dice_emerald_hydra',
    type: 'diceSkin',
    rarity: 'restricted',
    name: 'Zaruri Hidra de Smarald',
    nameEn: 'Emerald Hydra Dice',
    descRo: 'Smarald viu cu reflexii toxice verzi și aură fosforescentă.',
    descEn: 'Vibrant emerald with toxic green luminescence and venom glow.',
    icon: '🐍',
    exclusiveToChest: false,
    diceSkinKey: 'emerald_hydra',
    previewGradient: 'from-[#10b981] via-[#059669] to-[#064e3b]',
  },
  {
    id: 'cosmetic_dice_ruby',
    type: 'diceSkin',
    rarity: 'restricted',
    name: 'Zaruri de Rubin Sângeriu',
    nameEn: 'Crimson Ruby Dice',
    descRo: 'Cristal roșu radiant cu scântei la fiecare aruncare.',
    descEn: 'Radiant deep red crystal emitting fiery embers on roll.',
    icon: '💎',
    exclusiveToChest: false,
    diceSkinKey: 'ruby',
    previewGradient: 'from-[#ef4444] via-[#b91c1c] to-[#7f1d1d]',
  },
  {
    id: 'cosmetic_dice_ice',
    type: 'diceSkin',
    rarity: 'restricted',
    name: 'Zaruri de Gheață Eternă',
    nameEn: 'Frozen Ice Dice',
    descRo: 'Aură rece de ger alpin și reflexii cristaline de gheață.',
    descEn: 'Glacial frost aura with crystalline chill trail.',
    icon: '❄️',
    exclusiveToChest: false,
    diceSkinKey: 'ice',
    previewGradient: 'from-[#38bdf8] via-[#0284c7] to-[#0c4a6e]',
  },
  {
    id: 'cosmetic_theme_enchanted_forest',
    type: 'theme',
    rarity: 'restricted',
    name: 'Tema: Pădurea Vrăjită a Spiridușilor',
    nameEn: 'Theme: Enchanted Sprite Forest',
    descRo: 'Pădure de smarald cu monoliti runici strălucitori și licurici magici.',
    descEn: 'Emerald canopy with glowing runic stones and mystical fireflies.',
    icon: '🌲',
    exclusiveToChest: false,
    themeKey: 'enchanted_forest',
    previewGradient: 'from-[#03140c] via-[#062416] to-[#010a06]',
  },
  {
    id: 'cosmetic_theme_crypt',
    type: 'theme',
    rarity: 'restricted',
    name: 'Tema: Cripta Fantomelor Însetate',
    nameEn: 'Theme: Crypt of Thirsty Ghosts',
    descRo: 'Fum verde mistic, felinare spectrale & spirite vesele.',
    descEn: 'Glowing green ethereal mist & thirsty spectral lanterns.',
    icon: '👻',
    exclusiveToChest: false,
    themeKey: 'crypt',
    previewGradient: 'from-[#061a12] via-[#0d281e] to-[#020d09]',
  },
  {
    id: 'cosmetic_title_shadow_phantom',
    type: 'title',
    rarity: 'restricted',
    name: 'Titlu: Fantoma Nopții & Umbrelor 🗡️',
    nameEn: 'Title: Phantom of the Shadows 🗡️',
    descRo: 'Pășește nevăzut printre mese și lasă doar zaruri câștigătoare în urmă.',
    descEn: 'Moves unseen between tables, leaving only winning dice in his wake.',
    icon: '🗡️',
    exclusiveToChest: false,
    titleKey: 'title_shadow_phantom',
    titleNameRo: 'Fantoma Nopții & Umbrelor 🗡️',
    titleNameEn: 'Phantom of the Shadows 🗡️',
  },
  {
    id: 'cosmetic_title_dice_prophet',
    type: 'title',
    rarity: 'restricted',
    name: 'Titlu: Profetul Zarurilor Sacre 📜✨',
    nameEn: 'Title: Prophet of Sacred Dice 📜✨',
    descRo: 'Prezice dublele de șase înainte ca zarurile să atingă scândura.',
    descEn: 'Foretells the double sixes before dice even strike the wood.',
    icon: '📜',
    exclusiveToChest: false,
    titleKey: 'title_dice_prophet',
    titleNameRo: 'Profetul Zarurilor Sacre 📜✨',
    titleNameEn: 'Prophet of Sacred Dice 📜✨',
  },
  {
    id: 'cosmetic_title_craps_bane',
    type: 'title',
    rarity: 'restricted',
    name: 'Titlu: Spaima Mesei de Craps ⚡',
    nameEn: 'Title: Bane of the Craps Table ⚡',
    descRo: 'Recunoscut în toate hanurile ca maestru suprem al zarurilor.',
    descEn: 'Feared and respected at all tavern high roller tables.',
    icon: '⚡',
    exclusiveToChest: false,
    titleKey: 'title_craps_bane',
    titleNameRo: 'Spaima Mesei de Craps ⚡',
    titleNameEn: 'Bane of the Craps Table ⚡',
  },
  {
    id: 'cosmetic_emote_flow_beer',
    type: 'emote',
    rarity: 'restricted',
    name: 'Reacție: „Să curgă suta!” 🍺',
    nameEn: 'Emote: “Let the Ale Flow!” 🍺',
    descRo: 'Spumă efervescentă de bere proaspăt turnată din butoi.',
    descEn: 'Foaming, bubbly craft ale freshly poured from the wooden tap.',
    icon: '🍺',
    exclusiveToChest: false,
    emoteKey: 'emote_flow_beer',
  },
  {
    id: 'cosmetic_emote_cry_cellar',
    type: 'emote',
    rarity: 'restricted',
    name: 'Reacție: „Plângi în pivniță!” 😭',
    nameEn: 'Emote: “Weep in the Cellar!” 😭',
    descRo: 'Sunet dramatic de vioară jalnică și oftat călugăresc.',
    descEn: 'Dramatic mournful tavern violin and weeping sigh.',
    icon: '😭',
    exclusiveToChest: false,
    emoteKey: 'emote_cry_cellar',
  },

  // -------------------------------------------------------------
  // 3. CLASSIFIED (16% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_avatar_shadow_assassin',
    type: 'avatar',
    rarity: 'classified',
    name: 'Avatar: Asasinul Umbrelor',
    nameEn: 'Avatar: Shadow Assassin',
    descRo: 'Glugă de noapte, ochi violeți și pumnale argintii.',
    descEn: 'Night-silk dark hood, glowing violet phantom eyes and hidden daggers.',
    icon: '🗡️',
    exclusiveToChest: false,
    avatarKey: 'shadow_assassin',
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
    exclusiveToChest: false,
    avatarKey: 'archmage_astral',
  },
  {
    id: 'cosmetic_dice_infernal_ember',
    type: 'diceSkin',
    rarity: 'classified',
    name: 'Zaruri din Foc Infernal',
    nameEn: 'Infernal Ember Dice',
    descRo: 'Crăpături de lavă topită și pips-uri aprinse cu flăcări vii.',
    descEn: 'Molten magma cracks with burning ember pips and heat haze.',
    icon: '🔥',
    exclusiveToChest: false,
    diceSkinKey: 'infernal_ember',
    previewGradient: 'from-[#ea580c] via-[#b91c1c] to-[#450a0a]',
  },
  {
    id: 'cosmetic_dice_plasma_pink',
    type: 'diceSkin',
    rarity: 'classified',
    name: 'Zaruri de Plasmă Spectrală',
    nameEn: 'Spectral Plasma Dice',
    descRo: 'Emană scântei magenta și roz neon la fiecare ciocnire pe masă.',
    descEn: 'Emits glowing magenta plasma embers and neon shockwaves on impact.',
    icon: '💖',
    exclusiveToChest: false,
    diceSkinKey: 'plasma_pink',
    previewGradient: 'from-[#ec4899] via-[#d946ef] to-[#701a75]',
  },
  {
    id: 'cosmetic_dice_obsidian',
    type: 'diceSkin',
    rarity: 'classified',
    name: 'Zaruri de Obsidian & Rune',
    nameEn: 'Obsidian Runic Dice',
    descRo: 'Piatră vulcanică întunecată gravată cu rune magice violete.',
    descEn: 'Dark volcanic stone with glowing purple arcane runes.',
    icon: '🔮',
    exclusiveToChest: false,
    diceSkinKey: 'obsidian',
    previewGradient: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
  },
  {
    id: 'cosmetic_theme_celestial_observatory',
    type: 'theme',
    rarity: 'classified',
    name: 'Tema: Observatorul Astral al Magilor',
    nameEn: 'Theme: Mage Astral Observatory',
    descRo: 'Bolți gotice indigo, inele astrologice de alamă și constelații vii.',
    descEn: 'Indigo Gothic arches, brass astrolabes and shimmering constellations.',
    icon: '🌌',
    exclusiveToChest: false,
    themeKey: 'celestial_observatory',
    previewGradient: 'from-[#090a1a] via-[#0d112b] to-[#04050f]',
  },
  {
    id: 'cosmetic_theme_dragon_lair',
    type: 'theme',
    rarity: 'classified',
    name: 'Tema: Bârlogul Dragonului de Foc',
    nameEn: 'Theme: Fire Dragon’s Lair',
    descRo: 'Lacuri de lavă incandescentă, munți de aur și scântei vulcanice.',
    descEn: 'Incandescent magma caverns, hoards of gold and volcanic embers.',
    icon: '🌋',
    exclusiveToChest: false,
    themeKey: 'dragon_lair',
    previewGradient: 'from-[#1a0705] via-[#2c0c08] to-[#0f0302]',
  },
  {
    id: 'cosmetic_title_alchemist_master',
    type: 'title',
    rarity: 'classified',
    name: 'Titlu: Mare Maestru Alchimist 🧪⚗️',
    nameEn: 'Title: Grand Master Alchemist 🧪⚗️',
    descRo: 'Stăpânește rețetele secrete ale licorilor din butoaie fermecate.',
    descEn: 'Master of secret potion recipes from mystical aged casks.',
    icon: '🧪',
    exclusiveToChest: false,
    titleKey: 'title_alchemist_master',
    titleNameRo: 'Mare Maestru Alchimist 🧪⚗️',
    titleNameEn: 'Grand Master Alchemist 🧪⚗️',
  },
  {
    id: 'cosmetic_title_inquisitor_supreme',
    type: 'title',
    rarity: 'classified',
    name: 'Titlu: Marele Inchizitor al Hanului ⚔️⚖️',
    nameEn: 'Title: Grand Tavern Inquisitor ⚔️⚖️',
    descRo: 'Pedepsește fără milă pe cei ce refuză să bea când pierd la zaruri.',
    descEn: 'Swiftly punishes those who refuse to drink upon rolling defeat.',
    icon: '⚔️',
    exclusiveToChest: false,
    titleKey: 'title_inquisitor_supreme',
    titleNameRo: 'Marele Inchizitor al Hanului ⚔️⚖️',
    titleNameEn: 'Grand Tavern Inquisitor ⚔️⚖️',
  },
  {
    id: 'cosmetic_title_valkyrie_champion',
    type: 'title',
    rarity: 'classified',
    name: 'Titlu: Campionul Valkyriilor 🛡️⚡',
    nameEn: 'Title: Valkyrie Champion 🛡️⚡',
    descRo: 'Binecuvântat de războinicele nordului cu scut de neclintit.',
    descEn: 'Blessed by northern shieldmaidens with an unbreakable shield.',
    icon: '🛡️',
    exclusiveToChest: false,
    titleKey: 'title_valkyrie_champion',
    titleNameRo: 'Campionul Valkyriilor 🛡️⚡',
    titleNameEn: 'Valkyrie Champion 🛡️⚡',
  },
  {
    id: 'cosmetic_title_dragon_slayer',
    type: 'title',
    rarity: 'classified',
    name: 'Titlu: Vânătorul de Dragoni 🐉',
    nameEn: 'Title: Dragon Slayer 🐉',
    descRo: 'Titlu de elită pentru stăpânii vulcanului și campionii neînfricați.',
    descEn: 'Elite title for volcanic masters and fearless tavern champions.',
    icon: '🐉',
    exclusiveToChest: false,
    titleKey: 'title_dragon_slayer',
    titleNameRo: 'Vânătorul de Dragoni 🐉',
    titleNameEn: 'Dragon Slayer 🐉',
  },
  {
    id: 'cosmetic_title_phantom_king',
    type: 'title',
    rarity: 'classified',
    name: 'Titlu: Regele Fantomatic 👑👻',
    nameEn: 'Title: Phantom King 👑👻',
    descRo: 'Titlu mistic cu aureolă verde spectrală din străfundurile criptei.',
    descEn: 'Mystic title with glowing green spectral aura from the crypt.',
    icon: '👻',
    exclusiveToChest: false,
    titleKey: 'title_phantom_king',
    titleNameRo: 'Regele Fantomatic 👑👻',
    titleNameEn: 'Phantom King 👑👻',
  },
  {
    id: 'cosmetic_emote_holy_blessing',
    type: 'emote',
    rarity: 'classified',
    name: 'Reacție: „Amin și la mai mare!” ✨',
    nameEn: 'Emote: “Amen & Greater Glory!” ✨',
    descRo: 'Cor îngeresc de clopote aurite și binecuvântare sacră.',
    descEn: 'Angelic choir shimmer of golden bells and monastic blessing.',
    icon: '✨',
    exclusiveToChest: false,
    emoteKey: 'emote_holy_blessing',
  },
  {
    id: 'cosmetic_emote_dragon_roar',
    type: 'emote',
    rarity: 'classified',
    name: 'Reacție: „Răget de Dragon!” 🐉🔥',
    nameEn: 'Emote: “Dragon Roar!” 🐉🔥',
    descRo: 'Suflu intimidant de flăcări vulcanice peste toată masa.',
    descEn: 'Intimidating burst of volcanic fire across the whole tavern.',
    icon: '🐉',
    exclusiveToChest: false,
    emoteKey: 'emote_dragon_roar',
  },

  // -------------------------------------------------------------
  // 4. COVERT (8% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_avatar_high_paladin',
    type: 'avatar',
    rarity: 'covert',
    name: 'Avatar: Marele Cavaler Paladin',
    nameEn: 'Avatar: High Solar Paladin',
    descRo: 'Armură completă din aur solar, blazon de leu și privire divină.',
    descEn: 'Full radiant sun plate armor, noble lion heraldry and divine solar crest.',
    icon: '⚔️',
    exclusiveToChest: false,
    avatarKey: 'high_paladin',
  },
  {
    id: 'cosmetic_avatar_dragon_abbot',
    type: 'avatar',
    rarity: 'covert',
    name: 'Avatar: Starețul Călăreț de Dragoni',
    nameEn: 'Avatar: Dragon-Rider Abbot',
    descRo: 'Mitropolitul legendar călare pe dragonul roșu cu potir de vin în mână.',
    descEn: 'Legendary primate wielding the crimson wyrm with a sacred chalice.',
    icon: '👑',
    exclusiveToChest: false,
    avatarKey: 'dragon_abbot',
  },
  {
    id: 'cosmetic_avatar_wizard',
    type: 'avatar',
    rarity: 'covert',
    name: 'Avatar: Vrăjitorul Tavernei',
    nameEn: 'Avatar: Tavern Grand Wizard',
    descRo: 'Barbă albă lungă, robă purpurie cu stele și toiag arcanc.',
    descEn: 'Flowing white beard, starred purple robes and staff of arcane light.',
    icon: '🧙‍♂️',
    exclusiveToChest: false,
    avatarKey: 'wizard',
  },
  {
    id: 'cosmetic_dice_crimson_dragon',
    type: 'diceSkin',
    rarity: 'covert',
    name: 'Zaruri din Solzi de Dragon Roșu',
    nameEn: 'Crimson Dragonscale Dice',
    descRo: 'Forjate în inima vulcanului, emană scântei galbene la fiecare rotire.',
    descEn: 'Forged in volcanic depths, emitting fiery gold sparks on roll.',
    icon: '🐉',
    exclusiveToChest: false,
    diceSkinKey: 'crimson_dragon',
    previewGradient: 'from-[#dc2626] via-[#ea580c] to-[#450a0a]',
  },
  {
    id: 'cosmetic_dice_bloodfire',
    type: 'diceSkin',
    rarity: 'covert',
    name: 'Zaruri „Focul Dragonului de Sânge”',
    nameEn: 'Bloodfire Dragon Dice',
    descRo: 'Turnate în inima vulcanului, emană căldură și flăcări sângerii la duble.',
    descEn: 'Forged in magma depths, erupts with fiery crimson flares on doubles.',
    icon: '🐉',
    exclusiveToChest: false,
    diceSkinKey: 'bloodfire',
    previewGradient: 'from-[#dc2626] via-[#991b1b] to-[#450a0a]',
  },
  {
    id: 'cosmetic_theme_royal_treasury',
    type: 'theme',
    rarity: 'covert',
    name: 'Tema: Trezoreria Regală a Boierilor',
    nameEn: 'Theme: Royal Treasury Vault',
    descRo: 'Coloane aurite, potire strălucitoare și cascade de ducați de aur.',
    descEn: 'Gilded cathedral columns, chalices and cascades of golden ducats.',
    icon: '💰',
    exclusiveToChest: false,
    themeKey: 'royal_treasury',
    previewGradient: 'from-[#1a1304] via-[#2e2107] to-[#0d0902]',
  },
  {
    id: 'cosmetic_title_dragon_warlord',
    type: 'title',
    rarity: 'covert',
    name: 'Titlu: Stăpânul Dragonilor de Foc 🌋🐉',
    nameEn: 'Title: Dragon Warlord of Fire 🌋🐉',
    descRo: 'Îmblânzitorul flăcărilor vulcanice și al mizelor uriașe.',
    descEn: 'Tamer of volcanic flares and titan high-stakes tables.',
    icon: '🌋',
    exclusiveToChest: false,
    titleKey: 'title_dragon_warlord',
    titleNameRo: 'Stăpânul Dragonilor de Foc 🌋🐉',
    titleNameEn: 'Dragon Warlord of Fire 🌋🐉',
  },
  {
    id: 'cosmetic_title_high_roller',
    type: 'title',
    rarity: 'covert',
    name: 'Titlu: Magnatul Mesei de Craps 💎',
    nameEn: 'Title: High Roller Tycoon 💎',
    descRo: 'Simbolul luxului boieresc cu pietre prețioase și aur.',
    descEn: 'Symbol of noble luxury encrusted with gems and monastic gold.',
    icon: '💎',
    exclusiveToChest: false,
    titleKey: 'title_high_roller',
    titleNameRo: 'Magnatul Mesei de Craps 💎',
    titleNameEn: 'High Roller Tycoon 💎',
  },
  {
    id: 'cosmetic_title_divine_friar',
    type: 'title',
    rarity: 'covert',
    name: 'Titlu: Călugăr Iluminat de Har ✨',
    nameEn: 'Title: Friar of Divine Light ✨',
    descRo: 'Titlu legendar iluminat cu aură strălucitoare pe profil.',
    descEn: 'Legendary title radiant with divine light on your profile.',
    icon: '✨',
    exclusiveToChest: false,
    titleKey: 'title_divine_friar',
    titleNameRo: 'Călugăr Iluminat de Har ✨',
    titleNameEn: 'Friar of Divine Light ✨',
  },
  {
    id: 'cosmetic_emote_gold_rain',
    type: 'emote',
    rarity: 'covert',
    name: 'Reacție: „Ploaie de Aur!” 💰✨',
    nameEn: 'Emote: “Golden Rain!” 💰✨',
    descRo: 'Cascadă strălucitoare de monede de aur ce zornăie pe scândură.',
    descEn: 'Shimmering cascade of golden coins clattering across the table.',
    icon: '💰',
    exclusiveToChest: false,
    emoteKey: 'emote_gold_rain',
  },

  // -------------------------------------------------------------
  // 5. ★ RARE SPECIAL ITEM ★ (3% total probability)
  // -------------------------------------------------------------
  {
    id: 'cosmetic_special_avatar_immortal_archimandrite',
    type: 'avatar',
    rarity: 'rareSpecial',
    name: '★ Avatar: Arhimandritul Nemuritor ★',
    nameEn: '★ Avatar: Immortal Archimandrite ★',
    descRo: 'Coroană de aur, aureolă strălucitoare și cel mai mare butoi divin.',
    descEn: 'Blinding halo of pure gold, heavenly crown and divine chalice.',
    icon: '🏆',
    exclusiveToChest: false,
    avatarKey: 'immortal_archimandrite',
  },
  {
    id: 'cosmetic_special_void_cosmic',
    type: 'diceSkin',
    rarity: 'rareSpecial',
    name: '★ Zaruri Cosmice din Vid ★',
    nameEn: '★ Cosmic Void Dice ★',
    descRo: 'Obsidian stelar învăluit în nebuloasă albastră cu pips-uri neon de stea.',
    descEn: 'Stellar obsidian swirling with blue nebula and glowing neon star pips.',
    icon: '🌌',
    exclusiveToChest: false,
    diceSkinKey: 'void_cosmic',
    previewGradient: 'from-[#38bdf8] via-[#818cf8] to-[#1e1b4b]',
  },
  {
    id: 'cosmetic_special_celestial_gold',
    type: 'diceSkin',
    rarity: 'rareSpecial',
    name: '★ Zaruri Aur Celest ★',
    nameEn: '★ Celestial Gold Dice ★',
    descRo: 'Aur divin pur binecuvântat de arhangheli cu aură orbitoare.',
    descEn: 'Pure heavenly gold blessed by archangels with blinding aura.',
    icon: '⭐',
    exclusiveToChest: false,
    diceSkinKey: 'celestial_gold',
    previewGradient: 'from-[#fef08a] via-[#ffd700] to-[#b45309]',
  },
  {
    id: 'cosmetic_special_imperial_gold',
    type: 'diceSkin',
    rarity: 'rareSpecial',
    name: '★ Zaruri din Aur Imperial & Smarald ★',
    nameEn: '★ Imperial Gold & Emerald Dragon Dice ★',
    descRo: 'Obiect mitic legendar cu inserții de aur pur de 24k și raze divine.',
    descEn: 'Mythic treasure forged in 24k solid gold with radiant angelic auras.',
    icon: '👑',
    exclusiveToChest: false,
    diceSkinKey: 'imperial_gold',
    previewGradient: 'from-[#ffd700] via-[#f59e0b] to-[#78350f]',
  },
  {
    id: 'cosmetic_special_custom_player_theme',
    type: 'theme',
    rarity: 'rareSpecial',
    name: '★ Fundal Personalizat de Jucător ★',
    nameEn: '★ Custom Player Wallpaper ★',
    descRo: 'Raritate supremă! Îți permite să încarci orice poză proprie din telefon/PC ca fundal în joc.',
    descEn: 'Maximum rarity drop! Allows you to upload any custom image or photo from your device as your game background.',
    icon: '🖼️',
    exclusiveToChest: false,
    themeKey: 'custom_player',
    previewGradient: 'from-[#ffd700] via-[#ec4899] to-[#6366f1]',
  },
  {
    id: 'cosmetic_special_title_immortal_patriarch',
    type: 'title',
    rarity: 'rareSpecial',
    name: '★ Titlu: Patriarhul Nemuritor al Berii ★',
    nameEn: '★ Title: Immortal Patriarch of Ale ★',
    descRo: 'Cel mai prestigios titlu monahal existent în joc, emanând raze divine.',
    descEn: 'The most prestigious monastic title in the game, radiating divine light.',
    icon: '👑',
    exclusiveToChest: false,
    titleKey: 'title_patriarch',
    titleNameRo: '★ Patriarhul Nemuritor al Berii ★',
    titleNameEn: '★ Immortal Patriarch of Ale ★',
  },
  {
    id: 'cosmetic_special_title_golden_emperor',
    type: 'title',
    rarity: 'rareSpecial',
    name: '★ Titlu: Împăratul Mesei de Aur 👑🌟 ★',
    nameEn: '★ Title: Emperor of the Golden Table 👑🌟 ★',
    descRo: 'Titlu mitic legendar pentru stăpânii absoluți ai cârciumii.',
    descEn: 'Mythic supreme title for absolute masters of the golden table.',
    icon: '🌟',
    exclusiveToChest: false,
    titleKey: 'title_golden_emperor',
    titleNameRo: '★ Împăratul Mesei de Aur 👑🌟 ★',
    titleNameEn: '★ Emperor of the Golden Table 👑🌟 ★',
  },
];

// =========================================================================
// THEMATIC CHESTS CATALOG (4 Distinct Cases: 3 Full-Rarity + 1 High-Tier Exclusive)
// =========================================================================
export const CHESTS_CATALOG: ChestDef[] = [
  {
    id: 'chest_monastery',
    key: 'monastery_case',
    nameRo: 'Cufărul Mănăstirii',
    nameEn: 'Monastery Case',
    descRo: 'Cufăr tradițional din stejar și fier forjat, cu relicve sacre, ucenici călugări, zaruri aurite și toate raritățile.',
    descEn: 'Traditional oak and iron chest with holy relics, monk avatars, gilded dice, and all cosmetic rarities.',
    cost: 35, // Balanced progression cost
    icon: '📦',
    color: '#ffd700',
    bannerGradient: 'from-amber-950 via-[#361f0b] to-[#1a0f05]',
    badgeRo: 'Toate Raritățile',
    badgeEn: 'All Rarities',
    items: ALL_CHEST_COSMETICS.filter(
      (item) =>
        item.id.includes('monk') ||
        item.id.includes('jester') ||
        item.id.includes('scout') ||
        item.id.includes('wood') ||
        item.id.includes('bone') ||
        item.id.includes('copper') ||
        item.id.includes('granite') ||
        item.id.includes('beer_baron') ||
        item.id.includes('archduke') ||
        item.id.includes('dice_prophet') ||
        item.id.includes('cheers') ||
        item.id.includes('roll_heavy') ||
        item.id.includes('templar') ||
        item.id.includes('inquisitor') ||
        item.id.includes('holy_blessing') ||
        item.id.includes('paladin') ||
        item.id.includes('celestial_gold') ||
        item.id.includes('archimandrite') ||
        item.id.includes('patriarch') ||
        item.id.includes('divine_friar') ||
        item.id.includes('custom_player')
    ),
  },
  {
    id: 'chest_night_crypt',
    key: 'night_case',
    nameRo: 'Cufărul Criptei & Nopții',
    nameEn: 'Crypt & Shadows Case',
    descRo: 'Păstrat în străfundul criptei, învăluit în mistere violete, asasini din umbră, vrăjitori și zaruri cosmice de toate raritățile.',
    descEn: 'Sealed in the crypt depths, imbued with arcane amethyst, shadow assassins, wizards, and cosmic void dice across all rarities.',
    cost: 40, // Balanced progression cost
    icon: '🔮',
    color: '#a855f7',
    bannerGradient: 'from-purple-950 via-[#270e3d] to-[#11051c]',
    badgeRo: 'Toate Raritățile',
    badgeEn: 'All Rarities',
    items: ALL_CHEST_COSMETICS.filter(
      (item) =>
        item.id.includes('valkyrie') ||
        item.id.includes('alchemist') ||
        item.id.includes('assassin') ||
        item.id.includes('archmage') ||
        item.id.includes('executioner') ||
        item.id.includes('thief') ||
        item.id.includes('wizard') ||
        item.id.includes('amethyst') ||
        item.id.includes('obsidian') ||
        item.id.includes('plasma') ||
        item.id.includes('ice') ||
        item.id.includes('crypt') ||
        item.id.includes('observatory') ||
        item.id.includes('forest') ||
        item.id.includes('shadow_phantom') ||
        item.id.includes('phantom') ||
        item.id.includes('cry_cellar') ||
        item.id.includes('void_cosmic') ||
        item.id.includes('custom_player')
    ),
  },
  {
    id: 'chest_dragon_hoard',
    key: 'dragon_case',
    nameRo: 'Cufărul Dragonului de Aur',
    nameEn: 'Golden Dragon Case',
    descRo: 'Comoară ascunsă în peștera vulcanului, cu marele paladin, solzi de foc, trezoreria regală și zaruri imperiale din toate raritățile.',
    descEn: 'Volcanic dragon hoard with high paladins, dragonscales, royal treasury, and imperial gold across all rarities.',
    cost: 45, // Balanced progression cost
    icon: '🐉',
    color: '#eb4b4b',
    bannerGradient: 'from-red-950 via-[#3d0d0d] to-[#1a0505]',
    badgeRo: 'Toate Raritățile',
    badgeEn: 'All Rarities',
    items: ALL_CHEST_COSMETICS.filter(
      (item) =>
        item.id.includes('dragon') ||
        item.id.includes('paladin') ||
        item.id.includes('princess') ||
        item.id.includes('wizard') ||
        item.id.includes('infernal') ||
        item.id.includes('bloodfire') ||
        item.id.includes('ruby') ||
        item.id.includes('emerald') ||
        item.id.includes('treasury') ||
        item.id.includes('high_roller') ||
        item.id.includes('warlord') ||
        item.id.includes('gold_rain') ||
        item.id.includes('imperial_gold') ||
        item.id.includes('golden_emperor') ||
        item.id.includes('custom_player')
    ),
  },
  {
    id: 'chest_imperial_reliquary',
    key: 'imperial_reliquary_case',
    nameRo: '★ Tezaurul Imperial & Divin ★',
    nameEn: '★ Imperial Divine Reliquary ★',
    descRo: 'Cufăr legendar de elită supremă. Conține EXCLUSIV rarități superioare (Clasificat, Secret și ★ Obiecte Speciale Rare ★). Fără rarități joase!',
    descEn: 'Legendary elite reliquary. Contains EXCLUSIVELY higher tier drops (Classified, Covert & ★ Rare Special Items ★). Zero low-tier drops!',
    cost: 140, // Premium higher cost for guaranteed high-tier drops
    icon: '👑',
    color: '#ffd700',
    bannerGradient: 'from-yellow-950 via-[#452e05] to-[#1f1402]',
    isHighTierOnly: true,
    badgeRo: '★ DOAR RARITĂȚI SUPERIOARE ★',
    badgeEn: '★ HIGH-TIER ONLY ★',
    items: ALL_CHEST_COSMETICS.filter(
      (item) =>
        item.rarity === 'classified' ||
        item.rarity === 'covert' ||
        item.rarity === 'rareSpecial'
    ),
  },
];

// Helper: Pick a random cosmetic item from chest based on exact CS percentages
export function rollChestItem(chest: ChestDef): { winningItem: CosmeticItem; rolledRarity: CosmeticRarity; rolledOdds: number } {
  const items = chest.items && chest.items.length > 0 ? chest.items : ALL_CHEST_COSMETICS;
  const isHighTier = Boolean(chest.isHighTierOnly || !items.some(i => i.rarity === 'milspec' || i.rarity === 'restricted'));

  let targetRarity: CosmeticRarity = 'milspec';
  let odds = 0.45;

  if (isHighTier) {
    // High Tier Exclusive Chest (Classified, Covert, Rare Special only)
    // Classified: 60% (0 to 60)
    // Covert: 30% (60 to 90)
    // Rare Special: 10% (90 to 100)
    const roll = Math.random() * 100;
    if (roll < 60) {
      targetRarity = 'classified';
      odds = 0.60;
    } else if (roll < 90) {
      targetRarity = 'covert';
      odds = 0.30;
    } else {
      targetRarity = 'rareSpecial';
      odds = 0.10;
    }
  } else {
    // Standard All-Rarities Chests:
    // Mil-Spec: 45% (0 to 45)
    // Restricted: 28% (45 to 73)
    // Classified: 16% (73 to 89)
    // Covert: 8% (89 to 97)
    // Rare Special: 3% (97 to 100)
    const roll = Math.random() * 100;
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

// Generate the full horizontal tape of 75 items with realistic distribution & near-miss suspense
export function generateCaseTape(
  chest: ChestDef,
  winningItem: CosmeticItem,
  targetIndex = 58,
  totalItems = 75
): CosmeticItem[] {
  const pool = chest.items && chest.items.length > 0 ? chest.items : ALL_CHEST_COSMETICS;
  const isHighTier = Boolean(chest.isHighTierOnly || !pool.some(i => i.rarity === 'milspec' || i.rarity === 'restricted'));
  const tape: CosmeticItem[] = [];

  const rareSpecialItems = pool.filter((i) => i.rarity === 'rareSpecial');
  const covertItems = pool.filter((i) => i.rarity === 'covert');
  const topTierItems = pool.filter((i) => i.rarity === 'covert' || i.rarity === 'rareSpecial');
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

    if (isHighTier) {
      // High-tier exclusive tape (classified, covert, rareSpecial)
      if (
        (i === targetIndex - 1 || i === targetIndex + 1) &&
        winningItem.rarity !== 'rareSpecial' &&
        rareSpecialItems.length > 0
      ) {
        tape.push(getRandomFrom(rareSpecialItems));
        continue;
      }

      const r = Math.random() * 100;
      if (r < 55 && classifiedItems.length > 0) {
        tape.push(getRandomFrom(classifiedItems));
      } else if (r < 85 && covertItems.length > 0) {
        tape.push(getRandomFrom(covertItems));
      } else if (rareSpecialItems.length > 0) {
        tape.push(getRandomFrom(rareSpecialItems));
      } else {
        tape.push(getRandomFrom(pool));
      }
    } else {
      // Standard Case Tape:
      // Near miss tension: place topTier item adjacent to winning card if winner is lower rarity
      if (
        (i === targetIndex - 1 || i === targetIndex + 1) &&
        winningItem.rarity !== 'covert' &&
        winningItem.rarity !== 'rareSpecial' &&
        topTierItems.length > 0
      ) {
        tape.push(getRandomFrom(topTierItems));
        continue;
      }

      // Realistic item tape distribution (lots of milspec & restricted, occasional classified/covert tease)
      const r = Math.random() * 100;
      if (r < 48 && milspecItems.length > 0) {
        tape.push(getRandomFrom(milspecItems));
      } else if (r < 78 && restrictedItems.length > 0) {
        tape.push(getRandomFrom(restrictedItems));
      } else if (r < 93 && classifiedItems.length > 0) {
        tape.push(getRandomFrom(classifiedItems));
      } else if (topTierItems.length > 0) {
        tape.push(getRandomFrom(topTierItems));
      } else {
        tape.push(getRandomFrom(pool));
      }
    }
  }

  return tape;
}
