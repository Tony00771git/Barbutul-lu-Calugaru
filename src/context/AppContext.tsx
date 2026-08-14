import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, ThemeId, DiceSkin, Profile } from '../types';
import { translations } from '../i18n/translations';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';

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
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  diceSkin: DiceSkin;
  setDiceSkin: (skin: DiceSkin) => void;
  profiles: Profile[];
  addProfile: (name: string, avatarIcon?: string) => void;
  deleteProfile: (id: string) => void;
  updateProfileAvatar: (id: string, avatarIcon: string) => void;
  updateProfileStats: (playerName: string, sips: number, chugs: number, avatarIcon?: string) => void;
  batchUpdateProfiles: (playerStats: Array<{ name: string; sips: number; chugs: number; avatarIcon?: string }>) => void;
  checkAchievement: (playerName: string, event: AchievementEvent) => void;
  activeLegendaryAchievement: { achievement: Achievement; playerName: string } | null;
  dismissLegendaryAchievement: () => void;
  resetAllStats: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: 'barbut_monk_lang',
  THEME: 'barbut_monk_theme',
  DICE_SKIN: 'barbut_monk_dice_skin',
  PROFILES: 'barbut_monk_profiles',
};

export const generateUniqueId = (prefix = 'id'): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.floor(Math.random() * 100000)}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return saved === 'en' ? 'en' : 'ro';
  });

  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeId;
    return ['tavern', 'spring', 'winter', 'sky', 'battlefield'].includes(saved) ? saved : 'tavern';
  });

  const [diceSkin, setDiceSkinState] = useState<DiceSkin>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DICE_SKIN) as DiceSkin;
    return ['gold', 'bone', 'wood'].includes(saved) ? saved : 'gold';
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          const sanitized: Profile[] = parsed.map((p, idx) => {
            let uniqueId = p.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = generateUniqueId(`profile_${idx}`);
            }
            seenIds.add(uniqueId);
            return {
              ...p,
              id: uniqueId,
            };
          });
          return sanitized;
        }
      } catch (e) {
        console.error('Failed to parse saved profiles', e);
      }
    }
    return [
      { id: 'profile_default_1', name: 'Călugărul Vasile', avatarIcon: 'monk_drunk', gamesPlayed: 5, totalSips: 42, totalChugs: 3, createdAt: Date.now() - 1000000 },
      { id: 'profile_default_2', name: 'Fratele Onufrie', avatarIcon: 'knight', gamesPlayed: 3, totalSips: 28, totalChugs: 1, createdAt: Date.now() - 500000 },
    ];
  });

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
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const setTheme = (t: ThemeId) => setThemeState(t);
  const setDiceSkin = (s: DiceSkin) => setDiceSkinState(s);

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
          unlockedAchievements: [],
          createdAt: Date.now(),
        };
      }

      const unlocked = new Set<string>(targetProfile.unlockedAchievements || []);
      const newUnlockedList: string[] = [];

      // Check all 20 achievements against current profile + event
      const currSips = targetProfile.totalSips + (event.sipsDelta || 0);
      const currChugs = targetProfile.totalChugs + (event.chugsDelta || 0);
      const currGames = targetProfile.gamesPlayed;

      // 1. first_sip
      if (!unlocked.has('first_sip') && (currSips >= 1 || (event.sipsDelta && event.sipsDelta > 0))) {
        unlocked.add('first_sip');
        newUnlockedList.push('first_sip');
      }
      // 2. heaven_blessing
      if (!unlocked.has('heaven_blessing') && event.isHeaven) {
        unlocked.add('heaven_blessing');
        newUnlockedList.push('heaven_blessing');
      }
      // 3. first_chug
      if (!unlocked.has('first_chug') && (currChugs >= 1 || event.isChug)) {
        unlocked.add('first_chug');
        newUnlockedList.push('first_chug');
      }
      // 4. first_game
      if (!unlocked.has('first_game') && currGames >= 1) {
        unlocked.add('first_game');
        newUnlockedList.push('first_game');
      }
      // 5. first_property
      if (!unlocked.has('first_property') && event.boughtProperty) {
        unlocked.add('first_property');
        newUnlockedList.push('first_property');
      }
      // 6. dungeon_visit
      if (!unlocked.has('dungeon_visit') && event.isJail) {
        unlocked.add('dungeon_visit');
        newUnlockedList.push('dungeon_visit');
      }
      // 7. gambler_monk
      if (!unlocked.has('gambler_monk') && event.isSlot) {
        unlocked.add('gambler_monk');
        newUnlockedList.push('gambler_monk');
      }
      // 8. fate_card
      if (!unlocked.has('fate_card') && event.isCard) {
        unlocked.add('fate_card');
        newUnlockedList.push('fate_card');
      }

      // RARE
      // 9. chug_trio (3 gropi in same game)
      if (!unlocked.has('chug_trio') && (event.singleGameChugs && event.singleGameChugs >= 3)) {
        unlocked.add('chug_trio');
        newUnlockedList.push('chug_trio');
      }
      // 10. chug_quintet (5 gropi in same game)
      if (!unlocked.has('chug_quintet') && (event.singleGameChugs && event.singleGameChugs >= 5)) {
        unlocked.add('chug_quintet');
        newUnlockedList.push('chug_quintet');
      }
      // 11. drinker_50 (50 sips in single game)
      if (!unlocked.has('drinker_50') && (event.singleGameSips && event.singleGameSips >= 50)) {
        unlocked.add('drinker_50');
        newUnlockedList.push('drinker_50');
      }
      // 12. monopoly_full_color (3+ properties owned)
      if (!unlocked.has('monopoly_full_color') && (event.currentBoardProps && event.currentBoardProps >= 3)) {
        unlocked.add('monopoly_full_color');
        newUnlockedList.push('monopoly_full_color');
      }
      // 13. jailbreak_key
      if (!unlocked.has('jailbreak_key') && event.isJailEscape) {
        unlocked.add('jailbreak_key');
        newUnlockedList.push('jailbreak_key');
      }
      // 14. give_up_surrender
      if (!unlocked.has('give_up_surrender') && event.isGiveUp) {
        unlocked.add('give_up_surrender');
        newUnlockedList.push('give_up_surrender');
      }
      // 15. podium_winner
      if (!unlocked.has('podium_winner') && event.isPodiumWinner) {
        unlocked.add('podium_winner');
        newUnlockedList.push('podium_winner');
      }

      // LEGENDARY
      // 16. legend_1000_sips
      if (!unlocked.has('legend_1000_sips') && currSips >= 1000) {
        unlocked.add('legend_1000_sips');
        newUnlockedList.push('legend_1000_sips');
      }
      // 17. legend_50_chugs
      if (!unlocked.has('legend_50_chugs') && currChugs >= 50) {
        unlocked.add('legend_50_chugs');
        newUnlockedList.push('legend_50_chugs');
      }
      // 18. legend_25_games
      if (!unlocked.has('legend_25_games') && currGames >= 25) {
        unlocked.add('legend_25_games');
        newUnlockedList.push('legend_25_games');
      }
      // 19. legend_tycoon (8+ props and 150+ gold in Monopoly)
      if (!unlocked.has('legend_tycoon') && (event.currentBoardProps && event.currentBoardProps >= 8) && (event.currentBoardGold && event.currentBoardGold >= 150)) {
        unlocked.add('legend_tycoon');
        newUnlockedList.push('legend_tycoon');
      }
      // 20. legend_ascended (match >= 20 turns, 0 chugs)
      if (!unlocked.has('legend_ascended') && (event.matchTurns && event.matchTurns >= 20) && (event.matchChugs === 0)) {
        unlocked.add('legend_ascended');
        newUnlockedList.push('legend_ascended');
      }

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

      // Update state if new achievements were gained or profile needs saving
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

  const addProfile = (name: string, avatarIcon: string = 'monk_drunk') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = profiles.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    const newProfile: Profile = {
      id: generateUniqueId('profile'),
      name: trimmed,
      avatarIcon,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      createdAt: Date.now(),
    };
    setProfiles(prev => [...prev, newProfile]);
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const updateProfileAvatar = (id: string, avatarIcon: string) => {
    setProfiles(prev => prev.map(p => (p.id === id ? { ...p, avatarIcon } : p)));
  };

  const updateProfileStats = (playerName: string, sips: number, chugs: number, avatarIcon?: string) => {
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
          };
        }
        return p;
      });

      if (!matched && lowerName.length > 0) {
        // Auto create profile if player played with a new unique name
        updated.push({
          id: generateUniqueId('profile'),
          name: trimmed,
          avatarIcon: avatarIcon || 'monk_drunk',
          gamesPlayed: 1,
          totalSips: sips,
          totalChugs: chugs,
          createdAt: Date.now(),
        });
      }
      return updated;
    });
  };

  const batchUpdateProfiles = (playerStats: Array<{ name: string; sips: number; chugs: number; avatarIcon?: string }>) => {
    if (!playerStats || playerStats.length === 0) return;

    setProfiles(prev => {
      const updated = [...prev];

      playerStats.forEach(stat => {
        const trimmed = stat.name.trim();
        if (!trimmed) return;
        const lower = trimmed.toLowerCase();

        const existingIdx = updated.findIndex(p => p.name.trim().toLowerCase() === lower);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            avatarIcon: stat.avatarIcon || updated[existingIdx].avatarIcon || 'monk_drunk',
            gamesPlayed: updated[existingIdx].gamesPlayed + 1,
            totalSips: updated[existingIdx].totalSips + stat.sips,
            totalChugs: updated[existingIdx].totalChugs + stat.chugs,
          };
        } else {
          updated.push({
            id: generateUniqueId('profile'),
            name: trimmed,
            avatarIcon: stat.avatarIcon || 'monk_drunk',
            gamesPlayed: 1,
            totalSips: stat.sips,
            totalChugs: stat.chugs,
            createdAt: Date.now(),
          });
        }
      });

      return updated;
    });
  };

  const resetAllStats = () => {
    setProfiles(prev => prev.map(p => ({
      ...p,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
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
      profiles,
      addProfile,
      deleteProfile,
      updateProfileAvatar,
      updateProfileStats,
      batchUpdateProfiles,
      checkAchievement,
      activeLegendaryAchievement,
      dismissLegendaryAchievement,
      resetAllStats,
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
