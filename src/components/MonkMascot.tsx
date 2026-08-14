import React from 'react';
import { MonkState } from '../types';
import { getAvatarById } from '../data/avatars';

export interface MonkMascotProps {
  avatarId?: string;
  characterName?: string;
  sipsInTurn?: number;
  overrideState?: MonkState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showLabel?: boolean;
  isDrinking?: boolean;
}

export const MonkMascot: React.FC<MonkMascotProps> = ({
  avatarId = 'monk_drunk',
  characterName,
  sipsInTurn = 0,
  overrideState,
  size = 'md',
  showLabel = true,
  isDrinking = false,
}) => {
  // Determine state from sips if no override provided
  let state: MonkState = 'sober';
  if (overrideState) {
    state = overrideState;
  } else {
    if (sipsInTurn >= 20) state = 'blackout';
    else if (sipsInTurn >= 15) state = 'drunk';
    else if (sipsInTurn >= 10) state = 'wobbly';
    else if (sipsInTurn >= 5) state = 'tipsy';
    else state = 'sober';
  }

  const avatar = getAvatarById(avatarId);

  const dimension =
    size === 'sm'
      ? 'w-16 h-16'
      : size === 'md'
      ? 'w-28 h-28'
      : size === 'lg'
      ? 'w-40 h-40'
      : size === 'xl'
      ? 'w-52 h-52'
      : 'w-60 h-60';

  // Titles customized per character & drunkenness state
  const getCharacterTitles = () => {
    const titlesMap: Record<
      string,
      Record<MonkState, { titleRo: string; titleEn: string; statusTag: string }>
    > = {
      monk_drunk: {
        sober: { titleRo: 'Călugăr Cuvios', titleEn: 'Devout Monk', statusTag: 'Cumpătat & Treaz' },
        tipsy: { titleRo: 'Frate Vesel', titleEn: 'Merry Monk', statusTag: 'Vesel de Tescovină' },
        wobbly: { titleRo: 'Călugăr Clătinat', titleEn: 'Wobbly Monk', statusTag: 'Amețit de Tescovină' },
        drunk: { titleRo: 'Frate Turmentat', titleEn: 'Drunk Monk', statusTag: 'Turmentat la Maxim' },
        blackout: { titleRo: 'Călugăr Prăbușit', titleEn: 'Blackout Monk', statusTag: 'Comă Mănăstirească' },
        dead: { titleRo: 'Răpus de Groapă!', titleEn: 'Fallen in the Chug!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Înviat & Luminat!', titleEn: 'Resurrected!', statusTag: 'Binecuvântat de Sus' },
      },
      archer: {
        sober: { titleRo: 'Arcaș Ager', titleEn: 'Keen Archer', statusTag: 'Ochi de Șoim' },
        tipsy: { titleRo: 'Arcaș cu Chef', titleEn: 'Merry Archer', statusTag: 'Vesel cu Hidromel' },
        wobbly: { titleRo: 'Țintaș Clătinat', titleEn: 'Wobbly Archer', statusTag: 'Trage Strâmb' },
        drunk: { titleRo: 'Arcaș Turmentat', titleEn: 'Drunk Archer', statusTag: 'A pierdut Tolba' },
        blackout: { titleRo: 'Arcaș Doborât', titleEn: 'Fallen Archer', statusTag: 'Prăbușit în Tufiș' },
        dead: { titleRo: 'Arcaș Răpus de Groapă!', titleEn: 'Fallen in Chug!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Arcaș Binecuvântat!', titleEn: 'Blessed Archer!', statusTag: 'Săgeată de Foc' },
      },
      priestess: {
        sober: { titleRo: 'Preoteasă Sfântă', titleEn: 'Holy Priestess', statusTag: 'Pură & Cuvioasă' },
        tipsy: { titleRo: 'Vestală Veselă', titleEn: 'Merry Vestal', statusTag: 'Arome Mănăstirești' },
        wobbly: { titleRo: 'Măicuță Amețită', titleEn: 'Dizzy Priestess', statusTag: 'Cântă la Icoane' },
        drunk: { titleRo: 'Preoteasă Turmentată', titleEn: 'Drunk Priestess', statusTag: 'Transcendată Bahic' },
        blackout: { titleRo: 'Vestală Adormită', titleEn: 'Slumbering Vestal', statusTag: 'Rugăciune în Somn' },
        dead: { titleRo: 'Răpusă de Păcatul Berii!', titleEn: 'Chug Penance!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Aura Divină Revelată!', titleEn: 'Divine Glory!', statusTag: 'Raiul Mănăstirii' },
      },
      knight: {
        sober: { titleRo: 'Cavaler Mândru', titleEn: 'Noble Knight', statusTag: 'Înarmat & Drept' },
        tipsy: { titleRo: 'Paladin Băut', titleEn: 'Tipsy Paladin', statusTag: 'Închină Coiful' },
        wobbly: { titleRo: 'Cavaler Clătinat', titleEn: 'Wobbly Knight', statusTag: 'Îi zăngăne Armura' },
        drunk: { titleRo: 'Cavaler Turmentat', titleEn: 'Drunk Knight', statusTag: 'Răsturnat din Șa' },
        blackout: { titleRo: 'Cavaler Doborât', titleEn: 'Passed Out Knight', statusTag: 'Bucăți de Zale' },
        dead: { titleRo: 'Răpus de Groapă!', titleEn: 'Defeated in Chug!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Cavaler Înviat!', titleEn: 'Resurrected Knight!', statusTag: 'Platou de Aur' },
      },
      wizard: {
        sober: { titleRo: 'Vrăjitor Înțelept', titleEn: 'Wise Wizard', statusTag: 'Studiu Alchimic' },
        tipsy: { titleRo: 'Alchimist Vesel', titleEn: 'Tipsy Alchemist', statusTag: 'Elixir Fermentat' },
        wobbly: { titleRo: 'Mag Clătinat', titleEn: 'Dizzy Mage', statusTag: 'Sparks din Baghetă' },
        drunk: { titleRo: 'Arhimag Turmentat', titleEn: 'Drunk Archmage', statusTag: 'Cazanul a Explodat' },
        blackout: { titleRo: 'Mag Prăbușit', titleEn: 'Comatose Mage', statusTag: 'Visează Rune' },
        dead: { titleRo: 'Anihilat de Groapă!', titleEn: 'Potion Overdose!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Mag Ascendent!', titleEn: 'Ascended Mage!', statusTag: 'Putere Astrală' },
      },
      blacksmith: {
        sober: { titleRo: 'Fierar Robust', titleEn: 'Mighty Blacksmith', statusTag: 'Braț de Oțel' },
        tipsy: { titleRo: 'Fierar Însetat', titleEn: 'Thirsty Smith', statusTag: 'Răcorește Cazanul' },
        wobbly: { titleRo: 'Fierar Clătinat', titleEn: 'Wobbly Smith', statusTag: 'Îi scapă Ciocanul' },
        drunk: { titleRo: 'Barosanu\' Berii', titleEn: 'Drunk Blacksmith', statusTag: 'A băut Butoiul' },
        blackout: { titleRo: 'Fierar Prăbușit', titleEn: 'Blackout Smith', statusTag: 'Doarme pe Nicovală' },
        dead: { titleRo: 'Topit de Groapă!', titleEn: 'Molten in Chug!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Fierar Reaprins!', titleEn: 'Reignited Smith!', statusTag: 'Flacără Eternă' },
      },
      bard: {
        sober: { titleRo: 'Menestrel Melodios', titleEn: 'Melodic Bard', statusTag: 'Acorduri Curate' },
        tipsy: { titleRo: 'Trubadur Vesel', titleEn: 'Merry Minstrel', statusTag: 'Balade de Cârciumă' },
        wobbly: { titleRo: 'Lăutar Clătinat', titleEn: 'Dizzy Bard', statusTag: 'A falsat Refrenul' },
        drunk: { titleRo: 'Menestrel Turmentat', titleEn: 'Drunk Bard', statusTag: 'Răgușit de Tot' },
        blackout: { titleRo: 'Trubadur Adormit', titleEn: 'Slumbering Bard', statusTag: 'Cu capul pe Lăută' },
        dead: { titleRo: 'Ultimul Cântec (Groapă)!', titleEn: 'Final Encore!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Maestru Înviat!', titleEn: 'Resurrected Maestro!', statusTag: 'Imnul Zeilor' },
      },
      rogue: {
        sober: { titleRo: 'Hoț Furișat', titleEn: 'Stealthy Rogue', statusTag: 'Tăcut & Agil' },
        tipsy: { titleRo: 'Tâlhar Vesel', titleEn: 'Tipsy Rogue', statusTag: 'A furat o Halbă' },
        wobbly: { titleRo: 'Pungaș Clătinat', titleEn: 'Dizzy Rogue', statusTag: 'Îi cad Monedele' },
        drunk: { titleRo: 'Hoț Turmentat', titleEn: 'Drunk Rogue', statusTag: 'Prins în Pivniță' },
        blackout: { titleRo: 'Tâlhar Doborât', titleEn: 'Passed Out Rogue', statusTag: 'Zace sub Masă' },
        dead: { titleRo: 'Prins de Groapă!', titleEn: 'Trapped in Chug!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Umbră Glorioasă!', titleEn: 'Shadow Reborn!', statusTag: 'Evadare Divină' },
      },
      princess: {
        sober: { titleRo: 'Prințesă Regală', titleEn: 'Royal Princess', statusTag: 'Eleganță Nobilă' },
        tipsy: { titleRo: 'Domniță Veselă', titleEn: 'Merry Princess', statusTag: 'Pocal de Rubin' },
        wobbly: { titleRo: 'Prințesă Clătinată', titleEn: 'Dizzy Princess', statusTag: 'Îi cade Tiara' },
        drunk: { titleRo: 'Regina Petrecerii', titleEn: 'Drunk Princess', statusTag: 'Dansează pe Mese' },
        blackout: { titleRo: 'Domniță Răpusă', titleEn: 'Slumbering Lady', statusTag: 'Somn de Frumusețe' },
        dead: { titleRo: 'Răpusă de Butoi!', titleEn: 'Royal Chug Fall!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Coroană Cerească!', titleEn: 'Celestial Crown!', statusTag: 'Strălucire Divină' },
      },
      executioner: {
        sober: { titleRo: 'Călău Tăcut', titleEn: 'Grim Executioner', statusTag: 'Privire de Fier' },
        tipsy: { titleRo: 'Călău cu Sete', titleEn: 'Thirsty Slayer', statusTag: 'Bea din Butoi' },
        wobbly: { titleRo: 'Secerător Clătinat', titleEn: 'Dizzy Executioner', statusTag: 'Îi tremură Barda' },
        drunk: { titleRo: 'Călău Turmentat', titleEn: 'Drunk Slayer', statusTag: 'Teroarea Tavernii' },
        blackout: { titleRo: 'Călău Răpus', titleEn: 'Fallen Slayer', statusTag: 'Răsturnat pe Bardă' },
        dead: { titleRo: 'Executat de Groapă!', titleEn: 'Slain by Chug!', statusTag: 'GROAPĂ TOTALĂ' },
        resurrected: { titleRo: 'Călău Înviat!', titleEn: 'Immortal Slayer!', statusTag: 'Putere Neoprită' },
      },
    };

    const charMap = titlesMap[avatarId] || titlesMap['monk_drunk'];
    return charMap[state] || charMap['sober'];
  };

  const getStateVisuals = () => {
    switch (state) {
      case 'sober':
        return {
          badge: '😇 0-4 guri',
          borderClass: 'border-[#e8c84a]/60 shadow-[0_0_25px_rgba(232,200,74,0.35)] bg-gradient-to-b from-[#2a2215] to-[#120f09]',
        };
      case 'tipsy':
        return {
          badge: '🍺 5-9 guri',
          borderClass: 'border-yellow-500/80 shadow-[0_0_25px_rgba(234,179,8,0.45)] bg-gradient-to-b from-[#2e2310] to-[#141007]',
        };
      case 'wobbly':
        return {
          badge: '🥴 10-14 guri',
          borderClass: 'border-orange-500/90 shadow-[0_0_30px_rgba(249,115,22,0.55)] bg-gradient-to-b from-[#381c0e] to-[#170a04]',
        };
      case 'drunk':
        return {
          badge: '😵 15-19 guri',
          borderClass: 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.65)] bg-gradient-to-b from-[#3d1313] to-[#170505]',
        };
      case 'blackout':
        return {
          badge: '💤 20+ guri',
          borderClass: 'border-purple-600 shadow-[0_0_35px_rgba(147,51,234,0.65)] bg-gradient-to-b from-[#311138] to-[#120417]',
        };
      case 'dead':
        return {
          badge: '💀 GROAPĂ',
          borderClass: 'border-red-600 flame-glow bg-gradient-to-b from-[#4a0e0e] to-[#1a0404]',
        };
      case 'resurrected':
        return {
          badge: '✨ RAI 1-1',
          borderClass: 'border-[#ffd700] gold-glow bg-gradient-to-b from-[#1b2b40] to-[#0a121c]',
        };
    }
  };

  const titles = getCharacterTitles();
  const visuals = getStateVisuals();

  // Animation dynamics based on state and isDrinking
  const getAvatarAnimationClass = () => {
    if (state === 'dead') return 'animate-pulse scale-95 brightness-90 saturate-150';
    if (state === 'resurrected') return 'animate-bounce drop-shadow-[0_0_15px_#ffd700]';
    if (state === 'blackout') return 'rotate-12 translate-y-2 opacity-80';
    if (state === 'drunk') return 'animate-bounce duration-700 -rotate-6';
    if (state === 'wobbly') return 'animate-pulse rotate-3';
    if (isDrinking) return 'animate-bounce duration-500 scale-105';
    return 'hover:scale-105 transition-transform duration-300';
  };

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      <div
        className={`relative ${dimension} rounded-3xl border-2 p-2 flex items-center justify-center transition-all duration-500 ${visuals.borderClass}`}
      >
        {/* Animated Beer Bubbles for Drinking / Tipsy / Drunk */}
        {(isDrinking || state === 'tipsy' || state === 'wobbly' || state === 'drunk') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-20">
            <span className="absolute bottom-2 left-3 w-2 h-2 rounded-full bg-yellow-400/50 animate-ping" />
            <span className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-yellow-400/60 animate-bounce" />
            <span className="absolute top-3 left-4 text-[11px] opacity-80 animate-pulse">✨</span>
            <span className="absolute top-2 right-3 text-xs opacity-90 animate-bounce">🍺</span>
          </div>
        )}

        {/* Resurrected Golden Sun Rays */}
        {state === 'resurrected' && (
          <div className="absolute inset-0 rounded-3xl border-2 border-[#ffd700] animate-ping opacity-30 pointer-events-none" />
        )}

        {/* Floating Dizzy Stars for Wobbly State */}
        {state === 'wobbly' && (
          <div className="absolute -top-3 z-30 flex items-center justify-center gap-1 animate-bounce">
            <span className="text-sm animate-spin">💫</span>
            <span className="text-xs animate-pulse">⭐</span>
            <span className="text-sm animate-spin">💫</span>
          </div>
        )}

        {/* Drunk / Blackout Sleep Bubbles */}
        {state === 'blackout' && (
          <div className="absolute -top-3 -right-2 z-30 flex items-center animate-pulse">
            <span className="text-base font-bold text-[#e8c84a] font-cinzel">Z</span>
            <span className="text-xs font-bold text-[#ffd700] font-cinzel">z</span>
            <span className="text-[10px] text-yellow-300 font-cinzel">z</span>
            <span className="text-sm ml-1">💤</span>
          </div>
        )}

        {/* Dead / Groapă Fiery Skull */}
        {state === 'dead' && (
          <div className="absolute -top-3 -left-2 z-30 flex items-center gap-1 animate-bounce">
            <span className="text-base">🔥</span>
            <span className="text-sm">💀</span>
          </div>
        )}

        {/* Character Avatar Canvas */}
        <div className={`w-full h-full relative z-10 flex items-center justify-center ${getAvatarAnimationClass()}`}>
          {avatar.renderSvg('w-full h-full drop-shadow-xl')}

          {/* Dynamic Drinking Tankard & Gulp Animation Overlay */}
          {(isDrinking || state === 'drunk' || state === 'tipsy' || state === 'wobbly') && (
            <div className="absolute -bottom-1 -right-1 z-30 animate-bounce">
              <svg viewBox="0 0 40 40" className="w-9 h-9 drop-shadow-lg" fill="none">
                {/* Frothy Beer Tankard */}
                <rect x="10" y="14" width="16" height="20" rx="3" fill="#92400e" stroke="#e8c84a" strokeWidth="1.5" />
                <line x1="10" y1="20" x2="26" y2="20" stroke="#d97706" strokeWidth="1.5" />
                <line x1="10" y1="26" x2="26" y2="26" stroke="#d97706" strokeWidth="1.5" />
                {/* Tankard Handle */}
                <path d="M26 17 C31 17 31 29 26 31" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Thick Creamy White Foam Head */}
                <ellipse cx="18" cy="14" rx="9" ry="4" fill="#ffffff" />
                <circle cx="13" cy="12" r="3.5" fill="#fef08a" />
                <circle cx="18" cy="10" r="4" fill="#ffffff" />
                <circle cx="23" cy="12" r="3.5" fill="#fef08a" />
                <path d="M15 16 Q16 21 14 24" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {/* Gulp Sound Ripple Text for active drinking */}
          {isDrinking && (
            <div className="absolute -top-2 left-1 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-cinzel shadow-md animate-ping">
              *Gulp!*
            </div>
          )}
        </div>

        {/* Drunk Level Badge in Corner */}
        <div className="absolute -bottom-2.5 -right-2 text-[10px] sm:text-xs font-bebas px-2 py-0.5 rounded-full bg-[#121212] border border-[#e8c84a] text-[#e8c84a] shadow-lg flex items-center gap-1 z-30">
          {visuals.badge}
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <div className="text-xs font-cinzel text-[#e8c84a] font-bold tracking-wide">
            {characterName ? `${characterName} - ${titles.titleRo}` : titles.titleRo}
          </div>
          <div className="text-[10px] text-gray-400 font-barlow italic">
            {titles.statusTag}
          </div>
        </div>
      )}
    </div>
  );
};
