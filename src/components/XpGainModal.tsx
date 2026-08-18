import React, { useEffect, useState } from 'react';
import { MatchXpBreakdown, calculateProgression } from '../lib/progression';
import { AvatarDisplay } from './AvatarDisplay';
import { useApp } from '../context/AppContext';

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
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<boolean>(false);
  const [showTitleAlert, setShowTitleAlert] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !breakdown) {
      setAnimatedXp(0);
      setAnimatedCoins(0);
      setBarPercent(0);
      setShowLevelUpAlert(false);
      setShowTitleAlert(false);
      return;
    }

    const oldProg = calculateProgression(breakdown.oldTotalXP);
    const newProg = calculateProgression(breakdown.newTotalXP);

    setAnimatedXp(0);
    setAnimatedCoins(0);
    setBarPercent(oldProg.progressPercent);

    // 1. Animate XP & Drunken Coins counters smoothly
    const totalGainedXp = breakdown.totalGainedXP;
    const totalGainedCoins = breakdown.drunkenCoinsGained;
    const duration = 1200;
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
        // Animate progress bar to new level position
        setBarPercent(newProg.progressPercent);

        if (breakdown.didLevelUp) {
          setTimeout(() => {
            setShowLevelUpAlert(true);
          }, 250);
        }

        if (breakdown.newTitleUnlocked) {
          setTimeout(() => {
            setShowTitleAlert(true);
          }, 650);
        }
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateCount);
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, breakdown]);

  if (!isOpen || !breakdown) return null;

  const currentProg = calculateProgression(breakdown.newTotalXP);

  const getModeLabel = (m: 'normal' | 'boardgame' | 'duel' | 'casino') => {
    switch (m) {
      case 'normal':
        return isRo ? '🎲 Barbut Clasic' : '🎲 Classic Dice';
      case 'boardgame':
        return isRo ? '🏰 Moșia Mănăstirii' : '🏰 Monastery Board';
      case 'duel':
        return isRo ? '⚔️ Duel 1v1 Trivia' : '⚔️ 1v1 Trivia Duel';
      case 'casino':
        return isRo ? '🎰 Masa Craps Boierească' : '🎰 Noble Craps Table';
    }
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
        className="relative w-full max-w-lg bg-gradient-to-b from-[#1c140c] via-[#140e08] to-[#0d0905] border-2 border-[#e8c84a]/80 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(232,200,74,0.25)] overflow-hidden text-[#f0ebe0] max-h-[92vh] flex flex-col"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-[#e8c84a]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Level Up Flash */}
        {showLevelUpAlert && (
          <div className="absolute inset-0 bg-[#e8c84a]/10 pointer-events-none animate-pulse rounded-3xl" />
        )}

        {/* Header with Avatar & Name & Mode Pill */}
        <div className="flex flex-col items-center text-center space-y-2 relative z-10 flex-shrink-0">
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
            {/* Level Badge on Avatar */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 text-black font-cinzel font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-full shadow-md border border-white/40">
              Nv. {currentProg.currentLevel}
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
        <div className="grid grid-cols-2 gap-2.5 my-3 relative z-10 flex-shrink-0">
          {/* XP Gained Box */}
          <div className="py-2.5 px-3 bg-gradient-to-br from-[#2a1e12] to-[#1a1109] border border-[#e8c84a]/50 rounded-2xl text-center shadow-inner relative overflow-hidden">
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
          <div className="py-2.5 px-3 bg-gradient-to-br from-[#2a1c0d] to-[#180e05] border border-amber-500/50 rounded-2xl text-center shadow-inner relative overflow-hidden">
            <div className="text-[10px] font-barlow uppercase tracking-wider text-amber-300 font-bold flex items-center justify-center gap-1">
              <span>🍺🪙</span> {isRo ? 'Bănuți Turmentați' : 'Drunken Coins'}
            </div>
            <div className="text-2xl sm:text-3xl font-cinzel font-black text-amber-300 gold-text-glow mt-0.5">
              +{animatedCoins} <span className="text-xs font-bebas text-yellow-500">🪙</span>
            </div>
            <div className="text-[9px] text-amber-400/80 mt-0.5">
              Sold: {breakdown.newDrunkenCoins.toLocaleString()} 🍺🪙
            </div>
          </div>
        </div>

        {/* Level Progress Bar Card */}
        <div className="bg-[#120d08]/90 p-3 rounded-2xl border border-[#2e2114] space-y-1.5 my-1 relative z-10 flex-shrink-0">
          <div className="flex justify-between items-center text-xs font-cinzel">
            <span className="text-amber-200 font-bold">
              {isRo ? `Nivelul ${currentProg.currentLevel}` : `Level ${currentProg.currentLevel}`}
            </span>
            <span className="text-[#ffd700] font-black text-[11px] bg-[#22160a] px-2 py-0.5 rounded-md border border-[#ffd700]/30">
              {currentProg.xpInCurrentLevel} / {currentProg.xpNeededForNextLevel} XP ({currentProg.progressPercent}%)
            </span>
            <span className="text-gray-400">
              {isRo ? `Nivelul ${currentProg.currentLevel + 1}` : `Level ${currentProg.currentLevel + 1}`}
            </span>
          </div>

          {/* The visual XP bar */}
          <div className="w-full h-3 bg-[#1e150d] border border-[#3e2e1c] rounded-full overflow-hidden p-0.5 shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-[#ffd700] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,215,0,0.5)]"
              style={{ width: `${Math.max(4, barPercent)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full blur-[1px]" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-400 font-barlow pt-0.5">
            <span>
              🔥 {currentProg.xpNeededForNextLevel - currentProg.xpInCurrentLevel}{' '}
              {isRo ? 'XP până la următorul rang' : 'XP needed for next level'}
            </span>
            <span className="text-[#ffd700] font-cinzel">
              {currentProg.titleIcon} {isRo ? currentProg.titleRo : currentProg.titleEn}
            </span>
          </div>
        </div>

        {/* Celebration Banners */}
        {showLevelUpAlert && (
          <div className="my-2 p-2.5 bg-gradient-to-r from-yellow-950/90 via-amber-900/90 to-yellow-950/90 border-2 border-[#ffd700] rounded-2xl text-center animate-bounce shadow-xl relative z-10 flex-shrink-0">
            <div className="text-[10px] font-barlow font-bold uppercase tracking-widest text-[#ffd700]">
              🎉 {isRo ? 'AVANSARE ÎN GRAD MONASTIC!' : 'MONASTIC LEVEL UP!'} 🎉
            </div>
            <div className="text-base font-cinzel font-black text-white gold-text-glow flex items-center justify-center gap-2">
              <span>{isRo ? `Ai atins Nivelul ${breakdown.newLevel}!` : `You reached Level ${breakdown.newLevel}!`}</span>
              <span className="text-xs bg-[#ffd700] text-black px-2 py-0.5 rounded-full font-bold">+20 🍺🪙</span>
            </div>
          </div>
        )}

        {showTitleAlert && breakdown.newTitleUnlocked && (
          <div className="my-2 p-2.5 bg-gradient-to-r from-purple-950/90 via-fuchsia-900/90 to-purple-950/90 border-2 border-fuchsia-400 rounded-2xl text-center animate-pulse shadow-xl relative z-10 flex-shrink-0">
            <div className="text-[10px] font-barlow font-bold uppercase tracking-widest text-fuchsia-200">
              👑 {isRo ? 'TITLU TEMATIC NOU DEBLOCAT!' : 'NEW THEMATIC TITLE UNLOCKED!'} 👑
            </div>
            <div className="text-sm font-cinzel font-black text-fuchsia-100 mt-0.5">
              {breakdown.newTitleUnlocked.icon}{' '}
              {isRo ? breakdown.newTitleUnlocked.titleRo : breakdown.newTitleUnlocked.titleEn}
            </div>
          </div>
        )}

        {/* Scrollable Breakdown Details */}
        <div className="my-2 flex-1 overflow-y-auto pr-1 text-xs font-barlow relative z-10 border-t border-[#261a0f] pt-2 space-y-1.5 min-h-[90px]">
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
      </div>
    </div>
  );
};
