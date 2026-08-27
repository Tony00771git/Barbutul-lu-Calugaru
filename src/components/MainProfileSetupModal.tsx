import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from './AvatarDisplay';
import { MEDIEVAL_AVATARS, getAvatarById } from '../data/avatars';
import { Profile } from '../types';
import { soundEffects } from '../lib/soundFx';

interface MainProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (name: string, avatarIcon: string) => Promise<void> | void;
  isEditing?: boolean;
}

export const MainProfileSetupModal: React.FC<MainProfileSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isEditing = false,
}) => {
  const { user, cloudProfile, markMainProfileAsSet } = useAuth();
  const { profiles, masterProfile, subProfiles, setMainProfile, language, t } = useApp();

  const defaultSuggestedName =
    masterProfile?.name ||
    user?.displayName ||
    (language === 'ro' ? 'Starețul Mănăstirii' : 'Abbey Master');

  const defaultSuggestedAvatar = masterProfile?.avatarIcon || 'monk_master';

  const [name, setName] = useState<string>(defaultSuggestedName);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(defaultSuggestedAvatar);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialName =
        masterProfile?.name ||
        user?.displayName ||
        (language === 'ro' ? 'Starețul Mănăstirii' : 'Abbey Master');
      const initialAvatar = masterProfile?.avatarIcon || 'monk_master';
      setName(initialName);
      setSelectedAvatar(initialAvatar);
      setErrorMessage(null);
    }
  }, [isOpen, masterProfile, user, language]);

  if (!isOpen) return null;

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(
        language === 'ro'
          ? 'Imaginea depășește limita de 2MB. Alege o imagine mai mică.'
          : 'Image exceeds 2MB limit. Please choose a smaller file.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomAvatarPreview(result);
      setSelectedAvatar(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage(
        language === 'ro' ? 'Te rugăm să introduci un nume de profil.' : 'Please enter a profile name.'
      );
      return;
    }
    if (trimmed.length < 2) {
      setErrorMessage(
        language === 'ro'
          ? 'Numele trebuie să aibă cel puțin 2 caractere.'
          : 'Name must be at least 2 characters.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm(trimmed, selectedAvatar);
      } else {
        await setMainProfile(trimmed, selectedAvatar);
      }
      await markMainProfileAsSet();
      soundEffects.playLevelUpFanfare();
      onClose();
    } catch (err: any) {
      console.error('Failed to set main profile:', err);
      setErrorMessage(
        language === 'ro'
          ? 'A apărut o eroare la salvarea profilului. Te rugăm să reîncerci.'
          : 'An error occurred while saving profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Identify profiles that will be secondary sub-profiles
  const otherProfilesList = profiles.filter(
    (p) => p.name.trim().toLowerCase() !== name.trim().toLowerCase()
  );

  return (
    <div
      style={{ zIndex: 99999 }}
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1f150c] via-[#140d07] to-[#0a0704] border-2 border-[#ffd700] rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-[0_0_60px_rgba(255,215,0,0.35)] flex flex-col max-h-[92vh] space-y-4 text-left relative overflow-hidden"
      >
        {/* Top Glowing Ornament */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent shadow-[0_0_15px_#ffd700]" />

        {/* Header with Google Play Badge */}
        <div className="flex items-start justify-between border-b border-[#2e2013] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2e1d0f] to-[#120a04] border border-[#ffd700] flex items-center justify-center text-2xl shadow-lg relative">
              <span>👑</span>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white border border-black font-bold">
                ✓
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Google Play Games
                </span>
                {isEditing && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    {language === 'ro' ? 'Modificare' : 'Edit Mode'}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-cinzel font-black text-[#ffd700] gold-text-glow leading-tight mt-0.5">
                {isEditing
                  ? language === 'ro'
                    ? 'Modifică Profilul Principal'
                    : 'Edit Main Master Profile'
                  : language === 'ro'
                  ? 'Setează-ți Profilul Principal'
                  : 'Set Your Main Profile'}
              </h2>
            </div>
          </div>

          {isEditing && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#251a10] border border-gray-600 hover:border-[#ffd700] text-gray-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
            >
              ✕
            </button>
          )}
        </div>

        {/* Informational Guidance Card */}
        <div className="bg-[#120a04]/90 border border-[#382615] rounded-2xl p-3 sm:p-3.5 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-[#ffd700]">
            <span>📜</span>
            <span>
              {language === 'ro'
                ? 'Identitatea de Căpetenie a Mănăstirii'
                : 'Primary Abbey Master Identity'}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-300 font-barlow leading-relaxed">
            {language === 'ro'
              ? 'Acest profil va reprezenta contul tău principal pe Google Play, salvat în cloud și vizibil în topul mondial. Toate celelalte profiluri existente vor deveni automat subprofiluri asociate contului tău!'
              : 'This profile represents your primary Master Google Play identity, synced in the cloud and shown on leaderboards. All other created profiles will become sub-profiles under your account!'}
          </p>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* 1. Name Input Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-cinzel font-bold text-[#f0ebe0] uppercase tracking-wider">
              {language === 'ro' ? 'Nume Profil Principal:' : 'Main Profile Name:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder={
                  language === 'ro' ? 'Ex: Starețul Andrei, Fratele Vasile...' : 'e.g. Master John'
                }
                className="w-full bg-[#0d0804] border-2 border-[#e8c84a]/60 focus:border-[#ffd700] rounded-2xl px-3.5 py-2.5 text-sm sm:text-base text-white font-cinzel font-bold placeholder-gray-600 focus:outline-none transition-all shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">
                {name.length}/30
              </span>
            </div>
          </div>

          {/* 2. Avatar Selection Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-cinzel font-bold text-[#f0ebe0] uppercase tracking-wider">
                {language === 'ro' ? 'Alege Avatarul Principal:' : 'Select Master Avatar:'}
              </label>
              <label className="text-[10px] font-cinzel font-bold text-[#ffd700] hover:underline cursor-pointer flex items-center gap-1 bg-[#20150b] px-2 py-1 rounded-lg border border-[#e8c84a]/40">
                <span>📁</span>
                <span>{language === 'ro' ? 'Încarcă Poză' : 'Upload Custom'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Currently Selected Avatar Spotlight */}
            <div className="flex items-center gap-3 bg-[#110904] p-2.5 rounded-2xl border border-[#ffd700]/40">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.4)] flex-shrink-0 flex items-center justify-center bg-[#24170c]">
                <AvatarDisplay avatarId={selectedAvatar} className="w-full h-full" />
                <div className="absolute -bottom-1 -right-1 bg-[#ffd700] text-black text-[9px] font-black px-1 rounded shadow">
                  👑
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-cinzel font-black text-[#ffd700] truncate">
                  {name.trim() || (language === 'ro' ? 'Nume Jucător' : 'Player Name')}
                </div>
                <div className="text-[10px] text-gray-400 font-barlow">
                  {getAvatarById(selectedAvatar)?.nameRo || (language === 'ro' ? 'Avatar Personalizat' : 'Custom Avatar')}
                </div>
                <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-500/40">
                  {language === 'ro' ? '👑 Profil Principal' : '👑 Master Profile'}
                </span>
              </div>
            </div>

            {/* Avatars Palette Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-[#0d0804] rounded-2xl border border-[#2b1f13]">
              {MEDIEVAL_AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(av.id);
                      setCustomAvatarPreview(null);
                    }}
                    className={`relative p-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-[#ffd700] bg-[#2e1d0f] shadow-[0_0_12px_rgba(255,215,0,0.5)] scale-105 ring-2 ring-[#ffd700]'
                        : 'border-[#24190f] bg-[#140d07] hover:border-gray-500 hover:scale-100 opacity-80 hover:opacity-100'
                    }`}
                    title={language === 'ro' ? av.nameRo : av.nameEn}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                      <AvatarDisplay avatarId={av.id} className="w-full h-full" />
                    </div>
                    <span className="text-[8px] font-cinzel text-gray-300 truncate max-w-[48px] leading-tight">
                      {language === 'ro' ? av.nameRo.split(' ')[0] : av.nameEn.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-[#ffd700] text-black text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Sub-Profiles Notice & Breakdown */}
          {otherProfilesList.length > 0 && (
            <div className="space-y-1.5 bg-[#120a05] border border-[#291c10] rounded-2xl p-2.5">
              <div className="flex items-center justify-between text-[11px] font-cinzel font-bold text-gray-300">
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  <span>{language === 'ro' ? 'Subprofiluri pe acest cont:' : 'Sub-profiles on this account:'}</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {otherProfilesList.length} {language === 'ro' ? 'profiluri' : 'profiles'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {otherProfilesList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 bg-[#1c130b] border border-[#3d2a17] px-2 py-1 rounded-xl text-[10px] text-gray-300 font-cinzel"
                  >
                    <AvatarDisplay avatarId={p.avatarIcon} className="w-4 h-4 rounded-md" />
                    <span className="truncate max-w-[90px]">{p.name}</span>
                    <span className="text-[8px] text-amber-400/80 font-mono">(Subprofil)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/80 text-xs text-red-200 font-barlow flex items-center gap-2 animate-shake">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl font-cinzel font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-[#ffd700] via-[#f5c742] to-[#ffd700] text-black shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-lg">⏳</span>
                  <span>{language === 'ro' ? 'Se salvează în Cloud...' : 'Saving to Cloud...'}</span>
                </>
              ) : (
                <>
                  <span>👑</span>
                  <span>
                    {language === 'ro'
                      ? 'Confirmă Profilul Principal ➔'
                      : 'Confirm Master Profile ➔'}
                  </span>
                </>
              )}
            </button>

            {!isEditing && (
              <p className="text-[10px] text-center text-gray-400 font-barlow">
                {language === 'ro'
                  ? '* Vei putea modifica oricând numele și avatarul din ecranul de profiluri.'
                  : '* You can always modify your master name and avatar later in profiles.'}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
