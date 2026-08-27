import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Language, ThemeId, DiceSkin, Profile } from '../types';
import { translations } from '../i18n/translations';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';
import { useAuth } from './AuthContext';
import { syncAccountProfilesToCloud, resetGlobalLeaderboard } from '../lib/firestoreService';
import { resetAllHeadToHead, isBotPlayerName } from '../lib/headToHeadService';
import {
  calculateProgression,
  calculateMatchXpGain,
  MatchXpBreakdown,
  getAchievementXp,
} from '../lib/progression';
import {
  DailyQuestDefinition,
  UserDailyQuestState,
  DailyQuestPoolState,
  QuestEvent,
  DAILY_QUEST_MAP,
  initializeDailyQuestState,
  getTimeUntilRomaniaMidnight,
  getRomaniaDateKey,
  evaluateQuestProgress,
} from '../data/dailyQuests';
import { SHOP_CATALOG, DEFAULT_UNLOCKED_ITEMS } from '../data/shopCatalog';
import { soundEffects } from '../lib/soundFx';

export interface AchievementEvent {
  type?: string;
  count?: number;
  sipsDelta?: number;
  chugsDelta?: number;
  isHeaven?: boolean;
  isChug?: boolean;
  boughtProperty?: boolean;
  isJail?: boolean;
  isJailEscape?: boolean;
  isSlot?: boolean;
  isCard?: boolean;
  isGiveUp?: boolean;
  isPodiumWinner?: boolean;
  currentBoardGold?: number;
  currentBoardProps?: number;
  singleGameChugs?: number;
  singleGameSips?: number;
  matchTurns?: number;
  matchChugs?: number;
  // Game Mode specific flags
  isDuelPlayed?: boolean;
  isDuelWin?: boolean;
  isDuelFlawless?: boolean;
  isDuelRebound?: boolean;
  isDuelQuickReflex?: boolean;
  duelStreak?: number;
  isCasinoPlayed?: boolean;
  isCasinoWin?: boolean;
  isCrapsPassLineWin?: boolean;
  isCrapsSnakeEyes?: boolean;
  isCrapsMidnight?: boolean;
  casinoChips?: number;
  isPineapplePlayed?: boolean;
  isPineappleWin?: boolean;
  isPineappleBotWinEasy?: boolean;
  isPineappleBotWinMedium?: boolean;
  isPineappleBotWinHard?: boolean;
  isPineappleFlawlessHand?: boolean;
  isPineappleFantasyLand?: boolean;
  isPineappleFantasyStreak?: boolean;
  isPineappleRoyalties?: boolean;
  isPineappleRoyalFlush?: boolean;
  isPineappleScoop?: boolean;
  isPineappleDragon?: boolean;
  pineappleHandsPlayed?: number;
  isDoubles?: boolean;
  isAvatarCustomized?: boolean;
  isTriviaCorrect?: boolean;
  isRentPaid?: boolean;
  isPassDice?: boolean;
  hasComebackWin?: boolean;
  // Crash Dragon mode flags
  isCrashPlayed?: boolean;
  isCrashWin?: boolean;
  isCrashSafeLanding?: boolean;
  isCrashChickenEgg?: boolean;
  isCrashHighMultiplier?: boolean;
  isCrashBotVictor?: boolean;
  isCrashLegendaryX20?: boolean;
  isCrashMaster?: boolean;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  diceSkin: DiceSkin;
  setDiceSkin: (skin: DiceSkin) => void;
  autoSaveNewProfiles: boolean;
  setAutoSaveNewProfiles: (val: boolean) => void;
  profiles: Profile[];
  masterProfile: Profile;
  subProfiles: Profile[];
  drunkenCoins: number;
  setMainProfile: (name: string, avatarIcon?: string) => Promise<void> | void;
  addProfile: (name: string, avatarIcon?: string) => Profile | undefined;
  deleteProfile: (id: string) => void;
  updateProfileAvatar: (id: string, avatarIcon: string) => void;
  updateProfileName: (id: string, name: string) => void;
  updateProfileStats: (playerName: string, sips: number, chugs: number, avatarIcon?: string, winMode?: 'boardgame' | 'duel' | 'casino' | 'pineapple', pineapplePoints?: number) => void;
  batchUpdateProfiles: (playerStats: Array<{ name: string; sips: number; chugs: number; avatarIcon?: string; winMode?: 'boardgame' | 'duel' | 'casino' | 'pineapple' }>) => void;
  recordWin: (playerName: string, mode: 'boardgame' | 'duel' | 'casino' | 'pineapple') => void;
  checkAchievement: (playerName: string, event: AchievementEvent) => string[];
  unlockAchievement: (achId: string, playerName?: string) => string[];
  recordGameStats: (stats: {
    mode?: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash' | string;
    isWin?: boolean;
    sipsDelta?: number;
    chugsDelta?: number;
    isCrashWin?: boolean;
    playerName?: string;
  }) => void;
  awardMatchXp: (
    playerName: string,
    mode: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple',
    isWinner: boolean,
    turnsPlayed?: number,
    newAchievements?: string[],
    extraStats?: { sips?: number; chugs?: number; gold?: number; chips?: number; flawless?: boolean }
  ) => MatchXpBreakdown | null;
  spendDrunkenCoins: (profileIdOrCost: string | number, amount?: number) => boolean;
  addDrunkenCoins: (amountOrProfileId: string | number, amount?: number) => void;
  activeXpBreakdown: { breakdown: MatchXpBreakdown; playerName: string; avatarIcon: string } | null;
  dismissXpBreakdown: () => void;
  activeLegendaryAchievement: { achievement: Achievement; playerName: string } | null;
  dismissLegendaryAchievement: () => void;
  resetAllStats: () => Promise<void> | void;
  resetGlobalTavernLeaderboard: () => Promise<void>;
  customThemeBackgrounds: Record<ThemeId, string>;
  setCustomThemeBackground: (themeId: ThemeId, url: string) => void;
  resetCustomThemeBackground: (themeId: ThemeId) => void;
  syncWithCloud: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  // Shop & Inventory System
  purchasedItems: string[];
  isItemPurchased: (itemIdOrKey: string) => boolean;
  purchaseShopItem: (itemIdOrKey: string, cost: number, onPurchased?: () => void) => boolean;
  hasPerk: (perkKey: string) => boolean;
  equipCustomTitle: (titleKey: string, titleRo: string, titleEn: string, targetProfileId?: string) => void;
  // Daily Quests System
  dailyQuestPool: DailyQuestPoolState;
  activeDailyQuests: Array<DailyQuestDefinition & UserDailyQuestState>;
  trackQuestEvent: (event: QuestEvent) => void;
  claimDailyQuestReward: (questId: string) => boolean;
  claimDailyBonusChest: () => boolean;
  timeUntilQuestReset: { hours: number; minutes: number; seconds: number; formatted: string };
  completedUnclaimedQuestsCount: number;
  activeQuestCompletedNotification: { title: string; desc: string; reward: number; icon: string } | null;
  dismissQuestCompletedNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: 'barbut_monk_lang',
  THEME: 'barbut_monk_theme',
  DICE_SKIN: 'barbut_monk_dice_skin',
  PROFILES: 'barbut_monk_profiles',
  DRUNKEN_COINS: 'barbut_monk_drunken_coins_total',
  AUTO_SAVE_PROFILES: 'barbut_monk_auto_save_profiles',
  CUSTOM_THEME_BGS: 'barbut_monk_custom_theme_bgs',
  DAILY_QUESTS: 'barbut_monk_daily_quests_v1',
  PURCHASED_ITEMS: 'barbut_monk_purchased_items',
};

export const generateUniqueId = (prefix = 'id'): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.floor(Math.random() * 100000)}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, cloudProfile, resetCloudAccount, refreshProfile } = useAuth();

  const [customThemeBackgrounds, setCustomThemeBackgrounds] = useState<Record<ThemeId, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEME_BGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse custom theme backgrounds', e);
    }
    return {
      tavern: '',
      cellar: '',
      great_hall: '',
      dungeon: '',
      crypt: '',
      dragon_lair: '',
      celestial_observatory: '',
      enchanted_forest: '',
      royal_treasury: '',
      custom_player: '',
    };
  });

  const setCustomThemeBackground = (themeId: ThemeId, url: string) => {
    setCustomThemeBackgrounds(prev => {
      const updated = { ...prev, [themeId]: url };
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_THEME_BGS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save custom theme background', e);
      }
      return updated;
    });
  };

  const resetCustomThemeBackground = (themeId: ThemeId) => {
    setCustomThemeBackgrounds(prev => {
      const updated = { ...prev, [themeId]: '' };
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_THEME_BGS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to clear custom theme background', e);
      }
      return updated;
    });
  };

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return saved === 'en' ? 'en' : 'ro';
  });

  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeId;
    return ['tavern', 'cellar', 'great_hall', 'dungeon', 'crypt'].includes(saved) ? saved : 'tavern';
  });

  const [diceSkin, setDiceSkinState] = useState<DiceSkin>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DICE_SKIN) as DiceSkin;
    return ['gold', 'bone', 'wood', 'ruby', 'ice', 'obsidian'].includes(saved) ? saved : 'gold';
  });

  const [autoSaveNewProfiles, setAutoSaveNewProfilesState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_PROFILES);
    return saved === null ? true : saved === 'true';
  });

  // Shop & Inventory Owned Items state
  const [purchasedItems, setPurchasedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASED_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return Array.from(new Set([...DEFAULT_UNLOCKED_ITEMS, ...parsed]));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved purchased items', e);
    }
    return [...DEFAULT_UNLOCKED_ITEMS];
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const freshStartFlag = localStorage.getItem('barbut_monk_stats_v7_total_backend_reset');
    const progDefault = calculateProgression(0);

    // If the fresh reset migration has not been applied yet, wipe all accumulated test stats to 0
    if (!freshStartFlag) {
      localStorage.setItem('barbut_monk_stats_v7_total_backend_reset', 'true');
      resetAllHeadToHead();
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanProfiles: Profile[] = parsed
              .filter(p => p && p.name && !isBotPlayerName(p.name))
              .map((p, idx) => ({
                id: p.id || generateUniqueId(`profile_${idx}`),
                name: p.name || 'Călugăr',
                avatarIcon: p.avatarIcon || 'monk_drunk',
                gamesPlayed: 0,
                totalSips: 0,
                totalChugs: 0,
                totalXP: 0,
                currentLevel: 1,
                currentTitle_ro: progDefault.titleRo,
                currentTitle_en: progDefault.titleEn,
                winsBoardgame: 0,
                winsDuel: 0,
                winsCasino: 0,
                unlockedAchievements: [],
                createdAt: p.createdAt || Date.now(),
              }));
            if (cleanProfiles.length > 0) {
              localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(cleanProfiles));
              return cleanProfiles;
            }
          }
        } catch (e) {
          console.error('Failed to migrate saved profiles', e);
        }
      }

      const defaultClean: Profile[] = [
        { id: 'profile_default_1', name: 'Călugărul Vasile', avatarIcon: 'monk_drunk', gamesPlayed: 0, totalSips: 0, totalChugs: 0, totalXP: 0, currentLevel: 1, currentTitle_ro: progDefault.titleRo, currentTitle_en: progDefault.titleEn, winsBoardgame: 0, winsDuel: 0, winsCasino: 0, unlockedAchievements: [], createdAt: Date.now() - 1000000 },
        { id: 'profile_default_2', name: 'Fratele Pelerin', avatarIcon: 'knight', gamesPlayed: 0, totalSips: 0, totalChugs: 0, totalXP: 0, currentLevel: 1, currentTitle_ro: progDefault.titleRo, currentTitle_en: progDefault.titleEn, winsBoardgame: 0, winsDuel: 0, winsCasino: 0, unlockedAchievements: [], createdAt: Date.now() - 500000 },
      ];
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(defaultClean));
      return defaultClean;
    }

    const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          const sanitized: Profile[] = parsed
            .filter(p => p && p.name && !isBotPlayerName(p.name))
            .map((p, idx) => {
              let uniqueId = p.id;
              if (!uniqueId || seenIds.has(uniqueId)) {
                uniqueId = generateUniqueId(`profile_${idx}`);
              }
              seenIds.add(uniqueId);
              const rawXP = Math.max(0, p.totalXP || 0);
              const prog = calculateProgression(rawXP);

              return {
                id: uniqueId,
                name: p.name || 'Călugăr',
                avatarIcon: p.avatarIcon || 'monk_drunk',
                gamesPlayed: p.gamesPlayed || 0,
                totalSips: p.totalSips || 0,
                totalChugs: p.totalChugs || 0,
                totalXP: rawXP,
                currentLevel: p.currentLevel || prog.currentLevel,
                currentTitle_ro: p.currentTitle_ro || prog.titleRo,
                currentTitle_en: p.currentTitle_en || prog.titleEn,
                winsBoardgame: p.winsBoardgame || 0,
                winsDuel: p.winsDuel || 0,
                winsCasino: p.winsCasino || 0,
                unlockedAchievements: p.unlockedAchievements || [],
                createdAt: p.createdAt || Date.now(),
              };
            });
          if (sanitized.length > 0) {
            return sanitized;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved profiles', e);
      }
    }

    return [
      { id: 'profile_default_1', name: 'Călugărul Vasile', avatarIcon: 'monk_drunk', gamesPlayed: 0, totalSips: 0, totalChugs: 0, totalXP: 0, currentLevel: 1, currentTitle_ro: progDefault.titleRo, currentTitle_en: progDefault.titleEn, winsBoardgame: 0, winsDuel: 0, winsCasino: 0, unlockedAchievements: [], createdAt: Date.now() - 1000000 },
      { id: 'profile_default_2', name: 'Fratele Pelerin', avatarIcon: 'knight', gamesPlayed: 0, totalSips: 0, totalChugs: 0, totalXP: 0, currentLevel: 1, currentTitle_ro: progDefault.titleRo, currentTitle_en: progDefault.titleEn, winsBoardgame: 0, winsDuel: 0, winsCasino: 0, unlockedAchievements: [], createdAt: Date.now() - 500000 },
    ];
  });

  // Global Unified Drunken Coins Treasury Pool (Bănuți Turmentați 🍺🪙) across all profiles
  const [drunkenCoins, setDrunkenCoins] = useState<number>(() => {
    try {
      const savedCoins = localStorage.getItem(STORAGE_KEYS.DRUNKEN_COINS);
      if (savedCoins !== null) {
        const parsed = parseInt(savedCoins, 10);
        if (!isNaN(parsed) && parsed >= 999999) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved drunken coins', e);
    }
    const initialDefault = 999999; // Monastic treasury starting gold bonus for testing
    try {
      localStorage.setItem(STORAGE_KEYS.DRUNKEN_COINS, initialDefault.toString());
    } catch (e) {}
    return initialDefault;
  });

  // Keep local storage synchronized whenever drunkenCoins change
  const setAndPersistDrunkenCoins = (newValOrUpdater: number | ((prev: number) => number)) => {
    setDrunkenCoins(prev => {
      const next = typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater;
      const safeNext = Math.max(0, Math.round(next));
      try {
        localStorage.setItem(STORAGE_KEYS.DRUNKEN_COINS, safeNext.toString());
      } catch (e) {}
      return safeNext;
    });
  };

  // Expose convenient debug helper on window and guarantee 999,999 on mount
  useEffect(() => {
    // Immediately grant infinite test money (999,999) on every startup/refresh for testing
    setAndPersistDrunkenCoins(999999);
    try {
      localStorage.setItem(STORAGE_KEYS.DRUNKEN_COINS, '999999');
    } catch (e) {}

    if (typeof window !== 'undefined') {
      (window as any).setInfiniteMoney = () => {
        setAndPersistDrunkenCoins(999999);
        try {
          localStorage.setItem(STORAGE_KEYS.DRUNKEN_COINS, '999999');
        } catch (e) {}
        console.log('💰 Infinite money granted: 999,999 🍺🪙');
      };
      (window as any).addDrunkenCoins = (amt: number = 100000) => {
        setAndPersistDrunkenCoins(prev => prev + amt);
        console.log(`💰 Added ${amt} 🍺🪙 to treasury!`);
      };
    }
  }, []);

  // Active XP Breakdown modal state
  const [activeXpBreakdown, setActiveXpBreakdown] = useState<{
    breakdown: MatchXpBreakdown;
    playerName: string;
    avatarIcon: string;
  } | null>(null);

  const dismissXpBreakdown = () => {
    setActiveXpBreakdown(null);
  };

  // -------------------------------------------------------------
  // DAILY QUEST SYSTEM (3 tasks / day, reset at 12:00 AM Romania time)
  // -------------------------------------------------------------
  const [dailyQuestPool, setDailyQuestPool] = useState<DailyQuestPoolState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_QUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return initializeDailyQuestState(parsed);
      }
    } catch (e) {
      console.error('Failed to parse saved daily quests', e);
    }
    return initializeDailyQuestState(null);
  });

  const [timeUntilQuestReset, setTimeUntilQuestReset] = useState(() => getTimeUntilRomaniaMidnight());

  // 1-second interval to update countdown timer and automatically handle 12 AM Romania reset
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilRomaniaMidnight();
      setTimeUntilQuestReset(remaining);

      const todayKey = getRomaniaDateKey();
      setDailyQuestPool(prev => {
        if (prev.dateKey !== todayKey) {
          const fresh = initializeDailyQuestState(null);
          try {
            localStorage.setItem(STORAGE_KEYS.DAILY_QUESTS, JSON.stringify(fresh));
          } catch (e) {}
          return fresh;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Map active daily quests with their static definitions
  const activeDailyQuests = React.useMemo(() => {
    return (dailyQuestPool.quests || []).map(uq => {
      const def = DAILY_QUEST_MAP.get(uq.questId) || {
        id: uq.questId,
        category: 'general' as const,
        titleRo: 'Misiune Călugărească',
        titleEn: 'Monastic Quest',
        descRo: 'Sarcina mănăstirii',
        descEn: 'Monastery task',
        icon: '🎯',
        target: 1,
        coinReward: 25,
      };
      return {
        ...def,
        ...uq,
      };
    });
  }, [dailyQuestPool]);

  // Floating quest completion notification state
  const [activeQuestCompletedNotification, setActiveQuestCompletedNotification] = useState<{
    title: string;
    desc: string;
    reward: number;
    icon: string;
  } | null>(null);

  const dismissQuestCompletedNotification = () => {
    setActiveQuestCompletedNotification(null);
  };

  // Event dispatcher for quest progress
  const trackQuestEvent = (event: QuestEvent) => {
    const todayKey = getRomaniaDateKey();

    setDailyQuestPool(prev => {
      const currentPool = prev.dateKey === todayKey ? prev : initializeDailyQuestState(null);
      let hasChanges = false;
      let newlyCompletedQuest: DailyQuestDefinition | null = null;

      const updatedQuests = (currentPool.quests || []).map(uq => {
        const def = DAILY_QUEST_MAP.get(uq.questId);
        if (!def) return uq;

        const newProgress = evaluateQuestProgress(def, event, uq.progress);
        const isNowCompleted = newProgress >= def.target;

        if (newProgress !== uq.progress || isNowCompleted !== uq.completed) {
          hasChanges = true;
          if (isNowCompleted && !uq.completed) {
            newlyCompletedQuest = def;
          }
          return {
            ...uq,
            progress: newProgress,
            completed: isNowCompleted,
          };
        }
        return uq;
      });

      if (!hasChanges) return prev;

      const newPoolState: DailyQuestPoolState = {
        ...currentPool,
        quests: updatedQuests,
      };

      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_QUESTS, JSON.stringify(newPoolState));
      } catch (e) {}

      if (newlyCompletedQuest) {
        const quest = newlyCompletedQuest as DailyQuestDefinition;
        soundEffects.playQuestComplete();
        setActiveQuestCompletedNotification({
          title: language === 'ro' ? quest.titleRo : quest.titleEn,
          desc: language === 'ro' ? quest.descRo : quest.descEn,
          reward: quest.coinReward,
          icon: quest.icon,
        });
      }

      return newPoolState;
    });
  };

  // Claim individual quest reward
  const claimDailyQuestReward = (questId: string): boolean => {
    const questDef = DAILY_QUEST_MAP.get(questId);
    if (!questDef) return false;

    let claimedSuccess = false;

    setDailyQuestPool(prev => {
      const targetIdx = (prev.quests || []).findIndex(q => q.questId === questId);
      if (targetIdx === -1) return prev;

      const target = prev.quests[targetIdx];
      if (!target.completed || target.claimed) return prev;

      claimedSuccess = true;
      const updatedQuests = [...prev.quests];
      updatedQuests[targetIdx] = {
        ...target,
        claimed: true,
      };

      const newPoolState = {
        ...prev,
        quests: updatedQuests,
      };

      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_QUESTS, JSON.stringify(newPoolState));
      } catch (e) {}

      // Add coins directly to global unified treasury
      setAndPersistDrunkenCoins(c => c + questDef.coinReward);

      return newPoolState;
    });

    return claimedSuccess;
  };

  // Claim 3/3 daily bonus chest (+50 Drunken Coins)
  const claimDailyBonusChest = (): boolean => {
    let claimedSuccess = false;

    setDailyQuestPool(prev => {
      const allDone = (prev.quests || []).length === 3 && prev.quests.every(q => q.completed);
      if (!allDone || prev.bonusClaimed) return prev;

      claimedSuccess = true;
      const newPoolState = {
        ...prev,
        bonusClaimed: true,
      };

      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_QUESTS, JSON.stringify(newPoolState));
      } catch (e) {}

      setAndPersistDrunkenCoins(c => c + 50);

      return newPoolState;
    });

    return claimedSuccess;
  };

  // Count of completed but unclaimed items
  const completedUnclaimedQuestsCount = React.useMemo(() => {
    const questUnclaimed = (dailyQuestPool.quests || []).filter(q => q.completed && !q.claimed).length;
    const allDone = (dailyQuestPool.quests || []).length === 3 && dailyQuestPool.quests.every(q => q.completed);
    const bonusUnclaimed = (allDone && !dailyQuestPool.bonusClaimed) ? 1 : 0;
    return questUnclaimed + bonusUnclaimed;
  }, [dailyQuestPool]);

  // Track initial cloud sync per user UID so we merge cloud profiles when user logs in on a new device
  const hasMergedCloudRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (hasMergedCloudRef.current === user.uid) return;

    // Check if cloud document contains legacy test stats/achievements while local has been wiped fresh to 0
    const hasLegacyCloudStats =
      Boolean((cloudProfile?.totalSips && cloudProfile.totalSips > 0) ||
      (cloudProfile?.totalChugs && cloudProfile.totalChugs > 0) ||
      (cloudProfile?.unlockedAchievements && cloudProfile.unlockedAchievements.length > 0) ||
      (cloudProfile?.profiles && cloudProfile.profiles.some(cp => (cp.totalSips && cp.totalSips > 0) || (cp.unlockedAchievements && cp.unlockedAchievements.length > 0))));

    const localIsFresh = profiles.every(
      p => (p.totalSips || 0) === 0 && (p.totalChugs || 0) === 0 && (!p.unlockedAchievements || p.unlockedAchievements.length === 0)
    );

    if (hasLegacyCloudStats && localIsFresh) {
      hasMergedCloudRef.current = user.uid;
      // Overwrite backend Firestore with clean 0 stats immediately!
      resetCloudAccount(profiles).catch(err => {
        console.warn('Auto backend clean reset failed:', err);
      });
      return;
    }

    if (cloudProfile?.profiles && cloudProfile.profiles.length > 0) {
      hasMergedCloudRef.current = user.uid;
      // Merge cloud profiles with local profiles
      setProfiles(prev => {
        const merged = [...prev];
        cloudProfile.profiles!
          .filter(cp => cp && cp.name && !isBotPlayerName(cp.name))
          .forEach(cp => {
          const matchIdx = merged.findIndex(p => p.id === cp.id || p.name.trim().toLowerCase() === cp.name.trim().toLowerCase());
          const highestXp = Math.max(cp.totalXP || 0, matchIdx >= 0 ? (merged[matchIdx].totalXP || 0) : 0);
          const prog = calculateProgression(highestXp);

          if (matchIdx >= 0) {
            // Take highest stats
            const local = merged[matchIdx];
            merged[matchIdx] = {
              ...local,
              id: cp.id || local.id,
              name: cp.name || local.name,
              avatarIcon: cp.avatarIcon || local.avatarIcon,
              gamesPlayed: Math.max(local.gamesPlayed, cp.gamesPlayed || 0),
              totalSips: Math.max(local.totalSips, cp.totalSips || 0),
              totalChugs: Math.max(local.totalChugs, cp.totalChugs || 0),
              totalXP: highestXp,
              currentLevel: prog.currentLevel,
              currentTitle_ro: cp.currentTitle_ro || local.currentTitle_ro || prog.titleRo,
              currentTitle_en: cp.currentTitle_en || local.currentTitle_en || prog.titleEn,
              winsBoardgame: Math.max(local.winsBoardgame || 0, cp.winsBoardgame || 0),
              winsDuel: Math.max(local.winsDuel || 0, cp.winsDuel || 0),
              winsCasino: Math.max(local.winsCasino || 0, cp.winsCasino || 0),
              unlockedAchievements: Array.from(new Set([...(local.unlockedAchievements || []), ...(cp.unlockedAchievements || [])])),
            };
          } else {
            merged.push({
              id: cp.id || generateUniqueId('profile'),
              name: cp.name,
              avatarIcon: cp.avatarIcon || 'monk_drunk',
              gamesPlayed: cp.gamesPlayed || 0,
              totalSips: cp.totalSips || 0,
              totalChugs: cp.totalChugs || 0,
              totalXP: highestXp,
              currentLevel: prog.currentLevel,
              currentTitle_ro: cp.currentTitle_ro || prog.titleRo,
              currentTitle_en: cp.currentTitle_en || prog.titleEn,
              winsBoardgame: cp.winsBoardgame || 0,
              winsDuel: cp.winsDuel || 0,
              winsCasino: cp.winsCasino || 0,
              unlockedAchievements: cp.unlockedAchievements || [],
              createdAt: cp.createdAt || Date.now(),
            });
          }
        });
        return merged.filter(p => !isBotPlayerName(p.name));
      });
    }
  }, [user, cloudProfile]);

  // Debounced cloud sync when local profiles update
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    if (user) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncAccountProfilesToCloud(profiles).catch(err => {
          console.warn('Auto cloud sync failed:', err);
        });
      }, 1000);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [profiles, user]);

  const syncWithCloud = async () => {
    if (!user) return;
    await syncAccountProfilesToCloud(profiles);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DICE_SKIN, diceSkin);
  }, [diceSkin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SAVE_PROFILES, String(autoSaveNewProfiles));
  }, [autoSaveNewProfiles]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const setTheme = (t: ThemeId) => setThemeState(t);
  const setDiceSkin = (s: DiceSkin) => setDiceSkinState(s);
  const setAutoSaveNewProfiles = (val: boolean) => setAutoSaveNewProfilesState(val);

  const [activeLegendaryAchievement, setActiveLegendaryAchievement] = useState<{
    achievement: Achievement;
    playerName: string;
  } | null>(null);

  const dismissLegendaryAchievement = () => {
    setActiveLegendaryAchievement(null);
  };

  const checkAchievement = (playerName: string, event: AchievementEvent): string[] => {
    const trimmed = playerName.trim();
    if (!trimmed || isBotPlayerName(trimmed)) return [];
    const lowerName = trimmed.toLowerCase();
    const newUnlockedList: string[] = [];

    setProfiles(prev => {
      let targetProfile = prev.find(p => p.name.trim().toLowerCase() === lowerName);
      if (!targetProfile) {
        targetProfile = {
          id: generateUniqueId('profile'),
          name: trimmed,
          avatarIcon: 'monk_drunk',
          gamesPlayed: 0,
          totalSips: 0,
          totalChugs: 0,
          winsBoardgame: 0,
          winsDuel: 0,
          winsCasino: 0,
          winsPineapple: 0,
          unlockedAchievements: [],
          createdAt: Date.now(),
        };
      }

      const unlocked = new Set<string>(targetProfile.unlockedAchievements || []);

      const currSips = targetProfile.totalSips + (event.sipsDelta || 0);
      const currChugs = targetProfile.totalChugs + (event.chugsDelta || 0);
      const currGames = targetProfile.gamesPlayed;
      const bWins = targetProfile.winsBoardgame || 0;
      const dWins = targetProfile.winsDuel || 0;
      const cWins = targetProfile.winsCasino || 0;
      const pWins = targetProfile.winsPineapple || 0;

      const tryUnlock = (achId: string, condition: boolean) => {
        if (!unlocked.has(achId) && (condition || event.type === achId)) {
          unlocked.add(achId);
          newUnlockedList.push(achId);
        }
      };

      // ================= COMMON =================
      tryUnlock('first_sip', currSips >= 1 || Boolean(event.sipsDelta && event.sipsDelta > 0) || event.type === 'first_sip');
      tryUnlock('heaven_blessing', Boolean(event.isHeaven) || event.type === 'heaven_blessing');
      tryUnlock('first_chug', currChugs >= 1 || Boolean(event.isChug) || event.type === 'first_chug');
      tryUnlock('first_game', currGames >= 1 || event.type === 'first_game');
      tryUnlock('first_property', Boolean(event.boughtProperty) || event.type === 'first_property');
      tryUnlock('dungeon_visit', Boolean(event.isJail) || event.type === 'dungeon_visit');
      tryUnlock('gambler_monk', Boolean(event.isSlot) || event.type === 'gambler_monk');
      tryUnlock('fate_card', Boolean(event.isCard) || event.type === 'fate_card');
      tryUnlock('first_duel', Boolean(event.isDuelPlayed || event.isDuelWin || dWins > 0) || event.type === 'first_duel');
      tryUnlock('first_casino', Boolean(event.isCasinoPlayed || event.isCasinoWin || cWins > 0) || event.type === 'first_casino');
      tryUnlock('first_pineapple', Boolean(event.isPineapplePlayed || event.isPineappleWin || pWins > 0) || event.type === 'pineapple_played' || event.type === 'first_pineapple');
      tryUnlock('first_crash', Boolean(event.isCrashPlayed || event.isCrashWin) || event.type === 'first_crash');
      tryUnlock('crash_safe_landing', Boolean(event.isCrashSafeLanding) || event.type === 'crash_safe_landing');
      tryUnlock('crash_chicken_egg', Boolean(event.isCrashChickenEgg) || event.type === 'crash_chicken_egg');
      tryUnlock('pineapple_bot_easy', Boolean(event.isPineappleBotWinEasy) || event.type === 'pineapple_bot_easy');
      tryUnlock('pineapple_flawless_hand', Boolean(event.isPineappleFlawlessHand) || event.type === 'pineapple_flawless_hand');
      tryUnlock('pineapple_fantasyland', Boolean(event.isPineappleFantasyLand) || event.type === 'pineapple_fantasyland');
      tryUnlock('pineapple_royalties', Boolean(event.isPineappleRoyalties) || event.type === 'pineapple_royalties');
      tryUnlock('pass_dice_turn', Boolean(event.isPassDice) || event.type === 'pass_dice_turn');
      tryUnlock('quick_reflex', Boolean(event.isDuelQuickReflex) || event.type === 'quick_reflex');
      tryUnlock('sip_apprentice_10', currSips >= 10);
      tryUnlock('monopoly_rent_pay', Boolean(event.isRentPaid) || event.type === 'monopoly_rent_pay');
      tryUnlock('craps_passline_win', Boolean(event.isCrapsPassLineWin) || event.type === 'craps_passline_win');
      tryUnlock('dice_doubles_master', Boolean(event.isDoubles) || event.type === 'dice_doubles_master');
      tryUnlock('avatar_customizer', Boolean(event.isAvatarCustomized || (targetProfile.avatarIcon && targetProfile.avatarIcon !== 'monk_drunk')));
      tryUnlock('duel_rebound', Boolean(event.isDuelRebound) || event.type === 'duel_rebound');
      tryUnlock('trivia_scholar', Boolean(event.isTriviaCorrect) || event.type === 'trivia_scholar');

      // ================= RARE =================
      tryUnlock('chug_trio', Boolean(event.singleGameChugs && event.singleGameChugs >= 3) || event.type === 'chug_trio');
      tryUnlock('chug_quintet', Boolean(event.singleGameChugs && event.singleGameChugs >= 5) || event.type === 'chug_quintet');
      tryUnlock('drinker_50', Boolean(event.singleGameSips && event.singleGameSips >= 50) || event.type === 'drinker_50');
      tryUnlock('monopoly_full_color', Boolean(event.currentBoardProps && event.currentBoardProps >= 3) || event.type === 'monopoly_full_color');
      tryUnlock('jailbreak_key', Boolean(event.isJailEscape) || event.type === 'jailbreak_key');
      tryUnlock('give_up_surrender', Boolean(event.isGiveUp) || event.type === 'give_up_surrender');
      tryUnlock('podium_winner', Boolean(event.isPodiumWinner) || event.type === 'podium_winner');
      tryUnlock('duel_victory', Boolean(event.isDuelWin || dWins >= 1) || event.type === 'duel_victory');
      tryUnlock('casino_highroller', Boolean(event.isCasinoWin || cWins >= 1) || event.type === 'casino_highroller');
      tryUnlock('pineapple_victory', Boolean(event.isPineappleWin || pWins >= 1) || event.type === 'pineapple_win' || event.type === 'pineapple_victory');
      tryUnlock('pineapple_bot_medium', Boolean(event.isPineappleBotWinMedium) || event.type === 'pineapple_bot_medium');
      tryUnlock('pineapple_scoop', Boolean(event.isPineappleScoop) || event.type === 'pineapple_scoop');
      tryUnlock('pineapple_dragon', Boolean(event.isPineappleDragon) || event.type === 'pineapple_dragon');
      tryUnlock('pineapple_fantasyland_streak', Boolean(event.isPineappleFantasyStreak) || event.type === 'pineapple_fantasyland_streak');
      tryUnlock('crash_high_multiplier', Boolean(event.isCrashHighMultiplier) || event.type === 'crash_high_multiplier');
      tryUnlock('crash_bot_victor', Boolean(event.isCrashBotVictor) || event.type === 'crash_bot_victor');
      tryUnlock('sips_century_100', currSips >= 100);
      tryUnlock('chug_veteran_10', currChugs >= 10);
      tryUnlock('monopoly_land_baron', Boolean(event.currentBoardProps && event.currentBoardProps >= 5) || event.type === 'monopoly_land_baron');
      tryUnlock('craps_snake_eyes', Boolean(event.isCrapsSnakeEyes) || event.type === 'craps_snake_eyes');
      tryUnlock('craps_midnight', Boolean(event.isCrapsMidnight) || event.type === 'craps_midnight');
      tryUnlock('duel_streak_3', Boolean(event.duelStreak && event.duelStreak >= 3) || event.type === 'duel_streak_3');
      tryUnlock('gold_hoarder_100', Boolean(event.currentBoardGold && event.currentBoardGold >= 100) || event.type === 'gold_hoarder_100');
      tryUnlock('speed_demon_trivia', Boolean(event.isDuelQuickReflex) || event.type === 'speed_demon_trivia');
      tryUnlock('resurrected_phoenix', Boolean(event.hasComebackWin) || event.type === 'resurrected_phoenix');

      // ================= LEGENDARY =================
      tryUnlock('legend_1000_sips', currSips >= 1000);
      tryUnlock('legend_50_chugs', currChugs >= 50);
      tryUnlock('legend_25_games', currGames >= 25);
      tryUnlock('legend_tycoon', Boolean(event.currentBoardProps && event.currentBoardProps >= 8 && event.currentBoardGold && event.currentBoardGold >= 150));
      tryUnlock('legend_ascended', Boolean(event.matchTurns && event.matchTurns >= 20 && event.matchChugs === 0));
      tryUnlock('legend_tri_champion', bWins >= 1 && dWins >= 1 && cWins >= 1);
      tryUnlock('legend_quad_champion', bWins >= 1 && dWins >= 1 && cWins >= 1 && pWins >= 1);
      tryUnlock('legend_duel_grandmaster', dWins >= 10);
      tryUnlock('legend_craps_king', cWins >= 10);
      tryUnlock('legend_pineapple_master', pWins >= 10);
      tryUnlock('legend_crash_master', Boolean(event.isCrashMaster) || event.type === 'legend_crash_master');
      tryUnlock('crash_legendary_x20', Boolean(event.isCrashLegendaryX20) || event.type === 'crash_legendary_x20');
      tryUnlock('pineapple_bot_hard', Boolean(event.isPineappleBotWinHard) || event.type === 'pineapple_bot_hard');
      tryUnlock('legend_pineapple_royal_flush', Boolean(event.isPineappleRoyalFlush) || event.type === 'legend_pineapple_royal_flush');
      tryUnlock('legend_boardgame_emperor', bWins >= 10);
      tryUnlock('legend_flawless_duel', Boolean(event.isDuelFlawless));
      tryUnlock('legend_500_sips', currSips >= 500);
      tryUnlock('legend_50_games', currGames >= 50);
      tryUnlock('legend_craps_fortune', Boolean(event.casinoChips && event.casinoChips >= 300));
      tryUnlock('legend_survivor_100_turns', currGames >= 15 || Boolean(event.matchTurns && event.matchTurns >= 50));
      tryUnlock('legend_monopoly_all_properties', Boolean(event.currentBoardProps && event.currentBoardProps >= 10));
      tryUnlock('legend_speed_titan', Boolean((event.duelStreak && event.duelStreak >= 5) || dWins >= 5));

      // If any newly unlocked achievement is LEGENDARY -> Trigger celebratory in-game banner!
      newUnlockedList.forEach(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach && ach.rarity === 'legendary') {
          setActiveLegendaryAchievement({
            achievement: ach,
            playerName: trimmed,
          });
        }
      });

      // Calculate newly gained achievement XP if any
      const newlyEarnedXp = newUnlockedList.reduce((acc, achId) => acc + getAchievementXp(achId), 0);
      const newTotalXp = (targetProfile.totalXP || 0) + newlyEarnedXp;
      const prog = calculateProgression(newTotalXp);

      const updatedProfile: Profile = {
        ...targetProfile,
        unlockedAchievements: Array.from(unlocked),
        totalXP: newTotalXp,
        currentLevel: prog.currentLevel,
        currentTitle_ro: targetProfile.currentTitle_ro || prog.titleRo,
        currentTitle_en: targetProfile.currentTitle_en || prog.titleEn,
      };

      const existsIdx = prev.findIndex(p => p.name.trim().toLowerCase() === lowerName);
      if (existsIdx >= 0) {
        const next = [...prev];
        next[existsIdx] = updatedProfile;
        return next;
      } else {
        return [...prev, updatedProfile];
      }
    });

    return newUnlockedList;
  };

  const setMainProfile = async (name: string, avatarIcon: string = 'monk_master') => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const prog = calculateProgression(0);
    const currentList = profiles && profiles.length > 0 ? [...profiles] : [];
    const existingMatch = currentList.find(
      p => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    let updatedProfiles: Profile[];
    if (existingMatch) {
      // Upgrade existing profile to master profile with new avatar, and demote all other profiles to subprofiles
      const master: Profile = {
        ...existingMatch,
        name: trimmed,
        avatarIcon: avatarIcon || existingMatch.avatarIcon || 'monk_master',
        isMaster: true,
      };
      const others = currentList
        .filter(p => p.id !== existingMatch.id)
        .map(p => ({ ...p, isMaster: false }));
      updatedProfiles = [master, ...others];
    } else {
      // Create new master profile and demote all other profiles to subprofiles
      const newMaster: Profile = {
        id: user ? `master_${user.uid.substring(0, 10)}` : generateUniqueId('master'),
        name: trimmed,
        avatarIcon: avatarIcon || 'monk_master',
        isMaster: true,
        gamesPlayed: 0,
        totalSips: 0,
        totalChugs: 0,
        totalXP: 0,
        currentLevel: 1,
        currentTitle_ro: prog.titleRo,
        currentTitle_en: prog.titleEn,
        winsBoardgame: 0,
        winsDuel: 0,
        winsCasino: 0,
        winsPineapple: 0,
        winsCrash: 0,
        gamesPlayedCrash: 0,
        sipsDrunkCrash: 0,
        totalPineapplePoints: 0,
        unlockedAchievements: [],
        createdAt: Date.now(),
      };
      const others = currentList.map(p => ({ ...p, isMaster: false }));
      updatedProfiles = [newMaster, ...others];
    }

    setProfiles(updatedProfiles);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedProfiles));
    } catch (e) {}

    if (user) {
      try {
        localStorage.setItem(`barbut_has_set_main_profile_${user.uid}`, 'true');
      } catch (e) {}
      await syncAccountProfilesToCloud(updatedProfiles, drunkenCoins);
    }
  };

  const addProfile = (name: string, avatarIcon: string = 'monk_drunk'): Profile | undefined => {
    const trimmed = name.trim();
    if (!trimmed || isBotPlayerName(trimmed)) return undefined;
    const existing = profiles.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const prog = calculateProgression(0);

    const newProfile: Profile = {
      id: generateUniqueId('subprofile'),
      name: trimmed,
      avatarIcon,
      isMaster: false,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      totalXP: 0,
      currentLevel: 1,
      currentTitle_ro: prog.titleRo,
      currentTitle_en: prog.titleEn,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      winsPineapple: 0,
      winsCrash: 0,
      gamesPlayedCrash: 0,
      sipsDrunkCrash: 0,
      totalPineapplePoints: 0,
      unlockedAchievements: [],
      createdAt: Date.now(),
    };
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const deleteProfile = (id: string) => {
    const master = profiles.find(p => p.isMaster) || profiles[0];
    if (master && master.id === id) {
      return; // Do not delete Master Profile
    }
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const updateProfileAvatar = (id: string, avatarIcon: string) => {
    setProfiles(prev => {
      const p = prev.find(item => item.id === id);
      if (p) {
        setTimeout(() => {
          checkAchievement(p.name, { isAvatarCustomized: true });
        }, 0);
      }
      return prev.map(p => (p.id === id ? { ...p, avatarIcon } : p));
    });
  };

  const updateProfileName = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfiles(prev => prev.map(p => (p.id === id ? { ...p, name: trimmed } : p)));
  };

  // Derived Master Profile and Sub-Profiles
  const masterProfile: Profile = profiles.find(p => p.isMaster) || profiles[0] || {
    id: 'profile_master_default',
    name: 'Starețul Mănăstirii',
    avatarIcon: 'monk_master',
    isMaster: true,
    gamesPlayed: 0,
    totalSips: 0,
    totalChugs: 0,
    totalXP: 0,
    currentLevel: 1,
    currentTitle_ro: 'Ucenic de Tavernă',
    currentTitle_en: 'Tavern Apprentice',
    winsBoardgame: 0,
    winsDuel: 0,
    winsCasino: 0,
    winsPineapple: 0,
    winsCrash: 0,
    gamesPlayedCrash: 0,
    sipsDrunkCrash: 0,
    totalPineapplePoints: 0,
    unlockedAchievements: [],
    createdAt: Date.now(),
  };

  const subProfiles: Profile[] = profiles.filter(p => !p.isMaster && p.id !== masterProfile.id);

  // Unified global drunken coins spending
  const spendDrunkenCoins = (profileIdOrCost: string | number, amount?: number): boolean => {
    const cost = typeof profileIdOrCost === 'number' ? profileIdOrCost : (amount || 0);
    if (cost <= 0) return true;
    if (drunkenCoins < cost) {
      return false;
    }

    setAndPersistDrunkenCoins(prev => Math.max(0, prev - cost));
    return true;
  };

  // Unified global drunken coins earning
  const addDrunkenCoins = (amountOrProfileId: string | number, amount?: number) => {
    const earned = typeof amountOrProfileId === 'number' ? amountOrProfileId : (amount || 0);
    if (earned <= 0) return;

    setAndPersistDrunkenCoins(prev => prev + earned);
  };

  // Check if an item or skin is owned / unlocked
  const isItemPurchased = (itemIdOrKey: string): boolean => {
    if (!itemIdOrKey) return false;
    if (DEFAULT_UNLOCKED_ITEMS.includes(itemIdOrKey)) return true;
    return purchasedItems.includes(itemIdOrKey);
  };

  // Buy an item from the shop, persist it, and apply immediately
  const purchaseShopItem = (
    itemIdOrKey: string,
    cost: number,
    onPurchased?: () => void
  ): boolean => {
    // If already owned, apply callback without charging
    if (isItemPurchased(itemIdOrKey)) {
      if (onPurchased) onPurchased();
      return true;
    }

    if (drunkenCoins < cost) {
      return false;
    }

    // Deduct coins
    setAndPersistDrunkenCoins(prev => Math.max(0, prev - cost));

    // Save item to inventory
    setPurchasedItems(prev => {
      const updated = Array.from(new Set([...prev, itemIdOrKey]));
      const catalogItem = SHOP_CATALOG.find(i => i.id === itemIdOrKey || i.key === itemIdOrKey);
      if (catalogItem) {
        updated.push(catalogItem.id);
        updated.push(catalogItem.key);
        if (catalogItem.diceSkinKey) updated.push(catalogItem.diceSkinKey);
        if (catalogItem.themeKey) updated.push(catalogItem.themeKey);
        if (catalogItem.perkKey) updated.push(catalogItem.perkKey);
        if (catalogItem.titleKey) updated.push(catalogItem.titleKey);
        if (catalogItem.avatarKey) updated.push(catalogItem.avatarKey);
      }
      const uniqueUpdated = Array.from(new Set(updated));
      try {
        localStorage.setItem(STORAGE_KEYS.PURCHASED_ITEMS, JSON.stringify(uniqueUpdated));
      } catch (e) {
        console.error('Failed to save purchased items', e);
      }
      return uniqueUpdated;
    });

    if (onPurchased) {
      onPurchased();
    }

    soundEffects.playPurchaseSuccess();
    return true;
  };

  const hasPerk = (perkKey: string): boolean => {
    return isItemPurchased(perkKey);
  };

  const equipCustomTitle = (titleKey: string, titleRo: string, titleEn: string, targetProfileId?: string) => {
    let updatedProfiles: Profile[] = [];
    setProfiles(prev => {
      const targetIdx = targetProfileId
        ? prev.findIndex(p => p.id === targetProfileId)
        : (prev.findIndex(p => p.isMaster) >= 0 ? prev.findIndex(p => p.isMaster) : 0);

      if (targetIdx === -1) {
        updatedProfiles = prev;
        return prev;
      }

      const updated = [...prev];
      updated[targetIdx] = {
        ...updated[targetIdx],
        currentTitle_ro: titleRo,
        currentTitle_en: titleEn,
      };
      updatedProfiles = updated;
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (user && updatedProfiles.length > 0) {
      syncAccountProfilesToCloud(updatedProfiles, drunkenCoins)
        .then(() => {
          refreshProfile?.();
        })
        .catch(err => {
          console.warn('Immediate title cloud sync failed:', err);
        });
    }

    soundEffects.playEquip();
  };

  const awardMatchXp = (
    playerName: string,
    mode: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple',
    isWinner: boolean,
    turnsPlayed: number = 5,
    newAchievements: string[] = [],
    extraStats?: { sips?: number; chugs?: number; gold?: number; chips?: number; flawless?: boolean }
  ): MatchXpBreakdown | null => {
    if (turnsPlayed < 2 || isBotPlayerName(playerName)) {
      return null;
    }

    const trimmed = playerName.trim();
    if (!trimmed || isBotPlayerName(trimmed)) return null;
    const lowerName = trimmed.toLowerCase();

    const existingProfile = profiles.find(p => p.name.trim().toLowerCase() === lowerName) || {
      id: generateUniqueId('profile'),
      name: trimmed,
      avatarIcon: 'monk_drunk',
      isMaster: false,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      totalXP: 0,
      currentLevel: 1,
      currentTitle_ro: 'Ucenic de Tavernă',
      currentTitle_en: 'Tavern Apprentice',
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      winsPineapple: 0,
      winsCrash: 0,
      gamesPlayedCrash: 0,
      sipsDrunkCrash: 0,
      totalPineapplePoints: 0,
      unlockedAchievements: [],
      createdAt: Date.now(),
    };

    const breakdown = calculateMatchXpGain(existingProfile, mode, isWinner, turnsPlayed, newAchievements, extraStats, drunkenCoins);
    if (!breakdown) return null;

    // Add gained coins to the central treasury
    if (breakdown.drunkenCoinsGained > 0) {
      setAndPersistDrunkenCoins(prev => prev + breakdown.drunkenCoinsGained);
    }

    const earnedXP = breakdown.totalGainedXP;

    setProfiles(prev => {
      const idx = prev.findIndex(p => p.name.trim().toLowerCase() === lowerName);
      const masterIdx = prev.findIndex(p => p.isMaster) >= 0 ? prev.findIndex(p => p.isMaster) : 0;
      const prog = calculateProgression(breakdown.newTotalXP);

      const next = [...prev];
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          totalXP: breakdown.newTotalXP,
          currentLevel: prog.currentLevel,
          currentTitle_ro: next[idx].currentTitle_ro || prog.titleRo,
          currentTitle_en: next[idx].currentTitle_en || prog.titleEn,
        };
      } else {
        next.push({
          ...existingProfile,
          totalXP: breakdown.newTotalXP,
          currentLevel: prog.currentLevel,
          currentTitle_ro: existingProfile.currentTitle_ro || prog.titleRo,
          currentTitle_en: existingProfile.currentTitle_en || prog.titleEn,
        });
      }

      // If playing profile is a sub-profile, aggregate the earned XP into the Master Profile
      if (idx !== masterIdx && masterIdx >= 0 && masterIdx < next.length) {
        const master = next[masterIdx];
        const masterNewXP = (master.totalXP || 0) + earnedXP;
        const masterProg = calculateProgression(masterNewXP);
        next[masterIdx] = {
          ...master,
          totalXP: masterNewXP,
          currentLevel: masterProg.currentLevel,
          currentTitle_ro: master.currentTitle_ro || masterProg.titleRo,
          currentTitle_en: master.currentTitle_en || masterProg.titleEn,
        };
      }

      return next;
    });

    setActiveXpBreakdown({
      breakdown,
      playerName: existingProfile.name,
      avatarIcon: existingProfile.avatarIcon || 'monk_drunk',
    });

    return breakdown;
  };

  const recordWin = (playerName: string, mode: 'boardgame' | 'duel' | 'casino' | 'pineapple') => {
    const trimmed = playerName.trim();
    if (!trimmed || isBotPlayerName(trimmed)) return;
    const lowerName = trimmed.toLowerCase();

    setProfiles(prev => {
      const masterIdx = prev.findIndex(p => p.isMaster) >= 0 ? prev.findIndex(p => p.isMaster) : 0;
      return prev.map((p, idx) => {
        const isTarget = p.name.trim().toLowerCase() === lowerName;
        const isMaster = idx === masterIdx && !p.isMaster;

        if (isTarget || isMaster) {
          return {
            ...p,
            winsBoardgame: mode === 'boardgame' ? (p.winsBoardgame || 0) + 1 : (p.winsBoardgame || 0),
            winsDuel: mode === 'duel' ? (p.winsDuel || 0) + 1 : (p.winsDuel || 0),
            winsCasino: mode === 'casino' ? (p.winsCasino || 0) + 1 : (p.winsCasino || 0),
            winsPineapple: mode === 'pineapple' ? (p.winsPineapple || 0) + 1 : (p.winsPineapple || 0),
          };
        }
        return p;
      });
    });

    setTimeout(() => {
      checkAchievement(trimmed, {
        isDuelWin: mode === 'duel',
        isCasinoWin: mode === 'casino',
        isPineappleWin: mode === 'pineapple',
        isPodiumWinner: true,
      });
    }, 0);
  };

  const updateProfileStats = (
    playerName: string,
    sips: number,
    chugs: number,
    avatarIcon?: string,
    winMode?: 'boardgame' | 'duel' | 'casino' | 'pineapple',
    pineapplePoints?: number
  ) => {
    const trimmed = playerName.trim();
    if (!trimmed || isBotPlayerName(trimmed)) return;
    const lowerName = trimmed.toLowerCase();

    let baseMatchXp = 10;
    if (winMode === 'duel') baseMatchXp += 35;
    else if (winMode === 'casino') baseMatchXp += 60;
    else if (winMode === 'boardgame') baseMatchXp += 50;
    else if (winMode === 'pineapple') baseMatchXp += 55;

    setProfiles(prev => {
      let matched = false;
      const masterIdx = prev.findIndex(p => p.isMaster) >= 0 ? prev.findIndex(p => p.isMaster) : 0;

      const updated = prev.map(p => {
        if (p.name.trim().toLowerCase() === lowerName) {
          matched = true;
          const nextXP = (p.totalXP || 0) + baseMatchXp;
          const prog = calculateProgression(nextXP);
          return {
            ...p,
            avatarIcon: avatarIcon || p.avatarIcon || 'monk_drunk',
            gamesPlayed: p.gamesPlayed + 1,
            totalSips: p.totalSips + sips,
            totalChugs: p.totalChugs + chugs,
            totalXP: nextXP,
            currentLevel: prog.currentLevel,
            currentTitle_ro: prog.titleRo,
            currentTitle_en: prog.titleEn,
            winsBoardgame: winMode === 'boardgame' ? (p.winsBoardgame || 0) + 1 : (p.winsBoardgame || 0),
            winsDuel: winMode === 'duel' ? (p.winsDuel || 0) + 1 : (p.winsDuel || 0),
            winsCasino: winMode === 'casino' ? (p.winsCasino || 0) + 1 : (p.winsCasino || 0),
            winsPineapple: winMode === 'pineapple' ? (p.winsPineapple || 0) + 1 : (p.winsPineapple || 0),
            totalPineapplePoints: (p.totalPineapplePoints || 0) + (pineapplePoints || 0),
          };
        }
        return p;
      });

      // Also aggregate stats and XP into Master Profile if playing profile is a sub-profile
      if (masterIdx >= 0 && masterIdx < updated.length) {
        const playingIsSub = updated.some(p => p.name.trim().toLowerCase() === lowerName && !p.isMaster && p.id !== updated[masterIdx].id);
        if (playingIsSub) {
          const master = updated[masterIdx];
          const masterNextXP = (master.totalXP || 0) + baseMatchXp;
          const masterProg = calculateProgression(masterNextXP);
          updated[masterIdx] = {
            ...master,
            gamesPlayed: master.gamesPlayed + 1,
            totalSips: master.totalSips + sips,
            totalChugs: master.totalChugs + chugs,
            totalXP: masterNextXP,
            currentLevel: masterProg.currentLevel,
            currentTitle_ro: master.currentTitle_ro || masterProg.titleRo,
            currentTitle_en: master.currentTitle_en || masterProg.titleEn,
            winsBoardgame: winMode === 'boardgame' ? (master.winsBoardgame || 0) + 1 : (master.winsBoardgame || 0),
            winsDuel: winMode === 'duel' ? (master.winsDuel || 0) + 1 : (master.winsDuel || 0),
            winsCasino: winMode === 'casino' ? (master.winsCasino || 0) + 1 : (master.winsCasino || 0),
            winsPineapple: winMode === 'pineapple' ? (master.winsPineapple || 0) + 1 : (master.winsPineapple || 0),
            totalPineapplePoints: (master.totalPineapplePoints || 0) + (pineapplePoints || 0),
          };
        }
      }

      if (!matched && lowerName.length > 0) {
        const prog = calculateProgression(baseMatchXp);
        updated.push({
          id: generateUniqueId('profile'),
          name: trimmed,
          avatarIcon: avatarIcon || 'monk_drunk',
          isMaster: false,
          gamesPlayed: 1,
          totalSips: sips,
          totalChugs: chugs,
          totalXP: baseMatchXp,
          currentLevel: prog.currentLevel,
          currentTitle_ro: prog.titleRo,
          currentTitle_en: prog.titleEn,
          winsBoardgame: winMode === 'boardgame' ? 1 : 0,
          winsDuel: winMode === 'duel' ? 1 : 0,
          winsCasino: winMode === 'casino' ? 1 : 0,
          winsPineapple: winMode === 'pineapple' ? 1 : 0,
          totalPineapplePoints: pineapplePoints || 0,
          unlockedAchievements: [],
          createdAt: Date.now(),
        });
      }
      return updated;
    });

    setTimeout(() => {
      checkAchievement(trimmed, {
        sipsDelta: sips,
        chugsDelta: chugs,
        isDuelWin: winMode === 'duel',
        isCasinoWin: winMode === 'casino',
        isPineappleWin: winMode === 'pineapple',
        isDuelPlayed: winMode === 'duel' || sips > 0,
        isCasinoPlayed: winMode === 'casino',
        isPineapplePlayed: winMode === 'pineapple',
        isPodiumWinner: Boolean(winMode),
      });
    }, 0);
  };

  const batchUpdateProfiles = (
    playerStats: Array<{ name: string; sips: number; chugs: number; avatarIcon?: string; winMode?: 'boardgame' | 'duel' | 'casino' | 'pineapple' }>
  ) => {
    if (!playerStats || playerStats.length === 0) return;

    // Filter out bots
    const validStats = playerStats.filter(s => s.name && !isBotPlayerName(s.name));
    if (validStats.length === 0) return;

    setProfiles(prev => {
      const updated = [...prev];
      const masterIdx = prev.findIndex(p => p.isMaster) >= 0 ? prev.findIndex(p => p.isMaster) : 0;

      validStats.forEach(stat => {
        const trimmed = stat.name.trim();
        if (!trimmed || isBotPlayerName(trimmed)) return;
        const lower = trimmed.toLowerCase();

        let baseMatchXp = 10;
        if (stat.winMode === 'duel') baseMatchXp += 35;
        else if (stat.winMode === 'casino') baseMatchXp += 60;
        else if (stat.winMode === 'boardgame') baseMatchXp += 50;
        else if (stat.winMode === 'pineapple') baseMatchXp += 55;

        const existingIdx = updated.findIndex(p => p.name.trim().toLowerCase() === lower);
        if (existingIdx >= 0) {
          const current = updated[existingIdx];
          const nextXP = (current.totalXP || 0) + baseMatchXp;
          const prog = calculateProgression(nextXP);

          updated[existingIdx] = {
            ...current,
            avatarIcon: stat.avatarIcon || current.avatarIcon || 'monk_drunk',
            gamesPlayed: current.gamesPlayed + 1,
            totalSips: current.totalSips + stat.sips,
            totalChugs: current.totalChugs + stat.chugs,
            totalXP: nextXP,
            currentLevel: prog.currentLevel,
            currentTitle_ro: current.currentTitle_ro || prog.titleRo,
            currentTitle_en: current.currentTitle_en || prog.titleEn,
            winsBoardgame: stat.winMode === 'boardgame' ? (current.winsBoardgame || 0) + 1 : (current.winsBoardgame || 0),
            winsDuel: stat.winMode === 'duel' ? (current.winsDuel || 0) + 1 : (current.winsDuel || 0),
            winsCasino: stat.winMode === 'casino' ? (current.winsCasino || 0) + 1 : (current.winsCasino || 0),
            winsPineapple: stat.winMode === 'pineapple' ? (current.winsPineapple || 0) + 1 : (current.winsPineapple || 0),
          };

          // Aggregate into Master if subprofile
          if (existingIdx !== masterIdx && masterIdx >= 0 && masterIdx < updated.length) {
            const master = updated[masterIdx];
            const masterNextXP = (master.totalXP || 0) + baseMatchXp;
            const masterProg = calculateProgression(masterNextXP);
            updated[masterIdx] = {
              ...master,
              gamesPlayed: master.gamesPlayed + 1,
              totalSips: master.totalSips + stat.sips,
              totalChugs: master.totalChugs + stat.chugs,
              totalXP: masterNextXP,
              currentLevel: masterProg.currentLevel,
              currentTitle_ro: master.currentTitle_ro || masterProg.titleRo,
              currentTitle_en: master.currentTitle_en || masterProg.titleEn,
            };
          }
        } else {
          const prog = calculateProgression(baseMatchXp);
          updated.push({
            id: generateUniqueId('profile'),
            name: trimmed,
            avatarIcon: stat.avatarIcon || 'monk_drunk',
            isMaster: false,
            gamesPlayed: 1,
            totalSips: stat.sips,
            totalChugs: stat.chugs,
            totalXP: baseMatchXp,
            currentLevel: prog.currentLevel,
            currentTitle_ro: prog.titleRo,
            currentTitle_en: prog.titleEn,
            winsBoardgame: stat.winMode === 'boardgame' ? 1 : 0,
            winsDuel: stat.winMode === 'duel' ? 1 : 0,
            winsCasino: stat.winMode === 'casino' ? 1 : 0,
            winsPineapple: stat.winMode === 'pineapple' ? 1 : 0,
            createdAt: Date.now(),
          });
        }
      });

      return updated;
    });

    setTimeout(() => {
      validStats.forEach(stat => {
        checkAchievement(stat.name, {
          sipsDelta: stat.sips,
          chugsDelta: stat.chugs,
          isDuelWin: stat.winMode === 'duel',
          isCasinoWin: stat.winMode === 'casino',
          isPodiumWinner: Boolean(stat.winMode),
        });
      });
    }, 0);
  };

  const unlockAchievement = (achId: string, playerName?: string): string[] => {
    const targetName = playerName || profiles[0]?.name || 'Jucător';
    return checkAchievement(targetName, { type: achId });
  };

  const recordGameStats = (stats: {
    mode?: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash' | string;
    isWin?: boolean;
    sipsDelta?: number;
    chugsDelta?: number;
    isCrashWin?: boolean;
    playerName?: string;
  }) => {
    const targetName = stats.playerName || profiles[0]?.name || 'Jucător';
    if (isBotPlayerName(targetName)) return;
    const sips = stats.sipsDelta || 0;
    const chugs = stats.chugsDelta || 0;
    updateProfileStats(
      targetName,
      sips,
      chugs,
      undefined,
      stats.isWin && stats.mode !== 'crash' ? (stats.mode as any) : undefined
    );
    if (stats.mode === 'crash') {
      checkAchievement(targetName, {
        isCrashPlayed: true,
        isCrashWin: Boolean(stats.isWin || stats.isCrashWin),
        sipsDelta: sips,
      });
    }
  };

  const resetAllStats = async () => {
    const defaultProg = calculateProgression(0);
    const master = profiles.find(p => p.isMaster) || profiles[0];
    const masterName = master?.name || user?.displayName || 'Starețul Mănăstirii';
    const masterAvatar = master?.avatarIcon || 'monk_master';

    // Fresh Master Profile starting clean with 0 subprofiles
    const cleanMasterProfile: Profile = {
      id: master?.id || generateUniqueId('master'),
      name: masterName,
      avatarIcon: masterAvatar,
      isMaster: true,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      totalXP: 0,
      currentLevel: 1,
      currentTitle_ro: defaultProg.titleRo,
      currentTitle_en: defaultProg.titleEn,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      winsPineapple: 0,
      winsCrash: 0,
      gamesPlayedCrash: 0,
      sipsDrunkCrash: 0,
      totalPineapplePoints: 0,
      unlockedAchievements: [],
      createdAt: Date.now(),
    };

    const cleanProfiles = [cleanMasterProfile];

    setProfiles(cleanProfiles);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(cleanProfiles));
    setAndPersistDrunkenCoins(100);
    resetAllHeadToHead();

    if (user) {
      hasMergedCloudRef.current = user.uid;
      try {
        await resetCloudAccount(cleanProfiles);
      } catch (err) {
        console.warn('Reset cloud failed:', err);
      }
    }
  };

  const resetGlobalTavernLeaderboard = async () => {
    const cleanMaster = profiles.find(p => p.isMaster) || profiles[0];
    try {
      await resetGlobalLeaderboard(cleanMaster ? [cleanMaster] : undefined);
    } catch (err) {
      console.warn('Reset global leaderboard failed:', err);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.ro;
    let str = (dict as any)[key] || (translations.ro as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return str;
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      diceSkin,
      setDiceSkin,
      autoSaveNewProfiles,
      setAutoSaveNewProfiles,
      profiles,
      masterProfile,
      subProfiles,
      drunkenCoins,
      setMainProfile,
      addProfile,
      deleteProfile,
      updateProfileAvatar,
      updateProfileName,
      updateProfileStats,
      batchUpdateProfiles,
      recordWin,
      checkAchievement,
      unlockAchievement,
      recordGameStats,
      awardMatchXp,
      spendDrunkenCoins,
      addDrunkenCoins,
      activeXpBreakdown,
      dismissXpBreakdown,
      activeLegendaryAchievement,
      dismissLegendaryAchievement,
      resetAllStats,
      resetGlobalTavernLeaderboard,
      customThemeBackgrounds,
      setCustomThemeBackground,
      resetCustomThemeBackground,
      syncWithCloud,
      t,
      // Shop & Inventory System
      purchasedItems,
      isItemPurchased,
      purchaseShopItem,
      hasPerk,
      equipCustomTitle,
      // Daily Quests System
      dailyQuestPool,
      activeDailyQuests,
      trackQuestEvent,
      claimDailyQuestReward,
      claimDailyBonusChest,
      timeUntilQuestReset,
      completedUnclaimedQuestsCount,
      activeQuestCompletedNotification,
      dismissQuestCompletedNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

