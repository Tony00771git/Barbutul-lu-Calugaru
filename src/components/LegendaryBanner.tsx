import React, { useEffect } from 'react';
import { Achievement } from '../data/achievements';
import { useApp } from '../context/AppContext';

interface LegendaryBannerProps {
  achievement: Achievement;
  playerName: string;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const LegendaryBanner: React.FC<LegendaryBannerProps> = ({
  achievement,
  playerName,
  onDismiss,
  onClose,
}) => {
  const { language } = useApp();

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    if (onClose) onClose();
  };

  // Auto dismiss after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [onDismiss, onClose]);

  const name = language === 'ro' ? achievement.nameRo : achievement.nameEn;
  const desc = language === 'ro' ? achievement.descRo : achievement.descEn;

  return (
    <div
      onClick={handleDismiss}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md cursor-pointer animate-bounce-in select-none"
      style={{ animationDuration: '0.6s' }}
    >
      <div className="bg-gradient-to-r from-[#2a1705] via-[#4d2f0a] to-[#2a1705] border-2 border-[#ffd700] rounded-2xl p-4 shadow-[0_0_35px_rgba(255,215,0,0.6)] flex items-center gap-3.5 relative overflow-hidden backdrop-blur-md">
        
        {/* Animated Light Sweep Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

        {/* Big Golden Trophy / Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffd700] via-[#e8c84a] to-[#996515] p-0.5 flex-shrink-0 shadow-lg flex items-center justify-center text-3xl border border-[#fff2a8]">
          <span>{achievement.icon}</span>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-[#ffd700] text-black font-cinzel font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              🏆 REALIZARE LEGENDARĂ!
            </span>
          </div>
          <h3 className="font-cinzel font-black text-sm sm:text-base text-[#ffd700] truncate mt-0.5 gold-text-glow">
            {name}
          </h3>
          <p className="text-[11px] font-barlow text-gray-200 line-clamp-2 leading-tight">
            <b className="text-white font-cinzel">{playerName}</b>: {desc}
          </p>
        </div>

        {/* Close hint */}
        <div className="text-right flex flex-col items-center justify-center pl-1 border-l border-white/10 text-gray-400 hover:text-white">
          <span className="text-sm font-bold">✕</span>
          <span className="text-[8px] font-barlow uppercase">Skip</span>
        </div>
      </div>
    </div>
  );
};
