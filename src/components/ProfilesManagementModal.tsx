import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarModal } from './AvatarModal';
import { MainProfileSetupModal } from './MainProfileSetupModal';
import { TrophyShowcase } from './TrophyShowcase';
import { FriendProfileStatsModal } from './FriendProfileStatsModal';
import { Profile, FriendEntry } from '../types';
import { calculateProgression } from '../lib/progression';
import { subscribeToFriends } from '../lib/friendsService';

interface ProfilesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfileForPlayer?: (profile: Profile) => void;
  onOpenBazaar?: () => void;
}

export const ProfilesManagementModal: React.FC<ProfilesManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectProfileForPlayer,
  onOpenBazaar,
}) => {
  const {
    profiles,
    masterProfile,
    subProfiles,
    addProfile,
    deleteProfile,
    updateProfileAvatar,
    resetAllStats,
    autoSaveNewProfiles,
    setAutoSaveNewProfiles,
    language,
    t,
  } = useApp();
  const { user, cloudProfile } = useAuth();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showMainSetupModal, setShowMainSetupModal] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newAvatarId, setNewAvatarId] = useState<string>('monk_drunk');
  const [avatarPickerProfileId, setAvatarPickerProfileId] = useState<string | 'new' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Real-time friends list
  const [friendsList, setFriendsList] = useState<FriendEntry[]>([]);
  const [selectedFriendModal, setSelectedFriendModal] = useState<FriendEntry | null>(null);

  useEffect(() => {
    if (!isOpen || !user?.uid) {
      setFriendsList([]);
      return;
    }
    const unsub = subscribeToFriends(
      user.uid,
      (friends) => {
        setFriendsList(friends);
      },
      (err) => {
        console.warn('Friends subscription error in ProfilesManagementModal:', err);
      }
    );
    return () => unsub();
  }, [isOpen, user?.uid]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetAllStats();
      setShowResetConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    addProfile(newProfileName.trim(), newAvatarId);
    setNewProfileName('');
    setNewAvatarId('monk_drunk');
    setShowAddForm(false);
  };

  // Primary/Featured profile to display in the Trophy Showcase
  const featuredProfile = masterProfile || profiles[0] || null;

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99990 }}
      className="fixed inset-0 z-[99990] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        className="w-full max-w-lg bg-gradient-to-b from-[#1b140c] via-[#130d07] to-[#0a0704] border-2 border-[#ffd700] rounded-2xl p-3.5 sm:p-5 shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col h-[90vh] max-h-[90vh] relative text-left gold-glow overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed (flex-shrink-0) */}
        <div className="flex items-center justify-between border-b border-[#2d1e11] pb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="font-cinzel font-black text-base sm:text-lg text-[#ffd700] gold-text-glow leading-tight uppercase">
                {language === 'ro' ? 'PROFILURI ȘI STATISTICI' : 'PROFILES & STATISTICS'}
              </h2>
              <span className="text-[10px] text-gray-400 font-barlow">
                {language === 'ro'
                  ? 'Profiluri, sala trofeelor, vitrina de rarități și prieteni'
                  : 'Profiles, trophy hall, rarity showcase & friends'}
                {user && ' • ☁️ Cloud Sync'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#22180e] hover:bg-[#332415] border border-[#ffd700]/40 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body - Guaranteed Smooth Scrolling on all devices */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 custom-scrollbar pr-1">
          
          {/* Master Profile Configure Quick Card */}
          {masterProfile && (
            <div className="bg-gradient-to-r from-[#26170a] via-[#1c1107] to-[#26170a] border border-[#ffd700]/70 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#ffd700] bg-[#120a05] flex-shrink-0">
                  <AvatarDisplay avatarId={masterProfile.avatarIcon || 'monk_master'} className="w-full h-full p-0.5" />
                  <span className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black text-[8px] font-black px-0.5 rounded">👑</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-cinzel font-black text-xs sm:text-sm text-[#ffd700] truncate">{masterProfile.name}</span>
                    <span className="text-[8px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                      {language === 'ro' ? '👑 Principal' : '👑 Master'}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-barlow block truncate">
                    {language === 'ro' ? 'Profilul tău de căpetenie pe Google Play' : 'Your primary Google Play identity'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMainSetupModal(true)}
                className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black text-[10px] font-cinzel font-bold hover:brightness-110 transition-all shadow flex-shrink-0 cursor-pointer"
              >
                {language === 'ro' ? '👑 Editează' : '👑 Edit Master'}
              </button>
            </div>
          )}

          {/* Auto-Save Toggle Switch */}
          <div className="bg-[#0e0a05] border border-[#2b1f13] rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">⚡</span>
                <span className="text-xs font-cinzel font-bold text-[#f0ebe0] truncate">
                  {language === 'ro' ? 'Auto-salvează jucători noi' : 'Auto-save new players'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-barlow leading-tight mt-0.5">
                {language === 'ro'
                  ? 'Generează automat subprofil pentru nume noi introduse în meci.'
                  : 'Automatically create a sub-profile when a new name plays.'}
              </p>
            </div>

            {/* iOS-Style Toggle Button */}
            <button
              type="button"
              onClick={() => setAutoSaveNewProfiles(!autoSaveNewProfiles)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSaveNewProfiles ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a]' : 'bg-[#2a2219]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoSaveNewProfiles ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* VITRINA DE TROFEE, CELE 3 PIEDESTALE & CEI 4 STÂLPI AI GLORIEI */}
          {featuredProfile && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🏆</span>
                  <span className="text-xs font-cinzel font-black text-[#ffd700] uppercase tracking-wider">
                    {language === 'ro' ? 'Sala Trofeelor & Vitrina' : 'Trophy Hall & Showcase'}
                  </span>
                </div>
                {onOpenBazaar && (
                  <button
                    type="button"
                    onClick={onOpenBazaar}
                    className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-700 to-yellow-600 hover:brightness-110 text-black font-cinzel font-black text-[10px] shadow transition-all active:scale-95 cursor-pointer"
                  >
                    {language === 'ro' ? 'Bazar 🛒' : 'Bazaar 🛒'}
                  </button>
                )}
              </div>
              <TrophyShowcase
                profile={featuredProfile}
                isEditable={true}
                onOpenShop={onOpenBazaar}
              />
            </div>
          )}

          {/* PRIETENI & FRAȚI DE PAHAR AVATARE ȘI STATISTICI */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1b1209] via-[#140c06] to-[#0c0804] border-2 border-[#e8c84a]/60 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#2d1f13] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <div>
                  <h3 className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] gold-text-glow">
                    {language === 'ro' ? 'Prieteni & Frați de Pahar' : 'Friends & Tavern Companions'}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-barlow">
                    {friendsList.length > 0
                      ? (language === 'ro'
                          ? `${friendsList.length} prieteni conectați • Atinge poza pt. detalii`
                          : `${friendsList.length} connected friends • Tap avatar for stats`)
                      : (language === 'ro'
                          ? 'Conectează-te cu Google pt. a sincroniza prietenii'
                          : 'Sign in with Google to link friends and avatars')}
                  </span>
                </div>
              </div>
              {friendsList.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-[#ffd700] font-mono font-bold border border-amber-500/40">
                  {friendsList.length} 👤
                </span>
              )}
            </div>

            {friendsList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {friendsList.map((friend) => (
                  <button
                    key={friend.friendUid}
                    type="button"
                    onClick={() => setSelectedFriendModal(friend)}
                    className="p-2 rounded-xl bg-[#110a05] border border-[#2d1e11] hover:border-[#ffd700] hover:bg-[#1f140a] transition-all flex items-center gap-2 text-left cursor-pointer group shadow"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1a120b] border border-[#e8c84a] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                      <AvatarDisplay avatarId={friend.avatarIcon || 'monk_drunk'} className="w-full h-full p-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-cinzel font-bold text-xs text-[#f0ebe0] truncate group-hover:text-[#ffd700] transition-colors">
                        {friend.displayName}
                      </div>
                      <div className="text-[9px] text-amber-400 font-barlow flex items-center gap-1 truncate">
                        <span className="bg-amber-500/20 px-1 rounded text-amber-300 font-bold">Nv. {friend.currentLevel || 1}</span>
                        <span className="text-gray-400 truncate">{friend.shortId ? `#${friend.shortId}` : ''}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-[#0d0905] border border-[#261a0e] rounded-xl flex items-center gap-2">
                <span className="text-xl">🍺</span>
                <div className="text-[10px] text-gray-400 font-barlow">
                  {language === 'ro'
                    ? 'Nu ai prieteni adăugați încă. Mergi la tabul Prieteni pentru a trimite cereri!'
                    : 'No friends connected yet. Head to the Friends tab to share IDs and connect!'}
                </div>
              </div>
            )}
          </div>

          {/* Action Button: Add Profile Toggle & Search */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-cinzel font-bold text-[#ffd700] uppercase tracking-wider">
                {language === 'ro' ? 'Toate Profilurile' : 'All Profiles'} ({profiles.length})
              </span>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className={`py-1.5 px-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer ${
                  showAddForm
                    ? 'bg-[#281c10] border border-[#ffd700]/50 text-[#ffd700]'
                    : 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black hover:brightness-110'
                }`}
              >
                <span>{showAddForm ? '✕' : '+'}</span>
                <span>{showAddForm ? (language === 'ro' ? 'Anulează' : 'Cancel') : (language === 'ro' ? 'Adaugă Subprofil' : 'Add Sub-profile')}</span>
              </button>
            </div>

            {profiles.length > 4 && (
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ro' ? '🔍 Caută profil...' : '🔍 Search profile...'}
                className="w-full bg-[#100b07] border border-[#2d1e12] focus:border-[#ffd700] rounded-xl px-2.5 py-1.5 text-xs text-[#f0ebe0] placeholder-gray-500 focus:outline-none font-barlow"
              />
            )}
          </div>

          {/* Inline Add Profile Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="bg-[#0e0a05] border-2 border-[#ffd700]/60 p-3 rounded-xl space-y-2.5 animate-fade-in shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-cinzel font-bold text-[#ffd700] uppercase">
                  📜 {language === 'ro' ? 'Creare Personaj Nou' : 'Create New Monk Profile'}
                </span>
                <span className="text-[10px] text-gray-400 font-barlow">
                  {language === 'ro' ? 'Apasă avatarul pt. schimbare' : 'Tap avatar to pick icon'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarPickerProfileId('new')}
                  className="w-10 h-10 rounded-xl bg-[#1d140c] border-2 border-[#ffd700] overflow-hidden flex-shrink-0 relative group hover:scale-105 active:scale-95 transition-all shadow cursor-pointer"
                  title={language === 'ro' ? 'Alege avatar' : 'Pick avatar'}
                >
                  <AvatarDisplay avatarId={newAvatarId} className="w-full h-full p-0.5" />
                  <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shadow">
                    +
                  </div>
                </button>

                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder={language === 'ro' ? 'Numele călugărului...' : 'Profile name...'}
                  className="flex-1 bg-[#140e08] border border-[#2e2013] focus:border-[#ffd700] rounded-xl px-3 py-2 text-xs text-[#f0ebe0] focus:outline-none font-barlow"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className={`py-2 px-3 rounded-xl font-cinzel font-bold text-xs transition-all shadow cursor-pointer ${
                    newProfileName.trim()
                      ? 'bg-[#ffd700] text-black hover:brightness-110'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {language === 'ro' ? 'Salvează' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* Profiles List */}
          <div className="space-y-2">
            {filteredProfiles.length === 0 ? (
              <div className="p-4 bg-[#0d0905] border border-[#24180d] rounded-xl text-center space-y-1">
                <span className="text-2xl">👤</span>
                <p className="text-xs font-cinzel text-[#ffd700]">
                  {language === 'ro' ? 'Nu ai profiluri salvate încă.' : 'No saved profiles found.'}
                </p>
                <p className="text-[10px] text-gray-400 font-barlow">
                  {language === 'ro'
                    ? 'Apasă pe "Adaugă Subprofil" sau pornește un joc cu auto-salvare activată.'
                    : 'Click "Add Sub-profile" or play a game with auto-save enabled.'}
                </p>
              </div>
            ) : (
              filteredProfiles.map((p) => {
                const totalScore = p.totalSips + 25 * p.totalChugs;
                const totalWins =
                  (p.winsBoardgame || 0) +
                  (p.winsDuel || 0) +
                  (p.winsCasino || 0) +
                  (p.winsPineapple || 0) +
                  (p.winsCrash || 0);
                const isMaster = p.isMaster || (masterProfile && p.id === masterProfile.id);

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all group ${
                      isMaster
                        ? 'border-[#ffd700] bg-[#1a1107] shadow-[0_0_10px_rgba(255,215,0,0.15)] ring-1 ring-[#ffd700]/50'
                        : 'border-[#261c11] bg-[#100b07] hover:border-[#ffd700]/50 hover:bg-[#18110a]'
                    }`}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setAvatarPickerProfileId(p.id)}
                        className={`w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-[#080503] border shadow relative group hover:scale-105 transition-all cursor-pointer ${
                          isMaster ? 'border-[#ffd700]' : 'border-[#ffd700]/40'
                        }`}
                        title={language === 'ro' ? 'Schimbă avatarul profilului' : 'Change avatar'}
                      >
                        <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full p-0.5" />
                        {isMaster && (
                          <span className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black text-[8px] font-black px-0.5 rounded shadow">
                            👑
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white">
                          ✏️
                        </div>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-cinzel font-bold text-xs sm:text-sm truncate ${isMaster ? 'text-[#ffd700]' : 'text-[#f0ebe0]'}`}>
                            {p.name}
                          </span>
                          {isMaster ? (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950 text-[#ffd700] border border-[#ffd700]/60">
                              👑 {language === 'ro' ? 'Principal' : 'Master'}
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-black/50 text-gray-400 border border-gray-700/50">
                              👥 {language === 'ro' ? 'Subprofil' : 'Sub-profile'}
                            </span>
                          )}
                          {(() => {
                            const prog = calculateProgression(p.totalXP || 0);
                            const customEquipped = language === 'ro' ? p.currentTitle_ro : p.currentTitle_en;
                            const titleToShow = customEquipped || (language === 'ro' ? prog.titleRo : prog.titleEn);
                            const isCustom = Boolean(customEquipped);
                            return (
                              <>
                                <span className="text-[9px] font-cinzel font-bold px-1.5 py-0.2 rounded-full bg-amber-600/90 text-white border border-amber-400/40">
                                  Nv. {prog.currentLevel}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-cinzel font-bold flex items-center gap-0.5 shadow-sm ${
                                    isCustom
                                      ? 'bg-gradient-to-r from-amber-950 via-[#2f1c07] to-amber-950 border border-[#ffd700] text-[#ffd700]'
                                      : 'bg-black/60 border border-white/10 text-amber-200'
                                  }`}
                                >
                                  <span>{isCustom ? '👑' : prog.titleIcon}</span>
                                  <span className="truncate max-w-[120px]">{titleToShow}</span>
                                </span>
                              </>
                            );
                          })()}
                          <span className="text-[10px] font-mono text-[#ffd700] bg-[#ffd700]/10 px-1.5 py-0.2 rounded border border-[#ffd700]/20 flex-shrink-0 ml-auto">
                            {totalScore} <span className="text-[8px] text-gray-400">pct</span>
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-400 font-barlow flex items-center gap-2 mt-0.5">
                          <span>🍺 {p.totalSips} {t('sipsUnit')}</span>
                          <span>🕳️ {p.totalChugs} {t('chugsUnit')}</span>
                          <span className="text-amber-400 font-mono font-bold">🏆 {totalWins} {language === 'ro' ? 'victorii' : 'wins'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Actions: Select / Delete */}
                    <div className="flex items-center gap-1.5 pl-2 flex-shrink-0">
                      {onSelectProfileForPlayer && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProfileForPlayer(p);
                            onClose();
                          }}
                          className="py-1 px-2.5 rounded-lg bg-[#281c10] border border-[#ffd700]/40 hover:bg-[#ffd700] hover:text-black text-[#ffd700] text-[11px] font-cinzel font-bold transition-all shadow cursor-pointer"
                          title={language === 'ro' ? 'Alege ca Jucător 1' : 'Select as Player 1'}
                        >
                          {language === 'ro' ? 'Alege' : 'Select'}
                        </button>
                      )}

                      {!isMaster && (
                        <button
                          type="button"
                          onClick={() => deleteProfile(p.id)}
                          className="w-7 h-7 rounded-lg bg-[#1a0e0e] border border-red-900/40 text-red-400 hover:bg-red-950 hover:text-red-200 text-xs flex items-center justify-center transition-all cursor-pointer"
                          title={language === 'ro' ? 'Șterge subprofilul' : 'Delete sub-profile'}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reset stats option */}
          {showResetConfirm ? (
            <div className="p-2.5 bg-red-950/50 border border-red-500/50 rounded-xl flex flex-col gap-2">
              <p className="text-[11px] text-red-200 font-cinzel font-bold text-center">
                {language === 'ro'
                  ? '⚠️ Resetezi toate statisticile, XP-ul, nivelurile și realizările la 0 (Local & Cloud)?'
                  : '⚠️ Reset all stats, XP, levels & achievements to 0 (Local & Cloud)?'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-cinzel font-black text-[11px] shadow disabled:opacity-50 cursor-pointer"
                >
                  {isResetting
                    ? (language === 'ro' ? 'Se resetează...' : 'Resetting...')
                    : (language === 'ro' ? 'Da, resetează la 0' : 'Yes, reset to 0')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-gray-300 font-cinzel text-[11px] cursor-pointer"
                >
                  {language === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center px-1 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] text-red-400/80 hover:text-red-300 font-cinzel underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>🗑️</span>
                <span>{language === 'ro' ? 'Resetează toate statisticile la 0' : 'Reset all stats to 0'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info & Close - Fixed (flex-shrink-0) */}
        <div className="pt-2.5 border-t border-[#2a1d10] flex items-center justify-between text-xs font-barlow text-gray-400 flex-shrink-0">
          <span>
            {language === 'ro' ? 'Păstrat local & cloud' : 'Saved locally & cloud'}
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black font-cinzel font-black text-xs hover:brightness-110 transition-all shadow cursor-pointer"
          >
            {language === 'ro' ? 'Gata ➔' : 'Done ➔'}
          </button>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {avatarPickerProfileId !== null && (
        <AvatarModal
          isOpen={true}
          currentAvatarId={
            avatarPickerProfileId === 'new'
              ? newAvatarId
              : profiles.find((p) => p.id === avatarPickerProfileId)?.avatarIcon || 'monk_drunk'
          }
          onSelectAvatar={(id) => {
            if (avatarPickerProfileId === 'new') {
              setNewAvatarId(id);
            } else {
              updateProfileAvatar(avatarPickerProfileId, id);
            }
            setAvatarPickerProfileId(null);
          }}
          onClose={() => setAvatarPickerProfileId(null)}
        />
      )}

      {/* Main Profile Setup Modal (Master Profile Configuration) */}
      <MainProfileSetupModal
        isOpen={showMainSetupModal}
        onClose={() => setShowMainSetupModal(false)}
      />

      {/* Friend Detail Modal with Full Statistics & Showcase */}
      {selectedFriendModal && (
        <FriendProfileStatsModal
          friend={selectedFriendModal}
          isOpen={Boolean(selectedFriendModal)}
          onClose={() => setSelectedFriendModal(null)}
        />
      )}
    </div>
  );
};
