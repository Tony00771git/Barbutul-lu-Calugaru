import React, { useEffect } from 'react';
import { Player, GameMode } from '../types';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';

interface PodiumProps {
  mode: GameMode;
  players: Player[];
  onPlayAgain: () => void;
  onHome?: () => void;
}

export const Podium: React.FC<PodiumProps> = ({ mode, players, onPlayAgain, onHome }) => {
  const { t, batchUpdateProfiles } = useApp();

  // Save profile stats once on render
  useEffect(() => {
    const stats = players
      .filter(p => !!p.name)
      .map(p => ({
        name: p.name,
        sips: p.sipsTotal,
        chugs: p.chugsTotal,
      }));

    if (stats.length > 0) {
      batchUpdateProfiles(stats);
    }
  }, []);

  // Sort players depending on mode
  const sortedPlayers = [...players].sort((a, b) => {
    if (mode === 'normal') {
      const scoreA = a.sipsTotal + 25 * a.chugsTotal;
      const scoreB = b.sipsTotal + 25 * b.chugsTotal;
      return scoreB - scoreA; // Highest score first
    } else if (mode === 'duel') {
      const scoreA = a.sipsTotal + 25 * a.chugsTotal;
      const scoreB = b.sipsTotal + 25 * b.chugsTotal;
      return scoreA - scoreB; // Fewest drinks = Winner in duel!
    } else {
      // Boardgame
      if (a.hasGivenUp && !b.hasGivenUp) return 1;
      if (!a.hasGivenUp && b.hasGivenUp) return -1;
      if (b.gold !== a.gold) return b.gold - a.gold;
      return b.properties.length - a.properties.length;
    }
  });

  // Calculate Kings & Awards for Normal Mode
  const maxSips = Math.max(...players.map(p => p.sipsTotal));
  const maxChugs = Math.max(...players.map(p => p.chugsTotal));
  const minSips = Math.min(...players.map(p => p.sipsTotal));
  const maxPasses = Math.max(...players.map(p => p.passesCount));

  const kingOfSipsPlayers = players.filter(p => p.sipsTotal === maxSips && maxSips > 0);
  const kingOfChugsPlayers = players.filter(p => p.chugsTotal === maxChugs && maxChugs > 0);
  const luckyLoserPlayers = players.filter(p => p.sipsTotal === minSips);
  const biggestFoolPlayers = players.filter(p => p.passesCount === maxPasses && maxPasses > 0);

  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-6 max-w-xl mx-auto space-y-6 select-none">
      <div className="text-center space-y-1 animate-fade-in">
        <div className="text-5xl mb-1">👑 🏆 🍺</div>
        <h1 className="text-3xl font-cinzel font-black text-[#e8c84a] gold-text-glow tracking-wide">
          {t('podiumTitle')}
        </h1>
        <p className="text-xs font-barlow text-gray-400 uppercase tracking-widest">
          {mode === 'normal' ? 'Modul Normal (Zaruri)' : mode === 'duel' ? '⚔️ Modul Duel 1v1 (Trivia)' : 'Modul Boardgame (Aventură)'}
        </p>
      </div>

      {/* Top 3 Visual Podium */}
      <div className="w-full grid grid-cols-3 gap-2 items-end justify-center pt-8 pb-4">
        {/* Rank 2 (Left) */}
        {top2 && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] border-2 border-slate-300 overflow-hidden shadow-md mb-1">
              <AvatarDisplay avatarId={top2.avatarIcon} className="w-full h-full" />
            </div>
            <div className="text-xs font-cinzel font-bold text-[#f0ebe0] truncate max-w-[90px]">
              {top2.name}
            </div>
            <div className="text-[10px] text-gray-400 font-barlow text-center">
              {mode === 'normal' || mode === 'duel'
                ? `${top2.sipsTotal} guri | ${top2.chugsTotal} gropi (${top2.sipsTotal + 25 * top2.chugsTotal} pt)`
                : `${top2.gold} 🪙`}
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-[#2a2a2a] to-[#3a3a3a] border-t-2 border-slate-300 rounded-t-xl flex flex-col items-center justify-center mt-2 shadow-lg">
              <span className="text-2xl font-cinzel font-bold text-slate-300">🥈</span>
              <span className="text-xs font-bebas text-slate-300">2ND</span>
            </div>
          </div>
        )}

        {/* Rank 1 (Center) */}
        {top1 && (
          <div className="flex flex-col items-center animate-bounce">
            <div className="w-14 h-14 rounded-2xl bg-[#2a1e0f] border-2 border-[#ffd700] overflow-hidden shadow-xl gold-glow mb-1">
              <AvatarDisplay avatarId={top1.avatarIcon} className="w-full h-full" />
            </div>
            <div className="text-sm font-cinzel font-bold text-[#e8c84a] gold-text-glow truncate max-w-[100px]">
              {top1.name}
            </div>
            <div className="text-xs text-[#e8c84a] font-barlow font-bold text-center">
              {mode === 'normal' || mode === 'duel'
                ? `${top1.sipsTotal} guri | ${top1.chugsTotal} gropi (${top1.sipsTotal + 25 * top1.chugsTotal} pt)`
                : `${top1.gold} 🪙`}
            </div>
            <div className="w-full h-32 bg-gradient-to-t from-[#e8c84a]/40 to-[#e8c84a] border-t-2 border-[#ffd700] rounded-t-xl flex flex-col items-center justify-center mt-2 gold-glow">
              <span className="text-3xl font-cinzel font-bold text-black">🥇</span>
              <span className="text-sm font-bebas text-black font-bold">REGELE / KING</span>
            </div>
          </div>
        )}

        {/* Rank 3 (Right) */}
        {top3 && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-11 h-11 rounded-2xl bg-[#1e150f] border-2 border-amber-700 overflow-hidden shadow-md mb-1">
              <AvatarDisplay avatarId={top3.avatarIcon} className="w-full h-full" />
            </div>
            <div className="text-xs font-cinzel font-bold text-[#f0ebe0] truncate max-w-[90px]">
              {top3.name}
            </div>
            <div className="text-[10px] text-gray-400 font-barlow text-center">
              {mode === 'normal' || mode === 'duel'
                ? `${top3.sipsTotal} guri | ${top3.chugsTotal} gropi (${top3.sipsTotal + 25 * top3.chugsTotal} pt)`
                : `${top3.gold} 🪙`}
            </div>
            <div className="w-full h-20 bg-gradient-to-t from-[#2a1a12] to-[#3d2417] border-t-2 border-amber-700 rounded-t-xl flex flex-col items-center justify-center mt-2 shadow-lg">
              <span className="text-xl font-cinzel font-bold text-amber-600">🥉</span>
              <span className="text-xs font-bebas text-amber-600">3RD</span>
            </div>
          </div>
        )}
      </div>

      {/* Special Category Badges (Normal Mode) */}
      {mode === 'normal' && (
        <div className="w-full grid grid-cols-2 gap-2">
          {kingOfSipsPlayers.length > 0 && (
            <div className="bg-[#161616] border border-[#e8c84a] rounded-xl p-2.5 flex items-center gap-2 gold-glow">
              <span className="text-2xl">🍺</span>
              <div>
                <div className="text-[10px] font-cinzel text-gray-400 uppercase">{t('kingOfSips')}</div>
                <div className="text-xs font-cinzel font-bold text-[#e8c84a]">
                  {kingOfSipsPlayers.map(p => p.name).join(', ')} ({maxSips})
                </div>
              </div>
            </div>
          )}

          {kingOfChugsPlayers.length > 0 && (
            <div className="bg-[#161616] border border-[#e05c3a] rounded-xl p-2.5 flex items-center gap-2 flame-glow">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="text-[10px] font-cinzel text-gray-400 uppercase">{t('kingOfChugs')}</div>
                <div className="text-xs font-cinzel font-bold text-[#e05c3a]">
                  {kingOfChugsPlayers.map(p => p.name).join(', ')} ({maxChugs})
                </div>
              </div>
            </div>
          )}

          {luckyLoserPlayers.length > 0 && (
            <div className="bg-[#161616] border border-green-500 rounded-xl p-2.5 flex items-center gap-2">
              <span className="text-2xl">🍀</span>
              <div>
                <div className="text-[10px] font-cinzel text-gray-400 uppercase">{t('luckyLoser')}</div>
                <div className="text-xs font-cinzel font-bold text-green-400">
                  {luckyLoserPlayers.map(p => p.name).join(', ')} ({minSips})
                </div>
              </div>
            </div>
          )}

          {biggestFoolPlayers.length > 0 && (
            <div className="bg-[#161616] border border-purple-500 rounded-xl p-2.5 flex items-center gap-2">
              <span className="text-2xl">🤡</span>
              <div>
                <div className="text-[10px] font-cinzel text-gray-400 uppercase">{t('biggestFool')}</div>
                <div className="text-xs font-cinzel font-bold text-purple-400">
                  {biggestFoolPlayers.map(p => p.name).join(', ')} ({maxPasses} pass)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider">
            {t('fullRanking')}
          </h3>
          <span className="text-[10px] font-barlow text-gray-400">
            Gură = 1p • Groapă = 25p
          </span>
        </div>

        <div className="space-y-2">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`p-3 rounded-xl border flex items-center justify-between font-barlow text-sm ${
                idx === 0
                  ? 'border-[#e8c84a] bg-[#221f18] gold-glow'
                  : 'border-[#2a2a2a] bg-[#121212]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bebas text-lg text-[#e8c84a] w-5">#{idx + 1}</span>
                <div className="w-9 h-9 rounded-xl bg-[#22180f] border border-[#e8c84a]/40 overflow-hidden flex-shrink-0">
                  <AvatarDisplay avatarId={p.avatarIcon} className="w-full h-full" />
                </div>
                <div>
                  <div className="font-cinzel font-bold text-[#f0ebe0]">
                    {p.name} {p.hasGivenUp && ' (Abandon)'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {mode === 'normal'
                      ? `${p.sipsTotal} guri | ${p.chugsTotal} gropi`
                      : mode === 'duel'
                      ? `${p.sipsTotal} guri băute ${p.chugsTotal > 0 ? `| ${p.chugsTotal} chugs` : ''}`
                      : `${p.gold} galbeni | ${p.properties.length} proprietăți`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-cinzel font-bold text-sm text-[#e8c84a]">
                  {mode === 'normal' || mode === 'duel' ? `${p.sipsTotal + 25 * p.chugsTotal} pt` : `${p.gold} pt`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e8c84a] to-[#ffd700] text-black font-cinzel font-black text-xl hover:brightness-110 gold-glow transition-all active:scale-98 shadow-lg uppercase"
        >
          {t('playAgainBtn')}
        </button>

        {onHome && (
          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl bg-[#1e150f] border border-[#e8c84a]/50 text-[#ffd700] font-cinzel font-bold text-sm hover:bg-[#2b1d14] transition-all active:scale-98"
          >
            🏠 Meniul Principal (Toate Modurile)
          </button>
        )}
      </div>
    </div>
  );
};
