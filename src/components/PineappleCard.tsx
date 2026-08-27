import React from 'react';
import { PlayingCard } from '../types';
import {
  RANK_NAMES_RO,
  RANK_NAMES_EN,
  SUIT_SYMBOLS,
} from '../lib/pineapplePokerEvaluator';

interface PineappleCardProps {
  card: PlayingCard;
  isSelected?: boolean;
  isDragging?: boolean;
  isDisabled?: boolean;
  isUncommitted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  onReturnToHand?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export const PineappleCard: React.FC<PineappleCardProps> = ({
  card,
  isSelected = false,
  isDragging = false,
  isDisabled = false,
  isUncommitted = false,
  size = 'md',
  onClick,
  onReturnToHand,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  className = '',
}) => {
  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '♠';
  const displayRank = card.rank === 'T' ? '10' : card.rank;

  const sizeClasses = {
    sm: 'w-8 sm:w-9 h-11 sm:h-13 text-[10px] sm:text-xs rounded-md sm:rounded-lg p-0.5',
    md: 'w-11 sm:w-13 md:w-14 h-15 sm:h-18 md:h-20 text-xs sm:text-sm rounded-lg sm:rounded-xl p-1',
    lg: 'w-13 sm:w-16 h-18 sm:h-22 text-sm sm:text-base rounded-xl p-1.5',
  }[size];

  const suitColor = isRed ? 'text-red-600' : 'text-stone-900';

  return (
    <div
      draggable={!isDisabled}
      onDragStart={e => {
        if (isDisabled) return;
        e.dataTransfer.setData('text/plain', card.id);
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(e);
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={isDisabled ? undefined : onClick}
      className={`relative select-none flex flex-col justify-between transition-transform duration-75 cursor-grab active:cursor-grabbing touch-manipulation ${sizeClasses} ${
        isDragging
          ? 'opacity-30 scale-90'
          : isSelected
          ? 'ring-2 ring-[#ffd700] -translate-y-2 shadow-[0_10px_25px_rgba(255,215,0,0.5)] z-20 scale-105'
          : isUncommitted
          ? 'ring-1 ring-amber-400/80 shadow-[0_0_10px_rgba(255,215,0,0.35)] hover:-translate-y-1'
          : 'hover:-translate-y-1 hover:shadow-lg'
      } ${
        isDisabled ? 'opacity-50 cursor-not-allowed filter grayscale' : ''
      } bg-gradient-to-b from-[#fdfbf7] via-[#f7f2e7] to-[#eadecc] border-2 ${
        isSelected
          ? 'border-[#ffd700]'
          : isUncommitted
          ? 'border-amber-400'
          : 'border-[#4a3b2c]'
      } shadow-md ${className}`}
      style={{
        boxShadow: isSelected
          ? '0 0 15px rgba(255, 215, 0, 0.6), 0 8px 16px rgba(0,0,0,0.5)'
          : isUncommitted
          ? '0 0 10px rgba(245, 158, 11, 0.4), 0 4px 10px rgba(0,0,0,0.3)'
          : '0 4px 10px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top Left Rank & Suit */}
      <div className={`flex flex-col items-center leading-none ${suitColor}`}>
        <span className="font-cinzel font-black tracking-tighter text-xs sm:text-sm">
          {displayRank}
        </span>
        <span className="text-[10px] sm:text-xs -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Center Watermark Suit */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 ${suitColor} text-2xl sm:text-3xl`}
      >
        <span>{suitSymbol}</span>
      </div>

      {/* Optional Uncommitted return / badge icon */}
      {isUncommitted && onReturnToHand && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReturnToHand();
          }}
          title="Înapoi în mână"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-950 border border-amber-400 text-amber-200 hover:bg-amber-800 hover:text-white flex items-center justify-center text-[10px] font-black shadow-md z-30 transition-all hover:scale-110 active:scale-95"
        >
          ⮌
        </button>
      )}

      {/* Bottom Right Rank & Suit (Upside Down) */}
      <div
        className={`flex flex-col items-center leading-none ${suitColor} rotate-180 self-end`}
      >
        <span className="font-cinzel font-black tracking-tighter text-xs sm:text-sm">
          {displayRank}
        </span>
        <span className="text-[10px] sm:text-xs -mt-0.5">{suitSymbol}</span>
      </div>
    </div>
  );
};
