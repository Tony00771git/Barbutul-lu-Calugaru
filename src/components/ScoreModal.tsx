import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Player, Profile, GameMode } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarModal } from './AvatarModal';
import { ACHIEVEMENTS, Achievement, getAchievementsWithProgress } from '../data/achievements';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayers?: Player[];
  activePlayerIndex?: number;
  gameMode?: GameMode;
  initialTab?: 'live' | 'alltime' | 'achievements';
  achievementsOnly?: boolean;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  activePlayers = [],
  activePlayerIndex = 0,
  gameMode,
  initialTab,
  achievementsOnly = false,
}) => {
  const {
    profiles,
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
  const [resetConfirmStep, setResetConfirmStep] = useState<boolean>(false);

  // Avatar Modal State for profiles
  const [avatarModalTarget, setAvatarModalTarget] = useState<{
    type: 'new' | 'edit';
    profileId?: string;
    currentAvatarId: string;
    profileName: string;
  } | null>(null);

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
    if (totalScore === 0) return { title: '😇 Monah Treaz', color: 'text-emerald-400', bg: 'bg-emerald-950/60' };
    if (totalScore <= 10) return { title: '🍺 Ucenic Vesel', color: 'text-yellow-400', bg: 'bg-yellow-950/60' };
    if (totalScore <= 25) return { title: '🥴 Frate Amețit', color: 'text-amber-400', bg: 'bg-amber-950/60' };
    if (totalScore <= 45) return { title: '😵 Călugăr Turmentat', color: 'text-orange-400', bg: 'bg-orange-950/60' };
    return { title: '👑 Arhimandritul Berii', color: 'text-red-400', bg: 'bg-red-950/60' };
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

  const handleResetStats = () => {
    if (!resetConfirmStep) {
      setResetConfirmStep(true);
      setTimeout(() => setResetConfirmStep(false), 4000);
    } else {
      resetAllStats();
      setResetConfirmStep(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-gradient-to-b from-[#1b1510] via-[#120e0a] to-[#0c0906] border-2 border-[#e8c84a] rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(232,200,74,0.25)] space-y-4">
        
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

                    return (
                      <div
                        key={prof.id}
                        className="p-3 rounded-2xl border border-[#2a2218] bg-[#120e0a] flex items-center justify-between font-barlow text-sm hover:border-[#e8c84a]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar with click-to-edit [+] box */}
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
                            className="w-11 h-11 rounded-xl bg-[#20170f] border-2 border-[#e8c84a]/60 hover:border-[#ffd700] relative flex-shrink-0 flex items-center justify-center overflow-hidden group shadow cursor-pointer transition-transform hover:scale-105"
                            title="Apasă pentru a schimba avatarul acestui profil"
                          >
                            <AvatarDisplay avatarId={avatarId} className="w-full h-full p-0.5" />
                            <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shadow border border-black group-hover:scale-110 transition-transform">
                              +
                            </div>
                          </button>

                          <div>
                            <div className="font-cinzel font-bold text-sm text-[#f0ebe0] flex items-center gap-2">
                              <span>{prof.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-cinzel font-bold ${drunkProf.bg} ${drunkProf.color}`}>
                                {drunkProf.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Jocuri: <b className="text-gray-300">{prof.gamesPlayed}</b> | 🍺 <b className="text-amber-300">{prof.totalSips}</b> guri | 🔥 <b className="text-red-400">{prof.totalChugs}</b> gropi | 💎 <b className="text-[#ffd700]">{prof.totalSips + 25 * prof.totalChugs} pt</b>
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
                    );
                  })
                )}
              </div>

              {/* Danger Zone: Reset All Stats */}
              {sortedProfiles.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleResetStats}
                    className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold border transition-colors ${
                      resetConfirmStep
                        ? 'bg-red-700 text-white border-red-500 animate-pulse'
                        : 'bg-transparent text-gray-500 border-gray-700 hover:text-red-400 hover:border-red-500'
                    }`}
                  >
                    {resetConfirmStep ? '⚠️ Ești sigur? Apasă din nou!' : '🗑️ Resetează All-Time Stats'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS PER PROFILE */}
          {activeTab === 'achievements' && (
            <div className="space-y-3.5">
              {/* Profile Selector Banner */}
              <div className="bg-[#120e0a] border border-[#2a2219] p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#20170f] border-2 border-[#ffd700] overflow-hidden flex-shrink-0">
                    <AvatarDisplay
                      avatarId={activeAchievementProfile?.avatarIcon || 'monk_drunk'}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 font-cinzel">Profil selectat:</div>
                    <select
                      value={activeAchievementProfile?.id || ''}
                      onChange={e => setSelectedProfileIdForAchievements(e.target.value)}
                      className="bg-[#1c150e] border border-[#3d2e1b] rounded-lg px-2 py-1 text-sm font-cinzel font-bold text-[#ffd700] focus:outline-none w-full"
                    >
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unlockedAchievements?.length || 0}/{ACHIEVEMENTS.length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unlocked Summary Badge */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-[#0a0704] px-3 py-1.5 rounded-xl border border-[#ffd700]/30">
                  <span className="text-xs font-barlow text-gray-400">Total deblocate:</span>
                  <span className="text-sm font-cinzel font-black text-[#ffd700] gold-text-glow">
                    🏆 {unlockedCount} / {ACHIEVEMENTS.length}
                  </span>
                </div>
              </div>

              {/* Rarity Filter Strip */}
              {(() => {
                const commonCount = ACHIEVEMENTS.filter(a => a.rarity === 'common').length;
                const rareCount = ACHIEVEMENTS.filter(a => a.rarity === 'rare').length;
                const legendaryCount = ACHIEVEMENTS.filter(a => a.rarity === 'legendary').length;

                return (
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
                );
              })()}

              {/* Achievements Grid */}
              <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                {filteredAchievements.map(ach => {
                  const isUnlocked = ach.unlocked;
                  const isLegendary = ach.rarity === 'legendary';
                  const isRare = ach.rarity === 'rare';

                  const rarityBadge = isLegendary
                    ? { label: '👑 LEGENDAR', style: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/60' }
                    : isRare
                    ? { label: '🥈 RAR', style: 'bg-sky-950/60 text-sky-300 border-sky-600/40' }
                    : { label: '🥉 COMUN', style: 'bg-amber-950/40 text-amber-300/80 border-amber-800/40' };

                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
                        isUnlocked
                          ? isLegendary
                            ? 'bg-gradient-to-r from-[#241a0b] via-[#1c1308] to-[#241a0b] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                            : 'bg-[#15100a] border-[#e8c84a]/60 shadow-md'
                          : 'bg-[#0e0a07]/80 border-[#221a12] opacity-75'
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
                                    : 'text-gray-400'
                                }`}
                              >
                                {language === 'ro' ? ach.titleRo : ach.titleEn}
                              </h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-cinzel font-black tracking-wider ${rarityBadge.style}`}>
                                {rarityBadge.label}
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

                          {/* Progress Bar if multi-tier or cumulative */}
                          {ach.target && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-barlow text-gray-400">
                                <span>Progres</span>
                                <span className="font-bold text-[#ffd700]">
                                  {ach.current} / {ach.target}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#090604] rounded-full overflow-hidden border border-[#2a2219]">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isUnlocked
                                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                      : 'bg-gradient-to-r from-amber-600 to-yellow-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, Math.round(((ach.current || 0) / ach.target) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
