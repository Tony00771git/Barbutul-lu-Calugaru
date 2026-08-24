import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Player, Profile, GameMode } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarModal } from './AvatarModal';
import { ACHIEVEMENTS, Achievement, getAchievementsWithProgress } from '../data/achievements';
import {
  calculateProgression,
  getAchievementTierInfo,
  getNextRankTitle,
  getUpcomingMilestones,
  getTotalXpForLevel,
} from '../lib/progression';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayers?: Player[];
  activePlayerIndex?: number;
  gameMode?: GameMode;
  initialTab?: 'live' | 'alltime' | 'achievements';
  achievementsOnly?: boolean;
  onOpenBazaar?: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  activePlayers = [],
  activePlayerIndex = 0,
  gameMode,
  initialTab,
  achievementsOnly = false,
  onOpenBazaar,
}) => {
  const {
    profiles,
    drunkenCoins,
    addProfile,
    deleteProfile,
    updateProfileAvatar,
    resetAllStats,
    t,
    language,
  } = useApp();

  const isOnlyAchievements = achievementsOnly || initialTab === 'achievements';

  const [activeTab, setActiveTab] = useState<'live' | 'alltime' | 'achievements'>(
    isOnlyAchievements ? 'achievements' : initialTab || (activePlayers.length > 0 ? 'live' : 'alltime')
  );

  React.useEffect(() => {
    if (isOpen) {
      if (isOnlyAchievements) {
        setActiveTab('achievements');
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, isOnlyAchievements]);
  const [selectedProfileIdForAchievements, setSelectedProfileIdForAchievements] = useState<string>(
    profiles[0]?.id || ''
  );
  const [rarityFilter, setRarityFilter] = useState<'all' | 'common' | 'rare' | 'legendary'>('all');
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newProfileAvatar, setNewProfileAvatar] = useState<string>('monk_drunk');

  // Avatar Modal State for profiles
  const [avatarModalTarget, setAvatarModalTarget] = useState<{
    type: 'new' | 'edit';
    profileId?: string;
    currentAvatarId: string;
    profileName: string;
  } | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleResetAllStats = async () => {
    setIsResetting(true);
    try {
      await resetAllStats();
      setShowResetConfirm(false);
    } catch (e) {
      console.error('Reset stats failed:', e);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  // Selected Profile for achievements tab
  const activeAchievementProfile: Profile | undefined =
    profiles.find(p => p.id === selectedProfileIdForAchievements) || profiles[0];

  const achievementProgressList = activeAchievementProfile
    ? getAchievementsWithProgress(activeAchievementProfile)
    : ACHIEVEMENTS.map(a => ({
        ...a,
        titleRo: a.nameRo,
        titleEn: a.nameEn,
        unlocked: false,
        current: 0,
        target: a.targetCount || 1,
      }));

  const filteredAchievements = achievementProgressList.filter(a => {
    if (rarityFilter === 'all') return true;
    return a.rarity === rarityFilter;
  });

  const unlockedCount = achievementProgressList.filter(a => a.unlocked).length;

  // Drunkenness title helper
  const getDrunkennessTitle = (sips: number, chugs: number) => {
    const totalScore = sips + chugs * 25;
    const isRo = language === 'ro';
    if (totalScore === 0) return { title: isRo ? '😇 Monah Treaz' : '😇 Sober Monk', color: 'text-emerald-400', bg: 'bg-emerald-950/60' };
    if (totalScore <= 10) return { title: isRo ? '🍺 Ucenic Vesel' : '🍺 Merry Apprentice', color: 'text-yellow-400', bg: 'bg-yellow-950/60' };
    if (totalScore <= 25) return { title: isRo ? '🥴 Frate Amețit' : '🥴 Tipsy Friar', color: 'text-amber-400', bg: 'bg-amber-950/60' };
    if (totalScore <= 45) return { title: isRo ? '😵 Călugăr Turmentat' : '😵 Drunken Monk', color: 'text-orange-400', bg: 'bg-orange-950/60' };
    return { title: isRo ? '👑 Arhimandritul Berii' : '👑 Beer Archimandrite', color: 'text-red-400', bg: 'bg-red-950/60' };
  };

  // Sort active players by drunkenness score (sips + 25 * chugs)
  const rankedActivePlayers = [...activePlayers].sort((a, b) => {
    const scoreA = a.sipsTotal + 25 * a.chugsTotal;
    const scoreB = b.sipsTotal + 25 * b.chugsTotal;
    return scoreB - scoreA;
  });

  // Sort profiles by all-time drunkenness
  const sortedProfiles = [...profiles].sort((a, b) => {
    const scoreA = a.totalSips + 25 * a.totalChugs;
    const scoreB = b.totalSips + 25 * b.totalChugs;
    return scoreB - scoreA;
  });

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    addProfile(newProfileName.trim(), newProfileAvatar);
    setNewProfileName('');
    setNewProfileAvatar('monk_drunk');
  };

  const handleSelectAvatarFromModal = (avatarId: string) => {
    if (!avatarModalTarget) return;
    if (avatarModalTarget.type === 'new') {
      setNewProfileAvatar(avatarId);
    } else if (avatarModalTarget.profileId) {
      updateProfileAvatar(avatarModalTarget.profileId, avatarId);
    }
    setAvatarModalTarget(null);
  };

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99990 }}
      className="fixed inset-0 z-[99990] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1b1510] via-[#120e0a] to-[#0c0906] border-2 border-[#e8c84a] rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(232,200,74,0.25)] space-y-4"
      >
        
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">{isOnlyAchievements ? '🏅' : '📊'}</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-cinzel font-black text-[#ffd700] gold-text-glow">
                {isOnlyAchievements
                  ? (language === 'ro' ? 'REALIZĂRI & TROFEE' : 'ACHIEVEMENTS & TROPHIES')
                  : (language === 'ro' ? 'TABEL DE SCOR & STATISTICI' : 'SCORE TABLE & STATS')}
              </h2>
              <p className="text-[11px] font-barlow text-gray-400">
                {isOnlyAchievements
                  ? (language === 'ro'
                      ? 'Toate cele 53 de trofee monahale • Deblochează-le jucând orice mod!'
                      : 'All 53 monk achievements • Play any mode to unlock!')
                  : (language === 'ro'
                      ? 'Evidența completă • Gură = 1 punct | Groapă = 25 puncte'
                      : 'Full stats • 1 Sip = 1 point | 1 Chug = 25 points')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a1d12] border border-[#e8c84a]/50 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg hover:border-[#ffd700] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector (Hidden if Achievements Only) */}
        {!isOnlyAchievements && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-[#0e0a06] p-1.5 rounded-2xl border border-[#2a2219]">
            <button
              onClick={() => setActiveTab('live')}
              className={`py-2 px-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 ${
                activeTab === 'live'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🏆</span>
              <span className="truncate">Scor Meci {activePlayers.length > 0 && `(${activePlayers.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('alltime')}
              className={`py-2 px-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 ${
                activeTab === 'alltime'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>👤</span>
              <span className="truncate">Profiluri ({profiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-2 px-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🏅</span>
              <span className="truncate">Achievements</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          
          {/* TAB 1: LIVE GAME SCORES */}
          {activeTab === 'live' && (
            <div className="space-y-2.5">
              {activePlayers.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="text-4xl">🎲 🍺</div>
                  <p className="text-sm font-cinzel text-gray-400">
                    Niciun joc activ în desfășurare.
                  </p>
                  <p className="text-xs font-barlow text-gray-500">
                    Pornește o partidă Normală sau Monopoly pentru a vedea scorul în direct!
                  </p>
                </div>
              ) : (
                rankedActivePlayers.map((p, rankIdx) => {
                  const originalIdx = activePlayers.findIndex(orig => orig.id === p.id);
                  const isCurrentTurn = originalIdx === activePlayerIndex;
                  const rankBadge = rankIdx === 0 ? '👑 1' : rankIdx === 1 ? '🥈 2' : rankIdx === 2 ? '🥉 3' : `#${rankIdx + 1}`;
                  const drunkStatus = getDrunkennessTitle(p.sipsTotal, p.chugsTotal);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                        isCurrentTurn
                          ? 'bg-gradient-to-r from-[#2e1f13] via-[#22170e] to-[#2e1f13] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                          : 'bg-[#140f0a] border-[#2c2218]'
                      }`}
                    >
                      {/* Active Player Glow Ribbon */}
                      {isCurrentTurn && (
                        <div className="absolute top-0 right-0 bg-[#ffd700] text-black text-[9px] font-cinzel font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                          La Tură
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Avatar & Info */}
                        <div className="flex items-center gap-3">
                          {/* Rank Icon */}
                          <div className={`w-8 h-8 rounded-xl font-cinzel font-black text-xs flex items-center justify-center flex-shrink-0 ${
                            rankIdx === 0
                              ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow'
                              : rankIdx === 1
                              ? 'bg-slate-300 text-black'
                              : rankIdx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-black/60 text-gray-400 border border-white/10'
                          }`}>
                            {rankBadge}
                          </div>

                          {/* Avatar Display */}
                          <div className="w-11 h-11 rounded-2xl bg-[#22180f] border border-[#e8c84a]/50 flex-shrink-0 overflow-hidden shadow-inner">
                            <AvatarDisplay avatarId={p.avatarIcon} className="w-full h-full" />
                          </div>

                          {/* Name & Drunken Title */}
                          <div>
                            <div className="font-cinzel font-bold text-sm sm:text-base text-[#f0ebe0] flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.inJail && <span className="text-xs bg-red-600 text-white px-1.5 py-0.2 rounded-md">În Temniță</span>}
                              {p.hasGivenUp && <span className="text-xs bg-gray-600 text-white px-1.5 py-0.2 rounded-md">Abandonat</span>}
                            </div>
                            <div className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-cinzel font-bold mt-0.5 ${drunkStatus.bg} ${drunkStatus.color}`}>
                              {drunkStatus.title}
                            </div>
                          </div>
                        </div>

                        {/* Right: Sips & Chugs & Total Points stats */}
                        <div className="flex items-center gap-2 sm:gap-3 text-right flex-shrink-0">
                          {/* Sips Counter */}
                          <div className="bg-[#0b0805] px-2.5 py-1 rounded-xl border border-amber-500/30">
                            <div className="text-sm sm:text-base font-cinzel font-black text-[#ffd700]">
                              🍺 {p.sipsTotal}
                            </div>
                            <div className="text-[9px] font-barlow text-gray-400 uppercase">Guri</div>
                          </div>

                          {/* Chugs Counter */}
                          <div className="bg-[#0b0805] px-2.5 py-1 rounded-xl border border-red-500/30">
                            <div className="text-sm sm:text-base font-cinzel font-black text-[#ff5533]">
                              🔥 {p.chugsTotal}
                            </div>
                            <div className="text-[9px] font-barlow text-gray-400 uppercase">Gropi</div>
                          </div>

                          {/* Total Points (1 gura = 1p, 1 groapa = 25p) */}
                          <div className="bg-[#1c140a] px-2.5 py-1 rounded-xl border border-[#e8c84a]/60 gold-glow">
                            <div className="text-sm sm:text-base font-cinzel font-black text-[#ffd700]">
                              {p.sipsTotal + 25 * p.chugsTotal} pt
                            </div>
                            <div className="text-[9px] font-barlow text-[#e8c84a] uppercase font-bold">Total</div>
                          </div>

                          {/* Gold & Properties (Monopoly mode) */}
                          {gameMode === 'boardgame' && (
                            <div className="hidden sm:block bg-[#0b0805] px-2.5 py-1 rounded-xl border border-yellow-500/20">
                              <div className="text-xs font-cinzel font-bold text-yellow-300">
                                🪙 {p.gold}
                              </div>
                              <div className="text-[9px] font-barlow text-gray-400 uppercase">
                                🏰 {p.properties?.length || 0} prop
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Extra Badges Row on Mobile */}
                      <div className="flex items-center justify-between text-[10px] font-barlow text-gray-400 mt-2 pt-1.5 border-t border-white/5 px-1">
                        <div>
                          <span>Pase: <b className="text-gray-300">{p.passesCount}</b></span>
                          <span className="mx-2">•</span>
                          <span>Iertări: <b className="text-blue-300">{p.pardonLetters} 🎟️</b></span>
                        </div>
                        {gameMode === 'boardgame' && (
                          <div className="sm:hidden text-amber-300">
                            🪙 {p.gold} galbeni • 🏰 {p.properties?.length || 0} proprietăți
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: ALL-TIME PROFILES & STATS */}
          {activeTab === 'alltime' && (
            <div className="space-y-4">
              {/* Global Unified Drunken Coins Treasury Overview */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#20150a] via-[#160e06] to-[#0c0804] border border-[#ffd700]/50 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🍺🪙</span>
                  <div>
                    <div className="text-xs font-cinzel font-bold text-amber-200">
                      {language === 'ro' ? 'Tezaur Global de Bănuți' : 'Global Drunken Coins Treasury'}
                    </div>
                    <div className="text-[10px] font-barlow text-gray-400">
                      {language === 'ro' ? 'Comun pentru toate profilurile & jocurile' : 'Shared across all monk profiles & modes'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-cinzel font-black text-[#ffd700] gold-text-glow">
                    {drunkenCoins.toLocaleString()} 🍺🪙
                  </span>
                  {onOpenBazaar && (
                    <button
                      type="button"
                      onClick={onOpenBazaar}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-700 to-yellow-600 hover:brightness-110 text-black font-cinzel font-black text-[11px] shadow transition-all active:scale-95 cursor-pointer"
                    >
                      {language === 'ro' ? 'Bazar 🛒' : 'Bazaar 🛒'}
                    </button>
                  )}
                </div>
              </div>

              {/* Add Profile Form with Avatar Selector Button [+] */}
              <form onSubmit={handleAddProfile} className="flex items-center gap-2 bg-[#120e0a] p-2 rounded-2xl border border-[#2a2219]">
                {/* Avatar Picker Square with [+] */}
                <button
                  type="button"
                  onClick={() =>
                    setAvatarModalTarget({
                      type: 'new',
                      currentAvatarId: newProfileAvatar,
                      profileName: newProfileName || 'Profil Nou',
                    })
                  }
                  className="w-11 h-11 rounded-xl bg-[#20170f] border-2 border-[#e8c84a] hover:border-[#ffd700] relative flex-shrink-0 flex items-center justify-center overflow-hidden group shadow"
                  title="Alege avatar pentru noul profil"
                >
                  <AvatarDisplay avatarId={newProfileAvatar} className="w-full h-full p-0.5" />
                  <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shadow border border-black">
                    +
                  </div>
                </button>

                <input
                  type="text"
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="Nume profil nou de călugăr..."
                  className="flex-1 bg-[#0b0805] border border-[#2c2218] focus:border-[#ffd700] rounded-xl px-3 py-2 text-sm text-[#f0ebe0] focus:outline-none font-barlow"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black font-cinzel font-black text-xs hover:brightness-110 shadow"
                >
                  ➕ Adaugă
                </button>
              </form>

              {/* Profiles List */}
              <div className="space-y-2">
                {sortedProfiles.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 font-barlow text-sm">
                    Niciun profil salvat încă în cronicile mănăstirii.
                  </div>
                ) : (
                  sortedProfiles.map(prof => {
                    const drunkProf = getDrunkennessTitle(prof.totalSips, prof.totalChugs);
                    const avatarId = prof.avatarIcon || 'monk_drunk';
                    const prog = calculateProgression(prof.totalXP || 0);
                    const isRo = language === 'ro';

                    return (
                      <div
                        key={prof.id}
                        className="p-3 rounded-2xl border border-[#2a2218] bg-[#120e0a] flex flex-col gap-2 font-barlow text-sm hover:border-[#e8c84a]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Avatar with click-to-edit [+] box and Level badge */}
                            <div className="relative flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setAvatarModalTarget({
                                    type: 'edit',
                                    profileId: prof.id,
                                    currentAvatarId: avatarId,
                                    profileName: prof.name,
                                  })
                                }
                                className="w-12 h-12 rounded-xl bg-[#20170f] border-2 border-[#e8c84a]/60 hover:border-[#ffd700] flex items-center justify-center overflow-hidden group shadow cursor-pointer transition-transform hover:scale-105"
                                title="Apasă pentru a schimba avatarul acestui profil"
                              >
                                <AvatarDisplay avatarId={avatarId} className="w-full h-full p-0.5" />
                                <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shadow border border-black group-hover:scale-110 transition-transform">
                                  +
                                </div>
                              </button>
                            </div>

                            <div>
                              <div className="font-cinzel font-bold text-sm text-[#f0ebe0] flex flex-wrap items-center gap-1.5">
                                <span>{prof.name}</span>
                                {/* Level Badge */}
                                <span className="bg-amber-600/90 text-white font-cinzel font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40">
                                  Nv. {prog.currentLevel}
                                </span>
                                {/* Thematic Rank Title */}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-cinzel font-bold flex items-center gap-1 ${prog.titleColor} bg-black/40 border border-white/10`}>
                                  <span>{prog.titleIcon}</span>
                                  <span>{isRo ? prog.titleRo : prog.titleEn}</span>
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                Jocuri: <b className="text-gray-300">{prof.gamesPlayed}</b> | 🍺 <b className="text-amber-300">{prof.totalSips}</b> guri | 🔥 <b className="text-red-400">{prof.totalChugs}</b> gropi | ⚡ <b className="text-[#ffd700]">{prof.totalXP || 0} XP</b>
                                {Boolean((prof.winsBoardgame || 0) + (prof.winsDuel || 0) + (prof.winsCasino || 0) + (prof.winsPineapple || 0)) && (
                                  <div className="mt-1 flex items-center gap-2 text-[10px] text-amber-200/90 flex-wrap">
                                    {Boolean(prof.winsBoardgame) && <span>🏰 Monopoly: <b>{prof.winsBoardgame}</b></span>}
                                    {Boolean(prof.winsDuel) && <span>⚔️ Duel: <b>{prof.winsDuel}</b></span>}
                                    {Boolean(prof.winsCasino) && <span>🎲 Craps: <b>{prof.winsCasino}</b></span>}
                                    {Boolean(prof.winsPineapple) && <span>🍍 Pineapple: <b>{prof.winsPineapple}</b></span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteProfile(prof.id)}
                            className="text-gray-500 hover:text-red-400 p-2 font-bold transition-colors"
                            title="Șterge profil"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* XP Progress Bar & Next Title Milestone */}
                        <div className="bg-[#0b0805] px-2.5 py-1.5 rounded-xl border border-stone-800/80 space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-cinzel">
                            <span className="text-gray-400">
                              {isRo ? `Progres Nivel ${prog.currentLevel}` : `Level ${prog.currentLevel} Progress`}
                            </span>
                            <span className="text-[#ffd700] font-bold font-mono">
                              {prog.xpInCurrentLevel} / {prog.xpNeededForNextLevel} XP ({prog.progressPercent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#1c140c] rounded-full overflow-hidden border border-stone-800">
                            <div
                              className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-[#ffd700] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                              style={{ width: `${Math.max(3, prog.progressPercent)}%` }}
                            />
                          </div>
                          {(() => {
                            const nextTitle = getNextRankTitle(prog.currentLevel);
                            if (!nextTitle) return null;
                            const nextXpTotal = getTotalXpForLevel(nextTitle.minLevel);
                            const xpLeft = Math.max(0, nextXpTotal - (prof.totalXP || 0));
                            return (
                              <div className="flex justify-between items-center text-[9px] text-gray-400 font-barlow pt-0.5">
                                <span>Mai ai: <b className="text-[#ffd700] font-mono">{xpLeft.toLocaleString()} XP</b></span>
                                <span className={`font-cinzel ${nextTitle.color} flex items-center gap-1`}>
                                  <span>{nextTitle.icon}</span>
                                  <span>{isRo ? nextTitle.titleRo : nextTitle.titleEn} (Nv. {nextTitle.minLevel})</span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reset All-Time Stats Action */}
              <div className="pt-2 border-t border-[#2a2219]">
                {showResetConfirm ? (
                  <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-2xl flex flex-col gap-2">
                    <p className="text-xs text-red-200 font-cinzel font-bold text-center">
                      {language === 'ro'
                        ? '⚠️ Sigur resetezi toate statisticile, XP-ul, nivelurile și realizările la 0 (Local & Cloud)?'
                        : '⚠️ Are you sure you want to reset all stats, XP, levels and achievements to 0 (Local & Cloud)?'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetAllStats}
                        disabled={isResetting}
                        className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cinzel font-black text-xs shadow disabled:opacity-50"
                      >
                        {isResetting
                          ? (language === 'ro' ? 'Se resetează...' : 'Resetting...')
                          : (language === 'ro' ? 'Da, resetează totul la 0' : 'Yes, reset all to 0')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-gray-300 font-cinzel text-xs"
                      >
                        {language === 'ro' ? 'Anulează' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#181109] hover:bg-red-950/30 border border-red-500/30 hover:border-red-500/60 text-red-400 font-cinzel font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>🗑️</span>
                      <span>
                        {language === 'ro' ? 'Resetează toate statisticile la 0' : 'Reset all stats to 0'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS PER PROFILE */}
          {activeTab === 'achievements' && (() => {
            const activeProg = calculateProgression(activeAchievementProfile?.totalXP || 0);
            const nextRankTitle = getNextRankTitle(activeProg.currentLevel);
            const upcomingMilestones = getUpcomingMilestones(activeProg.currentLevel, 3);
            const xpRemainingForNextLevel = Math.max(0, activeProg.nextLevelXP - activeProg.totalXP);

            const unlockedAchList = achievementProgressList.filter(a => a.unlocked);
            const unlockedAchXp = unlockedAchList.reduce((sum, a) => sum + getAchievementTierInfo(a.id).xp, 0);
            const totalPotentialAchXp = ACHIEVEMENTS.reduce((sum, a) => sum + getAchievementTierInfo(a.id).xp, 0);
            const remainingAchXp = Math.max(0, totalPotentialAchXp - unlockedAchXp);

            const commonCount = ACHIEVEMENTS.filter(a => a.rarity === 'common').length;
            const rareCount = ACHIEVEMENTS.filter(a => a.rarity === 'rare').length;
            const legendaryCount = ACHIEVEMENTS.filter(a => a.rarity === 'legendary').length;

            return (
              <div className="space-y-3.5">
                {/* 1. HERO PROGRESSION & LEVEL MILESTONE CARD */}
                <div className="bg-gradient-to-br from-[#181109] via-[#120c06] to-[#0d0905] border-2 border-[#3d2e1b] rounded-2xl p-3.5 shadow-xl relative overflow-hidden">
                  {/* Atmospheric gold glow */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Top Row: Profile Info & Level Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#20170f] border-2 border-[#ffd700] overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                        <AvatarDisplay
                          avatarId={activeAchievementProfile?.avatarIcon || 'monk_drunk'}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={activeAchievementProfile?.id || ''}
                            onChange={e => setSelectedProfileIdForAchievements(e.target.value)}
                            className="bg-[#1c150e] border border-[#3d2e1b] hover:border-[#ffd700]/60 rounded-xl px-2.5 py-1 text-sm font-cinzel font-black text-[#ffd700] focus:outline-none cursor-pointer"
                          >
                            {profiles.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>

                          {/* Level Badge */}
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 font-cinzel font-black text-xs shadow">
                            Nv. {activeProg.currentLevel}
                          </span>
                        </div>

                        {/* Rank Title with Icon */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm">{activeProg.titleIcon}</span>
                          <span className={`text-xs font-cinzel font-bold ${activeProg.titleColor}`}>
                            {language === 'ro' ? activeProg.titleRo : activeProg.titleEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total XP & Drunken Coins Badges */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-[#090604]/80 px-2.5 py-1.5 rounded-xl border border-stone-800 flex-1 sm:flex-initial">
                        <span className="text-[9px] font-cinzel uppercase text-gray-400">Total XP</span>
                        <span className="text-xs sm:text-sm font-cinzel font-black text-[#ffd700] gold-text-glow flex items-center gap-1">
                          <span>⚡</span>
                          <span>{activeProg.totalXP.toLocaleString()}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={onOpenBazaar}
                        className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-gradient-to-r from-[#24150a] to-[#140b04] hover:from-[#351e0e] hover:to-[#1e1006] px-2.5 py-1.5 rounded-xl border border-amber-500/60 hover:border-[#ffd700] flex-1 sm:flex-initial shadow active:scale-95 transition-all cursor-pointer group"
                        title={language === 'ro' ? 'Deschide Bazarul Călugăresc (Magazin)' : 'Open Monastic Bazaar (Shop)'}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-cinzel uppercase text-amber-400 font-bold group-hover:text-yellow-300">
                            {language === 'ro' ? 'Bazar 🛒' : 'Bazaar 🛒'}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-cinzel font-black text-amber-300 group-hover:text-[#ffd700] flex items-center gap-1">
                          <span>🍺🪙</span>
                          <span>{(activeAchievementProfile?.drunkenCoins ?? 0).toLocaleString()}</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar to Next Level Milestone */}
                  <div className="mt-3.5 bg-[#0a0704]/90 p-3 rounded-xl border border-[#2a2015] relative z-10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-cinzel">
                      <div className="flex items-center gap-1.5 font-black text-amber-200">
                        <span>Nivel {activeProg.currentLevel}</span>
                        <span className="text-amber-500">➔</span>
                        <span className="text-[#ffd700]">Nivel {activeProg.currentLevel + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-[11px]">
                          {activeProg.xpInCurrentLevel} / {activeProg.xpNeededForNextLevel} XP
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#251a0f] border border-[#ffd700]/40 text-[#ffd700] font-black text-[11px]">
                          {activeProg.progressPercent}%
                        </span>
                      </div>
                    </div>

                    {/* The Level Progress Bar */}
                    <div className="w-full h-3.5 bg-[#140e09] rounded-full overflow-hidden border border-[#3d2e1b] p-0.5 relative shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-[#ffd700] rounded-full transition-all duration-700 relative shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                        style={{ width: `${Math.max(4, activeProg.progressPercent)}%` }}
                      >
                        {/* Shimmer light tip */}
                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full blur-[1px]" />
                      </div>
                    </div>

                    {/* Milestone Details: XP Remaining & Next Rank Unlock */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] font-cinzel pt-0.5">
                      <div className="text-amber-300/90 flex items-center gap-1">
                        <span>🔥</span>
                        <span>
                          {language === 'ro'
                            ? `Încă ${xpRemainingForNextLevel} XP până la Nivelul ${activeProg.currentLevel + 1}`
                            : `${xpRemainingForNextLevel} XP needed for Level ${activeProg.currentLevel + 1}`}
                        </span>
                      </div>

                      {nextRankTitle && (
                        <div className="text-yellow-400 flex items-center gap-1 font-bold">
                          <span>🎁</span>
                          <span>
                            {language === 'ro'
                              ? `Următorul Rang: ${nextRankTitle.icon} ${nextRankTitle.titleRo} (la Nv. ${nextRankTitle.minLevel})`
                              : `Next Title: ${nextRankTitle.icon} ${nextRankTitle.titleEn} (at Lv. ${nextRankTitle.minLevel})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. UPCOMING MILESTONES STEP TRACK */}
                  <div className="mt-3 pt-2.5 border-t border-[#261c11] grid grid-cols-3 gap-2 text-center text-xs font-cinzel">
                    {upcomingMilestones.map((m, idx) => {
                      const xpLeft = Math.max(0, m.totalXpNeeded - activeProg.totalXP);
                      const isNext = idx === 0;

                      return (
                        <div
                          key={m.level}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            isNext
                              ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                              : 'bg-[#100b07] border-stone-800/80 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-1 font-black text-[11px] text-amber-200">
                            {m.titleReward ? <span>{m.titleReward.icon}</span> : <span>⭐</span>}
                            <span>Nivel {m.level}</span>
                          </div>
                          <div className="text-[10px] text-[#ffd700] font-bold mt-0.5">
                            {m.totalXpNeeded} XP
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            {xpLeft === 0
                              ? 'Atinge!'
                              : language === 'ro'
                              ? `-${xpLeft} XP`
                              : `${xpLeft} left`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 3. ACHIEVEMENT XP STATS SUMMARY PILLS */}
                  <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-[11px] font-cinzel text-gray-300">
                    <div className="flex items-center gap-1 bg-[#100b07] px-2.5 py-1 rounded-lg border border-[#2a2015]">
                      <span>⚡</span>
                      <span>
                        {language === 'ro' ? 'XP Realizări:' : 'Achievements XP:'}{' '}
                        <strong className="text-[#ffd700]">{unlockedAchXp} XP</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-[#100b07] px-2.5 py-1 rounded-lg border border-[#2a2015]">
                      <span>💎</span>
                      <span>
                        {language === 'ro' ? 'XP Rămas:' : 'Remaining XP:'}{' '}
                        <strong className="text-cyan-300">{remainingAchXp} XP</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-[#100b07] px-2.5 py-1 rounded-lg border border-[#2a2015]">
                      <span>🏆</span>
                      <span>
                        {language === 'ro' ? 'Deblocate:' : 'Unlocked:'}{' '}
                        <strong className="text-emerald-400">
                          {unlockedAchList.length} / {ACHIEVEMENTS.length}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. RARITY FILTER STRIP */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-cinzel">
                  <button
                    onClick={() => setRarityFilter('all')}
                    className={`px-3 py-1 rounded-xl transition-all font-bold ${
                      rarityFilter === 'all'
                        ? 'bg-[#ffd700] text-black shadow'
                        : 'bg-[#18120b] border border-[#2a2219] text-gray-400 hover:text-white'
                    }`}
                  >
                    Toate ({achievementProgressList.length})
                  </button>
                  <button
                    onClick={() => setRarityFilter('common')}
                    className={`px-3 py-1 rounded-xl transition-all font-bold flex items-center gap-1 ${
                      rarityFilter === 'common'
                        ? 'bg-amber-700 text-white shadow'
                        : 'bg-[#18120b] border border-amber-900/50 text-amber-300/80 hover:text-amber-200'
                    }`}
                  >
                    <span>🥉</span>
                    <span>Comun ({commonCount})</span>
                  </button>
                  <button
                    onClick={() => setRarityFilter('rare')}
                    className={`px-3 py-1 rounded-xl transition-all font-bold flex items-center gap-1 ${
                      rarityFilter === 'rare'
                        ? 'bg-sky-700 text-white shadow'
                        : 'bg-[#18120b] border border-sky-900/50 text-sky-300/80 hover:text-sky-200'
                    }`}
                  >
                    <span>🥈</span>
                    <span>Rar ({rareCount})</span>
                  </button>
                  <button
                    onClick={() => setRarityFilter('legendary')}
                    className={`px-3 py-1 rounded-xl transition-all font-bold flex items-center gap-1 ${
                      rarityFilter === 'legendary'
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_10px_rgba(255,215,0,0.5)] font-black'
                        : 'bg-[#18120b] border border-yellow-500/50 text-yellow-300 hover:text-yellow-100'
                    }`}
                  >
                    <span>👑</span>
                    <span>Legendar ({legendaryCount})</span>
                  </button>
                </div>

                {/* 5. ACHIEVEMENTS LIST WITH LEVEL-UP INDICATORS */}
                <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                  {filteredAchievements.map(ach => {
                    const isUnlocked = ach.unlocked;
                    const isLegendary = ach.rarity === 'legendary';
                    const isRare = ach.rarity === 'rare';
                    const tierInfo = getAchievementTierInfo(ach.id);

                    const rarityBadge = isLegendary
                      ? { label: '👑 LEGENDAR', style: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/60' }
                      : isRare
                      ? { label: '🥈 RAR', style: 'bg-sky-950/60 text-sky-300 border-sky-600/40' }
                      : { label: '🥉 COMUN', style: 'bg-amber-950/40 text-amber-300/80 border-amber-800/40' };

                    // Level Up Milestone Impact calculation
                    const willTriggerLevelUp = !isUnlocked && tierInfo.xp >= xpRemainingForNextLevel;
                    const xpContributionPercent = Math.min(
                      100,
                      Math.round((tierInfo.xp / activeProg.xpNeededForNextLevel) * 100)
                    );

                    return (
                      <div
                        key={ach.id}
                        className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
                          isUnlocked
                            ? isLegendary
                              ? 'bg-gradient-to-r from-[#241a0b] via-[#1c1308] to-[#241a0b] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                              : 'bg-[#15100a] border-[#e8c84a]/60 shadow-md'
                            : willTriggerLevelUp
                            ? 'bg-gradient-to-r from-[#1c1309] to-[#120d07] border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                            : 'bg-[#0e0a07]/80 border-[#221a12] opacity-85'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner ${
                              isUnlocked
                                ? isLegendary
                                  ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border-[#ffe98a] shadow-[0_0_12px_rgba(255,215,0,0.5)]'
                                  : 'bg-[#2a1d10] border-[#ffd700]/60'
                                : willTriggerLevelUp
                                ? 'bg-[#26180c] border-amber-500/70 text-amber-200'
                                : 'bg-[#140f0a] border-[#2a2219] grayscale opacity-50'
                            }`}
                          >
                            {ach.icon}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4
                                  className={`font-cinzel font-bold text-sm ${
                                    isUnlocked
                                      ? isLegendary
                                        ? 'text-[#ffd700] gold-text-glow font-black'
                                        : 'text-[#f0ebe0]'
                                      : willTriggerLevelUp
                                      ? 'text-amber-200 font-black'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {language === 'ro' ? ach.titleRo : ach.titleEn}
                                </h4>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-cinzel font-black tracking-wider ${rarityBadge.style}`}>
                                  {rarityBadge.label}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-cinzel font-black tracking-wider flex items-center gap-0.5 ${tierInfo.badgeBg} ${tierInfo.textColor} ${tierInfo.borderColor}`}>
                                  <span>⚡</span>
                                  <span>+{tierInfo.xp} XP</span>
                                </span>
                              </div>

                              {/* Status Pill */}
                              <span
                                className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  isUnlocked
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow'
                                    : 'bg-[#1c150e] text-gray-500 border border-gray-700'
                                }`}
                              >
                                {isUnlocked ? '✨ Deblocat' : '🔒 Blocat'}
                              </span>
                            </div>

                            <p className="text-xs font-barlow text-gray-300 mt-1 leading-snug">
                              {language === 'ro' ? ach.descRo : ach.descEn}
                            </p>

                            {/* LEVEL UP INDICATOR / XP IMPACT CALLOUT */}
                            {!isUnlocked && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] font-cinzel">
                                {willTriggerLevelUp ? (
                                  <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border border-amber-500/70 text-amber-200 font-black flex items-center gap-1.5 shadow animate-pulse">
                                    <span>🚀</span>
                                    <span>
                                      {language === 'ro'
                                        ? `LEVEL UP! Te promovează la Nivelul ${activeProg.currentLevel + 1}!`
                                        : `LEVEL UP! Promotes you to Level ${activeProg.currentLevel + 1}!`}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-gray-400 flex items-center gap-1 text-[10px]">
                                    <span>📈</span>
                                    <span>
                                      {language === 'ro'
                                        ? `+${xpContributionPercent}% din progresul spre Nivelul ${activeProg.currentLevel + 1}`
                                        : `+${xpContributionPercent}% progress towards Level ${activeProg.currentLevel + 1}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Progress Bar for multi-tier or cumulative achievements */}
                            {ach.target && ach.target > 1 ? (
                              <div className="mt-2.5 space-y-1.5 bg-[#0b0805]/70 p-2 rounded-xl border border-[#231a10]">
                                <div className="flex items-center justify-between text-[11px] font-cinzel">
                                  <span className="text-gray-400 font-bold flex items-center gap-1">
                                    <span>🎯</span>
                                    <span>{language === 'ro' ? 'Progres Trofeu:' : 'Trophy Progress:'}</span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-[#ffd700] gold-text-glow">
                                      {ach.current ?? 0} / {ach.target}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                                      isUnlocked
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-[#181109] text-amber-300 border border-amber-500/30'
                                    }`}>
                                      {Math.min(100, Math.round(((ach.current || 0) / ach.target) * 100))}%
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full h-2.5 bg-[#070503] rounded-full overflow-hidden border border-[#2a2219] p-0.5">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isUnlocked
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                                        : willTriggerLevelUp
                                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                                        : 'bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, Math.max(isUnlocked ? 100 : 3, Math.round(((ach.current || 0) / ach.target) * 100)))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>

        {/* Footer info banner */}
        <div className="pt-2 border-t border-[#2a2218] flex items-center justify-between text-[11px] font-barlow text-gray-400">
          <span>✨ Actualizat automat după fiecare tură</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2a1d12] border border-[#e8c84a]/50 text-[#ffd700] hover:bg-[#3d2a19] font-cinzel font-bold text-xs"
          >
            Închide ➔
          </button>
        </div>

      </div>

      {/* Avatar Modal for creating or changing profile avatars */}
      {avatarModalTarget && (
        <AvatarModal
          isOpen={avatarModalTarget !== null}
          onClose={() => setAvatarModalTarget(null)}
          selectedAvatarId={avatarModalTarget.currentAvatarId}
          onSelectAvatar={handleSelectAvatarFromModal}
          playerName={avatarModalTarget.profileName}
        />
      )}
    </div>
  );
};
