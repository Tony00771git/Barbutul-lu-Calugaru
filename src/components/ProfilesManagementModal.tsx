import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarModal } from './AvatarModal';
import { Profile } from '../types';

interface ProfilesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfileForPlayer?: (profile: Profile) => void;
}

export const ProfilesManagementModal: React.FC<ProfilesManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectProfileForPlayer,
}) => {
  const {
    profiles,
    addProfile,
    deleteProfile,
    updateProfileAvatar,
    resetAllStats,
    autoSaveNewProfiles,
    setAutoSaveNewProfiles,
    language,
    t,
  } = useApp();
  const { user } = useAuth();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newAvatarId, setNewAvatarId] = useState<string>('monk_drunk');
  const [avatarPickerProfileId, setAvatarPickerProfileId] = useState<string | 'new' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

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

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div
      onClick={onClose}
      style={{ zIndex: 99990 }}
      className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        className="w-full max-w-md bg-gradient-to-b from-[#1b140c] via-[#130d07] to-[#0a0704] border-2 border-[#ffd700] rounded-2xl p-4 sm:p-5 shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] space-y-3.5 relative text-left gold-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d1e11] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="font-cinzel font-black text-base sm:text-lg text-[#ffd700] gold-text-glow leading-tight">
                {language === 'ro' ? 'Profilurile Tale' : 'Your Saved Profiles'}
              </h2>
              <span className="text-[10px] text-gray-400 font-barlow">
                {profiles.length} {language === 'ro' ? 'personaje salvate' : 'profiles tracked'}
                {user && ' • ☁️ Cloud Sync'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#22180e] hover:bg-[#332415] border border-[#ffd700]/40 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Auto-Save Toggle Switch (Key User Request) */}
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
                ? 'Generează automat profil pentru nume noi introduse în meci.'
                : 'Automatically create a profile when a new name plays.'}
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

        {/* Action Button: Add Profile Toggle */}
        <div className="flex items-center justify-between gap-2">
          {profiles.length > 4 && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'ro' ? '🔍 Caută profil...' : '🔍 Search profile...'}
              className="flex-1 bg-[#100b07] border border-[#2d1e12] focus:border-[#ffd700] rounded-xl px-2.5 py-1 text-xs text-[#f0ebe0] placeholder-gray-500 focus:outline-none font-barlow"
            />
          )}

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`py-1.5 px-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
              showAddForm
                ? 'bg-[#281c10] border border-[#ffd700]/50 text-[#ffd700]'
                : 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black hover:brightness-110 ml-auto'
            }`}
          >
            <span>{showAddForm ? '✕' : '+'}</span>
            <span>{showAddForm ? (language === 'ro' ? 'Anulează' : 'Cancel') : (language === 'ro' ? 'Adaugă Profil Nou' : 'Add New Profile')}</span>
          </button>
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
                className="w-10 h-10 rounded-xl bg-[#1d140c] border-2 border-[#ffd700] overflow-hidden flex-shrink-0 relative group hover:scale-105 active:scale-95 transition-all shadow"
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
                className={`py-2 px-3 rounded-xl font-cinzel font-bold text-xs transition-all shadow ${
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

        {/* Scrollable Profiles List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar min-h-[140px] max-h-[300px]">
          {filteredProfiles.length === 0 ? (
            <div className="p-4 bg-[#0d0905] border border-[#24180d] rounded-xl text-center space-y-1">
              <span className="text-2xl">👤</span>
              <p className="text-xs font-cinzel text-[#ffd700]">
                {language === 'ro' ? 'Nu ai profiluri salvate încă.' : 'No saved profiles found.'}
              </p>
              <p className="text-[10px] text-gray-400 font-barlow">
                {language === 'ro'
                  ? 'Apasă pe "Adaugă Profil Nou" sau pornește un joc cu auto-salvare activată.'
                  : 'Click "Add New Profile" or play a game with auto-save enabled.'}
              </p>
            </div>
          ) : (
            filteredProfiles.map((p) => {
              const totalScore = p.totalSips + 25 * p.totalChugs;
              const totalWins = (p.winsBoardgame || 0) + (p.winsDuel || 0) + (p.winsCasino || 0) + (p.winsPineapple || 0);

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl border border-[#261c11] bg-[#100b07] hover:border-[#ffd700]/50 hover:bg-[#18110a] transition-all group"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setAvatarPickerProfileId(p.id)}
                      className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-[#080503] border border-[#ffd700]/40 shadow relative group hover:scale-105 transition-all"
                      title={language === 'ro' ? 'Schimbă avatarul profilului' : 'Change avatar'}
                    >
                      <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full p-0.5" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white">
                        ✏️
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-cinzel font-bold text-xs sm:text-sm text-[#f0ebe0] truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#ffd700] bg-[#ffd700]/10 px-1.5 py-0.2 rounded border border-[#ffd700]/20 flex-shrink-0">
                          {totalScore} <span className="text-[8px] text-gray-400">pct</span>
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-400 font-barlow flex items-center gap-2 mt-0.5">
                        <span>🍺 {p.totalSips} {t('sipsUnit')}</span>
                        <span>🕳️ {p.totalChugs} {t('chugsUnit')}</span>
                        <span className="text-amber-400 font-mono font-bold">🏆 {totalWins}</span>
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
                        className="py-1 px-2.5 rounded-lg bg-[#281c10] border border-[#ffd700]/40 hover:bg-[#ffd700] hover:text-black text-[#ffd700] text-[11px] font-cinzel font-bold transition-all shadow"
                        title={language === 'ro' ? 'Alege ca Jucător 1' : 'Select as Player 1'}
                      >
                        {language === 'ro' ? 'Alege' : 'Select'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteProfile(p.id)}
                      className="w-7 h-7 rounded-lg bg-[#1a0e0e] border border-red-900/40 text-red-400 hover:bg-red-950 hover:text-red-200 text-xs flex items-center justify-center transition-all"
                      title={language === 'ro' ? 'Șterge profilul' : 'Delete profile'}
                    >
                      ✕
                    </button>
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
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-cinzel font-black text-[11px] shadow disabled:opacity-50"
              >
                {isResetting
                  ? (language === 'ro' ? 'Se resetează...' : 'Resetting...')
                  : (language === 'ro' ? 'Da, resetează la 0' : 'Yes, reset to 0')}
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-gray-300 font-cinzel text-[11px]"
              >
                {language === 'ro' ? 'Anulează' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center px-1">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-[11px] text-red-400/80 hover:text-red-300 font-cinzel underline underline-offset-2 flex items-center gap-1"
            >
              <span>🗑️</span>
              <span>{language === 'ro' ? 'Resetează toate statisticile la 0' : 'Reset all stats to 0'}</span>
            </button>
          </div>
        )}

        {/* Footer info & Close */}
        <div className="pt-1 border-t border-[#2a1d10] flex items-center justify-between text-xs font-barlow text-gray-400">
          <span>
            {language === 'ro' ? 'Păstrat local & cloud' : 'Saved locally & cloud'}
          </span>
          <button
            onClick={onClose}
            className="py-1 px-3 rounded-lg bg-[#1a120b] border border-[#332415] hover:border-[#ffd700] text-[#ffd700] font-cinzel font-bold text-xs transition-all"
          >
            {language === 'ro' ? 'Gata' : 'Done'}
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
    </div>
  );
};
