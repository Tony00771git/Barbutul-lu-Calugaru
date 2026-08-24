import React, { useEffect, useState } from 'react';
import { MatchXpBreakdown, calculateProgression, getNextRankTitle, getTotalXpForLevel } from '../lib/progression';
import { AvatarDisplay } from './AvatarDisplay';
import { useApp } from '../context/AppContext';
import { soundEffects } from '../lib/soundFx';

interface XpGainModalProps {
  breakdown: MatchXpBreakdown | null;
  playerName: string;
  avatarIcon?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const XpGainModal: React.FC<XpGainModalProps> = ({
  breakdown,
  playerName,
  avatarIcon = 'monk_drunk',
  isOpen,
  onClose,
}) => {
  const { language } = useApp();
  const isRo = language === 'ro';

  // Animation states
  const [animatedXp, setAnimatedXp] = useState<number>(0);
  const [animatedCoins, setAnimatedCoins] = useState<number>(0);
  const [barPercent, setBarPercent] = useState<number>(0);
  const [displayedLevel, setDisplayedLevel] = useState<number>(1);
  const [isLevelingUpAnim, setIsLevelingUpAnim] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'summary' | 'levelup_splash'>('summary');
  const [cheersTriggered, setCheersTriggered] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !breakdown) {
      setAnimatedXp(0);
      setAnimatedCoins(0);
      setBarPercent(0);
      setDisplayedLevel(1);
      setIsLevelingUpAnim(false);
      setActiveView('summary');
      setCheersTriggered(false);
      return;
    }

    const oldProg = calculateProgression(breakdown.oldTotalXP);
    const newProg = calculateProgression(breakdown.newTotalXP);

    setAnimatedXp(0);
    setAnimatedCoins(0);
    setBarPercent(oldProg.progressPercent);
    setDisplayedLevel(oldProg.currentLevel);
    setIsLevelingUpAnim(false);

    // If level-up occurred, default to show splash screen after XP counts up
    const hasLevelUp = breakdown.didLevelUp;

    // 1. Animate XP & Drunken Coins counters smoothly
    const totalGainedXp = breakdown.totalGainedXP;
    const totalGainedCoins = breakdown.drunkenCoinsGained;
    const duration = 1100;
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setAnimatedXp(Math.round(eased * totalGainedXp));
      setAnimatedCoins(Math.round(eased * totalGainedCoins));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        // Step 2: Handle progress bar fill
        if (hasLevelUp) {
          // Fill to 100% first
          setBarPercent(100);
          setIsLevelingUpAnim(true);

          setTimeout(() => {
            // Flash to new level
            setDisplayedLevel(newProg.currentLevel);
            setBarPercent(0);

            // Play celebratory audio
            if (breakdown.newTitleUnlocked) {
              soundEffects.playTitleUnlock();
            } else {
              soundEffects.playLevelUpFanfare();
            }

            setTimeout(() => {
              setBarPercent(newProg.progressPercent);
              setIsLevelingUpAnim(false);
              // Switch to grand level-up splash screen
              setActiveView('levelup_splash');
            }, 300);
          }, 600);
        } else {
          // No level-up: simply glide bar to new percent
          setBarPercent(newProg.progressPercent);
          soundEffects.playCoinClink();
        }
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateCount);
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, breakdown]);

  if (!isOpen || !breakdown) return null;

  const currentProg = calculateProgression(breakdown.newTotalXP);
  const nextRankTitle = getNextRankTitle(currentProg.currentLevel);
  const nextTitleLevel = nextRankTitle ? nextRankTitle.minLevel : null;
  const nextTitleTotalXp = nextTitleLevel ? getTotalXpForLevel(nextTitleLevel) : null;
  const xpUntilNextTitle = nextTitleTotalXp ? Math.max(0, nextTitleTotalXp - currentProg.totalXP) : 0;

  const getModeLabel = (m: 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple') => {
    switch (m) {
      case 'normal':
        return isRo ? '🎲 Barbut Clasic' : '🎲 Classic Dice';
      case 'boardgame':
        return isRo ? '🏰 Moșia Mănăstirii' : '🏰 Monastery Board';
      case 'duel':
        return isRo ? '⚔️ Duel 1v1 Trivia' : '⚔️ 1v1 Trivia Duel';
      case 'casino':
        return isRo ? '🎰 Craps Boieresc' : '🎰 Noble Craps';
      case 'pineapple':
        return isRo ? '🍍 Pineapple Poker OFC' : '🍍 Pineapple Poker OFC';
    }
  };

  const handleCheersClick = () => {
    soundEffects.playCheersClink();
    setCheersTriggered(true);
    setTimeout(() => setCheersTriggered(false), 2000);
  };

  return (
    <div
      id="xp-gain-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 99998 }}
      className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        id="xp-gain-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#1c140c] via-[#140e08] to-[#0d0905] border-2 border-[#e8c84a]/80 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(232,200,74,0.3)] overflow-hidden text-[#f0ebe0] max-h-[94vh] flex flex-col transition-all duration-300"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#e8c84a]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Level Up Flash Effect */}
        {isLevelingUpAnim && (
          <div className="absolute inset-0 bg-[#ffd700]/25 pointer-events-none animate-ping rounded-3xl z-50" />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: LEVEL-UP SPLASH SCREEN (Festive Promotion View)         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeView === 'levelup_splash' && breakdown.didLevelUp ? (
          <div className="flex flex-col items-center text-center space-y-3.5 relative z-10 animate-fade-in py-2">
            {/* Top Celebration Sparkle Pill */}
            <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black font-cinzel font-black text-xs uppercase tracking-widest shadow-lg animate-bounce">
              🎉 {isRo ? 'AVANSARE ÎN GRAD MONASTIC!' : 'MONASTIC LEVEL UP!'} 🎉
            </div>

            {/* Glowing Avatar & New Level Badge */}
            <div className="relative my-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#2a1e0f] border-4 border-[#ffd700] overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.6)] gold-glow p-1.5 animate-pulse">
                <AvatarDisplay avatarId={avatarIcon} className="w-full h-full" />
              </div>
              {/* Grand Level Upgrade Ribbon */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-cinzel font-black text-xs sm:text-sm px-4 py-1 rounded-full shadow-2xl border-2 border-white/80 whitespace-nowrap">
                {isRo ? `NIVELUL ${breakdown.newLevel}` : `LEVEL ${breakdown.newLevel}`}
              </div>
            </div>

            {/* Level Transition Pill */}
            <div className="flex items-center justify-center gap-3 text-sm font-cinzel font-bold text-gray-300 pt-1">
              <span className="text-gray-400">Nv. {breakdown.oldLevel}</span>
              <span className="text-[#ffd700] text-lg font-black animate-pulse">➔</span>
              <span className="text-2xl font-black text-[#ffd700] gold-text-glow">
                Nv. {breakdown.newLevel}
              </span>
            </div>

            {/* Unlocked Monastic Title Banner */}
            {breakdown.newTitleUnlocked ? (
              <div className="w-full p-3.5 bg-gradient-to-r from-purple-950/90 via-[#351833] to-purple-950/90 border-2 border-fuchsia-400 rounded-2xl text-center shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="text-[10px] font-barlow font-bold uppercase tracking-widest text-fuchsia-200">
                  👑 {isRo ? 'TITLU TEMATIC NOU DEBLOCAT' : 'NEW THEMATIC TITLE UNLOCKED'} 👑
                </div>
                <div className="text-lg sm:text-xl font-cinzel font-black text-fuchsia-100 flex items-center justify-center gap-2 mt-1">
                  <span>{breakdown.newTitleUnlocked.icon}</span>
                  <span className="gold-text-glow">
                    {isRo ? breakdown.newTitleUnlocked.titleRo : breakdown.newTitleUnlocked.titleEn}
                  </span>
                </div>
                <p className="text-[11px] font-barlow text-fuchsia-200/80 mt-1 italic">
                  {isRo
                    ? '„Ai fost recunoscut în cinul călugăresc pentru vitejia și rezistența la pocal!”'
                    : '"Recognized in the monastic order for valor and endurance at the cup!"'}
                </p>
              </div>
            ) : (
              <div className="w-full p-3 bg-[#1e150d]/90 border border-amber-500/40 rounded-2xl text-center shadow-md">
                <div className="text-xs font-cinzel font-bold text-amber-200">
                  {isRo ? 'Titlu Curent:' : 'Current Title:'}
                </div>
                <div className="text-base font-cinzel font-black text-[#ffd700] flex items-center justify-center gap-1.5 mt-0.5">
                  <span>{currentProg.titleIcon}</span>
                  <span>{isRo ? currentProg.titleRo : currentProg.titleEn}</span>
                </div>
              </div>
            )}

            {/* Level-Up Bonus Rewards Pill */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <div className="p-2.5 bg-[#181109] border border-[#ffd700]/50 rounded-xl text-center">
                <div className="text-[10px] font-cinzel text-gray-400">
                  {isRo ? 'Bonus Avansare' : 'Level-Up Bonus'}
                </div>
                <div className="text-base font-cinzel font-black text-[#ffd700]">
                  +20 🍺🪙
                </div>
              </div>

              <div className="p-2.5 bg-[#181109] border border-amber-500/40 rounded-xl text-center">
                <div className="text-[10px] font-cinzel text-gray-400">
                  {isRo ? 'Sold Tezaur' : 'Total Treasury'}
                </div>
                <div className="text-base font-cinzel font-black text-amber-300">
                  {breakdown.newDrunkenCoins.toLocaleString()} 🍺🪙
                </div>
              </div>
            </div>

            {/* Next Title Milestone Preview */}
            {nextRankTitle && (
              <div className="w-full p-2.5 bg-[#140e08] border border-stone-800 rounded-xl flex items-center justify-between text-xs font-barlow">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{nextRankTitle.icon}</span>
                  <div className="text-left">
                    <div className="text-[10px] font-cinzel text-gray-400">
                      {isRo ? 'Următorul Titlu:' : 'Next Title:'}
                    </div>
                    <div className={`font-cinzel font-bold text-xs ${nextRankTitle.color}`}>
                      {isRo ? nextRankTitle.titleRo : nextRankTitle.titleEn} (Nv. {nextRankTitle.minLevel})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">{isRo ? 'Mai ai nevoie de:' : 'Need:'}</div>
                  <div className="font-mono font-bold text-[#ffd700]">
                    {xpUntilNextTitle.toLocaleString()} XP
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
              <button
                type="button"
                id="btn-level-up-main-menu"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 hover:brightness-125 text-[#ffd700] border border-[#ffd700]/70 font-cinzel font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🏛️</span>
                <span>{isRo ? 'Meniu Principal' : 'Main Menu'}</span>
              </button>

              <button
                type="button"
                id="btn-level-up-view-summary"
                onClick={() => setActiveView('summary')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-[#e8c84a] to-amber-600 text-black font-cinzel font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border border-[#ffd700] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📋</span>
                <span>{isRo ? 'Vezi Detalii Meci' : 'View Match Details'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* VIEW 2: STANDARD DYNAMIC XP PROGRESSION & MATCH BREAKDOWN       */
          /* ═══════════════════════════════════════════════════════════════ */
          <>
            {/* Header with Avatar & Name & Mode Pill */}
            <div className="flex flex-col items-center text-center space-y-1.5 relative z-10 flex-shrink-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-3 py-0.5 rounded-full bg-[#2a1a0c] border border-[#e8c84a]/40 text-[10px] font-cinzel font-bold text-[#ffd700] uppercase tracking-wider">
                  {getModeLabel(breakdown.mode)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#1e130a] border border-stone-700 text-[10px] font-cinzel text-gray-400">
                  {breakdown.turnsPlayed} {isRo ? 'ture jucate' : 'turns played'}
                </span>
              </div>

              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2a1e0f] border-2 border-[#ffd700] overflow-hidden shadow-xl gold-glow p-1">
                  <AvatarDisplay avatarId={avatarIcon} className="w-full h-full" />
                </div>
                {/* Dynamic Level Badge on Avatar */}
                <div className={`absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 text-black font-cinzel font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md border border-white/40 ${isLevelingUpAnim ? 'scale-125 animate-bounce text-amber-900 bg-white' : 'transition-transform'}`}>
                  Nv. {displayedLevel}
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-cinzel font-black text-[#f0ebe0] tracking-wide">
                  {playerName}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-sm">{currentProg.titleIcon}</span>
                  <span className={`text-xs font-cinzel font-bold ${currentProg.titleColor}`}>
                    {isRo ? currentProg.titleRo : currentProg.titleEn}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Rewards Box: XP + Drunken Coins Cards */}
            <div className="grid grid-cols-2 gap-2.5 my-2.5 relative z-10 flex-shrink-0">
              {/* XP Gained Box */}
              <div className="py-2 px-3 bg-gradient-to-br from-[#2a1e12] to-[#1a1109] border border-[#e8c84a]/50 rounded-2xl text-center shadow-inner relative overflow-hidden">
                <div className="text-[10px] font-barlow uppercase tracking-wider text-[#e8c84a]/90 font-bold flex items-center justify-center gap-1">
                  <span>⚡</span> {isRo ? 'Experiență Pelerinaj' : 'Pilgrimage XP'}
                </div>
                <div className="text-2xl sm:text-3xl font-cinzel font-black text-[#ffd700] gold-text-glow mt-0.5">
                  +{animatedXp} <span className="text-xs font-bebas text-[#e8c84a]">XP</span>
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  Total: {breakdown.newTotalXP.toLocaleString()} XP
                </div>
              </div>

              {/* Drunken Coins Gained Box */}
              <div className="py-2 px-3 bg-gradient-to-br from-[#2a1c0d] to-[#180e05] border border-amber-500/50 rounded-2xl text-center shadow-inner relative overflow-hidden">
                <div className="text-[10px] font-barlow uppercase tracking-wider text-amber-300 font-bold flex items-center justify-center gap-1">
                  <span>🍺🪙</span> {isRo ? 'Bănuți Turmentați' : 'Drunken Coins'}
                </div>
                <div className="text-2xl sm:text-3xl font-cinzel font-black text-amber-300 gold-text-glow mt-0.5">
                  +{animatedCoins} <span className="text-xs font-bebas text-yellow-500">🪙</span>
                </div>
                <div className="text-[9px] text-amber-400/80 mt-0.5">
                  Tezaur: {breakdown.newDrunkenCoins.toLocaleString()} 🍺🪙
                </div>
              </div>
            </div>

            {/* Dynamic Step-by-Step Level Progress Bar */}
            <div className="bg-[#120d08]/90 p-3 rounded-2xl border border-[#2e2114] space-y-1.5 my-1 relative z-10 flex-shrink-0">
              <div className="flex justify-between items-center text-xs font-cinzel">
                <span className="text-amber-200 font-bold flex items-center gap-1">
                  <span>🛡️</span>
                  <span>{isRo ? `Nivelul ${displayedLevel}` : `Level ${displayedLevel}`}</span>
                </span>
                <span className="text-[#ffd700] font-black text-[11px] bg-[#22160a] px-2 py-0.5 rounded-md border border-[#ffd700]/30 font-mono">
                  {currentProg.xpInCurrentLevel} / {currentProg.xpNeededForNextLevel} XP ({barPercent}%)
                </span>
                <span className="text-gray-400">
                  {isRo ? `Nivelul ${displayedLevel + 1}` : `Level ${displayedLevel + 1}`}
                </span>
              </div>

              {/* The Visual Dynamic XP Bar */}
              <div className="w-full h-3.5 bg-[#1e150d] border border-[#3e2e1c] rounded-full overflow-hidden p-0.5 shadow-inner relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-[#ffd700] rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(255,215,0,0.6)] relative"
                  style={{ width: `${Math.max(4, Math.min(100, barPercent))}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/80 rounded-full blur-[1px] animate-pulse" />
                </div>
              </div>

              {/* Next Title Milestone & XP Distance Bar */}
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-barlow pt-0.5">
                <span>
                  🔥 {currentProg.xpNeededForNextLevel - currentProg.xpInCurrentLevel}{' '}
                  {isRo ? 'XP până la următorul nivel' : 'XP needed for next level'}
                </span>
                {nextRankTitle && (
                  <span className="text-[#ffd700] font-cinzel font-bold flex items-center gap-1">
                    <span>{nextRankTitle.icon}</span>
                    <span>{isRo ? nextRankTitle.titleRo : nextRankTitle.titleEn} (Nv. {nextRankTitle.minLevel})</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Switch to Splash celebration if level up occurred */}
            {breakdown.didLevelUp && (
              <button
                type="button"
                onClick={() => setActiveView('levelup_splash')}
                className="w-full py-2 px-3 bg-gradient-to-r from-yellow-950 via-amber-900 to-yellow-950 border border-[#ffd700] rounded-xl text-xs font-cinzel font-bold text-[#ffd700] hover:brightness-125 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md my-1"
              >
                <span>🎉</span>
                <span>{isRo ? 'Vezi Sărbătoarea de Avansare Nivel!' : 'View Level-Up Celebration!'}</span>
                <span>➔</span>
              </button>
            )}

            {/* Scrollable Breakdown Details */}
            <div className="my-1.5 flex-1 overflow-y-auto pr-1 text-xs font-barlow relative z-10 border-t border-[#261a0f] pt-2 space-y-1.5 min-h-[85px] max-h-[140px]">
              <div className="text-[10px] font-cinzel font-bold text-gray-400 uppercase tracking-wider mb-1">
                📋 {isRo ? 'Detaliu Câștiguri & Formulă Ture:' : 'Rewards & Turn Formula Breakdown:'}
              </div>

              {/* Base participation */}
              <div className="flex justify-between items-center bg-[#150f09]/80 px-2.5 py-1 rounded-lg border border-[#2b1f13]">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <span>📜</span> {isRo ? 'Participare Sesiune' : 'Session Participation'}
                </span>
                <span className="font-bold text-[#ffd700]">+{breakdown.participationXP} XP</span>
              </div>

              {/* Turns Formula Breakdown */}
              {breakdown.turnsXP > 0 && (
                <div className="flex justify-between items-center bg-[#150f09]/80 px-2.5 py-1 rounded-lg border border-[#2b1f13]">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <span>⏱️</span> {isRo ? 'Formula Ture Jucate' : 'Turns Played Formula'}{' '}
                    <span className="text-[10px] text-amber-400 font-mono">({isRo ? breakdown.turnsFormulaTextRo : breakdown.turnsFormulaTextEn})</span>
                  </span>
                  <span className="font-bold text-amber-300">+{breakdown.turnsXP} XP</span>
                </div>
              )}

              {/* Winner / Performance */}
              {breakdown.performanceXP > 0 && (
                <div className="flex justify-between items-center bg-[#150f09]/80 px-2.5 py-1 rounded-lg border border-[#2b1f13]">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <span>🏆</span> {isRo ? breakdown.performanceReasonRo : breakdown.performanceReasonEn}
                  </span>
                  <span className="font-bold text-[#ffd700]">+{breakdown.performanceXP} XP</span>
                </div>
              )}

              {/* Achievements */}
              {breakdown.achievementItems.map((ach, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#101918]/80 px-2.5 py-1 rounded-lg border border-cyan-900/40">
                  <span className="flex items-center gap-1.5 truncate max-w-[220px] text-cyan-200">
                    <span>{ach.icon}</span> {isRo ? `Realizare: ${ach.nameRo}` : `Achievement: ${ach.nameEn}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300">+{ach.xp} XP</span>
                    <span className="font-bold text-amber-300 text-[10px]">+{ach.coins} 🪙</span>
                  </div>
                </div>
              ))}

              {/* Drunken Coins detailed breakdown */}
              <div className="mt-2 pt-2 border-t border-[#261a0f] space-y-1">
                <div className="text-[10px] font-cinzel font-bold text-amber-400/90 uppercase tracking-wider">
                  🍺🪙 {isRo ? 'Bănuți Turmentați Primiți:' : 'Drunken Coins Earned:'}
                </div>
                {breakdown.coinsBreakdown.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] text-stone-400 px-1">
                    <span className="flex items-center gap-1">
                      <span>{c.icon}</span> {isRo ? c.reasonRo : c.reasonEn}
                    </span>
                    <span className="font-bold text-amber-300 font-mono">+{c.amount} 🪙</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              id="btn-close-xp-modal"
              onClick={onClose}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-600 via-[#e8c84a] to-amber-600 text-black font-cinzel font-black text-sm tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all border border-[#ffd700] relative z-10 flex-shrink-0 cursor-pointer"
            >
              {isRo ? 'Continuă Pelerinajul ➔' : 'Continue Pilgrimage ➔'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
