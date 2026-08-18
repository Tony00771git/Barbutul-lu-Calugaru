import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Language, ThemeId, DiceSkin, Profile } from '../types';
import { translations } from '../i18n/translations';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';
import { useAuth } from './AuthContext';
import { syncAccountProfilesToCloud } from '../lib/firestoreService';

export interface AchievementEvent {
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
  isDoubles?: boolean;
  isAvatarCustomized?: boolean;
  isTriviaCorrect?: boolean;
  isRentPaid?: boolean;
  isPassDice?: boolean;
  hasComebackWin?: boolean;
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
  addProfile: (name: string, avatarIcon?: string) => Profile | undefined;
  deleteProfile: (id: string) => void;
  updateProfileAvatar: (id: string, avatarIcon: string) => void;
  updateProfileStats: (playerName: string, sips: number, chugs: number, avatarIcon?: string, winMode?: 'boardgame' | 'duel' | 'casino') => void;
  batchUpdateProfiles: (playerStats: Array<{ name: string; sips: number; chugs: number; avatarIcon?: string; winMode?: 'boardgame' | 'duel' | 'casino' }>) => void;
  recordWin: (playerName: string, mode: 'boardgame' | 'duel' | 'casino') => void;
  checkAchievement: (playerName: string, event: AchievementEvent) => void;
  activeLegendaryAchievement: { achievement: Achievement; playerName: string } | null;
  dismissLegendaryAchievement: () => void;
  resetAllStats: () => void;
  customThemeBackgrounds: Record<ThemeId, string>;
  setCustomThemeBackground: (themeId: ThemeId, url: string) => void;
  resetCustomThemeBackground: (themeId: ThemeId) => void;
  syncWithCloud: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: 'barbut_monk_lang',
  THEME: 'barbut_monk_theme',
  DICE_SKIN: 'barbut_monk_dice_skin',
  PROFILES: 'barbut_monk_profiles',
  AUTO_SAVE_PROFILES: 'barbut_monk_auto_save_profiles',
  CUSTOM_THEME_BGS: 'barbut_monk_custom_theme_bgs',
};

export const generateUniqueId = (prefix = 'id'): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.floor(Math.random() * 100000)}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, cloudProfile } = useAuth();

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
    return ['tavern', 'cellar', 'great_hall', 'dungeon'].includes(saved) ? saved : 'tavern';
  });

  const [diceSkin, setDiceSkinState] = useState<DiceSkin>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DICE_SKIN) as DiceSkin;
    return ['gold', 'bone', 'wood'].includes(saved) ? saved : 'gold';
  });

  const [autoSaveNewProfiles, setAutoSaveNewProfilesState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_PROFILES);
    return saved === null ? true : saved === 'true';
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          const sanitized: Profile[] = parsed.map((p, idx) => {
            let uniqueId = p.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = generateUniqueId(`profile_${idx}`);
            }
            seenIds.add(uniqueId);
            return {
              id: uniqueId,
              name: p.name || 'Călugăr',
              avatarIcon: p.avatarIcon || 'monk_drunk',
              gamesPlayed: p.gamesPlayed || 0,
              totalSips: p.totalSips || 0,
              totalChugs: p.totalChugs || 0,
              winsBoardgame: p.winsBoardgame || 0,
              winsDuel: p.winsDuel || 0,
              winsCasino: p.winsCasino || 0,
              unlockedAchievements: p.unlockedAchievements || [],
              createdAt: p.createdAt || Date.now(),
            };
          });
          return sanitized;
        }
      } catch (e) {
        console.error('Failed to parse saved profiles', e);
      }
    }
    return [
      { id: 'profile_default_1', name: 'Călugărul Vasile', avatarIcon: 'monk_drunk', gamesPlayed: 5, totalSips: 42, totalChugs: 3, winsBoardgame: 2, winsDuel: 1, winsCasino: 1, createdAt: Date.now() - 1000000 },
      { id: 'profile_default_2', name: 'Fratele Onufrie', avatarIcon: 'knight', gamesPlayed: 3, totalSips: 28, totalChugs: 1, winsBoardgame: 1, winsDuel: 0, winsCasino: 0, createdAt: Date.now() - 500000 },
    ];
  });

  // Track initial cloud sync per user UID so we merge cloud profiles when user logs in on a new device
  const hasMergedCloudRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && cloudProfile?.profiles && cloudProfile.profiles.length > 0) {
      if (hasMergedCloudRef.current !== user.uid) {
        hasMergedCloudRef.current = user.uid;
        // Merge cloud profiles with local profiles
        setProfiles(prev => {
          const merged = [...prev];
          cloudProfile.profiles!.forEach(cp => {
            const matchIdx = merged.findIndex(p => p.id === cp.id || p.name.trim().toLowerCase() === cp.name.trim().toLowerCase());
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
                winsBoardgame: cp.winsBoardgame || 0,
                winsDuel: cp.winsDuel || 0,
                winsCasino: cp.winsCasino || 0,
                unlockedAchievements: cp.unlockedAchievements || [],
                createdAt: cp.createdAt || Date.now(),
              });
            }
          });
          return merged;
        });
      }
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

  const checkAchievement = (playerName: string, event: AchievementEvent) => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    const lowerName = trimmed.toLowerCase();

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
          unlockedAchievements: [],
          createdAt: Date.now(),
        };
      }

      const unlocked = new Set<string>(targetProfile.unlockedAchievements || []);
      const newUnlockedList: string[] = [];

      const currSips = targetProfile.totalSips + (event.sipsDelta || 0);
      const currChugs = targetProfile.totalChugs + (event.chugsDelta || 0);
      const currGames = targetProfile.gamesPlayed;
      const bWins = targetProfile.winsBoardgame || 0;
      const dWins = targetProfile.winsDuel || 0;
      const cWins = targetProfile.winsCasino || 0;

      const tryUnlock = (achId: string, condition: boolean) => {
        if (!unlocked.has(achId) && condition) {
          unlocked.add(achId);
          newUnlockedList.push(achId);
        }
      };

      // ================= COMMON (19) =================
      tryUnlock('first_sip', currSips >= 1 || Boolean(event.sipsDelta && event.sipsDelta > 0));
      tryUnlock('heaven_blessing', Boolean(event.isHeaven));
      tryUnlock('first_chug', currChugs >= 1 || Boolean(event.isChug));
      tryUnlock('first_game', currGames >= 1);
      tryUnlock('first_property', Boolean(event.boughtProperty));
      tryUnlock('dungeon_visit', Boolean(event.isJail));
      tryUnlock('gambler_monk', Boolean(event.isSlot));
      tryUnlock('fate_card', Boolean(event.isCard));
      tryUnlock('first_duel', Boolean(event.isDuelPlayed || event.isDuelWin || dWins > 0));
      tryUnlock('first_casino', Boolean(event.isCasinoPlayed || event.isCasinoWin || cWins > 0));
      tryUnlock('pass_dice_turn', Boolean(event.isPassDice));
      tryUnlock('quick_reflex', Boolean(event.isDuelQuickReflex));
      tryUnlock('sip_apprentice_10', currSips >= 10);
      tryUnlock('monopoly_rent_pay', Boolean(event.isRentPaid));
      tryUnlock('craps_passline_win', Boolean(event.isCrapsPassLineWin));
      tryUnlock('dice_doubles_master', Boolean(event.isDoubles));
      tryUnlock('avatar_customizer', Boolean(event.isAvatarCustomized || (targetProfile.avatarIcon && targetProfile.avatarIcon !== 'monk_drunk')));
      tryUnlock('duel_rebound', Boolean(event.isDuelRebound));
      tryUnlock('trivia_scholar', Boolean(event.isTriviaCorrect));

      // ================= RARE (18) =================
      tryUnlock('chug_trio', Boolean(event.singleGameChugs && event.singleGameChugs >= 3));
      tryUnlock('chug_quintet', Boolean(event.singleGameChugs && event.singleGameChugs >= 5));
      tryUnlock('drinker_50', Boolean(event.singleGameSips && event.singleGameSips >= 50));
      tryUnlock('monopoly_full_color', Boolean(event.currentBoardProps && event.currentBoardProps >= 3));
      tryUnlock('jailbreak_key', Boolean(event.isJailEscape));
      tryUnlock('give_up_surrender', Boolean(event.isGiveUp));
      tryUnlock('podium_winner', Boolean(event.isPodiumWinner));
      tryUnlock('duel_victory', Boolean(event.isDuelWin || dWins >= 1));
      tryUnlock('casino_highroller', Boolean(event.isCasinoWin || cWins >= 1));
      tryUnlock('sips_century_100', currSips >= 100);
      tryUnlock('chug_veteran_10', currChugs >= 10);
      tryUnlock('monopoly_land_baron', Boolean(event.currentBoardProps && event.currentBoardProps >= 5));
      tryUnlock('craps_snake_eyes', Boolean(event.isCrapsSnakeEyes));
      tryUnlock('craps_midnight', Boolean(event.isCrapsMidnight));
      tryUnlock('duel_streak_3', Boolean(event.duelStreak && event.duelStreak >= 3));
      tryUnlock('gold_hoarder_100', Boolean(event.currentBoardGold && event.currentBoardGold >= 100));
      tryUnlock('speed_demon_trivia', Boolean(event.isDuelQuickReflex));
      tryUnlock('resurrected_phoenix', Boolean(event.hasComebackWin));

      // ================= LEGENDARY (16) =================
      tryUnlock('legend_1000_sips', currSips >= 1000);
      tryUnlock('legend_50_chugs', currChugs >= 50);
      tryUnlock('legend_25_games', currGames >= 25);
      tryUnlock('legend_tycoon', Boolean(event.currentBoardProps && event.currentBoardProps >= 8 && event.currentBoardGold && event.currentBoardGold >= 150));
      tryUnlock('legend_ascended', Boolean(event.matchTurns && event.matchTurns >= 20 && event.matchChugs === 0));
      tryUnlock('legend_tri_champion', bWins >= 1 && dWins >= 1 && cWins >= 1);
      tryUnlock('legend_duel_grandmaster', dWins >= 10);
      tryUnlock('legend_craps_king', cWins >= 10);
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

      const updatedProfile: Profile = {
        ...targetProfile,
        unlockedAchievements: Array.from(unlocked),
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
  };

  const addProfile = (name: string, avatarIcon: string = 'monk_drunk'): Profile | undefined => {
    const trimmed = name.trim();
    if (!trimmed) return undefined;
    const existing = profiles.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newProfile: Profile = {
      id: generateUniqueId('profile'),
      name: trimmed,
      avatarIcon,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      createdAt: Date.now(),
    };
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const deleteProfile = (id: string) => {
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

  const recordWin = (playerName: string, mode: 'boardgame' | 'duel' | 'casino') => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    const lowerName = trimmed.toLowerCase();

    setProfiles(prev => {
      return prev.map(p => {
        if (p.name.trim().toLowerCase() === lowerName) {
          return {
            ...p,
            winsBoardgame: mode === 'boardgame' ? (p.winsBoardgame || 0) + 1 : (p.winsBoardgame || 0),
            winsDuel: mode === 'duel' ? (p.winsDuel || 0) + 1 : (p.winsDuel || 0),
            winsCasino: mode === 'casino' ? (p.winsCasino || 0) + 1 : (p.winsCasino || 0),
          };
        }
        return p;
      });
    });

    setTimeout(() => {
      checkAchievement(trimmed, {
        isDuelWin: mode === 'duel',
        isCasinoWin: mode === 'casino',
        isPodiumWinner: true,
      });
    }, 0);
  };

  const updateProfileStats = (
    playerName: string,
    sips: number,
    chugs: number,
    avatarIcon?: string,
    winMode?: 'boardgame' | 'duel' | 'casino'
  ) => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    const lowerName = trimmed.toLowerCase();

    setProfiles(prev => {
      let matched = false;
      const updated = prev.map(p => {
        if (p.name.trim().toLowerCase() === lowerName) {
          matched = true;
          return {
            ...p,
            avatarIcon: avatarIcon || p.avatarIcon || 'monk_drunk',
            gamesPlayed: p.gamesPlayed + 1,
            totalSips: p.totalSips + sips,
            totalChugs: p.totalChugs + chugs,
            winsBoardgame: winMode === 'boardgame' ? (p.winsBoardgame || 0) + 1 : (p.winsBoardgame || 0),
            winsDuel: winMode === 'duel' ? (p.winsDuel || 0) + 1 : (p.winsDuel || 0),
            winsCasino: winMode === 'casino' ? (p.winsCasino || 0) + 1 : (p.winsCasino || 0),
          };
        }
        return p;
      });

      if (!matched && lowerName.length > 0) {
        updated.push({
          id: generateUniqueId('profile'),
          name: trimmed,
          avatarIcon: avatarIcon || 'monk_drunk',
          gamesPlayed: 1,
          totalSips: sips,
          totalChugs: chugs,
          winsBoardgame: winMode === 'boardgame' ? 1 : 0,
          winsDuel: winMode === 'duel' ? 1 : 0,
          winsCasino: winMode === 'casino' ? 1 : 0,
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
        isDuelPlayed: winMode === 'duel' || sips > 0,
        isCasinoPlayed: winMode === 'casino',
        isPodiumWinner: Boolean(winMode),
      });
    }, 0);
  };

  const batchUpdateProfiles = (
    playerStats: Array<{ name: string; sips: number; chugs: number; avatarIcon?: string; winMode?: 'boardgame' | 'duel' | 'casino' }>
  ) => {
    if (!playerStats || playerStats.length === 0) return;

    setProfiles(prev => {
      const updated = [...prev];

      playerStats.forEach(stat => {
        const trimmed = stat.name.trim();
        if (!trimmed) return;
        const lower = trimmed.toLowerCase();

        const existingIdx = updated.findIndex(p => p.name.trim().toLowerCase() === lower);
        if (existingIdx >= 0) {
          const current = updated[existingIdx];
          updated[existingIdx] = {
            ...current,
            avatarIcon: stat.avatarIcon || current.avatarIcon || 'monk_drunk',
            gamesPlayed: current.gamesPlayed + 1,
            totalSips: current.totalSips + stat.sips,
            totalChugs: current.totalChugs + stat.chugs,
            winsBoardgame: stat.winMode === 'boardgame' ? (current.winsBoardgame || 0) + 1 : (current.winsBoardgame || 0),
            winsDuel: stat.winMode === 'duel' ? (current.winsDuel || 0) + 1 : (current.winsDuel || 0),
            winsCasino: stat.winMode === 'casino' ? (current.winsCasino || 0) + 1 : (current.winsCasino || 0),
          };
        } else {
          updated.push({
            id: generateUniqueId('profile'),
            name: trimmed,
            avatarIcon: stat.avatarIcon || 'monk_drunk',
            gamesPlayed: 1,
            totalSips: stat.sips,
            totalChugs: stat.chugs,
            winsBoardgame: stat.winMode === 'boardgame' ? 1 : 0,
            winsDuel: stat.winMode === 'duel' ? 1 : 0,
            winsCasino: stat.winMode === 'casino' ? 1 : 0,
            createdAt: Date.now(),
          });
        }
      });

      return updated;
    });

    setTimeout(() => {
      playerStats.forEach(stat => {
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

  const resetAllStats = () => {
    setProfiles(prev => prev.map(p => ({
      ...p,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
    })));
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
      addProfile,
      deleteProfile,
      updateProfileAvatar,
      updateProfileStats,
      batchUpdateProfiles,
      recordWin,
      checkAchievement,
      activeLegendaryAchievement,
      dismissLegendaryAchievement,
      resetAllStats,
      customThemeBackgrounds,
      setCustomThemeBackground,
      resetCustomThemeBackground,
      syncWithCloud,
      t,
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

