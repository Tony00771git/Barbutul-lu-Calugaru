import React from 'react';
import { MEDIEVAL_AVATARS, MedievalAvatar } from '../data/avatars';
import { useApp } from '../context/AppContext';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatarId?: string;
  onSelectAvatar: (avatarId: string) => void;
  playerName?: string;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  selectedAvatarId,
  onSelectAvatar,
  playerName,
}) => {
  const { language } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-gradient-to-b from-[#1b1510] via-[#120e0a] to-[#0c0906] border-2 border-[#e8c84a] rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(232,200,74,0.25)] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">🎭</span>
            <div>
              <h2 className="text-lg sm:text-xl font-cinzel font-black text-[#ffd700] gold-text-glow">
                {language === 'ro' ? 'ALEGE AVATARUL MEDIEVAL' : 'CHOOSE MEDIEVAL AVATAR'}
              </h2>
              <p className="text-[11px] font-barlow text-gray-400">
                {playerName
                  ? `${language === 'ro' ? 'Alege înfățișarea pentru' : 'Choose look for'} "${playerName}"`
                  : language === 'ro'
                  ? 'Selectează un personaj medieval unic'
                  : 'Select a unique medieval character'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a1d12] border border-[#e8c84a]/50 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg hover:border-[#ffd700] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Avatars Grid (10 items) */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-2 gap-3 py-1">
          {MEDIEVAL_AVATARS.map((avatar: MedievalAvatar) => {
            const isSelected = selectedAvatarId === avatar.id;
            return (
              <button
                key={avatar.id}
                onClick={() => {
                  onSelectAvatar(avatar.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 relative group ${
                  isSelected
                    ? 'border-[#ffd700] bg-gradient-to-r from-[#2e1f13] to-[#1c140d] shadow-[0_0_20px_rgba(255,215,0,0.3)] scale-[1.02]'
                    : 'border-[#2c2218] bg-[#140f0a] hover:border-[#e8c84a]/70 hover:bg-[#1f160e]'
                }`}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#ffd700] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow">
                    ✓
                  </div>
                )}

                {/* Avatar SVG Portrait */}
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#e8c84a]/40 shadow-inner group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: avatar.bgColor }}
                >
                  {avatar.renderSvg('w-full h-full')}
                </div>

                {/* Info Text */}
                <div className="min-w-0 flex-1">
                  <div className="font-cinzel font-bold text-sm text-[#f0ebe0] truncate group-hover:text-[#ffd700] transition-colors">
                    {language === 'ro' ? avatar.nameRo : avatar.nameEn}
                  </div>
                  <div className="text-[10px] font-barlow text-gray-400 line-clamp-2 mt-0.5 leading-tight">
                    {language === 'ro' ? avatar.descRo : avatar.descEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#2a2218] flex items-center justify-between text-[11px] font-barlow text-gray-400">
          <span>✨ {language === 'ro' ? '10 personaje medievale disponibile' : '10 medieval characters available'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2a1d12] border border-[#e8c84a]/50 text-[#ffd700] hover:bg-[#3d2a19] font-cinzel font-bold text-xs"
          >
            {language === 'ro' ? 'Gata ➔' : 'Done ➔'}
          </button>
        </div>

      </div>
    </div>
  );
};
