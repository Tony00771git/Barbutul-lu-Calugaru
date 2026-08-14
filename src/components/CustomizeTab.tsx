import React from 'react';
import { ThemeId, DiceSkin, Language } from '../types';
import { useApp } from '../context/AppContext';

export const CustomizeTab: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    theme,
    setTheme,
    diceSkin,
    setDiceSkin,
    language,
    setLanguage,
    t,
  } = useApp();

  const themesList: { id: ThemeId; nameKey: string; emoji: string; descRo: string; descEn: string; gradient: string }[] = [
    {
      id: 'tavern',
      nameKey: 'themeTavern',
      emoji: '🍺',
      descRo: 'Grinzi de lemn, lumânări, butoaie de bere și vatră caldă',
      descEn: 'Dark cozy tavern with wooden beams, barrels & hearth',
      gradient: 'from-[#2e190e] via-[#1c0f07] to-[#0d0703]',
    },
    {
      id: 'spring',
      nameKey: 'themeSpring',
      emoji: '🌸',
      descRo: 'Curte de mănăstire cu copaci înfloriți & petale în aer',
      descEn: 'Monastery courtyard with cherry blossoms & ivy',
      gradient: 'from-[#1a3821] via-[#102415] to-[#07120a]',
    },
    {
      id: 'winter',
      nameKey: 'themeWinter',
      emoji: '❄️',
      descRo: 'Cetate sub ninsoare, noapte înstelată & torțe aprinse',
      descEn: 'Snowy fortress at night with blazing wall torches',
      gradient: 'from-[#122238] via-[#0b1726] to-[#050b14]',
    },
    {
      id: 'sky',
      nameKey: 'themeSky',
      emoji: '☁️',
      descRo: 'Cetate plutind printre nori aurii la apus violet',
      descEn: 'Floating fantasy citadel in golden twilight clouds',
      gradient: 'from-[#3b1254] via-[#210a30] to-[#0c0818]',
    },
    {
      id: 'battlefield',
      nameKey: 'themeBattlefield',
      emoji: '🌅',
      descRo: 'Câmp de luptă la apus dramatic, steaguri rupte & ceață',
      descEn: 'Dramatic sunset battlefield with tattered banners',
      gradient: 'from-[#4a1212] via-[#2e0909] to-[#120505]',
    },
  ];

  const diceSkinsList: { id: DiceSkin; nameKey: string; previewColor: string }[] = [
    { id: 'gold', nameKey: 'diceGold', previewColor: 'bg-gradient-to-r from-[#f8e178] to-[#b38f20] text-black' },
    { id: 'bone', nameKey: 'diceBone', previewColor: 'bg-gradient-to-r from-[#fdfbf7] to-[#d8cfbe] text-black' },
    { id: 'wood', nameKey: 'diceWood', previewColor: 'bg-gradient-to-r from-[#a66a38] to-[#4e2f13] text-white' },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] px-4 py-6 max-w-xl mx-auto space-y-6 select-none">
      <div className="w-full flex items-center justify-between border-b border-[#2a2a2a] pb-3">
        <h2 className="text-2xl font-cinzel font-bold text-[#e8c84a] gold-text-glow flex items-center gap-2">
          🎨 {t('customizeTitle')}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Language Switch Section */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <label className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider block">
          {t('languageTitle')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage('ro')}
            className={`py-3 rounded-xl border-2 font-cinzel font-bold text-base transition-all flex items-center justify-center gap-2 ${
              language === 'ro'
                ? 'border-[#e8c84a] bg-[#221f18] text-[#e8c84a] gold-glow'
                : 'border-[#2a2a2a] bg-[#121212] text-gray-400'
            }`}
          >
            <span>🇹🇩</span>
            <span>Română</span>
          </button>

          <button
            onClick={() => setLanguage('en')}
            className={`py-3 rounded-xl border-2 font-cinzel font-bold text-base transition-all flex items-center justify-center gap-2 ${
              language === 'en'
                ? 'border-[#e8c84a] bg-[#221f18] text-[#e8c84a] gold-glow'
                : 'border-[#2a2a2a] bg-[#121212] text-gray-400'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Visual Themes Grid */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <label className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider block">
          {t('themeTitle')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themesList.map(th => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                theme === th.id
                  ? 'border-[#e8c84a] bg-[#221f18] gold-glow text-[#e8c84a] font-bold'
                  : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className={`w-full h-14 rounded-xl bg-gradient-to-br ${th.gradient} border border-[#3a3a3a] flex items-center justify-center text-2xl shadow-inner relative overflow-hidden`}>
                <span className="relative z-10">{th.emoji}</span>
              </div>
              <div className="text-center">
                <span className="font-cinzel text-xs font-bold block">
                  {t(th.nameKey)}
                </span>
                <span className="text-[10px] text-gray-400 font-barlow leading-tight block line-clamp-2 mt-0.5">
                  {language === 'ro' ? th.descRo : th.descEn}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dice Skins Selector */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <label className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider block">
          {t('diceSkinTitle')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {diceSkinsList.map(ds => (
            <button
              key={ds.id}
              onClick={() => setDiceSkin(ds.id)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                diceSkin === ds.id
                  ? 'border-[#e8c84a] bg-[#221f18] gold-glow text-[#e8c84a] font-bold'
                  : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${ds.previewColor} font-bebas font-bold text-xl flex items-center justify-center shadow`}>
                6
              </div>
              <span className="font-cinzel text-xs text-center">
                {t(ds.nameKey)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
