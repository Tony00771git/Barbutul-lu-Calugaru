import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DiceSkin } from '../types';
import { DieFace } from './Dice';

interface CasinoDiceArenaProps {
  diceResult?: [number, number];
  isRolling: boolean;
  phase: 'betting' | 'rolling' | 'resolved';
  skin?: DiceSkin;
}

export const CasinoDiceArena: React.FC<CasinoDiceArenaProps> = ({
  diceResult = [1, 1],
  isRolling,
  phase,
  skin,
}) => {
  const { t, diceSkin: currentDiceSkin } = useApp();
  const effectiveSkin = skin || currentDiceSkin;
  const [displayValues, setDisplayValues] = useState<[number, number]>(diceResult);
  const [bounceImpact, setBounceImpact] = useState<boolean>(false);
  const [showResultGlow, setShowResultGlow] = useState<boolean>(false);

  // Cycle randomized dice faces rapidly during rolling animation
  useEffect(() => {
    let rollInterval: NodeJS.Timeout | null = null;

    if (isRolling) {
      setShowResultGlow(false);
      setBounceImpact(false);

      // Fast tumbling faces
      rollInterval = setInterval(() => {
        setDisplayValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 70);

      // Impact shockwave trigger at bounce time
      const impactTimer = setTimeout(() => {
        setBounceImpact(true);
      }, 450);

      // Settle on real dice result after throw finishes
      const settleTimer = setTimeout(() => {
        if (rollInterval) clearInterval(rollInterval);
        setDisplayValues(diceResult);
        setShowResultGlow(true);
      }, 1400);

      return () => {
        if (rollInterval) clearInterval(rollInterval);
        clearTimeout(impactTimer);
        clearTimeout(settleTimer);
      };
    } else {
      setDisplayValues(diceResult);
      setShowResultGlow(true);
    }
  }, [isRolling, diceResult]);

  const safeDiceResult: [number, number] =
    diceResult && Array.isArray(diceResult) && diceResult.length >= 2
      ? [diceResult[0], diceResult[1]]
      : [1, 1];

  const activeValues = isRolling ? displayValues : safeDiceResult;
  const sum = activeValues[0] + activeValues[1];

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#182618] via-[#0d180f] to-[#070e08] border-2 border-[#523b24] shadow-[inset_0_0_50px_rgba(0,0,0,0.85),0_8px_25px_rgba(0,0,0,0.6)] p-3 sm:p-5 flex flex-col items-center justify-center select-none min-h-[190px] sm:min-h-[220px]">
      {/* Authentic Craps Felt Table Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2d5c31_1.5px,transparent_1.5px)] [background-size:14px_14px] pointer-events-none rounded-2xl" />

      {/* Medieval Craps Rail Border */}
      <div className="absolute inset-2 border border-[#e8c84a]/25 rounded-xl pointer-events-none" />

      {/* Top Status Pill */}
      <div className="relative z-10 mb-2 flex items-center gap-2">
        <span className="text-[11px] sm:text-xs font-cinzel font-black tracking-widest text-[#e8c84a] uppercase bg-[#070f09]/90 px-3 py-0.5 sm:py-1 rounded-full border border-[#4a341e] shadow-md flex items-center gap-1.5">
          <span>🎲</span>
          <span>
            {isRolling
              ? 'Zarurile sunt aruncate pe postav...'
              : phase === 'betting'
              ? 'Masa de Craps & Barbut'
              : 'Zarurile au aterizat'}
          </span>
        </span>
      </div>

      {/* Arena Stage: Top-Down Physics Throw */}
      <div className="relative z-10 flex items-center justify-center gap-8 sm:gap-14 my-2 w-full py-1">
        {/* DIE 1 */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Dynamic Floor Shadow */}
          <div
            className={`w-20 h-6 sm:w-24 sm:h-7 rounded-[50%] bg-black/75 blur-sm absolute -bottom-3 sm:-bottom-4 transition-all ${
              isRolling ? 'animate-dice-shadow-1' : 'scale-100 opacity-90'
            }`}
          />

          {/* Shockwave Impact Ripple on First Ground Contact */}
          {bounceImpact && (
            <div className="absolute -bottom-2 sm:-bottom-3 w-24 h-10 rounded-[50%] border-2 border-[#e8c84a]/70 animate-ping pointer-events-none" />
          )}

          {/* Die 1 Physical Container */}
          <div
            className={`transform transition-transform ${
              isRolling ? 'animate-dice-drop-1' : 'hover:scale-105 duration-200'
            }`}
          >
            <DieFace value={activeValues[0]} skin={effectiveSkin} size="lg" />
          </div>
        </div>

        {/* DIE 2 */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Dynamic Floor Shadow */}
          <div
            className={`w-20 h-6 sm:w-24 sm:h-7 rounded-[50%] bg-black/75 blur-sm absolute -bottom-3 sm:-bottom-4 transition-all ${
              isRolling ? 'animate-dice-shadow-2' : 'scale-100 opacity-90'
            }`}
          />

          {/* Shockwave Impact Ripple on First Ground Contact */}
          {bounceImpact && (
            <div className="absolute -bottom-2 sm:-bottom-3 w-24 h-10 rounded-[50%] border-2 border-[#e8c84a]/70 animate-ping delay-75 pointer-events-none" />
          )}

          {/* Die 2 Physical Container */}
          <div
            className={`transform transition-transform ${
              isRolling ? 'animate-dice-drop-2' : 'hover:scale-105 duration-200'
            }`}
          >
            <DieFace value={activeValues[1]} skin={effectiveSkin} size="lg" />
          </div>
        </div>
      </div>

      {/* Settle Result & Sum Readout Banner (Visible when resolved or rolling) */}
      <div className="relative z-10 mt-1.5 sm:mt-2 flex items-center justify-center">
        {(showResultGlow || phase === 'resolved') && (
          <div className="flex flex-wrap items-center justify-center gap-2 bg-[#060c07]/95 border-2 border-[#e8c84a] px-3 sm:px-4 py-1 rounded-xl shadow-[0_0_20px_rgba(232,200,74,0.4)] animate-fade-in">
            <span className="text-[11px] sm:text-xs text-[#a8c4a8] font-cinzel font-bold">
              {t('casinoDiceSum')}
            </span>
            <span className="font-mono text-sm sm:text-base font-black text-[#f8e178]">
              [{activeValues[0]}] + [{activeValues[1]}] =
            </span>
            <span className="text-lg sm:text-xl font-black font-cinzel text-[#ffd700] gold-text-glow ml-0.5">
              {sum}
            </span>
            <span className="text-[11px] text-[#8ca38c] font-bold ml-1 bg-[#102414] px-1.5 py-0.5 rounded border border-[#2d5c31]">
              {sum > 7 ? 'Peste 7' : sum < 7 ? 'Sub 7' : 'Exact 7 ⚠️'} | {sum % 2 === 0 ? 'Par' : 'Impar'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
