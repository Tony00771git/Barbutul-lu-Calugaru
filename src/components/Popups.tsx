import React, { useState } from 'react';
import { BoardTile, Player, TriviaQuestion } from '../types';
import { GameCardDef } from '../data/cards';
import { useApp } from '../context/AppContext';
import { MonkMascot } from './MonkMascot';
import { AvatarDisplay } from './AvatarDisplay';

// --- Tile Detail Tooltip / Modal ---
export const TileDetailModal: React.FC<{
  tile: BoardTile | null;
  ownerName?: string;
  onClose: () => void;
}> = ({ tile, ownerName, onClose }) => {
  const { t, language } = useApp();
  if (!tile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-5 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-4xl">{tile.emoji}</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a]">
          {language === 'ro' ? tile.nameRo : tile.nameEn}
        </h3>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {language === 'ro' ? tile.descriptionRo : tile.descriptionEn}
        </p>

        {tile.buyable && (
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-3 rounded-xl text-xs space-y-1">
            <div className="text-gray-400 font-cinzel">Preț / Cost: <span className="text-[#e8c84a] font-bold">{tile.price} 🪙</span></div>
            {ownerName ? (
              <div className="text-green-400 font-bold">Proprietar: {ownerName} 👑</div>
            ) : (
              <div className="text-gray-400">Liberă pentru cumpărare</div>
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
  const { t } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-5xl">🎟️ 🍺</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
          Scrisoare de Iertare / Pardon Letter
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
          {isRisk ? 'ALEGE O CARTE DE RISC' : 'ALEGE O CARTE'}
        </h2>
        <p className="text-xs sm:text-sm font-barlow text-gray-400 mt-1">
          {selectedIdx === null ? 'Atinge una din cele 10 cărți pentru a-ți dezvălui soarta' : 'Soarta a fost pecetluită...'}
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
                <span>{isRisk ? '🔥 RISC MĂNĂSTIRESC' : '✨ MISTER SFÂNT'}</span>
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
                  {isGood ? '✨ Binecuvântare primită' : '⚖️ Pedeapsă de ispășit'}
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
  const { t } = useApp();
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
            <span>PĂCĂNEAUA SFÂNTĂ</span>
            <span>🎰</span>
          </h3>
          <p className="text-[10px] font-cinzel text-amber-200/80 tracking-widest uppercase">
            Taverna Păcatului Mănăstiresc • 100% Cinstire
          </p>
        </div>

        {/* Suspense 7-7 Alert Header Banner */}
        {isSuspense77 && (
          <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black font-cinzel font-black text-xs sm:text-sm py-1.5 px-3 rounded-xl animate-pulse shadow-lg tracking-wider">
            🔥 SUSPANS 7 - 7 ! VINE AL TREILEA 7️⃣?! 🔥
          </div>
        )}

        {/* Illuminated Paytable Legend Banner */}
        {!isSuspense77 && (
          <div className="bg-[#0e0a06] border border-[#e8c84a]/40 rounded-xl p-1.5 text-[10px] sm:text-[11px] font-barlow text-gray-300 grid grid-cols-3 gap-1.5 shadow-inner">
            <div className="p-1 rounded bg-[#1c140d]/60 border border-amber-500/20">
              <div className="text-xs">🍺🍺🍺</div>
              <div className="text-[#ffd700] font-bold">3 Guri</div>
            </div>
            <div className="p-1 rounded bg-[#1c140d]/60 border border-amber-500/20">
              <div className="text-xs">🧔‍♂️🧔‍♂️🧔‍♂️</div>
              <div className="text-[#ffd700] font-bold">Toți beau 3!</div>
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
            title="Trage de manetă!"
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
            <span>{spinning ? (isSuspense77 ? '🔥 SUSPANS ACTIV' : 'ROTIRE ACTIVĂ') : 'GATA DE JOC'}</span>
          </div>
          <div className="text-amber-300/80">
            🪙 1 MONEDĂ MĂNĂSTIREASCĂ
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
              <span>{isSuspense77 ? '🔥 SUSPANS 7-7...' : spinning ? 'ROTIRE ÎN CURS...' : 'SPIN / ROTEȘTE'}</span>
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
              <div className="text-xs font-cinzel text-gray-400 uppercase">Rezultat Slot</div>
              <div className="text-base sm:text-lg font-cinzel font-black text-[#ffd700] mt-0.5">
                {resultType === 'monks' && '🧔‍♂️ 3 CĂLUGĂRI! Ceilalți beau 3 guri fiecare!'}
                {resultType === 'beers' && '🍺 3 BERI! Bei 3 guri de bere!'}
                {resultType === 'sevens' && '🔥 MARELE JACKPOT! Furi 10🪙 de la toți ȘI toți dau GROAPĂ!'}
              </div>
            </div>

            <button
              onClick={() => onComplete(resultType)}
              className="w-full py-3.5 rounded-2xl bg-[#ffd700] text-black font-cinzel font-black text-base hover:brightness-110 gold-glow shadow-xl"
            >
              COLECTEAZĂ SOARTA ➔
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

// --- Merchant Modal ---
export const MerchantModal: React.FC<{
  player: Player;
  onBuy: () => void;
  onDecline: () => void;
}> = ({ player, onBuy, onDecline }) => {
  const { t } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-6 max-w-sm w-full space-y-4 gold-glow text-center">
        <div className="text-5xl">🧙 🎟️</div>
        <h3 className="text-xl font-cinzel font-bold text-[#e8c84a] gold-text-glow">
          {t('merchantTitle')}
        </h3>
        <p className="text-sm font-barlow text-[#f0ebe0]">
          {t('merchantDesc')}
        </p>

        <div className="space-y-2.5 pt-2">
          <button
            disabled={player.gold < 30}
            onClick={onBuy}
            className={`w-full py-3 rounded-xl font-cinzel font-bold text-sm ${
              player.gold >= 30
                ? 'bg-[#e8c84a] text-black hover:brightness-110 gold-glow'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            {t('buyMerchantBtn')}
          </button>
          <button
            onClick={onDecline}
            className="w-full py-3 rounded-xl bg-[#2a2a2a] text-gray-300 font-cinzel text-sm hover:text-white"
          >
            {t('declineMerchantBtn')}
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
  const { t } = useApp();

  const isDrinking = (sipsToDrink > 0 || isChug) && !isImmune;

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
            <span>- Tura s-a încheiat</span>
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
            {title || (isChug ? '🔥 GROAPĂ TOTALĂ! 🔥' : isDrinking ? '🍺 TREBUIE SĂ BEI! 🍺' : '🛡️ TURA A TRECUT! 🛡️')}
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
          <div className="text-xs text-gray-400 uppercase tracking-wider font-cinzel">Ce s-a întâmplat:</div>
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
                💀 GROAPĂ!
              </div>
              <div className="text-sm font-barlow text-red-200">
                Bei <strong>tot paharul dintr-o răsuflare!</strong>
              </div>
            </div>
          ) : isDrinking ? (
            <div className="space-y-1">
              <div className="text-xs uppercase font-cinzel tracking-widest text-[#e8c84a]">
                Pedeapsă de băut
              </div>
              <div className="text-3xl font-cinzel font-black text-[#ffd700] gold-text-glow">
                🍺 {sipsToDrink} {sipsToDrink === 1 ? 'GURĂ' : 'GURI'}
              </div>
              <div className="text-xs text-gray-300 font-barlow">
                Ia {sipsToDrink} {sipsToDrink === 1 ? 'gură' : 'guri'} de bere/băutură înainte de a continua!
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xl font-cinzel font-bold text-emerald-400">
                🛡️ ZERO GURI!
              </div>
              <div className="text-xs text-gray-300 font-barlow">
                Ești în siguranță! Nu trebuie să bei nimic în această tură.
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
              <span>🎟️ Folosește Scrisoare de Iertare (rămase: {player.pardonLetters})</span>
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
            <span>{isDrinking ? '✅ Am băut! Următorul Jucător ➔' : '➔ Următorul Jucător'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

