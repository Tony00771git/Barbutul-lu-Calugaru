import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Profile } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { SHOP_CATALOG } from '../data/shopCatalog';
import { ALL_CHEST_COSMETICS, RARITY_DEFINITIONS } from '../data/chestsCatalog';
import { MEDIEVAL_AVATARS } from '../data/avatars';
import { soundEffects } from '../lib/soundFx';
import { getResolvedProfileShowcase } from '../lib/showcaseHelper';
import { Flame, Trophy, Beer, Sparkles, Plus, X, Award, Shield, Check } from 'lucide-react';

interface TrophyShowcaseProps {
  profile: Profile;
  isEditable?: boolean;
  onOpenShop?: () => void;
}

export const TrophyShowcase: React.FC<TrophyShowcaseProps> = ({
  profile,
  isEditable = true,
  onOpenShop,
}) => {
  const { language, updateProfileShowcase, purchasedItems, isItemPurchased } = useApp();
  const isRo = language === 'ro';

  const [showItemPicker, setShowItemPicker] = useState<number | null>(null); // slot index (0, 1, 2)

  // Records & Big Stats
  const highestCrashMult = profile.highestCrashMultiplier || 0;
  const highestStreak = profile.highestWinStreak || 0;
  const drinksServed = profile.totalDrinksServedToFriends || (profile.totalSips + profile.totalChugs * 10);
  const totalWins =
    (profile.winsBoardgame || 0) +
    (profile.winsDuel || 0) +
    (profile.winsCasino || 0) +
    (profile.winsPineapple || 0) +
    (profile.winsCrash || 0);

  // Showcase items: when editable (own profile), use user's owned items; when viewing a friend, strictly use friend's own showcased items or avatar
  const resolvedShowcasedIds = isEditable
    ? getResolvedProfileShowcase(
        profile.showcasedItemIds,
        purchasedItems,
        isRo ? 'ro' : 'en'
      )
    : (profile.showcasedItemIds && profile.showcasedItemIds.length > 0
        ? profile.showcasedItemIds.slice(0, 3)
        : (profile.avatarIcon ? [profile.avatarIcon] : []));

  const slot0Id = resolvedShowcasedIds[0] || null;
  const slot1Id = resolvedShowcasedIds[1] || null;
  const slot2Id = resolvedShowcasedIds[2] || null;

  // Resolve item details for a slot
  const getItemDetails = (itemId: string | null) => {
    if (!itemId) return null;

    // 1. Check in Chest Cosmetics
    const chestItem = ALL_CHEST_COSMETICS.find((c) => c.id === itemId || c.avatarKey === itemId);
    if (chestItem) {
      const rarityMeta = RARITY_DEFINITIONS[chestItem.rarity] || RARITY_DEFINITIONS.milspec;
      const avatarDef = chestItem.avatarKey ? MEDIEVAL_AVATARS.find((a) => a.id === chestItem.avatarKey) : null;
      return {
        id: chestItem.id,
        name: isRo ? chestItem.name : chestItem.nameEn,
        type: chestItem.type,
        rarity: chestItem.rarity,
        rarityName: isRo ? rarityMeta.nameRo : rarityMeta.nameEn,
        color: rarityMeta.color,
        borderClass: rarityMeta.borderClass,
        bgClass: rarityMeta.bgClass,
        glowClass: rarityMeta.glowClass,
        icon: chestItem.icon,
        avatarDef,
      };
    }

    // 2. Check in Shop Catalog
    const shopItem = SHOP_CATALOG.find((s) => s.id === itemId || s.key === itemId || s.avatarKey === itemId);
    if (shopItem) {
      const avatarDef = shopItem.avatarKey ? MEDIEVAL_AVATARS.find((a) => a.id === shopItem.avatarKey) : null;
      let rarity: any = 'restricted';
      if (shopItem.cost >= 600 || shopItem.id.includes('celestial') || shopItem.id.includes('archimandrite')) {
        rarity = 'rareSpecial';
      } else if (shopItem.cost >= 350) {
        rarity = 'classified';
      }
      const rarityMeta = RARITY_DEFINITIONS[rarity] || RARITY_DEFINITIONS.classified;

      return {
        id: shopItem.id,
        name: isRo ? shopItem.nameRo : shopItem.nameEn,
        type: shopItem.category,
        rarity,
        rarityName: isRo ? rarityMeta.nameRo : rarityMeta.nameEn,
        color: rarityMeta.color,
        borderClass: rarityMeta.borderClass,
        bgClass: rarityMeta.bgClass,
        glowClass: rarityMeta.glowClass,
        icon: shopItem.icon,
        avatarDef,
      };
    }

    // 3. Fallback Medieval Avatar
    const directAvatar = MEDIEVAL_AVATARS.find((a) => a.id === itemId);
    if (directAvatar) {
      return {
        id: directAvatar.id,
        name: isRo ? directAvatar.nameRo : directAvatar.nameEn,
        type: 'avatar',
        rarity: 'rareSpecial',
        rarityName: isRo ? '★ Avatar de Legendă ★' : '★ Legendary Avatar ★',
        color: '#ffd700',
        borderClass: 'border-[#ffd700]',
        bgClass: 'bg-[#ffd700]/20',
        glowClass: 'shadow-[0_0_25px_rgba(255,215,0,0.6)]',
        icon: '🧙‍♂️',
        avatarDef: directAvatar,
      };
    }

    return null;
  };

  const slotItems = [getItemDetails(slot0Id), getItemDetails(slot1Id), getItemDetails(slot2Id)];

  // All owned items eligible for showcase
  const getOwnedEligibleItems = () => {
    const list: Array<{
      id: string;
      name: string;
      category: string;
      rarity: string;
      color: string;
      icon: string;
      avatarDef?: any;
    }> = [];

    // All unlocked avatars
    MEDIEVAL_AVATARS.forEach((av) => {
      const shopItem = SHOP_CATALOG.find((s) => s.avatarKey === av.id);
      const isOwned = !shopItem || isItemPurchased(av.id) || isItemPurchased(shopItem.id);
      if (isOwned) {
        list.push({
          id: av.id,
          name: isRo ? av.nameRo : av.nameEn,
          category: isRo ? 'Avatar' : 'Avatar',
          rarity: 'rareSpecial',
          color: '#ffd700',
          icon: '🧙‍♂️',
          avatarDef: av,
        });
      }
    });

    // All purchased shop dice and themes
    SHOP_CATALOG.forEach((item) => {
      if (item.category !== 'avatars' && (isItemPurchased(item.id) || isItemPurchased(item.key))) {
        let rarity = 'classified';
        if (item.cost >= 500 || item.id.includes('celestial')) rarity = 'rareSpecial';
        const meta = (RARITY_DEFINITIONS as any)[rarity] || RARITY_DEFINITIONS.classified;

        list.push({
          id: item.id,
          name: isRo ? item.nameRo : item.nameEn,
          category: isRo ? (item.category === 'dice' ? 'Zar' : item.category === 'themes' ? 'Temă' : 'Titlu') : item.category,
          rarity,
          color: meta.color,
          icon: item.icon,
        });
      }
    });

    // Chest cosmetics
    ALL_CHEST_COSMETICS.forEach((item) => {
      if (isItemPurchased(item.id)) {
        if (!list.some((l) => l.id === item.id || (item.avatarKey && l.id === item.avatarKey))) {
          const meta = RARITY_DEFINITIONS[item.rarity] || RARITY_DEFINITIONS.milspec;
          const avDef = item.avatarKey ? MEDIEVAL_AVATARS.find((a) => a.id === item.avatarKey) : undefined;
          list.push({
            id: item.id,
            name: isRo ? item.name : item.nameEn,
            category: isRo ? 'Cufăr' : 'Chest Loot',
            rarity: item.rarity,
            color: meta.color,
            icon: item.icon,
            avatarDef: avDef,
          });
        }
      }
    });

    return list;
  };

  const handleSelectShowcaseItem = (itemId: string) => {
    if (showItemPicker === null) return;
    const current = [...resolvedShowcasedIds];
    while (current.length < 3) current.push('');
    current[showItemPicker] = itemId;
    // Filter non-empty unique
    const filtered = current.filter((x) => Boolean(x));
    updateProfileShowcase(profile.id, filtered);
    setShowItemPicker(null);
    soundEffects.playEquip();
  };

  const handleRemoveShowcaseSlot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = [...resolvedShowcasedIds];
    current.splice(slotIdx, 1);
    updateProfileShowcase(profile.id, current);
    soundEffects.playClick();
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#1c130a] via-[#140d07] to-[#0d0804] border-2 border-[#ffd700]/70 rounded-3xl p-3.5 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] space-y-4 text-left relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-amber-500/15 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#352414] pb-2.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 border border-[#ffd700] flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            <Trophy className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-cinzel font-black text-sm sm:text-base text-[#ffd700] gold-text-glow leading-tight flex items-center gap-1.5">
              <span>{isRo ? 'SALA TROFEELOR & RARITĂȚI' : 'TROPHY HALL & RARITIES'}</span>
              <span className="text-xs">🏛️</span>
            </h3>
            <p className="text-[10px] text-amber-200/80 font-barlow">
              {isRo
                ? 'Vitrina celor mai glorioase realizări, recorduri și obiecte rare deținute'
                : 'Display of your highest glory, tavern records and top 3 rarest treasures'}
            </p>
          </div>
        </div>

        {onOpenShop && (
          <button
            type="button"
            onClick={onOpenShop}
            className="px-2.5 py-1 rounded-xl bg-[#24170d] border border-[#ffd700]/50 hover:border-[#ffd700] text-amber-200 text-xs font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 shadow"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">{isRo ? 'Bazar' : 'Bazaar'}</span>
          </button>
        )}
      </div>

      {/* 4 Pillars of Glory: High Stakes Records Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
        {/* 1. Highest Crash Multiplier Record */}
        <div className="bg-gradient-to-b from-[#25150a] to-[#150c05] border border-amber-500/50 rounded-2xl p-2.5 flex flex-col justify-between shadow relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinzel font-bold text-amber-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
              <span>{isRo ? 'Crash Record' : 'Peak Multiplier'}</span>
            </span>
            <span className="text-[9px] bg-red-950/80 text-red-300 font-mono px-1 rounded border border-red-700/40">
              DRAGON
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="text-xl sm:text-2xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_0_12px_rgba(255,180,0,0.5)]">
              {highestCrashMult > 0 ? `${highestCrashMult.toFixed(2)}x` : '1.00x'}
            </span>
          </div>
          <div className="text-[9px] text-gray-400 font-barlow text-center truncate">
            {highestCrashMult >= 10
              ? (isRo ? '🔥 Legendă a Dragonului' : '🔥 Dragon Legend')
              : (isRo ? 'Multiplicator maxim prins' : 'Highest multiplier cashout')}
          </div>
        </div>

        {/* 2. Highest Win Streak Badge */}
        <div className="bg-gradient-to-b from-[#25150a] to-[#150c05] border border-amber-500/50 rounded-2xl p-2.5 flex flex-col justify-between shadow relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinzel font-bold text-amber-300 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              <span>{isRo ? 'Serie Victorii' : 'Win Streak'}</span>
            </span>
            <span className="text-[9px] bg-amber-950/80 text-amber-300 font-mono px-1 rounded border border-amber-700/40">
              STREAK
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="text-xl sm:text-2xl font-cinzel font-black text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
              {highestStreak} {isRo ? 'victorii' : 'wins'}
            </span>
          </div>
          <div className="text-[9px] text-gray-400 font-barlow text-center truncate">
            {isRo ? 'Cea mai lungă serie neînvins' : 'Peak consecutive match streak'}
          </div>
        </div>

        {/* 3. Beers & Sips Distributed */}
        <div className="bg-gradient-to-b from-[#25150a] to-[#150c05] border border-amber-500/50 rounded-2xl p-2.5 flex flex-col justify-between shadow relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinzel font-bold text-amber-300 flex items-center gap-1">
              <Beer className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRo ? 'Cinstiri la Masă' : 'Drinks Served'}</span>
            </span>
            <span className="text-[9px] bg-amber-950/80 text-amber-300 font-mono px-1 rounded border border-amber-700/40">
              TAVERN
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="text-xl sm:text-2xl font-cinzel font-black text-amber-200 drop-shadow">
              {drinksServed.toLocaleString()} 🍺
            </span>
          </div>
          <div className="text-[9px] text-gray-400 font-barlow text-center truncate">
            {isRo ? 'Beri & guri împărțite prietenilor' : 'Total sips & chugs shared'}
          </div>
        </div>

        {/* 4. Total Triumphs & Battles Won */}
        <div className="bg-gradient-to-b from-[#25150a] to-[#150c05] border border-amber-500/50 rounded-2xl p-2.5 flex flex-col justify-between shadow relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinzel font-bold text-amber-300 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRo ? 'Triumfuri Totale' : 'Total Triumphs'}</span>
            </span>
            <span className="text-[9px] bg-emerald-950/80 text-emerald-300 font-mono px-1 rounded border border-emerald-700/40">
              VICTOR
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="text-xl sm:text-2xl font-cinzel font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              {totalWins} 🏆
            </span>
          </div>
          <div className="text-[9px] text-gray-400 font-barlow text-center truncate">
            {isRo ? 'Meciuri câștigate în toate modurile' : 'Total victories across all modes'}
          </div>
        </div>
      </div>

      {/* Vitrina 3D: Top 3 Featured Rare Items / Avatars / Dice */}
      <div className="space-y-2 relative z-10 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#ffd700]">
            <Sparkles className="w-4 h-4 text-[#ffd700]" />
            <span>{isRo ? 'Vitrina de Rarități (Top 3 Cosmetice Expuse)' : 'Rarity Showcase (Top 3 Displayed Items)'}</span>
          </div>
          {isEditable && (
            <span className="text-[10px] text-gray-400 font-barlow">
              {isRo ? 'Apasă pe un piedestal pentru a expune un obiect' : 'Click a pedestal to showcase an item'}
            </span>
          )}
        </div>

        {/* 3 Pedestals Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const item = slotItems[slotIdx];
            const slotTitle =
              slotIdx === 0
                ? (isRo ? '🥇 Piedestalul Principal' : '🥇 Prime Pedestal')
                : slotIdx === 1
                ? (isRo ? '🥈 Piedestalul de Aur' : '🥈 Gold Pedestal')
                : (isRo ? '🥉 Piedestalul de Onoare' : '🥉 Honor Pedestal');

            return (
              <div
                key={slotIdx}
                onClick={() => {
                  if (isEditable) setShowItemPicker(slotIdx);
                }}
                className={`p-3 rounded-2xl border-2 transition-all relative flex flex-col justify-between min-h-[145px] select-none ${
                  item
                    ? `${item.bgClass} ${item.borderClass} ${item.glowClass} hover:brightness-110`
                    : 'bg-[#110a06] border-dashed border-amber-900/60 hover:border-amber-500/80 hover:bg-[#180f08]'
                } ${isEditable ? 'cursor-pointer' : ''}`}
              >
                {/* Pedestal Header */}
                <div className="flex items-center justify-between text-[10px] font-cinzel">
                  <span className="font-bold text-amber-300/90">{slotTitle}</span>
                  {item && isEditable && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveShowcaseSlot(slotIdx, e)}
                      className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-900 border border-white/20 text-gray-300 hover:text-white flex items-center justify-center text-xs transition-colors"
                      title={isRo ? 'Scoate din vitrină' : 'Remove from showcase'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Pedestal Body */}
                {item ? (
                  <div className="flex flex-col items-center justify-center my-2 text-center space-y-1.5">
                    {/* Item Icon / Avatar SVG */}
                    <div
                      className="w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center shadow-lg relative transform hover:scale-105 transition-transform"
                      style={{
                        borderColor: item.color,
                        backgroundColor: item.avatarDef?.bgColor || '#20150b',
                        boxShadow: `0 0 20px ${item.color}40`,
                      }}
                    >
                      {item.avatarDef ? (
                        item.avatarDef.renderSvg('w-full h-full p-1')
                      ) : (
                        <span className="text-3xl filter drop-shadow">{item.icon}</span>
                      )}
                    </div>

                    <div className="min-w-0 px-1">
                      <div
                        className="font-cinzel font-bold text-xs truncate max-w-[170px]"
                        style={{ color: item.color }}
                      >
                        {item.name}
                      </div>
                      <div className="text-[9px] font-cinzel uppercase tracking-wider text-gray-300">
                        {item.rarityName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center my-3 text-center space-y-1 text-gray-400">
                    <div className="w-12 h-12 rounded-2xl bg-[#1b1108] border border-dashed border-amber-600/40 flex items-center justify-center text-amber-500/70 text-xl shadow-inner">
                      <Plus className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-cinzel text-amber-400/80">
                      {isRo ? '+ Alege Obiect Rar' : '+ Add Rare Item'}
                    </span>
                  </div>
                )}

                {/* Pedestal Base Stone Look */}
                <div className="w-full pt-1 border-t border-black/40 flex items-center justify-center">
                  <div className="h-1.5 w-3/4 rounded-full bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Picker Modal */}
      {showItemPicker !== null && (
        <div
          onClick={() => setShowItemPicker(null)}
          className="fixed inset-0 z-[99995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-[#1c130b] via-[#140d07] to-[#0a0603] border-2 border-[#ffd700] rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(255,215,0,0.35)] space-y-3.5 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#352414] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#ffd700]">
                    {isRo ? 'Alege un obiect pentru Vitrină' : 'Select Item for Showcase'}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-barlow">
                    {isRo
                      ? `Slot #${showItemPicker + 1} • Toate avatarele, zarurile și cosmeticele deținute`
                      : `Slot #${showItemPicker + 1} • All owned avatars, dice & cosmetics`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPicker(null)}
                className="w-7 h-7 rounded-lg bg-[#22170d] border border-amber-600/40 text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Eligible Items Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 custom-scrollbar">
              {getOwnedEligibleItems().map((item) => {
                const isCurrent = resolvedShowcasedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectShowcaseItem(item.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all relative ${
                      isCurrent
                        ? 'bg-[#291b0d] border-[#ffd700] ring-1 ring-[#ffd700]'
                        : 'bg-[#120a05] border-stone-800 hover:border-amber-500/70 hover:bg-[#1a1008]'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    <div
                      className="w-11 h-11 rounded-xl overflow-hidden border flex items-center justify-center flex-shrink-0 shadow-inner"
                      style={{
                        borderColor: item.color,
                        backgroundColor: item.avatarDef?.bgColor || '#20150b',
                      }}
                    >
                      {item.avatarDef ? (
                        item.avatarDef.renderSvg('w-full h-full p-0.5')
                      ) : (
                        <span className="text-2xl">{item.icon}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-cinzel font-bold text-xs text-[#f0ebe0] truncate">
                        {item.name}
                      </div>
                      <div className="text-[9px] text-amber-400/80 font-cinzel truncate">
                        {item.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#352414] flex justify-end">
              <button
                type="button"
                onClick={() => setShowItemPicker(null)}
                className="px-4 py-1.5 rounded-xl bg-[#2a1d12] border border-[#ffd700]/40 text-gray-200 font-cinzel font-bold text-xs hover:bg-[#3d2a19]"
              >
                {isRo ? 'Închide' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
