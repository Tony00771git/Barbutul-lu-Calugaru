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
  // Support custom user uploaded profile picture (Base64 data URL, blob, or web URL)
  if (
    avatarId &&
    (avatarId.startsWith('data:image/') ||
      avatarId.startsWith('http://') ||
      avatarId.startsWith('https://') ||
      avatarId.startsWith('blob:'))
  ) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden flex items-center justify-center select-none flex-shrink-0 bg-[#160f08] ${className} ${
          showBorder ? 'border border-[#e8c84a]/50 shadow-sm' : ''
        }`}
      >
        <img
          src={avatarId}
          alt="Custom Profile"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

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
