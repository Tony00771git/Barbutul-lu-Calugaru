import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { ProfilesManagementModal } from './ProfilesManagementModal';

interface ProfilesOverviewSectionProps {
  onOpenScoreModal?: () => void;
  onSelectProfile?: (profile: Profile) => void;
  selectedProfileName?: string;
  className?: string;
}

export const ProfilesOverviewSection: React.FC<ProfilesOverviewSectionProps> = ({
  onOpenScoreModal,
  onSelectProfile,
  selectedProfileName,
  className = '',
}) => {
  const { profiles, autoSaveNewProfiles, setAutoSaveNewProfiles, language, t } = useApp();
  const { user } = useAuth();

  const [showManagementModal, setShowManagementModal] = useState<boolean>(false);

  return (
    <div className={`w-full bg-gradient-to-b from-[#18130c]/95 via-[#120e08]/95 to-[#0a0704]/95 border border-[#e8c84a]/50 rounded-2xl p-3 sm:p-3.5 shadow-lg backdrop-blur-sm space-y-2.5 ${className}`}>
      {/* Top Header with "Profilurile Tale" Button & Stats */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2b2014] pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#281c0f] border border-[#e8c84a]/60 flex items-center justify-center text-sm shadow">
            👤
          </div>
          <div className="min-w-0">
            <h3 className="font-cinzel font-bold text-xs sm:text-sm text-[#e8c84a] gold-text-glow leading-tight truncate">
              {language === 'ro' ? 'Profilurile Tale' : 'Your Profiles'}
            </h3>
            <span className="text-[10px] text-gray-400 font-barlow truncate block">
              {profiles.length} {language === 'ro' ? 'personaje salvate' : 'saved characters'}
              {user && ` • ☁️ Cloud`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Main "Profilurile Tale" Pop-Up Trigger Button */}
          <button
            type="button"
            onClick={() => setShowManagementModal(true)}
            className="py-1 px-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow hover:brightness-110"
          >
            <span>📜</span>
            <span>{language === 'ro' ? 'Profilurile Tale' : 'Profiles'}</span>
          </button>

          {onOpenScoreModal && (
            <button
              type="button"
              onClick={onOpenScoreModal}
              className="p-1 px-2 rounded-xl bg-[#18120b] border border-[#332617] hover:border-[#e8c84a] text-gray-300 hover:text-white text-xs font-cinzel transition-all shadow"
              title={t('tabProfiles')}
            >
              📊
            </button>
          )}
        </div>
      </div>

      {/* Auto-Save Toggle Row (User explicit request) */}
      <div className="bg-[#0e0a05] border border-[#261c11] rounded-xl p-2 flex items-center justify-between gap-2 shadow-inner">
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">⚡</span>
            <span className="text-[11px] font-cinzel font-bold text-[#f0ebe0] truncate">
              {language === 'ro' ? 'Salvează automat jucătorii noi' : 'Auto-save new players'}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-barlow leading-tight">
            {language === 'ro'
              ? 'Generează automat profil dacă joci cu un nume nou.'
              : 'Creates profile automatically for new player names in matches.'}
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => setAutoSaveNewProfiles(!autoSaveNewProfiles)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoSaveNewProfiles ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a]' : 'bg-[#2a2219]'
          }`}
          title={autoSaveNewProfiles ? 'Auto-salvare activată' : 'Auto-salvare dezactivată'}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
              autoSaveNewProfiles ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Horizontal Carousel for Quick Character Selection */}
      {profiles.length === 0 ? (
        <div
          onClick={() => setShowManagementModal(true)}
          className="p-2.5 bg-[#0d0905] border border-[#24180d] hover:border-[#ffd700]/50 rounded-xl text-center text-xs text-gray-400 font-barlow cursor-pointer transition-all"
        >
          {language === 'ro'
            ? 'Nu ai încă profiluri create. Apasă aici pentru a adăuga primul personaj!'
            : 'No profiles yet. Click here to add your first monk!'}
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
          {profiles.map((p) => {
            const isSelected = selectedProfileName && selectedProfileName.toLowerCase() === p.name.toLowerCase();
            const totalScore = p.totalSips + 25 * p.totalChugs;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProfile && onSelectProfile(p)}
                className={`flex-shrink-0 w-32 sm:w-36 p-2 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#2e1f0e] to-[#1c1308] border-[#ffd700] ring-1 ring-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.25)] scale-[1.02]'
                    : 'bg-[#120d08] border-[#291e13] hover:border-[#e8c84a]/60 hover:bg-[#1a120b]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-[#080503] border border-[#e8c84a]/40 shadow">
                    <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-cinzel font-bold text-[11px] text-[#f0ebe0] truncate">
                      {p.name}
                    </div>
                    <div className="text-[9px] font-mono text-[#e8c84a]">
                      {totalScore} <span className="text-[8px] text-gray-400 font-barlow">pct</span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                  <span>🍺 {p.totalSips}</span>
                  <span className="text-amber-400 font-bold">🏆 {(p.winsBoardgame || 0) + (p.winsDuel || 0) + (p.winsCasino || 0)}</span>
                </div>
              </div>
            );
          })}

          {/* Quick Add Profile Card in carousel */}
          <button
            type="button"
            onClick={() => setShowManagementModal(true)}
            className="flex-shrink-0 w-24 p-2 rounded-xl border border-dashed border-[#e8c84a]/40 hover:border-[#ffd700] bg-[#120d08]/50 hover:bg-[#1f150d] text-gray-400 hover:text-[#ffd700] flex flex-col items-center justify-center gap-1 text-[10px] font-cinzel transition-all"
          >
            <span className="text-base">+</span>
            <span>{language === 'ro' ? 'Adaugă' : 'Add'}</span>
          </button>
        </div>
      )}

      {/* Pop-up Modal with Full Profiles List & Add Profiles form */}
      {showManagementModal && (
        <ProfilesManagementModal
          isOpen={true}
          onClose={() => setShowManagementModal(false)}
          onSelectProfileForPlayer={(p) => {
            if (onSelectProfile) onSelectProfile(p);
          }}
        />
      )}
    </div>
  );
};
