import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ProfilesTab: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    profiles,
    addProfile,
    deleteProfile,
    resetAllStats,
    t,
    language,
  } = useApp();

  const [newName, setNewName] = useState<string>('');
  const [showAllTimeStats, setShowAllTimeStats] = useState<boolean>(false);
  const [resetConfirmStep, setResetConfirmStep] = useState<boolean>(false);
  const [confirmTimeoutId, setConfirmTimeoutId] = useState<any>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addProfile(newName);
    setNewName('');
  };

  const handleResetClick = () => {
    if (!resetConfirmStep) {
      setResetConfirmStep(true);
      const timer = setTimeout(() => {
        setResetConfirmStep(false);
      }, 4000);
      setConfirmTimeoutId(timer);
    } else {
      if (confirmTimeoutId) clearTimeout(confirmTimeoutId);
      resetAllStats();
      setResetConfirmStep(false);
    }
  };

  // Sort profiles by total drunkenness score
  const sortedProfiles = [...profiles].sort((a, b) => {
    const scoreA = a.totalSips + 25 * a.totalChugs;
    const scoreB = b.totalSips + 25 * b.totalChugs;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] px-4 py-6 max-w-xl mx-auto space-y-6 select-none">
      <div className="w-full flex items-center justify-between border-b border-[#2a2a2a] pb-3">
        <h2 className="text-2xl font-cinzel font-bold text-[#e8c84a] gold-text-glow flex items-center gap-2">
          👤 {t('profilesTitle')}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Add Profile Form */}
      <form onSubmit={handleAdd} className="w-full flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={t('addProfilePlaceholder')}
          className="flex-1 bg-[#161616] border border-[#2a2a2a] focus:border-[#e8c84a] rounded-xl px-4 py-3 text-sm text-[#f0ebe0] focus:outline-none font-barlow"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-[#e8c84a] text-black font-cinzel font-bold text-sm hover:brightness-110 gold-glow"
        >
          {t('addProfileBtn')}
        </button>
      </form>

      {/* Existing Profiles List */}
      <div className="w-full bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel font-bold text-sm text-[#e8c84a] uppercase tracking-wider">
            {t('existingProfiles')} ({profiles.length})
          </h3>
          <button
            onClick={() => setShowAllTimeStats(!showAllTimeStats)}
            className="px-3 py-1 rounded-lg border border-[#e8c84a]/50 bg-[#221f18] text-xs font-cinzel text-[#e8c84a] hover:bg-[#2e281b]"
          >
            📊 {t('allTimeStatsTitle')}
          </button>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-6 text-gray-500 font-barlow text-sm">
            Niciun profil salvat încă.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {profiles.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-[#2a2a2a] bg-[#121212] flex items-center justify-between font-barlow text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div>
                    <div className="font-cinzel font-bold text-[#f0ebe0]">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t('gamesPlayedCol')}: {p.gamesPlayed} | 🍺 {p.totalSips} | 🔥 {p.totalChugs}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteProfile(p.id)}
                  className="text-gray-500 hover:text-red-400 p-2 font-bold text-base transition-colors"
                  title="Delete profile"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Time Stats Table Modal or Drawer */}
      {showAllTimeStats && (
        <div className="w-full bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-4 space-y-3 gold-glow">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel font-bold text-base text-[#e8c84a]">
              📊 {t('allTimeStatsTitle')}
            </h3>
            <button
              onClick={() => setShowAllTimeStats(false)}
              className="text-gray-400 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-barlow text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs font-cinzel text-gray-400">
                  <th className="py-2">Profil</th>
                  <th className="py-2">Jocuri</th>
                  <th className="py-2">🍺 {t('sipsCol')}</th>
                  <th className="py-2">🔥 {t('chugsCol')}</th>
                  <th className="py-2">💎 Total Puncte</th>
                </tr>
              </thead>
              <tbody>
                {sortedProfiles.map(p => (
                  <tr key={p.id} className="border-b border-[#2a2a2a]/50">
                    <td className="py-2 font-cinzel text-[#e8c84a] font-bold">{p.name}</td>
                    <td className="py-2 text-gray-300">{p.gamesPlayed}</td>
                    <td className="py-2 text-gray-300">{p.totalSips}</td>
                    <td className="py-2 text-[#e05c3a] font-bold">{p.totalChugs}</td>
                    <td className="py-2 text-[#ffd700] font-bold">{p.totalSips + 25 * p.totalChugs} pt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset All Stats Button */}
      <div className="w-full pt-4">
        <button
          onClick={handleResetClick}
          className={`w-full py-3 rounded-xl border font-cinzel font-bold text-xs transition-all ${
            resetConfirmStep
              ? 'border-red-500 bg-red-600 text-white animate-bounce'
              : 'border-[#2a2a2a] bg-[#1a1212] text-red-400 hover:border-red-500'
          }`}
        >
          {resetConfirmStep ? t('resetStatsWarning') : t('resetAllStatsBtn')}
        </button>
      </div>
    </div>
  );
};
