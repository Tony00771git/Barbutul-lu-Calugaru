import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import {
  fetchGlobalLeaderboard,
  CloudLeaderboardEntry,
  syncAccountProfilesToCloud,
  resetGlobalLeaderboard,
} from '../lib/firestoreService';

type LeaderboardCategory = 'monopoly' | 'duel' | 'casino' | 'totalScore';

interface GlobalLeaderboardSectionProps {
  className?: string;
  onOpenCloudModal?: () => void;
  isFullView?: boolean;
}

export const GlobalLeaderboardSection: React.FC<GlobalLeaderboardSectionProps> = ({
  className = '',
  onOpenCloudModal,
  isFullView = true,
}) => {
  const { user } = useAuth();
  const { profiles, language, resetAllStats } = useApp();
  const { resetCloudAccount } = useAuth();

  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('totalScore');
  const [leaderboard, setLeaderboard] = useState<CloudLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalLeaderboard();
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const handleSync = async () => {
    if (!user) {
      if (onOpenCloudModal) onOpenCloudModal();
      return;
    }
    setIsSyncing(true);
    try {
      await syncAccountProfilesToCloud(profiles);
      setSyncNotice(language === 'ro' ? '✅ Subprofiluri sincronizate!' : '✅ Sub-profiles synced!');
      await loadLeaderboardData();
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (e) {
      console.error(e);
      setSyncNotice(language === 'ro' ? '❌ Eroare sync' : '❌ Sync error');
      setTimeout(() => setSyncNotice(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    try {
      await resetAllStats();
      await resetGlobalLeaderboard(user ? profiles : undefined);
      setSyncNotice(language === 'ro' ? '🧹 Clasament & profiluri resetate la 0!' : '🧹 Leaderboard & profiles reset to 0!');
      await loadLeaderboardData();
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (e) {
      console.error(e);
      setSyncNotice(language === 'ro' ? '❌ Eroare resetare' : '❌ Reset error');
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setIsResetting(false);
    }
  };

  // Sort entries based on category and ensure strictly subprofiles
  const sortedEntries = [...leaderboard]
    .filter(entry => entry.profileId && entry.profileId !== entry.userId)
    .sort((a, b) => {
      if (activeCategory === 'monopoly') {
        const winsA = a.winsBoardgame || 0;
        const winsB = b.winsBoardgame || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (activeCategory === 'duel') {
        const winsA = a.winsDuel || (a.duelWins || 0);
        const winsB = b.winsDuel || (b.duelWins || 0);
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (activeCategory === 'casino') {
        const winsA = a.winsCasino || 0;
        const winsB = b.winsCasino || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      // 'totalScore' (sips + chugs * 25)
      const scoreA = a.totalScore ?? (a.totalSips + 25 * a.totalChugs);
      const scoreB = b.totalScore ?? (b.totalSips + 25 * b.totalChugs);
      return scoreB - scoreA;
    });

  // Filter with search term
  const filteredEntries = sortedEntries.filter((entry) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.displayName.toLowerCase().includes(term) ||
      (entry.accountName && entry.accountName.toLowerCase().includes(term))
    );
  });

  const top3 = filteredEntries.slice(0, 3);
  const remaining = filteredEntries.slice(3);

  const getCategoryStatDisplay = (entry: CloudLeaderboardEntry) => {
    switch (activeCategory) {
      case 'monopoly':
        return {
          primary: `${entry.winsBoardgame || 0} ${language === 'ro' ? 'victorii' : 'wins'}`,
          secondary: `Scor: ${entry.totalScore || (entry.totalSips + 25 * entry.totalChugs)}`,
          badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        };
      case 'duel':
        return {
          primary: `${entry.winsDuel || entry.duelWins || 0} ${language === 'ro' ? 'victorii' : 'wins'}`,
          secondary: `${language === 'ro' ? 'Jucate' : 'Played'}: ${entry.gamesPlayed || 0}`,
          badgeBg: 'bg-red-950/80 text-red-300 border-red-500/40',
        };
      case 'casino':
        return {
          primary: `${entry.winsCasino || 0} ${language === 'ro' ? 'victorii' : 'wins'}`,
          secondary: `${language === 'ro' ? 'Jocuri' : 'Games'}: ${entry.gamesPlayed || 0}`,
          badgeBg: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40',
        };
      case 'totalScore':
      default: {
        const score = entry.totalScore ?? (entry.totalSips + 25 * entry.totalChugs);
        return {
          primary: `${score} pct`,
          secondary: `🍺 ${entry.totalSips} | 🕳️ ${entry.totalChugs}`,
          badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        };
      }
    }
  };

  return (
    <div className={`w-full bg-gradient-to-b from-[#18120a]/95 via-[#120d08]/95 to-[#0d0905]/95 border border-[#e8c84a]/50 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md space-y-3 ${className}`}>
      {/* Leaderboard Header with Refresh & Cloud Sync */}
      <div className="flex items-center justify-between border-b border-[#2d2114] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2b1c0e] border border-[#e8c84a] flex items-center justify-center text-sm shadow">
            🏆
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] gold-text-glow leading-tight">
              {language === 'ro' ? 'Clasament Mondial' : 'Global Leaderboard'}
            </h3>
            <span className="text-[10px] text-gray-400 font-barlow">
              {language === 'ro' ? 'Top călugări și profiluri' : 'Rankings per Google profile'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {syncNotice && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-fade-in">
              {syncNotice}
            </span>
          )}

          {user ? (
            <>
              <button
                onClick={handleSync}
                disabled={isSyncing || isResetting}
                className="py-1 px-2 rounded-lg bg-[#1e2e1c] border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 text-[11px] font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 shadow"
                title={language === 'ro' ? 'Sincronizează doar subprofilurile mele' : 'Sync my sub-profiles'}
              >
                <span>{isSyncing ? '⏳' : '⚡'}</span>
                <span>Sync</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isSyncing || isResetting}
                className="py-1 px-2 rounded-lg bg-[#2a1010] border border-red-500/40 text-red-300 hover:bg-red-900/50 text-[11px] font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 shadow"
                title={language === 'ro' ? 'Resetează și curăță clasamentul mondial' : 'Reset global leaderboard'}
              >
                <span>{isResetting ? '⏳' : '🧹'}</span>
                <span>{language === 'ro' ? 'Reset' : 'Reset'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenCloudModal}
              className="py-1 px-2 rounded-lg bg-[#2e1d0e] border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#3d2713] text-[11px] font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 shadow"
            >
              <span>☁️</span>
              <span>Login</span>
            </button>
          )}

          <button
            onClick={loadLeaderboardData}
            disabled={loading || isResetting}
            className="p-1.5 rounded-lg bg-[#1c140c] border border-[#3d2d1c] hover:border-[#e8c84a] text-gray-300 hover:text-[#ffd700] text-xs transition-all active:scale-95"
            title={language === 'ro' ? 'Reîmprospătează clasamentul' : 'Refresh leaderboard'}
          >
            <span className={loading || isResetting ? 'inline-block animate-spin' : ''}>🔄</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="bg-[#1e0a0a] border border-red-500/60 rounded-xl p-3 text-center space-y-2 animate-fade-in shadow-2xl">
          <p className="text-xs font-cinzel font-bold text-red-200">
            {language === 'ro'
              ? '🧹 Sigur vrei să resetezi clasamentul global?'
              : '🧹 Are you sure you want to reset the global leaderboard?'}
          </p>
          <p className="text-[10px] text-gray-300 font-barlow">
            {language === 'ro'
              ? 'Se vor șterge intrările agregate vechi și se vor re-înscrie doar subprofilurile tale individuale!'
              : 'Legacy master entries will be wiped, leaving only distinct individual sub-profiles!'}
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white font-cinzel font-bold text-xs rounded-lg shadow active:scale-95"
            >
              {language === 'ro' ? 'Da, Resetează' : 'Yes, Reset'}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1 bg-[#2b241c] hover:bg-[#3d3328] text-gray-300 font-cinzel font-bold text-xs rounded-lg active:scale-95"
            >
              {language === 'ro' ? 'Anulează' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* 4 Category Tabs Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#0b0805] p-1 rounded-xl border border-[#261c11]">
        <button
          onClick={() => setActiveCategory('monopoly')}
          className={`py-1.5 px-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center justify-center gap-1 transition-all truncate ${
            activeCategory === 'monopoly'
              ? 'bg-gradient-to-r from-[#8a5d17] to-[#b3822b] text-white shadow-md border border-[#ffd700]/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-sm">🏰</span>
          <span className="truncate">{language === 'ro' ? 'Monopoly' : 'Boardgame'}</span>
        </button>

        <button
          onClick={() => setActiveCategory('duel')}
          className={`py-1.5 px-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center justify-center gap-1 transition-all truncate ${
            activeCategory === 'duel'
              ? 'bg-gradient-to-r from-[#8a2417] to-[#bd3828] text-white shadow-md border border-[#ff7b6b]/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-sm">⚔️</span>
          <span className="truncate">Duel 1v1</span>
        </button>

        <button
          onClick={() => setActiveCategory('casino')}
          className={`py-1.5 px-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center justify-center gap-1 transition-all truncate ${
            activeCategory === 'casino'
              ? 'bg-gradient-to-r from-[#8a6817] to-[#c79d28] text-black font-black shadow-md border border-[#ffd700]/70'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-sm">🎲</span>
          <span className="truncate">Casino</span>
        </button>

        <button
          onClick={() => setActiveCategory('totalScore')}
          className={`py-1.5 px-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center justify-center gap-1 transition-all truncate ${
            activeCategory === 'totalScore'
              ? 'bg-gradient-to-r from-[#4b1d6d] to-[#782cb0] text-white shadow-md border border-[#ba6bf0]/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-sm">🔥</span>
          <span className="truncate">{language === 'ro' ? 'Scor Total' : 'Total Score'}</span>
        </button>
      </div>

      {/* Optional Search / Filter Bar */}
      {leaderboard.length > 5 && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ro' ? '🔍 Caută profil sau călugăr...' : '🔍 Search monk or profile...'}
            className="w-full bg-[#0d0a06] border border-[#2a1e12] focus:border-[#e8c84a]/70 rounded-xl px-3 py-1.5 text-xs text-[#f0ebe0] placeholder-gray-500 focus:outline-none font-barlow"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1.5 text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-2xl animate-spin">🪙</span>
          <p className="text-xs text-gray-400 font-cinzel">
            {language === 'ro' ? 'Se descarcă clasamentul mondial...' : 'Loading global rankings...'}
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-6 px-3 bg-[#0d0905] border border-[#2a1d12] rounded-xl text-center space-y-2">
          <span className="text-2xl">📜</span>
          <p className="text-xs font-cinzel text-[#ffd700]">
            {language === 'ro' ? 'Niciun profil găsit pe acest clasament încă.' : 'No ranked entries found yet.'}
          </p>
          <p className="text-[11px] text-gray-400 font-barlow">
            {language === 'ro'
              ? 'Joacă o sesiune sau conectează-te cu Google pentru a-ți înregistra scorul mondial!'
              : 'Play a game or sign in with Google to record your global score!'}
          </p>
          {user && (
            <button
              onClick={handleSync}
              className="mt-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black text-xs font-cinzel font-bold shadow"
            >
              {language === 'ro' ? '⚡ Înscrie Profilurile Mele' : '⚡ Submit My Profiles'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Top 3 Podium Highlights */}
          {top3.length > 0 && !searchTerm && (
            <div className="grid grid-cols-3 gap-1.5 pt-1 items-end">
              {/* Silver (#2) */}
              {top3[1] ? (
                <div className="bg-gradient-to-b from-[#222428] to-[#121316] border border-gray-400/50 rounded-xl p-2 flex flex-col items-center text-center relative shadow-md">
                  <span className="absolute -top-2 bg-[#222428] border border-gray-400 rounded-full px-1.5 py-0.2 text-[10px] font-bold text-gray-300">
                    🥈 #2
                  </span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-[#0d0d0f] border border-gray-400/40 mt-1 mb-1 shadow">
                    <AvatarDisplay avatarId={top3[1].avatarIcon || 'monk_drunk'} className="w-full h-full" />
                  </div>
                  <div className="font-cinzel font-bold text-[11px] text-gray-200 truncate w-full">
                    {top3[1].displayName}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 truncate w-full">
                    {getCategoryStatDisplay(top3[1]).primary}
                  </div>
                </div>
              ) : (
                <div className="opacity-0" />
              )}

              {/* Gold (#1) */}
              {top3[0] && (
                <div className="bg-gradient-to-b from-[#3a280e] via-[#241908] to-[#140d05] border-2 border-[#ffd700] rounded-xl p-2.5 flex flex-col items-center text-center relative shadow-[0_0_15px_rgba(255,215,0,0.25)] scale-[1.03] z-10">
                  <span className="absolute -top-2.5 bg-[#ffd700] text-black rounded-full px-2 py-0.2 text-[10px] font-black shadow">
                    🥇 #1
                  </span>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#0d0a06] border-2 border-[#ffd700] mt-1 mb-1 shadow">
                    <AvatarDisplay avatarId={top3[0].avatarIcon || 'monk_drunk'} className="w-full h-full" />
                  </div>
                  <div className="font-cinzel font-bold text-xs text-[#ffd700] truncate w-full">
                    {top3[0].displayName}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-[#fce881] truncate w-full">
                    {getCategoryStatDisplay(top3[0]).primary}
                  </div>
                </div>
              )}

              {/* Bronze (#3) */}
              {top3[2] ? (
                <div className="bg-gradient-to-b from-[#2a170b] to-[#140b05] border border-amber-700/60 rounded-xl p-2 flex flex-col items-center text-center relative shadow-md">
                  <span className="absolute -top-2 bg-[#2a170b] border border-amber-600 rounded-full px-1.5 py-0.2 text-[10px] font-bold text-amber-400">
                    🥉 #3
                  </span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-[#0d0703] border border-amber-700/40 mt-1 mb-1 shadow">
                    <AvatarDisplay avatarId={top3[2].avatarIcon || 'monk_drunk'} className="w-full h-full" />
                  </div>
                  <div className="font-cinzel font-bold text-[11px] text-amber-200 truncate w-full">
                    {top3[2].displayName}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 truncate w-full">
                    {getCategoryStatDisplay(top3[2]).primary}
                  </div>
                </div>
              ) : (
                <div className="opacity-0" />
              )}
            </div>
          )}

          {/* Compact Scrollable List for the Remaining Entries (or all filtered) */}
          <div className={`${isFullView ? 'max-h-72 sm:max-h-80' : 'max-h-52'} overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar`}>
            {(searchTerm ? filteredEntries : remaining).map((entry, index) => {
              const rank = searchTerm ? index + 1 : index + 4;
              const isMyProfile = user && entry.userId === user.uid;
              const stat = getCategoryStatDisplay(entry);

              return (
                <div
                  key={entry.id || `${entry.userId}_${entry.profileId}_${rank}`}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all text-xs ${
                    isMyProfile
                      ? 'bg-gradient-to-r from-[#241a0b] via-[#1a140b] to-[#241a0b] border-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.15)]'
                      : 'bg-[#100c08] border-[#22180e] hover:border-[#3d2b1a]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bebas text-sm sm:text-base text-gray-400 w-5 text-center flex-shrink-0">
                      #{rank}
                    </span>

                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-[#080604] border border-[#e8c84a]/30">
                      <AvatarDisplay avatarId={entry.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-cinzel font-bold text-xs text-[#f0ebe0] truncate">
                          {entry.displayName}
                        </span>
                        {isMyProfile && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffd700]/20 text-[#ffd700] font-cinzel font-bold border border-[#ffd700]/40 flex-shrink-0">
                            {language === 'ro' ? 'Tu' : 'You'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-barlow truncate">
                        {entry.accountName ? `👤 ${entry.accountName}` : stat.secondary}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 pl-1.5">
                    <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${stat.badgeBg}`}>
                      {stat.primary}
                    </span>
                    <span className="text-[9px] text-gray-500 font-barlow mt-0.5">
                      {stat.secondary}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
