import { Profile } from '../types';

export type AchievementRarity = 'common' | 'rare' | 'legendary';

export interface Achievement {
  id: string;
  nameRo: string;
  nameEn: string;
  descRo: string;
  descEn: string;
  icon: string;
  rarity: AchievementRarity;
  targetCount?: number;
  getCurrentProgress?: (profile: Profile, sessionExtra?: Record<string, any>) => { current: number; max: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  // ================= COMMON (8) =================
  {
    id: 'first_sip',
    nameRo: 'Prima Înghițitură',
    nameEn: 'First Sip',
    descRo: 'Ai băut prima ta gură de bere din cariera mănăstirească.',
    descEn: 'Drank your very first sip of beer.',
    icon: '🍺',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: Math.min(1, p.totalSips || 0), max: 1 }),
  },
  {
    id: 'heaven_blessing',
    nameRo: 'Binecuvântare Cerească',
    nameEn: "Heaven's Blessing",
    descRo: 'Ai aruncat o dublă de 1 - 1 (Rai Sfânt).',
    descEn: 'Rolled double 1 - 1 (Holy Heaven).',
    icon: '✨',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('heaven_blessing') ? 1 : 0, max: 1 }),
  },
  {
    id: 'first_chug',
    nameRo: 'Botezul Gropii',
    nameEn: 'Baptism of the Abyss',
    descRo: 'Ai picat la prima ta Groapă și ai băut paharul până la fund.',
    descEn: 'Fell into your first Groapă / Chug and drained the cup.',
    icon: '💀',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: Math.min(1, p.totalChugs || 0), max: 1 }),
  },
  {
    id: 'first_game',
    nameRo: 'Primul Pelerinaj',
    nameEn: 'First Pilgrimage',
    descRo: 'Ai finalizat primul tău joc complet de Barbut.',
    descEn: 'Completed your first full game of Barbut.',
    icon: '📜',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: Math.min(1, p.gamesPlayed || 0), max: 1 }),
  },
  {
    id: 'first_property',
    nameRo: 'Moșier Mănăstiresc',
    nameEn: 'Monastery Landlord',
    descRo: 'Ai cumpărat prima ta proprietate sau chilie în Monopoly.',
    descEn: 'Purchased your first property or cell in Monopoly.',
    icon: '🏰',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('first_property') ? 1 : 0, max: 1 }),
  },
  {
    id: 'dungeon_visit',
    nameRo: 'Oaspete la Beci',
    nameEn: 'Dungeon Guest',
    descRo: 'Ai fost trimis la temnița mănăstirii pentru neascultare.',
    descEn: 'Sent to the monastery dungeon for disobedience.',
    icon: '⛓️',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('dungeon_visit') ? 1 : 0, max: 1 }),
  },
  {
    id: 'gambler_monk',
    nameRo: 'Viciul Păcănelelor',
    nameEn: 'Slot Machine Temptation',
    descRo: 'Ai tras maneta la păcănelele din curtea mănăstirii.',
    descEn: 'Spun the monastery slot machine.',
    icon: '🎰',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('gambler_monk') ? 1 : 0, max: 1 }),
  },
  {
    id: 'fate_card',
    nameRo: 'Răvașul Sorții',
    nameEn: "Fate's Scroll",
    descRo: 'Ai tras o carte din pachetul Provocărilor sau al Șansei.',
    descEn: 'Drew a card from the deck of challenges.',
    icon: '🎟️',
    rarity: 'common',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('fate_card') ? 1 : 0, max: 1 }),
  },

  // ================= RARE (7) =================
  {
    id: 'chug_trio',
    nameRo: 'Triplă Groapă',
    nameEn: 'Triple Chug',
    descRo: 'Ai căzut la 3 Gropi în aceeași partidă de joc.',
    descEn: 'Fell into 3 Chugs in a single match.',
    icon: '🔥',
    rarity: 'rare',
    targetCount: 3,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('chug_trio') ? 3 : Math.min(3, p.totalChugs || 0), max: 3 }),
  },
  {
    id: 'chug_quintet',
    nameRo: 'Purgatoriul Călugăresc',
    nameEn: "Monk's Purgatory",
    descRo: 'Ai căzut la 5 Gropi într-o singură partidă și ai rezistat!',
    descEn: 'Fell into 5 Chugs in a single game and survived!',
    icon: '☠️',
    rarity: 'rare',
    targetCount: 5,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('chug_quintet') ? 5 : Math.min(5, p.totalChugs || 0), max: 5 }),
  },
  {
    id: 'drinker_50',
    nameRo: 'Butea de 50 de Guri',
    nameEn: '50-Sip Barrel',
    descRo: 'Ai băut peste 50 de guri de bere într-un singur joc.',
    descEn: 'Drank over 50 sips of beer in a single game.',
    icon: '🍻',
    rarity: 'rare',
    targetCount: 50,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('drinker_50') ? 50 : Math.min(50, p.totalSips || 0), max: 50 }),
  },
  {
    id: 'monopoly_full_color',
    nameRo: 'Monopol pe Moșie',
    nameEn: 'Estate Monopoly',
    descRo: 'Ai deținut cel puțin 3 proprietăți cumpărate pe tabla de joc.',
    descEn: 'Owned at least 3 properties on the board simultaneously.',
    icon: '👑',
    rarity: 'rare',
    targetCount: 3,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('monopoly_full_color') ? 3 : 0, max: 3 }),
  },
  {
    id: 'jailbreak_key',
    nameRo: 'Marea Evadare',
    nameEn: 'The Great Jailbreak',
    descRo: 'Ai scăpat din temniță folosind o Cheie sau o Scrisoare de Iertare.',
    descEn: 'Escaped jail using a Key or Letter of Pardon.',
    icon: '🗝️',
    rarity: 'rare',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('jailbreak_key') ? 1 : 0, max: 1 }),
  },
  {
    id: 'give_up_surrender',
    nameRo: 'Steagul Alb',
    nameEn: 'White Flag',
    descRo: 'Ai recunoscut că paharul e mai tare și ai dat Give Up la Monopoly.',
    descEn: 'Surrendered in Monopoly to save your liver.',
    icon: '🏳️',
    rarity: 'rare',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('give_up_surrender') ? 1 : 0, max: 1 }),
  },
  {
    id: 'podium_winner',
    nameRo: 'Campion pe Podium',
    nameEn: 'Podium Champion',
    descRo: 'Ai terminat pe Locul 1 în clasamentul final al unei partide.',
    descEn: 'Placed 1st on the final game podium.',
    icon: '🥇',
    rarity: 'rare',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('podium_winner') ? 1 : 0, max: 1 }),
  },

  // ================= LEGENDARY (5) =================
  {
    id: 'legend_1000_sips',
    nameRo: 'LEGENDA CELOR 1000 DE GURI',
    nameEn: 'LEGEND OF 1,000 SIPS',
    descRo: 'Ai atins pragul monumental de 1.000 de guri de bere băute în cariera ta!',
    descEn: 'Drank a monumental 1,000 total sips across your career!',
    icon: '👑',
    rarity: 'legendary',
    targetCount: 1000,
    getCurrentProgress: (p) => ({ current: Math.min(1000, p.totalSips || 0), max: 1000 }),
  },
  {
    id: 'legend_50_chugs',
    nameRo: 'NEMURITORUL PURGATORIULUI',
    nameEn: 'THE IMMORTAL OF THE ABYSS',
    descRo: 'Ai supraviețuit la 50 de Gropi (Chugs) totale în carieră!',
    descEn: 'Survived 50 total Chugs throughout your monastic career!',
    icon: '⚡',
    rarity: 'legendary',
    targetCount: 50,
    getCurrentProgress: (p) => ({ current: Math.min(50, p.totalChugs || 0), max: 50 }),
  },
  {
    id: 'legend_25_games',
    nameRo: 'VETERANUL MĂNĂSTIRII',
    nameEn: 'MONASTERY VETERAN',
    descRo: 'Ai finalizat 25 de partide complete la Mănăstire.',
    descEn: 'Completed 25 full matches of Barbut.',
    icon: '🛡️',
    rarity: 'legendary',
    targetCount: 25,
    getCurrentProgress: (p) => ({ current: Math.min(25, p.gamesPlayed || 0), max: 25 }),
  },
  {
    id: 'legend_tycoon',
    nameRo: 'MOGULUL SUPREM AL AURULUI',
    nameEn: 'SUPREME GOLD TYCOON',
    descRo: 'Ai deținut cel puțin 8 proprietăți și peste 150 de Galbeni într-un singur meci de Monopoly!',
    descEn: 'Owned 8+ properties and 150+ gold simultaneously in Monopoly!',
    icon: '💰',
    rarity: 'legendary',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('legend_tycoon') ? 1 : 0, max: 1 }),
  },
  {
    id: 'legend_ascended',
    nameRo: 'SFÂNTUL NEATINS',
    nameEn: 'THE UNTOUCHABLE SAINT',
    descRo: 'Ai câștigat un joc cu minim 20 de ture jucate fără să cazi în nicio Groapă!',
    descEn: 'Completed a 20+ turn match without falling into a single Chug!',
    icon: '🌟',
    rarity: 'legendary',
    targetCount: 1,
    getCurrentProgress: (p) => ({ current: (p.unlockedAchievements || []).includes('legend_ascended') ? 1 : 0, max: 1 }),
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const getAchievementsWithProgress = (profile: Profile) => {
  const unlocked = new Set<string>(profile.unlockedAchievements || []);
  return ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.has(ach.id);
    const progress = ach.getCurrentProgress ? ach.getCurrentProgress(profile) : { current: isUnlocked ? 1 : 0, max: 1 };
    return {
      ...ach,
      titleRo: ach.nameRo,
      titleEn: ach.nameEn,
      unlocked: isUnlocked,
      current: progress.current,
      target: ach.targetCount || progress.max,
    };
  });
};
