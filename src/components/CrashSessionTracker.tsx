import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Flame, Award, ChevronDown, ChevronUp, ShieldCheck, Skull, X, BarChart3, Zap } from 'lucide-react';
import { Language } from '../types';

export interface CrashSessionRoundRecord {
  roundNumber: number;
  stakeType: 'guri' | 'groapa';
  betValue: number;
  crashPoint: number;
  myCashedOutAt: number | null;
  myScore: number;
  mySipsDrank: number;
  myGroapaDrank: number;
  opponentsSipsDrank: number;
  netSipsDelta: number;
  wonRound: boolean;
  timestamp: number;
}

interface CrashSessionTrackerProps {
  records: CrashSessionRoundRecord[];
  currentRoundNumber: number;
  language: Language;
  totalGuriAcumulate: number;
  totalGroapaAcumulate: number;
  sipsThreshold: number;
  groapaThreshold: number;
  isGroapaMode: boolean;
}

export const CrashSessionTracker: React.FC<CrashSessionTrackerProps> = ({
  records,
  currentRoundNumber,
  language,
  totalGuriAcumulate,
  totalGroapaAcumulate,
  sipsThreshold,
  groapaThreshold,
  isGroapaMode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Compute aggregate metrics
  const totalRounds = records.length;
  const cashedOutRounds = records.filter(r => r.myCashedOutAt != null).length;
  const crashedRounds = records.filter(r => r.myCashedOutAt == null).length;
  const winRate = totalRounds > 0 ? Math.round((cashedOutRounds / totalRounds) * 100) : 0;

  const totalSipsInflicted = records.reduce((sum, r) => sum + (r.opponentsSipsDrank || 0), 0);
  const totalSipsDrank = totalGuriAcumulate; // Accurate from live room state
  const netSipsProfit = totalSipsInflicted - totalSipsDrank;

  const successfulMultipliers = records
    .map(r => r.myCashedOutAt)
    .filter((m): m is number => m != null && m > 0);

  const bestMultiplier = successfulMultipliers.length > 0 ? Math.max(...successfulMultipliers) : null;
  const avgMultiplier = successfulMultipliers.length > 0
    ? (successfulMultipliers.reduce((a, b) => a + b, 0) / successfulMultipliers.length).toFixed(2)
    : null;

  // Compute current win streak
  let currentStreak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].myCashedOutAt != null) {
      currentStreak++;
    } else {
      break;
    }
  }

  const isNetPositive = netSipsProfit > 0;
  const isNetNeutral = netSipsProfit === 0;

  return (
    <div className="w-full bg-[#110e17]/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-xl transition-all">
      {/* Mini / Compact Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Net Profit / Loss Highlight Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-mono font-black text-xs sm:text-sm shadow-sm transition-all ${
              isNetPositive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-900/30'
                : isNetNeutral
                ? 'bg-stone-900/90 text-stone-300 border-stone-700'
                : 'bg-red-950/80 text-red-300 border-red-500/50 shadow-red-900/30'
            }`}
          >
            {isNetPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : isNetNeutral ? (
              <BarChart3 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-sans font-bold block sm:hidden">
                {language === 'ro' ? 'P/L Net' : 'Net P/L'}
              </span>
              <span>
                {netSipsProfit > 0 ? `+${netSipsProfit.toFixed(1)}` : netSipsProfit.toFixed(1)}{' '}
                <span className="text-[10px] font-sans font-normal text-amber-200">
                  {language === 'ro' ? 'guri net' : 'sips net'}
                </span>
              </span>
            </div>
          </div>

          {/* Win Rate Pill */}
          <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-700/80 px-2 py-1 rounded-xl text-[11px] font-medium text-stone-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {language === 'ro' ? 'Rată:' : 'Rate:'}{' '}
              <strong className="text-amber-300 font-mono font-bold">
                {totalRounds > 0 ? `${winRate}%` : '—'}
              </strong>
            </span>
            <span className="text-[10px] text-stone-500 hidden sm:inline">
              ({cashedOutRounds}/{totalRounds})
            </span>
          </div>

          {/* Current Cashout Streak */}
          {currentStreak >= 2 && (
            <div className="flex items-center gap-1 bg-amber-950/70 border border-amber-500/40 px-2 py-1 rounded-xl text-[11px] font-black text-amber-300 animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{currentStreak}x {language === 'ro' ? 'salvări' : 'streak'}</span>
            </div>
          )}

          {/* Best Multiplier */}
          {bestMultiplier && (
            <div className="hidden md:flex items-center gap-1 bg-stone-900/90 border border-stone-700 px-2 py-1 rounded-xl text-[11px] text-stone-300">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                {language === 'ro' ? 'Top:' : 'Best:'}{' '}
                <strong className="text-yellow-300 font-mono font-bold">x{bestMultiplier.toFixed(2)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Right: Recent rounds spark dots + Toggle Details Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mini outcome dots for last 5 rounds */}
          {records.length > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded-lg border border-stone-800 hidden sm:flex">
              {records.slice(-5).map((r, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    r.myCashedOutAt != null
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  }`}
                  title={`${language === 'ro' ? 'Runda' : 'Round'} ${r.roundNumber}: ${
                    r.myCashedOutAt != null ? `Salvat la x${r.myCashedOutAt.toFixed(2)}` : 'Prăbușit'
                  }`}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-amber-500/30 text-amber-300 text-[11px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <span>📊 {language === 'ro' ? 'Detalii Sesiune' : 'Session Stats'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown Drawer / Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden pt-3 mt-2.5 border-t border-stone-800/80"
          >
            {/* 4 Stats Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl text-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
                  ⚔️ {language === 'ro' ? 'Guri Date' : 'Sips Dealt'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                  +{totalSipsInflicted.toFixed(1)}
                </span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl text-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
                  🛡️ {language === 'ro' ? 'Guri Băute' : 'Sips Taken'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-red-400">
                  -{totalSipsDrank.toFixed(1)}
                </span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl text-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
                  🚀 {language === 'ro' ? 'Cota Medie' : 'Avg Cashout'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                  {avgMultiplier ? `x${avgMultiplier}` : '—'}
                </span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl text-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
                  🏆 {language === 'ro' ? 'Top Cotă' : 'Peak Multiplier'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-yellow-400">
                  {bestMultiplier ? `x${bestMultiplier.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>

            {/* Round-by-Round Ledger Table */}
            <div className="bg-black/50 border border-stone-800/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700">
              <div className="text-[10px] font-bold text-stone-400 uppercase bg-stone-900/80 px-3 py-1.5 border-b border-stone-800 grid grid-cols-5 text-center">
                <span className="text-left">{language === 'ro' ? 'Rundă' : 'Round'}</span>
                <span>{language === 'ro' ? 'Miză' : 'Stake'}</span>
                <span>Crash</span>
                <span>Cash Out</span>
                <span className="text-right">{language === 'ro' ? 'P/L Rundă' : 'Round P/L'}</span>
              </div>

              {records.length === 0 ? (
                <div className="p-3 text-center text-xs text-stone-500 italic">
                  {language === 'ro'
                    ? 'Nicio rundă încheiată încă în această sesiune.'
                    : 'No completed rounds yet in this session.'}
                </div>
              ) : (
                <div className="divide-y divide-stone-800/40">
                  {records.map((r, idx) => {
                    const isSuccess = r.myCashedOutAt != null;
                    const deltaPositive = r.netSipsDelta > 0;
                    const deltaNeutral = r.netSipsDelta === 0;

                    return (
                      <div
                        key={idx}
                        className="px-3 py-1.5 text-xs grid grid-cols-5 text-center items-center hover:bg-stone-900/40 transition-colors"
                      >
                        <span className="text-left font-mono font-bold text-stone-300">
                          #{r.roundNumber}
                        </span>

                        <span className="text-[11px] font-bold">
                          {r.stakeType === 'groapa' ? (
                            <span className="text-red-400 font-black">🕳️ Groapă</span>
                          ) : (
                            <span className="text-amber-300">{r.betValue} guri</span>
                          )}
                        </span>

                        <span className="font-mono text-stone-400 text-[11px]">
                          x{r.crashPoint.toFixed(2)}
                        </span>

                        <span>
                          {isSuccess ? (
                            <span className="font-mono font-bold text-emerald-400 text-[11px] bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              x{r.myCashedOutAt?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30">
                              💥 Crash
                            </span>
                          )}
                        </span>

                        <span
                          className={`text-right font-mono font-bold text-[11px] ${
                            deltaPositive
                              ? 'text-emerald-400'
                              : deltaNeutral
                              ? 'text-stone-400'
                              : 'text-red-400'
                          }`}
                        >
                          {deltaPositive ? `+${r.netSipsDelta.toFixed(1)}` : deltaNeutral ? '0' : r.netSipsDelta.toFixed(1)}{' '}
                          <span className="text-[9px] font-sans font-normal text-stone-500">🍺</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
