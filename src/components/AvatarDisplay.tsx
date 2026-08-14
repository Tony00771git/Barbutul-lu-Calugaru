import React from 'react';
import { getAvatarById, MEDIEVAL_AVATARS } from '../data/avatars';

interface AvatarDisplayProps {
  avatarId?: string;
  className?: string;
  showBorder?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  className = 'w-10 h-10',
  showBorder = false,
}) => {
  const avatar = getAvatarById(avatarId);
  const matched = MEDIEVAL_AVATARS.some(a => a.id === avatarId);

  if (matched && avatar) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden flex items-center justify-center select-none flex-shrink-0 ${className} ${
          showBorder ? 'border border-[#e8c84a]/40 shadow-sm' : ''
        }`}
        style={{ backgroundColor: avatar.bgColor }}
      >
        {avatar.renderSvg('w-full h-full p-0.5')}
      </div>
    );
  }

  // Fallback if avatarId is a raw emoji string (e.g., from old saves)
  if (avatarId && avatarId.length <= 4) {
    return (
      <div
        className={`rounded-2xl bg-[#22180f] flex items-center justify-center select-none flex-shrink-0 text-xl ${className} ${
          showBorder ? 'border border-[#e8c84a]/40 shadow-sm' : ''
        }`}
      >
        {avatarId}
      </div>
    );
  }

  // Default Drunk Monk SVG
  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex items-center justify-center select-none flex-shrink-0 ${className} ${
        showBorder ? 'border border-[#e8c84a]/40 shadow-sm' : ''
      }`}
      style={{ backgroundColor: avatar.bgColor }}
    >
      {avatar.renderSvg('w-full h-full p-0.5')}
    </div>
  );
};
