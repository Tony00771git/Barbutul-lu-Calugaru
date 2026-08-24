import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { GameInvite } from '../types';
import { subscribeToIncomingGameInvites, respondToGameInvite } from '../lib/friendsService';
import { AvatarDisplay } from './AvatarDisplay';

interface GameInvitePopupProps {
  onAcceptInvite: (invite: GameInvite) => void;
}

export const GameInvitePopup: React.FC<GameInvitePopupProps> = ({ onAcceptInvite }) => {
  const { user } = useAuth();
  const { language } = useApp();
  const [activeInvites, setActiveInvites] = useState<GameInvite[]>([]);

  useEffect(() => {
    if (!user) {
      setActiveInvites([]);
      return;
    }

    const unsub = subscribeToIncomingGameInvites(user.uid, (invites) => {
      setActiveInvites(invites);
    });

    return () => unsub();
  }, [user]);

  if (activeInvites.length === 0) return null;

  const currentInvite = activeInvites[0];

  const handleAccept = async () => {
    if (currentInvite.id) {
      await respondToGameInvite(currentInvite.id, 'accepted');
    }
    onAcceptInvite(currentInvite);
  };

  const handleDecline = async () => {
    if (currentInvite.id) {
      await respondToGameInvite(currentInvite.id, 'declined');
    }
  };

  const modeName =
    currentInvite.mode === 'duel'
      ? 'Trivia Duel 1v1'
      : currentInvite.mode === 'pineapple'
      ? 'Pineapple Poker 1v1'
      : 'Dragon Crash 1v1';

  const modeIcon =
    currentInvite.mode === 'duel' ? '⚔️' : currentInvite.mode === 'pineapple' ? '🍍' : '🐉';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-bounce-short">
      <div className="bg-gradient-to-r from-[#2c1308] via-[#1a0f07] to-[#2c1308] border-2 border-[#ffd700] rounded-2xl p-3.5 shadow-2xl gold-glow backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl animate-pulse">{modeIcon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel font-black text-xs text-[#ffd700] uppercase tracking-wider">
                  {language === 'ro' ? 'Invitație Directă la Joc!' : 'Direct Game Invite!'}
                </span>
                <span className="text-[10px] font-mono bg-red-600/80 text-white px-1.5 rounded-full animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-stone-200 font-barlow truncate">
                <strong className="text-amber-300">{currentInvite.fromName}</strong>{' '}
                {language === 'ro' ? 'te provoacă la' : 'invites you to'}{' '}
                <strong className="text-[#ffd700]">{modeName}</strong>!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDecline}
            className="w-6 h-6 rounded-full bg-[#181109] border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center text-xs transition-all"
            title="Refuză"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f7c844] to-[#ffd700] text-black font-cinzel font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <span>🚀</span>
            <span>{language === 'ro' ? 'Acceptă & Intră în Joc' : 'Accept & Join'}</span>
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="py-2 px-3 rounded-xl bg-[#1c120a] border border-stone-700 text-stone-300 hover:text-white font-cinzel font-bold text-xs active:scale-95 transition-all"
          >
            {language === 'ro' ? 'Refuză' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
};
