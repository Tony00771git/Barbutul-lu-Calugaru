import React from 'react';
import { Profile } from '../types';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';

interface ProfilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: Profile) => void;
  playerIndex: number;
  playerName: string;
}

export const ProfilePickerModal: React.FC<ProfilePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
  playerIndex,
  playerName,
}) => {
  const { profiles, language, t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-gradient-to-b from-[#1c140d] via-[#140e08] to-[#0d0905] border-2 border-[#ffd700] rounded-2xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.9)] space-y-3 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d2013] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] gold-text-glow leading-tight">
                {language === 'ro' ? `Alege Profil - Jucător ${playerIndex + 1}` : `Select Profile - Player ${playerIndex + 1}`}
              </h3>
              <p className="text-[10px] text-gray-400 font-barlow">
                {language === 'ro' ? 'Încarcă numele, avatarul și statisticile' : 'Load character name, avatar & stats'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#22180e] hover:bg-[#332415] border border-[#ffd700]/30 text-gray-300 hover:text-white flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Profiles List */}
        <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
          {profiles.length === 0 ? (
            <div className="p-4 bg-[#0d0905] border border-[#24180d] rounded-xl text-center space-y-1">
              <span className="text-2xl">👤</span>
              <p className="text-xs font-cinzel text-gray-300">
                {language === 'ro' ? 'Nu ai profiluri salvate încă.' : 'No saved profiles found.'}
              </p>
              <p className="text-[10px] text-gray-400 font-barlow">
                {language === 'ro'
                  ? 'Creează un profil din secțiunea de profiluri de pe ecranul principal.'
                  : 'Create a profile from the profiles section on the main screen.'}
              </p>
            </div>
          ) : (
            profiles.map((p) => {
              const isCurrent = playerName.trim().toLowerCase() === p.name.trim().toLowerCase();
              const totalScore = p.totalSips + 25 * p.totalChugs;
              const totalWins = (p.winsBoardgame || 0) + (p.winsDuel || 0) + (p.winsCasino || 0);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProfile(p);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#332210] to-[#201509] border-[#ffd700] ring-1 ring-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]'
                      : 'bg-[#120d08] border-[#291e13] hover:border-[#ffd700]/60 hover:bg-[#1a120b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-[#080503] border border-[#ffd700]/40 shadow">
                      <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-cinzel font-bold text-xs sm:text-sm text-[#f0ebe0] truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono bg-[#ffd700] text-black px-1.5 py-0.2 rounded font-bold">
                            Activ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-barlow flex items-center gap-2">
                        <span>🍺 {p.totalSips}</span>
                        <span>🕳️ {p.totalChugs}</span>
                        <span className="text-amber-400 font-mono font-bold">🏆 {totalWins}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 pl-2">
                    <span className="text-xs font-mono font-bold text-[#ffd700]">
                      {totalScore} <span className="text-[9px] text-gray-400 font-barlow">pct</span>
                    </span>
                    <span className="text-[10px] font-cinzel font-bold text-[#ffd700]/80 mt-0.5">
                      {language === 'ro' ? 'Alege →' : 'Select →'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-1 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-[#1d150e] border border-[#332415] hover:border-[#ffd700]/40 text-gray-300 hover:text-white text-xs font-cinzel transition-all"
          >
            {language === 'ro' ? 'Închide' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
