import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FriendEntry, UserFriendProfile, Profile } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { TrophyShowcase } from './TrophyShowcase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateProgression } from '../lib/progression';
import { getTopRarestInventoryItems } from '../lib/showcaseHelper';
import { Trophy, Flame, Award, Beer, Shield, Swords, Sparkles, Copy, Check, X, Dices } from 'lucide-react';
import { soundEffects } from '../lib/soundFx';

interface FriendProfileStatsModalProps {
  friend: FriendEntry | UserFriendProfile;
  isOpen: boolean;
  onClose: () => void;
  onInviteToGame?: (friend: FriendEntry | UserFriendProfile, mode: 'duel' | 'pineapple' | 'crash') => void;
}

export const FriendProfileStatsModal: React.FC<FriendProfileStatsModalProps> = ({
  friend,
  isOpen,
  onClose,
  onInviteToGame,
}) => {
  const { language } = useApp();
  const { user } = useAuth();
  const isRo = language === 'ro';

  const [detailedStats, setDetailedStats] = useState<Partial<Profile> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const friendUid = (friend as FriendEntry).friendUid || (friend as UserFriendProfile).uid;
  const shortId = friend.shortId || '';

  // Fetch full public stats and records for this friend
  useEffect(() => {
    if (!isOpen || !friend) {
      setDetailedStats(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setDetailedStats(null);
    setIsLoading(true);

    const fetchFriendDetails = async () => {
      try {
        let statsFound: any = null;

        // 1. Try fetching from public_profiles by shortId
        if (shortId) {
          try {
            const pubSnap = await getDoc(doc(db, 'public_profiles', shortId));
            if (pubSnap.exists()) {
              statsFound = pubSnap.data();
            }
          } catch (e) {
            console.warn('Could not read public_profiles by shortId:', e);
          }
        }

        // 2. If not found or missing fields, try searching public_profiles by uid
        if ((!statsFound || statsFound.totalXP === undefined) && friendUid) {
          try {
            const q = query(
              collection(db, 'public_profiles'),
              where('uid', '==', friendUid),
              limit(1)
            );
            const pubByUidSnap = await getDocs(q);
            if (!pubByUidSnap.empty) {
              statsFound = {
                ...pubByUidSnap.docs[0].data(),
                ...(statsFound || {}),
              };
            }
          } catch (e) {
            console.warn('Could not query public_profiles by uid:', e);
          }
        }

        // 3. Try querying leaderboards by userId if missing stats
        if (friendUid) {
          try {
            const q = query(
              collection(db, 'leaderboards'),
              where('userId', '==', friendUid),
              limit(1)
            );
            const lbSnap = await getDocs(q);
            if (!lbSnap.empty) {
              const lbData = lbSnap.docs[0].data();
              statsFound = {
                ...lbData,
                ...(statsFound || {}),
              };
            }
          } catch (e) {
            console.warn('Could not read leaderboard stats:', e);
          }
        }

        if (isMounted) {
          setDetailedStats(statsFound);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching friend profile stats:', err);
        if (isMounted) {
          setDetailedStats(null);
          setIsLoading(false);
        }
      }
    };

    fetchFriendDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, friendUid, shortId]);

  if (!isOpen || !friend) return null;

  const currentLevel = detailedStats?.currentLevel || friend.currentLevel || 1;
  const progression = calculateProgression(detailedStats?.totalXP || 0);
  const title = isRo
    ? detailedStats?.currentTitle_ro || friend.currentTitle_ro || progression.titleRo
    : detailedStats?.currentTitle_en || (friend as UserFriendProfile).currentTitle_en || progression.titleEn;

  // Real stats for this friend (0 if not played/available, rather than identical fabricated mock numbers)
  const friendTotalSips = detailedStats?.totalSips ?? 0;
  const friendTotalChugs = detailedStats?.totalChugs ?? 0;
  const friendWinsBoardgame = detailedStats?.winsBoardgame ?? 0;
  const friendWinsDuel = detailedStats?.winsDuel ?? 0;
  const friendWinsCasino = detailedStats?.winsCasino ?? 0;
  const friendWinsPineapple = detailedStats?.winsPineapple ?? 0;
  const friendWinsCrash = detailedStats?.winsCrash ?? 0;

  const totalWins =
    friendWinsBoardgame +
    friendWinsDuel +
    friendWinsCasino +
    friendWinsPineapple +
    friendWinsCrash;

  const friendCrashMult = detailedStats?.highestCrashMultiplier ?? 0;
  const friendWinStreak = detailedStats?.highestWinStreak ?? 0;
  const friendDrinksServed = detailedStats?.totalDrinksServedToFriends ?? 0;

  const friendShowcasedIds =
    detailedStats?.showcasedItemIds && detailedStats.showcasedItemIds.length > 0
      ? detailedStats.showcasedItemIds
      : (detailedStats?.avatarIcon || friend.avatarIcon ? [detailedStats?.avatarIcon || friend.avatarIcon || 'monk_drunk'] : []);

  const synthesizedProfile: Profile = {
    id: `friend_${friendUid}`,
    name: detailedStats?.displayName || friend.displayName,
    avatarIcon: detailedStats?.avatarIcon || friend.avatarIcon || 'monk_drunk',
    isMaster: true,
    gamesPlayed: detailedStats?.gamesPlayed ?? (totalWins > 0 ? totalWins : (friendTotalSips > 0 ? 1 : 0)),
    totalSips: friendTotalSips,
    totalChugs: friendTotalChugs,
    totalXP: detailedStats?.totalXP ?? 0,
    currentLevel,
    currentTitle_ro: detailedStats?.currentTitle_ro || friend.currentTitle_ro || progression.titleRo,
    currentTitle_en: detailedStats?.currentTitle_en || (friend as UserFriendProfile).currentTitle_en || progression.titleEn,
    winsBoardgame: friendWinsBoardgame,
    winsDuel: friendWinsDuel,
    winsCasino: friendWinsCasino,
    winsPineapple: friendWinsPineapple,
    winsCrash: friendWinsCrash,
    highestCrashMultiplier: friendCrashMult,
    highestWinStreak: friendWinStreak,
    totalDrinksServedToFriends: friendDrinksServed,
    showcasedItemIds: friendShowcasedIds,
    unlockedAchievements: detailedStats?.unlockedAchievements || [],
    createdAt: Date.now(),
  };

  const handleCopyId = () => {
    if (!shortId) return;
    navigator.clipboard.writeText(`#${shortId}`);
    setCopiedId(true);
    soundEffects.playClick();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isLobby = Boolean(friend.activeRoom?.roomCode && friend.activeRoom.status === 'lobby');
  const isInGame = Boolean(friend.activeRoom?.roomCode && friend.activeRoom.status === 'in_game');

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99999 }}
      className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-gradient-to-b from-[#1c130b] via-[#130d07] to-[#0a0704] border-2 border-[#ffd700] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col max-h-[92vh] gold-glow relative text-left overflow-hidden"
      >
        {/* Header - Friend Profile Card & Status */}
        <div className="flex items-start justify-between border-b border-[#2d1e11] pb-3 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with Halo & Level Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2a1a0e] to-[#120a05] border-2 border-[#ffd700] overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.35)] flex items-center justify-center">
                <AvatarDisplay
                  avatarId={synthesizedProfile.avatarIcon}
                  className="w-full h-full p-0.5"
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#ffd700] text-black font-cinzel font-black text-[9px] shadow border border-black/40">
                Nv. {currentLevel}
              </span>
            </div>

            {/* Name, Title, and ID */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-cinzel font-black text-base sm:text-lg text-[#ffd700] gold-text-glow truncate leading-tight">
                  {friend.displayName}
                </h2>
                {shortId && (
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className={`px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] border flex items-center gap-1 transition-all ${
                      copiedId
                        ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200'
                        : 'bg-[#1a120b] border-[#ffd700]/50 text-amber-300 hover:border-[#ffd700]'
                    }`}
                    title={isRo ? 'Copiază ID-ul prietenului' : 'Copy friend ID'}
                  >
                    <span>#{shortId}</span>
                    {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                )}
              </div>

              <div className="text-xs text-amber-200 font-cinzel font-semibold mt-0.5 truncate">
                {title}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 mt-1">
                {isLobby ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-950/80 border border-green-500/60 text-[10px] font-cinzel font-bold text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{isRo ? 'În Lobby (Așteaptă meci)' : 'In Lobby (Waiting)'}</span>
                  </span>
                ) : isInGame ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-[10px] font-cinzel font-bold text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{isRo ? 'În Meci Activ' : 'In Active Match'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-barlow text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{isRo ? 'Frate de Pahar Conectat' : 'Tavern Companion Connected'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#24170d] hover:bg-[#382314] border border-[#ffd700]/40 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 custom-scrollbar pr-1 py-3">
          
          {/* Action Row: Invite to Duel / Pineapple / Crash */}
          {onInviteToGame && (
            <div className="p-3 bg-gradient-to-r from-[#2a170b] via-[#1f1208] to-[#2a170b] border border-[#ffd700]/70 rounded-2xl flex items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <Swords className="w-5 h-5 text-[#ffd700] flex-shrink-0 animate-bounce-short" />
                <div>
                  <span className="font-cinzel font-bold text-xs text-[#ffd700] block truncate">
                    {isRo ? 'Provoacă acest prieten la un duel 1v1!' : 'Challenge this friend to a 1v1 duel!'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-barlow block">
                    {isRo ? 'Alege modul de joc dorit:' : 'Select match game mode:'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onInviteToGame(friend, 'duel')}
                  className="py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:brightness-110 text-white font-cinzel font-bold text-[11px] shadow transition-all active:scale-95"
                >
                  ⚔️ {isRo ? 'Duel' : 'Duel'}
                </button>
                <button
                  type="button"
                  onClick={() => onInviteToGame(friend, 'pineapple')}
                  className="py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-black font-cinzel font-bold text-[11px] shadow transition-all active:scale-95"
                >
                  🍍 {isRo ? 'Poker' : 'Poker'}
                </button>
                <button
                  type="button"
                  onClick={() => onInviteToGame(friend, 'crash')}
                  className="py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 hover:brightness-110 text-white font-cinzel font-bold text-[11px] shadow transition-all active:scale-95"
                >
                  🐉 {isRo ? 'Crash' : 'Crash'}
                </button>
              </div>
            </div>
          )}

          {/* TROPHY SHOWCASE (FRIEND'S 4 PILLARS + 3 RAREST ITEMS) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-cinzel font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#ffd700]" />
                <span>{isRo ? `Sala Trofeelor lui ${friend.displayName}` : `${friend.displayName}'s Trophy Hall`}</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-barlow">
                {isRo ? '★ Top 3 Rarități & Recorduri ★' : '★ Top 3 Rarities & Records ★'}
              </span>
            </div>

            <TrophyShowcase
              profile={synthesizedProfile}
              isEditable={false}
            />
          </div>

          {/* DETAILED STATS BREAKDOWN BY GAME MODE */}
          <div className="p-3.5 rounded-2xl bg-[#110c07] border border-[#2b1f13] space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-[#24170d] pb-2">
              <span className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Dices className="w-4 h-4 text-amber-400" />
                <span>{isRo ? 'Statistici Detaliate pe Moduri de Joc' : 'Detailed Mode Statistics'}</span>
              </span>
              <span className="text-[10px] text-gray-400 font-barlow font-mono">
                {synthesizedProfile.gamesPlayed} {isRo ? 'meciuri jucate' : 'games played'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-cinzel">
              {/* Boardgame Wins */}
              <div className="p-2.5 rounded-xl bg-[#170f08] border border-[#332213] flex flex-col justify-between">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span>🏰</span>
                  <span>{isRo ? 'Barbut / Tablă' : 'Boardgame'}</span>
                </span>
                <span className="text-sm font-bold text-[#ffd700] mt-1">
                  {friendWinsBoardgame} {isRo ? 'victorii' : 'wins'}
                </span>
              </div>

              {/* Trivia Duel Wins */}
              <div className="p-2.5 rounded-xl bg-[#170f08] border border-[#332213] flex flex-col justify-between">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span>⚔️</span>
                  <span>{isRo ? 'Trivia Duel' : 'Trivia Duel'}</span>
                </span>
                <span className="text-sm font-bold text-red-300 mt-1">
                  {friendWinsDuel} {isRo ? 'victorii' : 'wins'}
                </span>
              </div>

              {/* Casino Craps Wins */}
              <div className="p-2.5 rounded-xl bg-[#170f08] border border-[#332213] flex flex-col justify-between">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span>🎰</span>
                  <span>{isRo ? 'Cazino Barbut' : 'Casino Craps'}</span>
                </span>
                <span className="text-sm font-bold text-amber-300 mt-1">
                  {friendWinsCasino} {isRo ? 'victorii' : 'wins'}
                </span>
              </div>

              {/* Pineapple Poker Wins */}
              <div className="p-2.5 rounded-xl bg-[#170f08] border border-[#332213] flex flex-col justify-between">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span>🍍</span>
                  <span>{isRo ? 'OFC Pineapple' : 'Pineapple Poker'}</span>
                </span>
                <span className="text-sm font-bold text-yellow-300 mt-1">
                  {friendWinsPineapple} {isRo ? 'victorii' : 'wins'}
                </span>
              </div>

              {/* Crash Dragon Wins */}
              <div className="p-2.5 rounded-xl bg-[#170f08] border border-[#332213] flex flex-col justify-between">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span>🐉</span>
                  <span>{isRo ? 'Dragon Crash' : 'Dragon Crash'}</span>
                </span>
                <span className="text-sm font-bold text-purple-300 mt-1">
                  {friendWinsCrash} {isRo ? 'victorii' : 'wins'}
                </span>
              </div>

              {/* Total Tavern Score & Beers */}
              <div className="p-2.5 rounded-xl bg-[#170f08] border border-[#332213] flex flex-col justify-between">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span>🍺</span>
                  <span>{isRo ? 'Băuturi Totale' : 'Total Drinks'}</span>
                </span>
                <span className="text-sm font-bold text-amber-200 mt-1">
                  {friendTotalSips} guri • {friendTotalChugs} gropi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="pt-3 border-t border-[#2a1d10] flex items-center justify-between text-xs font-barlow text-gray-400 flex-shrink-0">
          <span>
            {isRo ? 'Profil sincronizat în Tavernă' : 'Profile synced in Tavern'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black font-cinzel font-black text-xs hover:brightness-110 transition-all shadow cursor-pointer"
          >
            {isRo ? 'Închide ➔' : 'Close ➔'}
          </button>
        </div>
      </div>
    </div>
  );
};
