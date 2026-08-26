import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RefreshCw, ShieldAlert, ArrowLeft, Beer, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { reconnectionService, ReconnectionState } from '../lib/reconnectionService';

interface ReconnectingOverlayProps {
  onLeaveGame?: () => void;
}

export const ReconnectingOverlay: React.FC<ReconnectingOverlayProps> = ({ onLeaveGame }) => {
  const { language } = useApp();
  const isRo = language === 'ro';

  const [state, setState] = useState<ReconnectionState>(() => reconnectionService.getState());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const unsub = reconnectionService.subscribe((newState) => {
      setState(newState);
      if (newState.status === 'connected') {
        setShowExitConfirm(false);
      }
    });
    return unsub;
  }, []);

  const isVisible = state.status === 'reconnecting' || state.status === 'failed';
  if (!isVisible) return null;

  const isFailed = state.status === 'failed';
  const progressPercent = Math.min(100, Math.round((state.attempt / state.maxAttempts) * 100));

  const handleRetry = () => {
    reconnectionService.retryNow();
  };

  const handleConfirmExit = () => {
    reconnectionService.cancelAndExit();
    if (onLeaveGame) {
      onLeaveGame();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="reconnecting-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: 99999 }}
        className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative max-w-md w-full bg-[#120d09] border-2 border-[#e8c84a] rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(232,200,74,0.25)] flex flex-col items-center overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Signal / Tavern Shield Icon */}
          <div className="relative mb-6 mt-2">
            <div className="w-20 h-20 rounded-2xl bg-[#22160d] border border-[#e8c84a]/60 flex items-center justify-center shadow-inner relative z-10">
              {isFailed ? (
                <WifiOff className="w-10 h-10 text-red-400 animate-pulse" />
              ) : (
                <Wifi className="w-10 h-10 text-[#e8c84a] animate-bounce" />
              )}
            </div>
            {!isFailed && (
              <>
                <span className="absolute inset-0 rounded-2xl bg-[#e8c84a]/20 animate-ping pointer-events-none" />
                <span className="absolute -inset-2 rounded-3xl border border-[#e8c84a]/40 animate-pulse pointer-events-none" />
              </>
            )}
          </div>

          {/* Room & Mode Info Badge */}
          {state.roomCode && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a120b] border border-[#e8c84a]/40 text-[#f8e178] text-xs font-mono font-bold mb-3 shadow">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                {isRo ? 'Masa de Joc' : 'Table'}: #{state.roomCode}
              </span>
              {state.mode && <span className="text-[#8c7860] uppercase text-[10px]">({state.mode})</span>}
            </div>
          )}

          {/* Header Title */}
          <h2 className="text-xl sm:text-2xl font-cinzel font-black text-[#f8e178] tracking-wide mb-2">
            {isFailed
              ? isRo
                ? 'Conexiune Întreruptă'
                : 'Connection Interrupted'
              : isRo
              ? 'Reconectare la Masă...'
              : 'Reconnecting to Table...'}
          </h2>

          {/* Subtitle / Explanatory Text */}
          <p className="text-xs sm:text-sm text-[#c8b898] leading-relaxed mb-5 max-w-xs">
            {isFailed
              ? isRo
                ? 'Nu am reușit să restabilim legătura cu masa. Verifică rețeaua sau reîncearcă manual.'
                : 'Could not re-establish connection to the table. Please check your network and retry.'
              : isRo
              ? '🛡️ Scutul anti-drop este activ: starea jocului, scorul și băuturile sunt salvate în siguranță!'
              : '🛡️ Anti-drop shield active: game state, scores, and sips are safely preserved!'}
          </p>

          {/* Attempts Progress Bar */}
          {!isFailed && (
            <div className="w-full mb-6 bg-[#22160d] rounded-xl p-3 border border-[#3e2b17]">
              <div className="flex justify-between items-center text-[11px] font-mono text-[#e8c84a] mb-1.5 font-bold">
                <span>{isRo ? 'Încercare automată' : 'Auto Attempt'}</span>
                <span>
                  {state.attempt} / {state.maxAttempts}
                </span>
              </div>
              <div className="w-full h-2 bg-[#0c0805] rounded-full overflow-hidden border border-[#523d24]/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-600 via-[#e8c84a] to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900 font-cinzel font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer border border-[#f8e178]"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isRo ? 'Reîncearcă Acum' : 'Retry Now'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#22160d] hover:bg-[#322013] text-[#c8b898] hover:text-red-300 font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#523d24] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isRo ? 'Ieși din Cameră' : 'Leave Table'}</span>
            </button>
          </div>

          {/* Exit Confirmation Dialog inside overlay */}
          {showExitConfirm && (
            <div className="absolute inset-0 bg-[#0c0805]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center justify-center z-20">
              <ShieldAlert className="w-12 h-12 text-red-400 mb-3 animate-pulse" />
              <h3 className="text-base font-cinzel font-bold text-red-200 mb-2">
                {isRo ? 'Ești sigur că părăsești masa?' : 'Are you sure you want to leave?'}
              </h3>
              <p className="text-xs text-[#c8b898] mb-6 text-center max-w-xs">
                {isRo
                  ? 'Vei pierde locul la masa curentă și meciul va fi anulat.'
                  : 'You will forfeit your seat at this table and the match will be cancelled.'}
              </p>
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#22160d] border border-[#523d24] text-xs font-cinzel text-[#c8b898] font-bold cursor-pointer"
                >
                  {isRo ? 'Rămâi' : 'Stay'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-900/80 hover:bg-red-800 border border-red-500 text-xs font-cinzel text-red-100 font-bold cursor-pointer"
                >
                  {isRo ? 'Părăsește' : 'Confirm Leave'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
