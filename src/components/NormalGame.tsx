import React, { useState, useEffect } from 'react';
import { Player, Difficulty, CustomDoubles, MonkState } from '../types';
import { useApp } from '../context/AppContext';
import { Dice } from './Dice';
import { MonkMascot } from './MonkMascot';
import { ParticleOverlay } from './ParticleOverlay';
import { TurnEndDrinkModal } from './Popups';
import { ScoreModal } from './ScoreModal';
import { AvatarDisplay } from './AvatarDisplay';
import { HeadToHeadTracker } from './HeadToHeadTracker';

interface NormalGameProps {
  initialPlayers: Player[];
  difficulty: Difficulty;
  customDoubles: CustomDoubles;
  onEndGame: (finalPlayers: Player[]) => void;
  onOpenRules: () => void;
}

interface PendingTurnResult {
  reason: string;
  sipsToDrink: number;
  isChug: boolean;
  isImmune: boolean;
  specialNote?: string;
}

export const NormalGame: React.FC<NormalGameProps> = ({
  initialPlayers,
  difficulty: initialDifficulty,
  customDoubles,
  onEndGame,
  onOpenRules,
}) => {
  const { t, diceSkin, checkAchievement } = useApp();

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);

  // Turn counters
  const [normalCount, setNormalCount] = useState<number>(0); // sips in current turn
  const [doubleCount, setDoubleCount] = useState<number>(0); // consecutive doubles in current turn
  const [totalTurnsPlayed, setTotalTurnsPlayed] = useState<number>(0);

  // Dice state
  const [diceValues, setDiceValues] = useState<number[]>([1, 1]);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Effects & Monk State
  const [particleType, setParticleType] = useState<'heaven' | 'chug' | null>(null);
  const [monkOverride, setMonkOverride] = useState<MonkState | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Turn End Drinking Popup
  const [turnResult, setTurnResult] = useState<PendingTurnResult | null>(null);

  // Stats drawer
  const [showStatsDrawer, setShowStatsDrawer] = useState<boolean>(false);

  // Current Nightmare threshold
  const getNightmareChugLimit = () => {
    if (difficulty !== 'nightmare') return 25;
    const reductions = Math.floor(totalTurnsPlayed / 3);
    const limit = 25 - reductions * 5;
    return Math.max(limit, 5);
  };

  const chugThreshold = getNightmareChugLimit();
  const activePlayer = players[activePlayerIndex];

  // Difficulty double threshold map
  const getDoubleThreshold = () => {
    switch (difficulty) {
      case 'weak': return 1;
      case 'medium': return 2;
      case 'extreme': return 3;
      case 'nightmare': return 3;
    }
  };

  const confirmTurnAndAdvance = () => {
    if (!turnResult) return;

    const { sipsToDrink, isChug } = turnResult;
    const addedSips = isChug ? 0 : sipsToDrink;
    const addedChugs = isChug ? 1 : 0;

    // Apply sips and chugs to active player
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          sipsTotal: p.sipsTotal + addedSips,
          chugsTotal: p.chugsTotal + addedChugs,
        };
      }
      return p;
    }));

    // Trigger achievement checks
    checkAchievement(activePlayer.name, {
      sipsDelta: addedSips,
      chugsDelta: addedChugs,
      singleGameSips: activePlayer.sipsTotal + addedSips,
      singleGameChugs: activePlayer.chugsTotal + addedChugs,
      isChug: isChug,
    });

    // Reset turn state
    setNormalCount(0);
    setDoubleCount(0);
    setMonkOverride(undefined);
    setParticleType(null);
    setAlertMessage(null);
    setTurnResult(null);
    setTotalTurnsPlayed(prev => prev + 1);

    // Switch to next player
    setActivePlayerIndex(prev => (prev + 1) % players.length);
  };

  const handleUsePardonLetter = () => {
    if (!activePlayer.pardonLetters || activePlayer.pardonLetters <= 0) return;

    // Consume 1 pardon letter and negate drinking
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          pardonLetters: p.pardonLetters - 1,
        };
      }
      return p;
    }));

    // Set sips to 0
    if (turnResult) {
      setTurnResult({
        ...turnResult,
        sipsToDrink: 0,
        isChug: false,
        isImmune: true,
        specialNote: '🎟️ Ai folosit Scrisoarea de Iertare! Pedeapsa a fost anulată.',
      });
    }
  };

  const handleRoll = () => {
    if (isRolling || turnResult) return;
    setIsRolling(true);
    setAlertMessage(null);

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDiceValues([d1, d2]);
      setIsRolling(false);

      const isDouble = d1 === d2;

      if (!isDouble) {
        // NON-DOUBLE: Accumulates sips
        const newNormalCount = normalCount + 1;
        setNormalCount(newNormalCount);

        // Check if player hit Nightmare or standard chug threshold
        if (newNormalCount >= chugThreshold) {
          setParticleType('chug');
          setMonkOverride('dead');
          setTurnResult({
            reason: `Ai acumulat ${newNormalCount} aruncări fără dublă (Limita de ${chugThreshold} a fost depășită)!`,
            sipsToDrink: 0,
            isChug: true,
            isImmune: false,
            specialNote: '💀 GROAPĂ! Ai atins pragul critic!',
          });
        }
      } else {
        // DOUBLE ROLLED!
        const doubleValueKey = `${d1}-${d2}` as keyof CustomDoubles;
        const customChallenge = customDoubles[doubleValueKey];

        // 1-1 HEAVEN / RAI
        if (d1 === 1) {
          setParticleType('heaven');
          setMonkOverride('resurrected');
          
          checkAchievement(activePlayer.name, { isHeaven: true, isDoubles: true });

          // Other players drink 1 sip
          setPlayers(prev => prev.map((p, idx) => {
            if (idx !== activePlayerIndex) {
              return { ...p, sipsTotal: p.sipsTotal + 1 };
            }
            return p;
          }));

          setTurnResult({
            reason: `Ai dat Dublă de 1 - 1 (RAI SFÂNT)! 🎲✨`,
            sipsToDrink: 0,
            isChug: false,
            isImmune: true,
            specialNote: '✨ Ești salvat! Toți ceilalți jucători beau câte 1 gură fiecare!',
          });
          return;
        }

        // 6-6 CHUG / GROAPĂ
        if (d1 === 6) {
          setParticleType('chug');
          setMonkOverride('dead');
          checkAchievement(activePlayer.name, { isDoubles: true });
          setTurnResult({
            reason: `Ai dat Dublă de 6 - 6 (GROAPĂ TOTALĂ)! 🎲🔥`,
            sipsToDrink: 0,
            isChug: true,
            isImmune: false,
            specialNote: '💀 Bei tot paharul până la fund!',
          });
          return;
        }

        // Weak difficulty rules: Any double saves player
        if (difficulty === 'weak') {
          const sipsToTake = normalCount + 1;
          setMonkOverride('tipsy');
          checkAchievement(activePlayer.name, { isDoubles: true });
          setTurnResult({
            reason: `Ai dat Dublă 🎲 ${d1} - ${d2}! La nivel Ușor, dubla încheie tura.`,
            sipsToDrink: sipsToTake,
            isChug: false,
            isImmune: false,
            specialNote: customChallenge && customChallenge.trim() !== '' ? `Provocare: ${customChallenge}` : undefined,
          });
          return;
        }

        // Normal doubles (2-2 to 5-5)
        const newDoubleCount = doubleCount + 1;
        setDoubleCount(newDoubleCount);
        checkAchievement(activePlayer.name, { isDoubles: true });

        const threshold = getDoubleThreshold();

        if (newDoubleCount >= threshold) {
          // Hit threshold -> Turn ends with punishment
          const sipsToTake = normalCount + 1;
          setTurnResult({
            reason: `Ai dat Dublă 🎲 ${d1} - ${d2} și ai atins limita de ${threshold} duble consecutive!`,
            sipsToDrink: sipsToTake,
            isChug: false,
            isImmune: false,
            specialNote: customChallenge && customChallenge.trim() !== '' ? `Provocare: ${customChallenge}` : undefined,
          });
        } else {
          // Below threshold -> can keep rolling, notify custom challenge if any
          if (customChallenge && customChallenge.trim() !== '') {
            setAlertMessage(`Provocare dublă ${d1}-${d2}: "${customChallenge}"`);
          } else {
            setAlertMessage(`Dublă ${d1}-${d2}! Duble: ${newDoubleCount}/${threshold}. Mai aruncă sau pasează.`);
          }
        }
      }
    }, 400);
  };

  const handlePassButton = () => {
    if (isRolling || turnResult) return;

    // Record pass count for active player
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          passesCount: p.passesCount + 1,
        };
      }
      return p;
    }));

    const sipsToDrink = normalCount > 0 ? normalCount : 1;

    checkAchievement(activePlayer.name, { isPassDice: true });

    setTurnResult({
      reason: `Ai ales să pasezi tura după ${normalCount} aruncări acumulate.`,
      sipsToDrink: sipsToDrink,
      isChug: false,
      isImmune: false,
      specialNote: `Ai băut cele ${sipsToDrink} guri acumulate și predai zarurile!`,
    });
  };

  // Keyboard Shortcuts for Desktop: Space/Enter = Roll / Next Turn, P = Pass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (turnResult) {
          confirmTurnAndAdvance();
        } else if (!isRolling) {
          handleRoll();
        }
      } else if (e.code === 'KeyP' && !turnResult && !isRolling) {
        e.preventDefault();
        handlePassButton();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnResult, isRolling, normalCount, doubleCount, activePlayerIndex]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[90vh] px-4 py-4 max-w-lg mx-auto relative select-none">
      <ParticleOverlay type={particleType} onComplete={() => setParticleType(null)} />

      {/* 1v1 Head-to-Head Tracker when 2 players in normal game */}
      {players.length === 2 && (
        <div className="w-full mb-2">
          <HeadToHeadTracker
            player1={players[0]}
            player2={players[1]}
            variant="compact"
            currentMode="normal"
            className="w-full justify-center"
          />
        </div>
      )}

      {/* Header Info */}
      <div className="w-full flex items-center justify-between bg-[#161616] border border-[#2a2a2a] rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#22180f] border border-[#e8c84a]/50 overflow-hidden shadow-inner flex-shrink-0">
            <AvatarDisplay avatarId={activePlayer.avatarIcon} className="w-full h-full" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-cinzel">{t('turnOf')}</div>
            <div className="text-base font-cinzel font-bold text-[#e8c84a] gold-text-glow">
              {activePlayer.name}
            </div>
          </div>
        </div>

        {/* Difficulty Badge Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const diffs: Difficulty[] = ['weak', 'medium', 'extreme', 'nightmare'];
              const nextIdx = (diffs.indexOf(difficulty) + 1) % diffs.length;
              setDifficulty(diffs[nextIdx]);
            }}
            className="px-2.5 py-1 rounded-lg border border-[#e8c84a]/50 bg-[#221f18] text-xs font-bebas text-[#e8c84a] flex items-center gap-1 hover:brightness-110 shadow"
          >
            <span>🎯 {difficulty.toUpperCase()}</span>
          </button>

          <button
            onClick={() => setShowStatsDrawer(!showStatsDrawer)}
            className="px-2.5 py-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-xs font-barlow text-[#f0ebe0] hover:border-[#e8c84a]"
          >
            📊 {t('tabProfiles')}
          </button>
        </div>
      </div>

      {/* Character Mascot & Turn State */}
      <div className="my-3 flex flex-col items-center space-y-3">
        <MonkMascot
          avatarId={activePlayer.avatarIcon}
          characterName={activePlayer.name}
          sipsInTurn={normalCount}
          overrideState={monkOverride}
          size="lg"
          isDrinking={isRolling || monkOverride === 'dead' || monkOverride === 'drunk'}
        />

        {/* Counters Box */}
        <div className="flex items-center gap-4 bg-[#161616] border border-[#2a2a2a] rounded-2xl px-6 py-2.5 shadow-md">
          <div className="text-center">
            <div className="text-2xl font-cinzel font-bold text-[#e8c84a]">
              {normalCount} / <span className="text-xs text-[#e05c3a]">{chugThreshold}</span>
            </div>
            <div className="text-[11px] font-barlow text-gray-400 uppercase tracking-wider">
              {t('accumulatedSips')}
            </div>
          </div>

          <div className="h-8 w-px bg-[#2a2a2a]" />

          <div className="text-center">
            <div className="text-2xl font-cinzel font-bold text-[#e05c3a]">
              {doubleCount} / {getDoubleThreshold()}
            </div>
            <div className="text-[11px] font-barlow text-gray-400 uppercase tracking-wider">
              {t('doubleCount')}
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alertMessage && (
          <div className="bg-[#2a1a10] border border-[#e05c3a] text-[#f0ebe0] text-sm font-barlow px-4 py-2 rounded-xl text-center shadow animate-pulse max-w-xs">
            {alertMessage}
          </div>
        )}
      </div>

      {/* Dice & Roll Button */}
      <div className="my-2">
        <Dice
          values={diceValues}
          skin={diceSkin}
          isRolling={isRolling}
          onRoll={handleRoll}
          disabled={!!turnResult}
        />
      </div>

      {/* Action Buttons Footer */}
      <div className="w-full space-y-2 mt-3">
        <button
          onClick={handlePassButton}
          disabled={isRolling || !!turnResult}
          className="w-full py-3.5 rounded-2xl border border-[#e05c3a]/60 bg-[#1e1312] text-[#e05c3a] font-cinzel font-bold text-sm hover:bg-[#2e1814] transition-all flex items-center justify-center gap-2 shadow"
        >
          <span>🛑 {t('passTurn')} ({normalCount > 0 ? normalCount : 1} guri)</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={onOpenRules}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#161616] text-xs font-cinzel text-gray-300 hover:text-white"
          >
            📜 {t('tabRules')}
          </button>
          <button
            onClick={() => onEndGame(players)}
            className="flex-1 py-2.5 rounded-xl border border-[#e8c84a] bg-[#e8c84a]/20 text-xs font-cinzel font-bold text-[#e8c84a] hover:bg-[#e8c84a]/30"
          >
            🏁 {t('endGame')}
          </button>
        </div>
      </div>

      {/* Turn End Pop-up (Tells player exact sips to drink!) */}
      {turnResult && (
        <TurnEndDrinkModal
          player={activePlayer}
          reason={turnResult.reason}
          sipsToDrink={turnResult.sipsToDrink}
          isChug={turnResult.isChug}
          isImmune={turnResult.isImmune}
          specialNote={turnResult.specialNote}
          onUsePardonLetter={activePlayer.pardonLetters > 0 ? handleUsePardonLetter : undefined}
          onConfirm={confirmTurnAndAdvance}
        />
      )}

      {/* Live Score & Chronicle Modal */}
      <ScoreModal
        isOpen={showStatsDrawer}
        onClose={() => setShowStatsDrawer(false)}
        activePlayers={players}
        activePlayerIndex={activePlayerIndex}
        gameMode="normal"
      />
    </div>
  );
};
