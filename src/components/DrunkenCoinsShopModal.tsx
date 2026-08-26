import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SHOP_CATALOG, TAVERN_EMOTES_LIST } from '../data/shopCatalog';
import { CHESTS_CATALOG, RARITY_DEFINITIONS } from '../data/chestsCatalog';
import { DiceSkin, ThemeId } from '../types';
import { soundEffects } from '../lib/soundFx';
import { ChestOpeningModal } from './ChestOpeningModal';
import { Sparkles, Gift } from 'lucide-react';

interface DrunkenCoinsShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chests' | 'dice' | 'themes' | 'perks' | 'titles' | 'emotes' | 'ideas';
}

export const DrunkenCoinsShopModal: React.FC<DrunkenCoinsShopModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chests',
}) => {
  const {
    drunkenCoins,
    language,
    purchaseShopItem,
    isItemPurchased,
    diceSkin,
    setDiceSkin,
    theme,
    setTheme,
    equipCustomTitle,
    masterProfile,
  } = useApp();

  const isRo = language === 'ro';

  const [activeTab, setActiveTab] = useState<'chests' | 'dice' | 'themes' | 'perks' | 'titles' | 'emotes' | 'ideas'>(initialTab);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [openingChestId, setOpeningChestId] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleBuy = (
    itemId: string,
    cost: number,
    name: string,
    onSuccessAction?: () => void
  ) => {
    if (isItemPurchased(itemId)) {
      if (onSuccessAction) onSuccessAction();
      showToast(
        isRo
          ? `✅ Deja deții ${name}! A fost echipat cu succes.`
          : `✅ You already own ${name}! Equipped successfully.`,
        'success'
      );
      return;
    }

    if (drunkenCoins < cost) {
      showToast(
        isRo
          ? `❌ Fonduri insuficiente în Tezaur! Ai nevoie de ${cost} 🍺🪙 (ai doar ${drunkenCoins} 🍺🪙). Joacă mai multe meciuri sau revendică misiunile zilnice!`
          : `❌ Not enough coins in Treasury! You need ${cost} 🍺🪙 (you have ${drunkenCoins} 🍺🪙). Play more games or complete daily quests!`,
        'error'
      );
      return;
    }

    const success = purchaseShopItem(itemId, cost, onSuccessAction);
    if (success) {
      showToast(
        isRo
          ? `🎉 Ai cumpărat și deblocat permanent: ${name} (-${cost} 🍺🪙)!`
          : `🎉 Successfully purchased and permanently unlocked: ${name} (-${cost} 🍺🪙)!`,
        'success'
      );
    }
  };

  // Filter items by category
  const diceItems = SHOP_CATALOG.filter((i) => i.category === 'dice');
  const themeItems = SHOP_CATALOG.filter((i) => i.category === 'themes');
  const perkItems = SHOP_CATALOG.filter((i) => i.category === 'perks');
  const titleItems = SHOP_CATALOG.filter((i) => i.category === 'titles');
  const emoteItems = SHOP_CATALOG.filter((i) => i.category === 'emotes');

  const ownedDiceCount = diceItems.filter((i) => isItemPurchased(i.id) || isItemPurchased(i.key)).length;
  const ownedThemeCount = themeItems.filter((i) => isItemPurchased(i.id) || isItemPurchased(i.key)).length;
  const ownedPerkCount = perkItems.filter((i) => isItemPurchased(i.id) || isItemPurchased(i.key)).length;
  const ownedTitleCount = titleItems.filter((i) => isItemPurchased(i.id) || isItemPurchased(i.key)).length;
  const ownedEmoteCount = emoteItems.filter((i) => isItemPurchased(i.id) || isItemPurchased(i.key)).length;

  return (
    <div
      id="drunken-coins-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 99999 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        id="drunken-coins-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#1e150d] via-[#150f09] to-[#0c0805] border-2 border-[#ffd700] rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(255,215,0,0.4)] text-[#f0ebe0] max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-[#ffd700]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Header with Title, Drunken Coins Balance & Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2114] relative z-10 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-700 to-yellow-500 flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-yellow-200 flex-shrink-0">
              🍺🪙
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-cinzel font-black text-[#ffd700] gold-text-glow truncate">
                {isRo ? 'Bazarul Călugăresc & Tezaur' : 'Monastic Bazaar & Treasury'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-amber-200/70 font-barlow truncate">
                {isRo ? 'Elementele cumpărate se deblochează permanent pe contul tău!' : 'Purchased items are permanently unlocked on your account!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Balance Pill */}
            <div className="bg-[#24170c] border border-[#ffd700] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 shadow-md">
              <span className="text-[10px] sm:text-xs font-cinzel text-amber-300/80 hidden sm:inline">
                {isRo ? 'Tezaur Total:' : 'Treasury:'}
              </span>
              <span className="text-sm sm:text-base font-cinzel font-black text-[#ffd700] gold-text-glow flex items-center gap-1">
                <span>🍺🪙</span>
                <span>{drunkenCoins.toLocaleString()}</span>
              </span>
            </div>

            {/* Quick Header Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2a1b0e] hover:bg-[#3d2714] border border-[#ffd700]/50 hover:border-[#ffd700] text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-all active:scale-95 shadow"
              title={isRo ? 'Închide' : 'Close'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {feedbackMsg && (
          <div
            className={`my-2 p-2.5 rounded-xl text-xs font-cinzel font-bold text-center animate-fade-in relative z-20 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/95 border border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-red-950/95 border border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 my-2.5 relative z-10 text-xs font-cinzel flex-shrink-0">
          <button
            onClick={() => setActiveTab('chests')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'chests'
                ? 'bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)] font-black animate-pulse'
                : 'bg-[#1f1307] border border-amber-500/50 text-amber-300 hover:text-white'
            }`}
          >
            <span>🎁</span>
            <span>{isRo ? 'Cufere (CS Open)' : 'Chests (Case Open)'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold">★ CS</span>
          </button>

          <button
            onClick={() => setActiveTab('dice')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'dice'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>🎲</span>
            <span>{isRo ? 'Zaruri & FX' : 'Dice & FX'}</span>
            <span className="text-[10px] opacity-75 font-normal">({ownedDiceCount}/{diceItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'themes'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>🏰</span>
            <span>{isRo ? 'Atmosfere & Tematici' : 'Tavern Themes'}</span>
            <span className="text-[10px] opacity-75 font-normal">({ownedThemeCount}/{themeItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('perks')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'perks'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>{isRo ? 'Relicve & Puteri' : 'Relics & Perks'}</span>
            <span className="text-[10px] opacity-75 font-normal">({ownedPerkCount}/{perkItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('titles')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'titles'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>👑</span>
            <span>{isRo ? 'Titluri Exclusiviste' : 'Exclusive Titles'}</span>
            <span className="text-[10px] opacity-75 font-normal">({ownedTitleCount}/{titleItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('emotes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'emotes'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>🍻</span>
            <span>{isRo ? 'Reacții & Emoticoane' : 'Tavern Emotes'}</span>
            <span className="text-[10px] opacity-75 font-normal">({ownedEmoteCount}/{emoteItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ideas'
                ? 'bg-amber-600 text-white shadow-lg font-black'
                : 'bg-[#18110a] border border-amber-800/40 text-amber-300 hover:text-amber-200'
            }`}
          >
            <span>💡</span>
            <span>{isRo ? 'Idei & Propuneri' : 'Roadmap & Ideas'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10 py-1">
          {/* TAB 0: CS-STYLE CHESTS */}
          {activeTab === 'chests' && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="p-3.5 bg-gradient-to-r from-[#2c1b0c] via-[#1a1007] to-[#120803] border-2 border-[#ffd700]/50 rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(255,215,0,0.15)]">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎁</span>
                  <div>
                    <h3 className="font-cinzel font-black text-sm text-[#ffd700] flex items-center gap-2">
                      <span>{isRo ? 'Deschideri de Cufere CS-Style' : 'CS-Style Case Openings'}</span>
                      <span className="px-2 py-0.5 rounded bg-red-600/80 text-white text-[9px] font-mono font-bold">
                        5 RARITĂȚI
                      </span>
                    </h3>
                    <p className="text-xs text-gray-300 font-barlow">
                      {isRo
                        ? 'Plătești bănuți 🍺🪙, învârți ruleta CS și câștigi cosmetice exclusive!'
                        : 'Spend coins 🍺🪙, spin the CS roulette tape and win exclusive cosmetics!'}
                    </p>
                  </div>
                </div>

                {/* CS Rarity Legend Pill */}
                <div className="hidden sm:flex flex-col items-end gap-1 text-[10px] font-cinzel">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4b69ff]" />
                    <span className="text-gray-400">Mil-Spec (45%)</span>
                    <span className="w-2 h-2 rounded-full bg-[#8847ff] ml-1" />
                    <span className="text-gray-400">Restricted (28%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#d32ce6]" />
                    <span className="text-gray-400">Classified (16%)</span>
                    <span className="w-2 h-2 rounded-full bg-[#eb4b4b] ml-1" />
                    <span className="text-gray-400">Covert (8%)</span>
                    <span className="w-2 h-2 rounded-full bg-[#ffd700] ml-1" />
                    <span className="text-[#ffd700] font-bold">★ Rare (3%)</span>
                  </div>
                </div>
              </div>

              {/* Chest Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CHESTS_CATALOG.map((chest) => (
                  <div
                    key={chest.id}
                    className="p-4 rounded-2xl bg-gradient-to-b from-[#20150c] via-[#150e08] to-[#0c0704] border border-[#ffd700]/40 hover:border-[#ffd700] flex flex-col justify-between gap-3 transition-all hover:scale-[1.02] shadow-lg group relative overflow-hidden"
                  >
                    {/* Top Chest Visual & Badge */}
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2e1c0d] border border-amber-500/40 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                        {chest.icon}
                      </div>

                      <div>
                        <h4 className="font-cinzel font-black text-sm text-[#ffd700]">
                          {isRo ? chest.nameRo : chest.nameEn}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-barlow mt-0.5 line-clamp-2">
                          {isRo ? chest.descRo : chest.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Contained Items Preview Strip */}
                    <div className="bg-black/50 p-2 rounded-xl border border-stone-800 space-y-1">
                      <div className="text-[9px] font-cinzel text-gray-400 uppercase tracking-wider text-center">
                        {isRo ? 'Conține cosmetice posibile:' : 'Contains possible drops:'}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 overflow-hidden">
                        {chest.items.slice(0, 5).map((item, idx) => {
                          const r = RARITY_DEFINITIONS[item.rarity];
                          return (
                            <div
                              key={idx}
                              style={{ borderColor: r.color }}
                              className="w-7 h-7 rounded-lg bg-stone-900 border flex items-center justify-center text-sm"
                              title={`${item.name} (${r.nameRo})`}
                            >
                              <span>{item.icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Open Chest Button */}
                    <button
                      type="button"
                      onClick={() => setOpeningChestId(chest.id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black font-cinzel font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,215,0,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-4 h-4" />
                      <span>{isRo ? 'Deschide' : 'Open'} ({chest.cost} 🍺🪙)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: DICE & FX */}
          {activeTab === 'dice' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {diceItems.map((item) => {
                const isOwned = isItemPurchased(item.id) || isItemPurchased(item.key);
                const isEquipped = diceSkin === (item.diceSkinKey || item.key);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                      isEquipped
                        ? 'bg-[#22180e] border-2 border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.25)]'
                        : isOwned
                        ? 'bg-[#150f09] border border-stone-800'
                        : 'bg-[#120a06] border border-amber-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-[#2a1e0f] border border-stone-700 flex items-center justify-center text-xl flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-cinzel font-bold text-xs text-[#ffd700] truncate">
                          {isRo ? item.nameRo : item.nameEn}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {isRo ? item.descRo : item.descEn}
                        </div>
                      </div>
                    </div>

                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.diceSkinKey) {
                            setDiceSkin(item.diceSkinKey as DiceSkin);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold flex-shrink-0 transition-all active:scale-95 ${
                          isEquipped
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/40 hover:bg-[#342212]'
                        }`}
                      >
                        {isEquipped ? (isRo ? 'Echipat ✅' : 'Equipped ✅') : (isRo ? 'Echipează' : 'Equip')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBuy(
                            item.id,
                            item.cost,
                            isRo ? item.nameRo : item.nameEn,
                            () => {
                              if (item.diceSkinKey) {
                                setDiceSkin(item.diceSkinKey as DiceSkin);
                              }
                            }
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95 flex-shrink-0 flex items-center gap-1"
                      >
                        <span>{item.cost}</span>
                        <span>🍺🪙</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: THEMES */}
          {activeTab === 'themes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themeItems.map((item) => {
                const isOwned = isItemPurchased(item.id) || isItemPurchased(item.key);
                const isEquipped = theme === (item.themeKey || item.key);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                      isEquipped
                        ? 'bg-[#22180e] border-2 border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.25)]'
                        : isOwned
                        ? 'bg-[#150f09] border border-stone-800'
                        : 'bg-[#120a06] border border-amber-900/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-cinzel font-bold text-xs text-[#ffd700] flex items-center gap-1.5 truncate">
                        <span>{item.icon}</span>
                        <span className="truncate">{isRo ? item.nameRo : item.nameEn}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {isRo ? item.descRo : item.descEn}
                      </div>
                    </div>

                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.themeKey) {
                            setTheme(item.themeKey as ThemeId);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold flex-shrink-0 transition-all active:scale-95 ${
                          isEquipped
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/40 hover:bg-[#342212]'
                        }`}
                      >
                        {isEquipped ? (isRo ? 'Activ ✅' : 'Active ✅') : (isRo ? 'Selectează' : 'Select')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBuy(
                            item.id,
                            item.cost,
                            isRo ? item.nameRo : item.nameEn,
                            () => {
                              if (item.themeKey) {
                                setTheme(item.themeKey as ThemeId);
                              }
                            }
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95 flex-shrink-0 flex items-center gap-1"
                      >
                        <span>{item.cost}</span>
                        <span>🍺🪙</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: RELICS & BOARDGAME PERKS */}
          {activeTab === 'perks' && (
            <div className="space-y-2.5">
              {perkItems.map((item) => {
                const isOwned = isItemPurchased(item.id) || isItemPurchased(item.key);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                      isOwned
                        ? 'bg-gradient-to-r from-[#17261a] to-[#0f1711] border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-gradient-to-r from-[#20150c] to-[#140e08] border border-[#ffd700]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-2xl flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-cinzel font-bold text-sm text-[#ffd700]">
                          {isRo ? item.nameRo : item.nameEn}
                        </div>
                        <div className="text-xs text-gray-300 leading-snug">
                          {isRo ? item.descRo : item.descEn}
                        </div>
                      </div>
                    </div>

                    {isOwned ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-900/80 border border-emerald-400 text-emerald-200 text-xs font-cinzel font-bold flex-shrink-0 flex items-center gap-1">
                        <span>Deținut & Activ ✅</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBuy(item.id, item.cost, isRo ? item.nameRo : item.nameEn)
                        }
                        className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95 flex-shrink-0 flex items-center gap-1"
                      >
                        <span>{item.cost}</span>
                        <span>🍺🪙</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: EXCLUSIVE TITLES & HERALDRY */}
          {activeTab === 'titles' && (
            <div className="space-y-2.5">
              {titleItems.map((item) => {
                const isOwned = isItemPurchased(item.id) || isItemPurchased(item.key);
                const isEquippedOnProfile = masterProfile?.currentTitle_ro === item.nameRo;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                      isEquippedOnProfile
                        ? 'bg-gradient-to-r from-[#2a1d0f] to-[#1a1209] border-2 border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                        : isOwned
                        ? 'bg-[#150f09] border border-amber-800/60'
                        : 'bg-gradient-to-r from-[#25150a] to-[#140b05] border border-amber-500/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-cinzel font-bold text-sm text-[#ffd700] flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span className="truncate">{isRo ? item.nameRo : item.nameEn}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {isRo ? item.descRo : item.descEn}
                      </div>
                    </div>

                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() =>
                          equipCustomTitle(item.id, item.nameRo, item.nameEn, masterProfile?.id)
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold flex-shrink-0 transition-all active:scale-95 ${
                          isEquippedOnProfile
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/40 hover:bg-[#342212]'
                        }`}
                      >
                        {isEquippedOnProfile
                          ? (isRo ? 'Echipat pe Profil ✅' : 'Equipped on Profile ✅')
                          : (isRo ? 'Aplică pe Profil' : 'Apply to Profile')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBuy(
                            item.id,
                            item.cost,
                            isRo ? item.nameRo : item.nameEn,
                            () =>
                              equipCustomTitle(item.id, item.nameRo, item.nameEn, masterProfile?.id)
                          )
                        }
                        className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95 flex-shrink-0 flex items-center gap-1"
                      >
                        <span>{item.cost}</span>
                        <span>🍺🪙</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: TAVERN QUICK EMOTES */}
          {activeTab === 'emotes' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#170e08] border border-amber-800/40 rounded-2xl text-xs text-amber-200/90 font-barlow flex items-center gap-2">
                <span className="text-xl">💬</span>
                <span>
                  {isRo
                    ? 'Emoticoanele cumpărate pot fi trimise live în toate meciurile online (Duel, Pineapple, Craps, Crash) cu efecte audio de tavernă!'
                    : 'Purchased emotes can be broadcasted live in all online matches with tavern audio sound FX!'}
                </span>
              </div>

              {TAVERN_EMOTES_LIST.map((emote) => {
                const isOwned = isItemPurchased(emote.id) || isItemPurchased(emote.key);

                return (
                  <div
                    key={emote.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                      isOwned
                        ? 'bg-[#150f09] border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'bg-gradient-to-r from-[#201208] to-[#120a05] border border-amber-600/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-11 h-11 rounded-2xl bg-[#2b1b0e] border border-amber-700/60 flex items-center justify-center text-2xl flex-shrink-0">
                        {emote.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-cinzel font-black text-sm text-[#ffd700] flex items-center gap-2">
                          <span>{isRo ? emote.nameRo : emote.nameEn}</span>
                          <button
                            type="button"
                            onClick={() => soundEffects.playEmote(emote.soundType)}
                            className="text-xs px-2 py-0.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-300 active:scale-95 transition-all"
                            title={isRo ? 'Ascultă sunetul' : 'Test Sound'}
                          >
                            🔊 {isRo ? 'Ascultă' : 'Test'}
                          </button>
                        </div>
                        <div className="text-xs text-gray-300 font-barlow mt-0.5">
                          {isRo ? emote.descRo : emote.descEn}
                        </div>
                      </div>
                    </div>

                    {isOwned ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-cinzel font-bold flex-shrink-0 flex items-center gap-1">
                        <span>Deblocat ✅</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBuy(emote.id, emote.cost, isRo ? emote.nameRo : emote.nameEn)
                        }
                        className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95 flex-shrink-0 flex items-center gap-1"
                      >
                        <span>{emote.cost}</span>
                        <span>🍺🪙</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: ROADMAP & IDEAS */}
          {activeTab === 'ideas' && (
            <div className="space-y-3">
              <div className="p-4 bg-[#140e08] border border-amber-600/40 rounded-2xl space-y-2">
                <h3 className="font-cinzel font-black text-sm text-[#ffd700] flex items-center gap-2">
                  <span>💡</span> {isRo ? 'Ce urmează să poți cumpăra cu Bănuții Turmentați:' : 'Upcoming Drunken Coins Features:'}
                </h3>
                <ul className="space-y-2 text-xs text-stone-300 font-barlow">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">1. 🎭 Rame de Avatar & Accesorii Monastice:</span>
                    <span>Aureole radiante, coifuri de cavaler, căni de bere aburinde pe avatar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">2. 🔊 Pachete de Voci & Reacții Medievale:</span>
                    <span>Strigăte audio în limba română la „Groapă”, „Rai 1-1” și dueluri câștigate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">3. 🍻 Minijoc de Berărie (Tavern Idle Brewing):</span>
                    <span>Investește bănuții în butoaie de bere care produc XP pasiv în timp!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">4. 📜 Scenarii & Cărți de Taină Custom:</span>
                    <span>Pachete suplimentare de întrebări de cultură generală și fotbal pentru Duel 1v1.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-3 border-t border-[#2e2114] flex justify-end relative z-10 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-600 via-[#ffd700] to-amber-600 text-black font-cinzel font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {isRo ? 'Închide Bazarul ➔' : 'Close Bazaar ➔'}
          </button>
        </div>
      </div>

      {/* CS Case Opening Modal */}
      {openingChestId && (
        <ChestOpeningModal
          isOpen={Boolean(openingChestId)}
          onClose={() => setOpeningChestId(null)}
          initialChestId={openingChestId}
        />
      )}
    </div>
  );
};
