import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChestDef,
  CosmeticItem,
  CosmeticRarity,
  ChestOpenResult,
} from '../types';
import {
  CHESTS_CATALOG,
  RARITY_DEFINITIONS,
  rollChestItem,
  generateCaseTape,
} from '../data/chestsCatalog';
import { useApp } from '../context/AppContext';
import { soundEffects } from '../lib/soundFx';
import { DieFace } from './Dice';
import { AvatarDisplay } from './AvatarDisplay';
import { Sparkles, X, FastForward, RotateCcw, Check, ArrowDown, Gift, ArrowLeft, ShoppingBag } from 'lucide-react';

interface ChestOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChestId?: string;
  onBackToStore?: () => void;
}

const CARD_WIDTH = 140; // Card width in px
const CARD_GAP = 12; // Gap between cards in px
const STRIDE = CARD_WIDTH + CARD_GAP; // Total px per item
const TAPE_LENGTH = 75;
const TARGET_INDEX = 58;
const SPIN_DURATION_MS = 7200; // 7.2 seconds realistic CS:GO spin duration

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({
  isOpen,
  onClose,
  initialChestId,
  onBackToStore,
}) => {
  const {
    drunkenCoins,
    spendDrunkenCoins,
    addDrunkenCoins,
    isItemPurchased,
    purchaseShopItem,
    setDiceSkin,
    setTheme,
    masterProfile,
    updateProfileAvatar,
    equipCustomTitle,
    language,
  } = useApp();

  const isRo = language === 'ro';

  const handleBackToStore = () => {
    if (onBackToStore) {
      onBackToStore();
    } else {
      onClose();
    }
  };

  const [selectedChest, setSelectedChest] = useState<ChestDef>(() => {
    if (initialChestId) {
      const found = CHESTS_CATALOG.find((c) => c.id === initialChestId || c.key === initialChestId);
      if (found) return found;
    }
    return CHESTS_CATALOG[0];
  });

  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealed'>('idle');
  const [tape, setTape] = useState<CosmeticItem[]>([]);
  const [openResult, setOpenResult] = useState<ChestOpenResult | null>(null);
  const [equippedSuccess, setEquippedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickCardRef = useRef<number>(-1);

  // Set default initial chest if prop changes
  useEffect(() => {
    if (initialChestId) {
      const found = CHESTS_CATALOG.find((c) => c.id === initialChestId || c.key === initialChestId);
      if (found) setSelectedChest(found);
    }
  }, [initialChestId]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleStartOpen = () => {
    if (phase === 'spinning') return;
    setErrorMsg(null);
    setEquippedSuccess(false);

    if (drunkenCoins < selectedChest.cost) {
      setErrorMsg(
        isRo
          ? `❌ Fonduri insuficiente! Ai nevoie de ${selectedChest.cost} 🪙 (ai doar ${drunkenCoins} 🪙).`
          : `❌ Insufficient coins! You need ${selectedChest.cost} 🪙 (you have ${drunkenCoins} 🪙).`
      );
      return;
    }

    // Deduct chest cost
    const spent = spendDrunkenCoins(selectedChest.cost);
    if (!spent) return;

    // Roll item server/logic side
    const { winningItem, rolledOdds } = rollChestItem(selectedChest);
    const isDup = isItemPurchased(winningItem.id) || isItemPurchased(winningItem.name);
    const refundAmt = isDup ? Math.round(selectedChest.cost * 0.3) : 0;

    // Generate horizontal strip with near-misses
    const generatedTape = generateCaseTape(selectedChest, winningItem, TARGET_INDEX, TAPE_LENGTH);
    setTape(generatedTape);

    const result: ChestOpenResult = {
      chest: selectedChest,
      winningItem,
      isDuplicate: isDup,
      refundAmount: refundAmt,
      rolledOdds,
    };
    setOpenResult(result);
    setPhase('spinning');

    // Random landing offset within winning card (-35px to +35px) for natural human feel
    const randomCardJitter = (Math.random() - 0.5) * 60;
    
    // Calculate final scroll translation
    // Container center aligns with TARGET_INDEX center
    const containerWidth = containerRef.current?.clientWidth || 700;
    const centerOffset = containerWidth / 2;
    const targetCenter = TARGET_INDEX * STRIDE + CARD_WIDTH / 2;
    const finalScrollX = targetCenter - centerOffset + randomCardJitter;

    lastTickCardRef.current = -1;
    const startTime = performance.now();

    // CS:GO Easing formula (cubic-bezier approximation: fast explosion -> progressive deceleration -> slow tension crawl)
    const easeOutCS = (t: number) => {
      // Custom 4th-order polynomial for authentic CS case opening physics
      const p = 1 - t;
      return 1 - Math.pow(p, 4.5);
    };

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / SPIN_DURATION_MS);
      const easedProgress = easeOutCS(progress);
      const currentX = finalScrollX * easedProgress;

      if (tapeRef.current) {
        tapeRef.current.style.transform = `translateX(-${currentX}px)`;
        
        // Motion blur during peak velocity
        if (progress < 0.35) {
          tapeRef.current.style.filter = 'blur(1.2px)';
        } else {
          tapeRef.current.style.filter = 'none';
        }
      }

      // Check ticker passing center needle
      const currentNeedleX = currentX + centerOffset;
      const currentCardIndex = Math.floor(currentNeedleX / STRIDE);

      if (currentCardIndex !== lastTickCardRef.current && currentCardIndex >= 0 && currentCardIndex < generatedTape.length) {
        lastTickCardRef.current = currentCardIndex;
        const cardItem = generatedTape[currentCardIndex];
        if (cardItem.rarity === 'covert' || cardItem.rarity === 'rareSpecial') {
          soundEffects.playCaseRarePass();
        } else {
          // Pitch scales slightly with deceleration
          const pitch = 0.9 + (1 - progress) * 0.4;
          soundEffects.playCaseSpinTick(pitch);
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        // Spin finished! Finalize state and trigger celebration
        finishOpen(result);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateSpin);
  };

  const handleSkipAnimation = () => {
    if (phase !== 'spinning' || !openResult) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    
    // Jump straight to winning target
    const containerWidth = containerRef.current?.clientWidth || 700;
    const centerOffset = containerWidth / 2;
    const targetCenter = TARGET_INDEX * STRIDE + CARD_WIDTH / 2;
    const finalScrollX = targetCenter - centerOffset;
    if (tapeRef.current) {
      tapeRef.current.style.transform = `translateX(-${finalScrollX}px)`;
      tapeRef.current.style.filter = 'none';
    }
    finishOpen(openResult);
  };

  const finishOpen = (result: ChestOpenResult) => {
    setPhase('revealed');
    soundEffects.playCaseReveal(result.winningItem.rarity);

    // Apply inventory & duplicate refund
    if (result.isDuplicate && result.refundAmount > 0) {
      addDrunkenCoins(result.refundAmount);
    } else {
      // Save newly unlocked item
      purchaseShopItem(result.winningItem.id, 0);
    }
  };

  const handleEquipItem = () => {
    if (!openResult) return;
    const item = openResult.winningItem;

    if (item.type === 'diceSkin' && item.diceSkinKey) {
      setDiceSkin(item.diceSkinKey as any);
      setEquippedSuccess(true);
      soundEffects.playEquip();
    } else if (item.type === 'theme' && item.themeKey) {
      setTheme(item.themeKey as any);
      setEquippedSuccess(true);
      soundEffects.playEquip();
    } else if (item.type === 'avatar' && item.avatarKey) {
      if (masterProfile?.id) {
        updateProfileAvatar(masterProfile.id, item.avatarKey);
      }
      setEquippedSuccess(true);
      soundEffects.playEquip();
    } else if (item.type === 'title') {
      if (masterProfile?.id) {
        equipCustomTitle(
          item.titleKey || item.id,
          item.titleNameRo || item.name,
          item.titleNameEn || item.nameEn || item.name,
          masterProfile.id
        );
      }
      setEquippedSuccess(true);
      soundEffects.playEquip();
    } else {
      setEquippedSuccess(true);
      soundEffects.playEquip();
    }
  };

  const currentRarityMeta = openResult
    ? RARITY_DEFINITIONS[openResult.winningItem.rarity]
    : RARITY_DEFINITIONS.milspec;

  return (
    <div
      id="chest-opening-modal-overlay"
      onClick={phase === 'spinning' ? undefined : onClose}
      style={{ zIndex: 99999 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-lg select-none animate-fade-in"
    >
      <div
        id="chest-opening-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#1c1208] via-[#120b05] to-[#080402] border-2 border-[#ffd700] rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(255,215,0,0.35)] text-[#f0ebe0] max-h-[96vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ffd700]/30 pb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Prominent Back to Store Button in Header */}
            {phase !== 'spinning' && (
              <button
                type="button"
                onClick={handleBackToStore}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2c1708] to-[#1a0f05] hover:from-[#3e220d] hover:to-[#261508] border border-[#ffd700]/60 hover:border-[#ffd700] text-amber-300 hover:text-white font-cinzel font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 flex-shrink-0"
                title={isRo ? 'Înapoi la Magazin / Bazar' : 'Back to Store / Bazaar'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{isRo ? '← Înapoi la Magazin' : '← Back to Store'}</span>
                <span className="sm:hidden">{isRo ? 'Magazin' : 'Store'}</span>
              </button>
            )}

            <span className="text-2xl sm:text-3xl flex-shrink-0">{selectedChest.icon}</span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-xl font-cinzel font-black text-[#ffd700] tracking-wider flex items-center gap-2 truncate">
                <span>{isRo ? selectedChest.nameRo : selectedChest.nameEn}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40 flex-shrink-0">
                  {selectedChest.cost} 🪙
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-barlow hidden sm:block truncate">
                {isRo
                  ? 'Deschidere stil CS cu rarități, animație de ruletă și cosmetice exclusive'
                  : 'CS-style case opening with exact rarities, roulette animation & exclusive cosmetics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Quick Top-up Button */}
            <button
              onClick={() => addDrunkenCoins(999999)}
              className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:brightness-125 active:scale-95 text-black font-cinzel font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-xl border border-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.4)] transition-all flex items-center gap-1 cursor-pointer"
              title={isRo ? '+999,999 🪙 Bani Infiniți' : '+999,999 🪙 Infinite Coins'}
            >
              <span>⚡</span>
              <span>+999k 🪙</span>
            </button>

            {/* Treasury Balance */}
            <div className="bg-[#0b0704] border border-[#ffd700]/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <span className="text-sm">🪙</span>
              <span className="font-mono font-black text-xs sm:text-sm text-[#ffd700]">{drunkenCoins.toLocaleString()}</span>
            </div>

            {phase !== 'spinning' && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#20140a] hover:bg-[#361e0e] border border-stone-700 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                title={isRo ? 'Închide' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chest Selector Tabs (When Idle) */}
        {phase === 'idle' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3">
            {CHESTS_CATALOG.map((chest) => {
              const isSelected = selectedChest.id === chest.id;
              const isHighTier = chest.isHighTierOnly;

              return (
                <button
                  key={chest.id}
                  onClick={() => setSelectedChest(chest)}
                  className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 relative overflow-hidden text-left ${
                    isSelected
                      ? isHighTier
                        ? 'border-[#ffd700] bg-gradient-to-b from-[#3d2906] to-[#1f1402] shadow-[0_0_25px_rgba(255,215,0,0.5)] scale-[1.03] ring-2 ring-[#ffd700]'
                        : 'border-[#ffd700] bg-[#2a1a0b] shadow-[0_0_20px_rgba(255,215,0,0.35)] scale-[1.02]'
                      : isHighTier
                      ? 'border-yellow-700/60 bg-[#1c1303] text-amber-200 hover:border-[#ffd700]'
                      : 'border-stone-800 bg-[#120b06] text-gray-400 hover:border-stone-600'
                  }`}
                >
                  {isHighTier && (
                    <span className="absolute top-1 right-1 text-[8px] font-cinzel font-black uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow">
                      HIGH-TIER
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl">{chest.icon}</span>
                  <div className="text-center w-full">
                    <div className="text-xs font-cinzel font-bold text-[#ffd700] leading-tight truncate">
                      {isRo ? chest.nameRo : chest.nameEn}
                    </div>
                    <div className="text-[10px] font-mono text-amber-300/90 mt-0.5 font-bold">
                      {chest.cost} 🪙
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Roulette Container */}
        <div className="relative my-4 flex-1 flex flex-col justify-center min-h-[230px]">
          {/* Top & Bottom Central Needle Guide */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-[#ffd700] via-[#ffe58f] to-[#ffd700] z-30 pointer-events-none shadow-[0_0_15px_#ffd700]">
            {/* Top Indicator Triangle */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#ffd700] drop-shadow-[0_0_8px_#ffd700]">
              <ArrowDown className="w-5 h-5 fill-[#ffd700]" />
            </div>
            {/* Bottom Indicator Triangle */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[#ffd700] drop-shadow-[0_0_8px_#ffd700] rotate-180">
              <ArrowDown className="w-5 h-5 fill-[#ffd700]" />
            </div>
          </div>

          {/* Left/Right Edge Shadow Fades */}
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#080402] via-[#080402]/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#080402] via-[#080402]/80 to-transparent z-20 pointer-events-none" />

          {/* Horizontal Roulette Strip */}
          <div
            ref={containerRef}
            className="w-full bg-[#0a0603] border-y-2 border-[#ffd700]/30 py-3 overflow-hidden relative shadow-inner"
          >
            <div
              ref={tapeRef}
              className="flex items-center gap-3 transition-transform will-change-transform"
              style={{ width: 'max-content', transform: 'translateX(0px)' }}
            >
              {(tape.length > 0 ? tape : selectedChest.items).map((item, idx) => {
                const rarity = RARITY_DEFINITIONS[item.rarity] || RARITY_DEFINITIONS.milspec;
                const isTarget = phase === 'revealed' && idx === TARGET_INDEX;

                return (
                  <div
                    key={`${item.id}_${idx}`}
                    style={{
                      width: `${CARD_WIDTH}px`,
                      borderColor: rarity.color,
                    }}
                    className={`h-40 rounded-xl bg-gradient-to-b from-[#1e150e] to-[#100a06] border-2 flex flex-col justify-between p-2.5 relative flex-shrink-0 transition-all ${
                      isTarget
                        ? `ring-4 ring-[#ffd700] scale-105 ${rarity.glowClass}`
                        : 'opacity-90'
                    }`}
                  >
                    {/* Top Type Badge */}
                    <div className="flex items-center justify-between text-[9px] font-cinzel">
                      <span
                        style={{ color: rarity.color }}
                        className="font-black uppercase tracking-wider truncate"
                      >
                        {isRo ? rarity.nameRo : rarity.nameEn}
                      </span>
                      <span>{item.icon}</span>
                    </div>

                    {/* Center Artwork / Preview */}
                    <div className="flex-1 flex items-center justify-center my-1">
                      {item.type === 'diceSkin' && item.diceSkinKey ? (
                        <div className="transform scale-95 hover:scale-105 transition-transform">
                          <DieFace value={6} skin={item.diceSkinKey} size="sm" />
                        </div>
                      ) : item.type === 'avatar' && item.avatarKey ? (
                        <div className="transform scale-95 shadow-md rounded-2xl overflow-hidden border border-white/20">
                          <AvatarDisplay avatarId={item.avatarKey} className="w-12 h-12" />
                        </div>
                      ) : (
                        <div
                          style={{
                            background: item.previewGradient
                              ? undefined
                              : `radial-gradient(circle, ${rarity.color}33 0%, transparent 70%)`,
                          }}
                          className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md border border-white/10 ${
                            item.previewGradient ? `bg-gradient-to-br ${item.previewGradient}` : ''
                          }`}
                        >
                          <span>{item.icon}</span>
                        </div>
                      )}
                    </div>

                    {/* Item Name */}
                    <div className="text-center">
                      <div className="text-[11px] font-cinzel font-bold text-white leading-tight truncate">
                        {item.name}
                      </div>
                    </div>

                    {/* CS Rarity Bottom Color Stripe */}
                    <div
                      style={{ backgroundColor: rarity.color }}
                      className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-lg shadow-[0_0_8px_currentColor]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skip Button (Visible during spin) */}
          {phase === 'spinning' && (
            <div className="absolute top-2 right-4 z-30">
              <button
                onClick={handleSkipAnimation}
                className="px-3 py-1 rounded-full bg-black/70 hover:bg-black border border-stone-600 hover:border-[#ffd700] text-xs font-cinzel text-gray-300 hover:text-[#ffd700] flex items-center gap-1.5 transition-all shadow-md"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{isRo ? 'Sari animația' : 'Skip spin'}</span>
              </button>
            </div>
          )}
        </div>

        {/* REVEAL CELEBRATION POPUP OVERLAY */}
        <AnimatePresence>
          {phase === 'revealed' && openResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="my-2 p-4 rounded-2xl bg-gradient-to-b from-[#24170c] via-[#1a0f07] to-[#0f0803] border-2 border-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.4)] text-center space-y-3 relative overflow-hidden"
            >
              {/* Golden Background Ray Glow */}
              <div
                style={{
                  background: `radial-gradient(circle, ${currentRarityMeta.color}40 0%, transparent 70%)`,
                }}
                className="absolute inset-0 pointer-events-none"
              />

              {/* Rarity & Item Name Header */}
              <div className="relative z-10 space-y-1.5">
                <div
                  style={{ color: currentRarityMeta.color }}
                  className="text-xs font-cinzel font-black tracking-widest uppercase flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isRo ? currentRarityMeta.nameRo : currentRarityMeta.nameEn}</span>
                  <Sparkles className="w-4 h-4" />
                </div>

                {/* Winning Item Visual Preview */}
                <div className="flex justify-center py-1">
                  {openResult.winningItem.type === 'diceSkin' && openResult.winningItem.diceSkinKey ? (
                    <div className="transform scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                      <DieFace value={6} skin={openResult.winningItem.diceSkinKey} size="md" />
                    </div>
                  ) : openResult.winningItem.type === 'avatar' && openResult.winningItem.avatarKey ? (
                    <div className="transform scale-110 shadow-2xl rounded-2xl overflow-hidden border-2 border-[#ffd700] ring-4 ring-[#ffd700]/30">
                      <AvatarDisplay avatarId={openResult.winningItem.avatarKey} className="w-16 h-16" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-black/60 border border-[#ffd700]/50 flex items-center justify-center text-4xl shadow-xl">
                      {openResult.winningItem.icon}
                    </div>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-cinzel font-black text-white">
                  {openResult.winningItem.name}
                </h3>
                <p className="text-xs text-gray-300 font-barlow max-w-md mx-auto">
                  {isRo ? openResult.winningItem.descRo : openResult.winningItem.descEn}
                </p>
              </div>

              {/* Duplicate Item Refund Banner */}
              {openResult.isDuplicate && (
                <div className="relative z-10 bg-amber-950/80 border border-amber-500/60 rounded-xl px-4 py-2 text-xs text-amber-200 font-cinzel flex items-center justify-center gap-2 max-w-md mx-auto">
                  <span>♻️</span>
                  <span>
                    {isRo
                      ? `Obiect duplicat deținut deja! Ai primit o rambursare de +${openResult.refundAmount} 🪙!`
                      : `Duplicate item already owned! You received a refund of +${openResult.refundAmount} 🪙!`}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-1">
                {!openResult.isDuplicate && (
                  <button
                    onClick={handleEquipItem}
                    disabled={equippedSuccess}
                    className={`px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs uppercase transition-all flex items-center gap-2 shadow-lg ${
                      equippedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black hover:brightness-110'
                    }`}
                  >
                    {equippedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isRo ? 'Echipat cu succes!' : 'Equipped!'}</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>{isRo ? 'Echipează acum' : 'Equip now'}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleStartOpen}
                  className="px-5 py-2.5 rounded-xl bg-[#2e1c0c] hover:bg-[#422912] border-2 border-[#ffd700]/70 text-[#ffd700] font-cinzel font-bold text-xs uppercase transition-all flex items-center gap-2 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {isRo
                      ? `Deschide din nou (${selectedChest.cost} 🪙)`
                      : `Open again (${selectedChest.cost} 🪙)`}
                  </span>
                </button>

                <button
                  onClick={() => setPhase('idle')}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-cinzel text-xs uppercase transition-all"
                >
                  {isRo ? 'Vezi cufere' : 'Browse chests'}
                </button>

                <button
                  onClick={handleBackToStore}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-900/80 to-[#2c1708] hover:from-amber-800 hover:to-[#3e220d] border border-[#ffd700]/70 text-[#ffd700] hover:text-white font-cinzel font-bold text-xs uppercase transition-all flex items-center gap-1.5 shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isRo ? 'Înapoi la Magazin' : 'Back to Store'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-300 text-center font-cinzel my-2">
            {errorMsg}
          </div>
        )}

        {/* Footer: Drop Rates & Launch Button */}
        {phase === 'idle' && (
          <div className="border-t border-[#ffd700]/20 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* CS Rarity Chances Pill Bar */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-cinzel">
              <span className="text-gray-400 mr-1">{isRo ? 'Șanse:' : 'Odds:'}</span>
              {selectedChest.isHighTierOnly ? (
                <>
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500 text-purple-300 font-bold">
                    {isRo ? 'Clasificat' : 'Classified'}: 60%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500 text-red-400 font-bold">
                    {isRo ? 'Secret' : 'Covert'}: 30%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-yellow-950/80 border border-[#ffd700] text-[#ffd700] font-black shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                    {isRo ? '★ Rar Special ★' : '★ Rare Special ★'}: 10%
                  </span>
                </>
              ) : (
                Object.values(RARITY_DEFINITIONS).map((r) => (
                  <span
                    key={r.rarity}
                    style={{ color: r.color, borderColor: r.color }}
                    className="px-2 py-0.5 rounded-md bg-black/60 border font-bold"
                  >
                    {isRo ? r.nameRo : r.nameEn}: {r.dropChance}%
                  </span>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleBackToStore}
                className="px-4 py-3 rounded-2xl bg-[#1c1208] hover:bg-[#2c1b0c] border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white font-cinzel font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isRo ? 'Înapoi la Magazin' : 'Back to Store'}</span>
              </button>

              {/* Big Open Button */}
              <button
                onClick={handleStartOpen}
                className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black font-cinzel font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                <span>
                  {isRo
                    ? `Deschide Cufărul (${selectedChest.cost} 🪙)`
                    : `Open Chest (${selectedChest.cost} 🪙)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
