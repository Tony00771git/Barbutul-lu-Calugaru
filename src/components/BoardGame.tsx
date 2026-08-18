import React, { useState, useEffect } from 'react';
import { Player, BoardTile, MonkState } from '../types';
import { boardTilesData } from '../data/boardTiles';
import { mysteryCards, riskCards, GameCardDef } from '../data/cards';
import { triviaQuestions } from '../i18n/translations';
import { useApp, generateUniqueId } from '../context/AppContext';
import { Dice } from './Dice';
import { MonkMascot } from './MonkMascot';
import { ParticleOverlay } from './ParticleOverlay';
import {
  TileDetailModal,
  BuyPropertyModal,
  PardonLetterPromptModal,
  JailModal,
  CardModal,
  TriviaModal,
  SlotModal,
  TwoTruthsModal,
  MerchantModal,
  SelectPlayerModal,
  TurnEndDrinkModal,
} from './Popups';
import { ScoreModal } from './ScoreModal';
import { AvatarDisplay } from './AvatarDisplay';

interface BoardGameProps {
  initialPlayers: Player[];
  boardDiceCount: 1 | 2;
  onEndGame: (finalPlayers: Player[]) => void;
  onOpenRules: () => void;
}

interface PendingTurnResult {
  title?: string;
  reason: string;
  sipsToDrink: number;
  isChug: boolean;
  isImmune: boolean;
  specialNote?: string;
}

interface ActionLogEntry {
  id: string;
  text: string;
  time: string;
  type: 'drink' | 'gold' | 'card' | 'jail' | 'buy';
}

export const BoardGame: React.FC<BoardGameProps> = ({
  initialPlayers,
  boardDiceCount,
  onEndGame,
  onOpenRules,
}) => {
  const { t, diceSkin, language, checkAchievement } = useApp();

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [tiles, setTiles] = useState<BoardTile[]>(boardTilesData);

  // Dice & Turn state
  const [diceValues, setDiceValues] = useState<number[]>(boardDiceCount === 1 ? [1] : [1, 1]);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [hoppingTileIndex, setHoppingTileIndex] = useState<number | null>(null);

  // Overlays & Notifications
  const [particleType, setParticleType] = useState<'heaven' | 'chug' | null>(null);
  const [floatingNotification, setFloatingNotification] = useState<{ text: string; color: string } | null>(null);

  // Action Log
  const [logs, setLogs] = useState<ActionLogEntry[]>([
    {
      id: '0',
      text: 'Jocul pe tablă a început! Bine ați venit la Mănăstire!',
      time: 'Start',
      type: 'buy',
    },
  ]);

  // Turn End Drinking Popup (Mandatory after each turn)
  const [turnResult, setTurnResult] = useState<PendingTurnResult | null>(null);

  // Modal active states
  const [inspectTile, setInspectTile] = useState<BoardTile | null>(null);
  const [pendingBuyTile, setPendingBuyTile] = useState<BoardTile | null>(null);
  const [showJailModal, setShowJailModal] = useState<boolean>(false);
  const [activeCard, setActiveCard] = useState<GameCardDef | null>(null);
  const [activeTrivia, setActiveTrivia] = useState<any | null>(null);
  const [showSlotModal, setShowSlotModal] = useState<boolean>(false);
  const [showTwoTruthsModal, setShowTwoTruthsModal] = useState<boolean>(false);
  const [showMerchantModal, setShowMerchantModal] = useState<boolean>(false);
  const [selectPlayerPrompt, setSelectPlayerPrompt] = useState<{ title: string; sipsToGive: number } | null>(null);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState<boolean>(false);
  const [showInventoryDrawer, setShowInventoryDrawer] = useState<boolean>(false);

  const activePlayer = players[activePlayerIndex];

  // Helper to add to action logs
  const addLog = (text: string, type: ActionLogEntry['type'] = 'drink') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: generateUniqueId('log'), text, time: timeStr, type }, ...prev.slice(0, 7)]);
  };

  // Map tile owner
  const getOwnerOfTile = (tileIndex: number): Player | undefined => {
    return players.find(p => p.properties.includes(tileIndex));
  };

  // Advance turn to next non-given-up player
  const advanceTurn = () => {
    setTurnResult(null);
    setHoppingTileIndex(null);

    let nextIdx = (activePlayerIndex + 1) % players.length;
    let loopCount = 0;
    while (players[nextIdx].hasGivenUp && loopCount < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      loopCount++;
    }

    setActivePlayerIndex(nextIdx);

    // If next player is in jail, trigger jail modal
    if (players[nextIdx].inJail) {
      setShowJailModal(true);
    }
  };

  // Handle Using Pardon Letter inside the Turn Result Popup
  const handleUsePardonLetter = () => {
    if (!activePlayer.pardonLetters || activePlayer.pardonLetters <= 0) return;

    setPlayers(prev => prev.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          pardonLetters: p.pardonLetters - 1,
        };
      }
      return p;
    }));

    if (turnResult) {
      setTurnResult({
        ...turnResult,
        sipsToDrink: 0,
        isChug: false,
        isImmune: true,
        specialNote: '🎟️ Ai folosit Scrisoarea de Iertare! Pedeapsa a fost anulată.',
      });
      addLog(`${activePlayer.name} a folosit o Scrisoare de Iertare 🎟️!`, 'card');
    }
  };

  // Move pawn smoothly step-by-step
  const handleRollAndMove = () => {
    if (isMoving || activePlayer.inJail || turnResult) return;

    setIsMoving(true);

    const rolls = boardDiceCount === 1
      ? [Math.floor(Math.random() * 6) + 1]
      : [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];

    setDiceValues(rolls);
    const totalSteps = rolls.reduce((a, b) => a + b, 0);

    addLog(`${activePlayer.name} a dat zarul: 🎲 ${rolls.join(' + ')} = ${totalSteps}`, 'buy');

    let currentPos = activePlayer.position;
    let stepsLeft = totalSteps;
    let passedStart = false;

    const moveInterval = setInterval(() => {
      currentPos = (currentPos + 1) % 30;
      setHoppingTileIndex(currentPos);

      if (currentPos === 0 && stepsLeft < totalSteps) {
        passedStart = true;
      }

      setPlayers(prev => prev.map((p, idx) => {
        if (idx === activePlayerIndex) {
          return { ...p, position: currentPos };
        }
        return p;
      }));

      stepsLeft--;

      if (stepsLeft <= 0) {
        clearInterval(moveInterval);
        setIsMoving(false);

        // Process passing START bonus
        if (passedStart) {
          setPlayers(prev => prev.map((p, idx) => {
            if (idx === activePlayerIndex) return { ...p, gold: p.gold + 15 };
            return p;
          }));
          setFloatingNotification({ text: '+15 🪙 (Trecere START)', color: 'text-[#ffd700]' });
          addLog(`${activePlayer.name} a trecut peste START (+15 Galbeni 🪙)!`, 'gold');
          setTimeout(() => setFloatingNotification(null), 2500);
        }

        // Resolve the tile we landed on
        const landedTile = tiles[currentPos];
        resolveLandingTile(landedTile);
      }
    }, 380);
  };

  const resolveLandingTile = (tile: BoardTile) => {
    const owner = getOwnerOfTile(tile.index);
    const tileName = language === 'ro' ? tile.nameRo : tile.nameEn;

    // 1. Landing on OWN property -> Safe & Happy!
    if (owner && owner.id === activePlayer.id) {
      setTurnResult({
        title: '🏰 PROPRIETATEA TA!',
        reason: `Ai picat pe ${tileName} (Tile #${tile.index}), pe care o deții chiar tu!`,
        sipsToDrink: 0,
        isChug: false,
        isImmune: true,
        specialNote: 'Ești stăpân aici! Nu plătești chirie și nu bei nimic.',
      });
      addLog(`${activePlayer.name} a poposit pe propria proprietate (${tileName}).`, 'buy');
      return;
    }

    // 2. Landing on ANOTHER PLAYER'S property -> Pay rent in sips!
    if (owner && owner.id !== activePlayer.id) {
      const sipsDue = tile.sipsCount || 3;
      checkAchievement(activePlayer.name, {
        isRentPaid: true,
        sipsDelta: sipsDue,
      });
      setTurnResult({
        title: '🍺 CHIRIE MĂNĂSTIREASCĂ!',
        reason: `Ai picat pe ${tileName} (Tile #${tile.index}), aflată în stăpânirea lui ${owner.name}!`,
        sipsToDrink: sipsDue,
        isChug: tile.type === 'chug',
        isImmune: false,
        specialNote: `Plătești chiria de ${sipsDue} guri de bere lui ${owner.name}!`,
      });
      addLog(`${activePlayer.name} plătește ${sipsDue} guri chirie lui ${owner.name} (${tileName}).`, 'drink');
      return;
    }

    // 3. Unowned buyable property -> prompt purchase
    if (tile.buyable && !owner) {
      if (activePlayer.gold >= (tile.price || 0)) {
        setPendingBuyTile(tile);
      } else {
        // Can't afford -> direct drinking punishment with popup
        const sipsDue = tile.sipsCount || 2;
        setTurnResult({
          title: '🍺 NU AI SUFICIENȚI GALBENI!',
          reason: `Ai picat pe ${tileName} (Preț: ${tile.price}🪙), dar ai doar ${activePlayer.gold}🪙.`,
          sipsToDrink: sipsDue,
          isChug: tile.type === 'chug',
          isImmune: false,
          specialNote: `Nu poți cumpăra proprietatea, deci bei ${sipsDue} guri!`,
        });
        addLog(`${activePlayer.name} nu are aur pentru ${tileName} și bea ${sipsDue} guri.`, 'drink');
      }
      return;
    }

    // 4. Special Tiles Actions
    switch (tile.type) {
      case 'start':
        setTurnResult({
          title: '🏰 POPAS LA START!',
          reason: 'Ai aterizat direct pe chilia de START a mănăstirii.',
          sipsToDrink: 0,
          isChug: false,
          isImmune: true,
          specialNote: 'Ești binecuvântat și odihnit! Treci mai departe.',
        });
        break;

      case 'sip':
        setTurnResult({
          title: '🍺 POPAS DE BĂUT!',
          reason: `Ai picat pe ${tileName} (Tile #${tile.index}).`,
          sipsToDrink: tile.sipsCount || 2,
          isChug: false,
          isImmune: false,
          specialNote: 'Bea gurile mănăstirești prescrise de stareț!',
        });
        addLog(`${activePlayer.name} bea ${tile.sipsCount || 2} guri la ${tileName}.`, 'drink');
        break;

      case 'chug':
        setParticleType('chug');
        setTurnResult({
          title: '🔥 GROAPĂ TOTALĂ! 🔥',
          reason: `Ai picat pe chilia de GROAPĂ (Tile #${tile.index})!`,
          sipsToDrink: 0,
          isChug: true,
          isImmune: false,
          specialNote: '💀 Bei tot paharul dintr-o răsuflare până la fund!',
        });
        addLog(`${activePlayer.name} A PICAT PE GROAPĂ! CHUG IT ALL! 💀`, 'drink');
        break;

      case 'treasure': {
        const bonus = Math.floor(Math.random() * 6) + 5; // +5..+10
        setPlayers(prev => prev.map((p, idx) => idx === activePlayerIndex ? { ...p, gold: p.gold + bonus } : p));
        setFloatingNotification({ text: `+${bonus} 🪙 Comoară!`, color: 'text-[#ffd700]' });
        setTimeout(() => setFloatingNotification(null), 2500);

        setTurnResult({
          title: '🪙 COMOARA CĂLUGĂRULUI!',
          reason: `Ai găsit un cufăr ascuns cu +${bonus} Galbeni de aur!`,
          sipsToDrink: 0,
          isChug: false,
          isImmune: true,
          specialNote: `Aurul tău a crescut la ${activePlayer.gold + bonus} galbeni!`,
        });
        addLog(`${activePlayer.name} a găsit o comoară de +${bonus} Galbeni 🪙!`, 'gold');
        break;
      }

      case 'tax': {
        const taxVal = Math.floor(Math.random() * 6) + 5; // -5..-10
        setPlayers(prev => prev.map((p, idx) => idx === activePlayerIndex ? { ...p, gold: Math.max(0, p.gold - taxVal) } : p));
        setFloatingNotification({ text: `-${taxVal} 💰 Taxă`, color: 'text-red-400' });
        setTimeout(() => setFloatingNotification(null), 2500);

        setTurnResult({
          title: '💰 TAXĂ BISERICEASCĂ!',
          reason: `Vameșul mănăstirii ți-a cerut o danie obligatorie de -${taxVal} Galbeni.`,
          sipsToDrink: 0,
          isChug: false,
          isImmune: true,
          specialNote: `Ai plătit ${taxVal} galbeni către vistierie.`,
        });
        addLog(`${activePlayer.name} a plătit o taxă de -${taxVal} Galbeni.`, 'gold');
        break;
      }

      case 'safe':
        setTurnResult({
          title: '🛡️ CHILIE SIGURĂ!',
          reason: 'Ai găsit adăpost în chilia starețului.',
          sipsToDrink: 0,
          isChug: false,
          isImmune: true,
          specialNote: 'Nicio pedeapsă în această tură!',
        });
        break;

      case 'police':
        setPlayers(prev => prev.map((p, idx) => idx === activePlayerIndex ? { ...p, inJail: true, jailTurnsLeft: 3 } : p));
        setTurnResult({
          title: '👮 ÎNCHISOAREA MĂNĂSTIRII!',
          reason: 'Ai fost prins încălcând rânduiala! Mergi la temniță!',
          sipsToDrink: 0,
          isChug: false,
          isImmune: true,
          specialNote: 'Vei sta 3 ture la temniță, dacă nu plătești 10🪙 sau nu folosești o cheie 🔓.',
        });
        addLog(`${activePlayer.name} a fost trimis la TEMNIȚĂ ⛓️!`, 'jail');
        break;

      case 'mystery': {
        const randCard = mysteryCards[Math.floor(Math.random() * mysteryCards.length)];
        setActiveCard(randCard);
        break;
      }

      case 'risk': {
        const randCard = riskCards[Math.floor(Math.random() * riskCards.length)];
        setActiveCard(randCard);
        break;
      }

      case 'trivia': {
        const randQ = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
        setActiveTrivia(randQ);
        break;
      }

      case 'slot':
        setShowSlotModal(true);
        break;

      case 'merchant':
        setShowMerchantModal(true);
        break;

      case 'two_truths':
        setShowTwoTruthsModal(true);
        break;

      case 'round_house':
        // Everyone drinks 5 sips! Other players get +5 now, active player gets +5 on confirm
        setPlayers(prev => prev.map((p, idx) => idx !== activePlayerIndex ? { ...p, sipsTotal: p.sipsTotal + 5 } : p));
        setTurnResult({
          title: '🍻 TOATĂ LUMEA BEA 5 GURI!',
          reason: `Ai picat pe pătrățica #10: 'Toată lumea bea 5 guri'!`,
          sipsToDrink: 5,
          isChug: false,
          isImmune: false,
          specialNote: `🍻 TOATĂ LUMEA BEA! Toți cei ${players.length} călugări (inclusiv tu) beau câte 5 guri de bere! Scorul s-a actualizat pentru toată lumea.`,
        });
        addLog(`🍻 TOATĂ LUMEA BEA 5 GURI! Toți cei ${players.length} jucători beau 5 guri!`, 'drink');
        break;

      case 'give_sips':
        setSelectPlayerPrompt({ title: '👉 Alege cine bea 2 guri!', sipsToGive: 2 });
        break;

      case 'biggest_drinker': {
        let highestPlayer = players[0];
        let maxScore = -1;
        players.forEach(p => {
          const score = p.sipsTotal + 25 * p.chugsTotal;
          if (score > maxScore) {
            maxScore = score;
            highestPlayer = p;
          }
        });
        setPlayers(prev => prev.map(p => p.id === highestPlayer.id ? { ...p, sipsTotal: p.sipsTotal + 2 } : p));

        setTurnResult({
          title: '🥴 CEL MAI BĂUT FRATE!',
          reason: `${highestPlayer.name} conduce în clasamentul beției (${highestPlayer.sipsTotal} guri)!`,
          sipsToDrink: highestPlayer.id === activePlayer.id ? 2 : 0,
          isChug: false,
          isImmune: highestPlayer.id !== activePlayer.id,
          specialNote: `${highestPlayer.name} bea 2 guri suplimentare!`,
        });
        addLog(`${highestPlayer.name} a fost desemnat cel mai băut (+2 guri)!`, 'drink');
        break;
      }

      default:
        setTurnResult({
          title: '🛡️ TURA S-A ÎNCHEIAT',
          reason: `Ai aterizat pe ${tileName}.`,
          sipsToDrink: 0,
          isChug: false,
          isImmune: true,
        });
    }
  };

  // Card Execution
  const handleCardConfirm = () => {
    if (!activeCard) return;

    const res = activeCard.execute();
    const cardTitle = language === 'ro' ? activeCard.titleRo : activeCard.titleEn;
    setActiveCard(null);

    setPlayers(prev => prev.map((p, idx) => {
      if (idx === activePlayerIndex) {
        let gold = p.gold + (res.goldDelta || 0);
        let pardonLetters = p.pardonLetters + (res.pardonLetterDelta || 0);
        let jailKeys = p.jailKeys + (res.jailKeyDelta || 0);
        let inJail = p.inJail || (res.goToJail || false);
        let jailTurnsLeft = res.goToJail ? 3 : p.jailTurnsLeft;
        let sipsTotal = p.sipsTotal + (res.sips || 0);
        let chugsTotal = p.chugsTotal + (res.chug ? 1 : 0);

        return {
          ...p,
          gold: Math.max(0, gold),
          pardonLetters,
          jailKeys,
          inJail,
          jailTurnsLeft,
          sipsTotal,
          chugsTotal,
        };
      }
      return p;
    }));

    if (res.chug) setParticleType('chug');
    if (res.everyoneElseSips) {
      setPlayers(prev => prev.map((p, idx) => idx !== activePlayerIndex ? { ...p, sipsTotal: p.sipsTotal + res.everyoneElseSips! } : p));
    }

    if (res.pickSomeoneSips) {
      setSelectPlayerPrompt({ title: '👉 Dă 5 guri altcuiva!', sipsToGive: res.pickSomeoneSips });
      return;
    }

    if (res.goToSlot) {
      setShowSlotModal(true);
      return;
    }

    // Open Turn End Modal with card result
    const sips = res.sips || 0;
    const isChug = !!res.chug;
    setTurnResult({
      title: isChug
        ? (language === 'ro' ? '🔥 CARTE: GROAPĂ!' : '🔥 CARD: CHUG!')
        : sips > 0
        ? (language === 'ro' ? '🍺 CARTE: PEDEAPSĂ!' : '🍺 CARD: PENALTY!')
        : (language === 'ro' ? '✨ CARTE EXECUTATĂ!' : '✨ CARD EXECUTED!'),
      reason: language === 'ro' ? `Ai tras cartea: "${cardTitle}"` : `You drew the card: "${cardTitle}"`,
      sipsToDrink: sips,
      isChug: isChug,
      isImmune: sips === 0 && !isChug,
      specialNote: language === 'ro' ? (activeCard.effectRo) : (activeCard.effectEn),
    });
    addLog(
      language === 'ro'
        ? `${activePlayer.name} a tras cartea "${cardTitle}"`
        : `${activePlayer.name} drew card "${cardTitle}"`,
      'card'
    );
  };

  // Surrender / Give up
  const handleGiveUp = () => {
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          hasGivenUp: true,
          properties: [], // Reset owned properties
        };
      }
      return p;
    }));

    setShowGiveUpConfirm(false);
    addLog(
      language === 'ro'
        ? `🏳️ ${activePlayer.name} s-a predat și a părăsit mănăstirea!`
        : `🏳️ ${activePlayer.name} surrendered and left the monastery!`,
      'jail'
    );

    const remaining = players.filter(p => !p.hasGivenUp && p.id !== activePlayer.id);
    if (remaining.length <= 1) {
      onEndGame(players);
    } else {
      advanceTurn();
    }
  };

  // Property Color theme mapper for Monopoly style visual groups
  const getTileThemeColor = (idx: number) => {
    if (idx >= 1 && idx <= 7) return { border: 'border-amber-600/70', colorBar: 'bg-amber-500', badge: 'bg-amber-800/80', text: 'text-amber-300' };
    if (idx >= 8 && idx <= 14) return { border: 'border-sky-600/70', colorBar: 'bg-sky-500', badge: 'bg-sky-800/80', text: 'text-sky-300' };
    if (idx >= 15 && idx <= 22) return { border: 'border-emerald-600/70', colorBar: 'bg-emerald-500', badge: 'bg-emerald-800/80', text: 'text-emerald-300' };
    return { border: 'border-purple-600/70', colorBar: 'bg-purple-500', badge: 'bg-purple-800/80', text: 'text-purple-300' };
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[92vh] px-2 py-2 max-w-3xl mx-auto relative select-none">
      <ParticleOverlay type={particleType} onComplete={() => setParticleType(null)} />

      {/* Floating Animated Notification for Gold / Bonus */}
      {floatingNotification && (
        <div className="fixed top-16 z-50 animate-bounce bg-[#1a140d] border-2 border-[#ffd700] px-5 py-2 rounded-2xl shadow-2xl flex items-center gap-2">
          <span className={`text-lg font-cinzel font-black ${floatingNotification.color}`}>
            {floatingNotification.text}
          </span>
        </div>
      )}

      {/* Modern Medieval Top HUD Bar */}
      <div className="w-full bg-gradient-to-r from-[#1c1611] via-[#241c14] to-[#1c1611] border-2 border-[#e8c84a]/60 rounded-3xl p-3 shadow-2xl flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#2e2217] border border-[#ffd700] overflow-hidden shadow-inner flex-shrink-0 animate-pulse">
              <AvatarDisplay avatarId={activePlayer.avatarIcon} className="w-full h-full" />
            </div>
            {activePlayer.inJail && (
              <span className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full p-0.5 shadow">⛓️</span>
            )}
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-cinzel uppercase tracking-wider">{t('turnOf')}</div>
            <div className="text-base font-cinzel font-bold text-[#ffd700] gold-text-glow flex items-center gap-1">
              <span>{activePlayer.name}</span>
              {activePlayer.inJail && <span className="text-xs text-red-400 font-bold">(Închis: {activePlayer.jailTurnsLeft}t)</span>}
            </div>
          </div>
        </div>

        {/* Player Inventory Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-barlow">
          <div className="bg-[#14100b] border border-[#ffd700]/60 px-2.5 py-1.5 rounded-xl text-[#ffd700] font-bold flex items-center gap-1 shadow">
            <span>🪙</span>
            <span>{activePlayer.gold}</span>
          </div>

          <div className="bg-[#14100b] border border-blue-400/50 px-2 py-1.5 rounded-xl text-blue-300 font-bold flex items-center gap-1 shadow" title="Scrisori de Iertare">
            <span>🎟️</span>
            <span>{activePlayer.pardonLetters}</span>
          </div>

          <div className="bg-[#14100b] border border-emerald-400/50 px-2 py-1.5 rounded-xl text-emerald-300 font-bold flex items-center gap-1 shadow" title="Chei de Temniță">
            <span>🔓</span>
            <span>{activePlayer.jailKeys}</span>
          </div>

          <button
            onClick={() => setShowInventoryDrawer(!showInventoryDrawer)}
            className="p-1.5 rounded-xl bg-[#2b2014] border border-[#e8c84a]/40 text-[#ffd700] hover:bg-[#3d2e1c]"
            title="Inventar & Proprietăți"
          >
            🏰
          </button>
        </div>
      </div>

      {/* 30-Tile 9x8 Monastery Board Frame (Optimized for Android / Mobile screens) */}
      <div className="w-full aspect-[9/8] grid grid-cols-9 grid-rows-8 gap-0.5 sm:gap-1 bg-[#0c0906] border-3 sm:border-4 border-[#3d2a19] rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 shadow-[0_0_35px_rgba(0,0,0,0.9)] relative overflow-hidden">
        
        {/* Background Wood Inlay Pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e8c84a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* 30 Perimeter Tiles */}
        {tiles.map(tile => {
          const owner = getOwnerOfTile(tile.index);
          const landedPlayers = players.filter(p => !p.hasGivenUp && p.position === tile.index);
          const isLandedHere = landedPlayers.length > 0;
          const isHopping = hoppingTileIndex === tile.index;
          const theme = getTileThemeColor(tile.index);

          const isCorner = tile.index === 0 || tile.index === 8 || tile.index === 15 || tile.index === 23;

          // Action label badge for non-buyable tiles
          const getActionBadge = () => {
            if (tile.type === 'start') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-emerald-400 leading-none">START</span>;
            if (tile.type === 'treasure') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-amber-300 leading-none">+🪙</span>;
            if (tile.type === 'give_sips') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-sky-300 leading-none">DĂ {tile.sipsCount || 2}</span>;
            if (tile.type === 'mystery') return <span className="text-[7.5px] sm:text-[9px] font-cinzel font-black text-amber-300 leading-none">?</span>;
            if (tile.type === 'risk') return <span className="text-[7.5px] sm:text-[9px] font-cinzel font-black text-orange-400 leading-none">!</span>;
            if (tile.type === 'police') return <span className="text-[6px] sm:text-[7.5px] font-cinzel font-black text-red-400 leading-none">TEMNIȚĂ</span>;
            if (tile.type === 'round_house') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-amber-300 leading-none">TOȚI 🍻</span>;
            if (tile.type === 'trivia') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-purple-300 leading-none">TRIVIA</span>;
            if (tile.type === 'slot') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-yellow-400 leading-none">SLOT</span>;
            if (tile.type === 'safe') return <span className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-blue-300 leading-none">SAFE</span>;
            if (tile.type === 'biggest_drinker') return <span className="text-[6px] sm:text-[7.5px] font-cinzel font-black text-rose-300 leading-none">TOP 🥴</span>;
            if (tile.type === 'merchant') return <span className="text-[6px] sm:text-[7.5px] font-cinzel font-black text-emerald-300 leading-none">TÂRG</span>;
            if (tile.type === 'two_truths') return <span className="text-[6px] sm:text-[7.5px] font-cinzel font-black text-indigo-300 leading-none">2T 1L</span>;
            if (tile.type === 'skip_turn') return <span className="text-[6px] sm:text-[7.5px] font-cinzel font-black text-red-400 leading-none">PAS</span>;
            if (tile.type === 'drink_more') return <span className="text-[6px] sm:text-[7.5px] font-cinzel font-black text-amber-400 leading-none">BERĂRIE</span>;
            return null;
          };

          return (
            <div
              key={tile.index}
              onClick={() => setInspectTile(tile)}
              style={{ gridRow: tile.gridRow, gridColumn: tile.gridCol }}
              className={`relative rounded-lg sm:rounded-xl border flex flex-col items-center justify-between p-0.5 sm:p-1 cursor-pointer transition-all duration-200 overflow-hidden ${
                isHopping
                  ? 'border-[#ffd700] bg-[#3d2e16] scale-105 z-20 shadow-[0_0_15px_rgba(255,215,0,0.8)]'
                  : isLandedHere
                  ? 'border-[#ffd700] bg-[#291f14] ring-2 ring-[#ffd700]/70 z-10'
                  : isCorner
                  ? 'bg-gradient-to-br from-[#2b1f13] to-[#17100a] border-[#e8c84a]/80 shadow-md'
                  : owner
                  ? 'bg-gradient-to-b from-[#182618] to-[#0c140c] border-emerald-500/80 shadow-sm'
                  : tile.type === 'chug'
                  ? 'bg-gradient-to-b from-[#2e1310] to-[#140605] border-red-600/80'
                  : tile.type === 'treasure'
                  ? 'bg-gradient-to-b from-[#2d2511] to-[#141006] border-yellow-500/60'
                  : `bg-[#15110c] ${theme.border}`
              } hover:brightness-125 hover:z-20`}
            >
              {/* Top District Color Strip for Buyable Cells */}
              {tile.buyable ? (
                <div className={`w-full h-1 sm:h-1.5 rounded-t-sm ${theme.colorBar} shadow-sm`} />
              ) : (
                <div className="w-full h-0.5" />
              )}

              {/* Main Tile Icon (Cleanly centered, no text cramming) */}
              <div className="flex items-center justify-center my-auto">
                <span className="text-xs sm:text-base leading-none drop-shadow select-none transform transition-transform group-hover:scale-110">
                  {tile.emoji}
                </span>
              </div>

              {/* Bottom Badge: Sleek Gold Price or Action Hint */}
              <div className="w-full flex items-center justify-center mb-0.5">
                {tile.buyable ? (
                  <div className="text-[6.5px] sm:text-[8px] font-cinzel font-black text-[#ffd700] bg-black/85 px-1 py-0.2 rounded border border-[#ffd700]/30 leading-none shadow-sm flex items-center gap-0.5">
                    <span>{tile.price}</span>
                    <span className="text-[5.5px] sm:text-[7px]">🪙</span>
                  </div>
                ) : (
                  <div className="bg-black/70 px-1 py-0.2 rounded leading-none flex items-center justify-center">
                    {getActionBadge()}
                  </div>
                )}
              </div>

              {/* Owner Crown Marker (Top Right, never overlapping price) */}
              {owner && (
                <div
                  className="absolute top-0.5 right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-black flex items-center justify-center text-[6px] sm:text-[7px] text-black font-black shadow-md z-10"
                  style={{ backgroundColor: owner.color || '#10b981' }}
                  title={`Proprietar: ${owner.name}`}
                >
                  👑
                </div>
              )}

              {/* Landed Players Pawns (Floating cleanly centered at bottom) */}
              {landedPlayers.length > 0 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center -space-x-1.5 z-30 pointer-events-none">
                  {landedPlayers.map(p => (
                    <div
                      key={p.id}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#120f0a] border-2 border-[#ffd700] overflow-hidden shadow-[0_0_8px_rgba(255,215,0,0.6)] transform animate-bounce flex-shrink-0"
                      style={{ animationDuration: '1.2s' }}
                      title={p.name}
                    >
                      <AvatarDisplay avatarId={p.avatarIcon} className="w-full h-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Board Center Tavern Courtyard */}
        <div className="col-start-2 col-span-7 row-start-2 row-span-6 bg-gradient-to-b from-[#19130d]/95 via-[#140e08]/95 to-[#19130d]/95 border-2 border-[#3d2a19] rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-between text-center backdrop-blur-md relative shadow-inner overflow-hidden">
          
          {/* Top Title Banner */}
          <div className="w-full flex items-center justify-between border-b border-[#382717] pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm">🏰</span>
              <span className="text-[11px] sm:text-xs font-cinzel font-bold text-[#ffd700] tracking-wider">
                {language === 'ro' ? 'MĂNĂSTIREA VESELĂ' : 'MERRY MONASTERY'}
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-cinzel text-gray-400 flex items-center gap-1">
              <span>{language === 'ro' ? '↻ 30 Chilii' : '↻ 30 Cells'}</span>
            </div>
          </div>

          {/* Center Mascot & Active Player Status */}
          <div className="my-auto flex flex-col items-center justify-center space-y-1 py-0.5">
            <MonkMascot
              avatarId={activePlayer.avatarIcon}
              characterName={activePlayer.name}
              size="sm"
              showLabel={false}
              isDrinking={isMoving}
            />
            <div className="text-[10px] sm:text-[11px] font-cinzel text-[#ffd700] font-bold">
              {isMoving
                ? (language === 'ro' ? `🎲 ${activePlayer.name} înaintează...` : `🎲 ${activePlayer.name} is moving...`)
                : (language === 'ro' ? `Tura lui ${activePlayer.name}` : `${activePlayer.name}'s turn`)}
            </div>

            {/* Live Mini Tavern Chronicle Log */}
            <div className="w-full max-w-xs bg-[#0c0906] border border-[#2a1d12] rounded-xl p-1 text-left text-[9px] sm:text-[10px] font-barlow text-gray-300 max-h-10 overflow-hidden shadow-inner">
              <div className="text-[#e8c84a] font-bold truncate">📜 {logs[0]?.text || 'Start'}</div>
            </div>
          </div>

          {/* Center Dice Roller */}
          <div className="w-full flex flex-col items-center pb-0.5">
            <Dice
              size="sm"
              values={diceValues}
              skin={diceSkin}
              isRolling={isMoving}
              onRoll={handleRollAndMove}
              disabled={isMoving || activePlayer.inJail || !!turnResult}
            />
          </div>
        </div>
      </div>

      {/* Footer Controls Strip */}
      <div className="w-full flex items-center justify-between gap-2 mt-2">
        <button
          onClick={() => setShowGiveUpConfirm(true)}
          className="py-2 px-3 rounded-xl border border-red-500/50 bg-[#1a0e0e] text-red-400 font-cinzel text-xs hover:bg-[#2e1414] transition-all flex items-center gap-1"
        >
          <span>🏳️ {t('giveUpBtn')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInventoryDrawer(!showInventoryDrawer)}
            className="py-2 px-3 rounded-xl border border-[#2a2a2a] bg-[#161616] text-xs font-cinzel text-[#ffd700] hover:border-[#e8c84a]"
          >
            📊 {t('tabProfiles')}
          </button>
          <button
            onClick={onOpenRules}
            className="py-2 px-3 rounded-xl border border-[#2a2a2a] bg-[#161616] text-xs font-cinzel text-gray-300 hover:text-white"
          >
            📜 {t('tabRules')}
          </button>
          <button
            onClick={() => onEndGame(players)}
            className="py-2 px-3 rounded-xl border border-[#e8c84a] bg-[#e8c84a]/20 text-xs font-cinzel font-bold text-[#e8c84a] hover:bg-[#e8c84a]/30"
          >
            🏁 {t('endGame')}
          </button>
        </div>
      </div>

      {/* --- ALL POPUPS AND MODALS --- */}

      {/* MANDATORY Turn End Pop-up (Shows exact sips & confirms before passing!) */}
      {turnResult && (
        <TurnEndDrinkModal
          player={activePlayer}
          title={turnResult.title}
          reason={turnResult.reason}
          sipsToDrink={turnResult.sipsToDrink}
          isChug={turnResult.isChug}
          isImmune={turnResult.isImmune}
          specialNote={turnResult.specialNote}
          onUsePardonLetter={activePlayer.pardonLetters > 0 ? handleUsePardonLetter : undefined}
          onConfirm={() => {
            // Apply drinking score to player before advancing
            const addedSips = turnResult.isImmune ? 0 : (turnResult.isChug ? 0 : turnResult.sipsToDrink);
            const addedChugs = turnResult.isChug ? 1 : 0;
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
            advanceTurn();
          }}
        />
      )}

      {/* Inspect Tile Modal */}
      {inspectTile && (
        <TileDetailModal
          tile={inspectTile}
          ownerName={getOwnerOfTile(inspectTile.index)?.name}
          onClose={() => setInspectTile(null)}
        />
      )}

      {/* Buy Property Modal */}
      {pendingBuyTile && (
        <BuyPropertyModal
          tile={pendingBuyTile}
          player={activePlayer}
          onBuy={() => {
            const price = pendingBuyTile.price || 0;
            const tileName = language === 'ro' ? pendingBuyTile.nameRo : pendingBuyTile.nameEn;
            const sipsDue = pendingBuyTile.sipsCount || 2;
            const isChug = pendingBuyTile.type === 'chug';

            setPlayers(prev => prev.map((p, idx) => {
              if (idx === activePlayerIndex) {
                return {
                  ...p,
                  gold: p.gold - price,
                  properties: [...p.properties, pendingBuyTile.index],
                };
              }
              return p;
            }));

            checkAchievement(activePlayer.name, {
              boughtProperty: true,
              currentBoardProps: activePlayer.properties.length + 1,
              currentBoardGold: activePlayer.gold - price,
            });

            addLog(
              language === 'ro'
                ? `${activePlayer.name} a cumpărat ${tileName} pentru ${price} Galbeni 🏰!`
                : `${activePlayer.name} purchased ${tileName} for ${price} Gold 🏰!`,
              'buy'
            );
            setPendingBuyTile(null);

            setTurnResult({
              title: language === 'ro' ? '🏰 PROPRIETATE ACHIZIȚIONATĂ!' : '🏰 PROPERTY ACQUIRED!',
              reason: language === 'ro'
                ? `Ai cumpărat ${tileName} (Tile #${pendingBuyTile.index}) pentru ${price} Galbeni!`
                : `You purchased ${tileName} (Tile #${pendingBuyTile.index}) for ${price} Gold!`,
              sipsToDrink: sipsDue,
              isChug: isChug,
              isImmune: false,
              specialNote: language === 'ro'
                ? `Proprietatea îți aparține acum! Pentru a sfinți achiziția, bei ${isChug ? 'o GROAPĂ' : `${sipsDue} guri de bere`} (în turele viitoare când pici pe ea nu vei mai bea nimic!).`
                : `The sanctuary is now yours! To bless your purchase, drink ${isChug ? 'a CHUG' : `${sipsDue} sips of beer`} (future landings here are completely safe!).`,
            });
          }}
          onSkip={() => {
            const tile = pendingBuyTile;
            const tileName = language === 'ro' ? tile.nameRo : tile.nameEn;
            setPendingBuyTile(null);

            const sipsDue = tile.sipsCount || 2;
            setTurnResult({
              title: language === 'ro' ? '🍺 AI REFUZAT CUMPĂRAREA!' : '🍺 PURCHASE DECLINED!',
              reason: language === 'ro' ? `Ai ales să nu cumperi ${tileName}. Pedeapsă:` : `You chose not to purchase ${tileName}. Penalty:`,
              sipsToDrink: sipsDue,
              isChug: tile.type === 'chug',
              isImmune: false,
              specialNote: language === 'ro'
                ? `Bei ${sipsDue} guri de bere pentru ezitare!`
                : `Drink ${sipsDue} sips of beer for hesitating!`,
            });
            addLog(
              language === 'ro'
                ? `${activePlayer.name} a refuzat cumpărarea la ${tileName} și bea ${sipsDue} guri.`
                : `${activePlayer.name} declined buying ${tileName} and drinks ${sipsDue} sips.`,
              'drink'
            );
          }}
        />
      )}

      {/* Jail Modal */}
      {showJailModal && (
        <JailModal
          player={activePlayer}
          onPayFee={() => {
            setPlayers(prev => prev.map((p, idx) => {
              if (idx === activePlayerIndex) {
                return { ...p, gold: p.gold - 10, inJail: false, jailTurnsLeft: 0 };
              }
              return p;
            }));
            setShowJailModal(false);
            addLog(
              language === 'ro'
                ? `${activePlayer.name} a plătit 10 Galbeni cauțiune și a ieșit din temniță!`
                : `${activePlayer.name} paid 10 Gold bail and left jail!`,
              'jail'
            );
          }}
          onUseKey={() => {
            setPlayers(prev => prev.map((p, idx) => {
              if (idx === activePlayerIndex) {
                return { ...p, jailKeys: p.jailKeys - 1, inJail: false, jailTurnsLeft: 0 };
              }
              return p;
            }));
            checkAchievement(activePlayer.name, { isJailEscape: true });
            setShowJailModal(false);
            addLog(
              language === 'ro'
                ? `${activePlayer.name} a folosit o Cheie de Temniță 🔓!`
                : `${activePlayer.name} used a Dungeon Key 🔓!`,
              'jail'
            );
          }}
          onWait={() => {
            setPlayers(prev => prev.map((p, idx) => {
              if (idx === activePlayerIndex) {
                const nextTurns = p.jailTurnsLeft - 1;
                return {
                  ...p,
                  jailTurnsLeft: nextTurns,
                  inJail: nextTurns > 0,
                };
              }
              return p;
            }));
            setShowJailModal(false);
            addLog(
              language === 'ro'
                ? `${activePlayer.name} își ispășește pedeapsa în temniță.`
                : `${activePlayer.name} serves their time in jail.`,
              'jail'
            );
            advanceTurn();
          }}
        />
      )}

      {/* Card Modal */}
      {activeCard && (
        <CardModal card={activeCard} onConfirm={handleCardConfirm} />
      )}

      {/* Trivia Modal */}
      {activeTrivia && (
        <TriviaModal
          question={activeTrivia}
          onAnswer={isCorrect => {
            setActiveTrivia(null);
            if (isCorrect) {
              setPlayers(prev => prev.map((p, idx) => idx === activePlayerIndex ? { ...p, pardonLetters: p.pardonLetters + 1, gold: p.gold + 5 } : p));
              checkAchievement(activePlayer.name, { isTriviaCorrect: true });
              setTurnResult({
                title: language === 'ro' ? '🧠 RĂSPUNS CORECT!' : '🧠 CORRECT ANSWER!',
                reason: language === 'ro' ? 'Ai dat răspunsul corect la întrebarea de cultură!' : 'You answered the trivia question correctly!',
                sipsToDrink: 0,
                isChug: false,
                isImmune: true,
                specialNote: language === 'ro' ? 'Ai primit +1 Scrisoare de Iertare 🎟️ și +5 Galbeni 🪙!' : 'Awarded +1 Pardon Letter 🎟️ and +5 Gold 🪙!',
              });
              addLog(
                language === 'ro'
                  ? `${activePlayer.name} a răspuns CORECT la Trivia (+1 Iertare)!`
                  : `${activePlayer.name} answered CORRECTLY to Trivia (+1 Pardon)!`,
                'card'
              );
            } else {
              setTurnResult({
                title: language === 'ro' ? '🧠 RĂSPUNS GREȘIT!' : '🧠 WRONG ANSWER!',
                reason: language === 'ro' ? 'Nu ai știut răspunsul la întrebarea mănăstirească.' : 'You missed the answer to the monastery question.',
                sipsToDrink: 5,
                isChug: false,
                isImmune: false,
                specialNote: language === 'ro' ? 'Pedeapsă: Bei 5 guri zdravene de bere!' : 'Penalty: Drink 5 hefty sips of beer!',
              });
              addLog(
                language === 'ro'
                  ? `${activePlayer.name} a greșit la Trivia (5 guri)!`
                  : `${activePlayer.name} missed Trivia (5 sips)!`,
                'drink'
              );
            }
          }}
        />
      )}

      {/* Slot Machine Modal */}
      {showSlotModal && (
        <SlotModal
          onComplete={resultType => {
            setShowSlotModal(false);
            if (resultType === 'monks') {
              setPlayers(prev => prev.map((p, idx) => idx !== activePlayerIndex ? { ...p, sipsTotal: p.sipsTotal + 3 } : p));
              setTurnResult({
                title: language === 'ro' ? '🎰 3 CĂLUGĂRI LA SLOT!' : '🎰 3 MONKS ON SLOTS!',
                reason: language === 'ro' ? 'Ai tras 3 Călugări identici la Slotul Sfânt!' : 'You rolled 3 matching Monks on the holy slot machine!',
                sipsToDrink: 0,
                isChug: false,
                isImmune: true,
                specialNote: language === 'ro' ? 'Toți ceilalți jucători beau câte 3 guri fiecare!' : 'All other players drink 3 sips each!',
              });
              addLog(
                language === 'ro'
                  ? `${activePlayer.name} a dat 3 Călugări la Slot! Toți ceilalți beau 3 guri!`
                  : `${activePlayer.name} hit 3 Monks on Slots! All others drink 3 sips!`,
                'card'
              );
            } else if (resultType === 'beers') {
              setTurnResult({
                title: language === 'ro' ? '🎰 3 BERI LA SLOT!' : '🎰 3 BEERS ON SLOTS!',
                reason: language === 'ro' ? 'Ai tras 3 Halbe de bere la Slotul Sfânt!' : 'You rolled 3 Beer Steins on the holy slot machine!',
                sipsToDrink: 3,
                isChug: false,
                isImmune: false,
                specialNote: language === 'ro' ? 'Bei 3 guri de bere proaspătă!' : 'Drink 3 sips of freshly brewed monastery beer!',
              });
              addLog(
                language === 'ro'
                  ? `${activePlayer.name} a nimerit 3 Beri la Slot (3 guri).`
                  : `${activePlayer.name} hit 3 Beers on Slots (3 sips).`,
                'drink'
              );
            } else if (resultType === 'sevens') {
              setPlayers(prev => {
                let totalStolen = 0;
                const updated = prev.map((p, idx) => {
                  if (idx !== activePlayerIndex) {
                    const stolen = Math.min(p.gold, 10);
                    totalStolen += stolen;
                    return {
                      ...p,
                      gold: p.gold - stolen,
                      chugsTotal: p.chugsTotal + 1,
                    };
                  }
                  return p;
                });
                updated[activePlayerIndex].gold += totalStolen;
                return updated;
              });
              setParticleType('chug');
              setTurnResult({
                title: language === 'ro' ? '🎰 JACKPOT: 7-7-7 SACRU! 🔥' : '🎰 SACRED 7-7-7 JACKPOT! 🔥',
                reason: language === 'ro' ? 'Ai nimerit Marele Jackpot 7-7-7!' : 'You hit the Grand 7-7-7 Sacred Jackpot!',
                sipsToDrink: 0,
                isChug: false,
                isImmune: true,
                specialNote: language === 'ro'
                  ? 'Iei până la 10 Galbeni de la toți ceilalți ȘI toți ceilalți dau GROAPĂ / CHUG IT ALL!'
                  : 'Stole up to 10 Gold from everyone AND all other players must CHUG IT ALL!',
              });
              addLog(
                language === 'ro'
                  ? `🎰 JACKPOT 7-7-7 pentru ${activePlayer.name}! GROAPĂ la toți ceilalți!`
                  : `🎰 7-7-7 JACKPOT for ${activePlayer.name}! CHUG for all others!`,
                'gold'
              );
            }
          }}
        />
      )}

      {/* Merchant Modal */}
      {showMerchantModal && (
        <MerchantModal
          player={activePlayer}
          onBuy={() => {
            setShowMerchantModal(false);
            setPlayers(prev => prev.map((p, idx) => idx === activePlayerIndex ? { ...p, gold: p.gold - 30, pardonLetters: p.pardonLetters + 1 } : p));
            setTurnResult({
              title: language === 'ro' ? '🧙 AFACERE CU VRĂJITORUL!' : '🧙 DEAL WITH THE WIZARD!',
              reason: language === 'ro' ? 'Ai cumpărat o Scrisoare de Iertare pentru 30 Galbeni.' : 'You purchased a Pardon Letter for 30 Gold.',
              sipsToDrink: 0,
              isChug: false,
              isImmune: true,
              specialNote: language === 'ro' ? 'Ai adăugat 1 Scrisoare de Iertare 🎟️ în inventar!' : 'Added 1 Pardon Letter 🎟️ to your inventory!',
            });
            addLog(
              language === 'ro'
                ? `${activePlayer.name} a cumpărat o Scrisoare de Iertare 🎟️ de la Vrăjitor.`
                : `${activePlayer.name} bought a Pardon Letter 🎟️ from the Wizard.`,
              'card'
            );
          }}
          onDecline={() => {
            setShowMerchantModal(false);
            setTurnResult({
              title: language === 'ro' ? '🧙 AI TRECUT DE VRĂJITOR' : '🧙 PASSED THE WIZARD',
              reason: language === 'ro' ? 'Ai refuzat oferta negustorului.' : 'You declined the merchant offer.',
              sipsToDrink: 0,
              isChug: false,
              isImmune: true,
            });
          }}
        />
      )}

      {/* Two Truths Modal */}
      {showTwoTruthsModal && (
        <TwoTruthsModal
          onResolve={guessed => {
            setShowTwoTruthsModal(false);
            if (guessed) {
              setTurnResult({
                title: language === 'ro' ? '🎭 AU GHICIT MINCIUNA!' : '🎭 LIE GUESSED!',
                reason: language === 'ro' ? 'Ceilalți frați au ghicit care era minciuna ta.' : 'The other monks discovered your lie.',
                sipsToDrink: 5,
                isChug: false,
                isImmune: false,
                specialNote: language === 'ro' ? 'Pedeapsă: Bei 5 guri de bere!' : 'Penalty: Drink 5 sips of beer!',
              });
              addLog(
                language === 'ro'
                  ? `Ceilalți au ghicit minciuna lui ${activePlayer.name} (5 guri).`
                  : `Others guessed ${activePlayer.name}'s lie (5 sips).`,
                'drink'
              );
            } else {
              setPlayers(prev => prev.map((p, idx) => idx !== activePlayerIndex ? { ...p, sipsTotal: p.sipsTotal + 3 } : p));
              setTurnResult({
                title: language === 'ro' ? '🎭 N-AU GHICIT MINCIUNA!' : '🎭 LIE UNDISCOVERED!',
                reason: language === 'ro' ? 'I-ai păcălit pe toți frații din mănăstire!' : 'You fooled all the monks in the abbey!',
                sipsToDrink: 0,
                isChug: false,
                isImmune: true,
                specialNote: language === 'ro' ? 'Toți ceilalți jucători beau câte 3 guri!' : 'All other players drink 3 sips each!',
              });
              addLog(
                language === 'ro'
                  ? `${activePlayer.name} i-a păcălit pe toți la 2 Adevăruri (ceilalți beau 3 guri)!`
                  : `${activePlayer.name} fooled everyone in 2 Truths (others drink 3 sips)!`,
                'drink'
              );
            }
          }}
        />
      )}

      {/* Select Target Player Modal */}
      {selectPlayerPrompt && (
        <SelectPlayerModal
          title={selectPlayerPrompt.title}
          players={players}
          activePlayerId={activePlayer.id}
          onSelect={targetId => {
            const sips = selectPlayerPrompt.sipsToGive;
            const targetPlayer = players.find(p => p.id === targetId);
            setSelectPlayerPrompt(null);

            setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, sipsTotal: p.sipsTotal + sips } : p));
            setTurnResult({
              title: language === 'ro' ? '👉 GURI ÎMPĂRȚITE!' : '👉 SIPS DISTRIBUTED!',
              reason: language === 'ro'
                ? `I-ai trimis ${sips} guri lui ${targetPlayer?.name || 'adversarului'}.`
                : `You gave ${sips} sips to ${targetPlayer?.name || 'opponent'}.`,
              sipsToDrink: 0,
              isChug: false,
              isImmune: true,
              specialNote: language === 'ro'
                ? `${targetPlayer?.name} trebuie să bea acum ${sips} guri!`
                : `${targetPlayer?.name} must now drink ${sips} sips!`,
            });
            addLog(
              language === 'ro'
                ? `${activePlayer.name} a trimis ${sips} guri lui ${targetPlayer?.name}.`
                : `${activePlayer.name} sent ${sips} sips to ${targetPlayer?.name}.`,
              'drink'
            );
          }}
        />
      )}

      {/* Give Up Confirmation Modal */}
      {showGiveUpConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#161616] border-2 border-[#e05c3a] rounded-3xl p-6 max-w-sm w-full space-y-4 flame-glow text-center">
            <div className="text-5xl">🏳️ ⚠️</div>
            <h3 className="text-xl font-cinzel font-bold text-[#e05c3a] flame-text-glow">
              {t('giveUpBtn')}
            </h3>
            <p className="text-sm font-barlow text-[#f0ebe0]">
              {t('giveUpConfirm')}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleGiveUp}
                className="flex-1 py-3 rounded-2xl bg-[#e05c3a] text-white font-cinzel font-bold text-sm hover:brightness-110"
              >
                {t('giveUpYes')}
              </button>
              <button
                onClick={() => setShowGiveUpConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-[#2a2a2a] text-gray-300 font-cinzel text-sm hover:text-white"
              >
                {t('giveUpNo')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Score & Inventory Drawer Modal */}
      <ScoreModal
        isOpen={showInventoryDrawer}
        onClose={() => setShowInventoryDrawer(false)}
        activePlayers={players}
        activePlayerIndex={activePlayerIndex}
        gameMode="boardgame"
      />
    </div>
  );
};
