import React, { useState, useRef } from 'react';
import { MEDIEVAL_AVATARS, MedievalAvatar } from '../data/avatars';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import { processImageFile } from '../utils/imageUtils';
import { ArrowLeft } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatarId?: string;
  currentAvatarId?: string;
  onSelectAvatar: (avatarId: string) => void;
  playerName?: string;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  selectedAvatarId,
  currentAvatarId,
  onSelectAvatar,
  playerName,
}) => {
  const { language } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAvatarId = selectedAvatarId || currentAvatarId;

  const isCurrentAvatarCustom = Boolean(
    activeAvatarId &&
      (activeAvatarId.startsWith('data:image/') ||
        activeAvatarId.startsWith('http://') ||
        activeAvatarId.startsWith('https://') ||
        activeAvatarId.startsWith('blob:'))
  );

  const [activeTab, setActiveTab] = useState<'medieval' | 'custom'>(() =>
    isCurrentAvatarCustom ? 'custom' : 'medieval'
  );
  const [customPhotoPreview, setCustomPhotoPreview] = useState<string | null>(
    isCurrentAvatarCustom && activeAvatarId ? activeAvatarId : null
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleImageUpload(files[0]);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        language === 'ro'
          ? 'Te rugăm să alegi un fișier de tip imagine (JPG, PNG, WEBP).'
          : 'Please select an image file (JPG, PNG, WEBP).'
      );
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Process and compress image to 256x256 square crop (~20KB)
      const compressedDataUrl = await processImageFile(file, {
        maxSize: 256,
        quality: 0.85,
      });
      setCustomPhotoPreview(compressedDataUrl);
      onSelectAvatar(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (language === 'ro'
            ? 'A apărut o eroare la procesarea imaginii.'
            : 'Error processing image.')
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      id="avatar-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 99995 }}
      className="fixed inset-0 z-[99995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
    >
      <div
        id="avatar-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1b1510] via-[#120e0a] to-[#0c0906] border-2 border-[#e8c84a] rounded-3xl p-4 sm:p-5 max-w-xl w-full max-h-[92vh] flex flex-col shadow-[0_0_40px_rgba(232,200,74,0.25)] space-y-3 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2.5 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2c1708] to-[#1a0f05] hover:from-[#3e220d] hover:to-[#261508] border border-[#ffd700]/60 hover:border-[#ffd700] text-amber-300 hover:text-white font-cinzel font-bold text-xs transition-all flex items-center gap-1 shadow-md active:scale-95 cursor-pointer flex-shrink-0"
              title={language === 'ro' ? '← Înapoi' : '← Back'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'ro' ? 'Înapoi' : 'Back'}</span>
            </button>

            <span className="text-2xl sm:text-3xl flex-shrink-0">🎭</span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-xl font-cinzel font-black text-[#ffd700] gold-text-glow leading-tight truncate">
                {language === 'ro' ? 'AVATAR & POZĂ PROFIL' : 'AVATAR & PROFILE PHOTO'}
              </h2>
              <p className="text-[11px] font-barlow text-gray-400 truncate hidden sm:block">
                {playerName
                  ? `${language === 'ro' ? 'Alege înfățișarea pentru' : 'Choose look for'} "${playerName}"`
                  : language === 'ro'
                  ? 'Selectează un personaj medieval sau încarcă propria poză'
                  : 'Select a medieval character or upload your own photo'}
              </p>
            </div>
          </div>
          <button
            id="close-avatar-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a1d12] border border-[#e8c84a]/50 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg hover:border-[#ffd700] transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-[#0d0905] p-1 rounded-2xl border border-[#2b1f13]">
          <button
            id="tab-medieval-avatars"
            type="button"
            onClick={() => setActiveTab('medieval')}
            className={`flex-1 py-2 px-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'medieval'
                ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a120b]'
            }`}
          >
            <span>🎭</span>
            <span>{language === 'ro' ? 'Personaje Medievale (10)' : 'Medieval Characters (10)'}</span>
          </button>

          <button
            id="tab-custom-photo"
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all relative ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a120b]'
            }`}
          >
            <span>📸</span>
            <span>{language === 'ro' ? 'Poza Ta de Profil' : 'Your Custom Photo'}</span>
            {isCurrentAvatarCustom && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          id="custom-avatar-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Content Tab 1: Medieval Characters */}
        {activeTab === 'medieval' && (
          <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
            {/* Quick Upload Banner */}
            <button
              id="banner-switch-custom-photo"
              type="button"
              onClick={() => setActiveTab('custom')}
              className="w-full p-2.5 rounded-2xl border border-[#e8c84a]/40 bg-gradient-to-r from-[#2a1c0e] via-[#1c1309] to-[#2a1c0e] hover:border-[#ffd700] flex items-center justify-between gap-3 text-left group transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl p-1.5 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700]">
                  📸
                </span>
                <div>
                  <div className="font-cinzel font-bold text-xs text-[#ffd700] group-hover:text-white transition-colors">
                    {language === 'ro' ? 'Vrei să folosești propria poză?' : 'Want to use your own photo?'}
                  </div>
                  <div className="text-[10px] font-barlow text-gray-400">
                    {language === 'ro'
                      ? 'Încarcă o fotografie din galerie sau fă o poză nouă'
                      : 'Upload a picture from gallery or take a new snapshot'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-cinzel font-bold text-[#ffd700] group-hover:translate-x-0.5 transition-transform">
                ➔
              </span>
            </button>

            {/* Avatars Grid (10 items) */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2.5 py-1 custom-scrollbar">
              {MEDIEVAL_AVATARS.map((avatar: MedievalAvatar) => {
                const isSelected = activeAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    id={`avatar-option-${avatar.id}`}
                    onClick={() => {
                      onSelectAvatar(avatar.id);
                      onClose();
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 relative group ${
                      isSelected
                        ? 'border-[#ffd700] bg-gradient-to-r from-[#2e1f13] to-[#1c140d] shadow-[0_0_20px_rgba(255,215,0,0.3)] scale-[1.01]'
                        : 'border-[#2c2218] bg-[#140f0a] hover:border-[#e8c84a]/70 hover:bg-[#1f160e]'
                    }`}
                  >
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#ffd700] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow">
                        ✓
                      </div>
                    )}

                    {/* Avatar SVG Portrait */}
                    <div
                      className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#e8c84a]/40 shadow-inner group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: avatar.bgColor }}
                    >
                      {avatar.renderSvg('w-full h-full')}
                    </div>

                    {/* Info Text */}
                    <div className="min-w-0 flex-1">
                      <div className="font-cinzel font-bold text-xs text-[#f0ebe0] truncate group-hover:text-[#ffd700] transition-colors">
                        {language === 'ro' ? avatar.nameRo : avatar.nameEn}
                      </div>
                      <div className="text-[9.5px] font-barlow text-gray-400 line-clamp-2 mt-0.5 leading-tight">
                        {language === 'ro' ? avatar.descRo : avatar.descEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Tab 2: Custom Photo Upload */}
        {activeTab === 'custom' && (
          <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1 py-1 custom-scrollbar">
            {/* Dropzone / Upload Box */}
            <div
              id="avatar-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#ffd700] bg-[#2a1e12] scale-[1.02]'
                  : 'border-[#e8c84a]/50 bg-[#120d08] hover:border-[#ffd700] hover:bg-[#1a130b]'
              }`}
            >
              {customPhotoPreview ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.35)] bg-[#1d140a]">
                      <AvatarDisplay
                        avatarId={customPhotoPreview}
                        className="w-full h-full"
                        showBorder={false}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-cinzel font-bold text-white transition-opacity">
                      {language === 'ro' ? 'Schimbă 📸' : 'Change 📸'}
                    </div>
                  </div>

                  <div>
                    <div className="font-cinzel font-bold text-sm text-[#ffd700]">
                      {language === 'ro' ? 'Poză Personalizată Încărcată' : 'Custom Photo Loaded'}
                    </div>
                    <p className="text-[11px] font-barlow text-gray-400 mt-0.5">
                      {language === 'ro'
                        ? 'Apasă aici pentru a alege o altă fotografie din fișiere'
                        : 'Click here to pick another picture from files'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2.5 py-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#20160d] border border-[#e8c84a]/40 flex items-center justify-center text-3xl shadow-inner">
                    📷
                  </div>
                  <div>
                    <div className="font-cinzel font-bold text-sm text-[#ffd700]">
                      {language === 'ro' ? 'Apasă sau trage o poză aici' : 'Click or drop a photo here'}
                    </div>
                    <p className="text-[11px] font-barlow text-gray-400 max-w-xs mt-1">
                      {language === 'ro'
                        ? 'Formate acceptate: JPG, PNG, WEBP. Poza este decupată și comprimată automat.'
                        : 'Accepted formats: JPG, PNG, WEBP. Image is automatically cropped & compressed.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 p-2 bg-[#20160d] rounded-xl border border-[#e8c84a]/30 text-xs font-cinzel text-[#ffd700] animate-pulse">
                <span className="animate-spin text-sm">⏳</span>
                <span>{language === 'ro' ? 'Se optimizează poza...' : 'Optimizing photo...'}</span>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-barlow text-center">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Actions for Custom Photo */}
            {customPhotoPreview && (
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  id="confirm-custom-avatar-btn"
                  type="button"
                  onClick={() => {
                    onSelectAvatar(customPhotoPreview);
                    onClose();
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#e8c84a] text-black font-cinzel font-black text-xs hover:brightness-110 shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>✓</span>
                  <span>{language === 'ro' ? 'FOLOSEȘTE ACEASTĂ POZĂ' : 'USE THIS PHOTO'}</span>
                </button>

                <button
                  id="remove-custom-avatar-btn"
                  type="button"
                  onClick={() => {
                    setCustomPhotoPreview(null);
                    onSelectAvatar('monk_drunk');
                    setActiveTab('medieval');
                  }}
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-[#22180e] hover:bg-[#332214] border border-[#e8c84a]/40 text-gray-300 hover:text-red-400 font-cinzel font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <span>🗑️</span>
                  <span>{language === 'ro' ? 'Șterge poza' : 'Remove photo'}</span>
                </button>
              </div>
            )}

            {/* Explanatory note */}
            <div className="p-2.5 rounded-xl bg-[#0c0905] border border-[#22180e] text-[10.5px] font-barlow text-gray-400 space-y-1">
              <div className="text-[#ffd700] font-cinzel font-bold flex items-center gap-1">
                <span>🛡️</span>
                <span>{language === 'ro' ? 'Sincronizare Multi-Dispozitiv' : 'Multi-Device Sync'}</span>
              </div>
              <p>
                {language === 'ro'
                  ? 'Poza ta de profil va fi sincronizată automat în partidele online (Casino, Duel) și afișată pe podiumul de premiere.'
                  : 'Your custom profile photo will sync across multiplayer matches (Casino, Duel) and appear on the victory podium.'}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#2a2218] flex items-center justify-between text-[11px] font-barlow text-gray-400">
          <span>
            {activeTab === 'medieval'
              ? `✨ ${language === 'ro' ? '10 personaje medievale' : '10 medieval characters'}`
              : `📸 ${language === 'ro' ? 'Poză de profil personalizată' : 'Custom profile photo'}`}
          </span>
          <button
            id="done-avatar-modal-btn"
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
