import React, { useState } from 'react';
import { BoardTile, Player, TriviaQuestion, PropertyGroup, TradeAsset } from '../types';
import { GameCardDef } from '../data/cards';
import { PROPERTY_GROUPS, calculateUpgradedValues } from '../data/boardTiles';
import { useApp } from '../context/AppContext';
import { MonkMascot } from './MonkMascot';
import { AvatarDisplay } from './AvatarDisplay';

// --- Tile Detail Tooltip / Modal ---
export const TileDetailModal: React.FC<{
  tile: BoardTile | null;
  ownerName?: string;
  player?: Player;
  onUpgrade?: (tileIndex: number, cost: number) => void;
  onClose: () => void;
}> = ({ tile, ownerName, player, onUpgrade, onClose }) => {
  const { t, language } = useApp();
  if (!tile) return null;

  const groupMeta = tile.group ? PROPERTY_GROUPS[tile.group] : null;
  const isOwner = player && player.properties.includes(tile.index);
  const currentLvl = tile.buildingLevel || 0;
  const isMaxLevel = currentLvl >= 2;
  const upgradeCost = Math.round((tile.price || 5) * (currentLvl === 0 ? 1.0 : 1.5));
  const canAfford = player ? player.gold >= upgradeCost : false;
  const nextPreview = tile.buyable ? calculateUpgradedValues(tile.price || 5, tile.baseSipsCount || tile.sipsCount || 2, Math.min(2, currentLvl + 1) as 1 | 2) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-5 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-4xl">{tile.isGroapa ? '🔥' : tile.emoji}</div>
        <div className="space-y-1">
          {groupMeta && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-cinzel font-bold border"
                 style={{ backgroundColor: `${groupMeta.colorHex}22`, borderColor: groupMeta.colorHex, color: groupMeta.colorHex }}>
              <span>●</span>
              <span>{language === 'ro' ? groupMeta.nameRo : groupMeta.nameEn}</span>
            </div>
          )}
          <h3 className="text-xl font-cinzel font-bold text-[#e8c84a]">
            {language === 'ro' ? tile.nameRo : tile.nameEn}
          </h3>
        </div>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {language === 'ro' ? tile.descriptionRo : tile.descriptionEn}
        </p>

        {tile.buyable && (
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-3 rounded-xl text-xs space-y-2">
            <div className="flex justify-between items-center text-gray-400 font-cinzel">
              <span>{language === 'ro' ? 'Preț de achiziție:' : 'Purchase Price:'}</span>
              <span className="text-[#e8c84a] font-bold">{tile.price} 🪙</span>
            </div>
            <div className="flex justify-between items-center text-gray-400 font-cinzel">
              <span>{language === 'ro' ? 'Pedeapsă / Chirie:' : 'Penalty / Rent:'}</span>
              {tile.isGroapa ? (
                <span className="text-red-400 font-bold">🔥 GROAPĂ (CHUG)</span>
              ) : (
                <span className="text-yellow-300 font-bold">🍺 {tile.sipsCount} guri</span>
              )}
            </div>
            {tile.buildingLevel !== undefined && (
              <div className="flex justify-between items-center text-gray-400 font-cinzel">
                <span>{language === 'ro' ? 'Nivel Clădire:' : 'Building Level:'}</span>
                <span className="text-amber-300 font-bold">
                  {tile.buildingLevel === 0 ? 'Fără clădiri' : tile.buildingLevel === 1 ? 'Nivel 1 🏠' : 'Nivel 2 🏠🏠'}
                </span>
              </div>
            )}
            <div className="border-t border-[#333] pt-1.5 flex justify-between items-center">
              <span className="text-gray-400">{language === 'ro' ? 'Proprietar:' : 'Owner:'}</span>
              {ownerName ? (
                <span className="text-green-400 font-bold">{ownerName} 👑</span>
              ) : (
                <span className="text-gray-400 italic">{language === 'ro' ? 'Liberă' : 'Available'}</span>
              )}
            </div>

            {/* Direct Upgrade Option if active player owns this tile */}
            {isOwner && onUpgrade && (
              <div className="pt-2 border-t border-[#333]">
                {isMaxLevel ? (
                  <div className="text-center text-emerald-400 font-cinzel font-bold text-[11px] py-1 bg-emerald-950/40 rounded-lg">
                    ✨ Nivel Maxim de Clădire
                  </div>
                ) : (
                  <button
                    onClick={() => onUpgrade(tile.index, upgradeCost)}
                    disabled={!canAfford}
                    className={`w-full py-2 px-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-between transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-black hover:brightness-110 shadow'
                        : 'bg-stone-800 text-gray-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <span>🏗️ Upgrade la Nivel {currentLvl + 1}</span>
                    <span>{upgradeCost} 🪙 {nextPreview?.isGroapa ? '(🔥 Groapă)' : `(🍺 ${nextPreview?.sipsCount} guri)`}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-sm hover:brightness-110"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};

// --- Buy Property Modal ---
export const BuyPropertyModal: React.FC<{
  tile: BoardTile;
  player: Player;
  onBuy: () => void;
  onSkip: () => void;
}> = ({ tile, player, onBuy, onSkip }) => {
  const { t, language } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-5xl">🏰 🪙</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
          {t('buyTilePrompt')}
        </h3>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {t('buyTileText')} <strong className="text-[#e8c84a]">{tile.price} {t('goldUnit')}</strong>?
        </p>
        <p className="text-xs text-gray-400 font-barlow italic">
          {t('buyTileBenefit')}
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onBuy}
            disabled={player.gold < (tile.price || 0)}
            className={`flex-1 py-3 rounded-xl font-cinzel font-bold text-sm ${
              player.gold >= (tile.price || 0)
                ? 'bg-[#e8c84a] text-black hover:brightness-110 gold-glow'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            {t('buyBtn')} ({tile.price} 🪙)
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl bg-[#2a2a2a] text-gray-300 font-cinzel text-sm hover:text-white"
          >
            {t('skipBuyBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Use Pardon Letter Modal ---
export const PardonLetterPromptModal: React.FC<{
  player: Player;
  onUse: () => void;
  onDecline: () => void;
}> = ({ player, onUse, onDecline }) => {
  const { t, language } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-5xl">🎟️ 🍺</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
          {language === 'ro' ? 'Scrisoare de Iertare' : 'Pardon Letter'}
        </h3>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {t('askUsePardonLetter', { count: player.pardonLetters })}
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onUse}
            className="flex-1 py-3 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-sm hover:brightness-110 gold-glow"
          >
            {t('useLetterBtn')}
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl bg-[#e05c3a] text-white font-cinzel font-bold text-sm hover:brightness-110"
          >
            {t('noLetterBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Jail Choice Modal ---
export const JailModal: React.FC<{
  player: Player;
  onPayFee: () => void;
  onUseKey: () => void;
  onWait: () => void;
}> = ({ player, onPayFee, onUseKey, onWait }) => {
  const { t } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e05c3a] rounded-2xl p-6 max-w-sm w-full space-y-4 flame-glow text-center">
        <div className="text-5xl">👮 ⛓️</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e05c3a] flame-text-glow">
          {t('inJailTitle')}
        </h3>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {t('inJailDesc', { turns: player.jailTurnsLeft })}
        </p>

        <div className="space-y-2.5 pt-2">
          {player.gold >= 10 && (
            <button
              onClick={onPayFee}
              className="w-full py-3 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-sm hover:brightness-110 gold-glow"
            >
              {t('payJailFeeBtn')}
            </button>
          )}

          {player.jailKeys > 0 && (
            <button
              onClick={onUseKey}
              className="w-full py-3 rounded-xl bg-[#4a90e2] text-white font-cinzel font-bold text-sm hover:brightness-110"
            >
              {t('useJailKeyBtn')} (x{player.jailKeys})
            </button>
          )}

          <button
            onClick={onWait}
            className="w-full py-3 rounded-xl bg-[#2a2a2a] text-gray-300 font-cinzel text-sm hover:text-white"
          >
            {t('waitJailBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Mystery / Risk Card Modal (10-Card Deck Selector with 3D Flip Animation) ---
export const CardModal: React.FC<{
  card: GameCardDef;
  onConfirm: () => void;
}> = ({ card, onConfirm }) => {
  const { t, language } = useApp();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isRisk = card.kind === 'risk';
  const isGood = card.type === 'good';

  const handleSelectCard = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);

    // Trigger 3D flip animation immediately
    setTimeout(() => {
      setIsFlipped(true);
    }, 50);

    // Zoom into focus
    setTimeout(() => {
      setIsExpanded(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      {/* Title as requested in screenshot */}
      <div className={`text-center mb-4 sm:mb-6 transition-all duration-500 ${isExpanded ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
        <h2 className="text-2xl sm:text-4xl font-cinzel font-bold text-[#e8c84a] tracking-widest gold-text-glow">
          {language === 'ro' ? (isRisk ? 'ALEGE O CARTE DE RISC' : 'ALEGE O CARTE') : (isRisk ? 'CHOOSE A RISK CARD' : 'CHOOSE A CARD')}
        </h2>
        <p className="text-xs sm:text-sm font-barlow text-gray-400 mt-1">
          {selectedIdx === null
            ? (language === 'ro' ? 'Atinge una din cele 10 cărți pentru a-ți dezvălui soarta' : 'Tap one of the 10 cards to reveal your fate')
            : (language === 'ro' ? 'Soarta a fost pecetluită...' : 'Your fate is sealed...')}
        </p>
      </div>

      {/* 2x5 Grid of 10 Cards */}
      <div className="relative flex items-center justify-center w-full max-w-lg">
        {/* Grid View */}
        <div className={`grid grid-cols-5 gap-2 sm:gap-3.5 w-full transition-all duration-700 ${
          isExpanded ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        }`}>
          {Array.from({ length: 10 }).map((_, idx) => {
            const isSelected = selectedIdx === idx;
            const isOther = selectedIdx !== null && !isSelected;

            return (
              <div
                key={idx}
                onClick={() => handleSelectCard(idx)}
                style={{ perspective: '1000px' }}
                className={`aspect-[2/3] cursor-pointer transition-all duration-500 ${
                  isOther ? 'opacity-15 scale-90 pointer-events-none' : 'hover:scale-105 active:scale-95'
                }`}
              >
                <div
                  className={`w-full h-full rounded-xl sm:rounded-2xl transition-transform duration-700 transform-style-3d relative ${
                    isSelected && isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Card Back (Matching screenshot: dark with crisp gold border and ? or !) */}
                  <div className={`absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shadow-2xl ${
                    isRisk
                      ? 'bg-gradient-to-b from-[#24130d] via-[#160c08] to-[#24130d] border-[#e05c3a] flame-glow'
                      : 'bg-gradient-to-b from-[#241c10] via-[#14100a] to-[#241c10] border-[#e8c84a] gold-glow'
                  }`}>
                    {/* Inner subtle border */}
                    <div className="absolute inset-1 rounded-lg border border-[#e8c84a]/30 pointer-events-none" />
                    
                    {/* Centered Symbol */}
                    <span className={`text-2xl sm:text-4xl font-cinzel font-bold select-none ${
                      isRisk ? 'text-[#e05c3a] flame-text-glow' : 'text-[#e8c84a] gold-text-glow'
                    }`}>
                      {isRisk ? '!' : '?'}
                    </span>
                  </div>

                  {/* Card Front (Revealed on 3D flip) */}
                  <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center p-2 shadow-2xl ${
                    isGood
                      ? 'bg-gradient-to-b from-[#2b2210] to-[#120f08] border-[#e8c84a] gold-glow'
                      : 'bg-gradient-to-b from-[#2b1410] to-[#120806] border-[#e05c3a] flame-glow'
                  }`}>
                    <span className="text-xl sm:text-2xl">{isGood ? '✨' : '🔥'}</span>
                    <span className="text-[9px] font-cinzel font-bold text-[#ffd700] truncate mt-1">
                      {language === 'ro' ? card.titleRo : card.titleEn}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Focused Card Modal (Pop in with zoom) */}
        {isExpanded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-fade-in px-2">
            <div className={`w-full max-w-sm rounded-3xl p-6 border-3 text-center space-y-4 shadow-2xl relative ${
              isGood
                ? 'bg-gradient-to-b from-[#241c10] via-[#171209] to-[#0f0c06] border-[#e8c84a] gold-glow-lg'
                : 'bg-gradient-to-b from-[#29130d] via-[#1a0c08] to-[#100604] border-[#e05c3a] flame-glow'
            }`}>
              {/* Top Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cinzel font-bold border border-white/20 bg-black/60 shadow">
                <span>{language === 'ro' ? (isRisk ? '🔥 RISC MĂNĂSTIRESC' : '✨ MISTER SFÂNT') : (isRisk ? '🔥 MONASTERY RISK' : '✨ HOLY MYSTERY')}</span>
              </div>

              {/* Large Icon / Artwork */}
              <div className="text-5xl sm:text-6xl drop-shadow-lg transform transition-transform hover:scale-110">
                {isRisk ? '❗' : '❓'}
              </div>

              {/* Title */}
              <h3 className={`text-2xl sm:text-3xl font-cinzel font-black tracking-wide ${
                isGood ? 'text-[#e8c84a] gold-text-glow' : 'text-[#e05c3a] flame-text-glow'
              }`}>
                {language === 'ro' ? card.titleRo : card.titleEn}
              </h3>

              {/* Card Description */}
              <p className="text-base sm:text-lg font-barlow text-[#f0ebe0] leading-relaxed px-2">
                {language === 'ro' ? card.effectRo : card.effectEn}
              </p>

              {/* Consequence Badge */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3 shadow-inner">
                <span className={`text-sm font-cinzel font-bold ${isGood ? 'text-green-400' : 'text-orange-400'}`}>
                  {language === 'ro' ? (isGood ? '✨ Binecuvântare primită' : '⚖️ Pedeapsă de ispășit') : (isGood ? '✨ Blessing received' : '⚖️ Penalty to serve')}
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={onConfirm}
                className={`w-full py-3.5 rounded-2xl font-cinzel font-black text-lg transition-all transform active:scale-95 shadow-xl ${
                  isGood
                    ? 'bg-gradient-to-r from-[#e8c84a] via-[#ffd700] to-[#e8c84a] text-black hover:brightness-110 gold-glow'
                    : 'bg-gradient-to-r from-[#e05c3a] via-[#ff6b4a] to-[#e05c3a] text-white hover:brightness-110 flame-glow'
                }`}
              >
                {t('confirm')} ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Trivia Modal ---
export const TriviaModal: React.FC<{
  question: TriviaQuestion;
  onAnswer: (isCorrect: boolean) => void;
}> = ({ question, onAnswer }) => {
  const { t, language } = useApp();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const options = language === 'ro' ? question.optionsRo : question.optionsEn;
  const qText = language === 'ro' ? question.questionRo : question.questionEn;

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelectedIdx(idx);
    setHasAnswered(true);

    const isCorrect = idx === question.correctIndex;
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-md w-full space-y-5 gold-glow">
        <div className="text-center space-y-1">
          <div className="text-4xl">🧠 📜</div>
          <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
            {t('triviaTitle')}
          </h3>
          <p className="text-xs text-gray-400 font-barlow">
            {t('triviaReward')}
          </p>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-xl text-center text-sm font-barlow text-[#f0ebe0] font-bold">
          {qText}
        </div>

        <div className="space-y-2.5">
          {options.map((opt, idx) => {
            let style = 'border-[#2a2a2a] bg-[#121212] text-[#f0ebe0] hover:border-[#e8c84a]';
            if (hasAnswered) {
              if (idx === question.correctIndex) {
                style = 'border-green-500 bg-green-950/80 text-green-300 font-bold';
              } else if (idx === selectedIdx) {
                style = 'border-red-500 bg-red-950/80 text-red-300';
              }
            }

            return (
              <button
                key={idx}
                disabled={hasAnswered}
                onClick={() => handleSelect(idx)}
                className={`w-full p-3 rounded-xl border text-left font-barlow text-sm transition-all flex items-center gap-2 ${style}`}
              >
                <span className="font-bebas text-lg text-[#e8c84a]">{String.fromCharCode(65 + idx)}.</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="text-center font-cinzel font-bold text-sm">
            {selectedIdx === question.correctIndex ? (
              <span className="text-green-400">{t('correctAnswerMsg')}</span>
            ) : (
              <span className="text-red-400">
                {t('wrongAnswerMsg')} {options[question.correctIndex]}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Ultra Realistic Vintage Monastery Slot Machine Modal ---
export const SlotModal: React.FC<{
  onComplete: (resultType: 'monks' | 'beers' | 'sevens') => void;
}> = ({ onComplete }) => {
  const { t, language } = useApp();
  const [spinning, setSpinning] = useState<boolean>(false);
  const [leverPulled, setLeverPulled] = useState<boolean>(false);
  
  // Independent reels for realistic sequential stopping
  const [reel1, setReel1] = useState<string>('🍺');
  const [reel2, setReel2] = useState<string>('🍺');
  const [reel3, setReel3] = useState<string>('🍺');
  
  const [reel1Spinning, setReel1Spinning] = useState<boolean>(false);
  const [reel2Spinning, setReel2Spinning] = useState<boolean>(false);
  const [reel3Spinning, setReel3Spinning] = useState<boolean>(false);
  const [isSuspense77, setIsSuspense77] = useState<boolean>(false);

  const [resultType, setResultType] = useState<'monks' | 'beers' | 'sevens' | null>(null);

  const symbols = ['🍺', '🧔‍♂️', '7️⃣', '🪙', '🍷', '🍖'];

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setLeverPulled(true);
    setIsSuspense77(false);
    setResultType(null);

    setTimeout(() => setLeverPulled(false), 600);

    // Weighted outcome: 40% monks, 40% beers, 20% sevens jackpot
    const rand = Math.random();
    let outcome: 'monks' | 'beers' | 'sevens' = 'beers';
    let targetSymbol = '🍺';

    if (rand < 0.40) {
      outcome = 'monks';
      targetSymbol = '🧔‍♂️';
    } else if (rand < 0.80) {
      outcome = 'beers';
      targetSymbol = '🍺';
    } else {
      outcome = 'sevens';
      targetSymbol = '7️⃣';
    }

    setReel1Spinning(true);
    setReel2Spinning(true);
    setReel3Spinning(true);

    // 3 distinct animation intervals for each reel
    const int1 = setInterval(() => {
      setReel1(symbols[Math.floor(Math.random() * symbols.length)]);
    }, 55);

    const int2 = setInterval(() => {
      setReel2(symbols[Math.floor(Math.random() * symbols.length)]);
    }, 75);

    let int3 = setInterval(() => {
      setReel3(symbols[Math.floor(Math.random() * symbols.length)]);
    }, 95);

    // Stop Reel 1 after 1.0s
    setTimeout(() => {
      clearInterval(int1);
      setReel1(targetSymbol);
      setReel1Spinning(false);
    }, 1000);

    if (outcome === 'sevens') {
      // 7-7 SUSPENSE FLOW!
      // Stop Reel 2 on 7 after 1.8s
      setTimeout(() => {
        clearInterval(int2);
        setReel2('7️⃣');
        setReel2Spinning(false);
        
        // TRIGGER INTENSE SUSPENSE FOR REEL 3
        setIsSuspense77(true);
        clearInterval(int3);

        // Reel 3 ticks slowly through symbols with heavy deceleration
        let suspenseStep = 0;
        const suspensePool = ['🍺', '🪙', '🧔‍♂️', '🍷', '🍖', '7️⃣'];
        int3 = setInterval(() => {
          suspenseStep++;
          setReel3(suspensePool[suspenseStep % suspensePool.length]);
        }, 320);

        // Final snap of 3rd 7 after 2.8s of nail-biting suspense!
        setTimeout(() => {
          clearInterval(int3);
          setReel3('7️⃣');
          setReel3Spinning(false);
          setIsSuspense77(false);
          setSpinning(false);
          setResultType('sevens');
        }, 2800);

      }, 1800);

    } else {
      // NORMAL FLOW (non-7-7)
      // Stop Reel 2 after 1.6s
      setTimeout(() => {
        clearInterval(int2);
        setReel2(targetSymbol);
        setReel2Spinning(false);
      }, 1600);

      // Stop Reel 3 after 2.2s
      setTimeout(() => {
        clearInterval(int3);
        setReel3(targetSymbol);
        setReel3Spinning(false);
        setSpinning(false);
        setResultType(outcome);
      }, 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md select-none animate-fade-in">
      {/* Slot Machine Wooden & Brass Arcade Cabinet */}
      <div className={`relative bg-gradient-to-b from-[#2e1d12] via-[#1a1008] to-[#120b05] border-4 rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full space-y-3.5 text-center transition-all duration-300 ${
        isSuspense77
          ? 'border-[#ff4444] animate-suspense-glow'
          : 'border-[#e8c84a] shadow-[0_0_50px_rgba(232,200,74,0.35)]'
      }`}>
        
        {/* Top Ornate Marquee with Golden Arch & Flashing Bulbs */}
        <div className="relative bg-gradient-to-r from-[#170e08] via-[#3a2514] to-[#170e08] border-2 border-[#e8c84a] rounded-2xl p-2.5 shadow-md overflow-hidden">
          {/* Decorative Marquee Bulbs */}
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-bulb shadow" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bulb shadow" style={{ animationDelay: '0.15s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-bulb shadow" style={{ animationDelay: '0.3s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bulb shadow" style={{ animationDelay: '0.45s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-bulb shadow" style={{ animationDelay: '0.6s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bulb shadow" style={{ animationDelay: '0.75s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-bulb shadow" style={{ animationDelay: '0.9s' }} />
          </div>

          <h3 className="text-xl sm:text-2xl font-cinzel font-black text-[#ffd700] tracking-wider gold-text-glow flex items-center justify-center gap-2">
            <span>🎰</span>
            <span>{language === 'ro' ? 'PĂCĂNEAUA SFÂNTĂ' : 'HOLY SLOT MACHINE'}</span>
            <span>🎰</span>
          </h3>
          <p className="text-[10px] font-cinzel text-amber-200/80 tracking-widest uppercase">
            {language === 'ro' ? 'Taverna Păcatului Mănăstiresc • 100% Cinstire' : 'Monastery Tavern • 100% Fair Play'}
          </p>
        </div>

        {/* Suspense 7-7 Alert Header Banner */}
        {isSuspense77 && (
          <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black font-cinzel font-black text-xs sm:text-sm py-1.5 px-3 rounded-xl animate-pulse shadow-lg tracking-wider">
            {language === 'ro' ? '🔥 SUSPANS 7 - 7 ! VINE AL TREILEA 7️⃣?! 🔥' : '🔥 SUSPENSE 7 - 7 ! WILL THE 3RD 7️⃣ LAND?! 🔥'}
          </div>
        )}

        {/* Illuminated Paytable Legend Banner */}
        {!isSuspense77 && (
          <div className="bg-[#0e0a06] border border-[#e8c84a]/40 rounded-xl p-1.5 text-[10px] sm:text-[11px] font-barlow text-gray-300 grid grid-cols-3 gap-1.5 shadow-inner">
            <div className="p-1 rounded bg-[#1c140d]/60 border border-amber-500/20">
              <div className="text-xs">🍺🍺🍺</div>
              <div className="text-[#ffd700] font-bold">{language === 'ro' ? '3 Guri' : '3 Sips'}</div>
            </div>
            <div className="p-1 rounded bg-[#1c140d]/60 border border-amber-500/20">
              <div className="text-xs">🧔‍♂️🧔‍♂️🧔‍♂️</div>
              <div className="text-[#ffd700] font-bold">{language === 'ro' ? 'Toți beau 3!' : 'All drink 3!'}</div>
            </div>
            <div className="p-1 rounded bg-[#2e1208]/80 border border-red-500/30">
              <div className="text-xs">7️⃣7️⃣7️⃣</div>
              <div className="text-red-400 font-bold">JACKPOT 🔥</div>
            </div>
          </div>
        )}

        {/* 3 Mechanical Reels Display Windows (NO center line, 3 distinct spin animations) */}
        <div className="relative flex items-center justify-center gap-3">
          {/* Main Reels Bezel with Deep Walnut Texture */}
          <div className={`flex-1 bg-gradient-to-b from-[#0a0704] via-[#140e09] to-[#0a0704] border-3 rounded-2xl p-2.5 sm:p-3 shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] relative overflow-hidden transition-colors duration-300 ${
            isSuspense77 ? 'border-red-500' : 'border-[#3d2a19]'
          }`}>
            
            {/* 3 Reel Columns */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Reel 1 (Fast initial spin) */}
              <div className={`h-24 sm:h-28 bg-gradient-to-b from-[#1b140d] via-[#2d2216] to-[#1b140d] border-2 rounded-xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg relative overflow-hidden transition-colors ${
                reel1Spinning ? 'animate-reel-spin-1 border-[#ffd700]' : 'border-[#e8c84a]/60'
              }`}>
                {/* Curved Glass Reflection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40 pointer-events-none" />
                <span className="drop-shadow-md select-none transform transition-transform">{reel1}</span>
              </div>

              {/* Reel 2 (Medium rolling spin) */}
              <div className={`h-24 sm:h-28 bg-gradient-to-b from-[#1b140d] via-[#2d2216] to-[#1b140d] border-2 rounded-xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg relative overflow-hidden transition-colors ${
                reel2Spinning ? 'animate-reel-spin-2 border-[#ffd700]' : 'border-[#e8c84a]/60'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40 pointer-events-none" />
                <span className="drop-shadow-md select-none transform transition-transform">{reel2}</span>
              </div>

              {/* Reel 3 (Smooth spin or Suspense slow stepping) */}
              <div className={`h-24 sm:h-28 bg-gradient-to-b from-[#1b140d] via-[#2d2216] to-[#1b140d] border-2 rounded-xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg relative overflow-hidden transition-colors ${
                isSuspense77
                  ? 'animate-reel-suspense border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  : reel3Spinning
                  ? 'animate-reel-spin-3 border-[#ffd700]'
                  : 'border-[#e8c84a]/60'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40 pointer-events-none" />
                <span className={`drop-shadow-md select-none transform transition-transform ${isSuspense77 ? 'scale-110' : ''}`}>
                  {reel3}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Mechanical Slot Machine Pull Lever */}
          <div
            onClick={!spinning ? handleSpin : undefined}
            className={`hidden sm:flex flex-col items-center justify-end h-28 cursor-pointer ${spinning ? 'cursor-not-allowed opacity-60' : 'hover:brightness-125'}`}
            title={language === 'ro' ? 'Trage de manetă!' : 'Pull the lever!'}
          >
            {/* Lever Knob */}
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-800 border-2 border-amber-300 shadow-[0_0_12px_rgba(239,68,68,0.7)] ${
              leverPulled ? 'animate-lever-pull' : ''
            }`} />
            {/* Lever Rod */}
            <div className="w-2.5 h-14 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 border border-black rounded-sm shadow" />
            {/* Lever Base */}
            <div className="w-8 h-4 bg-[#3d2a19] border border-[#e8c84a] rounded-t-md" />
          </div>
        </div>

        {/* Arcade Status & Coin Indicator */}
        <div className="flex items-center justify-between px-2 text-[10px] font-cinzel text-gray-400">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${spinning ? 'bg-amber-400 animate-ping' : 'bg-green-400 shadow-[0_0_6px_#4ade80]'}`} />
            <span>
              {spinning
                ? (isSuspense77 ? (language === 'ro' ? '🔥 SUSPANS ACTIV' : '🔥 SUSPENSE ACTIVE') : (language === 'ro' ? 'ROTIRE ACTIVĂ' : 'SPINNING...'))
                : (language === 'ro' ? 'GATA DE JOC' : 'READY TO PLAY')}
            </span>
          </div>
          <div className="text-amber-300/80">
            🪙 1 {language === 'ro' ? 'MONEDĂ MĂNĂSTIREASCĂ' : 'MONASTERY COIN'}
          </div>
        </div>

        {/* Controls: Realistic 3D SPIN BUTTON */}
        {!resultType && (
          <div className="pt-1">
            <button
              onClick={handleSpin}
              disabled={spinning}
              className={`w-full py-3.5 sm:py-4 rounded-2xl font-cinzel font-black text-lg sm:text-xl tracking-wider uppercase transition-all duration-150 transform active:translate-y-1 shadow-2xl flex items-center justify-center gap-2 ${
                spinning
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-black hover:brightness-110 gold-glow active:shadow-none'
              }`}
            >
              <span>⚡</span>
              <span>
                {isSuspense77
                  ? (language === 'ro' ? '🔥 SUSPANS 7-7...' : '🔥 SUSPENSE 7-7...')
                  : spinning
                  ? (language === 'ro' ? 'ROTIRE ÎN CURS...' : 'SPINNING...')
                  : (language === 'ro' ? 'SPIN / ROTEȘTE' : 'SPIN THE REELS')}
              </span>
              <span>⚡</span>
            </button>
          </div>
        )}

        {/* Winning / Outcome Banner */}
        {resultType && (
          <div className="space-y-3 animate-fade-in pt-1">
            <div className={`p-3 rounded-2xl border-2 shadow-xl text-center ${
              resultType === 'sevens'
                ? 'bg-[#2e1208] border-red-500 flame-glow'
                : 'bg-[#1e170d] border-[#ffd700] gold-glow'
            }`}>
              <div className="text-xs font-cinzel text-gray-400 uppercase">{language === 'ro' ? 'Rezultat Slot' : 'Slot Outcome'}</div>
              <div className="text-base sm:text-lg font-cinzel font-black text-[#ffd700] mt-0.5">
                {resultType === 'monks' && (language === 'ro' ? '🧔‍♂️ 3 CĂLUGĂRI! Ceilalți beau 3 guri fiecare!' : '🧔‍♂️ 3 MONKS! Everyone else drinks 3 sips each!')}
                {resultType === 'beers' && (language === 'ro' ? '🍺 3 BERI! Bei 3 guri de bere!' : '🍺 3 BEERS! Drink 3 sips of beer!')}
                {resultType === 'sevens' && (language === 'ro' ? '🔥 MARELE JACKPOT! Furi 10🪙 de la toți ȘI toți dau GROAPĂ!' : '🔥 GRAND JACKPOT! Steal 10🪙 from everyone AND all CHUG!')}
              </div>
            </div>

            <button
              onClick={() => onComplete(resultType)}
              className="w-full py-3.5 rounded-2xl bg-[#ffd700] text-black font-cinzel font-black text-base hover:brightness-110 gold-glow shadow-xl"
            >
              {language === 'ro' ? 'COLECTEAZĂ SOARTA ➔' : 'CLAIM YOUR FATE ➔'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Two Truths and a Lie Modal ---
export const TwoTruthsModal: React.FC<{
  onResolve: (guessed: boolean) => void;
}> = ({ onResolve }) => {
  const { t } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-5xl">🎭 📜</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
          {t('twoTruthsTitle')}

        </h3>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {t('twoTruthsDesc')}
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => onResolve(true)}
            className="w-full py-3 rounded-xl bg-[#e05c3a] text-white font-cinzel font-bold text-sm hover:brightness-110"
          >
            {t('theyGuessedBtn')}
          </button>
          <button
            onClick={() => onResolve(false)}
            className="w-full py-3 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-sm hover:brightness-110 gold-glow"
          >
            {t('theyDidntGuessBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Merchant Modal (Târgul cu Scrisori & Chei) ---
export const MerchantModal: React.FC<{
  player: Player;
  onBuyPardon?: () => void;
  onBuyKey?: () => void;
  onBuy?: () => void;
  onDecline: () => void;
}> = ({ player, onBuyPardon, onBuyKey, onBuy, onDecline }) => {
  const { language } = useApp();
  const buyPardon = onBuyPardon || onBuy || (() => {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#16130e] border-2 border-[#ffd700] rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl gold-glow">
        <div className="text-4xl">🧙 📜 🔓</div>
        <h3 className="text-xl font-cinzel font-black text-[#ffd700] gold-text-glow">
          {language === 'ro' ? 'Târgul cu Scrisori & Chei' : 'Pardon & Keys Bazaar'}
        </h3>
        <p className="text-xs font-barlow text-gray-300">
          {language === 'ro'
            ? 'Negustorul misterios al mănăstirii îți pune la dispoziție relicve valoroase de scăpare:'
            : 'The monastery mystic offers valuable escape relics for your journey:'}
        </p>

        <div className="p-2 rounded-xl bg-[#201911] border border-[#ffd700]/30 text-xs font-cinzel text-amber-300 font-bold">
          🪙 {language === 'ro' ? 'Aurul tău:' : 'Your Gold:'} {player.gold} galbeni
        </div>

        <div className="space-y-2 pt-1">
          <button
            disabled={player.gold < 30}
            onClick={buyPardon}
            className={`w-full py-2.5 px-3 rounded-2xl font-cinzel font-bold text-xs flex items-center justify-between transition-all ${
              player.gold >= 30
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:brightness-110 shadow-md'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>🎟️</span>
              <span>{language === 'ro' ? 'Scrisoare de Iertare' : 'Pardon Letter'}</span>
            </span>
            <span className="font-black">30 🪙</span>
          </button>

          {onBuyKey && (
            <button
              disabled={player.gold < 20}
              onClick={onBuyKey}
              className={`w-full py-2.5 px-3 rounded-2xl font-cinzel font-bold text-xs flex items-center justify-between transition-all ${
                player.gold >= 20
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-110 shadow-md'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <span>🔓</span>
                <span>{language === 'ro' ? 'Cheie de Temniță' : 'Dungeon Key'}</span>
              </span>
              <span className="font-black">20 🪙</span>
            </button>
          )}

          <button
            onClick={onDecline}
            className="w-full py-2.5 rounded-2xl bg-[#241c14] border border-stone-700 text-gray-300 font-cinzel text-xs hover:text-white transition-all"
          >
            {language === 'ro' ? 'Pas (Nu cumpăr nimic)' : 'Pass (Decline)'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Select Player Modal ---
export const SelectPlayerModal: React.FC<{
  title: string;
  players: Player[];
  activePlayerId: string;
  onSelect: (targetPlayerId: string) => void;
}> = ({ title, players, activePlayerId, onSelect }) => {
  const { t } = useApp();
  const eligible = players.filter(p => p.id !== activePlayerId && !p.hasGivenUp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-sm w-full space-y-4 gold-glow text-center">
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
          {title}
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {eligible.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full p-3 rounded-xl border border-[#2a2a2a] bg-[#121212] hover:border-[#e8c84a] text-left font-cinzel text-sm text-[#f0ebe0] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#22180f] border border-[#e8c84a]/30 flex-shrink-0">
                  <AvatarDisplay avatarId={p.avatarIcon} className="w-full h-full" />
                </div>
                <span>{p.name}</span>
              </div>
              <span className="text-xs text-gray-400">🍺 {p.sipsTotal}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Building Upgrade Modal (Section 2) ---
export const UpgradeBuildingsModal: React.FC<{
  player: Player;
  tiles: BoardTile[];
  onUpgradeTile: (tileIndex: number, cost: number) => void;
  onClose: () => void;
}> = ({ player, tiles, onUpgradeTile, onClose }) => {
  const { language } = useApp();

  // Find all groups where the player owns ALL properties in the group
  const ownedGroups: { groupKey: PropertyGroup; groupMeta: any; groupTiles: BoardTile[] }[] = [];

  (Object.keys(PROPERTY_GROUPS) as PropertyGroup[]).forEach((gKey) => {
    const meta = PROPERTY_GROUPS[gKey];
    const hasAll = meta.tileIndices.every((idx) => player.properties.includes(idx));
    if (hasAll) {
      const gTiles = meta.tileIndices.map((idx) => tiles[idx]);
      ownedGroups.push({ groupKey: gKey, groupMeta: meta, groupTiles: gTiles });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
      <div className="bg-[#14120e] border-2 border-[#ffd700] rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl gold-glow my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="text-center space-y-1 border-b border-[#2d2215] pb-3">
          <div className="text-3xl sm:text-4xl">🏗️ 🏰</div>
          <h3 className="text-xl sm:text-2xl font-cinzel font-black text-[#ffd700] gold-text-glow">
            {language === 'ro' ? 'Construcție & Upgrade Clădiri' : 'Building Upgrades & Expansions'}
          </h3>
          <p className="text-xs text-gray-300 font-barlow">
            {language === 'ro'
              ? 'Fiecare clădire adaugă +80% guri! Peste 25 guri devine automat GROAPĂ permanentă 🔥.'
              : 'Each upgrade adds +80% sips! Over 25 sips permanently becomes a CHUG (GROAPĂ) 🔥.'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201911] border border-[#ffd700]/40 text-xs font-cinzel text-[#ffd700] mt-1 font-bold">
            <span>🪙 Aur disponibil:</span>
            <span>{player.gold} galbeni</span>
          </div>
        </div>

        {/* Groups List */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {ownedGroups.length === 0 ? (
            <div className="text-center py-8 space-y-3 bg-[#1c1610] rounded-2xl border border-stone-800 p-4">
              <div className="text-3xl">📜</div>
              <h4 className="font-cinzel text-sm font-bold text-amber-300">
                {language === 'ro' ? 'Niciun Set Complet Deținut' : 'No Complete Color Sets Owned'}
              </h4>
              <p className="text-xs text-gray-400 font-barlow max-w-xs mx-auto">
                {language === 'ro'
                  ? 'Pentru a construi clădiri, trebuie să deții toate proprietățile dintr-un grup de culoare (Maro, Albastru, Verde, Portocaliu sau Auriu).'
                  : 'To upgrade buildings, you must own all properties within a color district (Brown, Blue, Green, Orange, or Gold).'}
              </p>
            </div>
          ) : (
            ownedGroups.map(({ groupKey, groupMeta, groupTiles }) => (
              <div
                key={groupKey}
                className="bg-[#18130d] border border-[#3d2a19] rounded-2xl p-3 space-y-3 shadow-md"
              >
                {/* Group Title Bar */}
                <div className="flex items-center justify-between border-b border-[#2d1e12] pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full shadow"
                      style={{ backgroundColor: groupMeta.colorHex }}
                    />
                    <span className="font-cinzel font-bold text-sm text-[#ffd700]">
                      {language === 'ro' ? groupMeta.nameRo : groupMeta.nameEn}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                      {language === 'ro' ? 'Set Complet 👑' : 'Complete Set 👑'}
                    </span>
                  </div>
                </div>

                {/* Tiles Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {groupTiles.map((tile) => {
                    const currentLevel = tile.buildingLevel || 0;
                    const basePrice = tile.basePrice || tile.price || 10;
                    const baseSips = tile.baseSipsCount || tile.sipsCount || 4;

                    const upgradeMeta = calculateUpgradedValues(basePrice, baseSips, currentLevel);
                    const isMaxLevel = currentLevel >= 2;
                    const cost = upgradeMeta.nextUpgradeCost || 0;
                    const canAfford = player.gold >= cost;

                    // Compute preview of next level
                    let nextPreview: { sips: number; isGroapa: boolean } | null = null;
                    if (!isMaxLevel) {
                      const nextLevel = (currentLevel + 1) as 1 | 2;
                      const nextVals = calculateUpgradedValues(basePrice, baseSips, nextLevel);
                      nextPreview = { sips: nextVals.sipsCount, isGroapa: nextVals.isGroapa };
                    }

                    return (
                      <div
                        key={tile.index}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          tile.isGroapa
                            ? 'bg-gradient-to-r from-[#2a0e0e] to-[#1a0808] border-red-600/70'
                            : currentLevel > 0
                            ? 'bg-gradient-to-r from-[#21180d] to-[#171109] border-[#e8c84a]/60'
                            : 'bg-[#120e0a] border-stone-800'
                        }`}
                      >
                        {/* Tile Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{tile.isGroapa ? '🔥' : tile.emoji}</span>
                            <span className="font-cinzel font-bold text-xs sm:text-sm text-white">
                              {language === 'ro' ? tile.nameRo : tile.nameEn}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              (#{tile.index})
                            </span>
                          </div>

                          {/* Building Icons & Current Sips */}
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 font-cinzel text-amber-300 font-bold">
                              <span>Nivel {currentLevel}/2</span>
                              {currentLevel === 1 && <span>🏠</span>}
                              {currentLevel === 2 && <span>🏠🏠</span>}
                            </div>
                            <span className="text-gray-500">•</span>
                            <div className="font-bold">
                              {tile.isGroapa ? (
                                <span className="text-red-400 font-black animate-pulse">
                                  🔥 GROAPĂ (CHUG)
                                </span>
                              ) : (
                                <span className="text-yellow-300">
                                  🍺 {tile.sipsCount} guri chirie
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Upgrade Action Button */}
                        <div>
                          {isMaxLevel ? (
                            <span className="text-[11px] font-cinzel font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-600/40 inline-block text-center">
                              ✨ Nivel Maxim
                            </span>
                          ) : (
                            <button
                              onClick={() => onUpgradeTile(tile.index, cost)}
                              disabled={!canAfford}
                              className={`w-full sm:w-auto px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex flex-col items-center gap-0.5 transition-all shadow ${
                                canAfford
                                  ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black hover:brightness-110 active:scale-95'
                                  : 'bg-stone-800 text-gray-500 border border-stone-700 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <span>🏗️ Upgrade</span>
                                <span>({cost} 🪙)</span>
                              </div>
                              {nextPreview && (
                                <span className="text-[9px] font-barlow tracking-tight">
                                  ➔ {nextPreview.isGroapa ? '🔥 Devine GROAPĂ!' : `+80% (🍺 ${nextPreview.sips} guri)`}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-[#2d2215]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#2a1f13] border border-[#ffd700]/50 text-[#ffd700] font-cinzel font-bold text-sm hover:bg-[#3d2d1c] transition-all"
          >
            {language === 'ro' ? 'Închide Panoul de Construcții' : 'Close Construction Panel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Trade Auction Modal (Section 3) ---
export interface TradeAuctionModalProps {
  auctioneer?: Player;
  activePlayer?: Player;
  players?: Player[];
  allPlayers?: Player[];
  tiles: BoardTile[];
  onExecuteTrade: (
    bidderId: string,
    auctioneerAsset: TradeAsset,
    bidderAssets: TradeAsset[]
  ) => void;
  onPass?: () => void;
  onClose?: () => void;
}

export const TradeAuctionModal: React.FC<TradeAuctionModalProps> = ({
  auctioneer: propAuctioneer,
  activePlayer: propActivePlayer,
  players: propPlayers,
  allPlayers: propAllPlayers,
  tiles,
  onExecuteTrade,
  onPass,
  onClose,
}) => {
  const { language } = useApp();
  const auctioneer = propAuctioneer || propActivePlayer;
  const players = propAllPlayers || propPlayers || [];
  const handleClose = onPass || onClose || (() => {});

  // Phase: 1. selecting_asset -> 2. collecting_bids -> 3. reviewing_bids
  const [phase, setPhase] = useState<'select_asset' | 'bidding' | 'review'>('select_asset');
  const [selectedAuctionAsset, setSelectedAuctionAsset] = useState<TradeAsset | null>(null);

  if (!auctioneer) return null;

  // Other eligible players
  const otherPlayers = (players || []).filter((p) => p && p.id !== auctioneer.id && !p.hasGivenUp);

  // Bids state from each other player: { bidderId: TradeAsset[] }
  const [playerBids, setPlayerBids] = useState<Record<string, TradeAsset[]>>({});
  const [activeBidderIndex, setActiveBidderIndex] = useState<number>(0);

  // Available assets of auctioneer
  const auctioneerProperties = (auctioneer.properties || []).map((idx) => tiles[idx]).filter(Boolean);
  const hasPardonLetter = (auctioneer.pardonLetters || 0) > 0;
  const hasJailKey = (auctioneer.jailKeys || 0) > 0;
  const hasAnyAsset = auctioneerProperties.length > 0 || hasPardonLetter || hasJailKey;

  // Render Asset Badge Helper
  const renderAssetLabel = (asset: TradeAsset) => {
    if (asset.type === 'property') {
      const tile = tiles[asset.tileIndex];
      if (!tile) return <span className="text-xs font-cinzel">Proprietate #{asset.tileIndex}</span>;
      return (
        <span className="inline-flex items-center gap-1 text-xs font-cinzel font-bold text-amber-200">
          <span>{tile.emoji}</span>
          <span>{language === 'ro' ? tile.nameRo : tile.nameEn}</span>
          <span className="text-[10px] text-gray-400 font-mono">(#{tile.index})</span>
        </span>
      );
    } else if (asset.itemType === 'pardonLetter') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-cinzel font-bold text-blue-300">
          <span>🎟️</span>
          <span>{language === 'ro' ? 'Scrisoare de Iertare' : 'Pardon Letter'}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-cinzel font-bold text-emerald-300">
          <span>🔓</span>
          <span>{language === 'ro' ? 'Cheie de Temniță' : 'Jail Key'}</span>
        </span>
      );
    }
  };

  // If no other players exist in game
  if (otherPlayers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
        <div className="bg-[#16130e] border-2 border-[#ffd700] rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
          <div className="text-4xl">🤝 📜</div>
          <h3 className="text-xl font-cinzel font-bold text-[#ffd700]">
            {language === 'ro' ? 'Târgul Mănăstirii (Trade)' : 'Monastery Trade Bazaar'}
          </h3>
          <p className="text-sm font-barlow text-gray-300">
            {language === 'ro'
              ? 'Nu există alți jucători activi cu care să faci schimb în acest moment.'
              : 'There are no other active players to trade with at this time.'}
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-[#ffd700] text-black font-cinzel font-bold text-sm hover:brightness-110"
          >
            {language === 'ro' ? 'Continuă Tura ➔' : 'Continue Turn ➔'}
          </button>
        </div>
      </div>
    );
  }

  // If auctioneer has nothing to trade, let them pass easily
  if (!hasAnyAsset && phase === 'select_asset') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
        <div className="bg-[#16130e] border-2 border-[#ffd700] rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
          <div className="text-4xl">🤝 📜</div>
          <h3 className="text-xl font-cinzel font-bold text-[#ffd700]">
            {language === 'ro' ? 'Târgul Mănăstirii (Trade)' : 'Monastery Trade Bazaar'}
          </h3>
          <p className="text-sm font-barlow text-gray-300">
            {language === 'ro'
              ? `${auctioneer.name}, nu deții nicio proprietate sau item pe care să îl scoți la licitație.`
              : `${auctioneer.name}, you do not own any properties or items to auction.`}
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-[#ffd700] text-black font-cinzel font-bold text-sm hover:brightness-110"
          >
            {language === 'ro' ? 'Continuă Tura ➔' : 'Continue Turn ➔'}
          </button>
        </div>
      </div>
    );
  }

  // --- PHASE 1: Auctioneer Selects 1 Asset ---
  if (phase === 'select_asset') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
        <div className="bg-[#14120e] border-2 border-[#ffd700] rounded-3xl p-5 max-w-md w-full space-y-4 text-center shadow-2xl gold-glow my-auto">
          <div className="text-4xl">🤝 ⚖️</div>
          <div className="space-y-1">
            <h3 className="text-xl font-cinzel font-black text-[#ffd700] gold-text-glow">
              {language === 'ro' ? 'Târg & Licitație Mănăstirească' : 'Monastery Trade & Auction'}
            </h3>
            <p className="text-xs text-gray-300 font-barlow">
              {language === 'ro'
                ? `Alege UN SINGUR bun de-al tău pe care vrei să îl scoți la licitație către ceilalți frați.`
                : `Select a SINGLE asset of yours to put up for auction to other monks.`}
            </p>
          </div>

          {/* Asset Choice Options */}
          <div className="space-y-2 max-h-60 overflow-y-auto text-left pr-1">
            {/* Properties */}
            {auctioneerProperties.map((tile) => {
              const isSelected =
                selectedAuctionAsset?.type === 'property' &&
                selectedAuctionAsset.tileIndex === tile.index;
              return (
                <button
                  key={tile.index}
                  type="button"
                  onClick={() => setSelectedAuctionAsset({ type: 'property', tileIndex: tile.index })}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#2b2010] border-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.5)] ring-1 ring-[#ffd700]'
                      : 'bg-[#17130d] border-stone-800 hover:border-stone-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tile.emoji}</span>
                    <div>
                      <div className="font-cinzel font-bold text-xs text-white">
                        {language === 'ro' ? tile.nameRo : tile.nameEn}
                      </div>
                      <div className="text-[10px] text-amber-300/80 font-barlow">
                        Chirie: 🍺 {tile.sipsCount} guri • Nivel: {tile.buildingLevel || 0}/2
                      </div>
                    </div>
                  </div>
                  {isSelected && <span className="text-sm text-[#ffd700]">✓</span>}
                </button>
              );
            })}

            {/* Pardon Letter */}
            {hasPardonLetter && (
              <button
                type="button"
                onClick={() => setSelectedAuctionAsset({ type: 'item', itemType: 'pardonLetter' })}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  selectedAuctionAsset?.type === 'item' && selectedAuctionAsset.itemType === 'pardonLetter'
                    ? 'bg-[#101b2b] border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.5)] ring-1 ring-blue-400'
                    : 'bg-[#17130d] border-stone-800 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎟️</span>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-blue-300">
                      {language === 'ro' ? 'Scrisoare de Iertare' : 'Pardon Letter'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-barlow">
                      Anulează orice pedeapsă de băut (Deții: {auctioneer.pardonLetters})
                    </div>
                  </div>
                </div>
                {selectedAuctionAsset?.type === 'item' && selectedAuctionAsset.itemType === 'pardonLetter' && (
                  <span className="text-sm text-blue-400">✓</span>
                )}
              </button>
            )}

            {/* Jail Key */}
            {hasJailKey && (
              <button
                type="button"
                onClick={() => setSelectedAuctionAsset({ type: 'item', itemType: 'jailKey' })}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  selectedAuctionAsset?.type === 'item' && selectedAuctionAsset.itemType === 'jailKey'
                    ? 'bg-[#0f241a] border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] ring-1 ring-emerald-400'
                    : 'bg-[#17130d] border-stone-800 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔓</span>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-emerald-300">
                      {language === 'ro' ? 'Cheie de Temniță' : 'Jail Key'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-barlow">
                      Ieși instant din închisoare fără să plătești (Deții: {auctioneer.jailKeys})
                    </div>
                  </div>
                </div>
                {selectedAuctionAsset?.type === 'item' && selectedAuctionAsset.itemType === 'jailKey' && (
                  <span className="text-sm text-emerald-400">✓</span>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                if (selectedAuctionAsset) {
                  setPhase('bidding');
                }
              }}
              disabled={!selectedAuctionAsset}
              className={`flex-1 py-3 rounded-2xl font-cinzel font-bold text-xs uppercase tracking-wider ${
                selectedAuctionAsset
                  ? 'bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-black hover:brightness-110 shadow-lg'
                  : 'bg-stone-800 text-gray-500 border border-stone-700 cursor-not-allowed'
              }`}
            >
              {language === 'ro' ? 'Deschide Licitația ➔' : 'Open Auction ➔'}
            </button>
            <button
              onClick={handleClose}
              className="py-3 px-4 rounded-2xl bg-[#241c14] border border-stone-700 text-gray-300 font-cinzel text-xs hover:text-white"
            >
              {language === 'ro' ? 'Pas (Nu licitez)' : 'Pass'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PHASE 2: Other Players Submit Offers (1 or 2 items) ---
  if (phase === 'bidding') {
    const currentBidder = otherPlayers[activeBidderIndex];
    if (!currentBidder) {
      // Finished all bidders -> go to review phase
      setPhase('review');
      return null;
    }

    const bidderProperties = currentBidder.properties.map((idx) => tiles[idx]);
    const bidderHasPardon = (currentBidder.pardonLetters || 0) > 0;
    const bidderHasKey = (currentBidder.jailKeys || 0) > 0;
    const currentBidderOffer = playerBids[currentBidder.id] || [];

    const toggleBidderAsset = (asset: TradeAsset) => {
      const exists = currentBidderOffer.some((a) => {
        if (a.type === 'property' && asset.type === 'property') return a.tileIndex === asset.tileIndex;
        if (a.type === 'item' && asset.type === 'item') return a.itemType === asset.itemType;
        return false;
      });

      let nextOffer: TradeAsset[];
      if (exists) {
        nextOffer = currentBidderOffer.filter((a) => {
          if (a.type === 'property' && asset.type === 'property') return a.tileIndex !== asset.tileIndex;
          if (a.type === 'item' && asset.type === 'item') return a.itemType !== asset.itemType;
          return true;
        });
      } else {
        if (currentBidderOffer.length >= 2) return; // Max 2 assets
        nextOffer = [...currentBidderOffer, asset];
      }

      setPlayerBids((prev) => ({
        ...prev,
        [currentBidder.id]: nextOffer,
      }));
    };

    const isSelected = (asset: TradeAsset) => {
      return currentBidderOffer.some((a) => {
        if (a.type === 'property' && asset.type === 'property') return a.tileIndex === asset.tileIndex;
        if (a.type === 'item' && asset.type === 'item') return a.itemType === asset.itemType;
        return false;
      });
    };

    const handleConfirmBidder = (passBid: boolean) => {
      if (passBid) {
        setPlayerBids((prev) => ({
          ...prev,
          [currentBidder.id]: [],
        }));
      }

      if (activeBidderIndex + 1 < otherPlayers.length) {
        setActiveBidderIndex((prev) => prev + 1);
      } else {
        setPhase('review');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
        <div className="bg-[#14120e] border-2 border-amber-500/80 rounded-3xl p-5 max-w-md w-full space-y-4 text-center shadow-2xl my-auto">
          {/* Target Auctioned Asset Badge */}
          <div className="bg-[#241a0f] border border-[#ffd700]/50 p-3 rounded-2xl space-y-1">
            <div className="text-[10px] font-cinzel text-gray-400 uppercase tracking-wider">
              {language === 'ro' ? 'Scos la licitație de' : 'Put up for auction by'} <strong>{auctioneer.name}</strong>:
            </div>
            <div className="text-sm font-bold text-[#ffd700] flex items-center justify-center gap-1.5">
              {selectedAuctionAsset && renderAssetLabel(selectedAuctionAsset)}
            </div>
          </div>

          {/* Current Bidder Header */}
          <div className="space-y-1 border-b border-[#2d2215] pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1710] border border-amber-500/40 text-xs font-cinzel text-amber-300">
              <span className="font-bold">{currentBidder.name}</span>
              <span>({activeBidderIndex + 1}/{otherPlayers.length})</span>
            </div>
            <h4 className="text-sm font-cinzel font-bold text-white">
              {language === 'ro' ? 'Alege până la 2 bunuri de oferit:' : 'Choose up to 2 assets to offer:'}
            </h4>
            <div className="text-[11px] text-gray-400 font-barlow">
              {language === 'ro'
                ? `Selectate: ${currentBidderOffer.length}/2 bunuri`
                : `Selected: ${currentBidderOffer.length}/2 assets`}
            </div>
          </div>

          {/* Bidder Available Assets */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto text-left pr-1">
            {bidderProperties.length === 0 && !bidderHasPardon && !bidderHasKey ? (
              <div className="text-center py-4 text-xs text-gray-400 font-barlow italic">
                {language === 'ro' ? 'Nu deții bunuri de oferit la schimb.' : 'You have no assets to offer.'}
              </div>
            ) : (
              <>
                {bidderProperties.map((tile) => {
                  const selected = isSelected({ type: 'property', tileIndex: tile.index });
                  return (
                    <button
                      key={tile.index}
                      type="button"
                      onClick={() => toggleBidderAsset({ type: 'property', tileIndex: tile.index })}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        selected
                          ? 'bg-[#2b2010] border-[#ffd700] shadow'
                          : 'bg-[#17130d] border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{tile.emoji}</span>
                        <span className="font-cinzel text-xs text-white">
                          {language === 'ro' ? tile.nameRo : tile.nameEn}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#ffd700]">{selected ? '✓' : '+'}</span>
                    </button>
                  );
                })}

                {bidderHasPardon && (
                  <button
                    type="button"
                    onClick={() => toggleBidderAsset({ type: 'item', itemType: 'pardonLetter' })}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected({ type: 'item', itemType: 'pardonLetter' })
                        ? 'bg-[#101b2b] border-blue-400'
                        : 'bg-[#17130d] border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🎟️</span>
                      <span className="font-cinzel text-xs text-blue-300">
                        {language === 'ro' ? 'Scrisoare de Iertare' : 'Pardon Letter'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-400">
                      {isSelected({ type: 'item', itemType: 'pardonLetter' }) ? '✓' : '+'}
                    </span>
                  </button>
                )}

                {bidderHasKey && (
                  <button
                    type="button"
                    onClick={() => toggleBidderAsset({ type: 'item', itemType: 'jailKey' })}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected({ type: 'item', itemType: 'jailKey' })
                        ? 'bg-[#0f241a] border-emerald-400'
                        : 'bg-[#17130d] border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🔓</span>
                      <span className="font-cinzel text-xs text-emerald-300">
                        {language === 'ro' ? 'Cheie de Temniță' : 'Jail Key'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {isSelected({ type: 'item', itemType: 'jailKey' }) ? '✓' : '+'}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Action Buttons for current bidder */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleConfirmBidder(false)}
              disabled={currentBidderOffer.length === 0}
              className={`flex-1 py-2.5 rounded-xl font-cinzel font-bold text-xs ${
                currentBidderOffer.length > 0
                  ? 'bg-[#ffd700] text-black hover:brightness-110'
                  : 'bg-stone-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {language === 'ro' ? `Trimite Oferta (${currentBidderOffer.length})` : `Submit Offer (${currentBidderOffer.length})`}
            </button>
            <button
              onClick={() => handleConfirmBidder(true)}
              className="py-2.5 px-4 rounded-xl bg-[#241c14] border border-stone-700 text-gray-300 font-cinzel text-xs hover:text-white"
            >
              {language === 'ro' ? 'Nu licitez' : 'Pass'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PHASE 3: Auctioneer Reviews All Bids ---
  const validBids = otherPlayers
    .map((p) => ({
      bidder: p,
      assets: playerBids[p.id] || [],
    }))
    .filter((b) => b.assets.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
      <div className="bg-[#14120e] border-2 border-[#ffd700] rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl gold-glow my-auto">
        <div className="text-center space-y-1 border-b border-[#2d2215] pb-3">
          <div className="text-3xl">⚖️ 📜</div>
          <h3 className="text-xl font-cinzel font-black text-[#ffd700] gold-text-glow">
            {language === 'ro' ? 'Oferte Primite la Licitație' : 'Received Auction Offers'}
          </h3>
          <p className="text-xs text-gray-300 font-barlow">
            {auctioneer.name},{' '}
            {language === 'ro'
              ? 'alege oferta care îți convine sau refuză tot.'
              : 'accept an offer or decline all.'}
          </p>
        </div>

        {/* The Auctioned Asset */}
        <div className="bg-[#1f160c] border border-[#ffd700]/40 p-2.5 rounded-xl text-center space-y-0.5">
          <span className="text-[10px] font-cinzel text-gray-400 uppercase">
            {language === 'ro' ? 'Bunul tău scos la schimb:' : 'Your auctioned asset:'}
          </span>
          <div className="flex justify-center items-center gap-1.5">
            {selectedAuctionAsset && renderAssetLabel(selectedAuctionAsset)}
          </div>
        </div>

        {/* Bids List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {validBids.length === 0 ? (
            <div className="text-center py-6 space-y-2 bg-[#17130e] rounded-2xl border border-stone-800 p-4">
              <div className="text-2xl">🍂</div>
              <p className="text-xs text-gray-400 font-barlow">
                {language === 'ro'
                  ? 'Niciun frate nu a depus o ofertă pentru acest bun.'
                  : 'No other players submitted a bid for this asset.'}
              </p>
            </div>
          ) : (
            validBids.map(({ bidder, assets }) => (
              <div
                key={bidder.id}
                className="bg-[#1a140d] border border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow"
              >
                <div className="space-y-1">
                  <div className="font-cinzel font-bold text-xs text-[#ffd700] flex items-center gap-1.5">
                    <span>👑</span>
                    <span>{bidder.name}</span>
                    <span className="text-[10px] text-gray-400 font-barlow font-normal">
                      ({assets.length} {assets.length === 1 ? 'bun' : 'bunuri'})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {assets.map((asset, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-black/60 border border-stone-700"
                      >
                        {renderAssetLabel(asset)}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedAuctionAsset) {
                      onExecuteTrade(bidder.id, selectedAuctionAsset, assets);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-black font-cinzel font-black text-xs hover:brightness-110 shadow active:scale-95 flex-shrink-0"
                >
                  {language === 'ro' ? 'Acceptă ✓' : 'Accept ✓'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Decline All / Pass Button */}
        <div className="pt-2 border-t border-[#2d2215]">
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-[#2a1f13] border border-stone-700 text-gray-300 font-cinzel font-bold text-xs hover:text-white transition-all"
          >
            {language === 'ro' ? 'Refuză Toate Ofertele (Pas)' : 'Decline All Offers (Pass)'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Turn End Drink Modal (Popup after every player's turn) ---
export const TurnEndDrinkModal: React.FC<{
  player: Player;
  title?: string;
  reason: string;
  sipsToDrink: number;
  isChug?: boolean;
  isImmune?: boolean;
  specialNote?: string;
  onUsePardonLetter?: () => void;
  onConfirm: () => void;
}> = ({
  player,
  title,
  reason,
  sipsToDrink,
  isChug = false,
  isImmune = false,
  specialNote,
  onUsePardonLetter,
  onConfirm,
}) => {
  const { t, language } = useApp();

  const isDrinking = (sipsToDrink > 0 || isChug) && !isImmune;

  const defaultTitle = isChug
    ? (language === 'ro' ? '🔥 GROAPĂ TOTALĂ! 🔥' : '🔥 TOTAL CHUG! 🔥')
    : isDrinking
    ? (language === 'ro' ? '🍺 TREBUIE SĂ BEI! 🍺' : '🍺 YOU MUST DRINK! 🍺')
    : (language === 'ro' ? '🛡️ TURA A TRECUT! 🛡️' : '🛡️ TURN COMPLETED! 🛡️');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div
        className={`relative bg-[#14120e] border-2 rounded-3xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl ${
          isChug
            ? 'border-red-600 flame-glow'
            : isDrinking
            ? 'border-[#e8c84a] gold-glow'
            : 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
        }`}
      >
        {/* Header Ribbon / Player Turn Label */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#201a12] border border-[#e8c84a]/40 text-xs font-cinzel text-[#e8c84a]">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-[#0d0a07] border border-[#e8c84a]/30 flex-shrink-0">
              <AvatarDisplay avatarId={player.avatarIcon} className="w-full h-full" />
            </div>
            <span className="font-bold">{player.name}</span>
            <span>- {language === 'ro' ? 'Tura s-a încheiat' : 'Turn finished'}</span>
          </div>
          <h3
            className={`text-2xl font-cinzel font-black tracking-wide ${
              isChug
                ? 'text-red-500 flame-text-glow'
                : isDrinking
                ? 'text-[#e8c84a] gold-text-glow'
                : 'text-emerald-400'
            }`}
          >
            {title || defaultTitle}
          </h3>
        </div>

        {/* Character Mascot visual showing the state and drinking animation */}
        <div className="flex justify-center my-1 scale-95">
          <MonkMascot
            avatarId={player.avatarIcon}
            characterName={player.name}
            sipsInTurn={isChug ? 25 : isImmune ? 0 : sipsToDrink}
            overrideState={isChug ? 'dead' : isImmune ? 'sober' : undefined}
            size="md"
            showLabel={true}
            isDrinking={isDrinking}
          />
        </div>

        {/* Action / Roll Reason Description */}
        <div className="bg-[#1e1913] border border-[#382b1d] rounded-2xl p-3 text-sm font-barlow text-[#f0ebe0] space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-cinzel">
            {language === 'ro' ? 'Ce s-a întâmplat:' : 'What happened:'}
          </div>
          <div className="font-bold text-[#ffd875] text-base">{reason}</div>
          {specialNote && (
            <div className="text-xs text-orange-300 font-medium pt-1 border-t border-[#382b1d]/60 mt-1">
              ✨ {specialNote}
            </div>
          )}
        </div>

        {/* Sips / Drinking Outcome Highlight */}
        <div
          className={`py-3.5 px-4 rounded-2xl border flex flex-col items-center justify-center ${
            isChug
              ? 'bg-red-950/60 border-red-500/80 text-red-100 animate-pulse'
              : isDrinking
              ? 'bg-[#281e0e] border-[#e8c84a]/70 text-[#fdf8e6]'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
          }`}
        >
          {isChug ? (
            <div className="space-y-1">
              <div className="text-3xl font-cinzel font-black text-red-400 tracking-wider">
                💀 {language === 'ro' ? 'GROAPĂ!' : 'CHUG!'}
              </div>
              <div className="text-sm font-barlow text-red-200">
                {language === 'ro' ? (
                  <>Bei <strong>tot paharul dintr-o răsuflare!</strong></>
                ) : (
                  <>Drink the <strong>entire drink in one go!</strong></>
                )}
              </div>
            </div>
          ) : isDrinking ? (
            <div className="space-y-1">
              <div className="text-xs uppercase font-cinzel tracking-widest text-[#e8c84a]">
                {language === 'ro' ? 'Pedeapsă de băut' : 'Drink Penalty'}
              </div>
              <div className="text-3xl font-cinzel font-black text-[#ffd700] gold-text-glow">
                🍺 {sipsToDrink} {language === 'ro' ? (sipsToDrink === 1 ? 'GURĂ' : 'GURI') : (sipsToDrink === 1 ? 'SIP' : 'SIPS')}
              </div>
              <div className="text-xs text-gray-300 font-barlow">
                {language === 'ro'
                  ? `Ia ${sipsToDrink} ${sipsToDrink === 1 ? 'gură' : 'guri'} de băutură înainte de a continua!`
                  : `Take ${sipsToDrink} ${sipsToDrink === 1 ? 'sip' : 'sips'} before continuing!`}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xl font-cinzel font-bold text-emerald-400">
                🛡️ {language === 'ro' ? 'ZERO GURI!' : 'ZERO SIPS!'}
              </div>
              <div className="text-xs text-gray-300 font-barlow">
                {language === 'ro' ? 'Ești în siguranță! Nu trebuie să bei nimic în această tură.' : 'You are safe! No drinks required this turn.'}
              </div>
            </div>
          )}
        </div>

        {/* Buttons / Actions */}
        <div className="space-y-2 pt-1">
          {isDrinking && player.pardonLetters > 0 && onUsePardonLetter && (
            <button
              onClick={onUsePardonLetter}
              className="w-full py-2.5 rounded-xl border border-[#e8c84a] bg-[#2d2212] text-[#ffd700] font-cinzel font-bold text-xs hover:bg-[#3d2f19] flex items-center justify-center gap-1.5 shadow"
            >
              <span>🎟️ {language === 'ro' ? `Folosește Scrisoare de Iertare (rămase: ${player.pardonLetters})` : `Use Pardon Letter (remaining: ${player.pardonLetters})`}</span>
            </button>
          )}

          <button
            onClick={onConfirm}
            className={`w-full py-3.5 rounded-2xl font-cinzel font-bold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
              isChug
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:brightness-110 flame-glow'
                : isDrinking
                ? 'bg-gradient-to-r from-[#e8c84a] to-[#ffd700] text-black hover:brightness-110 gold-glow'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110'
            }`}
          >
            <span>
              {isDrinking
                ? (language === 'ro' ? '✅ Am băut! Următorul Jucător ➔' : '✅ I drank! Next Player ➔')
                : (language === 'ro' ? '➔ Următorul Jucător' : '➔ Next Player')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Monk Dice Duel Modal (Zarurile Călugărului) ---
export interface MonkDiceRollResult {
  die1: number;
  die2: number;
  sum: number;
  isDoubleSix: boolean;
  isDoubleOne: boolean;
  sipsToSelf: number;
  sipsToGive: number;
}

export const MonkDiceDuelModal: React.FC<{
  player: Player;
  onComplete: (result: MonkDiceRollResult) => void;
}> = ({ player, onComplete }) => {
  const { language } = useApp();
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rolled, setRolled] = useState<boolean>(false);
  const [die1, setDie1] = useState<number>(1);
  const [die2, setDie2] = useState<number>(1);

  const handleRoll = () => {
    if (isRolling || rolled) return;
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 16) {
        clearInterval(interval);
        const final1 = Math.floor(Math.random() * 6) + 1;
        const final2 = Math.floor(Math.random() * 6) + 1;
        setDie1(final1);
        setDie2(final2);
        setIsRolling(false);
        setRolled(true);
      }
    }, 80);
  };

  const sum = die1 + die2;
  const isDoubleSix = die1 === 6 && die2 === 6;
  const isDoubleOne = die1 === 1 && die2 === 1;
  const sipsToSelf = !isDoubleSix && !isDoubleOne && sum < 6 ? sum : 0;
  const sipsToGive = !isDoubleSix && !isDoubleOne && sum >= 6 ? sum : 0;

  const getDicePip = (val: number) => {
    const pips: Record<number, string> = {
      1: '⚀',
      2: '⚁',
      3: '⚂',
      4: '⚃',
      5: '⚄',
      6: '⚅',
    };
    return pips[val] || '🎲';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none animate-fade-in">
      <div className="relative bg-gradient-to-b from-[#21160d] via-[#160f09] to-[#0c0804] border-2 border-[#ffd700] rounded-3xl p-5 max-w-sm w-full space-y-4 text-center shadow-2xl gold-glow">
        {/* Header */}
        <div className="space-y-1">
          <div className="text-3xl">🎲 ⚔️ 🎲</div>
          <h3 className="text-xl font-cinzel font-black text-[#ffd700] gold-text-glow">
            {language === 'ro' ? 'ZARURILE CĂLUGĂRULUI' : 'MONK DICE DUEL'}
          </h3>
          <p className="text-xs font-barlow text-amber-200/90">
            {language === 'ro' ? `${player.name} aruncă cele 2 Zaruri ale Destinului!` : `${player.name} rolls the 2 Dice of Destiny!`}
          </p>
        </div>

        {/* Legend Box */}
        <div className="bg-[#100a06] border border-[#ffd700]/30 rounded-2xl p-2 text-[10px] sm:text-[11px] font-barlow text-stone-300 space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <span>🎲🎲 6 - 6:</span>
            <span className="text-red-400">🔥 TOȚI CEILALȚI dau Groapă!</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <span>🎲🎲 1 - 1:</span>
            <span className="text-red-400">💀 TU dai Groapă!</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-300">
            <span>🔢 Suma &lt; 6:</span>
            <span className="text-yellow-300 font-semibold">Bei tu suma (ex: 3 guri)</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-300">
            <span>🎯 Suma &ge; 6:</span>
            <span className="text-emerald-300 font-semibold">Dai suma altcuiva să bea!</span>
          </div>
        </div>

        {/* 2 Dice Visual Box */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br from-[#2a1e12] to-[#140e08] border-2 flex flex-col items-center justify-center shadow-lg transition-transform ${
            isRolling ? 'animate-bounce border-amber-400 scale-105' : 'border-[#ffd700] scale-100'
          }`}>
            <span className="text-4xl text-[#ffd700] drop-shadow">{getDicePip(die1)}</span>
            <span className="text-xs font-mono font-bold text-gray-300 mt-[-4px]">{die1}</span>
          </div>

          <span className="text-2xl text-amber-400 font-black font-cinzel">+</span>

          <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br from-[#2a1e12] to-[#140e08] border-2 flex flex-col items-center justify-center shadow-lg transition-transform ${
            isRolling ? 'animate-bounce border-amber-400 scale-105' : 'border-[#ffd700] scale-100'
          }`} style={{ animationDelay: '0.1s' }}>
            <span className="text-4xl text-[#ffd700] drop-shadow">{getDicePip(die2)}</span>
            <span className="text-xs font-mono font-bold text-gray-300 mt-[-4px]">{die2}</span>
          </div>
        </div>

        {/* Outcome Display when rolled */}
        {rolled && (
          <div className="animate-fade-in p-3 rounded-2xl border space-y-1 bg-[#150d07] border-[#ffd700]/50 shadow-inner">
            <div className="text-xs font-cinzel font-bold text-amber-300">
              {language === 'ro' ? `Total Zaruri: ${die1} + ${die2} = ${sum}` : `Dice Total: ${die1} + ${die2} = ${sum}`}
            </div>

            {isDoubleSix && (
              <div className="text-sm font-cinzel font-black text-red-400 animate-pulse">
                🔥 DUBLĂ 6! TOȚI CEILALȚI CĂLUGĂRI DAU GROAPĂ! 🔥
              </div>
            )}

            {isDoubleOne && (
              <div className="text-sm font-cinzel font-black text-red-500 animate-pulse">
                💀 DUBLĂ 1! TU DAI PAHARUL GROAPĂ! 💀
              </div>
            )}

            {!isDoubleSix && !isDoubleOne && sum < 6 && (
              <div className="text-sm font-cinzel font-bold text-amber-300">
                🍺 Suma este &lt; 6: <span className="text-[#ffd700] font-black">Bei tu {sum} {sum === 1 ? 'gură' : 'guri'}!</span>
              </div>
            )}

            {!isDoubleSix && !isDoubleOne && sum >= 6 && (
              <div className="text-sm font-cinzel font-bold text-emerald-400">
                👉 Suma este &ge; 6: <span className="text-emerald-300 font-black">Dai {sum} guri altui jucător să bea!</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {!rolled ? (
            <button
              onClick={handleRoll}
              disabled={isRolling}
              className={`w-full py-3.5 rounded-2xl font-cinzel font-bold text-sm sm:text-base transition-all shadow-lg ${
                isRolling
                  ? 'bg-amber-700 text-black cursor-wait'
                  : 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black hover:brightness-110 active:scale-95 gold-glow'
              }`}
            >
              {isRolling
                ? (language === 'ro' ? '🎲 Se rostogolesc zarurile...' : '🎲 Rolling dice...')
                : (language === 'ro' ? '🎲 Aruncă Zarurile!' : '🎲 Roll the Dice!')}
            </button>
          ) : (
            <button
              onClick={() => onComplete({ die1, die2, sum, isDoubleSix, isDoubleOne, sipsToSelf, sipsToGive })}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-cinzel font-bold text-sm sm:text-base hover:brightness-110 active:scale-95 shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{language === 'ro' ? 'Aplică Sentința ➔' : 'Apply Outcome ➔'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

