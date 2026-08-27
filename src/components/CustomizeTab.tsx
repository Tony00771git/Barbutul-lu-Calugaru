import React, { useRef, useState } from 'react';
import { ThemeId, DiceSkin } from '../types';
import { useApp } from '../context/AppContext';
import { ChestOpeningModal } from './ChestOpeningModal';
import { DieFace } from './Dice';
import { RANK_TITLES, calculateProgression } from '../lib/progression';
import { SHOP_CATALOG } from '../data/shopCatalog';
import {
  Globe,
  Image as ImageIcon,
  Dice5,
  Crown,
  Gift,
  ArrowLeft,
  Sparkles,
  Upload,
  Trash2,
  Check,
  Lock,
  Zap,
  User,
  ShieldCheck,
} from 'lucide-react';

export type CustomizeChapter = 'language' | 'background' | 'dice' | 'profile_title' | 'chests';

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
    addDrunkenCoins,
    purchaseShopItem,
    profiles,
    masterProfile,
    equipCustomTitle,
    t,
  } = useApp();

  const isRo = language === 'ro';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeChapter, setActiveChapter] = useState<CustomizeChapter>('background');
  const [uploadingThemeId, setUploadingThemeId] = useState<ThemeId | null>(null);
  const [showChestModal, setShowChestModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(masterProfile?.id || profiles[0]?.id || '');
  const [titleSubTab, setTitleSubTab] = useState<'ranks' | 'exclusive'>('ranks');

  // Selected Profile for Title Customization
  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || masterProfile || profiles[0];
  const activeProfileProgression = activeProfile ? calculateProgression(activeProfile.totalXP || 0) : null;
  const currentEquippedTitle = isRo
    ? (activeProfile?.currentTitle_ro || activeProfileProgression?.titleRo || 'Ucenic de Tavernă')
    : (activeProfile?.currentTitle_en || activeProfileProgression?.titleEn || 'Tavern Apprentice');

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
    {
      id: 'dragon_lair',
      nameKey: 'themeDragonLair',
      emoji: '🌋',
      descRo: 'Bârlog vulcanic cu lacuri de lavă, comori de aur și scântei incandescente',
      descEn: 'Volcanic cavern with magma lakes, ancient dragon gold and flying embers',
      gradient: 'from-[#2c0c08] via-[#1a0705] to-[#0f0302]',
      fallbackPreview: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop',
      cost: 350,
    },
    {
      id: 'celestial_observatory',
      nameKey: 'themeCelestialObservatory',
      emoji: '🌌',
      descRo: 'Bolți gotice indigo, inele astrologice de alamă și constelații vii',
      descEn: 'Gothic indigo vaults, brass astrolabes and shimmering stellar constellations',
      gradient: 'from-[#0d112b] via-[#090a1a] to-[#04050f]',
      fallbackPreview: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop',
      cost: 400,
    },
    {
      id: 'enchanted_forest',
      nameKey: 'themeEnchantedForest',
      emoji: '🌲',
      descRo: 'Pădure de smarald cu monoliti runici strălucitori și licurici magici',
      descEn: 'Emerald canopy with glowing runic stones and mystical fireflies',
      gradient: 'from-[#062416] via-[#03140c] to-[#010a06]',
      fallbackPreview: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
      cost: 350,
    },
    {
      id: 'royal_treasury',
      nameKey: 'themeRoyalTreasury',
      emoji: '💰',
      descRo: 'Trezorerie regală cu coloane aurite, cupe de argint și ducați de aur',
      descEn: 'Royal treasury vault with gilded pillars, silver goblets and cascades of coins',
      gradient: 'from-[#2e2107] via-[#1a1304] to-[#0d0902]',
      fallbackPreview: 'https://images.unsplash.com/photo-1548625361-16eb1ea1e5d5?q=80&w=600&auto=format&fit=crop',
      cost: 450,
    },
    {
      id: 'custom_player',
      nameKey: 'themeCustomPlayer',
      emoji: '🖼️',
      descRo: '★ Fundal Personalizat: încarcă propria ta poză/tapet direct pe ecranul jocului',
      descEn: '★ Custom Wallpaper: upload your own photo or wallpaper directly to your game screen',
      gradient: 'from-[#ffd700] via-[#7c3aed] to-[#1e1b4b]',
      fallbackPreview: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
      cost: 500,
    },
  ];

  const diceSkinsList: { id: DiceSkin; nameKey: string; previewColor: string; cost?: number; labelRo?: string; labelEn?: string; rarity?: string }[] = [
    // Standard
    { id: 'gold', nameKey: 'diceGold', labelRo: 'Aur Lucios', labelEn: 'Polished Gold', previewColor: 'bg-gradient-to-r from-[#f8e178] to-[#b38f20] text-black', rarity: 'Standard' },
    { id: 'bone', nameKey: 'diceBone', labelRo: 'Os Străvechi', labelEn: 'Ancient Bone', previewColor: 'bg-gradient-to-r from-[#fdfbf7] to-[#d8cfbe] text-black', rarity: 'Standard' },
    { id: 'wood', nameKey: 'diceWood', labelRo: 'Lemn de Stejar', labelEn: 'Carved Oak', previewColor: 'bg-gradient-to-r from-[#a66a38] to-[#4e2f13] text-white', rarity: 'Standard' },
    { id: 'tavern_oak', nameKey: 'diceTavernOak', labelRo: 'Stejar de Tavernă', labelEn: 'Tavern Oak', previewColor: 'bg-gradient-to-r from-[#8c531b] to-[#381a03] text-white', cost: 100, rarity: 'Standard' },
    { id: 'copper', nameKey: 'diceCopper', labelRo: 'Cupru Patinat', labelEn: 'Weathered Copper', previewColor: 'bg-gradient-to-r from-[#d97706] to-[#152d22] text-white', cost: 120, rarity: 'Standard' },
    { id: 'granite', nameKey: 'diceGranite', labelRo: 'Granit Monahal', labelEn: 'Monastic Granite', previewColor: 'bg-gradient-to-r from-[#9ca3af] to-[#374151] text-white', cost: 130, rarity: 'Standard' },
    // Rar
    { id: 'ruby', nameKey: 'diceRuby', labelRo: 'Rubin Sângeriu', labelEn: 'Blood Ruby', previewColor: 'bg-gradient-to-r from-[#ef4444] to-[#7f1d1d] text-white', cost: 150, rarity: 'Rar' },
    { id: 'ice', nameKey: 'diceIce', labelRo: 'Gheață Eternă', labelEn: 'Glacial Frost', previewColor: 'bg-gradient-to-r from-[#38bdf8] to-[#0369a1] text-white', cost: 200, rarity: 'Rar' },
    { id: 'emerald_jade', nameKey: 'diceEmeraldJade', labelRo: 'Jad Smarald', labelEn: 'Emerald Jade', previewColor: 'bg-gradient-to-r from-[#6ee7b7] to-[#047857] text-white', cost: 250, rarity: 'Rar' },
    // Epic
    { id: 'obsidian', nameKey: 'diceObsidian', labelRo: 'Obsidian & Rune', labelEn: 'Runic Obsidian', previewColor: 'bg-gradient-to-r from-[#a855f7] to-[#3b0764] text-white', cost: 350, rarity: 'Epic' },
    { id: 'amethyst', nameKey: 'diceAmethyst', labelRo: 'Ametist Regal', labelEn: 'Royal Amethyst', previewColor: 'bg-gradient-to-r from-[#c084fc] to-[#6b21a8] text-white', cost: 380, rarity: 'Epic' },
    { id: 'emerald_hydra', nameKey: 'diceEmeraldHydra', labelRo: 'Hidra de Smarald', labelEn: 'Emerald Hydra', previewColor: 'bg-gradient-to-r from-[#10b981] via-[#059669] to-[#064e3b] text-white', cost: 420, rarity: 'Epic' },
    { id: 'plasma_pink', nameKey: 'dicePlasmaPink', labelRo: 'Plasmă Spectrală', labelEn: 'Spectral Plasma', previewColor: 'bg-gradient-to-r from-[#f472b6] to-[#831843] text-white', cost: 430, rarity: 'Epic' },
    // Legendar
    { id: 'crimson_dragon', nameKey: 'diceCrimsonDragon', labelRo: 'Dragon Roșu', labelEn: 'Crimson Dragon', previewColor: 'bg-gradient-to-r from-[#f87171] to-[#991b1b] text-white', cost: 450, rarity: 'Legendar' },
    { id: 'bloodfire', nameKey: 'diceBloodfire', labelRo: 'Dragon de Sânge', labelEn: 'Bloodfire Dragon', previewColor: 'bg-gradient-to-r from-[#f87171] to-[#200108] text-white', cost: 460, rarity: 'Legendar' },
    { id: 'infernal_ember', nameKey: 'diceInfernalEmber', labelRo: 'Foc Infernal', labelEn: 'Infernal Ember', previewColor: 'bg-gradient-to-r from-[#f97316] via-[#dc2626] to-[#7f1d1d] text-white', cost: 480, rarity: 'Legendar' },
    // Mistic
    { id: 'void_cosmic', nameKey: 'diceVoidCosmic', labelRo: 'Vid Cosmic', labelEn: 'Cosmic Void', previewColor: 'bg-gradient-to-r from-[#38bdf8] via-[#6366f1] to-[#1e1b4b] text-white', cost: 550, rarity: 'Mistic' },
    { id: 'celestial_gold', nameKey: 'diceCelestialGold', labelRo: 'Aur Celest', labelEn: 'Celestial Gold', previewColor: 'bg-gradient-to-r from-[#fef08a] via-[#eab308] to-[#ca8a04] text-black', cost: 700, rarity: 'Mistic' },
    { id: 'imperial_gold', nameKey: 'diceImperialGold', labelRo: 'Aur Imperial & Smarald', labelEn: 'Imperial Gold & Emerald', previewColor: 'bg-gradient-to-r from-[#fef08a] via-[#d97706] to-[#047857] text-white', cost: 750, rarity: 'Mistic' },
    // Exclusiv Cufăr
    { id: 'spectral_jade', nameKey: 'diceSpectralJade', labelRo: 'Jad Spectral', labelEn: 'Spectral Jade', previewColor: 'bg-gradient-to-r from-[#34d399] to-[#065f46] text-white', rarity: 'Exclusiv Cufăr' },
  ];

  // Exclusive Titles from Shop
  const exclusiveTitles = SHOP_CATALOG.filter((item) => item.category === 'titles');

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

  // Chapter navigation items
  const chapters: {
    id: CustomizeChapter;
    labelRo: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'language',
      labelRo: 'Limbă',
      labelEn: 'Language',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'background',
      labelRo: 'Background',
      labelEn: 'Background',
      icon: <ImageIcon className="w-4 h-4" />,
      badge: '9',
    },
    {
      id: 'dice',
      labelRo: 'Dice',
      labelEn: 'Dice',
      icon: <Dice5 className="w-4 h-4" />,
      badge: '13',
    },
    {
      id: 'profile_title',
      labelRo: 'Titlu Profil',
      labelEn: 'Profile Title',
      icon: <Crown className="w-4 h-4" />,
      badge: '★',
    },
    {
      id: 'chests',
      labelRo: 'Cufere CS',
      labelEn: 'Chests',
      icon: <Gift className="w-4 h-4" />,
      badge: 'NOU',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto space-y-4 select-none pb-2">
      {/* Hidden File Input for Custom Background Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOP HEADER: Title, Coins Counter, Refill & Close */}
      <div className="w-full flex items-center justify-between border-b border-[#2e2316] pb-3 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-[#20150b] hover:bg-[#342212] border border-[#ffd700]/50 text-amber-300 hover:text-white font-cinzel font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer flex-shrink-0"
              title={isRo ? '← Înapoi la Meniu' : '← Back to Menu'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">{isRo ? 'Înapoi' : 'Back'}</span>
            </button>
          )}

          <h2 className="text-base sm:text-xl font-cinzel font-black text-[#ffd700] gold-text-glow flex items-center gap-2 truncate">
            <span>🎨</span>
            <span className="truncate">{t('customizeTitle')}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick Infinite Refill Button */}
          <button
            type="button"
            onClick={() => addDrunkenCoins(999999)}
            className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:brightness-125 active:scale-95 text-black font-cinzel font-black text-[11px] sm:text-xs px-2.5 py-1 rounded-xl border border-yellow-200 shadow-md transition-all flex items-center gap-1 cursor-pointer"
            title={isRo ? '+999,999 🍺🪙 Bani Infiniți' : '+999,999 🍺🪙 Infinite Coins'}
          >
            <Zap className="w-3.5 h-3.5 fill-black text-black" />
            <span>+999k 🪙</span>
          </button>

          {/* Drunken Coins Display */}
          <div className="bg-[#1c1208] border border-[#ffd700]/60 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold text-[#ffd700] shadow-inner">
            <span>🍺🪙</span>
            <span>{drunkenCoins.toLocaleString()}</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-[#25170d] transition-colors"
              title={isRo ? 'Închide' : 'Close'}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ERGONOMIC CHAPTER NAVIGATION BAR (Bara de Capitole) */}
      <div className="w-full bg-[#160f08]/90 border border-[#ffd700]/30 rounded-2xl p-1.5 backdrop-blur-md shadow-lg sticky top-0 z-20">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {chapters.map((ch) => {
            const isActive = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  if (ch.id === 'chests') {
                    setShowChestModal(true);
                  } else {
                    setActiveChapter(ch.id);
                  }
                }}
                className={`py-2 px-1 sm:px-2.5 rounded-xl font-cinzel font-bold text-[11px] sm:text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)] scale-[1.02]'
                    : 'bg-[#1e140b]/70 text-amber-200/80 hover:text-white hover:bg-[#2e1d10] border border-[#ffd700]/10 hover:border-[#ffd700]/40'
                }`}
              >
                <span className={isActive ? 'text-black' : 'text-[#ffd700]'}>{ch.icon}</span>
                <span className="truncate">{isRo ? ch.labelRo : ch.labelEn}</span>
                {ch.badge && (
                  <span
                    className={`hidden xs:inline-block px-1 py-0.2 rounded-full text-[9px] font-mono font-bold leading-none ${
                      isActive
                        ? 'bg-black text-[#ffd700]'
                        : ch.id === 'chests'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-[#382312] text-amber-300'
                    }`}
                  >
                    {ch.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHAPTER 1: 🌐 LIMBĂ & REGIUNE (Language)                                */}
      {/* ========================================================================= */}
      {activeChapter === 'language' && (
        <div className="w-full bg-[#171008] border border-[#ffd700]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#2e1f12] pb-2.5">
            <div>
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#ffd700]" />
                <span>{t('languageTitle')}</span>
              </h3>
              <p className="text-xs text-gray-400 font-barlow mt-0.5">
                {isRo
                  ? 'Alege limba interfeței, a dialogurilor călugărești și a regulamentului.'
                  : 'Select interface language, monastic dialogues, and rulebook locale.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#2a1b0d] border border-[#ffd700]/40 text-[#ffd700] font-mono text-xs font-bold">
              {language === 'ro' ? '🇹🇩 RO ACTIV' : '🇬🇧 EN ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Romanian Card */}
            <button
              type="button"
              onClick={() => setLanguage('ro')}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${
                language === 'ro'
                  ? 'border-[#ffd700] bg-gradient-to-r from-[#2c1d0b] to-[#1c1207] shadow-[0_0_20px_rgba(255,215,0,0.25)] text-[#ffd700]'
                  : 'border-[#2d2012] bg-[#120d07] text-gray-400 hover:border-amber-700/60 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl drop-shadow">🇹🇩</span>
                <div>
                  <div className="font-cinzel font-bold text-base flex items-center gap-2">
                    <span>Română</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300">RO</span>
                  </div>
                  <p className="text-xs text-gray-400 font-barlow mt-0.5">
                    Misiuni, canoane, proverbe și voci în limba română
                  </p>
                </div>
              </div>
              {language === 'ro' && (
                <div className="w-7 h-7 rounded-full bg-[#ffd700] text-black flex items-center justify-center flex-shrink-0 font-bold shadow">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>

            {/* English Card */}
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${
                language === 'en'
                  ? 'border-[#ffd700] bg-gradient-to-r from-[#2c1d0b] to-[#1c1207] shadow-[0_0_20px_rgba(255,215,0,0.25)] text-[#ffd700]'
                  : 'border-[#2d2012] bg-[#120d07] text-gray-400 hover:border-amber-700/60 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl drop-shadow">🇬🇧</span>
                <div>
                  <div className="font-cinzel font-bold text-base flex items-center gap-2">
                    <span>English</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300">EN</span>
                  </div>
                  <p className="text-xs text-gray-400 font-barlow mt-0.5">
                    Full international translation & rules
                  </p>
                </div>
              </div>
              {language === 'en' && (
                <div className="w-7 h-7 rounded-full bg-[#ffd700] text-black flex items-center justify-center flex-shrink-0 font-bold shadow">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#1f140a] border border-amber-900/40 text-xs text-amber-200/90 flex items-center gap-2 font-barlow">
            <span>ℹ️</span>
            <span>
              {isRo
                ? 'Schimbarea limbii se aplică instantaneu în toate meniurile, jocurile și clasamentele locale.'
                : 'Language changes apply immediately across all game screens, dialogues, and leaderboards.'}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER 2: 🖼️ BACKGROUND & ATMOSFERĂ (Themes)                          */}
      {/* ========================================================================= */}
      {activeChapter === 'background' && (
        <div className="w-full bg-[#171008] border border-[#ffd700]/40 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2e1f12] pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#ffd700]" />
                <span>{t('themeTitle')}</span>
              </h3>
              <p className="text-xs text-gray-400 font-barlow mt-0.5">
                {isRo
                  ? 'Alege decorul vizual al tavernei sau deblochează fundalul custom pentru a încărca propria ta poză!'
                  : 'Choose the tavern scenic atmosphere or unlock the custom background to upload your own photo!'}
              </p>
            </div>
            <span className="text-xs text-amber-300 font-mono font-bold bg-[#291a0c] border border-amber-700/50 px-2 py-0.5 rounded-lg">
              9 {isRo ? 'Atmosfere Medievale' : 'Medieval Atmospheres'} + 1 {isRo ? 'Custom' : 'Custom'}
            </span>
          </div>

          {/* Dedicated Custom Background Studio (Highlighted Card) */}
          {(() => {
            const customTh = themesList.find((t) => t.id === 'custom_player');
            if (!customTh) return null;
            const isCustomUnlocked = isItemPurchased('custom_player') || isItemPurchased('theme_custom_player');
            const customImg = customThemeBackgrounds?.custom_player;
            const isCustomActive = theme === 'custom_player';

            return (
              <div
                className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden bg-gradient-to-r ${
                  isCustomActive
                    ? 'from-[#2e1c0d] via-[#3a200e] to-[#1a0f07] border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.25)]'
                    : isCustomUnlocked
                    ? 'from-[#20140a] to-[#120b05] border-amber-700/60 hover:border-amber-500'
                    : 'from-[#231212] via-[#1a0d0d] to-[#100808] border-red-900/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-20 h-20 rounded-xl border-2 border-amber-600/60 overflow-hidden relative flex-shrink-0 bg-black flex items-center justify-center shadow-inner">
                      {customImg ? (
                        <img
                          src={customImg}
                          alt="Custom Wallpaper"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <span className="text-2xl">🖼️</span>
                          <span className="text-[9px] font-cinzel text-amber-300 font-bold leading-none mt-1">
                            {isRo ? 'Fără Poză' : 'No Photo'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cinzel text-sm sm:text-base font-black text-[#ffd700]">
                          ★ {isRo ? 'Fundal Personalizat Jucător' : 'Custom Player Wallpaper'} ★
                        </span>
                        {isCustomActive && (
                          <span className="text-[10px] bg-[#ffd700] text-black font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{isRo ? 'ECHIPAT' : 'EQUIPPED'}</span>
                          </span>
                        )}
                        {!isCustomUnlocked && (
                          <span className="text-[10px] bg-[#3a1414] border border-red-500/60 text-red-200 font-cinzel font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>500 🍺🪙 / {isRo ? 'Drop Cufăr' : 'Chest Drop'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 font-barlow mt-1 leading-relaxed">
                        {isRo
                          ? 'Încarcă orice poză proprie din telefon/PC (JPG, PNG, WebP) pentru a personaliza fundalul pe tot parcursul jocului. Se deblochează cu 500 de galbeni sau drop maxim din cufere.'
                          : 'Upload any photo from your device to fully customize your in-game wallpaper. Obtainable for 500 Drunken Coins in Shop or as a max-rarity chest drop.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {isCustomUnlocked ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('custom_player');
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCustomActive
                              ? 'bg-[#ffd700] text-black shadow-lg hover:bg-yellow-400 font-black'
                              : 'bg-[#291a0c] hover:bg-[#3d2713] text-[#ffd700] border border-[#5a3b1d]'
                          }`}
                        >
                          {isCustomActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isRo ? 'Activ' : 'Active'}</span>
                            </>
                          ) : (
                            <span>{isRo ? 'Setează Activ' : 'Set Active'}</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleUploadClick('custom_player', e)}
                          className="py-2 px-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-cinzel font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{customImg ? (isRo ? 'Schimbă Poza' : 'Change Photo') : (isRo ? 'Încarcă Poză' : 'Upload Photo')}</span>
                        </button>

                        {customImg && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetCustomThemeBackground('custom_player');
                            }}
                            title={t('resetCustomBg')}
                            className="p-2 bg-[#331414] hover:bg-[#4d1d1d] border border-red-700/60 text-red-300 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {drunkenCoins >= 500 ? (
                          <button
                            type="button"
                            onClick={() => {
                              purchaseShopItem('theme_custom_player', 500, () => setTheme('custom_player'));
                            }}
                            className="py-2 px-4 bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-black rounded-xl text-xs font-cinzel font-black shadow-lg hover:brightness-110 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>🔓 {isRo ? 'Deblochează cu 500' : 'Unlock for 500'} 🍺🪙</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowChestModal(true)}
                            className="py-2 px-3 bg-[#2a1414] hover:bg-[#3d1c1c] border border-red-700/60 text-red-200 rounded-xl text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>🎁 {isRo ? 'Deschide Cufere (Drop Rar)' : 'Open Chests (Rare Drop)'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Standard Curated Medieval Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {themesList
              .filter((th) => th.id !== 'custom_player')
              .map((th) => {
                const previewBg = th.fallbackPreview;
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
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                      isSelected
                        ? 'border-[#ffd700] bg-gradient-to-b from-[#2e1e0d] to-[#1a1107] shadow-[0_0_20px_rgba(255,215,0,0.3)] text-[#ffd700]'
                        : isUnlocked
                        ? 'border-[#2d2012] bg-[#140e08] text-gray-300 hover:border-amber-700/70 hover:bg-[#1a120b]'
                        : 'border-[#381c1c] bg-[#160d0d] text-gray-400 opacity-90'
                    }`}
                  >
                    {/* Visual Thumbnail Preview */}
                    <div className="w-full h-28 rounded-xl border border-[#3e2b17] relative overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={previewBg}
                        alt={t(th.nameKey)}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                      {/* Theme Emoji Icon */}
                      <span className="relative z-10 text-4xl drop-shadow-lg transform group-hover:scale-110 transition-transform">
                        {th.emoji}
                      </span>

                      {isSelected && (
                        <span className="absolute top-2 right-2 z-10 text-xs bg-[#ffd700] text-black font-black px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isRo ? 'ACTIV' : 'ACTIVE'}</span>
                        </span>
                      )}

                      {!isUnlocked && th.cost && (
                        <span className="absolute top-2 right-2 z-10 text-[11px] bg-[#3a1414] border border-red-500/60 text-red-200 font-cinzel font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{th.cost} 🍺🪙</span>
                        </span>
                      )}
                    </div>

                    {/* Theme Title & Description */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-cinzel text-sm font-bold block truncate text-[#ffd700]">
                          {t(th.nameKey)}
                        </span>
                        {!isUnlocked && (
                          <span className="text-[11px] font-cinzel font-bold text-amber-300">
                            {drunkenCoins >= (th.cost || 0)
                              ? (isRo ? 'Deblochează ➔' : 'Unlock ➔')
                              : (isRo ? 'În Bazar 🔒' : 'In Shop 🔒')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-barlow leading-tight block mt-1 line-clamp-2">
                        {isRo ? th.descRo : th.descEn}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER 3: 🎲 ZARURI & MATERIALE (Dice Skins)                           */}
      {/* ========================================================================= */}
      {activeChapter === 'dice' && (
        <div className="w-full bg-[#171008] border border-[#ffd700]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#2e1f12] pb-2.5 flex-wrap gap-2">
            <div>
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] flex items-center gap-2">
                <Dice5 className="w-4 h-4 text-[#ffd700]" />
                <span>{t('diceSkinTitle')}</span>
              </h3>
              <p className="text-xs text-gray-400 font-barlow mt-0.5">
                {isRo
                  ? 'Alege materialul și aura zarurilor aruncate în toate duelurile și pe tablă.'
                  : 'Select the material and glowing aura of the dice rolled in all matches.'}
              </p>
            </div>
            <span className="text-xs text-amber-300 font-mono font-bold bg-[#291a0c] border border-amber-700/50 px-2 py-0.5 rounded-lg">
              {diceSkinsList.length} {isRo ? 'Skin-uri de Zar' : 'Dice Skins'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {diceSkinsList.map((ds) => {
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
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between gap-2.5 relative cursor-pointer text-center group ${
                    isSelected
                      ? 'border-[#ffd700] bg-gradient-to-b from-[#2e1e0d] to-[#1a1107] shadow-[0_0_20px_rgba(255,215,0,0.35)] text-[#ffd700] font-bold scale-[1.02]'
                      : isUnlocked
                      ? 'border-[#2d2012] bg-[#140e08] text-gray-300 hover:border-amber-700/70 hover:bg-[#1a120b]'
                      : 'border-[#381c1c] bg-[#160d0d] text-gray-500'
                  }`}
                >
                  {/* Rarity or Cost Badge */}
                  <div className="w-full flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-amber-300/80 border border-white/5">
                      {ds.rarity || 'Standard'}
                    </span>
                    {!isUnlocked && ds.cost ? (
                      <span className="text-[10px] bg-red-950/90 border border-red-500/50 text-red-300 px-1.5 py-0.5 rounded font-cinzel font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{ds.cost}</span>
                      </span>
                    ) : isSelected ? (
                      <span className="text-[10px] bg-[#ffd700] text-black font-black px-1.5 py-0.5 rounded-full shadow">
                        ✓
                      </span>
                    ) : null}
                  </div>

                  {/* 3D Dice Face Preview */}
                  <div className="py-2 transform group-hover:scale-110 transition-transform">
                    <DieFace value={6} skin={ds.id} size="sm" />
                  </div>

                  {/* Name & Status */}
                  <div className="w-full">
                    <span className="font-cinzel text-xs font-bold block truncate">
                      {ds.labelRo && ds.labelEn
                        ? (isRo ? ds.labelRo : ds.labelEn)
                        : t(ds.nameKey)}
                    </span>
                    {!isUnlocked && (
                      <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                        {drunkenCoins >= (ds.cost || 0) ? (isRo ? 'Cumpără ➔' : 'Buy ➔') : (isRo ? 'În Bazar' : 'In Shop')}
                      </span>
                    )}
                    {isUnlocked && !isSelected && (
                      <span className="text-[10px] text-gray-400 group-hover:text-amber-300 transition-colors block mt-0.5">
                        {isRo ? 'Apasă pt. echipare' : 'Click to equip'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER 4: 👑 TITLU PROFIL & HERALDICĂ (Profile Titles)                */}
      {/* ========================================================================= */}
      {activeChapter === 'profile_title' && (
        <div className="w-full bg-[#171008] border border-[#ffd700]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2e1f12] pb-2.5 flex-wrap gap-2">
            <div>
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#ffd700]" />
                <span>{isRo ? 'Titlu de Profil & Heraldică' : 'Profile Titles & Heraldry'}</span>
              </h3>
              <p className="text-xs text-gray-400 font-barlow mt-0.5">
                {isRo
                  ? 'Alege titlul de noblețe sau rangul monastic afișat pe profilul tău și în clasamente!'
                  : 'Equip your monastic rank or exclusive noble title on your profile and leaderboards!'}
              </p>
            </div>
          </div>

          {/* ACTIVE PROFILE SUMMARY CARD */}
          <div className="w-full bg-gradient-to-r from-[#2c1d0b] via-[#201509] to-[#150d06] border-2 border-[#ffd700] rounded-2xl p-3.5 sm:p-4 shadow-[0_0_20px_rgba(255,215,0,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border-2 border-[#ffd700] flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                <span>{activeProfile?.avatarIcon === 'monk_drunk' ? '🍺' : activeProfile?.avatarIcon === 'knight' ? '🛡️' : '🧙‍♂️'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-cinzel font-black text-sm sm:text-base text-white truncate">
                    {activeProfile?.name || (isRo ? 'Călugărul Tău' : 'Your Monk')}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#3d2711] border border-[#ffd700]/50 text-[#ffd700] font-mono text-xs font-bold">
                    Nv. {activeProfileProgression?.currentLevel || 1}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-gray-400 font-barlow">{isRo ? 'Titlu Echipat:' : 'Equipped Title:'}</span>
                  <span className="font-cinzel font-bold text-xs text-[#ffd700] bg-black/40 border border-[#ffd700]/40 px-2 py-0.5 rounded-md shadow-sm">
                    👑 {currentEquippedTitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Selector if multiple profiles */}
            {profiles.length > 1 && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs text-gray-400 font-barlow">{isRo ? 'Profil:' : 'Profile:'}</span>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="bg-[#1c1208] border border-[#ffd700]/60 rounded-xl px-2.5 py-1 text-xs font-cinzel font-bold text-[#ffd700] focus:outline-none cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Nv. {calculateProgression(p.totalXP || 0).currentLevel})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SUB-TABS: Ranks vs Exclusive Titles */}
          <div className="flex items-center gap-2 border-b border-[#2e1f12] pb-2">
            <button
              type="button"
              onClick={() => setTitleSubTab('ranks')}
              className={`px-3.5 py-1.5 rounded-xl font-cinzel font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                titleSubTab === 'ranks'
                  ? 'bg-[#ffd700] text-black shadow'
                  : 'bg-[#22160c] text-amber-200/70 hover:text-white'
              }`}
            >
              <span>📜</span>
              <span>{isRo ? 'Ranguri Monastice (20 Niveluri)' : 'Monastic Ranks (20 Levels)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTitleSubTab('exclusive')}
              className={`px-3.5 py-1.5 rounded-xl font-cinzel font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                titleSubTab === 'exclusive'
                  ? 'bg-[#ffd700] text-black shadow'
                  : 'bg-[#22160c] text-amber-200/70 hover:text-white'
              }`}
            >
              <span>✨</span>
              <span>{isRo ? 'Titluri Exclusive din Bazar' : 'Exclusive Shop Titles'}</span>
            </button>
          </div>

          {/* SUB-TAB 1: MONASTIC RANKS FROM PROGRESSION */}
          {titleSubTab === 'ranks' && (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {RANK_TITLES.map((rt) => {
                const currentLevel = activeProfileProgression?.currentLevel || 1;
                const isLevelUnlocked = currentLevel >= rt.minLevel;
                const isEquipped = isRo
                  ? activeProfile?.currentTitle_ro === rt.titleRo
                  : activeProfile?.currentTitle_en === rt.titleEn;

                return (
                  <div
                    key={rt.minLevel}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'bg-gradient-to-r from-[#2c1d0b] to-[#1c1207] border-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.25)]'
                        : isLevelUnlocked
                        ? 'bg-[#140e08] border-[#2e2013] hover:border-amber-700/60'
                        : 'bg-[#100b06] border-[#22170d] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl drop-shadow">{rt.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-cinzel font-bold text-xs sm:text-sm truncate ${rt.color || 'text-amber-200'}`}>
                            {isRo ? rt.titleRo : rt.titleEn}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/60 border border-white/10 text-gray-300 flex-shrink-0">
                            Nv. {rt.minLevel}+
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-barlow block truncate">
                          {isLevelUnlocked
                            ? (isRo ? 'Deblocat prin pelerinaj și XP' : 'Unlocked through pilgrimage XP')
                            : (isRo ? `Necesită Nivelul ${rt.minLevel}` : `Requires Level ${rt.minLevel}`)}
                        </span>
                      </div>
                    </div>

                    {isLevelUnlocked ? (
                      <button
                        type="button"
                        onClick={() =>
                          equipCustomTitle(
                            `rank_${rt.minLevel}`,
                            rt.titleRo,
                            rt.titleEn,
                            activeProfile?.id
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold transition-all flex-shrink-0 cursor-pointer active:scale-95 ${
                          isEquipped
                            ? 'bg-emerald-600 text-white shadow flex items-center gap-1'
                            : 'bg-[#2a1b0e] text-amber-200 border border-[#ffd700]/50 hover:bg-[#3d2713] hover:text-white'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{isRo ? 'Echipat' : 'Equipped'}</span>
                          </>
                        ) : (
                          <span>{isRo ? 'Echipează' : 'Equip'}</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-red-400/80 font-cinzel font-bold flex items-center gap-1 flex-shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>Nv. {rt.minLevel}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-TAB 2: EXCLUSIVE SHOP TITLES */}
          {titleSubTab === 'exclusive' && (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {exclusiveTitles.map((item) => {
                const isOwned = isItemPurchased(item.id) || isItemPurchased(item.key);
                const isEquipped = isRo
                  ? activeProfile?.currentTitle_ro === item.nameRo
                  : activeProfile?.currentTitle_en === item.nameEn;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'bg-gradient-to-r from-[#2c1d0b] to-[#1c1207] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                        : isOwned
                        ? 'bg-[#140e08] border-[#2e2013]'
                        : 'bg-gradient-to-r from-[#201309] to-[#120a05] border-amber-900/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] flex items-center gap-1.5 truncate">
                        <span>{item.icon}</span>
                        <span className="truncate">{isRo ? item.nameRo : item.nameEn}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-barlow mt-0.5 line-clamp-1">
                        {isRo ? item.descRo : item.descEn}
                      </div>
                    </div>

                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() =>
                          equipCustomTitle(item.id, item.nameRo, item.nameEn, activeProfile?.id)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold flex-shrink-0 transition-all cursor-pointer active:scale-95 ${
                          isEquipped
                            ? 'bg-emerald-600 text-white shadow flex items-center gap-1'
                            : 'bg-[#2a1b0e] text-amber-200 border border-[#ffd700]/50 hover:bg-[#3d2713] hover:text-white'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{isRo ? 'Echipat' : 'Equipped'}</span>
                          </>
                        ) : (
                          <span>{isRo ? 'Echipează' : 'Equip'}</span>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (drunkenCoins >= item.cost) {
                            purchaseShopItem(item.id, item.cost, () =>
                              equipCustomTitle(item.id, item.nameRo, item.nameEn, activeProfile?.id)
                            );
                          }
                        }}
                        disabled={drunkenCoins < item.cost}
                        className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold flex-shrink-0 transition-all flex items-center gap-1 ${
                          drunkenCoins >= item.cost
                            ? 'bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-black font-black hover:brightness-110 active:scale-95 shadow cursor-pointer'
                            : 'bg-[#24150b] text-gray-500 border border-gray-800 cursor-not-allowed opacity-70'
                        }`}
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
        </div>
      )}

      {/* CS-STYLE CHESTS MODAL BANNER SHORTCUT (If on any other tab) */}
      {activeChapter !== 'chests' && (
        <div className="w-full bg-gradient-to-r from-[#2a1708] via-[#1a0f05] to-[#120803] border-2 border-[#ffd700]/80 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(255,215,0,0.2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-[#ffd700] flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              🎁
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] flex items-center gap-2">
                <span>{isRo ? 'Cufere & Ruletă CS-Style' : 'CS-Style Chest Openings'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold animate-pulse">
                  ★ NOU
                </span>
              </h4>
              <p className="text-[11px] text-gray-300 font-barlow">
                {isRo
                  ? 'Învârte banda pentru a debloca skin-uri rare de zaruri, fundaluri și titluri!'
                  : 'Spin the roulette tape to unlock rare dice skins, backgrounds and titles!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowChestModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black font-cinzel font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{isRo ? 'Deschide' : 'Open'}</span>
          </button>
        </div>
      )}

      {/* Case Opening Modal */}
      {showChestModal && (
        <ChestOpeningModal
          isOpen={showChestModal}
          onClose={() => setShowChestModal(false)}
          onBackToStore={() => setShowChestModal(false)}
        />
      )}
    </div>
  );
};

