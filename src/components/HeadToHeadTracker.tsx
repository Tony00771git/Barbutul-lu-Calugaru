import React, { useMemo } from 'react';
import { getHeadToHeadStats, PlayerHeadToHeadStats } from '../lib/headToHeadService';
import { AvatarDisplay } from './AvatarDisplay';

interface HeadToHeadTrackerProps {
  player1: { name: string; avatarIcon?: string; color?: string };
  player2: { name: string; avatarIcon?: string; color?: string };
  variant?: 'banner' | 'compact' | 'hud';
  currentMode?: 'pineapple' | 'duel' | 'casino' | 'boardgame' | 'normal';
  className?: string;
}

export const HeadToHeadTracker: React.FC<HeadToHeadTrackerProps> = ({
  player1,
  player2,
  variant = 'banner',
  currentMode = 'pineapple',
  className = '',
}) => {
  const stats: PlayerHeadToHeadStats = useMemo(() => {
    return getHeadToHeadStats(player1.name, player2.name);
  }, [player1.name, player2.name]);

  const p1Wins = stats.player1Wins;
  const p2Wins = stats.player2Wins;
  const p1Pts = stats.player1Points || 0;
  const p2Pts = stats.player2Points || 0;
  const total = stats.totalMatches;

  const isLeaderP1 = p1Wins > p2Wins;
  const isLeaderP2 = p2Wins > p1Wins;
  const isTied = p1Wins === p2Wins;

  const hasHistory = total > 0 || p1Pts > 0 || p2Pts > 0;

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-2 bg-[#120d08]/90 border border-[#e8c84a]/40 px-3 py-1 rounded-xl text-xs font-cinzel shadow-sm ${className}`}
      >
        <span className="text-amber-400 font-bold">⚔️ 1v1 H2H:</span>
        <span className="text-[#f0ebe0] font-bold truncate max-w-[80px]">{player1.name}</span>
        <span className="bg-[#24170e] px-2 py-0.5 rounded-md border border-[#e8c84a]/50 text-[#ffd700] font-black">
          {p1Wins} - {p2Wins}
        </span>
        <span className="text-[#f0ebe0] font-bold truncate max-w-[80px]">{player2.name}</span>
        {(p1Pts > 0 || p2Pts > 0) && (
          <span className="bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-barlow font-bold">
            Puncte: {p1Pts} - {p2Pts}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'hud') {
    return (
      <div
        className={`flex items-center justify-between gap-2 bg-gradient-to-r from-[#1a1109]/90 via-[#26180c]/90 to-[#1a1109]/90 border border-[#e8c84a]/50 px-3 py-1.5 rounded-xl text-xs font-cinzel shadow-md ${className}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-amber-400 text-sm">⚔️</span>
          <span className="text-gray-300 text-[11px] uppercase tracking-wider font-bold">
            Palmares Direct:
          </span>
        </div>

        <div className="flex items-center gap-2 font-bold">
          <span className={`text-xs ${isLeaderP1 ? 'text-[#ffd700] font-black' : 'text-gray-300'}`}>
            {player1.name} <span className="text-[#ffd700]">({p1Wins})</span>
          </span>
          <span className="text-[#e05c3a] font-black text-sm">⚔️</span>
          <span className={`text-xs ${isLeaderP2 ? 'text-[#ffd700] font-black' : 'text-gray-300'}`}>
            <span className="text-[#ffd700]">({p2Wins})</span> {player2.name}
          </span>
        </div>

        {(p1Pts > 0 || p2Pts > 0) && (
          <div className="text-[10px] text-[#ffd700] font-barlow font-bold bg-[#140d07] px-2 py-0.5 rounded border border-amber-500/30 hidden sm:block">
            Puncte: {p1Pts} - {p2Pts}
          </div>
        )}
      </div>
    );
  }

  // DEFAULT VARIANT: 'banner' (Used when entering rooms / lobby / setup)
  return (
    <div
      className={`bg-gradient-to-b from-[#1c1209] via-[#140d07] to-[#1a1008] border-2 border-[#e8c84a]/60 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${className}`}
    >
      {/* Background Medieval Watermark / Crest */}
      <div className="absolute -right-6 -bottom-6 text-7xl opacity-5 pointer-events-none select-none">
        ⚔️
      </div>

      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-pulse">⚔️</span>
          <span className="font-cinzel font-black text-xs sm:text-sm text-[#ffd700] uppercase tracking-wider gold-text-glow">
            Palmares Direct 1v1 (Head-to-Head Tracker)
          </span>
        </div>
        <div className="text-[10px] sm:text-xs font-barlow px-2 py-0.5 rounded-full bg-[#2a1d10] border border-[#e8c84a]/40 text-[#e8c84a] font-bold">
          {total > 0 ? `${total} Meciuri Jucate` : 'Prima Înfruntare'}
        </div>
      </div>

      {/* Rivalry Score Display */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 my-1">
        {/* Player 1 Card */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#26170c] border-2 border-[#ffd700] p-0.5 relative flex-shrink-0 shadow-md">
            <AvatarDisplay avatarId={player1.avatarIcon || 'monk_drunk'} className="w-full h-full" />
            {isLeaderP1 && (
              <span className="absolute -top-2 -left-2 text-xs bg-[#ffd700] text-black rounded-full px-1 font-black shadow">
                👑
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-cinzel font-bold text-xs sm:text-sm text-[#f0ebe0] truncate">
              {player1.name}
            </div>
            <div className="text-[10px] font-barlow text-gray-400">
              Victorii: <b className="text-[#ffd700]">{p1Wins}</b>
              {p1Pts > 0 && <span className="ml-1 text-amber-300">({p1Pts} pct)</span>}
            </div>
          </div>
        </div>

        {/* Center Score Badge */}
        <div className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-[#0d0905] border border-[#ffd700]/50 shadow-inner flex-shrink-0">
          <div className="flex items-center gap-2 font-bebas text-2xl sm:text-3xl font-black leading-none">
            <span className={isLeaderP1 ? 'text-[#ffd700] gold-text-glow' : 'text-gray-300'}>
              {p1Wins}
            </span>
            <span className="text-[#e05c3a] text-lg font-cinzel">⚔️</span>
            <span className={isLeaderP2 ? 'text-[#ffd700] gold-text-glow' : 'text-gray-300'}>
              {p2Wins}
            </span>
          </div>
          <div className="text-[9px] font-cinzel uppercase text-gray-400 tracking-wider mt-0.5">
            {isTied ? 'Egalitate' : isLeaderP1 ? `${player1.name} Conduce` : `${player2.name} Conduce`}
          </div>
        </div>

        {/* Player 2 Card */}
        <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
          <div className="min-w-0">
            <div className="font-cinzel font-bold text-xs sm:text-sm text-[#f0ebe0] truncate">
              {player2.name}
            </div>
            <div className="text-[10px] font-barlow text-gray-400">
              {p2Pts > 0 && <span className="mr-1 text-amber-300">({p2Pts} pct)</span>}
              Victorii: <b className="text-[#ffd700]">{p2Wins}</b>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#26170c] border-2 border-[#e05c3a] p-0.5 relative flex-shrink-0 shadow-md">
            <AvatarDisplay avatarId={player2.avatarIcon || 'knight'} className="w-full h-full" />
            {isLeaderP2 && (
              <span className="absolute -top-2 -right-2 text-xs bg-[#ffd700] text-black rounded-full px-1 font-black shadow">
                👑
              </span>
            )}
          </div>
        </div>
      </div>

      {/* All-time Points Bar if points recorded */}
      {(p1Pts > 0 || p2Pts > 0) && (
        <div className="mt-2.5 bg-[#0a0704] border border-[#ffd700]/30 rounded-xl p-2 flex items-center justify-between text-xs font-cinzel">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
            🏆 Puncte All-Time 1v1:
          </span>
          <div className="flex items-center gap-2 font-bold font-bebas text-base">
            <span className="text-[#ffd700]">{player1.name}: {p1Pts} pct</span>
            <span className="text-gray-500 font-cinzel text-xs">vs</span>
            <span className="text-[#e05c3a]">{player2.name}: {p2Pts} pct</span>
          </div>
        </div>
      )}

      {/* Mode Specific Breakdown Chips */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-cinzel">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400">Palmares pe Moduri:</span>
          <span className="px-2 py-0.5 rounded-md bg-[#24170d] border border-amber-500/30 text-amber-300">
            🍍 Pineapple: <b>{stats.modeBreakdown.pineapple.p1} - {stats.modeBreakdown.pineapple.p2}</b>
            {(stats.modeBreakdown.pineapple.p1Points > 0 || stats.modeBreakdown.pineapple.p2Points > 0) && (
              <span className="text-[9px] text-gray-400 ml-1">
                ({stats.modeBreakdown.pineapple.p1Points}p - {stats.modeBreakdown.pineapple.p2Points}p)
              </span>
            )}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#24170d] border border-amber-500/30 text-amber-300">
            ⚔️ Duel: <b>{stats.modeBreakdown.duel.p1} - {stats.modeBreakdown.duel.p2}</b>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#24170d] border border-red-500/30 text-red-300">
            🎲 Cazino: <b>{stats.modeBreakdown.casino.p1} - {stats.modeBreakdown.casino.p2}</b>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#24170d] border border-blue-500/30 text-blue-300">
            🏰 Monopoly: <b>{stats.modeBreakdown.boardgame.p1} - {stats.modeBreakdown.boardgame.p2}</b>
          </span>
        </div>

        {/* Motivational Status Callout */}
        <div className="text-[10px] text-[#ffd700] font-barlow italic">
          {!hasHistory
            ? '🔥 Prima confruntare directă! Cine dă tonul rivalității?'
            : isLeaderP1
            ? `👑 ${player1.name} domină confruntarea (+${p1Wins - p2Wins})`
            : isLeaderP2
            ? `👑 ${player2.name} domină confruntarea (+${p2Wins - p1Wins})`
            : '⚖️ Rivalitate echilibrată la milimetru!'}
        </div>
      </div>
    </div>
  );
};
