import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DAILY_QUEST_DEFINITIONS, DailyQuestCategory } from '../data/dailyQuests';
import { soundEffects } from '../lib/soundFx';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBazaar?: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  isOpen,
  onClose,
  onOpenBazaar,
}) => {
  const {
    language,
    drunkenCoins,
    activeDailyQuests,
    claimDailyQuestReward,
    claimDailyBonusChest,
    dailyQuestPool,
    timeUntilQuestReset,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'codex'>('today');
  const [claimCelebration, setClaimCelebration] = useState<string | null>(null);

  useEffect(() => {
    if (claimCelebration) {
      const timer = setTimeout(() => setClaimCelebration(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [claimCelebration]);

  if (!isOpen) return null;

  const isRo = language === 'ro';

  const completedCount = activeDailyQuests.filter(q => q.completed).length;
  const allCompleted = completedCount === 3;
  const canClaimBonus = allCompleted && !dailyQuestPool.bonusClaimed;

  const handleClaim = (questId: string, coins: number) => {
    const success = claimDailyQuestReward(questId);
    if (success) {
      soundEffects.playQuestClaim();
      setClaimCelebration(`+${coins} 🍺🪙 ${isRo ? 'adăugați în Tezaur!' : 'added to Treasury!'}`);
    }
  };

  const handleClaimBonus = () => {
    const success = claimDailyBonusChest();
    if (success) {
      soundEffects.playLevelUpFanfare();
      setClaimCelebration(`🎁 +50 🍺🪙 ${isRo ? 'Bonusul Zilei a fost revendicat!' : 'Daily Master Bonus Claimed!'}`);
    }
  };

  const getCategoryBadge = (cat: DailyQuestCategory) => {
    switch (cat) {
      case 'dice':
        return { label: isRo ? '🎲 Zaruri' : '🎲 Dice', color: 'bg-amber-950/80 text-amber-300 border-amber-500/40' };
      case 'theme':
        return { label: isRo ? '🏛️ Teme & Zaruri' : '🏛️ Themes & Skins', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40' };
      case 'pineapple':
        return { label: isRo ? '🍍 Pineapple Poker' : '🍍 Pineapple Poker', color: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40' };
      case 'crash':
        return { label: isRo ? '🐉 Zborul Dragonului' : '🐉 Dragon Crash', color: 'bg-red-950/80 text-red-300 border-red-500/40' };
      case 'duel':
        return { label: isRo ? '⚔️ Duel 1v1' : '⚔️ 1v1 Duel', color: 'bg-rose-950/80 text-rose-300 border-rose-500/40' };
      case 'casino':
        return { label: isRo ? '🎰 Cazinou' : '🎰 Casino', color: 'bg-purple-950/80 text-purple-300 border-purple-500/40' };
      case 'boardgame':
        return { label: isRo ? '🗺️ Tablă Monahală' : '🗺️ Boardgame', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' };
      default:
        return { label: isRo ? '🍺 Călugăresc' : '🍺 Monastic', color: 'bg-stone-900 text-stone-300 border-stone-700' };
    }
  };

  const getDifficultyBadge = (diff?: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return { label: isRo ? 'Ușor' : 'Easy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' };
      case 'hard':
        return { label: isRo ? 'Dificil' : 'Hard', color: 'text-red-400 border-red-500/30 bg-red-950/40' };
      default:
        return { label: isRo ? 'Mediu' : 'Medium', color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' };
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99995 }}
      className="fixed inset-0 z-[99995] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      {/* Celebration Popup Toast */}
      {claimCelebration && (
        <div
          style={{ zIndex: 99999 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-gradient-to-r from-amber-900 via-[#3a200a] to-amber-950 border-2 border-yellow-400 text-yellow-200 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.6)] font-cinzel font-bold text-center text-sm sm:text-base animate-bounce flex items-center gap-2"
        >
          <span className="text-xl">✨🪙</span>
          <span>{claimCelebration}</span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-gradient-to-b from-[#1c140d] via-[#150f09] to-[#0e0a06] border-2 border-[#e8c84a]/70 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-900/40 bg-gradient-to-r from-[#2a1708] via-[#1a0f05] to-[#2a1708]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-900 flex items-center justify-center text-2xl shadow-lg border border-yellow-400/50">
              🎯
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-amber-300 font-cinzel tracking-wide flex items-center gap-2">
                <span>{isRo ? 'Misiuni Zilnice Călugărești' : 'Daily Monastic Quests'}</span>
                <span className="text-xs font-mono font-bold bg-amber-950 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full">
                  {completedCount}/3 {isRo ? 'Gata' : 'Done'}
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-barlow">
                {isRo
                  ? '3 sarcini noi în fiecare zi la 00:00 (Ora României) cu răsplată în Bănuți Turmentați 🍺🪙'
                  : '3 fresh tasks every day at 12:00 AM (Romania Time) rewarding Drunken Coins 🍺🪙'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Drunken Coins Treasury Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-xs font-mono font-bold text-yellow-300">
              <span>🍺🪙</span>
              <span>{drunkenCoins.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center font-bold text-lg transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Countdown & Reset Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#120c07] border-b border-stone-800 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="text-amber-400 animate-pulse text-sm">⏳</span>
            <span className="font-cinzel text-amber-200/90 font-bold">
              {isRo ? 'Resetare la miezul nopții:' : 'Midnight Reset:'}
            </span>
            <span className="font-mono font-black text-yellow-400 text-sm bg-black/50 px-2.5 py-0.5 rounded-lg border border-amber-500/30 tracking-wider">
              {timeUntilQuestReset.formatted}
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              ({isRo ? '12:00 AM Ora României / UTC+3' : '12:00 AM Romania Time / UTC+3'})
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1 rounded-lg text-xs font-cinzel font-bold transition-all ${
                activeTab === 'today'
                  ? 'bg-amber-900/80 text-yellow-300 border border-amber-500/50 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🎯 {isRo ? 'Misiuni Astăzi' : 'Today Quests'} ({completedCount}/3)
            </button>
            <button
              onClick={() => setActiveTab('codex')}
              className={`px-3 py-1 rounded-lg text-xs font-cinzel font-bold transition-all ${
                activeTab === 'codex'
                  ? 'bg-amber-900/80 text-yellow-300 border border-amber-500/50 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              📜 {isRo ? 'Codex (36 Misiuni)' : 'Codex (36 Quests)'}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar">
          {activeTab === 'today' ? (
            <>
              {/* Grand Daily Completion Bonus Chest */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  dailyQuestPool.bonusClaimed
                    ? 'bg-stone-900/60 border-stone-800 opacity-75'
                    : allCompleted
                    ? 'bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.3)]'
                    : 'bg-stone-950/80 border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl ${
                        allCompleted && !dailyQuestPool.bonusClaimed
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-600 animate-pulse text-white shadow-lg'
                          : 'bg-stone-900 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {dailyQuestPool.bonusClaimed ? '🏆' : '🎁'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-amber-300 font-cinzel">
                          {isRo ? 'Cufărul Suprem al Zilei (+50 🍺🪙)' : 'Daily Master Chest (+50 🍺🪙)'}
                        </h3>
                        {dailyQuestPool.bonusClaimed && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            {isRo ? 'REVENDICAT ✅' : 'CLAIMED ✅'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 font-barlow">
                        {isRo
                          ? 'Finalizează toate cele 3 misiuni zilnice pentru a debloca bonusul suprem de 50 de Bănuți!'
                          : 'Complete all 3 daily quests to unlock the ultimate 50 Drunken Coins bonus!'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {!dailyQuestPool.bonusClaimed && (
                      <button
                        disabled={!canClaimBonus}
                        onClick={handleClaimBonus}
                        className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md ${
                          canClaimBonus
                            ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:brightness-125 text-black font-black active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.5)] cursor-pointer'
                            : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <span>🎁</span>
                        <span>{canClaimBonus ? (isRo ? 'Revendică +50 🪙' : 'Claim +50 🪙') : `${completedCount}/3 ${isRo ? 'Finalizate' : 'Completed'}`}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Active Daily Quests */}
              <div className="space-y-3">
                {activeDailyQuests.map((quest, idx) => {
                  const catBadge = getCategoryBadge(quest.category);
                  const diffBadge = getDifficultyBadge(quest.difficulty);
                  const progressPct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
                  const canClaim = quest.completed && !quest.claimed;

                  return (
                    <div
                      key={quest.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        quest.claimed
                          ? 'bg-[#120d08]/80 border-emerald-900/40 opacity-80'
                          : quest.completed
                          ? 'bg-gradient-to-r from-[#261608] via-[#1e1106] to-[#261608] border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : 'bg-[#150f09] border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Quest Icon */}
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border ${
                              quest.claimed
                                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                                : quest.completed
                                ? 'bg-amber-950 border-amber-400 text-yellow-300 shadow-md'
                                : 'bg-stone-900 border-stone-800 text-stone-300'
                            }`}
                          >
                            {quest.claimed ? '✅' : quest.icon}
                          </div>

                          {/* Quest Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.color}`}>
                                {catBadge.label}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffBadge.color}`}>
                                {diffBadge.label}
                              </span>
                              <span className="text-xs font-mono font-bold text-[#ffd700] ml-auto">
                                +{quest.coinReward} 🍺🪙
                              </span>
                            </div>

                            <h4 className="text-sm sm:text-base font-bold text-amber-200 font-cinzel">
                              {isRo ? quest.titleRo : quest.titleEn}
                            </h4>
                            <p className="text-xs text-stone-400 font-barlow mt-0.5">
                              {isRo ? quest.descRo : quest.descEn}
                            </p>

                            {/* Progress Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                                <span>{isRo ? 'Progres:' : 'Progress:'}</span>
                                <span className="font-bold text-amber-300">
                                  {quest.progress} / {quest.target} {isRo ? (quest.unitRo || '') : (quest.unitEn || '')} ({progressPct}%)
                                </span>
                              </div>

                              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-stone-800 p-0.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    quest.claimed
                                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                      : quest.completed
                                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 animate-pulse'
                                      : 'bg-gradient-to-r from-amber-700 to-amber-500'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action / Claim Button */}
                        <div className="flex items-center self-center flex-shrink-0">
                          {quest.claimed ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-cinzel font-bold">
                              {isRo ? 'Revendicat ✅' : 'Claimed ✅'}
                            </span>
                          ) : canClaim ? (
                            <button
                              onClick={() => handleClaim(quest.id, quest.coinReward)}
                              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:brightness-125 text-black font-cinzel font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(234,179,8,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 animate-bounce"
                            >
                              <span>🎁</span>
                              <span>{isRo ? 'Revendică' : 'Claim'}</span>
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 text-xs font-mono font-semibold">
                              {quest.progress}/{quest.target}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* CODEX / ALL 36 QUESTS ARCHIVE */
            <div className="space-y-3">
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                📖 {isRo
                  ? 'Acesta este Marele Codex Monahal ce conține toate cele 36 de Misiuni Posibile. În fiecare zi la 00:00 (Ora României), sistemul alege automat 3 misiuni randomizate și diversificate!'
                  : 'This is the Grand Monastic Codex containing all 36 possible daily quests. Every day at 12:00 AM (Romania Time), 3 diverse randomized tasks are selected!'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DAILY_QUEST_DEFINITIONS.map((q) => {
                  const catBadge = getCategoryBadge(q.category);
                  const diffBadge = getDifficultyBadge(q.difficulty);

                  return (
                    <div
                      key={q.id}
                      className="p-3 bg-[#150f09] border border-stone-800 rounded-xl hover:border-amber-500/40 transition-all flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-xl flex-shrink-0">
                        {q.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catBadge.color}`}>
                            {catBadge.label}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${diffBadge.color}`}>
                            {diffBadge.label}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-yellow-300 ml-auto">
                            +{q.coinReward} 🪙
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-amber-200 font-cinzel truncate">
                          {isRo ? q.titleRo : q.titleEn}
                        </h5>
                        <p className="text-[11px] text-stone-400 font-barlow mt-0.5 line-clamp-2">
                          {isRo ? q.descRo : q.descEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#120c07] border-t border-stone-800 flex items-center justify-between gap-3">
          {onOpenBazaar ? (
            <button
              onClick={() => {
                onClose();
                onOpenBazaar();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950 to-[#261509] border border-yellow-500/50 text-xs font-cinzel font-bold text-yellow-300 hover:brightness-125 transition-all flex items-center gap-1.5"
            >
              <span>🏺</span>
              <span>{isRo ? 'Cheltuiește la Bazar' : 'Spend at Bazaar'}</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-stone-200 font-cinzel font-bold text-xs sm:text-sm border border-stone-700 shadow active:scale-95 transition-all"
          >
            {isRo ? 'Închide' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
