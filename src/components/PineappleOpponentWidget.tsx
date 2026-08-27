import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PineappleBoard, PineapplePlayerState, PlayingCard } from '../types';
import { PineappleBoardView } from './PineappleBoardView';
import { SUIT_SYMBOLS } from '../lib/pineapplePokerEvaluator';
import { BOT_PROFILES } from '../lib/pineappleBotAi';
import { Eye, Maximize2, X, Sparkles, CheckCircle2, AlertTriangle, Bot, BrainCircuit } from 'lucide-react';

interface PineappleOpponentWidgetProps {
  opponent: PineapplePlayerState;
  language?: 'ro' | 'en';
  sipsThreshold: number;
}

export const PineappleOpponentWidget: React.FC<PineappleOpponentWidgetProps> = ({
  opponent,
  language = 'ro',
  sipsThreshold,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const board = opponent.board || { top: [], middle: [], bottom: [] };
  const totalPlaced = board.top.length + board.middle.length + board.bottom.length;
  const isBot = opponent.isBot;
  const botDiff = opponent.botDifficulty || 'medium';
  const botProfile = BOT_PROFILES[botDiff] || BOT_PROFILES.medium;
  const isThinking = isBot && !opponent.handLocked;

  const renderMiniSlot = (card: PlayingCard | undefined, key: string) => {
    if (!card) {
      return (
        <div
          key={key}
          className="w-4 h-5 sm:w-5 sm:h-6 rounded bg-[#0d0905]/80 border border-stone-800 flex items-center justify-center text-[8px] text-stone-600"
        >
          •
        </div>
      );
    }

    const isRed = card.suit === 'h' || card.suit === 'd';
    const suitSymbol = SUIT_SYMBOLS[card.suit] || '♠';
    const displayRank = card.rank === 'T' ? '10' : card.rank;

    return (
      <div
        key={key}
        className={`w-4 h-5 sm:w-5 sm:h-6 rounded bg-gradient-to-b from-[#fdfbf7] to-[#e6dcce] border border-[#5a4836] flex flex-col items-center justify-center leading-none shadow-sm ${
          isRed ? 'text-red-600' : 'text-stone-900'
        }`}
        title={`${displayRank}${suitSymbol}`}
      >
        <span className="font-cinzel font-black text-[8px] sm:text-[9px] -mb-0.5">{displayRank}</span>
        <span className="text-[7px] sm:text-[8px]">{suitSymbol}</span>
      </div>
    );
  };

  return (
    <>
      {/* Mini Widget in Top-Right Header */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer bg-gradient-to-br from-[#1b1209] to-[#0f0a06] hover:from-[#261a0d] hover:to-[#170f09] border border-amber-500/50 hover:border-[#ffd700] rounded-xl p-1.5 sm:p-2 transition-all shadow-md flex items-center gap-2 sm:gap-2.5"
        title={language === 'ro' ? 'Apasă pentru a mări mâna adversarului' : 'Click to expand opponent hand'}
      >
        {/* Opponent Identity & Status */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative">
            <span className="text-xl sm:text-2xl">{opponent.avatarIcon || '🤖'}</span>
            {opponent.inFantasyLand && (
              <span className="absolute -top-1 -right-1 text-[10px] animate-bounce" title="Fantasy Land">
                ✨
              </span>
            )}
            {isThinking && (
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-cinzel font-bold text-xs text-amber-200 truncate max-w-[80px] sm:max-w-[110px]">
                {opponent.name}
              </span>
              <Maximize2 className="w-3 h-3 text-[#ffd700] opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>

            <div className="flex items-center gap-1 text-[10px] font-cinzel">
              {opponent.handLocked ? (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{language === 'ro' ? 'Gata' : 'Ready'}</span>
                </span>
              ) : isThinking ? (
                <span className="text-amber-400 font-bold animate-pulse flex items-center gap-0.5">
                  <BrainCircuit className="w-2.5 h-2.5 animate-spin" />
                  <span>{language === 'ro' ? 'Gândește...' : 'Thinking...'}</span>
                </span>
              ) : (
                <span className="text-amber-400/80">
                  {language === 'ro' ? `${totalPlaced}/13 cărți` : `${totalPlaced}/13 cards`}
                </span>
              )}
              <span className="text-stone-600">•</span>
              <span className="text-red-400 font-bold">{opponent.sipsAccumulated.toFixed(1)}🍺</span>
            </div>
          </div>
        </div>

        {/* Mini Preview of Opponent's 3 Rows */}
        <div className="hidden xs:flex flex-col gap-0.5 bg-[#090604] p-1 rounded-lg border border-[#2a1d12]">
          {/* Top (3) */}
          <div className="flex gap-0.5 justify-center">
            {[0, 1, 2].map((idx) => renderMiniSlot(board.top[idx], `opp-mini-top-${idx}`))}
          </div>
          {/* Middle (5) */}
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((idx) => renderMiniSlot(board.middle[idx], `opp-mini-mid-${idx}`))}
          </div>
          {/* Bottom (5) */}
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((idx) => renderMiniSlot(board.bottom[idx], `opp-mini-bot-${idx}`))}
          </div>
        </div>

        {/* Expand tooltip badge on mobile/hover */}
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#291b0f] border border-amber-500/40 text-[#ffd700] group-hover:bg-[#3d2817] transition-colors flex-shrink-0">
          <Eye className="w-3.5 h-3.5" />
        </div>
      </motion.div>

      {/* Expanded Modal with Smooth Motion Transition */}
      <AnimatePresence>
        {isOpen && (
          <div
            style={{ zIndex: 99990 }}
            className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1c130a] via-[#140d07] to-[#0a0704] border-2 border-[#ffd700] rounded-3xl p-3 sm:p-5 max-w-lg w-full shadow-[0_0_50px_rgba(255,215,0,0.35)] space-y-3 relative gold-glow max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{opponent.avatarIcon || '🤖'}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-cinzel font-black text-sm sm:text-base text-[#ffd700] gold-text-glow">
                        {opponent.name}
                      </h3>
                      {opponent.isBot && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-cinzel font-bold border"
                          style={{
                            backgroundColor: `${botProfile.color}20`,
                            borderColor: botProfile.color,
                            color: botProfile.color,
                          }}
                        >
                          🤖 {botProfile.titleRo}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-cinzel text-gray-400">
                      {opponent.inFantasyLand
                        ? '✨ În Faza Fantezie (13 cărți simultan)'
                        : opponent.handLocked
                        ? '✓ A confirmat runda curentă'
                        : isThinking
                        ? '🤖 Calculează decizia optimă...'
                        : '⏳ În curs de plasare a cărților...'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Full Opponent Board View */}
              <div className="py-1">
                <PineappleBoardView
                  board={opponent.board}
                  isOpponent={true}
                  language={language}
                  playerName={opponent.name}
                  avatarIcon={opponent.avatarIcon}
                  inFantasyLand={opponent.inFantasyLand}
                  isLocked={opponent.handLocked}
                />
              </div>

              {/* Stats & Quick Dismiss Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2d1e12] text-xs font-cinzel">
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Guri acumulate:</span>
                  <strong className="text-red-400 font-bold">
                    {opponent.sipsAccumulated.toFixed(1)} / {sipsThreshold} 🍺
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-black text-xs font-cinzel transition-all shadow cursor-pointer active:scale-95"
                >
                  {language === 'ro' ? 'Închide (ESC)' : 'Close (ESC)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
