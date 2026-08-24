import { Profile } from '../types';

export type AchievementDifficulty = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';

export interface AchievementXpTier {
  difficulty: AchievementDifficulty;
  nameRo: string;
  nameEn: string;
  xp: number;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  icon: string;
}

export const ACHIEVEMENT_XP_TIERS: Record<AchievementDifficulty, AchievementXpTier> = {
  bronze: {
    difficulty: 'bronze',
    nameRo: 'Bronz (Comun)',
    nameEn: 'Bronze (Common)',
    xp: 20,
    badgeBg: 'bg-amber-950/70',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-700/50',
    icon: '🥉',
  },
  silver: {
    difficulty: 'silver',
    nameRo: 'Argint (Neobișnuit)',
    nameEn: 'Silver (Uncommon)',
    xp: 50,
    badgeBg: 'bg-slate-900/80',
    textColor: 'text-slate-200',
    borderColor: 'border-slate-400/50',
    icon: '🥈',
  },
  gold: {
    difficulty: 'gold',
    nameRo: 'Aur (Rar)',
    nameEn: 'Gold (Rare)',
    xp: 100,
    badgeBg: 'bg-yellow-950/80',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-500/60',
    icon: '🥇',
  },
  platinum: {
    difficulty: 'platinum',
    nameRo: 'Platină (Epic)',
    nameEn: 'Platinum (Epic)',
    xp: 200,
    badgeBg: 'bg-cyan-950/80',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-400/60',
    icon: '💎',
  },
  legend: {
    difficulty: 'legend',
    nameRo: 'Legendă (Legendar)',
    nameEn: 'Legend (Legendary)',
    xp: 400,
    badgeBg: 'bg-purple-950/90',
    textColor: 'text-fuchsia-300',
    borderColor: 'border-fuchsia-500/70',
    icon: '👑',
  },
};

/**
 * Explicit classification of all game achievements into the 5 XP difficulty tiers
 */
export const ACHIEVEMENT_DIFFICULTY_MAP: Record<string, AchievementDifficulty> = {
  // BRONZE (20 XP) - Fast first session unlocks
  first_sip: 'bronze',
  heaven_blessing: 'bronze',
  first_chug: 'bronze',
  first_game: 'bronze',
  first_property: 'bronze',
  dungeon_visit: 'bronze',
  gambler_monk: 'bronze',
  fate_card: 'bronze',
  first_duel: 'bronze',
  first_casino: 'bronze',
  first_pineapple: 'bronze',
  pineapple_bot_easy: 'bronze',
  pineapple_flawless_hand: 'bronze',
  pineapple_fantasyland: 'bronze',
  pineapple_royalties: 'bronze',
  first_crash: 'bronze',
  crash_safe_landing: 'bronze',
  crash_chicken_egg: 'bronze',
  crash_prudent_victor: 'bronze',
  crash_auto_pilot: 'bronze',
  crash_quick_escape: 'bronze',
  pass_dice_turn: 'bronze',
  quick_reflex: 'bronze',
  sip_apprentice_10: 'bronze',
  monopoly_rent_pay: 'bronze',
  craps_passline_win: 'bronze',
  dice_doubles_master: 'bronze',
  avatar_customizer: 'bronze',
  duel_rebound: 'bronze',
  trivia_scholar: 'bronze',

  // SILVER (50 XP) - Requires multiple sessions or moderate luck/skill
  chug_trio: 'silver',
  drinker_50: 'silver',
  monopoly_full_color: 'silver',
  jailbreak_key: 'silver',
  give_up_surrender: 'silver',
  podium_winner: 'silver',
  duel_victory: 'silver',
  casino_highroller: 'silver',
  pineapple_victory: 'silver',
  pineapple_bot_medium: 'silver',
  pineapple_scoop: 'silver',
  pineapple_dragon: 'silver',
  pineapple_fantasyland_streak: 'silver',
  crash_high_multiplier: 'silver',
  crash_bot_victor: 'silver',
  crash_fiery_victor: 'silver',
  crash_groapa_survivor: 'silver',
  crash_streak_3: 'silver',
  crash_greed_punish: 'silver',
  crash_games_5: 'silver',
  sips_century_100: 'silver',
  chug_veteran_10: 'silver',
  monopoly_land_baron: 'silver',
  craps_snake_eyes: 'silver',
  craps_midnight: 'silver',
  duel_streak_3: 'silver',
  gold_hoarder_100: 'silver',
  speed_demon_trivia: 'silver',
  resurrected_phoenix: 'silver',

  // GOLD (100 XP) - Sustained dedication, high counts or tough challenges
  chug_quintet: 'gold',
  legend_25_games: 'gold',
  legend_500_sips: 'gold',
  legend_boardgame_emperor: 'gold',
  legend_craps_king: 'gold',
  legend_duel_grandmaster: 'gold',
  legend_pineapple_master: 'gold',
  legend_crash_master: 'gold',
  crash_titan_x10: 'gold',
  crash_streak_5: 'gold',
  crash_flawless_match: 'gold',
  crash_games_15: 'gold',
  legend_survivor_100_turns: 'gold',
  legend_speed_titan: 'gold',

  // PLATINUM (200 XP) - Epic, rare combos of high skill & luck
  pineapple_bot_hard: 'platinum',
  legend_pineapple_royal_flush: 'platinum',
  crash_legendary_x20: 'platinum',
  crash_penta_champion: 'platinum',
  crash_iron_liver: 'platinum',
  crash_bot_master_both: 'platinum',
  legend_tycoon: 'platinum',
  legend_ascended: 'platinum',
  legend_tri_champion: 'platinum',
  legend_quad_champion: 'platinum',
  legend_flawless_duel: 'platinum',
  legend_50_games: 'platinum',
  legend_craps_fortune: 'platinum',
  legend_monopoly_all_properties: 'platinum',

  // LEGEND (400 XP) - Supreme ultra-endgame milestones
  legend_1000_sips: 'legend',
  legend_50_chugs: 'legend',
  crash_legendary_x50: 'legend',
  legend_crash_grandmaster_25: 'legend',
};

export const getAchievementXp = (achievementId: string): number => {
  const diff = ACHIEVEMENT_DIFFICULTY_MAP[achievementId] || 'bronze';
  return ACHIEVEMENT_XP_TIERS[diff].xp;
};

export const getAchievementTierInfo = (achievementId: string): AchievementXpTier => {
  const diff = ACHIEVEMENT_DIFFICULTY_MAP[achievementId] || 'bronze';
  return ACHIEVEMENT_XP_TIERS[diff];
};

/**
 * 20 Thematic Rank Titles based on Level thresholds
 */
export interface RankTitle {
  minLevel: number;
  titleRo: string;
  titleEn: string;
  icon: string;
  color: string;
}

export const RANK_TITLES: RankTitle[] = [
  { minLevel: 1, titleRo: 'Ucenic de Tavernă', titleEn: 'Tavern Apprentice', icon: '🍺', color: 'text-amber-200' },
  { minLevel: 3, titleRo: 'Cărăuș de Bere', titleEn: 'Ale Carrier', icon: '🪵', color: 'text-amber-300' },
  { minLevel: 5, titleRo: 'Novice al Mănăstirii', titleEn: 'Monastery Novice', icon: '🕯️', color: 'text-yellow-200' },
  { minLevel: 7, titleRo: 'Paharnic', titleEn: 'Cupbearer', icon: '🍷', color: 'text-orange-300' },
  { minLevel: 9, titleRo: 'Frate Începător', titleEn: 'Junior Friar', icon: '📜', color: 'text-emerald-300' },
  { minLevel: 12, titleRo: 'Meșter Halbă', titleEn: 'Tankard Master', icon: '🍻', color: 'text-amber-400' },
  { minLevel: 15, titleRo: 'Cavaler de Rând', titleEn: 'Rank Knight', icon: '⚔️', color: 'text-slate-200' },
  { minLevel: 18, titleRo: 'Frate Chefliu', titleEn: 'Reveling Friar', icon: '🎉', color: 'text-pink-300' },
  { minLevel: 21, titleRo: 'Străjer al Butoiului', titleEn: 'Barrel Guardian', icon: '🛡️', color: 'text-teal-300' },
  { minLevel: 24, titleRo: 'Cavaler al Cupei', titleEn: 'Knight of the Cup', icon: '🏆', color: 'text-yellow-400' },
  { minLevel: 28, titleRo: 'Baron Beat', titleEn: 'Drunken Baron', icon: '🥴', color: 'text-purple-300' },
  { minLevel: 32, titleRo: 'Duce al Duelurilor', titleEn: 'Duke of Duels', icon: '🗡️', color: 'text-rose-400' },
  { minLevel: 36, titleRo: 'Mare Paharnic', titleEn: 'Grand Cupbearer', icon: '🏺', color: 'text-amber-300' },
  { minLevel: 40, titleRo: 'Stareț de Tavernă', titleEn: 'Tavern Abbot', icon: '⛪', color: 'text-yellow-300' },
  { minLevel: 45, titleRo: 'Arhiepiscop al Băuturii', titleEn: 'Archbishop of Drink', icon: '📿', color: 'text-violet-300' },
  { minLevel: 50, titleRo: 'Rege al Gropilor', titleEn: 'King of Chugs', icon: '💀', color: 'text-red-400' },
  { minLevel: 56, titleRo: 'Împărat al Nopților Nesfârșite', titleEn: 'Emperor of Endless Nights', icon: '🌌', color: 'text-indigo-300' },
  { minLevel: 62, titleRo: 'Sfântul Patron al Tavernei', titleEn: 'Patron Saint of the Tavern', icon: '✨', color: 'text-sky-300' },
  { minLevel: 70, titleRo: 'Zeu al Butoiului', titleEn: 'God of the Barrel', icon: '⚡', color: 'text-amber-400' },
  { minLevel: 80, titleRo: 'Legenda Mănăstirii', titleEn: 'Legend of the Monastery', icon: '👑', color: 'text-yellow-300' },
];

/**
 * Level Curve: Total XP needed to reach Level N
 * Formula: totalXP(N) = round(40 * N^2.3) for N >= 2, with N = 1 requiring 0 XP.
 */
export const getTotalXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.round(40 * Math.pow(level, 2.3));
};

export interface PlayerProgression {
  totalXP: number;
  currentLevel: number;
  titleRo: string;
  titleEn: string;
  titleIcon: string;
  titleColor: string;
  currentLevelBaseXP: number;
  nextLevelXP: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number; // 0 to 100
}

/**
 * Derives full progression details from total XP
 */
export const calculateProgression = (totalXP: number = 0): PlayerProgression => {
  const safeXP = Math.max(0, Math.round(totalXP || 0));

  // Determine current level by finding highest level N where totalXP >= getTotalXpForLevel(N)
  let level = 1;
  while (level < 100 && safeXP >= getTotalXpForLevel(level + 1)) {
    level++;
  }

  const currentLevelBaseXP = getTotalXpForLevel(level);
  const nextLevelXP = getTotalXpForLevel(level + 1);
  const xpInCurrentLevel = safeXP - currentLevelBaseXP;
  const xpNeededForNextLevel = Math.max(1, nextLevelXP - currentLevelBaseXP);
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

  // Find active title (highest threshold reached)
  let activeTitle = RANK_TITLES[0];
  for (const t of RANK_TITLES) {
    if (level >= t.minLevel) {
      activeTitle = t;
    }
  }

  return {
    totalXP: safeXP,
    currentLevel: level,
    titleRo: activeTitle.titleRo,
    titleEn: activeTitle.titleEn,
    titleIcon: activeTitle.icon,
    titleColor: activeTitle.color,
    currentLevelBaseXP,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
  };
};

/**
 * Returns whether a level jump crossed into a new title threshold
 */
export const getNewlyUnlockedTitle = (oldLevel: number, newLevel: number): RankTitle | null => {
  if (newLevel <= oldLevel) return null;
  // Check if any threshold in RANK_TITLES is > oldLevel and <= newLevel
  const crossedTitles = RANK_TITLES.filter(t => t.minLevel > oldLevel && t.minLevel <= newLevel);
  if (crossedTitles.length > 0) {
    return crossedTitles[crossedTitles.length - 1]; // Return highest unlocked
  }
  return null;
};

/**
 * Returns the next upcoming title reward based on current level
 */
export const getNextRankTitle = (currentLevel: number): RankTitle | null => {
  return RANK_TITLES.find(t => t.minLevel > currentLevel) || null;
};

/**
 * Returns the upcoming N level milestones
 */
export const getUpcomingMilestones = (currentLevel: number, count: number = 3): Array<{
  level: number;
  totalXpNeeded: number;
  titleReward?: RankTitle;
}> => {
  const list: Array<{ level: number; totalXpNeeded: number; titleReward?: RankTitle }> = [];
  for (let lvl = currentLevel + 1; lvl <= currentLevel + count; lvl++) {
    const title = RANK_TITLES.find(t => t.minLevel === lvl);
    list.push({
      level: lvl,
      totalXpNeeded: getTotalXpForLevel(lvl),
      titleReward: title,
    });
  }
  return list;
};

export const getAchievementCoinReward = (difficulty: AchievementDifficulty): number => {
  switch (difficulty) {
    case 'bronze': return 10;
    case 'silver': return 25;
    case 'gold': return 50;
    case 'platinum': return 100;
    case 'legend': return 250;
    default: return 10;
  }
};

/**
 * XP & Drunken Coins Breakdown calculation for end of match
 */
export interface MatchXpBreakdown {
  mode: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash';
  turnsPlayed: number;
  participationXP: number;
  turnsXP: number;
  turnsFormulaTextRo: string;
  turnsFormulaTextEn: string;
  performanceXP: number;
  performanceReasonRo?: string;
  performanceReasonEn?: string;
  achievementItems: Array<{
    id: string;
    nameRo: string;
    nameEn: string;
    icon: string;
    xp: number;
    coins: number;
    difficulty: AchievementDifficulty;
  }>;
  totalGainedXP: number;
  oldTotalXP: number;
  newTotalXP: number;
  oldLevel: number;
  newLevel: number;
  didLevelUp: boolean;
  levelsGainedCount: number;
  newTitleUnlocked: RankTitle | null;
  // Ingame Currency: Drunken Coins (Bănuți Turmentați 🍺🪙)
  drunkenCoinsGained: number;
  oldDrunkenCoins: number;
  newDrunkenCoins: number;
  coinsBreakdown: Array<{
    icon: string;
    reasonRo: string;
    reasonEn: string;
    amount: number;
  }>;
}

export const calculateMatchXpGain = (
  currentProfile: Profile,
  mode: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash',
  isWinner: boolean,
  turnsPlayed: number = 5,
  newAchievementsUnlocked: string[] = [],
  extraStats?: { sips?: number; chugs?: number; gold?: number; chips?: number; flawless?: boolean },
  globalCoinsPool?: number
): MatchXpBreakdown | null => {
  // CRITICAL ANTI-FARMING RULE: If game ended under 2 turns/hands/rounds, NO XP or Coins are awarded!
  if (turnsPlayed < 2) {
    return null;
  }

  const oldXP = currentProfile.totalXP || 0;
  const oldCoins = globalCoinsPool !== undefined ? globalCoinsPool : (currentProfile.drunkenCoins || 0);
  const oldProg = calculateProgression(oldXP);
  const safeTurns = Math.max(2, turnsPlayed || 2);

  // 1. Base Participation XP
  let participationXP = 15;
  if (mode === 'boardgame') participationXP = 30;
  else if (mode === 'duel') participationXP = 20;
  else if (mode === 'casino') participationXP = 25;
  else if (mode === 'pineapple') participationXP = 25;
  else if (mode === 'crash') participationXP = 22;

  // 2. Turns Played Formula
  let turnsXP = 0;
  let turnsFormulaTextRo = '';
  let turnsFormulaTextEn = '';

  if (mode === 'normal') {
    const rawTurnsXp = Math.round(safeTurns * 3.5);
    turnsXP = Math.min(120, rawTurnsXp);
    turnsFormulaTextRo = `${safeTurns} ture × 3.5 XP`;
    turnsFormulaTextEn = `${safeTurns} turns × 3.5 XP`;
  } else if (mode === 'boardgame') {
    const rawTurnsXp = Math.round(safeTurns * 4.5);
    turnsXP = Math.min(150, rawTurnsXp);
    turnsFormulaTextRo = `${safeTurns} mutări pe tablă × 4.5 XP`;
    turnsFormulaTextEn = `${safeTurns} board moves × 4.5 XP`;
  } else if (mode === 'duel') {
    const rawTurnsXp = Math.round(safeTurns * 8.0);
    turnsXP = Math.min(120, rawTurnsXp);
    turnsFormulaTextRo = `${safeTurns} runde duel × 8 XP`;
    turnsFormulaTextEn = `${safeTurns} duel rounds × 8 XP`;
  } else if (mode === 'casino') {
    const rawTurnsXp = Math.round(safeTurns * 6.0);
    turnsXP = Math.min(130, rawTurnsXp);
    turnsFormulaTextRo = `${safeTurns} runde pariate × 6 XP`;
    turnsFormulaTextEn = `${safeTurns} betting rounds × 6 XP`;
  } else if (mode === 'pineapple') {
    const rawTurnsXp = Math.round(safeTurns * 7.0);
    turnsXP = Math.min(140, rawTurnsXp);
    turnsFormulaTextRo = `${safeTurns} mâini jucate × 7 XP`;
    turnsFormulaTextEn = `${safeTurns} hands played × 7 XP`;
  } else if (mode === 'crash') {
    const rawTurnsXp = Math.round(safeTurns * 7.5);
    turnsXP = Math.min(125, rawTurnsXp);
    turnsFormulaTextRo = `${safeTurns} runde zbor × 7.5 XP`;
    turnsFormulaTextEn = `${safeTurns} flight rounds × 7.5 XP`;
  }

  // 3. Performance / Winner XP
  let performanceXP = 0;
  let performanceReasonRo: string | undefined;
  let performanceReasonEn: string | undefined;

  if (isWinner) {
    if (mode === 'duel') {
      performanceXP = 45;
      if (extraStats?.flawless) performanceXP += 25;
      performanceReasonRo = extraStats?.flawless ? 'Campioană Fără Greșeală (Flawless)' : 'Câștigător Duel 1v1';
      performanceReasonEn = extraStats?.flawless ? 'Flawless Duel Champion' : '1v1 Duel Winner';
    } else if (mode === 'casino') {
      performanceXP = 65;
      performanceReasonRo = 'Rege al Mesei de Craps (Supraviețuitor)';
      performanceReasonEn = 'Craps Casino King (Last Standing)';
    } else if (mode === 'pineapple') {
      performanceXP = 55;
      performanceReasonRo = 'Maestru Pineapple OFC (Câștigător)';
      performanceReasonEn = 'Pineapple OFC Master (Winner)';
    } else if (mode === 'boardgame') {
      performanceXP = 60;
      performanceReasonRo = 'Câștigător Moșia Mănăstirii (Locul 1)';
      performanceReasonEn = 'Monastery Estate Champion (1st Place)';
    } else if (mode === 'crash') {
      performanceXP = 50;
      if (extraStats?.flawless) performanceXP += 25;
      performanceReasonRo = extraStats?.flawless ? 'Zbor Fără Prăbușire (Flawless)' : 'Campion Dragon Crash 1v1';
      performanceReasonEn = extraStats?.flawless ? 'Flawless Flight Champion' : '1v1 Dragon Crash Winner';
    } else if (mode === 'normal') {
      performanceXP = 35;
      performanceReasonRo = 'Regele Tavernei (Cel mai rezistent băutor)';
      performanceReasonEn = 'King of the Tavern (Top Drinker)';
    }
  }

  // 4. Achievement Items
  const achievementItems = newAchievementsUnlocked.map(achId => {
    const tier = getAchievementTierInfo(achId);
    return {
      id: achId,
      nameRo: achId,
      nameEn: achId,
      icon: tier.icon,
      xp: tier.xp,
      coins: getAchievementCoinReward(tier.difficulty),
      difficulty: tier.difficulty,
    };
  });

  const achievementsXP = achievementItems.reduce((acc, a) => acc + a.xp, 0);
  const totalGainedXP = participationXP + turnsXP + performanceXP + achievementsXP;
  const newTotalXP = oldXP + totalGainedXP;
  const newProg = calculateProgression(newTotalXP);

  const didLevelUp = newProg.currentLevel > oldProg.currentLevel;
  const levelsGainedCount = Math.max(0, newProg.currentLevel - oldProg.currentLevel);
  const newTitleUnlocked = getNewlyUnlockedTitle(oldProg.currentLevel, newProg.currentLevel);

  // 5. Drunken Coins (Bănuți Turmentați 🍺🪙) Formula
  const coinsBreakdown: Array<{ icon: string; reasonRo: string; reasonEn: string; amount: number }> = [];

  // Match completion base coins
  let baseCoins = 8;
  if (mode === 'boardgame') baseCoins = 15;
  else if (mode === 'duel') baseCoins = 10;
  else if (mode === 'casino') baseCoins = 12;
  else if (mode === 'pineapple') baseCoins = 14;
  else if (mode === 'crash') baseCoins = 12;

  coinsBreakdown.push({
    icon: '🍺',
    reasonRo: 'Finalizare Sesiune Pelerinaj',
    reasonEn: 'Pilgrimage Session Completion',
    amount: baseCoins,
  });

  // Turns bonus coins
  let turnsCoins = 0;
  if (mode === 'normal') turnsCoins = Math.floor(safeTurns / 3);
  else if (mode === 'boardgame') turnsCoins = Math.floor(safeTurns / 3);
  else if (mode === 'duel') turnsCoins = Math.floor(safeTurns * 1.5);
  else if (mode === 'casino') turnsCoins = Math.floor(safeTurns * 1.5);
  else if (mode === 'pineapple') turnsCoins = Math.floor(safeTurns * 1.5);
  else if (mode === 'crash') turnsCoins = Math.floor(safeTurns * 1.5);

  if (turnsCoins > 0) {
    coinsBreakdown.push({
      icon: '⏱️',
      reasonRo: `Bonus Ture (${safeTurns} ture)`,
      reasonEn: `Turns Bonus (${safeTurns} turns)`,
      amount: turnsCoins,
    });
  }

  // Winner bonus coins
  if (isWinner) {
    let winCoins = 15;
    if (mode === 'boardgame') winCoins = 30;
    else if (mode === 'casino') winCoins = 35;
    else if (mode === 'duel') winCoins = 25;
    else if (mode === 'pineapple') winCoins = 28;
    else if (mode === 'crash') winCoins = 26;

    coinsBreakdown.push({
      icon: '👑',
      reasonRo: 'Bonus Câștigător Pelerinaj',
      reasonEn: 'Winner Victory Bonus',
      amount: winCoins,
    });
  }

  // Level Up bonus coins (+15 per level)
  if (levelsGainedCount > 0) {
    const levelCoins = levelsGainedCount * 20;
    coinsBreakdown.push({
      icon: '⭐',
      reasonRo: `Bonus Avansare în Nivel (+${levelsGainedCount} nv.)`,
      reasonEn: `Level Up Bonus (+${levelsGainedCount} lv.)`,
      amount: levelCoins,
    });
  }

  // Achievement bonus coins
  achievementItems.forEach(ach => {
    if (ach.coins > 0) {
      coinsBreakdown.push({
        icon: ach.icon,
        reasonRo: `Realizare: ${ach.nameRo}`,
        reasonEn: `Achievement: ${ach.nameEn}`,
        amount: ach.coins,
      });
    }
  });

  const drunkenCoinsGained = coinsBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const newDrunkenCoins = oldCoins + drunkenCoinsGained;

  return {
    mode,
    turnsPlayed: safeTurns,
    participationXP,
    turnsXP,
    turnsFormulaTextRo,
    turnsFormulaTextEn,
    performanceXP,
    performanceReasonRo,
    performanceReasonEn,
    achievementItems,
    totalGainedXP,
    oldTotalXP: oldXP,
    newTotalXP,
    oldLevel: oldProg.currentLevel,
    newLevel: newProg.currentLevel,
    didLevelUp,
    levelsGainedCount,
    newTitleUnlocked,
    drunkenCoinsGained,
    oldDrunkenCoins: oldCoins,
    newDrunkenCoins,
    coinsBreakdown,
  };
};
