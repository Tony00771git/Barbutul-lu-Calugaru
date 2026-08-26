import React, { useState, useEffect } from 'react';
import { DiceSkin } from '../types';
import { useApp } from '../context/AppContext';

interface DiceProps {
  values: number[];
  skin?: DiceSkin;
  isRolling?: boolean;
  onRoll?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Dice: React.FC<DiceProps> = ({
  values,
  skin = 'gold',
  isRolling = false,
  onRoll,
  disabled = false,
  size = 'lg',
}) => {
  const { t } = useApp();
  const [shakeDetected, setShakeDetected] = useState(false);

  // Motion sensor for phone shake
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (disabled || isRolling || !onRoll) return;

      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      if ((currentTime - lastTime) > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const x = current.x || 0;
        const y = current.y || 0;
        const z = current.z || 0;

        const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > 1800) { // Shake sensitivity threshold
          setShakeDetected(true);
          onRoll();
          setTimeout(() => setShakeDetected(false), 800);
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [disabled, isRolling, onRoll]);

  const getSkinStyles = () => {
    switch (skin) {
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-[#f8e178] via-[#e8c84a] to-[#b38f20]',
          border: 'border-[#ffe98a]',
          dotColor: 'bg-[#2b1a0d]',
          glow: 'shadow-[0_0_15px_rgba(232,200,74,0.6)]',
        };
      case 'bone':
        return {
          bg: 'bg-gradient-to-br from-[#fdfbf7] via-[#f0ebe0] to-[#d8cfbe]',
          border: 'border-[#e0d6c3]',
          dotColor: 'bg-[#211b15]',
          glow: 'shadow-[0_0_12px_rgba(240,235,224,0.4)]',
        };
      case 'wood':
        return {
          bg: 'bg-gradient-to-br from-[#a66a38] via-[#7c4d25] to-[#4e2f13]',
          border: 'border-[#c4844f]',
          dotColor: 'bg-[#f0ebe0]',
          glow: 'shadow-[0_0_12px_rgba(166,106,56,0.5)]',
        };
      case 'ruby':
        return {
          bg: 'bg-gradient-to-br from-[#ef4444] via-[#dc2626] to-[#7f1d1d]',
          border: 'border-[#fca5a5]',
          dotColor: 'bg-[#ffe4e6] shadow-[0_0_6px_rgba(255,255,255,0.8)]',
          glow: 'shadow-[0_0_18px_rgba(239,68,68,0.8)]',
        };
      case 'ice':
        return {
          bg: 'bg-gradient-to-br from-[#bae6fd] via-[#38bdf8] to-[#0369a1]',
          border: 'border-[#e0f2fe]',
          dotColor: 'bg-[#082f49] shadow-[0_0_4px_rgba(224,242,254,0.6)]',
          glow: 'shadow-[0_0_18px_rgba(56,189,248,0.8)]',
        };
      case 'obsidian':
        return {
          bg: 'bg-gradient-to-br from-[#3b0764] via-[#581c87] to-[#170a24]',
          border: 'border-[#d946ef]',
          dotColor: 'bg-[#f0abfc] shadow-[0_0_8px_rgba(217,70,239,0.9)]',
          glow: 'shadow-[0_0_20px_rgba(217,70,239,0.8)]',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-[#f8e178] via-[#e8c84a] to-[#b38f20]',
          border: 'border-[#ffe98a]',
          dotColor: 'bg-[#2b1a0d]',
          glow: 'shadow-[0_0_15px_rgba(232,200,74,0.6)]',
        };
    }
  };

  const style = getSkinStyles();

  // Render dot positions on die face
  const renderDots = (value: number) => {
    const dotsMap: Record<number, string[]> = {
      1: ['col-start-2 row-start-2'],
      2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
      3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
      4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
      5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
      6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    };

    const positions = dotsMap[value] || dotsMap[1];

    const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
    const padding = size === 'sm' ? 'p-1 gap-0.5' : size === 'md' ? 'p-1.5 gap-1' : 'p-2.5 gap-1.5';

    return (
      <div className={`grid grid-cols-3 grid-rows-3 w-full h-full ${padding} items-center justify-items-center`}>
        {positions.map((pos, idx) => (
          <span
            key={idx}
            className={`${dotSize} rounded-full ${style.dotColor} ${pos} shadow-inner`}
          />
        ))}
      </div>
    );
  };

  const dieDimensions =
    size === 'sm'
      ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl'
      : size === 'md'
      ? 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl'
      : 'w-20 h-20 rounded-2xl';

  const buttonClasses =
    size === 'sm'
      ? 'px-4 py-1.5 rounded-lg font-cinzel font-bold text-xs sm:text-sm text-black'
      : size === 'md'
      ? 'px-6 py-2.5 rounded-xl font-cinzel font-bold text-sm sm:text-base text-black'
      : 'px-8 py-3.5 rounded-xl font-cinzel font-bold text-lg text-black';

  return (
    <div className={`flex flex-col items-center select-none ${size === 'sm' ? 'gap-1.5' : 'gap-3'}`}>
      <div className={`flex items-center justify-center ${size === 'sm' ? 'gap-2.5' : 'gap-5'}`}>
        {values.map((val, idx) => (
          <div
            key={idx}
            onClick={() => !disabled && !isRolling && onRoll && onRoll()}
            className={`${dieDimensions} border-2 cursor-pointer ${style.bg} ${style.border} ${style.glow} transform transition-transform duration-200 active:scale-95 ${
              isRolling || shakeDetected ? 'animate-roll' : 'hover:scale-105'
            }`}
          >
            {renderDots(val)}
          </div>
        ))}
      </div>

      {onRoll && (
        <button
          disabled={disabled || isRolling}
          onClick={onRoll}
          className={`${buttonClasses} transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow cursor-pointer ${
            disabled || isRolling
              ? 'bg-gray-600 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-[#e8c84a] to-[#ffd700] hover:brightness-110 gold-glow'
          }`}
        >
          <span>{isRolling ? '...' : t('rollDice')}</span>
          {!disabled && !isRolling && (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/20 text-black text-[10px] font-mono border border-black/30 font-bold">
              Space ⏎
            </kbd>
          )}
        </button>
      )}

      {onRoll && size !== 'sm' && (
        <div className="flex items-center gap-2 text-xs text-[#888] font-barlow">
          <span>{t('shakeDevice')}</span>
          <span className="hidden sm:inline text-gray-500">• Tasta Space / Enter</span>
        </div>
      )}
    </div>
  );
};
