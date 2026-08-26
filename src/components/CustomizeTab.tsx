import React, { useRef, useState } from 'react';
import { ThemeId, DiceSkin } from '../types';
import { useApp } from '../context/AppContext';
import { ChestOpeningModal } from './ChestOpeningModal';
import { Gift, Sparkles } from 'lucide-react';

export const CustomizeTab: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    theme,
    setTheme,
    diceSkin,
    setDiceSkin,
    language,
    setLanguage,
    customThemeBackgrounds,
    setCustomThemeBackground,
    resetCustomThemeBackground,
    isItemPurchased,
    drunkenCoins,
    purchaseShopItem,
    t,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThemeId, setUploadingThemeId] = React.useState<ThemeId | null>(null);
  const [showChestModal, setShowChestModal] = useState(false);

  const themesList: {
    id: ThemeId;
    nameKey: string;
    emoji: string;
    descRo: string;
    descEn: string;
    gradient: string;
    fallbackPreview: string;
    cost?: number;
  }[] = [
    {
      id: 'tavern',
      nameKey: 'themeTavern',
      emoji: '🍺',
      descRo: 'Han cald cu șemineu de piatră, grinzi de stejar și căni de bere',
      descEn: 'Warm tavern with stone fireplace, oak beams & beer steins',
      gradient: 'from-[#3a2012] via-[#24130a] to-[#120803]',
      fallbackPreview: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 'cellar',
      nameKey: 'themeCellar',
      emoji: '🪵',
      descRo: 'Cramă boltită din piatră cu butoaie de bere, cazane și felinare',
      descEn: 'Vaulted stone cellar with oak beer barrels, kettles & lanterns',
      gradient: 'from-[#302216] via-[#1c140d] to-[#0c0805]',
      fallbackPreview: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 'great_hall',
      nameKey: 'themeGreatHall',
      emoji: '🏰',
      descRo: 'Refectoriu maiestuos cu mese de ospăț, candelabre și vitralii',
      descEn: 'Majestic hall with banquet feast tables, chandeliers & stained glass',
      gradient: 'from-[#2e261d] via-[#1a150f] to-[#0c0a07]',
      fallbackPreview: 'https://images.unsplash.com/photo-1548625361-16eb1ea1e5d5?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 'dungeon',
      nameKey: 'themeDungeon',
      emoji: '⛓️',
      descRo: 'Celulă de piatră cu gratii grele de fier, pat de paie și torță aprinsă',
      descEn: 'Stone cell with heavy iron bars, straw bed & blazing wall torch',
      gradient: 'from-[#2a1a14] via-[#180f0c] to-[#0a0605]',
      fallbackPreview: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 'crypt',
      nameKey: 'themeCrypt',
      emoji: '👻',
      descRo: 'Criptă sacră cu felinare spectrale, aburi mistici și lespezi de piatră',
      descEn: 'Sacred crypt with spectral lanterns, mystic mists & ancient stone slabs',
      gradient: 'from-[#062016] via-[#04120e] to-[#020705]',
      fallbackPreview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
      cost: 300,
    },
  ];

  const diceSkinsList: { id: DiceSkin; nameKey: string; previewColor: string; cost?: number; labelRo?: string; labelEn?: string }[] = [
    { id: 'gold', nameKey: 'diceGold', previewColor: 'bg-gradient-to-r from-[#f8e178] to-[#b38f20] text-black' },
    { id: 'bone', nameKey: 'diceBone', previewColor: 'bg-gradient-to-r from-[#fdfbf7] to-[#d8cfbe] text-black' },
    { id: 'wood', nameKey: 'diceWood', previewColor: 'bg-gradient-to-r from-[#a66a38] to-[#4e2f13] text-white' },
    { id: 'ruby', nameKey: 'diceRuby', previewColor: 'bg-gradient-to-r from-[#ef4444] to-[#7f1d1d] text-white', cost: 150 },
    { id: 'ice', nameKey: 'diceIce', previewColor: 'bg-gradient-to-r from-[#38bdf8] to-[#0369a1] text-white', cost: 200 },
    { id: 'obsidian', nameKey: 'diceObsidian', previewColor: 'bg-gradient-to-r from-[#a855f7] to-[#3b0764] text-white', cost: 350 },
    { id: 'amethyst', nameKey: 'diceAmethyst', labelRo: 'Ametist Regal', labelEn: 'Royal Amethyst', previewColor: 'bg-gradient-to-r from-[#c084fc] to-[#6b21a8] text-white' },
    { id: 'crimson_dragon', nameKey: 'diceCrimsonDragon', labelRo: 'Dragon Roșu', labelEn: 'Crimson Dragon', previewColor: 'bg-gradient-to-r from-[#f87171] to-[#991b1b] text-white' },
    { id: 'celestial_gold', nameKey: 'diceCelestialGold', labelRo: 'Aur Celest ★', labelEn: 'Celestial Gold ★', previewColor: 'bg-gradient-to-r from-[#fef08a] via-[#eab308] to-[#ca8a04] text-black' },
    { id: 'spectral_jade', nameKey: 'diceSpectralJade', labelRo: 'Jad Spectral', labelEn: 'Spectral Jade', previewColor: 'bg-gradient-to-r from-[#34d399] to-[#065f46] text-white' },
  ];

  const handleUploadClick = (tId: ThemeId, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadingThemeId(tId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingThemeId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Optimize image size using offscreen canvas to avoid localStorage quota issues
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1440;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setCustomThemeBackground(uploadingThemeId, compressedDataUrl);
          setTheme(uploadingThemeId);
        } else {
          setCustomThemeBackground(uploadingThemeId, rawDataUrl);
          setTheme(uploadingThemeId);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] px-3 sm:px-4 py-6 max-w-xl mx-auto space-y-6 select-none">
      {/* Hidden File Input for Custom Background Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-full flex items-center justify-between border-b border-[#2a2a2a] pb-3">
        <h2 className="text-2xl font-cinzel font-bold text-[#e8c84a] gold-text-glow flex items-center gap-2">
          🎨 {t('customizeTitle')}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold p-1 rounded-lg hover:bg-[#222]"
          >
            ✕
          </button>
        )}
      </div>

      {/* CS-Style Chest Case Opening Feature Banner */}
      <div className="w-full bg-gradient-to-r from-[#2a1708] via-[#1a0f05] to-[#120803] border-2 border-[#ffd700] rounded-2xl p-4 shadow-[0_0_25px_rgba(255,215,0,0.3)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border border-[#ffd700] flex items-center justify-center text-3xl shadow-inner">
            🎁
          </div>
          <div>
            <h3 className="font-cinzel font-black text-sm text-[#ffd700] flex items-center gap-2">
              <span>{language === 'ro' ? 'Cufere & Deschideri CS-Style' : 'CS-Style Chest Openings'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold">★ NOU</span>
            </h3>
            <p className="text-xs text-gray-300 font-barlow">
              {language === 'ro'
                ? 'Învârte ruleta CS pentru a debloca skin-uri rare de zaruri, avatare și teme!'
                : 'Spin the CS roulette tape to unlock rare dice skins, avatars and themes!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowChestModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black font-cinzel font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <Gift className="w-4 h-4" />
          <span>{language === 'ro' ? 'Deschide' : 'Open'}</span>
        </button>
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
                : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
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
                : 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Visual Themes Grid */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider block">
            {t('themeTitle')}
          </label>
          <span className="text-[11px] text-gray-400 font-barlow">
            {language === 'ro' ? 'Poți încărca și imaginea ta!' : 'You can upload your own image!'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themesList.map(th => {
            const hasCustomBg = Boolean(customThemeBackgrounds?.[th.id]);
            const previewBg = hasCustomBg ? customThemeBackgrounds[th.id] : th.fallbackPreview;
            const isSelected = theme === th.id;
            const isUnlocked = isItemPurchased(th.id) || isItemPurchased(`theme_${th.id}`) || !th.cost;

            return (
              <div
                key={th.id}
                onClick={() => {
                  if (isUnlocked) {
                    setTheme(th.id);
                  } else if (th.cost) {
                    if (drunkenCoins >= th.cost) {
                      purchaseShopItem(`theme_${th.id}`, th.cost, () => setTheme(th.id));
                    }
                  }
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#e8c84a] bg-[#201c15] gold-glow text-[#e8c84a]'
                    : isUnlocked
                    ? 'border-[#2a2a2a] bg-[#121212] text-gray-300 hover:border-gray-600'
                    : 'border-[#332222] bg-[#140e0e] text-gray-400 opacity-90'
                }`}
              >
                {/* Visual Thumbnail Preview */}
                <div className="w-full h-24 rounded-lg border border-[#3a3a3a] relative overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={previewBg}
                    alt={t(th.nameKey)}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Theme Emoji & Selected checkmark */}
                  <span className="relative z-10 text-3xl drop-shadow-lg">{th.emoji}</span>

                  {hasCustomBg && (
                    <span className="absolute top-1.5 left-1.5 z-10 text-[10px] bg-[#d4af37] text-black font-cinzel font-black px-1.5 py-0.5 rounded shadow">
                      🖼️ {language === 'ro' ? 'Imaginea Ta' : 'Your Image'}
                    </span>
                  )}

                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 z-10 text-xs bg-[#e8c84a] text-black font-bold px-2 py-0.5 rounded-full shadow">
                      ✓
                    </span>
                  )}

                  {!isUnlocked && th.cost && (
                    <span className="absolute top-1.5 right-1.5 z-10 text-[10px] bg-[#3a1d1d] border border-red-500/50 text-red-200 font-cinzel font-bold px-2 py-0.5 rounded-full shadow">
                      🔒 {th.cost} 🍺🪙
                    </span>
                  )}
                </div>

                {/* Theme Title & Description */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-cinzel text-sm font-bold block">
                      {t(th.nameKey)}
                    </span>
                    {!isUnlocked && (
                      <span className="text-[10px] text-[#e8c84a] font-bold">
                        {drunkenCoins >= (th.cost || 0) ? (language === 'ro' ? 'Deblochează ➔' : 'Unlock ➔') : (language === 'ro' ? 'În Bazar' : 'In Shop')}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-barlow leading-tight block mt-0.5">
                    {language === 'ro' ? th.descRo : th.descEn}
                  </span>
                </div>

                {/* Custom Background Upload & Reset Controls */}
                <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={(e) => handleUploadClick(th.id, e)}
                    className="flex-1 py-1.5 px-2 bg-[#251f16] hover:bg-[#382d1c] border border-[#4a3b25] text-[#e8c84a] rounded-lg text-[11px] font-cinzel font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>📁</span>
                    <span>{hasCustomBg ? (language === 'ro' ? 'Schimbă imaginea' : 'Change image') : (language === 'ro' ? 'Încarcă poza ta' : 'Upload photo')}</span>
                  </button>

                  {hasCustomBg && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetCustomThemeBackground(th.id);
                      }}
                      title={t('resetCustomBg')}
                      className="py-1.5 px-2.5 bg-[#281515] hover:bg-[#3d1a1a] border border-[#522222] text-red-400 rounded-lg text-[11px] font-cinzel font-bold transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dice Skins Selector */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <label className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider block">
          {t('diceSkinTitle')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {diceSkinsList.map(ds => {
            const isUnlocked = isItemPurchased(ds.id) || isItemPurchased(`dice_${ds.id}`) || !ds.cost;
            const isSelected = diceSkin === ds.id;

            return (
              <button
                key={ds.id}
                type="button"
                onClick={() => {
                  if (isUnlocked) {
                    setDiceSkin(ds.id);
                  } else if (ds.cost && drunkenCoins >= ds.cost) {
                    purchaseShopItem(`dice_${ds.id}`, ds.cost, () => setDiceSkin(ds.id));
                  }
                }}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                  isSelected
                    ? 'border-[#e8c84a] bg-[#221f18] gold-glow text-[#e8c84a] font-bold'
                    : isUnlocked
                    ? 'border-[#2a2a2a] bg-[#121212] text-gray-400 hover:border-gray-600'
                    : 'border-[#332222] bg-[#140e0e] text-gray-500'
                }`}
              >
                {!isUnlocked && ds.cost && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] bg-red-950/80 border border-red-500/40 text-red-300 px-1.5 py-0.5 rounded font-cinzel font-bold">
                    🔒 {ds.cost} 🍺🪙
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl ${ds.previewColor} font-bebas font-bold text-xl flex items-center justify-center shadow`}>
                  6
                </div>
                <span className="font-cinzel text-xs text-center">
                  {ds.labelRo && ds.labelEn
                    ? (language === 'ro' ? ds.labelRo : ds.labelEn)
                    : t(ds.nameKey)}
                </span>
                {!isUnlocked && (
                  <span className="text-[10px] text-[#e8c84a] font-bold">
                    {drunkenCoins >= (ds.cost || 0) ? (language === 'ro' ? 'Cumpără' : 'Buy') : (language === 'ro' ? 'În Bazar' : 'In Shop')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Opening Modal */}
      {showChestModal && (
        <ChestOpeningModal
          isOpen={showChestModal}
          onClose={() => setShowChestModal(false)}
        />
      )}
    </div>
  );
};
