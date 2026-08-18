import React from 'react';
import { PineappleBoard, PlayingCard } from '../types';
import { PineappleCard } from './PineappleCard';
import {
  checkIsFoul,
  evaluate3CardHand,
  evaluate5CardHand,
} from '../lib/pineapplePokerEvaluator';

interface PineappleBoardViewProps {
  board: PineappleBoard;
  committedCardIds?: Set<string>;
  isInteractive?: boolean;
  selectedCard?: PlayingCard | null;
  onSlotClick?: (row: 'top' | 'middle' | 'bottom') => void;
  onCardClick?: (card: PlayingCard, row: 'top' | 'middle' | 'bottom', isUncommitted: boolean) => void;
  onReturnToHand?: (card: PlayingCard, row: 'top' | 'middle' | 'bottom') => void;
  onDropCard?: (row: 'top' | 'middle' | 'bottom', cardId: string) => void;
  language?: 'ro' | 'en';
  playerName?: string;
  avatarIcon?: string;
  isOpponent?: boolean;
  inFantasyLand?: boolean;
  isLocked?: boolean;
}

export const PineappleBoardView: React.FC<PineappleBoardViewProps> = ({
  board,
  committedCardIds,
  isInteractive = false,
  selectedCard = null,
  onSlotClick,
  onCardClick,
  onReturnToHand,
  onDropCard,
  language = 'ro',
  playerName,
  avatarIcon,
  isOpponent = false,
  inFantasyLand = false,
  isLocked = false,
}) => {
  const topEval = evaluate3CardHand(board.top);
  const middleEval = evaluate5CardHand(board.middle, 'middle');
  const bottomEval = evaluate5CardHand(board.bottom, 'bottom');

  const foulStatus = checkIsFoul(board.top, board.middle, board.bottom);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isInteractive) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, row: 'top' | 'middle' | 'bottom') => {
    if (!isInteractive || !onDropCard) return;
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onDropCard(row, cardId);
    }
  };

  const renderCardSlot = (
    card: PlayingCard | undefined,
    idx: number,
    row: 'top' | 'middle' | 'bottom',
    emptyPrefix: string
  ) => {
    if (card) {
      const isCommitted = committedCardIds ? committedCardIds.has(card.id) : false;
      const isUncommitted = isInteractive && !isCommitted;
      const isCardSelected = selectedCard?.id === card.id;

      return (
        <PineappleCard
          key={card.id}
          card={card}
          size={isOpponent ? 'sm' : 'md'}
          isSelected={isCardSelected}
          isUncommitted={isUncommitted}
          onReturnToHand={
            isUncommitted && onReturnToHand
              ? () => onReturnToHand(card, row)
              : undefined
          }
          onClick={() => {
            if (!isInteractive) return;
            if (onCardClick) {
              onCardClick(card, row, isUncommitted);
            }
          }}
        />
      );
    }

    return (
      <div
        key={`${emptyPrefix}-${idx}`}
        onClick={(e) => {
          if (isInteractive && onSlotClick) {
            e.stopPropagation();
            onSlotClick(row);
          }
        }}
        className={`w-14 sm:w-16 h-20 sm:h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
          isInteractive && selectedCard
            ? 'border-amber-400/80 bg-amber-950/40 hover:border-[#ffd700] hover:bg-amber-950/60 text-amber-300 cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)] animate-pulse'
            : 'border-[#2d1e12] bg-[#0d0905]/60 text-stone-600'
        }`}
      >
        <span className="text-[11px] font-cinzel font-bold">#{idx + 1}</span>
        {isInteractive && selectedCard && (
          <span className="text-[8px] sm:text-[9px] text-amber-300 font-bold mt-0.5">
            + Pune
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border p-2 sm:p-3 transition-all relative ${
        isOpponent
          ? 'bg-[#120d08]/90 border-[#2a1d12]'
          : 'bg-[#18110a]/95 border-[#e8c84a]/70 gold-glow shadow-xl'
      }`}
    >
      {/* Header with Player Name and Fantasy Land indicator */}
      {playerName && (
        <div className="flex items-center justify-between border-b border-[#2d1e12] pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-lg">{avatarIcon || '🧙‍♂️'}</span>
            <span
              className={`font-cinzel font-black text-xs sm:text-sm truncate ${
                isOpponent ? 'text-amber-200/90' : 'text-[#ffd700] gold-text-glow'
              }`}
            >
              {playerName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {inFantasyLand && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-900 to-amber-900 border border-amber-400 text-amber-200 text-[10px] font-cinzel font-black flex items-center gap-1 animate-pulse">
                <span>✨</span>
                <span>FANTASY LAND</span>
              </span>
            )}

            {isLocked && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-cinzel font-bold flex items-center gap-1">
                <span>✓</span>
                <span>{language === 'ro' ? 'Gata' : 'Locked'}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live Foul Warning Banner */}
      {foulStatus.isFoul && (board.top.length > 0 || board.middle.length > 0 || board.bottom.length > 0) && (
        <div className="mb-1.5 p-1 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-[10px] sm:text-[11px] font-cinzel font-bold flex items-center justify-center gap-1.5 shadow animate-pulse">
          <span>⚠️</span>
          <span>
            {foulStatus.topVsMiddleFoul && foulStatus.middleVsBottomFoul
              ? language === 'ro'
                ? 'AVERTIZARE FOUL: Top > Mijloc și Mijloc > Jos!'
                : 'FOUL WARNING: Top > Middle and Middle > Bottom!'
              : foulStatus.topVsMiddleFoul
              ? language === 'ro'
                ? 'AVERTIZARE FOUL: Top este mai puternic decât Mijlocul!'
                : 'FOUL WARNING: Top is stronger than Middle!'
              : language === 'ro'
              ? 'AVERTIZARE FOUL: Mijlocul este mai puternic decât Rândul de Jos!'
              : 'FOUL WARNING: Middle is stronger than Bottom!'}
          </span>
        </div>
      )}

      {/* ROW 1: TOP (3 Cards) */}
      <div className="mb-1.5 sm:mb-2">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-cinzel mb-0.5 px-1">
          <span className="text-gray-400 uppercase tracking-wider font-bold">
            {language === 'ro' ? 'Top (3 cărți)' : 'Top (3 cards)'}
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`font-bold ${
                foulStatus.topVsMiddleFoul
                  ? 'text-red-400 font-black'
                  : 'text-amber-300/90'
              }`}
            >
              {board.top.length > 0
                ? language === 'ro'
                  ? topEval.nameRo
                  : topEval.nameEn
                : language === 'ro'
                ? 'Gol'
                : 'Empty'}
            </span>
            {topEval.royaltyPoints > 0 && (
              <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-500/50 font-black">
                +{topEval.royaltyPoints} roy
              </span>
            )}
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'top')}
          onClick={() => isInteractive && onSlotClick && onSlotClick('top')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-xl border transition-all ${
            foulStatus.topVsMiddleFoul
              ? 'bg-red-950/20 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : isInteractive && selectedCard && board.top.length < 3
              ? 'bg-amber-950/30 border-dashed border-amber-400/80 cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.2)]'
              : 'bg-[#0f0a06]/80 border-[#2a1d12]'
          }`}
        >
          {[0, 1, 2].map((idx) => renderCardSlot(board.top[idx], idx, 'top', 'empty-top'))}
        </div>
      </div>

      {/* ROW 2: MIDDLE (5 Cards) */}
      <div className="mb-1.5 sm:mb-2">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-cinzel mb-0.5 px-1">
          <span className="text-gray-400 uppercase tracking-wider font-bold">
            {language === 'ro' ? 'Mijloc (5 cărți)' : 'Middle (5 cards)'}
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`font-bold ${
                foulStatus.topVsMiddleFoul || foulStatus.middleVsBottomFoul
                  ? 'text-red-400 font-black'
                  : 'text-amber-300/90'
              }`}
            >
              {board.middle.length > 0
                ? language === 'ro'
                  ? middleEval.nameRo
                  : middleEval.nameEn
                : language === 'ro'
                ? 'Gol'
                : 'Empty'}
            </span>
            {middleEval.royaltyPoints > 0 && (
              <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-500/50 font-black">
                +{middleEval.royaltyPoints} roy
              </span>
            )}
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'middle')}
          onClick={() => isInteractive && onSlotClick && onSlotClick('middle')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 p-1.5 rounded-xl border transition-all ${
            foulStatus.topVsMiddleFoul || foulStatus.middleVsBottomFoul
              ? 'bg-red-950/20 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : isInteractive && selectedCard && board.middle.length < 5
              ? 'bg-amber-950/30 border-dashed border-amber-400/80 cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.2)]'
              : 'bg-[#0f0a06]/80 border-[#2a1d12]'
          }`}
        >
          {[0, 1, 2, 3, 4].map((idx) => renderCardSlot(board.middle[idx], idx, 'middle', 'empty-mid'))}
        </div>
      </div>

      {/* ROW 3: BOTTOM (5 Cards) */}
      <div>
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-cinzel mb-0.5 px-1">
          <span className="text-gray-400 uppercase tracking-wider font-bold">
            {language === 'ro' ? 'Jos (5 cărți)' : 'Bottom (5 cards)'}
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`font-bold ${
                foulStatus.middleVsBottomFoul
                  ? 'text-red-400 font-black'
                  : 'text-amber-300/90'
              }`}
            >
              {board.bottom.length > 0
                ? language === 'ro'
                  ? bottomEval.nameRo
                  : bottomEval.nameEn
                : language === 'ro'
                ? 'Gol'
                : 'Empty'}
            </span>
            {bottomEval.royaltyPoints > 0 && (
              <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-500/50 font-black">
                +{bottomEval.royaltyPoints} roy
              </span>
            )}
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'bottom')}
          onClick={() => isInteractive && onSlotClick && onSlotClick('bottom')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 p-1.5 rounded-xl border transition-all ${
            foulStatus.middleVsBottomFoul
              ? 'bg-red-950/20 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : isInteractive && selectedCard && board.bottom.length < 5
              ? 'bg-amber-950/30 border-dashed border-amber-400/80 cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.2)]'
              : 'bg-[#0f0a06]/80 border-[#2a1d12]'
          }`}
        >
          {[0, 1, 2, 3, 4].map((idx) => renderCardSlot(board.bottom[idx], idx, 'bottom', 'empty-bot'))}
        </div>
      </div>
    </div>
  );
};
