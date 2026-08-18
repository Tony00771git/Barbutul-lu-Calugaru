import React, { useState, useEffect } from 'react';
import { GameMode, Difficulty, CustomDoubles, Player, DuelSubmode, DuelDifficulty, Profile } from '../types';
import { useApp, generateUniqueId } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarModal } from './AvatarModal';
import { ProfilePickerModal } from './ProfilePickerModal';
import { ProfilesManagementModal } from './ProfilesManagementModal';
import { GlobalLeaderboardSection } from './GlobalLeaderboardSection';

interface SetupScreenProps {
  onStartGame: (
    mode: GameMode,
    players: Player[],
    difficulty: Difficulty,
    customDoubles: CustomDoubles,
    boardDiceCount: 1 | 2,
    duelSubmode?: DuelSubmode,
    duelDifficulty?: DuelDifficulty
  ) => void;
  onStartDuel: (
    role: 'host' | 'join',
    localPlayer: { id: string; name: string; avatarIcon: string; color: string },
    submode: DuelSubmode,
    difficulty: DuelDifficulty,
    roomCode?: string,
    targetPoints?: number
  ) => void;
  onStartCasino: (
    role: 'host' | 'join',
    localPlayer: { id: string; name: string; avatarIcon: string; color: string },
    startingChips: number,
    roomCode?: string
  ) => void;
  onOpenAchievements: () => void;
  onOpenProfiles?: () => void;
  onOpenCustomize: () => void;
  onOpenRules: () => void;
  onOpenCloudModal?: () => void;
}

const PLAYER_COLORS = [
  '#e8c84a', // Gold
  '#e05c3a', // Red-orange
  '#4a90e2', // Blue
  '#50e3c2', // Teal
  '#b8e986', // Green
  '#bd10e0', // Purple
];

const DEFAULT_AVATARS = [
  'monk_drunk',
  'archer',
  'priestess',
  'knight',
  'wizard',
  'blacksmith',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame,
  onStartDuel,
  onStartCasino,
  onOpenAchievements,
  onOpenProfiles,
  onOpenCustomize,
  onOpenRules,
  onOpenCloudModal,
}) => {
  const { t, profiles, addProfile, autoSaveNewProfiles, language } = useApp();

  // Screen View Switcher: 'play' (Game setup + profiles) vs 'leaderboard' (Dedicated Global Leaderboard)
  const [mainTab, setMainTab] = useState<'play' | 'leaderboard'>('play');

  // Pop-up modal for "Profilurile Tale" (hidden until button is clicked)
  const [showProfilesModal, setShowProfilesModal] = useState<boolean>(false);

  const [mode, setMode] = useState<GameMode>('normal');
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [boardDiceCount, setBoardDiceCount] = useState<1 | 2>(1);

  // Duel mode state
  const [duelRole, setDuelRole] = useState<'host' | 'join'>('host');
  const [duelSubmode, setDuelSubmode] = useState<DuelSubmode>('general');
  const [duelDifficulty, setDuelDifficulty] = useState<DuelDifficulty>('easy');
  const [duelTargetPoints, setDuelTargetPoints] = useState<number>(30);
  const [customTargetInput, setCustomTargetInput] = useState<string>('30');
  const [isCustomTarget, setIsCustomTarget] = useState<boolean>(false);
  const [duelRoomCodeInput, setDuelRoomCodeInput] = useState<string>('');

  // Casino mode state
  const [casinoRole, setCasinoRole] = useState<'host' | 'join'>('host');
  const [casinoStartingChips, setCasinoStartingChips] = useState<number>(500);
  const [casinoRoomCodeInput, setCasinoRoomCodeInput] = useState<string>('');

  // Player names & avatars
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Fratele Vasile',
    'Călugărul Onufrie',
    'Starețul Petru',
    'Ieromonahul Ioan',
    'Diaconul Gheorghe',
    'Fratele Matei',
  ]);
  const [playerAvatars, setPlayerAvatars] = useState<string[]>(DEFAULT_AVATARS);
  const [avatarModalIndex, setAvatarModalIndex] = useState<number | null>(null);

  // Profile picker modal index for roster players (null = closed)
  const [pickerPlayerIndex, setPickerPlayerIndex] = useState<number | null>(null);

  // Custom doubles
  const [showCustomDoublesModal, setShowCustomDoublesModal] = useState<boolean>(false);
  const [customDoubles, setCustomDoubles] = useState<CustomDoubles>({
    '2-2': '',
    '3-3': '',
    '4-4': '',
    '5-5': '',
  });

  // Auto-detect URL room params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const casinoParam = params.get('casino_room');

      if (casinoParam) {
        setMode('casino');
        setCasinoRole('join');
        setCasinoRoomCodeInput(casinoParam.toUpperCase());
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (roomParam) {
        setMode('duel');
        setDuelRole('join');
        setDuelRoomCodeInput(roomParam.toUpperCase());
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  }, []);

  const handleNameChange = (index: number, val: string) => {
    const updated = [...playerNames];
    updated[index] = val;
    setPlayerNames(updated);
  };

  const handleAvatarChange = (index: number, avatarId: string) => {
    setPlayerAvatars((prev) => {
      const next = [...prev];
      next[index] = avatarId;
      return next;
    });
  };

  const selectProfileForPlayer = (index: number, profile: Profile) => {
    handleNameChange(index, profile.name);
    if (profile.avatarIcon) {
      handleAvatarChange(index, profile.avatarIcon);
    }
  };

  const handleStart = () => {
    if (mode === 'casino') {
      const myName = playerNames[0].trim() || (casinoRole === 'host' ? 'Gazda Cazino' : 'Jucător Cazino');
      let matchedProfile = profiles.find((p) => p.name.trim().toLowerCase() === myName.toLowerCase());
      const myAvatar = playerAvatars[0] || matchedProfile?.avatarIcon || 'monk_drunk';

      if (!matchedProfile && autoSaveNewProfiles && myName.trim()) {
        matchedProfile = addProfile(myName.trim(), myAvatar);
      }

      const localPlayer = {
        id: generateUniqueId('casino_player'),
        name: myName,
        avatarIcon: myAvatar,
        color: casinoRole === 'host' ? '#e8c84a' : '#4a90e2',
      };

      onStartCasino(
        casinoRole,
        localPlayer,
        Math.max(50, casinoStartingChips),
        casinoRoomCodeInput.trim().toUpperCase()
      );
      return;
    }

    if (mode === 'duel') {
      const myName = playerNames[0].trim() || (duelRole === 'host' ? 'Gazda Duelului' : 'Luptătorul Oaspete');
      let matchedProfile = profiles.find((p) => p.name.trim().toLowerCase() === myName.toLowerCase());
      const myAvatar = playerAvatars[0] || matchedProfile?.avatarIcon || 'monk_drunk';

      if (!matchedProfile && autoSaveNewProfiles && myName.trim()) {
        matchedProfile = addProfile(myName.trim(), myAvatar);
      }

      const localPlayer = {
        id: generateUniqueId('duel_player'),
        name: myName,
        avatarIcon: myAvatar,
        color: duelRole === 'host' ? '#e8c84a' : '#e05c3a',
      };

      const finalTarget = isCustomTarget ? parseInt(customTargetInput) || 30 : duelTargetPoints;

      onStartDuel(
        duelRole,
        localPlayer,
        duelSubmode,
        duelDifficulty,
        duelRoomCodeInput.trim().toUpperCase(),
        finalTarget
      );
      return;
    }

    const activeNames = playerNames.slice(0, playerCount).map((n, idx) => n.trim() || `${t('playerPlaceholder')} ${idx + 1}`);

    const finalPlayers: Player[] = activeNames.map((name, idx) => {
      let matchedProfile = profiles.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
      const chosenAvatar = playerAvatars[idx] || matchedProfile?.avatarIcon || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];

      if (!matchedProfile && autoSaveNewProfiles && name.trim()) {
        matchedProfile = addProfile(name.trim(), chosenAvatar);
      }

      return {
        id: generateUniqueId(`player_${idx}`),
        name,
        profileId: matchedProfile?.id,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        avatarIcon: chosenAvatar,
        sipsTurn: 0,
        sipsTotal: 0,
        chugsTotal: 0,
        passesCount: 0,
        position: 0,
        gold: 30,
        properties: [],
        inJail: false,
        jailTurnsLeft: 0,
        pardonLetters: 0,
        jailKeys: 0,
        hasGivenUp: false,
      };
    });

    onStartGame(mode, finalPlayers, difficulty, customDoubles, boardDiceCount, duelSubmode, duelDifficulty);
  };

  return (
    <div className="w-full flex flex-col items-center py-2 sm:py-3.5 px-2.5 sm:px-4 max-w-md mx-auto space-y-3 animate-fade-in pb-4">
      {/* Top Header with Navigation Tabs (Play / Global Leaderboard) */}
      <div className="w-full flex items-center justify-between bg-gradient-to-r from-[#1c140c]/95 via-[#26190f]/95 to-[#1c140c]/95 border border-[#e8c84a]/50 rounded-2xl px-3 py-2 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0 animate-bounce-short">🍺</span>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-cinzel font-black text-[#e8c84a] gold-text-glow tracking-wide uppercase leading-tight truncate">
              Barbutul lu' Călugăru
            </h1>
            <span className="text-[10px] font-bebas text-[#e05c3a] tracking-widest uppercase block">
              drinking game • medieval tavern
            </span>
          </div>
        </div>

        {/* Top Switcher Icons/Buttons */}
        <div className="flex items-center gap-1 bg-[#0f0a06] p-1 rounded-xl border border-[#2d1f14] flex-shrink-0">
          <button
            type="button"
            onClick={() => setMainTab('play')}
            className={`py-1 px-2 sm:px-2.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1 ${
              mainTab === 'play'
                ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title={language === 'ro' ? 'Panou de Joc' : 'Play Setup'}
          >
            <span>🎮</span>
            <span className="hidden xs:inline">{language === 'ro' ? 'Joacă' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('leaderboard')}
            className={`py-1 px-2 sm:px-2.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1 ${
              mainTab === 'leaderboard'
                ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title={language === 'ro' ? 'Clasament Mondial' : 'Global Leaderboard'}
          >
            <span>🏆</span>
            <span className="hidden xs:inline">{language === 'ro' ? 'Top Mondial' : 'Top'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MAIN PAGE (GAME SETUP + PROFILES BUTTON UNDER START) */}
      {mainTab === 'play' && (
        <div className="w-full space-y-3">
          {/* Main Game Setup Card */}
          <div className="w-full bg-[#18130d]/95 backdrop-blur-md border border-[#e8c84a]/60 rounded-2xl p-3 sm:p-3.5 shadow-xl gold-glow space-y-3">
            {/* Game Mode Selector - 4 Compact Grid Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                  {t('selectMode')}
                </label>
                <span className="text-[10px] text-gray-400 font-barlow">
                  {mode === 'normal' ? '🍺 Clasic' : mode === 'boardgame' ? '🎲 Tablă' : mode === 'duel' ? '⚔️ WiFi 1v1' : '🎰 Craps Duel'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode('normal')}
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                    mode === 'normal'
                      ? 'border-[#ffd700] bg-[#291e12] text-[#ffd700] gold-glow font-bold shadow-md ring-1 ring-[#ffd700]'
                      : 'border-[#261d14] bg-[#110d09] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">🍺</span>
                  <span className="font-cinzel text-[10px] sm:text-[11px] leading-none">{t('normalMode')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('boardgame')}
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                    mode === 'boardgame'
                      ? 'border-[#ffd700] bg-[#291e12] text-[#ffd700] gold-glow font-bold shadow-md ring-1 ring-[#ffd700]'
                      : 'border-[#261d14] bg-[#110d09] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">🎲</span>
                  <span className="font-cinzel text-[10px] sm:text-[11px] leading-none">{t('boardgameMode')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('duel')}
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                    mode === 'duel'
                      ? 'border-[#ff7a6b] bg-[#2d1410] text-[#ff9b8f] font-bold shadow-md ring-1 ring-[#ff7a6b]'
                      : 'border-[#261d14] bg-[#110d09] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">⚔️</span>
                  <span className="font-cinzel text-[10px] sm:text-[11px] leading-none">Duel 1v1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('casino')}
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                    mode === 'casino'
                      ? 'border-[#ffd700] bg-[#2b200e] text-[#ffd700] font-bold shadow-md ring-1 ring-[#ffd700]'
                      : 'border-[#261d14] bg-[#110d09] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">🎰</span>
                  <span className="font-cinzel text-[10px] sm:text-[11px] leading-none">{t('casinoMode')}</span>
                </button>
              </div>
            </div>

            {/* DUEL MODE COMPACT CONFIG */}
            {mode === 'duel' && (
              <div className="space-y-2 border-t border-[#2d2014] pt-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-1.5 bg-[#0f0a06] p-1 rounded-xl border border-[#2d1e12]">
                  <button
                    type="button"
                    onClick={() => setDuelRole('host')}
                    className={`py-1.5 px-2 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      duelRole === 'host'
                        ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>👑</span>
                    <span>{t('duelCreateRoom')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuelRole('join')}
                    className={`py-1.5 px-2 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      duelRole === 'join'
                        ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>🚪</span>
                    <span>{t('duelJoinRoom')}</span>
                  </button>
                </div>

                {duelRole === 'host' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-cinzel font-bold text-gray-300 block">
                        {t('duelSubmode')}
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setDuelSubmode('general')}
                          className={`py-1.5 rounded-lg text-xs font-cinzel ${
                            duelSubmode === 'general' ? 'bg-[#ffd700] text-black font-bold' : 'bg-[#120d09] text-gray-400'
                          }`}
                        >
                          🌍 Gen
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuelSubmode('football')}
                          className={`py-1.5 rounded-lg text-xs font-cinzel ${
                            duelSubmode === 'football' ? 'bg-[#ffd700] text-black font-bold' : 'bg-[#120d09] text-gray-400'
                          }`}
                        >
                          ⚽ Fotbal
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-cinzel font-bold text-gray-300 block">
                        {t('duelDifficulty')}
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'easy', label: '🟢' },
                          { id: 'medium', label: '🟠' },
                          { id: 'hard', label: '🔴' },
                        ].map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDuelDifficulty(d.id as DuelDifficulty)}
                            className={`py-1.5 rounded-lg text-xs font-cinzel ${
                              duelDifficulty === d.id ? 'bg-[#ffd700] text-black font-bold' : 'bg-[#120d09] text-gray-400'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {duelRole === 'join' && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      maxLength={4}
                      value={duelRoomCodeInput}
                      onChange={(e) => setDuelRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder={language === 'ro' ? 'CODUL CAMEREI (EX: DU3L)' : 'ROOM CODE (EX: DU3L)'}
                      className="w-full bg-[#100b07] border-2 border-[#ffd700] rounded-xl px-3 py-2 text-center text-lg font-cinzel font-black tracking-widest text-[#ffd700] placeholder-gray-600 focus:outline-none uppercase"
                    />
                  </div>
                )}
              </div>
            )}

            {/* CASINO MODE COMPACT CONFIG */}
            {mode === 'casino' && (
              <div className="space-y-2 border-t border-[#2d2014] pt-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-1.5 bg-[#0f0a06] p-1 rounded-xl border border-[#2d1e12]">
                  <button
                    type="button"
                    onClick={() => setCasinoRole('host')}
                    className={`py-1.5 px-2 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      casinoRole === 'host'
                        ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>👑</span>
                    <span>{t('casinoCreateRoom')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCasinoRole('join')}
                    className={`py-1.5 px-2 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      casinoRole === 'join'
                        ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>🚪</span>
                    <span>{t('casinoJoinRoom')}</span>
                  </button>
                </div>

                {casinoRole === 'host' && (
                  <div className="flex items-center justify-between gap-2 bg-[#100c07] p-2 rounded-xl border border-[#2b2014]">
                    <span className="text-xs font-cinzel text-[#ffd700]">🪙 {t('casinoStartingChips')}:</span>
                    <div className="flex items-center gap-1">
                      {[100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCasinoStartingChips(amt)}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                            casinoStartingChips === amt ? 'bg-[#ffd700] text-black' : 'bg-[#1c150e] text-gray-300'
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {casinoRole === 'join' && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      maxLength={4}
                      value={casinoRoomCodeInput}
                      onChange={(e) => setCasinoRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder={language === 'ro' ? 'COD CAZINO (EX: C4Z1)' : 'CASINO CODE (EX: C4Z1)'}
                      className="w-full bg-[#100b07] border-2 border-[#ffd700] rounded-xl px-3 py-2 text-center text-lg font-cinzel font-black tracking-widest text-[#ffd700] placeholder-gray-600 focus:outline-none uppercase"
                    />
                  </div>
                )}
              </div>
            )}

            {/* NORMAL & BOARDGAME SETTINGS (PLAYER COUNT & DIFFICULTY/DICE) */}
            {mode !== 'duel' && mode !== 'casino' && (
              <div className="space-y-2 border-t border-[#2d2014] pt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-cinzel font-bold text-[#e8c84a] uppercase">
                    {t('playerCount')}:
                  </span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPlayerCount(num)}
                        className={`w-8 h-8 rounded-lg font-bebas text-lg transition-all ${
                          playerCount === num
                            ? 'bg-[#ffd700] text-black font-bold shadow gold-glow scale-105'
                            : 'bg-[#120d09] border border-[#2b1f13] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === 'normal' && (
                  <div className="grid grid-cols-4 gap-1 pt-0.5">
                    {[
                      { id: 'weak', label: 'Weak' },
                      { id: 'medium', label: 'Mediu' },
                      { id: 'extreme', label: 'Extreme' },
                      { id: 'nightmare', label: 'Coșmar' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDifficulty(item.id as Difficulty)}
                        className={`py-1.5 rounded-lg font-cinzel text-xs transition-all ${
                          difficulty === item.id
                            ? 'bg-[#ffd700] text-black font-bold shadow'
                            : 'bg-[#120d09] border border-[#2b1f13] text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'boardgame' && (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] font-cinzel font-bold text-[#e8c84a]">
                      {t('diceOnBoard')}:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBoardDiceCount(1)}
                        className={`py-1 px-3 rounded-lg font-cinzel text-xs ${
                          boardDiceCount === 1 ? 'bg-[#ffd700] text-black font-bold' : 'bg-[#120d09] border border-[#2b1f13] text-gray-400'
                        }`}
                      >
                        {t('oneDie')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoardDiceCount(2)}
                        className={`py-1 px-3 rounded-lg font-cinzel text-xs ${
                          boardDiceCount === 2 ? 'bg-[#ffd700] text-black font-bold' : 'bg-[#120d09] border border-[#2b1f13] text-gray-400'
                        }`}
                      >
                        {t('twoDice')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PLAYER ROSTER INPUTS (CLEAN ROWS WITH AVATAR PICKER & HIGH Z-INDEX MODAL SELECTOR) */}
            <div className="space-y-2 border-t border-[#2d2014] pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                  {mode === 'duel' || mode === 'casino'
                    ? language === 'ro'
                      ? 'Nume & Avatar Jucător'
                      : 'Player Name & Avatar'
                    : `${t('playerNames')} (${playerCount})`}
                </label>
                <span className="text-[10px] text-gray-400 font-barlow">
                  {language === 'ro' ? 'Apasă 👤 pt. profil' : 'Tap 👤 for profile'}
                </span>
              </div>

              <div className="space-y-1.5">
                {Array.from({ length: mode === 'duel' || mode === 'casino' ? 1 : playerCount }).map((_, idx) => {
                  const currentAvatarId = playerAvatars[idx] || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {/* Avatar Picker Button */}
                      <button
                        type="button"
                        onClick={() => setAvatarModalIndex(idx)}
                        className="w-10 h-10 rounded-xl bg-[#1d140c] border-2 border-[#e8c84a] hover:border-[#ffd700] hover:scale-105 active:scale-95 transition-all relative flex-shrink-0 flex items-center justify-center shadow overflow-hidden group"
                        title={language === 'ro' ? 'Schimbă avatarul' : 'Change avatar'}
                      >
                        <AvatarDisplay avatarId={currentAvatarId} className="w-full h-full p-0.5" />
                        <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shadow border border-black/50">
                          +
                        </div>
                      </button>

                      {/* Name Input & Profile Picker Modal Button */}
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="text"
                          value={playerNames[idx] || ''}
                          onChange={(e) => handleNameChange(idx, e.target.value)}
                          placeholder={`${t('playerPlaceholder')} ${idx + 1}`}
                          className="w-full bg-[#100b07] border border-[#2d1e12] focus:border-[#ffd700] rounded-xl pl-3 pr-14 py-2 text-xs sm:text-sm text-[#f0ebe0] focus:outline-none transition-all font-barlow"
                        />

                        <button
                          type="button"
                          onClick={() => setPickerPlayerIndex(idx)}
                          className="absolute right-1.5 py-1 px-2 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 transition-all bg-[#22180e] border border-[#e8c84a]/50 text-[#ffd700] hover:bg-[#2d2013] active:scale-95 shadow"
                          title={language === 'ro' ? 'Alege profil salvat' : 'Select saved profile'}
                        >
                          <span>👤</span>
                          <span className="text-[10px]">▼</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTONS DUO: 1. START GAME & 2. PROFILES BUTTON DIRECTLY UNDER IT */}
            <div className="pt-1.5 space-y-2">
              {/* PRIMARY ACTION: START GAME BUTTON */}
              <button
                type="button"
                onClick={handleStart}
                disabled={
                  (mode === 'duel' && duelRole === 'join' && duelRoomCodeInput.trim().length !== 4) ||
                  (mode === 'casino' && casinoRole === 'join' && casinoRoomCodeInput.trim().length !== 4)
                }
                className={`w-full py-3.5 rounded-xl font-cinzel font-black text-sm sm:text-base transition-all active:scale-98 shadow-lg uppercase tracking-wide flex items-center justify-center gap-2 ${
                  (mode === 'duel' && duelRole === 'join' && duelRoomCodeInput.trim().length !== 4) ||
                  (mode === 'casino' && casinoRole === 'join' && casinoRoomCodeInput.trim().length !== 4)
                    ? 'bg-[#20170f] text-gray-500 border border-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#ffd700] via-[#f7c844] to-[#ffd700] text-black hover:brightness-110 gold-glow'
                }`}
              >
                <span>
                  {mode === 'casino' ? '🎰' : mode === 'duel' ? (duelRole === 'host' ? '👑' : '⚔️') : '🚀'}
                </span>
                <span>
                  {mode === 'casino'
                    ? casinoRole === 'host'
                      ? t('casinoCreateRoom')
                      : t('casinoJoinBtn')
                    : mode === 'duel'
                    ? duelRole === 'host'
                      ? t('duelCreateRoom')
                      : t('duelJoinBtn')
                    : t('startGame')}
                </span>
              </button>

              {/* SECONDARY ACTION: PROFILURILE TALE BUTTON (NO EMOTICONS AS REQUESTED) */}
              <button
                type="button"
                onClick={() => setShowProfilesModal(true)}
                className="w-full py-3 sm:py-3.5 rounded-xl font-cinzel font-black text-sm sm:text-base transition-all active:scale-98 shadow-md uppercase tracking-wider flex items-center justify-center bg-gradient-to-r from-[#20150b] via-[#2c1d10] to-[#20150b] border-2 border-[#e8c84a]/80 text-[#ffd700] hover:border-[#ffd700] hover:bg-[#342314] hover:brightness-110"
              >
                {language === 'ro' ? 'Profilurile Tale' : 'Your Profiles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED GLOBAL LEADERBOARD VIEW (ONLY LEADERBOARD, NO PROFILES HERE) */}
      {mainTab === 'leaderboard' && (
        <div className="w-full space-y-3 animate-fade-in">
          {/* Full Global Leaderboard with all 4 categories */}
          <GlobalLeaderboardSection onOpenCloudModal={onOpenCloudModal} isFullView={true} />

          {/* Return to Play Button */}
          <button
            type="button"
            onClick={() => setMainTab('play')}
            className="w-full py-2.5 rounded-xl bg-[#1c140d] border border-[#ffd700]/50 hover:border-[#ffd700] text-[#ffd700] font-cinzel font-bold text-xs uppercase shadow transition-all flex items-center justify-center gap-2"
          >
            <span>🎮</span>
            <span>{language === 'ro' ? '← Înapoi la Panoul de Joc' : '← Back to Play Setup'}</span>
          </button>
        </div>
      )}

      {/* Quick Footer Links */}
      <div className="flex items-center justify-center gap-2 w-full pt-1">
        <button
          onClick={onOpenRules}
          className="flex-1 py-2 px-2 rounded-xl bg-[#140e08] border border-[#2b1f13] hover:border-[#ffd700] text-xs font-cinzel text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1"
        >
          <span>📜</span>
          <span>{t('rulesBtn')}</span>
        </button>

        <button
          onClick={onOpenAchievements}
          className="flex-1 py-2 px-2 rounded-xl bg-[#140e08] border border-[#2b1f13] hover:border-[#ffd700] text-xs font-cinzel text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1"
        >
          <span>🏅</span>
          <span>{language === 'ro' ? 'Realizări' : 'Achievements'}</span>
        </button>

        <button
          onClick={onOpenCustomize}
          className="flex-1 py-2 px-2 rounded-xl bg-[#140e08] border border-[#2b1f13] hover:border-[#ffd700] text-xs font-cinzel text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1"
        >
          <span>🎨</span>
          <span>{t('tabCustomize')}</span>
        </button>
      </div>

      {/* Main Profiles Pop-up / Dropdown Modal */}
      {showProfilesModal && (
        <ProfilesManagementModal
          isOpen={true}
          onClose={() => setShowProfilesModal(false)}
          onSelectProfileForPlayer={(p) => {
            handleNameChange(0, p.name);
            if (p.avatarIcon) handleAvatarChange(0, p.avatarIcon);
          }}
        />
      )}

      {/* High Z-Index Profile Picker Modal for Specific Player Slot */}
      {pickerPlayerIndex !== null && (
        <ProfilePickerModal
          isOpen={true}
          onClose={() => setPickerPlayerIndex(null)}
          onSelectProfile={(p) => selectProfileForPlayer(pickerPlayerIndex, p)}
          playerIndex={pickerPlayerIndex}
          playerName={playerNames[pickerPlayerIndex] || ''}
        />
      )}

      {/* Avatar Modal */}
      {avatarModalIndex !== null && (
        <AvatarModal
          isOpen={true}
          currentAvatarId={playerAvatars[avatarModalIndex] || DEFAULT_AVATARS[avatarModalIndex % DEFAULT_AVATARS.length]}
          onSelectAvatar={(newAvatarId) => {
            handleAvatarChange(avatarModalIndex, newAvatarId);
            setAvatarModalIndex(null);
          }}
          onClose={() => setAvatarModalIndex(null)}
        />
      )}

      {/* Custom Doubles Modal */}
      {showCustomDoublesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18120c] border-2 border-[#ffd700] rounded-2xl p-5 max-w-md w-full space-y-3.5 gold-glow">
            <h3 className="text-lg font-cinzel font-bold text-[#ffd700] gold-text-glow">
              {t('customDoublesTitle')}
            </h3>
            <p className="text-xs text-gray-300 font-barlow">{t('customDoublesDesc')}</p>

            <div className="space-y-2.5">
              {(['2-2', '3-3', '4-4', '5-5'] as const).map((pair) => (
                <div key={pair} className="space-y-1">
                  <label className="text-xs font-cinzel font-bold text-[#ffd700]">Dublu {pair}:</label>
                  <input
                    type="text"
                    value={customDoubles[pair]}
                    onChange={(e) => setCustomDoubles((prev) => ({ ...prev, [pair]: e.target.value }))}
                    placeholder="Lasa liber pentru standard..."
                    className="w-full bg-[#100b07] border border-[#2d1e12] focus:border-[#ffd700] rounded-xl px-3 py-1.5 text-xs text-[#f0ebe0] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCustomDoublesModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#ffd700] text-black font-cinzel font-bold text-xs hover:brightness-110 transition-all shadow"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
