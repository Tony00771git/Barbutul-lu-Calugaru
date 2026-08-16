import React, { useState, useEffect, useRef } from 'react';
import { Player, DuelSubmode, DuelDifficulty, DuelRoomState } from '../types';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import { MonkMascot } from './MonkMascot';
import { UseDuelSocketReturn } from '../hooks/useDuelSocket';
import { recordDuelMatchHistory } from '../lib/firestoreService';
import { auth } from '../lib/firebase';
import { getSyncedServerNow, syncServerClock } from '../lib/duelFirestoreService';

interface DuelGameProps {
  socket: UseDuelSocketReturn;
  localPlayer: { id: string; name: string; avatarIcon: string; color: string };
  onEndGame: (finalPlayers: Player[]) => void;
  onOpenRules: () => void;
  onLeave: () => void;
}

export const DuelGame: React.FC<DuelGameProps> = ({
  socket,
  localPlayer,
  onEndGame,
  onOpenRules,
  onLeave,
}) => {
  const { t, language, updateProfileStats, checkAchievement } = useApp();
  const {
    room,
    playerId,
    isConnected,
    startGame,
    skipReveal,
    submitAnswer,
    nextRound,
    startDrinkTimer,
    endGame,
    addBot,
    errorMessage,
    clearError,
  } = socket;

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Synchronized server clock timestamp updated continuously
  const [syncedNow, setSyncedNow] = useState<number>(() => getSyncedServerNow());

  // 10-Second Drinking countdown timer state synced with server
  const [drinkCountdownTimeLeft, setDrinkCountdownTimeLeft] = useState<number>(10);

  const isHost = room ? room.hostPlayer.id === playerId : false;
  const me = room ? (isHost ? room.hostPlayer : room.guestPlayer) : null;
  const opponent = room ? (isHost ? room.guestPlayer : room.hostPlayer) : null;

  const myScores = (me && room && room.scores[me.id]) || { sipsTotal: 0, chugsTotal: 0, roundsWon: 0 };
  const opponentScores = (opponent && room && room.scores[opponent.id]) || { sipsTotal: 0, chugsTotal: 0, roundsWon: 0 };

  // Calibrate server clock offset on mount
  useEffect(() => {
    syncServerClock().catch(() => {});
  }, []);

  // Continuous high-precision local clock synchronization interval
  useEffect(() => {
    if (!room || room.status !== 'in_game') return;

    const interval = setInterval(() => {
      setSyncedNow(getSyncedServerNow());
    }, 50);

    return () => clearInterval(interval);
  }, [room?.status]);

  // Reset selected answer on new round or question change
  useEffect(() => {
    setSelectedOption(null);
  }, [room?.currentRound, room?.currentQuestion?.id]);

  // Determine synchronized phase states independently on each device
  const isCountdownActive =
    Boolean(room && room.status === 'in_game' && room.phase === 'reveal' && (room.revealEndsAt || 0) > syncedNow);

  const isRaceActive =
    Boolean(room && room.status === 'in_game' && (room.phase === 'race' || (room.phase === 'reveal' && syncedNow >= (room.revealEndsAt || 0))) && room.phase !== 'resolution');

  const revealTimeLeft = Math.max(0, Math.ceil(((room?.revealEndsAt || 0) - syncedNow) / 1000));

  // Synchronized 10-Second Drinking Countdown Interval
  useEffect(() => {
    if (!room || room.phase !== 'resolution' || !room.roundResult?.drinkCountdownEndsAt) {
      setDrinkCountdownTimeLeft(10);
      return;
    }

    const endsAt = room.roundResult.drinkCountdownEndsAt;
    const updateDrinkTimer = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setDrinkCountdownTimeLeft(remaining);

      // When countdown naturally expires, host client auto-triggers next round or endGame
      if (remaining <= 0 && room.hostPlayer.id === playerId) {
        const meP = (myScores.sipsTotal || 0) + 25 * (myScores.chugsTotal || 0);
        const oppP = (opponentScores.sipsTotal || 0) + 25 * (opponentScores.chugsTotal || 0);
        const tPts = room.targetPoints || 30;

        if (room.roundResult?.isTargetReached || meP >= tPts || oppP >= tPts) {
          endGame();
        } else {
          nextRound();
        }
      }
    };

    updateDrinkTimer();
    const interval = setInterval(updateDrinkTimer, 250);
    return () => clearInterval(interval);
  }, [
    room?.phase,
    room?.roundResult?.drinkCountdownEndsAt,
    room?.roundResult?.isTargetReached,
    room?.targetPoints,
    room?.hostPlayer.id,
    playerId,
    myScores.sipsTotal,
    myScores.chugsTotal,
    opponentScores.sipsTotal,
    opponentScores.chugsTotal,
    endGame,
    nextRound,
  ]);

  // Track achievements on round resolution
  const prevRoundRef = useRef<number>(0);
  useEffect(() => {
    if (!room || room.phase !== 'resolution' || !room.roundResult) return;
    if (prevRoundRef.current === room.currentRound) return;
    prevRoundRef.current = room.currentRound;

    const res = room.roundResult;
    if (res.winnerId === playerId) {
      checkAchievement(localPlayer.name, { isHeaven: true });
    } else if (res.loserIds.includes(playerId || '')) {
      if (res.stakeType === 'chug') {
        checkAchievement(localPlayer.name, { isChug: true, chugsDelta: 1 });
      } else {
        checkAchievement(localPlayer.name, { sipsDelta: res.stakeAmount });
      }
    }
  }, [room?.phase, room?.currentRound, room?.roundResult, playerId, localPlayer.name, checkAchievement]);

  // When duel ends, convert room scores to Player[] and trigger onEndGame
  useEffect(() => {
    if (room && room.status === 'finished') {
      const host = room.hostPlayer;
      const guest = room.guestPlayer;

      const p1Scores = room.scores[host.id] || { sipsTotal: 0, chugsTotal: 0, roundsWon: 0 };
      const p2Scores = guest ? (room.scores[guest.id] || { sipsTotal: 0, chugsTotal: 0, roundsWon: 0 }) : { sipsTotal: 0, chugsTotal: 0, roundsWon: 0 };

      const player1: Player = {
        id: host.id,
        name: host.name,
        color: host.color,
        avatarIcon: host.avatarIcon,
        sipsTurn: 0,
        sipsTotal: p1Scores.sipsTotal,
        chugsTotal: p1Scores.chugsTotal,
        passesCount: 0,
        position: 0,
        gold: 0,
        properties: [],
        inJail: false,
        jailTurnsLeft: 0,
        pardonLetters: 0,
        jailKeys: 0,
        hasGivenUp: false,
      };

      const player2: Player = {
        id: guest?.id || 'p2',
        name: guest?.name || 'Jucător 2',
        color: guest?.color || '#e05c3a',
        avatarIcon: guest?.avatarIcon || 'knight',
        sipsTurn: 0,
        sipsTotal: p2Scores.sipsTotal,
        chugsTotal: p2Scores.chugsTotal,
        passesCount: 0,
        position: 0,
        gold: 0,
        properties: [],
        inJail: false,
        jailTurnsLeft: 0,
        pardonLetters: 0,
        jailKeys: 0,
        hasGivenUp: false,
      };

      // Batch update profiles
      [player1, player2].forEach(p => {
        updateProfileStats(p.name, p.sipsTotal, p.chugsTotal, p.avatarIcon);
      });

      // If authenticated, record match in Firestore
      if (auth.currentUser) {
        const hostPts = (p1Scores.sipsTotal || 0) + 25 * (p1Scores.chugsTotal || 0);
        const guestPts = (p2Scores.sipsTotal || 0) + 25 * (p2Scores.chugsTotal || 0);
        const winner = hostPts < guestPts ? host.name : (guestPts < hostPts ? (guest ? guest.name : 'Jucător 2') : 'Egalitate');
        recordDuelMatchHistory({
          matchId: `match_${Date.now()}_${room.code}`,
          roomCode: room.code,
          submode: room.submode,
          difficulty: room.difficulty,
          hostPlayerName: host.name,
          guestPlayerName: guest ? guest.name : 'Jucător 2',
          winnerName: winner,
          roundsTotal: room.currentRound,
        }).catch(err => console.warn('Could not record duel history in Firestore:', err));
      }

      onEndGame([player1, player2]);
    }
  }, [room?.status, onEndGame, updateProfileStats]);

  if (!room) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-4xl animate-bounce">⚔️ 📡</div>
        <h2 className="text-xl font-cinzel font-bold text-[#e8c84a]">
          {t('duelConnecting')}
        </h2>
        <button
          onClick={onLeave}
          className="px-4 py-2 rounded-xl bg-[#22160d] border border-[#e8c84a]/50 text-xs font-cinzel text-[#ffd700]"
        >
          {language === 'ro' ? 'Înapoi la Meniu' : 'Back to Menu'}
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelectAnswer = (index: number) => {
    if (!isRaceActive || room.phase === 'resolution') return;
    if (room.lockedOutPlayerId === playerId) return;
    if (room.answeredBy) return;
    setSelectedOption(index);
    submitAnswer(index);
  };

  /* ---------------------------------------------------- */
  /* LOBBY VIEW (Waiting for opponent or host to start)    */
  /* ---------------------------------------------------- */
  if (room.status === 'lobby') {
    return (
      <div className="w-full max-w-md mx-auto p-4 space-y-5 animate-fade-in">
        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="text-4xl">⚔️ 📡</div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-black text-[#ffd700] gold-text-glow uppercase">
            {language === 'ro' ? 'Camera de Duel 1v1' : '1v1 Duel Room'}
          </h1>
          <p className="text-xs font-barlow text-gray-400">
            {t('duelInstruction')}
          </p>
        </div>

        {/* Room Code Display Card */}
        <div className="bg-[#18120b] border-2 border-[#e8c84a] rounded-2xl p-5 text-center space-y-4 shadow-2xl gold-glow">
          <div className="text-xs font-cinzel uppercase tracking-widest text-[#e8c84a]">
            {t('duelSharePrompt')}
          </div>

          {/* Golden Room Code Letters */}
          <div className="flex items-center justify-center gap-2">
            {room.code.split('').map((char, i) => (
              <div
                key={i}
                className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-gradient-to-b from-[#2a1d10] to-[#140d07] border-2 border-[#ffd700] flex items-center justify-center text-2xl sm:text-3xl font-cinzel font-black text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)]"
              >
                {char}
              </div>
            ))}
          </div>

          {/* Quick Copy Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyCode}
              className="py-2 px-3 rounded-xl bg-[#22160d] border border-[#e8c84a]/60 hover:border-[#ffd700] text-xs font-cinzel font-bold text-[#ffd700] transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              📋 {copiedCode ? t('duelCodeCopied') : t('duelCopyCode')}
            </button>
            <button
              onClick={handleCopyLink}
              className="py-2 px-3 rounded-xl bg-[#22160d] border border-[#e8c84a]/60 hover:border-[#ffd700] text-xs font-cinzel font-bold text-[#ffd700] transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              🔗 {copiedLink ? t('duelLinkCopied') : t('duelCopyLink')}
            </button>
          </div>
        </div>

        {/* Matchup Preview Box */}
        <div className="bg-[#120d08] border border-[#e8c84a]/40 rounded-2xl p-4 space-y-3">
          <div className="text-[11px] font-cinzel uppercase tracking-wider text-gray-400 text-center">
            {language === 'ro' ? 'Luptătorii Înrolați' : 'Enlisted Fighters'}
          </div>

          <div className="flex items-center justify-around gap-2">
            {/* Host Player */}
            <div className="flex flex-col items-center space-y-1.5 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-[#24170d] border-2 border-[#ffd700] p-1 relative shadow-md">
                <AvatarDisplay avatarId={room.hostPlayer.avatarIcon} className="w-full h-full" />
                <span className="absolute -top-2 -right-1 text-sm">👑</span>
              </div>
              <div className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] truncate max-w-[110px] text-center">
                {room.hostPlayer.name}
              </div>
              <span className="text-[10px] bg-[#2a1e12] border border-[#e8c84a]/50 text-[#e8c84a] px-2 py-0.5 rounded-full font-cinzel">
                Gazdă
              </span>
            </div>

            {/* VS Badge */}
            <div className="font-bebas text-2xl sm:text-3xl text-[#e05c3a] font-bold px-2 animate-pulse">
              VS
            </div>

            {/* Guest Player or Waiting */}
            <div className="flex flex-col items-center space-y-1.5 flex-1">
              {room.guestPlayer ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#24170d] border-2 border-[#e05c3a] p-1 relative shadow-md">
                    <AvatarDisplay avatarId={room.guestPlayer.avatarIcon} className="w-full h-full" />
                    <span className="absolute -top-2 -right-1 text-sm">⚔️</span>
                  </div>
                  <div className="font-cinzel font-bold text-xs sm:text-sm text-[#e05c3a] truncate max-w-[110px] text-center">
                    {room.guestPlayer.name}
                  </div>
                  <span className="text-[10px] bg-green-950 border border-green-500 text-green-300 px-2 py-0.5 rounded-full font-cinzel">
                    Gata
                  </span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#1a130c] border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xl animate-pulse">
                    ⏳
                  </div>
                  <div className="font-cinzel text-xs text-gray-400 italic text-center">
                    {t('duelWaitingOpponent')}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    WiFi / Online
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Submode and Difficulty Info */}
          <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between text-xs font-cinzel text-gray-300 px-2">
            <span>
              Categorie: <strong className="text-[#ffd700]">{room.submode === 'general' ? '🌍 General' : '⚽ Fotbal'}</strong>
            </span>
            <span>
              Dificultate: <strong className="text-[#e05c3a]">{room.difficulty.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <div className="space-y-2">
            {!room.guestPlayer && (
              <button
                onClick={addBot}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#2e1d10] to-[#1a1109] border border-[#ffd700]/70 hover:border-[#ffd700] text-xs font-cinzel font-bold text-[#ffd700] hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <span>🤖</span>
                <span>Joacă / Testează cu Călugărul Bot Onufrie (AI)</span>
              </button>
            )}

            <button
              onClick={startGame}
              disabled={!room.guestPlayer}
              className={`w-full py-3.5 px-4 rounded-xl font-cinzel font-black text-sm tracking-wider uppercase transition-all shadow-xl ${
                room.guestPlayer
                  ? 'bg-gradient-to-r from-[#ffd700] via-[#e8c84a] to-[#d4af37] text-black hover:brightness-110 active:scale-98 gold-glow cursor-pointer'
                  : 'bg-[#22180f] text-gray-500 border border-gray-700 cursor-not-allowed'
              }`}
            >
              {room.guestPlayer ? t('duelStartBattle') : `⏳ ${t('duelWaitingOpponent')}`}
            </button>
          </div>
        ) : (
          <div className="w-full py-3.5 px-4 rounded-xl bg-[#22180f] border border-[#e8c84a]/40 text-center font-cinzel text-xs text-[#ffd700] animate-pulse">
            ⏳ Așteptăm ca gazda ({room.hostPlayer.name}) să pornească duelul...
          </div>
        )}

        {/* Leave / Back to Setup button */}
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl bg-[#140e08] border border-gray-700 text-xs font-cinzel text-gray-400 hover:text-[#f0ebe0] transition-all"
        >
          🚪 Părăsește Camera
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------- */
  /* IN-GAME VIEW (Normal Full Screen for each Player)     */
  /* ---------------------------------------------------- */
  const q = room.currentQuestion;
  const qText = q ? (language === 'ro' ? q.q_ro : q.q_en) : '';
  const options = q ? (language === 'ro' ? q.a_ro : q.a_en) : [];

  const isLockedOut = room.lockedOutPlayerId === playerId;
  const isOpponentLockedOut = room.lockedOutPlayerId && room.lockedOutPlayerId !== playerId;

  const targetPoints = room.targetPoints || 30;
  const myPoints = (myScores.sipsTotal || 0) + 25 * (myScores.chugsTotal || 0);
  const opponentPoints = (opponentScores.sipsTotal || 0) + 25 * (opponentScores.chugsTotal || 0);

  const myProgress = Math.min(100, Math.round((myPoints / targetPoints) * 100));
  const opponentProgress = Math.min(100, Math.round((opponentPoints / targetPoints) * 100));

  // Determine resolution outcomes
  const res = room.roundResult;
  const isMyDrinking = res ? (res.winnerId === null || res.loserIds.includes(me?.id || '') || (!!res.winnerId && res.winnerId !== me?.id)) : false;
  const isWinner = res?.winnerId === me?.id;
  const isChug = res?.stakeType === 'chug';
  const penaltySips = res ? (isChug ? 25 : res.stakeAmount) : 0;

  const isTargetReached = myPoints >= targetPoints || opponentPoints >= targetPoints || !!res?.isTargetReached;
  const targetLoserId = myPoints >= targetPoints ? me?.id : (opponentPoints >= targetPoints ? opponent?.id : res?.targetLoserId);
  const isILostTarget = targetLoserId === me?.id;
  const isDrinkingTimerActive = !!res?.drinkCountdownEndsAt;

  return (
    <div className="w-full max-w-lg mx-auto p-3 sm:p-4 flex flex-col justify-between min-h-[90vh] space-y-4 animate-fade-in select-none relative">
      {/* Target Points Header Pill */}
      <div className="bg-[#1f160e] border border-[#e8c84a]/40 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-1.5 text-xs font-cinzel text-[#ffd700] font-bold">
          <span>🎯</span>
          <span>Prag Limită: <strong className="text-white text-sm">{targetPoints}p</strong></span>
        </div>
        <div className="text-[11px] font-barlow text-gray-300">
          1 gură = <strong className="text-[#ffd700]">1p</strong> | 1 groapă = <strong className="text-red-400">25p</strong>
        </div>
      </div>

      {/* Top Bar: My Player vs Opponent Bar */}
      <div className="bg-[#18120a]/95 border-2 border-[#e8c84a] rounded-2xl p-3 shadow-xl gold-glow flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Local Player (Me) */}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-[#2a1d12] border-2 border-[#ffd700] p-0.5 overflow-hidden flex-shrink-0 shadow">
              <AvatarDisplay avatarId={me?.avatarIcon || 'monk_drunk'} className="w-full h-full" />
            </div>
            <div>
              <div className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] flex items-center gap-1">
                <span>{me?.name}</span>
                <span className="text-[10px] bg-[#2a1e12] px-1.5 py-0.2 rounded border border-[#ffd700]/50 text-[#ffd700]">TU</span>
              </div>
              <div className="text-[11px] font-barlow text-gray-300">
                🏆 {myScores.roundsWon} vict. | 🍺 {myScores.sipsTotal} guri {myScores.chugsTotal > 0 && `| 🔥 ${myScores.chugsTotal} gropi`}
              </div>
            </div>
          </div>

          {/* Center Round & Connection Badge */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-cinzel text-gray-400 uppercase">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span>Runda {room.currentRound}</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[11px] font-cinzel font-black tracking-wide border shadow mt-0.5 ${
              room.stake.type === 'chug'
                ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                : 'bg-[#2a1e12] border-[#e8c84a]/60 text-[#ffd700]'
            }`}>
              {room.stake.type === 'chug' ? '🔥 CHUG IT ALL' : `🍺 ${room.stake.count} GURI`}
            </div>
          </div>

          {/* Opponent Player */}
          <div className="flex items-center gap-2.5 flex-row-reverse text-right">
            <div className="w-11 h-11 rounded-xl bg-[#2a1d12] border-2 border-[#e05c3a] p-0.5 overflow-hidden flex-shrink-0 shadow">
              <AvatarDisplay avatarId={opponent?.avatarIcon || 'knight'} className="w-full h-full" />
            </div>
            <div>
              <div className="font-cinzel font-bold text-xs sm:text-sm text-[#e05c3a] flex items-center justify-end gap-1">
                <span>{opponent?.name}</span>
              </div>
              <div className="text-[11px] font-barlow text-gray-300">
                🏆 {opponentScores.roundsWon} vict. | 🍺 {opponentScores.sipsTotal} guri {opponentScores.chugsTotal > 0 && `| 🔥 ${opponentScores.chugsTotal} gropi`}
              </div>
            </div>
          </div>
        </div>

        {/* Target Points Progress Bars (Duel Health / Knockout meter) */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10 text-xs font-cinzel">
          {/* Me Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#ffd700] font-bold">Puncte TU:</span>
              <span className={`font-bold ${myPoints >= targetPoints ? 'text-red-400 animate-pulse' : 'text-gray-200'}`}>
                {myPoints} / {targetPoints}p
              </span>
            </div>
            <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-500 ${
                  myProgress >= 80 ? 'bg-red-500' : myProgress >= 50 ? 'bg-orange-400' : 'bg-green-500'
                }`}
                style={{ width: `${myProgress}%` }}
              />
            </div>
          </div>

          {/* Opponent Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#e05c3a] font-bold">Puncte {opponent?.name || 'Oponent'}:</span>
              <span className={`font-bold ${opponentPoints >= targetPoints ? 'text-red-400 animate-pulse' : 'text-gray-200'}`}>
                {opponentPoints} / {targetPoints}p
              </span>
            </div>
            <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-500 ${
                  opponentProgress >= 80 ? 'bg-red-500' : opponentProgress >= 50 ? 'bg-orange-400' : 'bg-green-500'
                }`}
                style={{ width: `${opponentProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Card Area */}
      <div className="flex-1 flex flex-col justify-center my-auto space-y-4">
        {/* Category & Difficulty Pill */}
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#20150c] border border-[#e8c84a]/40 text-xs font-cinzel text-[#ffd700]">
            {room.submode === 'general' ? '🌍 Cultură Generală' : '⚽ Fotbal'}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#20150c] border border-[#e8c84a]/40 text-xs font-cinzel text-gray-300">
            Dificultate: <span className="font-bold text-[#e05c3a]">{room.difficulty.toUpperCase()}</span>
          </span>
        </div>

        {/* Question Text Box */}
        <div className="w-full bg-gradient-to-b from-[#1c130b] to-[#120c07] border-2 border-[#e8c84a]/70 rounded-2xl p-5 text-center shadow-xl gold-glow relative">
          <div className="text-3xl mb-2">📜</div>
          <h2 className="font-cinzel font-bold text-base sm:text-xl text-[#f0ebe0] leading-snug">
            {qText}
          </h2>
        </div>

        {/* Phase 1: Reveal Phase (5s Countdown synchronized with Firestore Server Clock) */}
        {isCountdownActive && (
          <div className="bg-[#1e140c]/90 border-2 border-[#e8c84a]/60 rounded-2xl p-5 text-center space-y-3 shadow-lg animate-fade-in">
            <div className="text-xs sm:text-sm font-cinzel text-[#ffd700]">
              {t('revealCountdown')} <span className="font-bebas text-2xl sm:text-3xl text-[#e05c3a] font-bold">{revealTimeLeft}s</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-[#e8c84a]/40">
              <div
                className="bg-gradient-to-r from-[#ffd700] to-[#e05c3a] h-full transition-all duration-100 ease-linear"
                style={{ width: `${Math.min(100, Math.max(0, (revealTimeLeft / 5) * 100))}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 font-barlow">
              Citiți întrebarea cu atenție. Opțiunile vor apărea simultan pe ecranele ambilor jucători!
            </p>

            <button
              onClick={skipReveal}
              className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#e8c84a] to-[#ffd700] text-black font-cinzel font-black text-xs sm:text-sm shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              ⚡ GATA! Afișează Opțiunile Acum ➔
            </button>
          </div>
        )}

        {/* Phase 2: Race / Speed Answering Phase (Independently unlocked on target timestamp) */}
        {isRaceActive && (
          <div className="space-y-3 animate-fade-in">
            {/* Lockout status alerts */}
            {isLockedOut && (
              <div className="p-3 bg-red-950/80 border-2 border-red-500 rounded-xl text-center text-red-200 text-xs sm:text-sm font-cinzel font-bold animate-shake">
                ❌ AI RĂSPUNS GREȘIT! Ești blocat în această rundă! {opponent?.name} are șansa de a răspunde!
              </div>
            )}

            {isOpponentLockedOut && (
              <div className="p-3 bg-amber-950/80 border-2 border-amber-500 rounded-xl text-center text-amber-200 text-xs sm:text-sm font-cinzel font-bold animate-pulse">
                ⚠️ {opponent?.name} A RĂSPUNS GREȘIT! Ai șansa de a câștiga runda dacă răspunzi corect!
              </div>
            )}

            {/* 4 Option Buttons (Large, Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    disabled={isLockedOut}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`min-h-[58px] p-3.5 rounded-2xl border-2 font-barlow text-sm sm:text-base font-bold text-[#f0ebe0] transition-all flex items-center justify-center text-center shadow-lg ${
                      isLockedOut
                        ? 'opacity-40 cursor-not-allowed bg-[#18110a] border-gray-700'
                        : isSelected
                        ? 'bg-[#3b2a14] border-[#ffd700] ring-2 ring-[#ffd700] scale-[1.02]'
                        : 'bg-gradient-to-b from-[#24180d] to-[#171008] border-[#e8c84a]/60 hover:border-[#ffd700] hover:bg-[#2d1e11] active:scale-95'
                    }`}
                  >
                    {optionText}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Global Bottom Bar (End Duel, Rules, Room info) */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2a2a2a]">
        <button
          onClick={() => setShowEndConfirm(true)}
          className="py-2 px-3 rounded-xl bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-300 text-xs font-cinzel font-bold transition-all active:scale-95"
        >
          ⚔️ {t('endDuelBtn')}
        </button>

        <span className="text-[11px] font-cinzel text-gray-400">
          Cod: <strong className="text-[#ffd700]">{room.code}</strong>
        </span>

        <button
          onClick={onOpenRules}
          className="py-2 px-3 rounded-xl bg-[#22180f] border border-[#e8c84a]/40 hover:border-[#ffd700] text-[#ffd700] text-xs font-cinzel font-bold transition-all"
        >
          📜 Reguli
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* POPUP 1: LARGE MONOPOLY-STYLE DRINKING POPUP MODAL   */}
      {/* ---------------------------------------------------- */}
      {room.phase === 'resolution' && res && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div
            className={`relative bg-[#14120e] border-2 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 text-center shadow-2xl ${
              isChug
                ? 'border-red-600 flame-glow'
                : isMyDrinking
                ? 'border-[#e8c84a] gold-glow'
                : 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
            }`}
          >
            {/* Header Ribbon */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#201a12] border border-[#e8c84a]/40 text-xs font-cinzel text-[#e8c84a]">
                <div className="w-5 h-5 rounded-md overflow-hidden bg-[#0d0a07] border border-[#e8c84a]/30 flex-shrink-0">
                  <AvatarDisplay avatarId={me?.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                </div>
                <span className="font-bold">{me?.name}</span>
                <span>- Rezultat Rundă</span>
              </div>

              <h3
                className={`text-2xl font-cinzel font-black tracking-wide ${
                  isTargetReached
                    ? 'text-red-500 flame-text-glow animate-pulse'
                    : isChug
                    ? 'text-red-500 flame-text-glow'
                    : isMyDrinking
                    ? 'text-[#e8c84a] gold-text-glow'
                    : 'text-emerald-400'
                }`}
              >
                {isTargetReached
                  ? (isILostTarget ? '💀 AI PIERDUT DUELUL!' : '👑 AI CÂȘTIGAT DUELUL!')
                  : isChug
                  ? '🔥 GROAPĂ TOTALĂ! 🔥'
                  : isMyDrinking
                  ? '🍺 TREBUIE SĂ BEI! 🍺'
                  : '🛡️ AI CÂȘTIGAT RUNDA! 🛡️'}
              </h3>
            </div>

            {/* Monk Mascot animated character */}
            <div className="flex justify-center scale-95 my-0.5">
              <MonkMascot
                avatarId={me?.avatarIcon || 'monk_drunk'}
                characterName={me?.name}
                sipsInTurn={isMyDrinking ? penaltySips : 0}
                isDrinking={isMyDrinking && !isDrinkingTimerActive}
                overrideState={isTargetReached && isILostTarget ? 'blackout' : isChug && isMyDrinking ? 'blackout' : isWinner ? 'sober' : undefined}
                size="md"
                showLabel={true}
              />
            </div>

            {/* Correct Answer Highlight Box */}
            <div className="bg-[#1e1913] border border-[#382b1d] rounded-2xl p-3 text-xs font-barlow text-[#f0ebe0] space-y-1">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-cinzel">Răspunsul corect:</div>
              <div className="font-bold text-[#ffd875] text-sm sm:text-base">
                ✅ {language === 'ro' ? res.correctAnswerRo : res.correctAnswerEn}
              </div>
            </div>

            {/* Penalty Callout Box */}
            <div
              className={`py-3 px-4 rounded-2xl border flex flex-col items-center justify-center ${
                isChug
                  ? 'bg-red-950/60 border-red-500/80 text-red-100 animate-pulse'
                  : isMyDrinking
                  ? 'bg-[#281e0e] border-[#e8c84a]/70 text-[#fdf8e6]'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
              }`}
            >
              {isChug ? (
                <div className="space-y-0.5">
                  <div className="text-2xl font-cinzel font-black text-red-400 tracking-wider">
                    💀 GROAPĂ (25 puncte)
                  </div>
                  <div className="text-xs font-barlow text-red-200">
                    {isMyDrinking ? 'Bei tot paharul dintr-o răsuflare!' : `${opponent?.name} bea tot paharul!`}
                  </div>
                </div>
              ) : isMyDrinking ? (
                <div className="space-y-0.5">
                  <div className="text-[11px] uppercase font-cinzel tracking-widest text-[#e8c84a]">
                    Pedeapsă de băut
                  </div>
                  <div className="text-2xl font-cinzel font-black text-[#ffd700] gold-text-glow">
                    🍺 {penaltySips} {penaltySips === 1 ? 'GURĂ' : 'GURI'} ({penaltySips} puncte)
                  </div>
                  <div className="text-xs text-gray-300 font-barlow">
                    Ia {penaltySips} {penaltySips === 1 ? 'gură' : 'guri'} de bere/băutură!
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="text-lg font-cinzel font-bold text-emerald-400">
                    🛡️ ZERO GURI! EȘTI SALVAT!
                  </div>
                  <div className="text-xs text-gray-300 font-barlow">
                    {opponent?.name} trebuie să bea {penaltySips} {penaltySips === 1 ? 'gură' : 'guri'}!
                  </div>
                </div>
              )}
            </div>

            {/* Target Points Comparison */}
            <div className="bg-[#18130d] border border-white/10 rounded-xl p-2.5 space-y-1.5 text-xs font-cinzel">
              <div className="flex justify-between items-center text-[11px] text-gray-300">
                <span>Scor Duel (Prag {targetPoints}p):</span>
                <span>{myPoints >= targetPoints || opponentPoints >= targetPoints ? '🚨 PRAG ATINS' : 'În desfășurare'}</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-[#ffd700]">TU: {myPoints}p</span>
                <span className="text-[#e05c3a]">{opponent?.name || 'Oponent'}: {opponentPoints}p</span>
              </div>
            </div>

            {/* Stage 1 vs Stage 2: Action Button for Next Round or Ending Duel */}
            <div className="pt-1">
              {isTargetReached ? (
                <button
                  onClick={endGame}
                  className="w-full py-3.5 rounded-2xl font-cinzel font-black text-sm bg-gradient-to-r from-[#e8c84a] via-[#ffd700] to-[#e8c84a] text-black hover:brightness-110 active:scale-95 shadow-xl gold-glow cursor-pointer"
                >
                  🏆 Vezi Podiumul & Câștigătorul ➔
                </button>
              ) : (
                <button
                  onClick={nextRound}
                  className={`w-full py-3.5 rounded-2xl font-cinzel font-black text-sm transition-all duration-200 active:scale-95 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                    isChug
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:brightness-110 flame-glow animate-pulse'
                      : 'bg-gradient-to-r from-[#e8c84a] to-[#ffd700] text-black hover:brightness-110 gold-glow'
                  }`}
                >
                  <span>{isMyDrinking ? (isChug ? '🔥 Am băut groapa! ➔ Runda Următoare' : '🍺 Am băut! ➔ Runda Următoare') : '⚔️ Următoarea Rundă ➔'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to End Duel */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18120a] border-2 border-[#e8c84a] rounded-2xl p-5 max-w-sm w-full text-center space-y-4 gold-glow">
            <div className="text-4xl">⚔️ 🏆</div>
            <h3 className="text-lg font-cinzel font-bold text-[#ffd700] gold-text-glow">
              {t('endDuelConfirm')}
            </h3>
            <p className="text-xs text-gray-300 font-barlow">
              Duelul se va încheia pentru ambii jucători, iar rezultatele vor fi salvate pe podium și în profiluri.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="py-2.5 rounded-xl bg-[#2a1e12] border border-gray-600 text-xs font-cinzel text-gray-300 hover:bg-[#382818]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  endGame();
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-[#e8c84a] to-[#ffd700] text-black text-xs font-cinzel font-bold hover:brightness-110 shadow"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
