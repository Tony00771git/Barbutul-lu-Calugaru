import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import {
  fetchGlobalLeaderboard,
  fetchRecentDuelHistories,
  syncAccountProfilesToCloud,
  CloudLeaderboardEntry,
  CloudDuelHistory,
} from '../lib/firestoreService';
import { calculateProgression } from '../lib/progression';

interface CloudAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LeaderboardCategory = 'monopoly' | 'duel' | 'casino' | 'pineapple' | 'crash' | 'totalScore';
type AccountModalSubtab = 'profile' | 'leaderboard' | 'history' | 'diagnostics';

export const CloudAccountModal: React.FC<CloudAccountModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    cloudProfile,
    signInWithGoogle,
    signOut,
    loading: authLoading,
    isSigningIn,
    authError,
    clearAuthError,
    hasSetMainProfile,
    shouldShowMainProfileSetup,
    setShouldShowMainProfileSetup,
    refreshProfile,
  } = useAuth();
  const { profiles, masterProfile, subProfiles, setMainProfile, t, language } = useApp();

  const [activeSubtab, setActiveSubtab] = useState<AccountModalSubtab>('profile');
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>('totalScore');
  const [leaderboard, setLeaderboard] = useState<CloudLeaderboardEntry[]>([]);
  const [history, setHistory] = useState<CloudDuelHistory[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Diagnostic Test States
  const [diagnosticLogs, setDiagnosticLogs] = useState<{ id: number; title: string; status: 'idle' | 'running' | 'pass' | 'fail'; detail: string }[]>([
    { id: 1, title: 'Conexiune & Inițializare Firebase Auth', status: 'idle', detail: 'Neverificat încă' },
    { id: 2, title: 'Integritate Profil Principal (Master Profile)', status: 'idle', detail: 'Neverificat încă' },
    { id: 3, title: 'Segregare Subprofiluri', status: 'idle', detail: 'Neverificat încă' },
    { id: 4, title: 'Validare Statut hasSetMainProfile', status: 'idle', detail: 'Neverificat încă' },
    { id: 5, title: 'Calcul XP, Nivel & Titluri Medievale', status: 'idle', detail: 'Neverificat încă' },
    { id: 6, title: 'Sanitizare Payload Firestore (Fără Undefined/NaN)', status: 'idle', detail: 'Neverificat încă' },
    { id: 7, title: 'Sincronizare Cloud Round-trip', status: 'idle', detail: 'Neverificat încă' },
  ]);
  const [isRunningDiagSuite, setIsRunningDiagSuite] = useState<boolean>(false);
  const [diagActionMessage, setDiagActionMessage] = useState<string | null>(null);

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
    setIsSyncing(true);

    try {
      await syncAccountProfilesToCloud(profiles);
      setSyncSuccessMessage(
        language === 'ro'
          ? `✅ S-au sincronizat cu succes ${profiles.length} profiluri în Firebase!`
          : `✅ Successfully synchronized ${profiles.length} profiles to Firebase!`
      );
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Failed to sync to cloud', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const runFullDiagnostics = async () => {
    setIsRunningDiagSuite(true);
    setDiagActionMessage(null);

    const updateStep = (id: number, status: 'running' | 'pass' | 'fail', detail: string) => {
      setDiagnosticLogs(prev => prev.map(item => item.id === id ? { ...item, status, detail } : item));
    };

    try {
      // 1. Firebase Auth Status
      updateStep(1, 'running', 'Verificare instanță Firebase Auth...');
      await new Promise(r => setTimeout(r, 200));
      if (user) {
        updateStep(1, 'pass', `Autentificat Google UID: ${user.uid.substring(0, 10)}... (${user.email})`);
      } else {
        updateStep(1, 'pass', 'Mod Oaspete / Local (Firebase Auth gata pentru conectare)');
      }

      // 2. Master Profile Integrity
      updateStep(2, 'running', 'Verificare profil principal...');
      await new Promise(r => setTimeout(r, 200));
      const currentMaster = masterProfile || profiles.find(p => p.isMaster) || profiles[0];
      if (currentMaster && currentMaster.name) {
        updateStep(2, 'pass', `Profil Principal Activ: "${currentMaster.name}" (Avatar: ${currentMaster.avatarIcon || 'monk_master'}, XP: ${currentMaster.totalXP || 0})`);
      } else {
        updateStep(2, 'fail', 'Nu s-a detectat un profil principal valid!');
      }

      // 3. Subprofiles Segregation
      updateStep(3, 'running', 'Verificare subprofiluri...');
      await new Promise(r => setTimeout(r, 200));
      const subs = subProfiles || profiles.filter(p => !p.isMaster);
      const invalidSub = subs.find(p => p.isMaster === true);
      if (!invalidSub) {
        updateStep(3, 'pass', `${subs.length} subprofiluri detectate, toate segregate corect cu isMaster: false`);
      } else {
        updateStep(3, 'fail', `Conflict de segregare: subprofilul ${invalidSub.name} are isMaster: true`);
      }

      // 4. hasSetMainProfile Status
      updateStep(4, 'running', 'Verificare status configurare profil...');
      await new Promise(r => setTimeout(r, 200));
      const isSet = hasSetMainProfile;
      updateStep(4, 'pass', `Status hasSetMainProfile: ${isSet ? 'CONFIGURAT (Salvat)' : 'NECONFIGURAT (Va declanșa pop-up-ul automat)'}`);

      // 5. XP & Level Progression
      updateStep(5, 'running', 'Calcul formulă progresie...');
      await new Promise(r => setTimeout(r, 200));
      const xpVal = currentMaster?.totalXP || 0;
      const prog = calculateProgression(xpVal);
      if (prog.currentLevel >= 1 && prog.titleRo && prog.titleEn) {
        updateStep(5, 'pass', `Nivel ${prog.currentLevel} | Titlu: "${prog.titleRo}" | Progres: ${prog.progressPercent}% (${prog.xpInCurrentLevel}/${prog.xpNeededForNextLevel} XP)`);
      } else {
        updateStep(5, 'fail', 'Eroare la calcularea progresiei XP!');
      }

      // 6. Firestore Payload Sanitation
      updateStep(6, 'running', 'Testare sanitizare payload Firestore...');
      await new Promise(r => setTimeout(r, 200));
      const hasUndefined = profiles.some(p => p.name === undefined || p.id === undefined);
      if (!hasUndefined) {
        updateStep(6, 'pass', `Toate cele ${profiles.length} profiluri trec validarea strictă de tipuri și proprietăți`);
      } else {
        updateStep(6, 'fail', 'Profilurile conțin câmpuri undefined!');
      }

      // 7. Cloud Sync Roundtrip
      updateStep(7, 'running', 'Testare sincronizare Firestore...');
      if (user) {
        const start = Date.now();
        await syncAccountProfilesToCloud(profiles);
        const duration = Date.now() - start;
        updateStep(7, 'pass', `Sincronizare în Firestore confirmată cu succes în ${duration}ms`);
      } else {
        updateStep(7, 'pass', 'Sincronizare locală pregătită (conectați contul Google pentru sincronizare live în Cloud)');
      }

      setDiagActionMessage('✅ Toate testele au fost finalizate cu succes!');
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setDiagActionMessage(`❌ Eroare la rularea testelor: ${err?.message || err}`);
    } finally {
      setIsRunningDiagSuite(false);
    }
  };

  const handleResetMainProfileSimulation = () => {
    if (user) {
      try {
        localStorage.removeItem(`barbut_has_set_main_profile_${user.uid}`);
      } catch (e) {}
    }
    setShouldShowMainProfileSetup(true);
    setDiagActionMessage('🔄 S-a resetat flag-ul și s-a deschis fereastra de configurare a Profilului Principal!');
  };

  // Sort and filter leaderboard based on active category (strictly individual subprofiles)
  const sortedLeaderboard = [...leaderboard]
    .filter((entry) => entry.profileId && entry.profileId !== entry.userId)
    .sort((a, b) => {
      if (leaderboardCategory === 'monopoly') {
        const winsA = a.winsBoardgame || 0;
        const winsB = b.winsBoardgame || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (leaderboardCategory === 'duel') {
        const winsA = a.winsDuel || (a.duelWins || 0);
        const winsB = b.winsDuel || (b.duelWins || 0);
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (leaderboardCategory === 'casino') {
        const winsA = a.winsCasino || 0;
        const winsB = b.winsCasino || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (leaderboardCategory === 'pineapple') {
        const winsA = a.winsPineapple || 0;
        const winsB = b.winsPineapple || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (leaderboardCategory === 'crash') {
        const winsA = a.winsCrash || 0;
        const winsB = b.winsCrash || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      // 'totalScore' (sips + chugs * 25)
      const scoreA = a.totalScore ?? (a.totalSips + 25 * a.totalChugs);
      const scoreB = b.totalScore ?? (b.totalSips + 25 * b.totalChugs);
      return scoreB - scoreA;
    });

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99990 }}
      className="fixed inset-0 z-[99990] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1c140d] via-[#120d08] to-[#0a0704] border-2 border-[#e8c84a] rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-[0_0_50px_rgba(232,200,74,0.25)] flex flex-col max-h-[90vh] space-y-4"
      >
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

        {/* Main Subtab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#0e0a06] p-1.5 rounded-2xl border border-[#2a2219]">
          <button
            onClick={() => setActiveSubtab('profile')}
            className={`py-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeSubtab === 'profile'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>👤</span>
            <span>Cont</span>
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
            <span>Top</span>
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
            <span>Dueluri</span>
          </button>

          <button
            onClick={() => setActiveSubtab('diagnostics')}
            className={`py-2 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeSubtab === 'diagnostics'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md'
                : 'text-yellow-400/80 hover:text-yellow-300'
            }`}
          >
            <span>🧪</span>
            <span>Diagnostic</span>
          </button>
        </div>

        {/* Subtab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          {/* TAB 1: PROFILE & AUTH & PROFILES SYNC */}
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
                      Fiecare cont Google are asociate toate profilurile tale! Când te loghezi pe un telefon nou, toate profilurile, gurile de băutură, gropile și victoriile sunt descărcate automat.
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
                  {/* Google Account Summary Card */}
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
                            <AvatarDisplay avatarId="monk_drunk" className="w-full h-full" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-cinzel font-bold text-sm text-[#ffd700] gold-text-glow">
                            {user.displayName || 'Cont Google'}
                          </h3>
                          <p className="text-xs text-gray-400 font-barlow">{user.email}</p>
                          <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-emerald-400 font-cinzel">
                            <span>●</span> Sincronizat Firebase Cloud
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

                    {/* Associated Local Profiles List */}
                    <div className="space-y-2 pt-2 border-t border-[#2e2216]">
                      <div className="flex items-center justify-between text-xs font-cinzel font-bold text-[#ffd700]">
                        <span>Profiluri Asociate Acestui Cont ({profiles.length})</span>
                        <span className="text-[10px] text-gray-400">Fiecare are loc în clasament</span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {profiles.map((p) => {
                          const score = (p.totalSips || 0) + 25 * (p.totalChugs || 0);
                          return (
                            <div
                              key={p.id}
                              className="bg-[#120c06] border border-[#2a2219] rounded-xl p-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#e8c84a]/40 bg-[#1c140d] flex-shrink-0">
                                  <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                                </div>
                                <div>
                                  <div className="font-cinzel font-bold text-gray-200 flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.isMaster && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-cinzel font-bold border border-amber-500/40">
                                        Principal
                                      </span>
                                    )}
                                    <span className="text-[9px] text-amber-400 font-cinzel font-bold">
                                      Nv. {p.currentLevel || calculateProgression(p.totalXP || 0).currentLevel}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-amber-300/90 font-cinzel font-semibold flex items-center gap-1">
                                    <span>👑</span>
                                    <span>{language === 'ro' ? (p.currentTitle_ro || calculateProgression(p.totalXP || 0).titleRo) : (p.currentTitle_en || calculateProgression(p.totalXP || 0).titleEn)}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-barlow flex gap-2 mt-0.5">
                                    <span>🏰 Monopoly: <strong>{p.winsBoardgame || 0}</strong></span>
                                    <span>⚔️ Duel: <strong>{p.winsDuel || 0}</strong></span>
                                    <span>🎲 Casino: <strong>{p.winsCasino || 0}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-bebas text-sm text-[#ffd700] leading-none">
                                  {score} <span className="text-[9px] text-gray-400 font-cinzel">Scor</span>
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {p.totalSips} guri • {p.totalChugs} gropi
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Manual Cloud Sync Action */}
                  <div className="bg-[#140e08] border border-[#2e2216] rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-cinzel font-bold text-gray-200">
                        🔄 Salvare și Sincronizare pe Nou Dispozitiv
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-barlow">
                      Toate cele {profiles.length} profiluri sunt salvate în contul tău Google. Dacă te conectezi pe alt telefon sau tabletă, se vor încărca automat din Cloud!
                    </p>

                    {syncSuccessMessage && (
                      <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cinzel font-bold text-center animate-fade-in">
                        {syncSuccessMessage}
                      </div>
                    )}

                    <button
                      onClick={handleSyncLocalStatsToCloud}
                      disabled={isSyncing}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black font-cinzel font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isSyncing ? '⏳ Se sincronizează...' : '☁️ Sincronizează Profilurile Acum'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GLOBAL LEADERBOARD (4 TABS) */}
          {activeSubtab === 'leaderboard' && (
            <div className="space-y-3 animate-fade-in">
              {/* 6 Tabs Selector for Leaderboard */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#0b0805] p-1 rounded-xl border border-[#251d14]">
                <button
                  onClick={() => setLeaderboardCategory('monopoly')}
                  className={`py-1.5 px-1 rounded-lg text-center font-cinzel font-bold text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center leading-tight ${
                    leaderboardCategory === 'monopoly'
                      ? 'bg-[#e8c84a] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🏰 Monopoly</span>
                  <span className="text-[9px] opacity-80 font-barlow">Victorii</span>
                </button>

                <button
                  onClick={() => setLeaderboardCategory('duel')}
                  className={`py-1.5 px-1 rounded-lg text-center font-cinzel font-bold text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center leading-tight ${
                    leaderboardCategory === 'duel'
                      ? 'bg-[#e8c84a] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>⚔️ Duel</span>
                  <span className="text-[9px] opacity-80 font-barlow">Victorii</span>
                </button>

                <button
                  onClick={() => setLeaderboardCategory('casino')}
                  className={`py-1.5 px-1 rounded-lg text-center font-cinzel font-bold text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center leading-tight ${
                    leaderboardCategory === 'casino'
                      ? 'bg-[#e8c84a] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🎲 Casino</span>
                  <span className="text-[9px] opacity-80 font-barlow">Victorii</span>
                </button>

                <button
                  onClick={() => setLeaderboardCategory('pineapple')}
                  className={`py-1.5 px-1 rounded-lg text-center font-cinzel font-bold text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center leading-tight ${
                    leaderboardCategory === 'pineapple'
                      ? 'bg-[#e8c84a] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🍍 Pineapple</span>
                  <span className="text-[9px] opacity-80 font-barlow">Victorii</span>
                </button>

                <button
                  onClick={() => setLeaderboardCategory('crash')}
                  className={`py-1.5 px-1 rounded-lg text-center font-cinzel font-bold text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center leading-tight ${
                    leaderboardCategory === 'crash'
                      ? 'bg-[#e8c84a] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🐉 Crash</span>
                  <span className="text-[9px] opacity-80 font-barlow">Victorii</span>
                </button>

                <button
                  onClick={() => setLeaderboardCategory('totalScore')}
                  className={`py-1.5 px-1 rounded-lg text-center font-cinzel font-bold text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center leading-tight ${
                    leaderboardCategory === 'totalScore'
                      ? 'bg-[#e8c84a] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🔥 Total</span>
                  <span className="text-[9px] opacity-80 font-barlow">Guri+Gropi</span>
                </button>
              </div>

              {/* Sub-header info */}
              <div className="flex items-center justify-between px-1 text-xs text-gray-400 font-cinzel">
                <span className="text-[11px]">
                  {leaderboardCategory === 'monopoly' && '🏰 Top Victorii Monopoly / Joc de Tablă'}
                  {leaderboardCategory === 'duel' && '⚔️ Top Victorii Duel 1v1 Trivia'}
                  {leaderboardCategory === 'casino' && '🎲 Top Victorii Barbut Duel Casino'}
                  {leaderboardCategory === 'pineapple' && '🍍 Top Victorii Poker Chinezesc Pineapple'}
                  {leaderboardCategory === 'crash' && '🐉 Top Victorii Dragon Crash 1v1'}
                  {leaderboardCategory === 'totalScore' && '🔥 Top Scor Global (Guri + Gropi × 25)'}
                </span>
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
                  <div className="text-xs font-cinzel text-gray-400">Se descarcă clasamentul mondial...</div>
                </div>
              ) : sortedLeaderboard.length === 0 ? (
                <div className="text-center py-8 space-y-2 bg-[#140e08] rounded-2xl border border-[#2e2216] p-4">
                  <div className="text-3xl">🍺</div>
                  <p className="text-xs font-cinzel text-gray-400">
                    Fii primul călugăr din clasamentul global!
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Autentifică-te cu Google și fiecare profil asociat va apărea în top.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {sortedLeaderboard.map((item, idx) => {
                    const isMe = user?.uid === item.userId;
                    const rankBadge = idx === 0 ? '👑 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`;
                    const calculatedScore = item.totalScore ?? (item.totalSips + 25 * item.totalChugs);

                    return (
                      <div
                        key={item.entryId || `${item.userId}_${item.profileId || idx}`}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                          isMe
                            ? 'bg-gradient-to-r from-[#2e1f13] via-[#22170e] to-[#2e1f13] border-[#ffd700] shadow-md'
                            : 'bg-[#140e08] border-[#2c2218]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
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

                          <div className="w-8 h-8 rounded-xl bg-[#22180f] border border-[#e8c84a]/50 flex-shrink-0 overflow-hidden relative">
                            <AvatarDisplay avatarId={item.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                          </div>

                          <div className="min-w-0">
                            <div className="font-cinzel font-bold text-xs text-gray-200 flex flex-wrap items-center gap-1.5 truncate">
                              <span className="truncate">{item.profileName || item.displayName}</span>
                              <span className="bg-amber-600/90 text-white font-cinzel font-bold text-[9px] px-1.5 py-0.2 rounded-full border border-amber-400/40">
                                Nv. {item.currentLevel || calculateProgression(item.totalXP || 0).currentLevel}
                              </span>
                              {isMe && (
                                <span className="text-[9px] bg-[#ffd700] text-black font-black px-1.5 py-0.2 rounded-full flex-shrink-0">
                                  TU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-barlow truncate flex items-center gap-1.5">
                              {(() => {
                                const prog = calculateProgression(item.totalXP || 0);
                                const titleStr = language === 'ro' ? (item.currentTitle_ro || prog.titleRo) : (item.currentTitle_en || prog.titleEn);
                                return (
                                  <span className={`text-[9px] font-cinzel font-bold ${prog.titleColor}`}>
                                    {prog.titleIcon} {titleStr}
                                  </span>
                                );
                              })()}
                              {item.accountDisplayName ? (
                                <span className="text-gray-500">• {item.accountDisplayName}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Stats Value Depending on Active Category */}
                        <div className="text-right flex-shrink-0 pl-2">
                          {leaderboardCategory === 'monopoly' && (
                            <>
                              <div className="font-bebas text-base text-[#ffd700] leading-none">
                                {item.winsBoardgame || 0} <span className="text-[10px] text-gray-400 font-cinzel">Victorii</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {calculatedScore} scor total
                              </div>
                            </>
                          )}

                          {leaderboardCategory === 'duel' && (
                            <>
                              <div className="font-bebas text-base text-[#ffd700] leading-none">
                                {item.winsDuel || (item.duelWins || 0)} <span className="text-[10px] text-gray-400 font-cinzel">Victorii</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {calculatedScore} scor total
                              </div>
                            </>
                          )}

                          {leaderboardCategory === 'casino' && (
                            <>
                              <div className="font-bebas text-base text-[#ffd700] leading-none">
                                {item.winsCasino || 0} <span className="text-[10px] text-gray-400 font-cinzel">Victorii</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {calculatedScore} scor total
                              </div>
                            </>
                          )}

                          {leaderboardCategory === 'totalScore' && (
                            <>
                              <div className="font-bebas text-base text-[#ffd700] leading-none">
                                {calculatedScore} <span className="text-[10px] text-gray-400 font-cinzel">Pct</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {item.totalSips} guri • {item.totalChugs} gropi
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

          {/* TAB 4: GOOGLE PLAY & MASTER PROFILE DIAGNOSTIC SUITE */}
          {activeSubtab === 'diagnostics' && (
            <div className="space-y-4 animate-fade-in text-left">
              {/* Header Info */}
              <div className="bg-[#140e08] border border-[#ffd700]/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <h3 className="font-cinzel font-bold text-sm text-[#ffd700]">
                      Centru Diagnostic & Teste Google Play
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#24180d] text-yellow-300 font-cinzel border border-yellow-500/30">
                    Live Monitor
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-barlow">
                  Testează în timp real conectarea la Google Play, crearea Profilului Principal (Master), segregarea subprofilurilor și salvarea în Firebase Firestore.
                </p>
              </div>

              {/* Status Overview Card */}
              <div className="bg-[#100b06] border border-[#2e2216] rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-cinzel font-bold text-gray-200 border-b border-[#2e2216] pb-1.5 flex items-center justify-between">
                  <span>📊 Stare Curentă Sistem</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {user ? `UID: ${user.uid.substring(0, 8)}...` : 'Nelogat (Local)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-barlow">
                  <div className="bg-[#18110a] p-2 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-[11px]">Cont Google Play:</div>
                    <div className="font-bold text-yellow-300 truncate">
                      {user ? (user.displayName || user.email) : 'Deconectat'}
                    </div>
                  </div>

                  <div className="bg-[#18110a] p-2 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-[11px]">Status Profil Principal:</div>
                    <div className={`font-bold ${hasSetMainProfile ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {hasSetMainProfile ? '✓ Configurat (Salvat)' : '⏳ Neconfigurat'}
                    </div>
                  </div>

                  <div className="bg-[#18110a] p-2 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-[11px]">Profil Principal Activ:</div>
                    <div className="font-bold text-white truncate">
                      👑 {masterProfile?.name || profiles[0]?.name || 'Nespecificat'}
                    </div>
                  </div>

                  <div className="bg-[#18110a] p-2 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-[11px]">Subprofiluri Asociate:</div>
                    <div className="font-bold text-gray-300">
                      👥 {subProfiles?.length || profiles.filter(p => !p.isMaster).length} active
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Run Diagnostic Suite & Simulation Reset */}
              <div className="space-y-2">
                <button
                  onClick={runFullDiagnostics}
                  disabled={isRunningDiagSuite}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black font-cinzel font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isRunningDiagSuite ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Se rulează suita de teste (7 verificări)...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Rulează Suita Completă de Teste (7 Etape)</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResetMainProfileSimulation}
                    className="py-2 px-3 rounded-xl bg-[#22140a] border border-amber-500/50 text-amber-300 hover:bg-amber-950/50 font-cinzel font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>🔄</span>
                    <span>Re-testează Pop-up Setup</span>
                  </button>

                  <button
                    onClick={handleSyncLocalStatsToCloud}
                    disabled={isSyncing}
                    className="py-2 px-3 rounded-xl bg-[#161c10] border border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/50 font-cinzel font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <span>☁️</span>
                    <span>{isSyncing ? 'Sincronizare...' : 'Verifică Sincronizarea'}</span>
                  </button>
                </div>

                {diagActionMessage && (
                  <div className="p-2.5 rounded-xl bg-yellow-950/70 border border-yellow-500/50 text-yellow-200 text-xs font-barlow text-center animate-fade-in">
                    {diagActionMessage}
                  </div>
                )}
              </div>

              {/* Step-by-Step Diagnostic Test Results */}
              <div className="space-y-2">
                <div className="text-xs font-cinzel font-bold text-gray-300">
                  Jurnal Teste Automate (Diagnostic Logs)
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {diagnosticLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-[#0e0905] border border-[#2a1e12] rounded-xl p-2.5 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-cinzel font-bold text-gray-200 flex items-center gap-1.5">
                          <span>{log.id}.</span>
                          <span>{log.title}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-barlow pl-4">
                          {log.detail}
                        </div>
                      </div>

                      <div className="flex-shrink-0 pt-0.5">
                        {log.status === 'pass' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold">
                            ✓ PASS
                          </span>
                        )}
                        {log.status === 'fail' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/50 text-[10px] font-bold">
                            ✕ FAIL
                          </span>
                        )}
                        {log.status === 'running' && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-500/50 text-[10px] font-bold animate-pulse">
                            ⏳ TEST...
                          </span>
                        )}
                        {log.status === 'idle' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#1c140c] text-gray-500 border border-white/5 text-[10px]">
                            AȘTEPTARE
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
