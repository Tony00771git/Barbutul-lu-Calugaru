import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface DrunkenCoinsShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DrunkenCoinsShopModal: React.FC<DrunkenCoinsShopModalProps> = ({ isOpen, onClose }) => {
  const { drunkenCoins, language, spendDrunkenCoins, diceSkin, setDiceSkin, theme, setTheme } = useApp();
  const isRo = language === 'ro';

  const [activeTab, setActiveTab] = useState<'dice' | 'themes' | 'perks' | 'titles' | 'ideas'>('dice');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handlePurchase = (cost: number, itemName: string, onApply?: () => void) => {
    if (drunkenCoins < cost) {
      showToast(
        isRo
          ? `❌ Fonduri insuficiente în Tezaur! Ai nevoie de ${cost} 🍺🪙 (ai doar ${drunkenCoins} 🍺🪙). Joacă mai multe meciuri!`
          : `❌ Not enough coins in Treasury! You need ${cost} 🍺🪙 (you have ${drunkenCoins} 🍺🪙). Play more matches!`,
        'error'
      );
      return;
    }

    const success = spendDrunkenCoins(cost);
    if (success) {
      if (onApply) onApply();
      showToast(
        isRo
          ? `🎉 Ai cumpărat cu succes: ${itemName} (-${cost} 🍺🪙)!`
          : `🎉 Successfully purchased: ${itemName} (-${cost} 🍺🪙)!`,
        'success'
      );
    }
  };

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
                {isRo ? 'Tezaur global unificat pentru toate jocurile & profilurile' : 'Unified global treasury for all gamemodes & profiles'}
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
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
                : 'bg-red-950/90 border border-red-500 text-red-200'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 my-2.5 relative z-10 text-xs font-cinzel flex-shrink-0">
          <button
            onClick={() => setActiveTab('dice')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'dice'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>🎲</span> {isRo ? 'Zaruri & FX' : 'Dice & FX'}
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'themes'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>🏰</span> {isRo ? 'Atmosfere & Tematici' : 'Tavern Themes'}
          </button>
          <button
            onClick={() => setActiveTab('perks')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'perks'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>📜</span> {isRo ? 'Relicve & Puteri' : 'Relics & Perks'}
          </button>
          <button
            onClick={() => setActiveTab('titles')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'titles'
                ? 'bg-[#ffd700] text-black shadow-lg font-black'
                : 'bg-[#18110a] border border-[#2e2114] text-gray-300 hover:text-white'
            }`}
          >
            <span>👑</span> {isRo ? 'Titluri Exclusiviste' : 'Exclusive Titles'}
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'ideas'
                ? 'bg-amber-600 text-white shadow-lg font-black'
                : 'bg-[#18110a] border border-amber-800/40 text-amber-300 hover:text-amber-200'
            }`}
          >
            <span>💡</span> {isRo ? 'Idei & Propuneri' : 'Roadmap & Ideas'}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10 py-1">
          {/* TAB 1: DICE & FX */}
          {activeTab === 'dice' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Default Gold */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2a1e0f] border border-[#ffd700] flex items-center justify-center text-xl">
                    🎲
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-[#ffd700]">
                      {isRo ? 'Zaruri din Aur Monahal' : 'Monastic Gold Dice'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isRo ? 'Clasicul medieval din aur' : 'Classic medieval gold'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDiceSkin('gold')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    diceSkin === 'gold'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {diceSkin === 'gold' ? (isRo ? 'Echipat ✅' : 'Equipped ✅') : (isRo ? 'Echipează' : 'Equip')}
                </button>
              </div>

              {/* Bone */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#222] border border-slate-400 flex items-center justify-center text-xl">
                    🦴
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-slate-200">
                      {isRo ? 'Zaruri din Os Străvechi' : 'Ancient Bone Dice'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isRo ? 'Sculptate din relicve străvechi' : 'Carved from old relics'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDiceSkin('bone')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    diceSkin === 'bone'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {diceSkin === 'bone' ? (isRo ? 'Echipat ✅' : 'Equipped ✅') : (isRo ? 'Echipează' : 'Equip')}
                </button>
              </div>

              {/* Wood */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1e1309] border border-amber-700 flex items-center justify-center text-xl">
                    🪵
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-amber-300">
                      {isRo ? 'Zaruri din Lemn de Stejar' : 'Oak Wood Dice'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isRo ? 'Lemn binecuvântat de butoi' : 'Oak barrel wood'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDiceSkin('wood')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    diceSkin === 'wood'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {diceSkin === 'wood' ? (isRo ? 'Echipat ✅' : 'Equipped ✅') : (isRo ? 'Echipează' : 'Equip')}
                </button>
              </div>

              {/* Crimson Ruby */}
              <div className="p-3 bg-gradient-to-br from-[#2a0e0e] to-[#160808] border border-red-900/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-500 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                    💎
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-red-300">
                      {isRo ? 'Zaruri de Rubin Sângeriu' : 'Crimson Ruby Dice'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isRo ? 'Urme de scântei roșii la aruncare' : 'Red embers effect on roll'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(150, 'Zaruri de Rubin Sângeriu')}
                  className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-red-700 to-rose-600 text-white shadow hover:brightness-110 active:scale-95"
                >
                  150 🍺🪙
                </button>
              </div>

              {/* Frozen Ice */}
              <div className="p-3 bg-gradient-to-br from-[#0c1824] to-[#070e17] border border-cyan-900/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    ❄️
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-cyan-200">
                      {isRo ? 'Zaruri de Gheață Eternă' : 'Frozen Ice Dice'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isRo ? 'Aura de ger și cristale reci' : 'Frost trail & chill crystals'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(200, 'Zaruri de Gheață Eternă')}
                  className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-cyan-700 to-blue-600 text-white shadow hover:brightness-110 active:scale-95"
                >
                  200 🍺🪙
                </button>
              </div>

              {/* Obsidian Runes */}
              <div className="p-3 bg-gradient-to-br from-[#1c0e24] to-[#0f0714] border border-purple-900/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 border border-fuchsia-500 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(217,70,239,0.4)]">
                    🔮
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-xs text-fuchsia-200">
                      {isRo ? 'Zaruri de Obsidian & Rune' : 'Obsidian Runic Dice'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isRo ? 'Puncte gravate cu rune magice' : 'Glowing magic arcane glyphs'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(350, 'Zaruri de Obsidian & Rune')}
                  className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow hover:brightness-110 active:scale-95"
                >
                  350 🍺🪙
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: THEMES */}
          {activeTab === 'themes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tavern */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-xs text-[#ffd700]">
                    🍺 {isRo ? 'Taverna „La Butoiul de Aur”' : 'Golden Barrel Tavern'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {isRo ? 'Atmosferă caldă cu felinare și butoaie' : 'Warm lanterns & wooden barrels'}
                  </div>
                </div>
                <button
                  onClick={() => setTheme('tavern')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    theme === 'tavern'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {theme === 'tavern' ? (isRo ? 'Activ ✅' : 'Active ✅') : (isRo ? 'Selectează' : 'Select')}
                </button>
              </div>

              {/* Cellar */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-xs text-amber-300">
                    🕯️ {isRo ? 'Pivnița Secretă a Mănăstirii' : 'Secret Monastery Cellar'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {isRo ? 'Liniștea sfântă a butoaielor ascunse' : 'Ancient stone vaults & aged wine'}
                  </div>
                </div>
                <button
                  onClick={() => setTheme('cellar')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    theme === 'cellar'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {theme === 'cellar' ? (isRo ? 'Activ ✅' : 'Active ✅') : (isRo ? 'Selectează' : 'Select')}
                </button>
              </div>

              {/* Great Hall */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-xs text-yellow-200">
                    🏰 {isRo ? 'Sala Tronului Boieresc' : 'Noble Throne Hall'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {isRo ? 'Banchet nobil cu steaguri regale' : 'Grand banqueting hall & heraldry'}
                  </div>
                </div>
                <button
                  onClick={() => setTheme('great_hall')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    theme === 'great_hall'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {theme === 'great_hall' ? (isRo ? 'Activ ✅' : 'Active ✅') : (isRo ? 'Selectează' : 'Select')}
                </button>
              </div>

              {/* Dungeon */}
              <div className="p-3 bg-[#150f09] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-xs text-red-300">
                    ⛓️ {isRo ? 'Temnița Păcătoșilor' : 'Sinners Dungeon'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {isRo ? 'Lanțuri, torțe și umbre misterioase' : 'Chains, torches and grim stone'}
                  </div>
                </div>
                <button
                  onClick={() => setTheme('dungeon')}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold ${
                    theme === 'dungeon'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#22160c] text-amber-200 border border-[#ffd700]/30 hover:bg-[#2e1d0f]'
                  }`}
                >
                  {theme === 'dungeon' ? (isRo ? 'Activ ✅' : 'Active ✅') : (isRo ? 'Selectează' : 'Select')}
                </button>
              </div>

              {/* Special Crypt (Unlockable) */}
              <div className="p-3 bg-gradient-to-br from-[#131a15] to-[#0a100c] border border-emerald-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-xs text-emerald-300">
                    👻 {isRo ? 'Cripta Fantomelor Însetate' : 'Crypt of Thirsty Ghosts'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {isRo ? 'Fum verde mistic & spirite vesele' : 'Glowing green ethereal mist'}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(300, 'Cripta Fantomelor Însetate')}
                  className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow hover:brightness-110 active:scale-95"
                >
                  300 🍺🪙
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RELICS & BOARDGAME PERKS */}
          {activeTab === 'perks' && (
            <div className="space-y-2.5">
              <div className="p-3.5 bg-gradient-to-r from-[#20150c] to-[#140e08] border border-[#ffd700]/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-2xl">
                    📜
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-sm text-[#ffd700]">
                      {isRo ? 'Scrisoare de Iertare la Start' : 'Starting Pardon Letter'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {isRo
                        ? 'Începi fiecare sesiune din Moșia Mănăstirii cu 1 Scrisoare de Iertare gratuită!'
                        : 'Start each Monastery Board match with 1 free Pardon Letter!'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(250, 'Scrisoare de Iertare la Start')}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95"
                >
                  250 🍺🪙
                </button>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-[#20150c] to-[#140e08] border border-[#ffd700]/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-2xl">
                    🛡️
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-sm text-amber-300">
                      {isRo ? 'Asigurare de Cârciumă (50% Rent Discount)' : 'Tavern Insurance'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {isRo
                        ? 'Prima chirie pe care o plătești unui rival pe tablă este redusă cu 50%!'
                        : 'First rent paid on an opponent tile is 50% discounted!'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(300, 'Asigurare de Cârciumă')}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95"
                >
                  300 🍺🪙
                </button>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-[#20150c] to-[#140e08] border border-[#ffd700]/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-2xl">
                    🎲
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-sm text-yellow-200">
                      {isRo ? 'Zarul Norocos (Reroll Token)' : 'Lucky Reroll Token'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {isRo
                        ? 'O dată pe meci poți rearunca zarurile pe tablă dacă ai căzut pe o căsuță rea!'
                        : 'Once per match reroll board dice if you landed on a dangerous tile!'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(400, 'Zarul Norocos')}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95"
                >
                  400 🍺🪙
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EXCLUSIVE TITLES & HERALDRY */}
          {activeTab === 'titles' && (
            <div className="space-y-2.5">
              <div className="p-3.5 bg-gradient-to-r from-[#25150a] to-[#140b05] border border-amber-500/50 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-sm text-[#ffd700] flex items-center gap-1.5">
                    <span>👑</span>
                    <span>{isRo ? 'Arhiducele Berii Artizanale' : 'Archduke of Craft Ale'}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {isRo ? 'Titlu monastic de prestigiu aurit' : 'Golden prestigious monastic title'}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(200, 'Titlu: Arhiducele Berii Artizanale')}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95"
                >
                  200 🍺🪙
                </button>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-[#25150a] to-[#140b05] border border-amber-500/50 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-sm text-yellow-300 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{isRo ? 'Spaima Mesei de Craps' : 'Bane of the Craps Table'}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {isRo ? 'Recunoscut ca maestru suprem al pariurilor' : 'Master of high roller bets'}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(250, 'Titlu: Spaima Mesei de Craps')}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow hover:brightness-110 active:scale-95"
                >
                  250 🍺🪙
                </button>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-[#25150a] to-[#140b05] border border-amber-500/50 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-cinzel font-bold text-sm text-fuchsia-300 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>{isRo ? 'Călugăr Iluminat de Har' : 'Friar of Divine Light'}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {isRo ? 'Titlu legendar cu particule strălucitoare' : 'Legendary title with radiant aura'}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(500, 'Titlu: Călugăr Iluminat de Har')}
                  className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow hover:brightness-110 active:scale-95"
                >
                  500 🍺🪙
                </button>
              </div>
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
    </div>
  );
};
