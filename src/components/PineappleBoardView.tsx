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
  onCardDrop?: (targetCard: PlayingCard, targetRow: 'top' | 'middle' | 'bottom', droppedCardId: string) => void;
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
  onCardDrop,
  onReturnToHand,
  onDropCard,
  language = 'ro',
  playerName,
  avatarIcon,
  isOpponent = false,
  inFantasyLand = false,
  isLocked = false,
}) => {
  const isRo = language === 'ro';
  const [dragOverRow, setDragOverRow] = React.useState<'top' | 'middle' | 'bottom' | null>(null);

  const topEval = evaluate3CardHand(board.top);
  const middleEval = evaluate5CardHand(board.middle, 'middle');
  const bottomEval = evaluate5CardHand(board.bottom, 'bottom');

  const foulStatus = checkIsFoul(board.top, board.middle, board.bottom);

  // Total Royalty Calculation
  const totalRoyalties =
    foulStatus.isFoul
      ? 0
      : (topEval.royaltyPoints || 0) + (middleEval.royaltyPoints || 0) + (bottomEval.royaltyPoints || 0);

  // Fantasy Land Qualification Preview (QQ+ on Top or Trips)
  const isPairQQorBetter = topEval.categoryRank === 1 && (topEval.primaryRanks[0] || 0) >= 12;
  const isTripsTop = topEval.categoryRank === 3;
  const qualifiesFantasyLandPreview = !foulStatus.isFoul && board.top.length === 3 && (isPairQQorBetter || isTripsTop);

  // Row validation states (Green when legally ordered and cards present, Red when Foul)
  const isTopValid = !foulStatus.topVsMiddleFoul && board.top.length > 0 && board.middle.length > 0;
  const isMidValid =
    !foulStatus.topVsMiddleFoul &&
    !foulStatus.middleVsBottomFoul &&
    board.middle.length > 0 &&
    (board.top.length > 0 || board.bottom.length > 0);
  const isBotValid = !foulStatus.middleVsBottomFoul && board.bottom.length > 0 && board.middle.length > 0;

  const handleDragOver = (e: React.DragEvent, row: 'top' | 'middle' | 'bottom') => {
    if (!isInteractive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverRow !== row) {
      setDragOverRow(row);
    }
  };

  const handleDragLeave = (row: 'top' | 'middle' | 'bottom') => {
    if (dragOverRow === row) {
      setDragOverRow(null);
    }
  };

  const handleDrop = (e: React.DragEvent, row: 'top' | 'middle' | 'bottom') => {
    if (!isInteractive || !onDropCard) return;
    e.preventDefault();
    setDragOverRow(null);
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
          onDragOver={(e) => {
            if (!isInteractive || isCommitted) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            if (!isInteractive) return;
            e.preventDefault();
            e.stopPropagation();
            const droppedId = e.dataTransfer.getData('text/plain');
            if (droppedId && droppedId !== card.id) {
              if (onCardDrop) {
                onCardDrop(card, row, droppedId);
              } else if (onDropCard) {
                onDropCard(row, droppedId);
              }
            }
          }}
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

    const isSlotDragTarget = dragOverRow === row;
    const canAcceptCard = isInteractive && (selectedCard !== null || isSlotDragTarget);

    return (
      <div
        key={`${emptyPrefix}-${idx}`}
        onClick={(e) => {
          if (isInteractive && onSlotClick) {
            e.stopPropagation();
            onSlotClick(row);
          }
        }}
        onDragOver={(e) => handleDragOver(e, row)}
        onDragLeave={() => handleDragLeave(row)}
        onDrop={(e) => handleDrop(e, row)}
        className={`w-11 sm:w-13 md:w-14 h-15 sm:h-18 md:h-20 rounded-lg sm:rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${
          isSlotDragTarget
            ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
            : canAcceptCard
            ? 'border-amber-400/90 bg-amber-950/40 hover:border-[#ffd700] hover:bg-amber-950/70 text-amber-300 shadow-[0_0_12px_rgba(255,215,0,0.3)] animate-pulse'
            : 'border-[#2d1e12] bg-[#0d0905]/60 text-stone-600 hover:border-stone-600'
        }`}
      >
        <span className="text-[10px] sm:text-[11px] font-cinzel font-bold">#{idx + 1}</span>
        {canAcceptCard && (
          <span className="text-[7px] sm:text-[8px] text-amber-300 font-bold -mt-0.5">
            + Pune
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border p-1.5 sm:p-2 transition-all relative ${
        isOpponent
          ? 'bg-[#120d08]/90 border-[#2a1d12]'
          : 'bg-[#18110a]/95 border-[#e8c84a]/70 gold-glow shadow-xl'
      }`}
    >
      {/* Header with Player Name, Live Total Royalties and Fantasy Land indicator */}
      {playerName && (
        <div className="flex items-center justify-between border-b border-[#2d1e12] pb-1 mb-1 flex-wrap gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base sm:text-lg">{avatarIcon || '🧙‍♂️'}</span>
            <span
              className={`font-cinzel font-black text-xs sm:text-sm truncate ${
                isOpponent ? 'text-amber-200/90' : 'text-[#ffd700] gold-text-glow'
              }`}
            >
              {playerName}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Live Total Royalty Points Preview */}
            {!isOpponent && totalRoyalties > 0 && !foulStatus.isFoul && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-900 to-yellow-900 border border-[#ffd700] text-[#ffd700] text-[9px] sm:text-[10px] font-cinzel font-black flex items-center gap-1 shadow-md animate-pulse">
                <span>👑</span>
                <span>+{totalRoyalties} Royalties</span>
              </span>
            )}

            {/* Live Fantasy Land Qualification Trigger */}
            {!isOpponent && qualifiesFantasyLandPreview && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 border border-purple-400 text-purple-200 text-[9px] sm:text-[10px] font-cinzel font-black flex items-center gap-1 shadow animate-bounce">
                <span>✨</span>
                <span>Fantasy Land Ready!</span>
              </span>
            )}

            {inFantasyLand && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-900 to-amber-900 border border-amber-400 text-amber-200 text-[9px] sm:text-[10px] font-cinzel font-black flex items-center gap-1 animate-pulse">
                <span>✨</span>
                <span>FANTASY LAND</span>
              </span>
            )}

            {isLocked && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[9px] sm:text-[10px] font-cinzel font-bold flex items-center gap-1">
                <span>✓</span>
                <span>{isRo ? 'Gata' : 'Locked'}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live Foul Warning Banner */}
      {foulStatus.isFoul && (board.top.length > 0 || board.middle.length > 0 || board.bottom.length > 0) && (
        <div className="mb-1.5 p-1 rounded-lg bg-red-950/95 border-2 border-red-500 text-red-200 text-[9px] sm:text-[10px] font-cinzel font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
          <span className="text-sm">⚠️</span>
          <span>
            {foulStatus.topVsMiddleFoul && foulStatus.middleVsBottomFoul
              ? isRo
                ? 'AVERTIZARE FOUL: Top > Mijloc ȘI Mijloc > Jos (Mână Moartă)!'
                : 'FOUL WARNING: Top > Middle AND Middle > Bottom (Dead Hand)!'
              : foulStatus.topVsMiddleFoul
              ? isRo
                ? 'AVERTIZARE FOUL: Top este mai puternic decât Mijlocul (Top > Mijloc)!'
                : 'FOUL WARNING: Top is stronger than Middle (Top > Middle)!'
              : isRo
              ? 'AVERTIZARE FOUL: Mijlocul este mai puternic decât Rândul de Jos (Mijloc > Jos)!'
              : 'FOUL WARNING: Middle is stronger than Bottom (Middle > Bottom)!'}
          </span>
        </div>
      )}

      {/* ROW 1: TOP (3 Cards) */}
      <div className="mb-1 sm:mb-1.5">
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-cinzel mb-0.5 px-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 uppercase tracking-wider font-bold">
              {isRo ? 'Top (3 cărți)' : 'Top (3 cards)'}
            </span>
            {foulStatus.topVsMiddleFoul ? (
              <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/60 text-[8px] font-black">
                ⚠️ FOUL
              </span>
            ) : isTopValid ? (
              <span className="px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-[8px] font-bold">
                ✓ Valid
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`font-bold ${
                foulStatus.topVsMiddleFoul
                  ? 'text-red-400 font-black'
                  : isTopValid
                  ? 'text-emerald-300 font-bold'
                  : 'text-amber-300/90'
              }`}
            >
              {board.top.length > 0
                ? isRo
                  ? topEval.nameRo
                  : topEval.nameEn
                : isRo
                ? 'Gol'
                : 'Empty'}
            </span>
            {topEval.royaltyPoints > 0 && !foulStatus.topVsMiddleFoul && (
              <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/60 font-black shadow-sm">
                +{topEval.royaltyPoints} roy
              </span>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => handleDragOver(e, 'top')}
          onDragLeave={() => handleDragLeave('top')}
          onDrop={(e) => handleDrop(e, 'top')}
          onClick={() => isInteractive && onSlotClick && onSlotClick('top')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-all ${
            foulStatus.topVsMiddleFoul
              ? 'bg-red-950/30 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : dragOverRow === 'top'
              ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
              : isTopValid
              ? 'bg-emerald-950/15 border-emerald-600/50'
              : isInteractive && selectedCard && board.top.length < 3
              ? 'bg-amber-950/30 border-dashed border-amber-400/80 cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.2)]'
              : 'bg-[#0f0a06]/80 border-[#2a1d12]'
          }`}
        >
          {[0, 1, 2].map((idx) => renderCardSlot(board.top[idx], idx, 'top', 'empty-top'))}
        </div>
      </div>

      {/* ROW 2: MIDDLE (5 Cards) */}
      <div className="mb-1 sm:mb-1.5">
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-cinzel mb-0.5 px-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 uppercase tracking-wider font-bold">
              {isRo ? 'Mijloc (5 cărți)' : 'Middle (5 cards)'}
            </span>
            {foulStatus.topVsMiddleFoul || foulStatus.middleVsBottomFoul ? (
              <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/60 text-[8px] font-black">
                ⚠️ FOUL
              </span>
            ) : isMidValid ? (
              <span className="px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-[8px] font-bold">
                ✓ Valid
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`font-bold ${
                foulStatus.topVsMiddleFoul || foulStatus.middleVsBottomFoul
                  ? 'text-red-400 font-black'
                  : isMidValid
                  ? 'text-emerald-300 font-bold'
                  : 'text-amber-300/90'
              }`}
            >
              {board.middle.length > 0
                ? isRo
                  ? middleEval.nameRo
                  : middleEval.nameEn
                : isRo
                ? 'Gol'
                : 'Empty'}
            </span>
            {middleEval.royaltyPoints > 0 && !foulStatus.isFoul && (
              <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/60 font-black shadow-sm">
                +{middleEval.royaltyPoints} roy
              </span>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => handleDragOver(e, 'middle')}
          onDragLeave={() => handleDragLeave('middle')}
          onDrop={(e) => handleDrop(e, 'middle')}
          onClick={() => isInteractive && onSlotClick && onSlotClick('middle')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-all ${
            foulStatus.topVsMiddleFoul || foulStatus.middleVsBottomFoul
              ? 'bg-red-950/30 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : dragOverRow === 'middle'
              ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
              : isMidValid
              ? 'bg-emerald-950/15 border-emerald-600/50'
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
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-cinzel mb-0.5 px-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 uppercase tracking-wider font-bold">
              {isRo ? 'Jos (5 cărți)' : 'Bottom (5 cards)'}
            </span>
            {foulStatus.middleVsBottomFoul ? (
              <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/60 text-[8px] font-black">
                ⚠️ FOUL
              </span>
            ) : isBotValid ? (
              <span className="px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-[8px] font-bold">
                ✓ Valid
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`font-bold ${
                foulStatus.middleVsBottomFoul
                  ? 'text-red-400 font-black'
                  : isBotValid
                  ? 'text-emerald-300 font-bold'
                  : 'text-amber-300/90'
              }`}
            >
              {board.bottom.length > 0
                ? isRo
                  ? bottomEval.nameRo
                  : bottomEval.nameEn
                : isRo
                ? 'Gol'
                : 'Empty'}
            </span>
            {bottomEval.royaltyPoints > 0 && !foulStatus.isFoul && (
              <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/60 font-black shadow-sm">
                +{bottomEval.royaltyPoints} roy
              </span>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => handleDragOver(e, 'bottom')}
          onDragLeave={() => handleDragLeave('bottom')}
          onDrop={(e) => handleDrop(e, 'bottom')}
          onClick={() => isInteractive && onSlotClick && onSlotClick('bottom')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-all ${
            foulStatus.middleVsBottomFoul
              ? 'bg-red-950/30 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : dragOverRow === 'bottom'
              ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
              : isBotValid
              ? 'bg-emerald-950/15 border-emerald-600/50'
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
