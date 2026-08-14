export type GameMode = 'normal' | 'boardgame' | 'duel';
export type Language = 'ro' | 'en';
export type ThemeId = 'tavern' | 'spring' | 'winter' | 'sky' | 'battlefield';
export type DiceSkin = 'gold' | 'bone' | 'wood';
export type Difficulty = 'weak' | 'medium' | 'extreme' | 'nightmare';
export type DuelSubmode = 'general' | 'football';
export type DuelDifficulty = 'easy' | 'medium' | 'hard';

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
  gamesPlayed: number;
  totalSips: number;
  totalChugs: number;
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
