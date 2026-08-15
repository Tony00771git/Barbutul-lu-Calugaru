import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import {
  fetchGlobalLeaderboard,
  fetchRecentDuelHistories,
  CloudLeaderboardEntry,
  CloudDuelHistory,
} from '../lib/firestoreService';

interface CloudAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudAccountModal: React.FC<CloudAccountModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    cloudProfile,
    signInWithGoogle,
    signOut,
    updateCloudProfile,
    loading: authLoading,
    isSigningIn,
    authError,
    clearAuthError,
  } = useAuth();
  const { profiles, t, language } = useApp();

  const [activeSubtab, setActiveSubtab] = useState<'profile' | 'leaderboard' | 'history'>('profile');
  const [leaderboard, setLeaderboard] = useState<CloudLeaderboardEntry[]>([]);
  const [history, setHistory] = useState<CloudDuelHistory[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (activeSubtab === 'leaderboard') {
      loadLeaderboard();
    } else if (activeSubtab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeSubtab]);

  const loadLeaderboard = async () => {
    setLoadingData(true);
    try {
      const data = await fetchGlobalLeaderboard();
      setLeaderboard(data);
    } catch (e) {
      console.error('Error loading leaderboard', e);
    } finally {
      setLoadingData(false);
    }
  };

  const loadHistory = async () => {
    setLoadingData(true);
    try {
      const data = await fetchRecentDuelHistories();
      setHistory(data);
    } catch (e) {
      console.error('Error loading duel history', e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSyncLocalStatsToCloud = async () => {
    if (!user) return;

    // Aggregate stats from local profiles
    const primaryLocal = profiles[0];
    const totalLocalSips = profiles.reduce((sum, p) => sum + (p.totalSips || 0), 0);
    const totalLocalChugs = profiles.reduce((sum, p) => sum + (p.totalChugs || 0), 0);
    const totalLocalGames = profiles.reduce((sum, p) => sum + (p.gamesPlayed || 0), 0);

    const mergedAchievements = Array.from(
      new Set(profiles.flatMap(p => p.unlockedAchievements || []))
    );

    try {
      await updateCloudProfile({
        displayName: user.displayName || primaryLocal?.name || 'Călugăr Pelerin',
        avatarIcon: primaryLocal?.avatarIcon || cloudProfile?.avatarIcon || 'monk_drunk',
        totalSips: Math.max(cloudProfile?.totalSips || 0, totalLocalSips),
        totalChugs: Math.max(cloudProfile?.totalChugs || 0, totalLocalChugs),
        gamesPlayed: Math.max(cloudProfile?.gamesPlayed || 0, totalLocalGames),
        unlockedAchievements: mergedAchievements.slice(0, 50),
      });

      setSyncSuccessMessage(
        language === 'ro' ? '✅ Profilul local a fost sincronizat cu succes în Cloud Firebase!' : '✅ Local stats synchronized with Firebase Cloud!'
      );
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Failed to sync to cloud', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-[#1c140d] via-[#120d08] to-[#0a0704] border-2 border-[#e8c84a] rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-[0_0_50px_rgba(232,200,74,0.25)] flex flex-col max-h-[90vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2e2216] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#2e1d0f] border border-[#ffd700] flex items-center justify-center text-xl shadow">
              🔥
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-cinzel font-bold text-[#ffd700] gold-text-glow flex items-center gap-2">
                <span>Firebase Cloud Tavern</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  Firestore
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-barlow">
                {user ? `Autentificat ca ${user.displayName || user.email}` : 'Conectează-te cu Google pentru salvare în Cloud'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a1e12] border border-gray-600 text-gray-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Subtab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0e0a06] p-1.5 rounded-2xl border border-[#2a2219]">
          <button
            onClick={() => setActiveSubtab('profile')}
            className={`py-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeSubtab === 'profile'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>👤</span>
            <span>Cont Cloud</span>
          </button>

          <button
            onClick={() => setActiveSubtab('leaderboard')}
            className={`py-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeSubtab === 'leaderboard'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🏆</span>
            <span>Top Global</span>
          </button>

          <button
            onClick={() => setActiveSubtab('history')}
            className={`py-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeSubtab === 'history'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>Cronică Dueluri</span>
          </button>
        </div>

        {/* Subtab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          {/* TAB 1: PROFILE & AUTH */}
          {activeSubtab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              {!user ? (
                <div className="bg-[#140e08] border border-[#2e2216] rounded-2xl p-5 text-center space-y-4">
                  <div className="text-4xl animate-bounce">🍺 ☁️</div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-cinzel font-bold text-[#ffd700]">
                      Conectare cu Google
                    </h3>
                    <p className="text-xs text-gray-300 font-barlow">
                      Salvează-ți gurile de băutură, gropile, victoriile la Duel și trofeele în baza de date securizată Firebase Firestore!
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-950/90 border border-red-500/80 rounded-xl text-left space-y-2 animate-shake">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-bold text-red-300">⚠️ Conectare Google</span>
                        <button
                          onClick={clearAuthError}
                          className="text-gray-400 hover:text-white text-xs font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-red-200 font-barlow">{authError}</p>
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-cinzel font-bold text-[#ffd700] hover:underline pt-1"
                      >
                        <span>🌐 Deschide jocul în Filă Nouă</span>
                        <span>➔</span>
                      </a>
                    </div>
                  )}

                  <button
                    onClick={signInWithGoogle}
                    disabled={authLoading || isSigningIn}
                    className="w-full py-3 px-4 rounded-2xl bg-white text-gray-900 font-cinzel font-bold text-xs sm:text-sm hover:bg-gray-100 active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                  >
                    {isSigningIn ? (
                      <>
                        <span className="text-lg animate-spin">⏳</span>
                        <span>Se deschide fereastra Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Conectează-te cu Google</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-barlow pt-1">
                    <span>* Nu este necesară parolă.</span>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#ffd700] hover:underline"
                    >
                      Deschide filă nouă ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* User Profile Card */}
                  <div className="bg-gradient-to-r from-[#20140a] via-[#160f08] to-[#20140a] border border-[#e8c84a]/60 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#2e1d0f] border-2 border-[#ffd700] overflow-hidden flex-shrink-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <AvatarDisplay avatarId={cloudProfile?.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-cinzel font-bold text-sm text-[#ffd700] gold-text-glow">
                            {cloudProfile?.displayName || user.displayName || 'Călugăr Pelerin'}
                          </h3>
                          <p className="text-xs text-gray-400 font-barlow">{user.email}</p>
                          <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-emerald-400 font-cinzel">
                            <span>●</span> Sincronizat Firebase
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={signOut}
                        className="py-1.5 px-3 rounded-xl bg-[#2a180e] border border-red-500/40 text-red-400 hover:bg-red-950/40 font-cinzel text-xs transition-all"
                      >
                        Deconectare
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#2e2216] text-center">
                      <div className="bg-[#120c06] p-2 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-400 font-cinzel">🍺 Guri</div>
                        <div className="font-bebas text-lg text-yellow-400 font-bold">{cloudProfile?.totalSips || 0}</div>
                      </div>
                      <div className="bg-[#120c06] p-2 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-400 font-cinzel">🕳️ Gropi</div>
                        <div className="font-bebas text-lg text-orange-400 font-bold">{cloudProfile?.totalChugs || 0}</div>
                      </div>
                      <div className="bg-[#120c06] p-2 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-400 font-cinzel">⚔️ Dueluri</div>
                        <div className="font-bebas text-lg text-blue-400 font-bold">{cloudProfile?.duelWins || 0}</div>
                      </div>
                      <div className="bg-[#120c06] p-2 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-400 font-cinzel">🏅 Trofee</div>
                        <div className="font-bebas text-lg text-emerald-400 font-bold">{cloudProfile?.unlockedAchievements?.length || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sync Action */}
                  <div className="bg-[#140e08] border border-[#2e2216] rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-cinzel font-bold text-gray-200">
                        🔄 Sincronizează Datele Locale în Cloud
                      </div>
                      <span className="text-[10px] text-gray-400">({profiles.length} profiluri locale)</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-barlow">
                      Dacă ai jucat local sau ai acumulat trofee noi pe acest dispozitiv, apasă mai jos pentru a le urca pe serverul Firebase.
                    </p>

                    {syncSuccessMessage && (
                      <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cinzel font-bold text-center animate-fade-in">
                        {syncSuccessMessage}
                      </div>
                    )}

                    <button
                      onClick={handleSyncLocalStatsToCloud}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black font-cinzel font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow"
                    >
                      ☁️ Sincronizează Acum în Firebase
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GLOBAL LEADERBOARD */}
          {activeSubtab === 'leaderboard' && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between pb-1 text-xs text-gray-400 font-cinzel">
                <span>Top 25 Călugări ai Tavernei (Global)</span>
                <button
                  onClick={loadLeaderboard}
                  disabled={loadingData}
                  className="text-[11px] text-[#ffd700] hover:underline flex items-center gap-1"
                >
                  <span>🔄</span> {loadingData ? 'Se încarcă...' : 'Reîmprospătează'}
                </button>
              </div>

              {loadingData ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-3xl animate-spin">⏳</div>
                  <div className="text-xs font-cinzel text-gray-400">Se descarcă clasamentul din Firestore...</div>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 space-y-2 bg-[#140e08] rounded-2xl border border-[#2e2216] p-4">
                  <div className="text-3xl">🍺</div>
                  <p className="text-xs font-cinzel text-gray-400">
                    Fii primul călugăr din clasamentul global!
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Autentifică-te cu Google și sincronizează scorul pentru a apărea în top.
                  </p>
                </div>
              ) : (
                leaderboard.map((item, idx) => {
                  const isMe = user?.uid === item.userId;
                  const rankBadge = idx === 0 ? '👑 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`;

                  return (
                    <div
                      key={item.userId || idx}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                        isMe
                          ? 'bg-gradient-to-r from-[#2e1f13] via-[#22170e] to-[#2e1f13] border-[#ffd700] shadow-md'
                          : 'bg-[#140e08] border-[#2c2218]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl font-cinzel font-black text-xs flex items-center justify-center flex-shrink-0 ${
                            idx === 0
                              ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow'
                              : idx === 1
                              ? 'bg-slate-300 text-black'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-black/60 text-gray-400 border border-white/10'
                          }`}
                        >
                          {rankBadge}
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-[#22180f] border border-[#e8c84a]/50 flex-shrink-0 overflow-hidden">
                          <AvatarDisplay avatarId={item.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                        </div>

                        <div>
                          <div className="font-cinzel font-bold text-xs text-gray-200 flex items-center gap-1.5">
                            <span>{item.displayName}</span>
                            {isMe && (
                              <span className="text-[9px] bg-[#ffd700] text-black font-black px-1.5 py-0.2 rounded-full">
                                TU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-barlow">
                            {item.duelWins || 0} victorii duel
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bebas text-base text-[#ffd700] leading-none">
                          {item.totalSips} <span className="text-[10px] text-gray-400 font-cinzel">Guri</span>
                        </div>
                        <div className="text-[10px] text-orange-400 font-bebas">
                          {item.totalChugs} <span className="text-[9px] text-gray-400 font-cinzel">Gropi</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: DUEL CHRONICLES HISTORY */}
          {activeSubtab === 'history' && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between pb-1 text-xs text-gray-400 font-cinzel">
                <span>Ultimele Dueluri Tavernă (Live Firestore)</span>
                <button
                  onClick={loadHistory}
                  disabled={loadingData}
                  className="text-[11px] text-[#ffd700] hover:underline flex items-center gap-1"
                >
                  <span>🔄</span> {loadingData ? 'Se încarcă...' : 'Reîmprospătează'}
                </button>
              </div>

              {loadingData ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-3xl animate-spin">⏳</div>
                  <div className="text-xs font-cinzel text-gray-400">Se descarcă istoricul din Firestore...</div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 space-y-2 bg-[#140e08] rounded-2xl border border-[#2e2216] p-4">
                  <div className="text-3xl">⚔️</div>
                  <p className="text-xs font-cinzel text-gray-400">
                    Niciun duel înregistrat recent în baza de date.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Pornește un meci 1v1 online pentru a-ți scrie numele în cronică!
                  </p>
                </div>
              ) : (
                history.map((m, idx) => (
                  <div
                    key={m.matchId || idx}
                    className="bg-[#140e08] border border-[#2c2218] rounded-2xl p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-cinzel font-bold text-gray-300 flex items-center gap-1.5">
                        <span>⚔️ {m.hostPlayerName}</span>
                        <span className="text-gray-500 text-[10px]">vs</span>
                        <span>{m.guestPlayerName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#24180d] border border-[#e8c84a]/30 text-[#ffd700] font-cinzel">
                        {m.submode === 'football' ? '⚽ Fotbal' : '🧠 General'} • {m.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-barlow text-gray-400 pt-1 border-t border-white/5">
                      <div>
                        🏆 Câștigător:{' '}
                        <span className="font-bold text-emerald-400">
                          {m.winnerName || 'Remiză / Amândoi au băut'}
                        </span>
                      </div>
                      <div>{m.roundsTotal} runde</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#2e2216] flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-[#2a1e12] border border-gray-600 text-xs font-cinzel text-gray-300 hover:text-white"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};
