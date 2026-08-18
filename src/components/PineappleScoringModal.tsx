import React from 'react';
import {
  PineappleHandResult,
  PineappleMatchSettings,
  PineapplePlayerState,
} from '../types';
import { PineappleBoardView } from './PineappleBoardView';

interface PineappleScoringModalProps {
  isOpen: boolean;
  result: PineappleHandResult;
  playerA: PineapplePlayerState;
  playerB: PineapplePlayerState;
  settings: PineappleMatchSettings;
  isHost: boolean;
  language?: 'ro' | 'en';
  onNextHand: () => void;
}

export const PineappleScoringModal: React.FC<PineappleScoringModalProps> = ({
  isOpen,
  result,
  playerA,
  playerB,
  settings,
  isHost,
  language = 'ro',
  onNextHand,
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'boards'>('overview');

  if (!isOpen || !result) return null;

  const isFoulA = result.foulA;
  const isFoulB = result.foulB;

  return (
    <div
      style={{ zIndex: 99995 }}
      className="fixed inset-0 z-[99995] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1c130a] via-[#120c06] to-[#0a0704] border-2 border-[#ffd700] rounded-3xl p-3 sm:p-4 max-w-3xl w-full shadow-[0_0_50px_rgba(255,215,0,0.3)] space-y-3 max-h-[92vh] overflow-y-auto gold-glow"
      >
        {/* Modal Header & View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d1e11] pb-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-cinzel font-black">
              <span>🍍 Mâna #{result.handNumber}</span>
            </div>
            <h2 className="text-base sm:text-lg font-cinzel font-black text-[#ffd700] gold-text-glow">
              {language === 'ro' ? 'Evaluare & Scor OFC' : 'OFC Hand Evaluation'}
            </h2>
          </div>

          {/* Quick tab switcher between Overview and Full Boards */}
          <div className="flex items-center gap-1 bg-[#090604] p-1 rounded-xl border border-stone-800 self-start sm:self-auto text-xs font-cinzel">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#ffd700] text-black shadow font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 {language === 'ro' ? 'Rezumat Scor' : 'Score Summary'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('boards')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'boards'
                  ? 'bg-[#ffd700] text-black shadow font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🃏 {language === 'ro' ? 'Vezi Tablele' : 'View Boards'}
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & SIPS BREAKDOWN */}
        {activeTab === 'overview' && (
          <div className="space-y-3 animate-fade-in">
            {/* SIPS ACCUMULATION CARD */}
            <div className="bg-gradient-to-r from-[#2a1708] via-[#3d220b] to-[#2a1708] border-2 border-[#ffd700] rounded-2xl p-3 sm:p-3.5 text-center space-y-2 shadow-xl">
              <div className="text-[11px] font-cinzel text-amber-200/90 font-bold uppercase tracking-wider">
                🍺 {language === 'ro' ? 'Guri Acumulate în această Mână' : 'Sips Accumulated this Hand'}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Player A Sips */}
                <div className="bg-[#140b04]/90 p-2 sm:p-2.5 rounded-xl border border-amber-900/60 space-y-0.5">
                  <div className="text-xs font-cinzel font-bold text-gray-200 truncate">{playerA.name}</div>
                  <div className="text-base sm:text-lg font-cinzel font-black text-[#ffd700]">
                    {result.sipsAddedA > 0 ? (
                      <span className="text-red-400">+{result.sipsAddedA.toFixed(1)} guri</span>
                    ) : (
                      <span className="text-emerald-400">0 guri (Scăpat!)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Total: <strong className="text-white">{playerA.sipsAccumulated.toFixed(1)}</strong> / {settings.sipsToEndGame} guri
                  </div>
                </div>

                {/* Player B Sips */}
                <div className="bg-[#140b04]/90 p-2 sm:p-2.5 rounded-xl border border-amber-900/60 space-y-0.5">
                  <div className="text-xs font-cinzel font-bold text-gray-200 truncate">{playerB.name}</div>
                  <div className="text-base sm:text-lg font-cinzel font-black text-[#ffd700]">
                    {result.sipsAddedB > 0 ? (
                      <span className="text-red-400">+{result.sipsAddedB.toFixed(1)} guri</span>
                    ) : (
                      <span className="text-emerald-400">0 guri (Scăpat!)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Total: <strong className="text-white">{playerB.sipsAccumulated.toFixed(1)}</strong> / {settings.sipsToEndGame} guri
                  </div>
                </div>
              </div>

              {/* Fantasy Land Qualifications Callout */}
              {(playerA.qualifiesNextFantasyLand || playerB.qualifiesNextFantasyLand) && (
                <div className="p-1.5 rounded-xl bg-purple-950/90 border border-purple-400/80 text-purple-200 text-[11px] font-cinzel font-bold shadow animate-bounce">
                  ✨ FANTASY LAND UNLOCKED PENTRU MÂNA URMĂTOARE:{' '}
                  {playerA.qualifiesNextFantasyLand && <span className="text-yellow-300">[{playerA.name}] </span>}
                  {playerB.qualifiesNextFantasyLand && <span className="text-yellow-300">[{playerB.name}] </span>}
                </div>
              )}
            </div>

            {/* Row-by-Row Comparison Table */}
            <div className="bg-[#0f0a06]/90 border border-[#2a1d12] rounded-2xl p-2.5 space-y-1.5 text-xs font-cinzel">
              <div className="grid grid-cols-3 gap-2 text-center items-center py-1 border-b border-[#1c120a]">
                <div className="font-bold text-amber-200 truncate">{playerA.name}</div>
                <div className="text-gray-400 font-bold uppercase text-[10px]">
                  {language === 'ro' ? 'Rând' : 'Row'}
                </div>
                <div className="font-bold text-amber-200 truncate">{playerB.name}</div>
              </div>

              {/* Top Row Comparison */}
              <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                <div
                  className={`font-bold flex items-center justify-center gap-1 ${
                    result.topWinner === 'A'
                      ? 'text-emerald-400'
                      : result.topWinner === 'B'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <span>{result.topWinner === 'A' ? '✓ (+1)' : result.topWinner === 'B' ? '✗ (-1)' : 'Egal (0)'}</span>
                  {result.royaltiesTopA > 0 && (
                    <span className="text-[10px] text-yellow-400">(+{result.royaltiesTopA} roy)</span>
                  )}
                </div>
                <div className="text-gray-300 text-[11px] font-bold">Top (3 cărți)</div>
                <div
                  className={`font-bold flex items-center justify-center gap-1 ${
                    result.topWinner === 'B'
                      ? 'text-emerald-400'
                      : result.topWinner === 'A'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <span>{result.topWinner === 'B' ? '✓ (+1)' : result.topWinner === 'A' ? '✗ (-1)' : 'Egal (0)'}</span>
                  {result.royaltiesTopB > 0 && (
                    <span className="text-[10px] text-yellow-400">(+{result.royaltiesTopB} roy)</span>
                  )}
                </div>
              </div>

              {/* Middle Row Comparison */}
              <div className="grid grid-cols-3 gap-2 text-center items-center py-1 border-t border-[#1c120a]">
                <div
                  className={`font-bold flex items-center justify-center gap-1 ${
                    result.middleWinner === 'A'
                      ? 'text-emerald-400'
                      : result.middleWinner === 'B'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <span>{result.middleWinner === 'A' ? '✓ (+1)' : result.middleWinner === 'B' ? '✗ (-1)' : 'Egal (0)'}</span>
                  {result.royaltiesMiddleA > 0 && (
                    <span className="text-[10px] text-yellow-400">(+{result.royaltiesMiddleA} roy)</span>
                  )}
                </div>
                <div className="text-gray-300 text-[11px] font-bold">Mijloc (5 cărți)</div>
                <div
                  className={`font-bold flex items-center justify-center gap-1 ${
                    result.middleWinner === 'B'
                      ? 'text-emerald-400'
                      : result.middleWinner === 'A'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <span>{result.middleWinner === 'B' ? '✓ (+1)' : result.middleWinner === 'A' ? '✗ (-1)' : 'Egal (0)'}</span>
                  {result.royaltiesMiddleB > 0 && (
                    <span className="text-[10px] text-yellow-400">(+{result.royaltiesMiddleB} roy)</span>
                  )}
                </div>
              </div>

              {/* Bottom Row Comparison */}
              <div className="grid grid-cols-3 gap-2 text-center items-center py-1 border-t border-[#1c120a]">
                <div
                  className={`font-bold flex items-center justify-center gap-1 ${
                    result.bottomWinner === 'A'
                      ? 'text-emerald-400'
                      : result.bottomWinner === 'B'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <span>{result.bottomWinner === 'A' ? '✓ (+1)' : result.bottomWinner === 'B' ? '✗ (-1)' : 'Egal (0)'}</span>
                  {result.royaltiesBottomA > 0 && (
                    <span className="text-[10px] text-yellow-400">(+{result.royaltiesBottomA} roy)</span>
                  )}
                </div>
                <div className="text-gray-300 text-[11px] font-bold">Jos (5 cărți)</div>
                <div
                  className={`font-bold flex items-center justify-center gap-1 ${
                    result.bottomWinner === 'B'
                      ? 'text-emerald-400'
                      : result.bottomWinner === 'A'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <span>{result.bottomWinner === 'B' ? '✓ (+1)' : result.bottomWinner === 'A' ? '✗ (-1)' : 'Egal (0)'}</span>
                  {result.royaltiesBottomB > 0 && (
                    <span className="text-[10px] text-yellow-400">(+{result.royaltiesBottomB} roy)</span>
                  )}
                </div>
              </div>

              {/* Scoop Bonus Banner */}
              {result.scoopWinner && (
                <div className="p-1.5 rounded-xl bg-amber-950/60 border border-[#ffd700]/70 text-[#ffd700] text-center font-black text-xs shadow gold-text-glow">
                  🔥 SCOOP BONUS!{' '}
                  {result.scoopWinner === 'A' ? playerA.name : playerB.name} a câștigat toate cele 3 rânduri (+3 puncte)!
                </div>
              )}

              {/* Net Score Row */}
              <div className="grid grid-cols-3 gap-2 text-center items-center pt-1.5 border-t border-[#2d1e12] font-black text-sm">
                <div className={result.netScoreA >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {result.netScoreA > 0 ? `+${result.netScoreA}` : result.netScoreA} pct
                </div>
                <div className="text-amber-300 uppercase text-xs">Scor Net</div>
                <div className={result.netScoreB >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {result.netScoreB > 0 ? `+${result.netScoreB}` : result.netScoreB} pct
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL BOARDS SIDE-BY-SIDE */}
        {activeTab === 'boards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-fade-in">
            {/* Player A Board */}
            <div className="space-y-1">
              <PineappleBoardView
                board={playerA.board}
                language={language}
                playerName={playerA.name}
                avatarIcon={playerA.avatarIcon}
                inFantasyLand={playerA.inFantasyLand}
              />
              {isFoulA && (
                <div className="p-1.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-cinzel font-black text-center shadow animate-pulse">
                  ❌ {language === 'ro' ? 'MÂNĂ FOUL (0 puncte & royalties)' : 'FOUL HAND (0 pts & royalties)'}
                </div>
              )}
            </div>

            {/* Player B Board */}
            <div className="space-y-1">
              <PineappleBoardView
                board={playerB.board}
                language={language}
                playerName={playerB.name}
                avatarIcon={playerB.avatarIcon}
                inFantasyLand={playerB.inFantasyLand}
              />
              {isFoulB && (
                <div className="p-1.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-cinzel font-black text-center shadow animate-pulse">
                  ❌ {language === 'ro' ? 'MÂNĂ FOUL (0 puncte & royalties)' : 'FOUL HAND (0 pts & royalties)'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button: Next Hand */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onNextHand}
            className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-gradient-to-r from-[#d4a017] via-[#ffd700] to-[#b8860b] hover:from-[#e5b128] hover:via-[#ffe033] hover:to-[#c9971c] text-black font-cinzel font-black text-sm sm:text-base shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95 transition-all cursor-pointer"
          >
            {language === 'ro' ? 'Începe Mâna Următoare ➔' : 'Start Next Hand ➔'}
          </button>
        </div>
      </div>
    </div>
  );
};
