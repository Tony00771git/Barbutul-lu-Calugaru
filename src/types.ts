export type GameMode = 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash';
export type Language = 'ro' | 'en';
export type ThemeId = 'tavern' | 'cellar' | 'great_hall' | 'dungeon' | 'crypt';
export type DiceSkin =
  | 'gold'
  | 'bone'
  | 'wood'
  | 'ruby'
  | 'ice'
  | 'obsidian'
  | 'amethyst'
  | 'crimson_dragon'
  | 'celestial_gold'
  | 'spectral_jade'
  | 'tavern_oak';
export type Difficulty = 'weak' | 'medium' | 'extreme' | 'nightmare';
export type DuelSubmode = 'general' | 'football';
export type DuelDifficulty = 'easy' | 'medium' | 'hard';

// Crash (1v1 Dragon Multiplier) Types
export type CrashBotStyle = 'prudent' | 'risky';
export type CrashStakeMode = 'guri' | 'dynamic' | 'high_mult' | 'groapa';
export type CrashRoundStakeType = 'guri' | 'groapa';

export interface CrashPlayerState {
  id: string;
  name: string;
  avatarIcon: string;
  color: string;
  isHost: boolean;
  isBot?: boolean;
  botStyle?: CrashBotStyle;
  connected: boolean;
  autoCashoutEnabled: boolean;
  autoCashoutTarget?: number;
  cashedOutAt?: number | null;         // Multiplier at cashout, null if not cashed out / crashed
  score: number;                // betValue * cashedOutAt, or 0
  roundSipsToDrink: number;     // sips to drink this round (score difference)
  totalGuriAcumulate: number;   // cumulative sips drunk, compared with threshold
  roundGroapaToDrink?: number;  // 1 if player has to drink a groapa this round
  totalGroapaAcumulate?: number;// total gropi drunk
  chickenStreak: number;        // 0-3, for easter egg (< 1.50)
  isReadyNextRound: boolean;
}

export interface CrashRound {
  roundNumber: number;
  phase: 'prep' | 'flying' | 'crashed' | 'resolved';
  stakeType: CrashRoundStakeType; // 'guri' or 'groapa'
  betValue: number;             // 1-10 sips if guri, or 1 groapa
  crashPoint: number;           // Multiplier where dragon crashes (e.g. 2.45)
  roundStartTimestamp: number;  // server timestamp ms when flying phase starts
  crashedAtTimestamp?: number;  // timestamp ms when crash occurred
  bothCrashed?: boolean;        // true if all active players crashed
  isGroapaRound?: boolean;      // helper flag
}

export interface CrashMatchSettings {
  sipsThreshold: number;        // e.g. 30 sips to end game (first to reach loses)
  stakeMode: CrashStakeMode;    // 'guri' | 'groapa' | 'dynamic'
  groapaThreshold?: number;     // e.g. 3 gropi to end game in groapa mode
}

export interface CrashHistoryItem {
  roundNumber: number;
  multiplier: number;
  stakeType?: CrashRoundStakeType;
  betValue?: number;
}

export interface CrashRoomState {
  code: string;
  hostPlayerId: string;
  players: CrashPlayerState[];
  settings: CrashMatchSettings;
  status: 'lobby' | 'in_game' | 'finished';
  currentRound: CrashRound;
  winnerId: string | null;
  loserId: string | null;
  history?: CrashHistoryItem[];
  lastEmote?: TavernEmoteMessage | null;
  updatedAt?: any;
}

// Pineapple Poker (Open Face Chinese Poker 1v1) Types
export type PlayingCardSuit = 's' | 'h' | 'd' | 'c';
export type PlayingCardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface PlayingCard {
  id: string; // e.g. "As", "Kh", "Td"
  rank: PlayingCardRank;
  suit: PlayingCardSuit;
}

export type PineappleBotDifficulty = 'easy' | 'medium' | 'hard';

export interface PineappleBoard {
  top: PlayingCard[];    // max 3
  middle: PlayingCard[]; // max 5
  bottom: PlayingCard[]; // max 5
}

export interface PineapplePlayerState {
  id: string;
  name: string;
  avatarIcon: string;
  color: string;
  isHost: boolean;
  isBot?: boolean;
  botDifficulty?: PineappleBotDifficulty;
  connected: boolean;
  board: PineappleBoard;
  currentHandCards: PlayingCard[]; // Cards in hand waiting to be placed/discarded
  discarded: PlayingCard[];        // Burned cards
  inFantasyLand: boolean;          // Playing in Fantasy Land this hand
  qualifiesNextFantasyLand: boolean; // True if requirement met this hand
  sipsAccumulated: number;         // Float, exact decimal value
  pointsAccumulated?: number;      // Total positive OFC points accumulated in current match
  handLocked: boolean;             // Finished current round placement
  isReadyNextHand: boolean;
}

export interface PineappleHandResult {
  handNumber: number;
  playerAId: string;
  playerBId: string;
  foulA: boolean;
  foulB: boolean;
  topWinner: 'A' | 'B' | 'tie';
  middleWinner: 'A' | 'B' | 'tie';
  bottomWinner: 'A' | 'B' | 'tie';
  scoopWinner: 'A' | 'B' | null;
  topScoreA: number;
  middleScoreA: number;
  bottomScoreA: number;
  scoopScoreA: number;
  rowPointsA: number;
  rowPointsB: number;
  royaltiesTopA: number;
  royaltiesMiddleA: number;
  royaltiesBottomA: number;
  royaltiesTopB: number;
  royaltiesMiddleB: number;
  royaltiesBottomB: number;
  totalRoyaltiesA: number;
  totalRoyaltiesB: number;
  grossPointsA?: number;           // Total gross hand points scored by Player A
  grossPointsB?: number;           // Total gross hand points scored by Player B
  netScoreA: number;
  netScoreB: number;
  sipsAddedA: number;
  sipsAddedB: number;
  handDescriptionA: { top: string; middle: string; bottom: string };
  handDescriptionB: { top: string; middle: string; bottom: string };
}

export interface PineappleMatchSettings {
  sipsPerPoint: number; // e.g. 0.5
  sipsToEndGame: number; // e.g. 30
}

export interface PineappleRoomState {
  code: string;
  hostPlayerId: string;
  players: PineapplePlayerState[];
  settings: PineappleMatchSettings;
  status: 'lobby' | 'in_hand' | 'hand_scoring' | 'finished';
  currentHand: number;
  currentRoundInHand: number; // 1 = 5 cards, 2..5 = 3 cards (2 place, 1 discard)
  deck: PlayingCard[];
  lastHandResult?: PineappleHandResult | null;
  winnerId?: string | null;
  loserId?: string | null;
  lastEmote?: TavernEmoteMessage | null;
  updatedAt?: any;
}

// Casino Mode Types
export type CasinoBetType = 'over7' | 'under7' | 'even' | 'odd' | 'number';

export interface CasinoPlayer {
  id: string;
  name: string;
  avatarIcon: string;
  color: string;
  isHost: boolean;
  isBot?: boolean;
  connected: boolean;
  balance: number;        // sold curent, niciodată negativ
  eliminated: boolean;
  eliminatedAtRound?: number;
  guriTotal: number;
  groapaTotal: number;
}

export interface CasinoBet {
  playerId: string;
  type: CasinoBetType;
  numberValue?: number;    // 1-6, doar pentru type: 'number'
  amount: number;
}

export interface CasinoPenalty {
  type: 'sips' | 'groapa';
  amount?: number; // 1-10 dacă sips
}

export type CasinoRoundPhase = 'betting' | 'rolling' | 'resolved';

export interface CasinoRound {
  roundNumber: number;
  penalty: CasinoPenalty;
  bets: CasinoBet[];
  diceResult?: [number, number];
  phase: CasinoRoundPhase;
  bettingEndsAt?: number;
  lockedPlayerIds: string[];
  payouts?: Record<string, {
    totalWon: number;
    totalLost: number;
    netProfit: number;
    winningBetsCount: number;
    details: string[];
    isFraudulent?: boolean;
    fraudReason?: string;
    fraudFine?: number;
    fraudSips?: number;
    isNonBettor?: boolean;
  }>;
  eliminatedThisRound?: string[];
  lowestBalanceDrinkers?: string[];
  fraudulentDrinkers?: string[];
  nonBettorDrinkers?: string[];
}

export interface CasinoRoomState {
  code: string;
  startingChips: number;
  hostPlayerId: string;
  players: CasinoPlayer[];
  status: 'lobby' | 'in_game' | 'finished';
  currentRound: number;
  round: CasinoRound;
  winnerId?: string | null;
  eliminationOrder?: string[]; // Player IDs in order of elimination (first eliminated -> last eliminated)
  lastEmote?: TavernEmoteMessage | null;
  updatedAt?: any;
}

export interface DuelQuestion {
  id: number;
  q_ro: string;
  q_en: string;
  a_ro: [string, string, string, string];
  a_en: [string, string, string, string];
  correct: number; // 0-3
}

export interface DuelPlayerInfo {
  id: string;
  name: string;
  avatarIcon: string;
  color: string;
  isHost: boolean;
  connected: boolean;
}

export interface DuelRoomState {
  code: string;
  submode: DuelSubmode;
  difficulty: DuelDifficulty;
  targetPoints: number; // Target drink points limit (e.g. 30p, first to reach/exceed loses)
  hostPlayer: DuelPlayerInfo;
  guestPlayer: DuelPlayerInfo | null;
  status: 'lobby' | 'in_game' | 'finished';
  currentRound: number;
  phase: 'reveal' | 'race' | 'resolution';
  revealEndsAt: number;
  lockedOutPlayerId: string | null;
  answeredBy?: string | null;
  roundResult: {
    winnerId: string | null;
    loserIds: string[];
    stakeType: 'sips' | 'chug';
    stakeAmount: number;
    correctAnswerRo: string;
    correctAnswerEn: string;
    reason: 'first_correct' | 'rebound_correct' | 'both_wrong';
    drinkCountdownEndsAt?: number | null;
    isTargetReached?: boolean;
    targetLoserId?: string | null;
  } | null;
  scores: Record<string, { sipsTotal: number; chugsTotal: number; roundsWon: number; correct: number; wrong: number }>;
  stake: { type: 'sips' | 'chug'; count: number };
  currentQuestion: {
    id: number;
    q_ro: string;
    q_en: string;
    a_ro: [string, string, string, string];
    a_en: [string, string, string, string];
    correct?: number;
  } | null;
  lastEmote?: TavernEmoteMessage | null;
}

export interface DuelPlayer {
  id: string;
  name: string;
  profileId?: string;
  avatarIcon: string;
  color: string;
  guriTotal: number;
  groapaTotal: number;
}

export interface Profile {
  id: string;
  name: string;
  avatarIcon?: string;
  isMaster?: boolean; // True for the primary account profile (Master Account)
  gamesPlayed: number;
  totalSips: number;
  totalChugs: number;
  totalXP?: number;
  drunkenCoins?: number; // Ingame currency: Drunken Coins (Bănuți Turmentați 🍺🪙)
  currentLevel?: number;
  currentTitle_ro?: string;
  currentTitle_en?: string;
  winsBoardgame?: number;
  winsDuel?: number;
  winsCasino?: number;
  winsPineapple?: number;
  winsCrash?: number;
  gamesPlayedCrash?: number;
  sipsDrunkCrash?: number;
  totalPineapplePoints?: number;
  unlockedAchievements?: string[];
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  profileId?: string; // matched profile if any
  color: string;
  avatarIcon: string;
  
  // Normal game stats
  sipsTurn: number;
  sipsTotal: number;
  chugsTotal: number;
  passesCount: number;

  // Boardgame stats
  position: number;
  gold: number;
  properties: number[]; // tile indices owned
  inJail: boolean;
  jailTurnsLeft: number;
  pardonLetters: number;
  jailKeys: number;
  hasGivenUp: boolean;
}

export interface CustomDoubles {
  '2-2': string;
  '3-3': string;
  '4-4': string;
  '5-5': string;
}

export type TileType = 
  | 'start'
  | 'sip'
  | 'treasure'
  | 'chug'
  | 'give_sips'
  | 'mystery'
  | 'police'
  | 'round_house'
  | 'trivia'
  | 'slot'
  | 'safe'
  | 'risk'
  | 'biggest_drinker'
  | 'merchant'
  | 'two_truths'
  | 'tax';

export interface BoardTile {
  index: number;
  emoji: string;
  type: TileType;
  nameRo: string;
  nameEn: string;
  descriptionRo: string;
  descriptionEn: string;
  buyable: boolean;
  price?: number;
  sipsCount?: number;
  gridRow: number;
  gridCol: number;
}

export interface Card {
  id: string;
  titleRo: string;
  titleEn: string;
  effectRo: string;
  effectEn: string;
  type: 'good' | 'bad';
  action: (player: Player, allPlayers: Player[], setGameState: any) => { messageRo: string; messageEn: string; sips?: number; chug?: boolean; goldDelta?: number; pardonLetterDelta?: number; jailKeyDelta?: number };
}

export interface TriviaQuestion {
  id: number;
  questionRo: string;
  questionEn: string;
  optionsRo: string[];
  optionsEn: string[];
  correctIndex: number;
}

export type MonkState = 'sober' | 'tipsy' | 'wobbly' | 'drunk' | 'blackout' | 'dead' | 'resurrected';

// Social & Friends 1v1 Invite Types
export interface ActiveRoomInfo {
  mode: 'crash' | 'duel' | 'pineapple' | 'casino';
  roomCode: string;
  status: 'lobby' | 'in_game';
  playerCount?: number;
  maxPlayers?: number;
  hostName?: string;
  updatedAt?: any;
}

export interface UserFriendProfile {
  uid: string;
  shortId: string;
  displayName: string;
  avatarIcon?: string;
  email?: string;
  currentLevel?: number;
  currentTitle_ro?: string;
  currentTitle_en?: string;
  activeRoom?: ActiveRoomInfo | null;
  updatedAt?: any;
}

export interface FriendEntry {
  friendUid: string;
  displayName: string;
  avatarIcon?: string;
  shortId?: string;
  currentLevel?: number;
  currentTitle_ro?: string;
  activeRoom?: ActiveRoomInfo | null;
  addedAt?: any;
}

export interface FriendRequest {
  id?: string;
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  fromShortId?: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: any;
  updatedAt?: any;
}

export interface GameInvite {
  id?: string;
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  toUid: string;
  mode: 'duel' | 'pineapple' | 'crash';
  roomCode: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt?: any;
  updatedAt?: any;
}

export type ShopItemCategory = 'dice' | 'themes' | 'perks' | 'titles' | 'emotes';

// CS-Style Case Opening & Cosmetic Rarities
export type CosmeticRarity = 'milspec' | 'restricted' | 'classified' | 'covert' | 'rareSpecial';

export type CosmeticItemType = 'diceSkin' | 'theme' | 'avatar' | 'cardBack';

export interface CosmeticRarityMeta {
  rarity: CosmeticRarity;
  nameRo: string;
  nameEn: string;
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  glowClass: string;
  dropChance: number; // percentage, e.g. 45, 28, 16, 8, 3
}

export interface CosmeticItem {
  id: string;
  type: CosmeticItemType;
  rarity: CosmeticRarity;
  name: string;
  nameEn?: string;
  descRo?: string;
  descEn?: string;
  icon: string;
  exclusiveToChest: boolean;
  diceSkinKey?: DiceSkin | string;
  themeKey?: ThemeId | string;
  avatarKey?: string;
  cardBackKey?: string;
  previewGradient?: string;
}

export interface ChestDef {
  id: string;
  key: string;
  nameRo: string;
  nameEn: string;
  descRo: string;
  descEn: string;
  cost: number;
  icon: string;
  color: string;
  bannerGradient: string;
  items: CosmeticItem[];
}

export interface ChestOpenResult {
  chest: ChestDef;
  winningItem: CosmeticItem;
  isDuplicate: boolean;
  refundAmount: number;
  rolledOdds: number; // e.g. 0.03
}

export interface TavernEmoteMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  emoteKey: string;
  textRo: string;
  textEn: string;
  icon: string;
  timestamp: number;
}

export interface TavernEmoteDef {
  id: string;
  key: string;
  nameRo: string;
  nameEn: string;
  textRo: string;
  textEn: string;
  descRo: string;
  descEn: string;
  icon: string;
  cost: number;
  soundType: 'cheers' | 'roll_heavy' | 'cry' | 'pour' | 'blessing';
}

export interface ShopItemDef {
  id: string;
  key: string;
  category: ShopItemCategory;
  nameRo: string;
  nameEn: string;
  descRo: string;
  descEn: string;
  cost: number;
  icon: string;
  diceSkinKey?: DiceSkin;
  themeKey?: ThemeId;
  perkKey?: string;
  titleKey?: string;
  emoteKey?: string;
}

