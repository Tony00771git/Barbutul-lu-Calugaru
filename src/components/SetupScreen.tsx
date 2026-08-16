import React, { useState, useEffect } from 'react';
import { GameMode, Difficulty, CustomDoubles, Player, DuelSubmode, DuelDifficulty } from '../types';
import { useApp, generateUniqueId } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarModal } from './AvatarModal';
import { getAvatarById } from '../data/avatars';

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
  onOpenProfiles: () => void;
  onOpenCustomize: () => void;
  onOpenRules: () => void;
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
  onOpenProfiles,
  onOpenCustomize,
  onOpenRules,
}) => {
  const { t, profiles, language } = useApp();

  const [mode, setMode] = useState<GameMode>('normal');
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [boardDiceCount, setBoardDiceCount] = useState<1 | 2>(1);

  // Duel mode specific state (Online 1v1 Room-based)
  const [duelRole, setDuelRole] = useState<'host' | 'join'>('host');
  const [duelSubmode, setDuelSubmode] = useState<DuelSubmode>('general');
  const [duelDifficulty, setDuelDifficulty] = useState<DuelDifficulty>('easy');
  const [duelTargetPoints, setDuelTargetPoints] = useState<number>(30);
  const [customTargetInput, setCustomTargetInput] = useState<string>('30');
  const [isCustomTarget, setIsCustomTarget] = useState<boolean>(false);
  const [duelRoomCodeInput, setDuelRoomCodeInput] = useState<string>('');

  // Player names state (for local modes)
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Fratele Vasile',
    'Călugărul Onufrie',
    'Starețul Petru',
    'Ieromonahul Ioan',
    'Diaconul Gheorghe',
    'Fratele Matei',
  ]);

  // Player avatars state (IDs of medieval characters)
  const [playerAvatars, setPlayerAvatars] = useState<string[]>(DEFAULT_AVATARS);

  // Avatar Modal State
  const [avatarModalIndex, setAvatarModalIndex] = useState<number | null>(null);

  // Custom doubles state
  const [showCustomDoublesModal, setShowCustomDoublesModal] = useState<boolean>(false);
  const [customDoubles, setCustomDoubles] = useState<CustomDoubles>({
    '2-2': '',
    '3-3': '',
    '4-4': '',
    '5-5': '',
  });

  // Profile dropdown open state per player
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  // Auto-detect ?room=XYZ in URL on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setMode('duel');
        setDuelRole('join');
        setDuelRoomCodeInput(roomParam.toUpperCase());
        // Clean URL parameter so it doesn't persist across screen changes
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
  };

  const handleNameChange = (index: number, val: string) => {
    const updated = [...playerNames];
    updated[index] = val;
    setPlayerNames(updated);
  };

  const handleAvatarChange = (index: number, avatarId: string) => {
    setPlayerAvatars(prev => {
      const next = [...prev];
      next[index] = avatarId;
      return next;
    });
  };

  const selectProfileForPlayer = (index: number, profileName: string, avatarIcon?: string) => {
    handleNameChange(index, profileName);
    if (avatarIcon) {
      handleAvatarChange(index, avatarIcon);
    }
    setOpenDropdownIndex(null);
  };

  const handleStart = () => {
    if (mode === 'duel') {
      const myName = playerNames[0].trim() || (duelRole === 'host' ? 'Gazda Duelului' : 'Luptătorul Oaspete');
      const matchedProfile = profiles.find(p => p.name.trim().toLowerCase() === myName.toLowerCase());
      const myAvatar = playerAvatars[0] || matchedProfile?.avatarIcon || 'monk_drunk';

      const localPlayer = {
        id: generateUniqueId('duel_player'),
        name: myName,
        avatarIcon: myAvatar,
        color: duelRole === 'host' ? '#e8c84a' : '#e05c3a',
      };

      const finalTarget = isCustomTarget ? (parseInt(customTargetInput) || 30) : duelTargetPoints;

      onStartDuel(duelRole, localPlayer, duelSubmode, duelDifficulty, duelRoomCodeInput.trim().toUpperCase(), finalTarget);
      return;
    }

    const activeNames = playerNames.slice(0, playerCount).map((n, idx) => n.trim() || `${t('playerPlaceholder')} ${idx + 1}`);

    const finalPlayers: Player[] = activeNames.map((name, idx) => {
      const matchedProfile = profiles.find(p => p.name.trim().toLowerCase() === name.toLowerCase());
      const chosenAvatar = playerAvatars[idx] || matchedProfile?.avatarIcon || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];

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
    <div className="w-full flex flex-col items-center py-4 sm:py-6 px-3 sm:px-4 max-w-xl mx-auto space-y-5">
      {/* Title Header */}
      <div className="text-center space-y-1 animate-fade-in">
        <div className="text-4xl sm:text-5xl mb-0.5">🍺 🎲 ⚔️</div>
        <h1 className="text-2xl sm:text-4xl font-cinzel font-black text-[#e8c84a] gold-text-glow tracking-wider uppercase">
          Barbutul lu' Călugăru
        </h1>
        <p className="text-sm sm:text-base font-bebas text-[#e05c3a] tracking-widest uppercase">
          drinking game
        </p>
      </div>

      {/* Main Setup Card */}
      <div className="w-full bg-[#18130d]/95 backdrop-blur-md border-2 border-[#e8c84a]/60 rounded-2xl p-4 sm:p-6 shadow-2xl gold-glow space-y-5">
        
        {/* Game Mode Selector - 3 Modes */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
            {t('selectMode')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('normal')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all duration-200 ${
                mode === 'normal'
                  ? 'border-[#e8c84a] bg-[#221f18] text-[#e8c84a] gold-glow font-bold scale-[1.02]'
                  : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">🍺</span>
              <span className="font-cinzel text-xs sm:text-sm">{t('normalMode')}</span>
            </button>

            <button
              onClick={() => setMode('boardgame')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all duration-200 ${
                mode === 'boardgame'
                  ? 'border-[#e8c84a] bg-[#221f18] text-[#e8c84a] gold-glow font-bold scale-[1.02]'
                  : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">🎲</span>
              <span className="font-cinzel text-xs sm:text-sm">{t('boardgameMode')}</span>
            </button>

            <button
              onClick={() => setMode('duel')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all duration-200 ${
                mode === 'duel'
                  ? 'border-[#ffd700] bg-gradient-to-b from-[#2e1d0f] to-[#1c120a] text-[#ffd700] gold-glow font-bold scale-[1.02] shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                  : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">⚔️</span>
              <span className="font-cinzel text-xs sm:text-sm">{t('duelMode')}</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* DUEL MODE DEDICATED SETUP (1v1 WiFi / Room Code)    */}
        {/* ---------------------------------------------------- */}
        {mode === 'duel' && (
          <div className="space-y-4 border-t border-[#2a2a2a] pt-4 animate-fade-in">
            {/* Instruction Banner */}
            <div className="p-3 bg-[#24170c]/90 border border-[#ffd700]/40 rounded-xl text-center space-y-1">
              <div className="text-xs sm:text-sm font-cinzel font-bold text-[#ffd700] flex items-center justify-center gap-1.5">
                <span>📡</span>
                <span>{language === 'ro' ? 'Duel 1v1 pe 2 Telefoane (WiFi/Online)' : '1v1 Dual-Device Duel (WiFi/Online)'}</span>
              </div>
              <p className="text-xs text-gray-300 font-barlow">
                {t('duelInstruction')}
              </p>
            </div>

            {/* Host vs Join Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-[#120d08] p-1.5 rounded-xl border border-[#e8c84a]/30">
              <button
                type="button"
                onClick={() => setDuelRole('host')}
                className={`py-2.5 px-3 rounded-lg font-cinzel text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  duelRole === 'host'
                    ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md font-black'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>👑</span>
                <span>{t('duelCreateRoom')}</span>
              </button>

              <button
                type="button"
                onClick={() => setDuelRole('join')}
                className={`py-2.5 px-3 rounded-lg font-cinzel text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  duelRole === 'join'
                    ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md font-black'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>🚪</span>
                <span>{t('duelJoinRoom')}</span>
              </button>
            </div>

            {/* If Host: Submode and Difficulty */}
            {duelRole === 'host' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                {/* Submode Selection */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                    {t('duelSubmode')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDuelSubmode('general')}
                      className={`py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                        duelSubmode === 'general'
                          ? 'border-[#ffd700] bg-[#2a1e12] text-[#ffd700] font-bold gold-glow'
                          : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-lg">🌍</span>
                      <span className="font-cinzel text-xs sm:text-sm">{t('duelGeneral')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDuelSubmode('football')}
                      className={`py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                        duelSubmode === 'football'
                          ? 'border-[#ffd700] bg-[#2a1e12] text-[#ffd700] font-bold gold-glow'
                          : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-lg">⚽</span>
                      <span className="font-cinzel text-xs sm:text-sm">{t('duelFootball')}</span>
                    </button>
                  </div>
                </div>

                {/* Duel Difficulty Selection */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                    {t('duelDifficulty')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'easy', label: t('duelEasy'), color: 'border-green-500/60 bg-green-950/30 text-green-400' },
                      { id: 'medium', label: t('duelMedium'), color: 'border-orange-500/60 bg-orange-950/30 text-orange-400' },
                      { id: 'hard', label: t('duelHard'), color: 'border-red-500/60 bg-red-950/30 text-red-400' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDuelDifficulty(item.id as DuelDifficulty)}
                        className={`py-2 px-2 rounded-xl border-2 text-center transition-all ${
                          duelDifficulty === item.id
                            ? `${item.color} border-[#ffd700] ring-2 ring-[#ffd700]/50 font-bold scale-[1.02]`
                            : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-cinzel text-xs sm:text-sm font-bold">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Points Selection (Prag limită de guri/puncte) */}
                <div className="space-y-2 pt-2 border-t border-[#2a2a2a]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-cinzel font-bold text-[#ffd700] uppercase tracking-wider block">
                      🎯 {language === 'ro' ? 'Prag Limită Puncte / Guri' : 'Target Drink Points Limit'}
                    </label>
                    <span className="text-[11px] font-barlow text-orange-300 font-bold">
                      {language === 'ro' ? 'Cine îl atinge PIERDE!' : 'First to reach LOSES!'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 15, label: '15p', desc: 'Rapid' },
                      { val: 25, label: '25p', desc: '1 Groapă' },
                      { val: 30, label: '30p', desc: 'Standard' },
                      { val: 50, label: '50p', desc: 'Maraton' },
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          setDuelTargetPoints(preset.val);
                          setIsCustomTarget(false);
                        }}
                        className={`py-2 px-1.5 rounded-xl border-2 text-center transition-all ${
                          !isCustomTarget && duelTargetPoints === preset.val
                            ? 'border-[#ffd700] bg-[#2a1e12] text-[#ffd700] font-bold ring-2 ring-[#ffd700]/50 scale-[1.02]'
                            : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-cinzel text-sm font-black">{preset.label}</div>
                        <div className="text-[10px] font-barlow opacity-75">{preset.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Target Points Button / Input */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCustomTarget(true)}
                      className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-cinzel transition-all ${
                        isCustomTarget
                          ? 'border-[#ffd700] bg-[#2a1e12] text-[#ffd700]'
                          : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span>⚙️ {language === 'ro' ? 'Număr Personalizat de Puncte' : 'Custom Points Target'}</span>
                      {isCustomTarget && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            min={5}
                            max={500}
                            value={customTargetInput}
                            onChange={e => setCustomTargetInput(e.target.value)}
                            className="w-16 bg-black border border-[#ffd700] rounded px-2 py-0.5 text-center text-sm font-bold text-[#ffd700] focus:outline-none"
                          />
                          <span className="text-[#ffd700] font-bold">puncte</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] font-barlow text-gray-400 bg-black/40 p-2 rounded-lg border border-white/5">
                    💡 <strong>{language === 'ro' ? 'Sistem de puncte' : 'Point system'}</strong>: 1 gură = 1 punct | 1 groapă = 25 puncte. Primul jucător care atinge sau depășește {isCustomTarget ? (parseInt(customTargetInput) || 30) : duelTargetPoints} puncte pierde meciul.
                  </p>
                </div>
              </div>
            )}

            {/* If Join: Room Code Input */}
            {duelRole === 'join' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs sm:text-sm font-cinzel font-bold text-[#ffd700] uppercase tracking-wider block">
                  {t('duelRoomCode')} (4 caractere)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    value={duelRoomCodeInput}
                    onChange={e => setDuelRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="ex: H84K"
                    className="w-full bg-[#121212] border-2 border-[#ffd700] rounded-xl px-4 py-3 text-center text-2xl font-cinzel font-black tracking-widest text-[#ffd700] placeholder-gray-600 focus:outline-none shadow-[0_0_15px_rgba(255,215,0,0.2)] uppercase"
                  />
                </div>
                <p className="text-[11px] font-barlow text-gray-400 text-center">
                  Cere codul de 4 litere de la prietenul tău care a creat camera!
                </p>
              </div>
            )}

            {/* Your Fighter Identity (1 Player setup for this device) */}
            <div className="space-y-2 border-t border-[#2a2a2a] pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                  {language === 'ro' ? 'Numele & Avatarul Tău' : 'Your Fighter Name & Avatar'}
                </label>
                <span className="text-[11px] font-barlow text-gray-400">
                  Apasă pe pătrat <span className="text-[#ffd700] font-bold">[+]</span>
                </span>
              </div>

              {/* Backdrop to dismiss profile dropdown */}
              {openDropdownIndex !== null && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOpenDropdownIndex(null)}
                />
              )}

              <div className={`relative ${openDropdownIndex === 0 ? 'z-50' : 'z-10'}`}>
                <div className="flex items-center gap-2">
                  {/* Avatar Selector Square with [+] overlay */}
                  <button
                    type="button"
                    onClick={() => setAvatarModalIndex(0)}
                    className="w-12 h-12 rounded-2xl bg-[#1d140c] border-2 border-[#ffd700] hover:scale-105 active:scale-95 transition-all relative flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden group"
                  >
                    <AvatarDisplay avatarId={playerAvatars[0] || 'monk_drunk'} className="w-full h-full p-0.5" />
                    <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow border border-black/50">
                      +
                    </div>
                  </button>

                  {/* Name Input & Profile Dropdown Button */}
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={playerNames[0] || ''}
                      onChange={e => handleNameChange(0, e.target.value)}
                      placeholder={duelRole === 'host' ? (language === 'ro' ? 'Numele tău (Gazdă)' : 'Your Name (Host)') : (language === 'ro' ? 'Numele tău (Luptător)' : 'Your Name (Fighter)')}
                      className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-[#ffd700] rounded-xl pl-3.5 pr-24 py-2.5 text-sm text-[#f0ebe0] focus:outline-none transition-all font-barlow"
                    />

                    {/* Dropdown Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setOpenDropdownIndex(openDropdownIndex === 0 ? null : 0)}
                      className={`absolute right-1.5 py-1 px-2.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 transition-all ${
                        openDropdownIndex === 0
                          ? 'bg-[#ffd700] text-black shadow'
                          : 'bg-[#221a10] border border-[#e8c84a]/40 text-[#ffd700] hover:bg-[#2e2316]'
                      }`}
                    >
                      <span>{language === 'ro' ? '👤 Profil' : '👤 Profile'}</span>
                      <span className="text-[10px]">{openDropdownIndex === 0 ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu for Saved Profiles */}
                {openDropdownIndex === 0 && (
                  <div className="absolute left-0 right-0 top-14 mt-1 z-50 bg-gradient-to-b from-[#1c150e] to-[#120d09] border-2 border-[#e8c84a] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] max-h-56 overflow-y-auto p-2 animate-fade-in">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-[#2e2216] mb-1.5">
                      <span className="text-[10px] text-[#ffd700] font-cinzel font-bold uppercase tracking-wider">
                        📜 {language === 'ro' ? 'Profiluri Salvate' : 'Saved Profiles'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-barlow">
                        {profiles.length} {language === 'ro' ? 'înregistrate' : 'found'}
                      </span>
                    </div>

                    {profiles.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400 font-barlow">
                        {language === 'ro' ? 'Nu ai profiluri salvate încă.' : 'No saved profiles yet.'}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {profiles.map(p => (
                          <div
                            key={p.id}
                            onClick={() => selectProfileForPlayer(0, p.name, p.avatarIcon)}
                            className="p-2 rounded-xl hover:bg-[#2c2014] cursor-pointer text-sm font-barlow text-[#e8c84a] flex items-center justify-between border border-transparent hover:border-[#ffd700]/30 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#0d0a07] border border-[#e8c84a]/30">
                                <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                              </div>
                              <div>
                                <div className="font-cinzel font-bold text-xs text-[#f0ebe0]">{p.name}</div>
                                <div className="text-[10px] text-gray-400">{language === 'ro' ? 'Jocuri' : 'Games'}: {p.gamesPlayed} | 🍺 {p.totalSips} {t('sipsUnit')}</div>
                              </div>
                            </div>
                            <span className="text-xs bg-[#e8c84a]/20 text-[#ffd700] px-2 py-0.5 rounded font-cinzel font-bold">
                              {language === 'ro' ? 'Alege ➔' : 'Select ➔'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* NORMAL & BOARDGAME PLAYER COUNT                      */}
        {/* ---------------------------------------------------- */}
        {mode !== 'duel' && (
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
              {t('playerCount')}
            </label>
            <div className="flex items-center justify-between gap-2">
              {[2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => handlePlayerCountChange(num)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bebas text-xl transition-all ${
                    playerCount === num
                      ? 'border-[#e8c84a] bg-[#e8c84a] text-black font-bold gold-glow'
                      : 'border-[#2a2a2a] bg-[#121212] text-[#f0ebe0] hover:border-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options for Normal Mode */}
        {mode === 'normal' && (
          <div className="space-y-4 border-t border-[#2a2a2a] pt-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                {t('difficulty')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'weak', label: t('weak'), color: 'border-green-500/60 bg-green-950/30 text-green-400' },
                  { id: 'medium', label: t('medium'), color: 'border-orange-500/60 bg-orange-950/30 text-orange-400' },
                  { id: 'extreme', label: t('extreme'), color: 'border-red-500/60 bg-red-950/30 text-red-400' },
                  { id: 'nightmare', label: t('nightmare'), color: 'border-purple-500/60 bg-purple-950/30 text-purple-400' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id as Difficulty)}
                    className={`p-2 rounded-xl border-2 text-center transition-all ${
                      difficulty === item.id
                        ? `${item.color} border-[#e8c84a] ring-2 ring-[#e8c84a]/50 font-bold`
                        : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-cinzel text-sm">{item.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 font-barlow italic">
                {difficulty === 'weak' && t('weakDesc')}
                {difficulty === 'medium' && t('mediumDesc')}
                {difficulty === 'extreme' && t('extremeDesc')}
                {difficulty === 'nightmare' && t('nightmareDesc')}
              </p>
            </div>

            {/* Custom Doubles Button */}
            <button
              onClick={() => setShowCustomDoublesModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-[#e8c84a]/40 bg-[#1e1a12] text-[#e8c84a] font-cinzel text-sm hover:bg-[#282116] transition-all flex items-center justify-center gap-2"
            >
              <span>🎯 {t('customDoubles')}</span>
              {Object.values(customDoubles).some(v => (v as string).trim() !== '') && (
                <span className="text-xs bg-[#e8c84a] text-black px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </button>
          </div>
        )}

        {/* Options for Boardgame Mode */}
        {mode === 'boardgame' && (
          <div className="space-y-3 border-t border-[#2a2a2a] pt-4">
            <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
              {t('diceOnBoard')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBoardDiceCount(1)}
                className={`py-3 rounded-xl border-2 font-cinzel text-sm transition-all ${
                  boardDiceCount === 1
                    ? 'border-[#e8c84a] bg-[#221f18] text-[#e8c84a] gold-glow font-bold'
                    : 'border-[#2a2a2a] bg-[#121212] text-gray-400'
                }`}
              >
                {t('oneDie')}
              </button>

              <button
                onClick={() => setBoardDiceCount(2)}
                className={`py-3 rounded-xl border-2 font-cinzel text-sm transition-all ${
                  boardDiceCount === 2
                    ? 'border-[#e8c84a] bg-[#221f18] text-[#e8c84a] gold-glow font-bold'
                    : 'border-[#2a2a2a] bg-[#121212] text-gray-400'
                }`}
              >
                {t('twoDice')}
              </button>
            </div>
          </div>
        )}

        {/* Player Name Inputs (For Normal & Boardgame) */}
        {mode !== 'duel' && (
          <div className="space-y-3 border-t border-[#2a2a2a] pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider block">
                {t('playerNames')} &amp; Avatare
              </label>
              <span className="text-[11px] font-barlow text-gray-400">
                Apasă pe pătrat <span className="text-[#ffd700] font-bold">[+]</span> pt. avatar
              </span>
            </div>

            {/* Backdrop to dismiss profile dropdown */}
            {openDropdownIndex !== null && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpenDropdownIndex(null)}
              />
            )}

            <div className="space-y-3">
              {Array.from({ length: playerCount }).map((_, idx) => {
                const currentAvatarId = playerAvatars[idx] || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];
                const isDropdownOpen = openDropdownIndex === idx;
                const openUpwards = (idx >= playerCount - 1 && playerCount >= 2);

                return (
                  <div key={idx} className={`relative ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAvatarModalIndex(idx)}
                        className="w-12 h-12 rounded-2xl bg-[#1d140c] border-2 border-[#e8c84a] hover:border-[#ffd700] hover:scale-105 active:scale-95 transition-all relative flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden group"
                      >
                        <AvatarDisplay avatarId={currentAvatarId} className="w-full h-full p-0.5" />
                        <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow border border-black/50 group-hover:scale-110 transition-transform">
                          +
                        </div>
                      </button>

                      <div className="relative flex-1 flex items-center">
                        <input
                          type="text"
                          value={playerNames[idx] || ''}
                          onChange={e => handleNameChange(idx, e.target.value)}
                          placeholder={`${t('playerPlaceholder')} ${idx + 1}`}
                          className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-[#e8c84a] rounded-xl pl-3.5 pr-24 py-2.5 text-sm text-[#f0ebe0] focus:outline-none transition-all font-barlow"
                        />

                        <button
                          type="button"
                          onClick={() => setOpenDropdownIndex(isDropdownOpen ? null : idx)}
                          className={`absolute right-1.5 py-1 px-2.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 transition-all ${
                            isDropdownOpen
                              ? 'bg-[#e8c84a] text-black shadow'
                              : 'bg-[#221a10] border border-[#e8c84a]/40 text-[#ffd700] hover:bg-[#2e2316]'
                          }`}
                        >
                          <span>{language === 'ro' ? '👤 Profil' : '👤 Profile'}</span>
                          <span className="text-[10px]">{isDropdownOpen ? '▲' : '▼'}</span>
                        </button>
                      </div>
                    </div>

                    {isDropdownOpen && (
                      <div
                        className={`absolute left-0 right-0 z-50 bg-gradient-to-b from-[#1c150e] to-[#120d09] border-2 border-[#e8c84a] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] max-h-56 overflow-y-auto p-2 animate-fade-in ${
                          openUpwards ? 'bottom-full mb-2' : 'top-14 mt-1'
                        }`}
                      >
                        <div className="flex items-center justify-between px-2 py-1 border-b border-[#2e2216] mb-1.5">
                          <span className="text-[10px] text-[#ffd700] font-cinzel font-bold uppercase tracking-wider">
                            📜 {language === 'ro' ? 'Profiluri Salvate' : 'Saved Profiles'} {openUpwards ? '↑' : '↓'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-barlow">
                            {profiles.length} {language === 'ro' ? 'înregistrate' : 'found'}
                          </span>
                        </div>

                        {profiles.length === 0 ? (
                          <div className="p-3 text-center text-xs text-gray-400 font-barlow">
                            {language === 'ro'
                              ? 'Nu ai profiluri salvate încă.'
                              : 'No saved profiles yet.'}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {profiles.map(p => (
                              <div
                                key={p.id}
                                onClick={() => selectProfileForPlayer(idx, p.name, p.avatarIcon)}
                                className="p-2 rounded-xl hover:bg-[#2c2014] cursor-pointer text-sm font-barlow text-[#e8c84a] flex items-center justify-between border border-transparent hover:border-[#ffd700]/30 transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#0d0a07] border border-[#e8c84a]/30">
                                    <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                                  </div>
                                  <div>
                                    <div className="font-cinzel font-bold text-xs text-[#f0ebe0]">
                                      {p.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                      {language === 'ro' ? 'Jocuri' : 'Games'}: {p.gamesPlayed} | 🍺 {p.totalSips} {t('sipsUnit')}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs bg-[#e8c84a]/20 text-[#ffd700] px-2 py-0.5 rounded font-cinzel font-bold">
                                  {language === 'ro' ? 'Alege ➔' : 'Select ➔'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Game Action Button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleStart}
            disabled={mode === 'duel' && duelRole === 'join' && duelRoomCodeInput.trim().length !== 4}
            className={`w-full py-4 rounded-xl font-cinzel font-black text-lg sm:text-xl transition-all active:scale-98 shadow-lg uppercase tracking-wide flex items-center justify-center gap-2 ${
              mode === 'duel' && duelRole === 'join' && duelRoomCodeInput.trim().length !== 4
                ? 'bg-[#22180f] text-gray-500 border border-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#e8c84a] via-[#ffd700] to-[#e8c84a] text-black hover:brightness-110 gold-glow'
            }`}
          >
            <span>{mode === 'duel' ? (duelRole === 'host' ? '👑' : '⚔️') : '🚀'}</span>
            <span>
              {mode === 'duel'
                ? (duelRole === 'host' ? t('duelCreateRoom') : t('duelJoinBtn'))
                : t('startGame')}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons Row */}
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          onClick={onOpenRules}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-[#e8c84a] text-sm font-cinzel text-[#f0ebe0] transition-all flex items-center justify-center gap-1.5"
        >
          {t('rulesBtn')}
        </button>
        <button
          onClick={onOpenProfiles}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-[#e8c84a] text-sm font-cinzel text-[#f0ebe0] transition-all flex items-center justify-center gap-1.5"
        >
          📊 {t('tabProfiles')}
        </button>
        <button
          onClick={onOpenCustomize}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-[#e8c84a] text-sm font-cinzel text-[#f0ebe0] transition-all flex items-center justify-center gap-1.5"
        >
          🎨 {t('tabCustomize')}
        </button>
      </div>

      {/* Custom Doubles Modal */}
      {showCustomDoublesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-md w-full space-y-4 gold-glow">
            <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
              {t('customDoublesTitle')}
            </h3>
            <p className="text-xs text-gray-300 font-barlow">
              {t('customDoublesDesc')}
            </p>

            <div className="space-y-3">
              {(['2-2', '3-3', '4-4', '5-5'] as const).map(pair => (
                <div key={pair} className="space-y-1">
                  <label className="text-xs font-cinzel font-bold text-[#e8c84a]">
                    Dublu {pair}:
                  </label>
                  <input
                    type="text"
                    value={customDoubles[pair]}
                    onChange={e =>
                      setCustomDoubles(prev => ({ ...prev, [pair]: e.target.value }))
                    }
                    placeholder="Lasa liber pentru standard..."
                    className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-[#e8c84a] rounded-xl px-3 py-2 text-sm text-[#f0ebe0] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCustomDoublesModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-sm hover:bg-[#d4b038] transition-colors"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {avatarModalIndex !== null && (
        <AvatarModal
          isOpen={true}
          currentAvatarId={playerAvatars[avatarModalIndex] || DEFAULT_AVATARS[avatarModalIndex % DEFAULT_AVATARS.length]}
          onSelectAvatar={newAvatarId => {
            handleAvatarChange(avatarModalIndex, newAvatarId);
            setAvatarModalIndex(null);
          }}
          onClose={() => setAvatarModalIndex(null)}
        />
      )}
    </div>
  );
};
