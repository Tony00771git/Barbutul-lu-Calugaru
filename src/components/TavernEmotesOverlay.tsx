import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TavernEmoteMessage, TavernEmoteDef } from '../types';
import { TAVERN_EMOTES_LIST } from '../data/shopCatalog';
import { useApp } from '../context/AppContext';
import { soundEffects } from '../lib/soundFx';

interface TavernEmotesOverlayProps {
  lastEmote?: TavernEmoteMessage | null;
  onSendEmote: (emote: TavernEmoteMessage) => Promise<void> | void;
  localPlayer: {
    id: string;
    name: string;
    avatarIcon?: string;
  };
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

interface ActiveFloatingBubble extends TavernEmoteMessage {
  instanceId: string;
}

export const TavernEmotesOverlay: React.FC<TavernEmotesOverlayProps> = ({
  lastEmote,
  onSendEmote,
  localPlayer,
  position = 'bottom-right',
}) => {
  const { language, isItemPurchased, drunkenCoins, purchaseShopItem } = useApp();
  const isRo = language === 'ro';

  const [isOpen, setIsOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [floatingBubbles, setFloatingBubbles] = useState<ActiveFloatingBubble[]>([]);
  const processedEmoteIds = useRef<Set<string>>(new Set());
  const lastProcessedEmoteTimestamp = useRef<number>(0);

  const displayEmoteBubble = (emote: TavernEmoteMessage) => {
    // Trigger matching sound effect
    const matchedDef = TAVERN_EMOTES_LIST.find((e) => e.key === emote.emoteKey);
    if (matchedDef) {
      soundEffects.playEmote(matchedDef.soundType);
    } else {
      soundEffects.playEmote('cheers');
    }

    // Add floating visual bubble
    const newBubble: ActiveFloatingBubble = {
      ...emote,
      instanceId: `bubble_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    setFloatingBubbles((prev) => [...prev.slice(-3), newBubble]);

    // Auto-remove after 4.2 seconds
    setTimeout(() => {
      setFloatingBubbles((prev) => prev.filter((b) => b.instanceId !== newBubble.instanceId));
    }, 4200);
  };

  // Process incoming emotes from opponents or room updates
  useEffect(() => {
    if (!lastEmote || !lastEmote.timestamp) return;

    // Deduplicate by emote unique ID or timestamp
    if (lastEmote.id && processedEmoteIds.current.has(lastEmote.id)) return;
    if (lastEmote.timestamp <= lastProcessedEmoteTimestamp.current) return;

    if (lastEmote.id) {
      processedEmoteIds.current.add(lastEmote.id);
    }
    lastProcessedEmoteTimestamp.current = lastEmote.timestamp;

    displayEmoteBubble(lastEmote);
  }, [lastEmote]);

  const handleSelectEmote = async (def: TavernEmoteDef) => {
    const isUnlocked = isItemPurchased(def.id) || isItemPurchased(def.key);

    if (!isUnlocked) {
      if (drunkenCoins >= def.cost) {
        const success = purchaseShopItem(def.id, def.cost);
        if (!success) return;
      } else {
        alert(
          isRo
            ? `Ai nevoie de ${def.cost} 🪙 pentru a debloca acest emoticon din Bazar!`
            : `You need ${def.cost} 🪙 to unlock this emote from the Monastic Bazaar!`
        );
        return;
      }
    }

    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1500);

    const emoteId = `em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const emoteMsg: TavernEmoteMessage = {
      id: emoteId,
      senderId: localPlayer.id || 'player',
      senderName: localPlayer.name || (isRo ? 'Călugăr' : 'Monk'),
      senderAvatar: localPlayer.avatarIcon || '🍺',
      emoteKey: def.key,
      textRo: def.nameRo,
      textEn: def.nameEn,
      icon: def.icon,
      timestamp: Date.now(),
    };

    // Optimistically record and display locally for instant feedback
    processedEmoteIds.current.add(emoteId);
    lastProcessedEmoteTimestamp.current = emoteMsg.timestamp;
    displayEmoteBubble(emoteMsg);
    setIsOpen(false);

    // Broadcast across Firestore room to all opponents
    try {
      await onSendEmote(emoteMsg);
    } catch (err) {
      console.warn('[Emotes] Error broadcasting emote to opponents:', err);
    }
  };

  const posClasses =
    position === 'bottom-left'
      ? 'bottom-4 left-4'
      : position === 'bottom-center'
      ? 'bottom-4 left-1/2 -translate-x-1/2'
      : 'bottom-4 right-4';

  return (
    <>
      {/* 1. Floating Screen Reaction Popups */}
      <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden flex flex-col justify-end items-center sm:items-end p-4 pb-20 gap-2">
        <AnimatePresence>
          {floatingBubbles.map((bubble) => (
            <motion.div
              key={bubble.instanceId}
              initial={{ opacity: 0, y: 35, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -45, scale: 0.9 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-gradient-to-r from-[#20140b]/95 via-[#150d07]/95 to-[#20140b]/95 border-2 border-[#ffd700] rounded-2xl px-4 py-2.5 shadow-[0_0_25px_rgba(255,215,0,0.35)] flex items-center gap-3 text-amber-100 max-w-sm backdrop-blur-md"
            >
              <div className="text-2xl sm:text-3xl animate-bounce flex-shrink-0">
                {bubble.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-cinzel font-bold text-amber-400/90 truncate flex items-center gap-1">
                  <span>👤</span>
                  <span>{bubble.senderName}:</span>
                </div>
                <div className="text-xs sm:text-sm font-cinzel font-black text-[#ffd700] gold-text-glow leading-snug">
                  {isRo ? bubble.textRo : bubble.textEn}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. Emote Toggle Floating Button & Tray */}
      <div className={`fixed z-[9980] ${posClasses}`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              className="mb-2 w-72 sm:w-80 bg-gradient-to-b from-[#21160d] to-[#120b06] border-2 border-[#ffd700] rounded-2xl p-3 shadow-[0_0_30px_rgba(255,215,0,0.3)] backdrop-blur-md text-amber-100"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-900/50">
                <span className="font-cinzel font-bold text-xs text-[#ffd700] flex items-center gap-1.5">
                  <span>🍻</span>
                  <span>{isRo ? 'Reacții Rapide de Tavernă' : 'Tavern Quick Emotes'}</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">
                  {drunkenCoins} 🪙
                </span>
              </div>

              <div className="space-y-1.5">
                {TAVERN_EMOTES_LIST.map((emote) => {
                  const isUnlocked = isItemPurchased(emote.id) || isItemPurchased(emote.key);
                  const canAfford = drunkenCoins >= emote.cost;

                  return (
                    <button
                      key={emote.id}
                      type="button"
                      onClick={() => handleSelectEmote(emote)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all active:scale-95 ${
                        isUnlocked
                          ? 'bg-[#180f08] hover:bg-[#2e1c0d] border border-amber-800/60 hover:border-[#ffd700]'
                          : 'bg-[#120804] border border-stone-800 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <span className="text-xl flex-shrink-0">{emote.icon}</span>
                        <div className="min-w-0">
                          <div className="font-cinzel font-bold text-xs text-[#ffd700] truncate">
                            {isRo ? emote.nameRo : emote.nameEn}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate font-barlow">
                            {isRo ? emote.descRo : emote.descEn}
                          </div>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 flex-shrink-0">
                          {isRo ? 'Trimite ➔' : 'Send ➔'}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ${
                            canAfford
                              ? 'bg-amber-950 border border-amber-500/60 text-amber-300'
                              : 'bg-stone-900 border border-stone-700 text-stone-400'
                          }`}
                        >
                          <span>🔒</span>
                          <span>{emote.cost}</span>
                          <span>🪙</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Reaction Launcher Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-black border-2 border-yellow-200 font-cinzel font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center gap-1.5 transition-all active:scale-95 group"
          title={isRo ? 'Deschide Reacții Rapide' : 'Open Quick Reactions'}
        >
          <span className="text-base sm:text-lg group-hover:rotate-12 transition-transform">
            💬🍻
          </span>
          <span className="hidden sm:inline">
            {isRo ? 'Reacții Rapide' : 'Quick Emotes'}
          </span>
          {cooldown && <span className="text-[10px] animate-pulse">⏳</span>}
        </button>
      </div>
    </>
  );
};
