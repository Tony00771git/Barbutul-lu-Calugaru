import { ThemeId, DiceSkin, GameMode } from '../types';

export type DailyQuestCategory =
  | 'dice'
  | 'theme'
  | 'pineapple'
  | 'crash'
  | 'duel'
  | 'casino'
  | 'boardgame'
  | 'general';

export interface DailyQuestDefinition {
  id: string;
  category: DailyQuestCategory;
  titleRo: string;
  titleEn: string;
  descRo: string;
  descEn: string;
  icon: string;
  target: number;
  coinReward: number; // Reward in Drunken Coins (Bănuți Turmentați 🪙)
  unitRo?: string;
  unitEn?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface UserDailyQuestState {
  questId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyQuestPoolState {
  dateKey: string; // "YYYY-MM-DD" in Europe/Bucharest timezone
  quests: UserDailyQuestState[];
  bonusClaimed: boolean; // Bonus chest reward (+50 coins) for finishing all 3
}

export interface QuestEvent {
  type:
    | 'roll_dice'
    | 'roll_double'
    | 'game_completed'
    | 'theme_played'
    | 'dice_skin_played'
    | 'crash_cashout'
    | 'crash_round_survived'
    | 'crash_high_mult_played'
    | 'duel_win'
    | 'duel_trivia_correct'
    | 'casino_spin'
    | 'casino_win'
    | 'casino_craps_win'
    | 'boardgame_completed'
    | 'boardgame_buy_property'
    | 'boardgame_escape_jail'
    | 'boardgame_gold_gain'
    | 'pineapple_win'
    | 'pineapple_fantasyland'
    | 'pineapple_royalties'
    | 'drink_sips'
    | 'drink_chug'
    | 'pass_dice'
    | 'visit_bazaar';
  value?: number;
  dice?: [number, number];
  theme?: ThemeId;
  diceSkin?: DiceSkin;
  mode?: GameMode;
  isWinner?: boolean;
  multiplier?: number;
  count?: number;
}

// Complete Codex of 36 Distinct Monastic Daily Quests
export const DAILY_QUEST_DEFINITIONS: DailyQuestDefinition[] = [
  // --- DICE ROLLS ---
  {
    id: 'roll_6_6',
    category: 'dice',
    titleRo: 'Groapa Sacră 6 - 6',
    titleEn: 'Sacred Pit 6 - 6',
    descRo: 'Aruncă o dublă de 6 - 6 în orice mod de joc.',
    descEn: 'Roll a 6-6 double in any game mode.',
    icon: '🎲',
    target: 1,
    coinReward: 25,
    unitRo: 'dublă',
    unitEn: 'double',
    difficulty: 'medium',
  },
  {
    id: 'roll_1_1',
    category: 'dice',
    titleRo: 'Raiul Sfânt 1 - 1',
    titleEn: 'Holy Heaven 1 - 1',
    descRo: 'Aruncă o dublă de 1 - 1 (Rai) în orice mod de joc.',
    descEn: 'Roll a 1-1 double (Holy Heaven) in any game mode.',
    icon: '✨',
    target: 1,
    coinReward: 25,
    unitRo: 'dublă',
    unitEn: 'double',
    difficulty: 'medium',
  },
  {
    id: 'roll_3_3',
    category: 'dice',
    titleRo: 'Trinitatea Zarurilor 3 - 3',
    titleEn: 'Trinity Doubles 3 - 3',
    descRo: 'Aruncă o dublă de 3 - 3 în orice mod de joc.',
    descEn: 'Roll a 3-3 double in any game mode.',
    icon: '🎲',
    target: 1,
    coinReward: 20,
    unitRo: 'dublă',
    unitEn: 'double',
    difficulty: 'easy',
  },
  {
    id: 'roll_5_5',
    category: 'dice',
    titleRo: 'Cincisprezece Mănăstiresc 5 - 5',
    titleEn: 'Monastic Five-Five 5 - 5',
    descRo: 'Aruncă o dublă de 5 - 5 în orice mod de joc.',
    descEn: 'Roll a 5-5 double in any game mode.',
    icon: '🎲',
    target: 1,
    coinReward: 20,
    unitRo: 'dublă',
    unitEn: 'double',
    difficulty: 'easy',
  },
  {
    id: 'roll_any_doubles_3',
    category: 'dice',
    titleRo: 'Maestru al Dublelor',
    titleEn: 'Master of Doubles',
    descRo: 'Aruncă 3 duble în orice mod de joc pe parcursul zilei.',
    descEn: 'Roll 3 doubles in any game mode throughout the day.',
    icon: '🔥',
    target: 3,
    coinReward: 30,
    unitRo: 'duble',
    unitEn: 'doubles',
    difficulty: 'medium',
  },
  {
    id: 'roll_total_10',
    category: 'dice',
    titleRo: 'Zaruri Neobosite',
    titleEn: 'Tireless Dice',
    descRo: 'Aruncă zarurile de 10 ori în orice partidă.',
    descEn: 'Roll the dice 10 times across any game mode.',
    icon: '🎲',
    target: 10,
    coinReward: 20,
    unitRo: 'aruncări',
    unitEn: 'rolls',
    difficulty: 'easy',
  },
  {
    id: 'roll_total_25',
    category: 'dice',
    titleRo: 'Maratonul Zarurilor',
    titleEn: 'Dice Marathon',
    descRo: 'Aruncă zarurile de 25 de ori în total astăzi.',
    descEn: 'Roll the dice 25 times in total today.',
    icon: '🏆',
    target: 25,
    coinReward: 40,
    unitRo: 'aruncări',
    unitEn: 'rolls',
    difficulty: 'hard',
  },

  // --- THEMES & CUSTOMIZATIONS ---
  {
    id: 'play_cellar_theme',
    category: 'theme',
    titleRo: 'Oaspeți în Pivnița de Bere',
    titleEn: 'Cellar Brewing Guest',
    descRo: 'Joacă și finalizează un meci în tema Pivniței de Bere 🪵.',
    descEn: 'Play and finish a game in the Brewery Cellar theme 🪵.',
    icon: '🪵',
    target: 1,
    coinReward: 25,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },
  {
    id: 'play_dungeon_theme',
    category: 'theme',
    titleRo: 'Pedeapsă în Temniță',
    titleEn: 'Dungeon Penance',
    descRo: 'Joacă și finalizează un meci în tema Temniței Mănăstirii ⛓️.',
    descEn: 'Play and finish a game in the Monastery Dungeon theme ⛓️.',
    icon: '⛓️',
    target: 1,
    coinReward: 25,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },
  {
    id: 'play_greathall_theme',
    category: 'theme',
    titleRo: 'Festin în Sala Mare',
    titleEn: 'Great Hall Feast',
    descRo: 'Joacă și finalizează un meci în Sala Mare a Mănăstirii 🏰.',
    descEn: 'Play and finish a game in the Monastery Great Hall theme 🏰.',
    icon: '🏰',
    target: 1,
    coinReward: 25,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },
  {
    id: 'play_gold_dice',
    category: 'theme',
    titleRo: 'Zaruri Aurite de Ceremonie',
    titleEn: 'Ceremonial Golden Dice',
    descRo: 'Joacă un meci având echipate Zarurile Aurite 🪙.',
    descEn: 'Play a match with the Golden Dice skin equipped 🪙.',
    icon: '✨',
    target: 1,
    coinReward: 20,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },
  {
    id: 'play_bone_dice',
    category: 'theme',
    titleRo: 'Zaruri Străvechi din Os',
    titleEn: 'Ancient Bone Dice',
    descRo: 'Joacă un meci având echipate Zarurile din Os 🦴.',
    descEn: 'Play a match with the Bone Dice skin equipped 🦴.',
    icon: '🦴',
    target: 1,
    coinReward: 20,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },
  {
    id: 'play_wood_dice',
    category: 'theme',
    titleRo: 'Zaruri Tradiționale de Lemn',
    titleEn: 'Traditional Wooden Dice',
    descRo: 'Joacă un meci având echipate Zarurile din Lemn 🪵.',
    descEn: 'Play a match with the Wooden Dice skin equipped 🪵.',
    icon: '🪵',
    target: 1,
    coinReward: 20,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },

  // --- PINEAPPLE POKER ---
  {
    id: 'win_pineapple',
    category: 'pineapple',
    titleRo: 'Victoria Ananasului',
    titleEn: 'Pineapple Triumph',
    descRo: 'Câștigă un meci de Pineapple Open-Face Poker.',
    descEn: 'Win one match of Pineapple Open-Face Poker.',
    icon: '🍍',
    target: 1,
    coinReward: 35,
    unitRo: 'victorie',
    unitEn: 'win',
    difficulty: 'medium',
  },
  {
    id: 'pineapple_fantasyland',
    category: 'pineapple',
    titleRo: 'Tărâmul Viselor Fantasy Land',
    titleEn: 'Fantasy Land Journey',
    descRo: 'Califică-te în Fantasy Land la Pineapple Poker.',
    descEn: 'Qualify for Fantasy Land in Pineapple Poker.',
    icon: '👑',
    target: 1,
    coinReward: 45,
    unitRo: 'intrare',
    unitEn: 'entry',
    difficulty: 'hard',
  },
  {
    id: 'pineapple_royalties_10',
    category: 'pineapple',
    titleRo: 'Regalitate la Ananas',
    titleEn: 'Pineapple Royalties',
    descRo: 'Acumulează 10 puncte de redevențe (royalties) în Pineapple.',
    descEn: 'Accumulate 10 royalty points in Pineapple Poker.',
    icon: '💎',
    target: 10,
    coinReward: 35,
    unitRo: 'pct',
    unitEn: 'pts',
    difficulty: 'medium',
  },

  // --- CRASH (ZBORUL DRAGONULUI) ---
  {
    id: 'crash_cashout_3x',
    category: 'crash',
    titleRo: 'Zbor Înalt x3.00+',
    titleEn: 'High Flight x3.00+',
    descRo: 'Efectuează Cash Out la multiplicator x3.00 sau mai mare în Crash.',
    descEn: 'Cash out at multiplier x3.00 or higher in Crash.',
    icon: '🚀',
    target: 1,
    coinReward: 30,
    unitRo: 'salvare',
    unitEn: 'cashout',
    difficulty: 'medium',
  },
  {
    id: 'crash_cashout_5x',
    category: 'crash',
    titleRo: 'Zbor Legendar x5.00+',
    titleEn: 'Legendary Flight x5.00+',
    descRo: 'Efectuează Cash Out la multiplicator x5.00 sau mai mare în Crash.',
    descEn: 'Cash out at multiplier x5.00 or higher in Crash.',
    icon: '🐉',
    target: 1,
    coinReward: 45,
    unitRo: 'salvare',
    unitEn: 'cashout',
    difficulty: 'hard',
  },
  {
    id: 'crash_survive_3_rounds',
    category: 'crash',
    titleRo: 'Supraviețuitor al Dragonului',
    titleEn: 'Dragon Survivor',
    descRo: 'Salvează-te cu succes în 3 runde de Crash.',
    descEn: 'Cash out successfully in 3 Crash rounds.',
    icon: '🛡️',
    target: 3,
    coinReward: 30,
    unitRo: 'runde',
    unitEn: 'rounds',
    difficulty: 'medium',
  },
  {
    id: 'crash_high_mult_match',
    category: 'crash',
    titleRo: 'Curajul Multiplicatoarelor Mari',
    titleEn: 'High Multipliers Challenger',
    descRo: 'Joacă un meci de Crash pe modul Multiplicatoare Mari 🚀.',
    descEn: 'Play a Crash match in High Multipliers mode 🚀.',
    icon: '⚡',
    target: 1,
    coinReward: 30,
    unitRo: 'meci',
    unitEn: 'game',
    difficulty: 'easy',
  },

  // --- DUEL 1V1 ---
  {
    id: 'win_duel',
    category: 'duel',
    titleRo: 'Campionul Duelului 1v1',
    titleEn: '1v1 Duel Champion',
    descRo: 'Câștigă un meci de Duel 1v1 împotriva unui rival sau bot.',
    descEn: 'Win a 1v1 Duel match against a rival or bot.',
    icon: '⚔️',
    target: 1,
    coinReward: 35,
    unitRo: 'victorie',
    unitEn: 'win',
    difficulty: 'medium',
  },
  {
    id: 'duel_trivia_2',
    category: 'duel',
    titleRo: 'Înțeleptul Mănăstirii',
    titleEn: 'Monastic Scholar',
    descRo: 'Răspunde corect la 2 întrebări de cultură în Duel.',
    descEn: 'Answer 2 trivia questions correctly during a Duel.',
    icon: '🧠',
    target: 2,
    coinReward: 25,
    unitRo: 'răspunsuri',
    unitEn: 'answers',
    difficulty: 'easy',
  },

  // --- CASINO & SLOTS ---
  {
    id: 'casino_spins_5',
    category: 'casino',
    titleRo: 'Păcănelele Mănăstirești',
    titleEn: 'Monastery Slots Spinner',
    descRo: 'Trage maneta la Păcănelele Călugărești de 5 ori.',
    descEn: 'Spin the Monastery Slot Machine 5 times.',
    icon: '🎰',
    target: 5,
    coinReward: 25,
    unitRo: 'rotiri',
    unitEn: 'spins',
    difficulty: 'easy',
  },
  {
    id: 'win_casino',
    category: 'casino',
    titleRo: 'Regele Cazinoului',
    titleEn: 'Casino High Roller',
    descRo: 'Câștigă o sesiune la Cazinoul Mănăstiresc.',
    descEn: 'Win a full session in the Monastery Casino.',
    icon: '💰',
    target: 1,
    coinReward: 35,
    unitRo: 'victorie',
    unitEn: 'win',
    difficulty: 'medium',
  },
  {
    id: 'casino_craps_win',
    category: 'casino',
    titleRo: 'Noroc la Craps Pass Line',
    titleEn: 'Craps Pass Line Luck',
    descRo: 'Câștigă un pariu Pass Line la Barbutul American (Craps).',
    descEn: 'Win a Pass Line bet in American Barbut (Craps).',
    icon: '🎲',
    target: 1,
    coinReward: 30,
    unitRo: 'câștig',
    unitEn: 'win',
    difficulty: 'medium',
  },

  // --- BOARDGAME MONOPOLY ---
  {
    id: 'play_boardgame',
    category: 'boardgame',
    titleRo: 'Pelerinaj pe Tabla Mănăstirii',
    titleEn: 'Boardgame Pilgrimage',
    descRo: 'Finalizează o partidă completă pe Tabla Mănăstirii.',
    descEn: 'Complete a full match of the Monastery Boardgame.',
    icon: '🗺️',
    target: 1,
    coinReward: 35,
    unitRo: 'partidă',
    unitEn: 'match',
    difficulty: 'medium',
  },
  {
    id: 'boardgame_buy_2',
    category: 'boardgame',
    titleRo: 'Proprietar Monahal',
    titleEn: 'Monastery Landlord',
    descRo: 'Cumpără 2 proprietăți pe Tabla Mănăstirii.',
    descEn: 'Buy 2 properties on the Monastery Boardgame.',
    icon: '🏰',
    target: 2,
    coinReward: 30,
    unitRo: 'proprietăți',
    unitEn: 'properties',
    difficulty: 'medium',
  },
  {
    id: 'boardgame_escape_jail',
    category: 'boardgame',
    titleRo: 'Evadare din Temniță',
    titleEn: 'Jailbreak Freedom',
    descRo: 'Scapă din Temniță (cu zaruri duble, cheie sau plată).',
    descEn: 'Escape from Jail (with doubles, key, or bail).',
    icon: '🗝️',
    target: 1,
    coinReward: 25,
    unitRo: 'evadare',
    unitEn: 'escape',
    difficulty: 'easy',
  },
  {
    id: 'boardgame_gold_30',
    category: 'boardgame',
    titleRo: 'Pungă cu Galbeni (30 🪙)',
    titleEn: 'Pouch of Gold (30 🪙)',
    descRo: 'Adună un total de 30 Galbeni în timpul unui meci de Tablă.',
    descEn: 'Accumulate 30 Gold during a Boardgame match.',
    icon: '🪙',
    target: 30,
    coinReward: 30,
    unitRo: 'galbeni',
    unitEn: 'gold',
    difficulty: 'medium',
  },

  // --- GENERAL GAMEPLAY & SIPS ---
  {
    id: 'win_classic_barbut',
    category: 'general',
    titleRo: 'Triumf la Barbut Clasic',
    titleEn: 'Classic Barbut Triumph',
    descRo: 'Câștigă un meci în modul Clasic Barbut.',
    descEn: 'Win a game in the Classic Barbut mode.',
    icon: '🍻',
    target: 1,
    coinReward: 30,
    unitRo: 'victorie',
    unitEn: 'win',
    difficulty: 'easy',
  },
  {
    id: 'drink_15_sips',
    category: 'general',
    titleRo: 'Înghițituri de Aur (15 Guri)',
    titleEn: 'Golden Gulp (15 Sips)',
    descRo: 'Bea 15 guri de bere în total astăzi în orice joc.',
    descEn: 'Drink a total of 15 sips today across any game.',
    icon: '🍺',
    target: 15,
    coinReward: 25,
    unitRo: 'guri',
    unitEn: 'sips',
    difficulty: 'easy',
  },
  {
    id: 'drink_30_sips',
    category: 'general',
    titleRo: 'Setea Călugărului (30 Guri)',
    titleEn: "Monk's Thirst (30 Sips)",
    descRo: 'Bea 30 de guri de bere în total astăzi.',
    descEn: 'Drink 30 sips in total today across matches.',
    icon: '🍻',
    target: 30,
    coinReward: 40,
    unitRo: 'guri',
    unitEn: 'sips',
    difficulty: 'hard',
  },
  {
    id: 'drink_1_chug',
    category: 'general',
    titleRo: 'Groapa Curajului (1 Chug)',
    titleEn: 'Abyss of Courage (1 Chug)',
    descRo: 'Bea un pahar până la fund (Groapă / Chug).',
    descEn: 'Drink a full cup (Groapă / Chug).',
    icon: '💀',
    target: 1,
    coinReward: 30,
    unitRo: 'groapă',
    unitEn: 'chug',
    difficulty: 'medium',
  },
  {
    id: 'pass_dice_2',
    category: 'general',
    titleRo: 'Predarea Zarului',
    titleEn: 'Passing the Dice',
    descRo: 'Pasează tura / zarurile de 2 ori în Barbut.',
    descEn: 'Pass the dice/turn 2 times in Barbut.',
    icon: '🤝',
    target: 2,
    coinReward: 20,
    unitRo: 'pasări',
    unitEn: 'passes',
    difficulty: 'easy',
  },
  {
    id: 'play_2_games',
    category: 'general',
    titleRo: 'Pelerinaj Dublu (2 Meciuri)',
    titleEn: 'Double Pilgrimage (2 Matches)',
    descRo: 'Joacă și finalizează 2 meciuri în orice mod astăzi.',
    descEn: 'Play and complete 2 games in any mode today.',
    icon: '📜',
    target: 2,
    coinReward: 30,
    unitRo: 'meciuri',
    unitEn: 'matches',
    difficulty: 'easy',
  },
  {
    id: 'visit_bazaar',
    category: 'general',
    titleRo: 'Cumpărături la Bazar',
    titleEn: 'Bazaar Visit',
    descRo: 'Deschide și explorează Bazarul Călugăresc (Magazinul).',
    descEn: 'Open and explore the Monastic Bazaar (Shop).',
    icon: '🏺',
    target: 1,
    coinReward: 15,
    unitRo: 'vizită',
    unitEn: 'visit',
    difficulty: 'easy',
  },
];

// Map for quick quest lookups
export const DAILY_QUEST_MAP = new Map<string, DailyQuestDefinition>(
  DAILY_QUEST_DEFINITIONS.map(q => [q.id, q])
);

/**
 * Returns current date string formatted as "YYYY-MM-DD" strictly in Europe/Bucharest timezone.
 * Resets precisely at 12:00 AM (00:00 midnight) Romania time.
 */
export function getRomaniaDateKey(date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Bucharest',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Output format: "YYYY-MM-DD"
  } catch (e) {
    // Fallback if Intl timeZone is unsupported
    const d = new Date(date.getTime() + (3 * 3600 * 1000));
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Calculates remaining time until the next 12:00 AM (00:00 midnight) in Romania.
 */
export function getTimeUntilRomaniaMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
} {
  const now = new Date();
  
  // Format current Romanian time
  const roParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bucharest',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  let curH = 0;
  let curM = 0;
  let curS = 0;

  for (const part of roParts) {
    if (part.type === 'hour') curH = parseInt(part.value, 10);
    if (part.type === 'minute') curM = parseInt(part.value, 10);
    if (part.type === 'second') curS = parseInt(part.value, 10);
  }

  // Seconds elapsed in current day (in Romania)
  const elapsedSeconds = curH * 3600 + curM * 60 + curS;
  const totalDaySeconds = 24 * 3600;
  const remainingSeconds = Math.max(0, totalDaySeconds - elapsedSeconds);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds: remainingSeconds,
    formatted,
  };
}

/**
 * Deterministic pseudo-random integer generator based on string seed (Murmur/LCG).
 */
function hashStringToSeed(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return (hash >>> 0);
}

function createRng(seed: number) {
  let s = seed;
  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Selects 3 distinct and diverse daily quests for the specified dateKey.
 * Groups ensure category variety across dice, game modes, themes, and gameplay.
 */
export function getDailyQuestsForDate(dateKey: string): DailyQuestDefinition[] {
  const seed = hashStringToSeed(`barbut_daily_quests_seed_${dateKey}`);
  const rng = createRng(seed);

  // Group quests by diverse pools
  const poolA = DAILY_QUEST_DEFINITIONS.filter(q => q.category === 'dice' || q.category === 'general');
  const poolB = DAILY_QUEST_DEFINITIONS.filter(q => q.category === 'pineapple' || q.category === 'crash' || q.category === 'duel' || q.category === 'casino' || q.category === 'boardgame');
  const poolC = DAILY_QUEST_DEFINITIONS.filter(q => q.category === 'theme' || q.category === 'general' || q.category === 'dice');

  // Shuffle pools with deterministic rng
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shuffledA = shuffle(poolA);
  const shuffledB = shuffle(poolB);
  const shuffledC = shuffle(poolC);

  const selected: DailyQuestDefinition[] = [];
  const selectedIds = new Set<string>();

  // Pick first from Pool B (Game mode specific)
  for (const q of shuffledB) {
    if (!selectedIds.has(q.id)) {
      selected.push(q);
      selectedIds.add(q.id);
      break;
    }
  }

  // Pick second from Pool A (Dice or General)
  for (const q of shuffledA) {
    if (!selectedIds.has(q.id)) {
      selected.push(q);
      selectedIds.add(q.id);
      break;
    }
  }

  // Pick third from Pool C or any remaining
  const remaining = shuffle(DAILY_QUEST_DEFINITIONS.filter(q => !selectedIds.has(q.id)));
  for (const q of remaining) {
    if (!selectedIds.has(q.id)) {
      selected.push(q);
      selectedIds.add(q.id);
      if (selected.length >= 3) break;
    }
  }

  return selected.slice(0, 3);
}

/**
 * Initializes or updates user daily quest pool for today's Romania date.
 */
export function initializeDailyQuestState(existingState?: DailyQuestPoolState | null): DailyQuestPoolState {
  const todayKey = getRomaniaDateKey();

  if (existingState && existingState.dateKey === todayKey && existingState.quests?.length === 3) {
    return existingState;
  }

  const questsForToday = getDailyQuestsForDate(todayKey);
  const userQuests: UserDailyQuestState[] = questsForToday.map(q => ({
    questId: q.id,
    progress: 0,
    completed: false,
    claimed: false,
  }));

  return {
    dateKey: todayKey,
    quests: userQuests,
    bonusClaimed: false,
  };
}

/**
 * Checks how much progress a quest receives from an incoming QuestEvent.
 */
export function evaluateQuestProgress(
  questDef: DailyQuestDefinition,
  event: QuestEvent,
  currentProgress: number
): number {
  if (currentProgress >= questDef.target) return currentProgress;

  switch (questDef.id) {
    // --- DICE ---
    case 'roll_6_6':
      if (event.type === 'roll_double' && event.dice && event.dice[0] === 6 && event.dice[1] === 6) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'roll_1_1':
      if (event.type === 'roll_double' && event.dice && event.dice[0] === 1 && event.dice[1] === 1) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'roll_3_3':
      if (event.type === 'roll_double' && event.dice && event.dice[0] === 3 && event.dice[1] === 3) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'roll_5_5':
      if (event.type === 'roll_double' && event.dice && event.dice[0] === 5 && event.dice[1] === 5) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'roll_any_doubles_3':
      if (event.type === 'roll_double') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'roll_total_10':
    case 'roll_total_25':
      if (event.type === 'roll_dice') {
        return Math.min(questDef.target, currentProgress + (event.count || 1));
      }
      break;

    // --- THEMES & SKINS ---
    case 'play_cellar_theme':
      if (event.type === 'theme_played' && event.theme === 'cellar') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'play_dungeon_theme':
      if (event.type === 'theme_played' && event.theme === 'dungeon') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'play_greathall_theme':
      if (event.type === 'theme_played' && event.theme === 'great_hall') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'play_gold_dice':
      if (event.type === 'dice_skin_played' && event.diceSkin === 'gold') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'play_bone_dice':
      if (event.type === 'dice_skin_played' && event.diceSkin === 'bone') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'play_wood_dice':
      if (event.type === 'dice_skin_played' && event.diceSkin === 'wood') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    // --- PINEAPPLE ---
    case 'win_pineapple':
      if (event.type === 'pineapple_win') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'pineapple_fantasyland':
      if (event.type === 'pineapple_fantasyland') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'pineapple_royalties_10':
      if (event.type === 'pineapple_royalties') {
        return Math.min(questDef.target, currentProgress + (event.value || 1));
      }
      break;

    // --- CRASH ---
    case 'crash_cashout_3x':
      if (event.type === 'crash_cashout' && (event.multiplier || 0) >= 3.0) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'crash_cashout_5x':
      if (event.type === 'crash_cashout' && (event.multiplier || 0) >= 5.0) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'crash_survive_3_rounds':
      if (event.type === 'crash_round_survived') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'crash_high_mult_match':
      if (event.type === 'crash_high_mult_played') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    // --- DUEL ---
    case 'win_duel':
      if (event.type === 'duel_win') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'duel_trivia_2':
      if (event.type === 'duel_trivia_correct') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    // --- CASINO ---
    case 'casino_spins_5':
      if (event.type === 'casino_spin') {
        return Math.min(questDef.target, currentProgress + (event.count || 1));
      }
      break;

    case 'win_casino':
      if (event.type === 'casino_win') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'casino_craps_win':
      if (event.type === 'casino_craps_win') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    // --- BOARDGAME ---
    case 'play_boardgame':
      if (event.type === 'boardgame_completed') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'boardgame_buy_2':
      if (event.type === 'boardgame_buy_property') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'boardgame_escape_jail':
      if (event.type === 'boardgame_escape_jail') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'boardgame_gold_30':
      if (event.type === 'boardgame_gold_gain') {
        return Math.min(questDef.target, currentProgress + (event.value || 1));
      }
      break;

    // --- GENERAL ---
    case 'win_classic_barbut':
      if (event.type === 'game_completed' && event.mode === 'normal' && event.isWinner) {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'drink_15_sips':
    case 'drink_30_sips':
      if (event.type === 'drink_sips') {
        return Math.min(questDef.target, currentProgress + (event.count || 1));
      }
      break;

    case 'drink_1_chug':
      if (event.type === 'drink_chug') {
        return Math.min(questDef.target, currentProgress + (event.count || 1));
      }
      break;

    case 'pass_dice_2':
      if (event.type === 'pass_dice') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'play_2_games':
      if (event.type === 'game_completed') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    case 'visit_bazaar':
      if (event.type === 'visit_bazaar') {
        return Math.min(questDef.target, currentProgress + 1);
      }
      break;

    default:
      break;
  }

  return currentProgress;
}
