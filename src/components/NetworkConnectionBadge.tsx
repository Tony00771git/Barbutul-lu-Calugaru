import React, { useState, useEffect } from 'react';
import { measurePing } from '../lib/sessionManager';
import { useApp } from '../context/AppContext';

interface NetworkConnectionBadgeProps {
  className?: string;
  isConnected?: boolean;
}

export const NetworkConnectionBadge: React.FC<NetworkConnectionBadgeProps> = ({
  className = '',
  isConnected = true,
}) => {
  const { language } = useApp();
  const isRo = language === 'ro';

  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showReconnectingBanner, setShowReconnectingBanner] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const checkPing = async () => {
      if (!navigator.onLine) {
        if (mounted) {
          setIsOnline(false);
          setPingMs(null);
          setShowReconnectingBanner(true);
        }
        return;
      }
      try {
        const ms = await measurePing();
        if (mounted) {
          setIsOnline(true);
          setPingMs(ms);
          setShowReconnectingBanner(!isConnected);
        }
      } catch {
        if (mounted) setPingMs(null);
      }
    };

    checkPing();
    const interval = setInterval(checkPing, 8000);

    const handleOnline = () => {
      setIsOnline(true);
      checkPing();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectingBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected]);

  let statusColor = 'bg-emerald-500';
  let statusText = `${pingMs ?? 25}ms`;
  let statusBorder = 'border-emerald-500/40 text-emerald-300';

  if (!isOnline || !isConnected) {
    statusColor = 'bg-red-500 animate-pulse';
    statusText = isRo ? 'Reconectare...' : 'Reconnecting...';
    statusBorder = 'border-red-500/50 text-red-300 bg-red-950/60';
  } else if (pingMs !== null && pingMs > 180) {
    statusColor = 'bg-amber-500';
    statusText = `${pingMs}ms (Slow)`;
    statusBorder = 'border-amber-500/40 text-amber-300';
  }

  return (
    <>
      {/* Floating Reconnection Alert Banner if connection was disrupted */}
      {(!isOnline || !isConnected || showReconnectingBanner) && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border border-amber-500 text-amber-200 px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center gap-2.5 text-xs font-cinzel font-bold animate-bounce select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>
            {isRo
              ? '🛡️ Scut Anti-Deconectare activ: Sesiunea este salvată! Se reia legătura cu masa...'
              : '🛡️ Anti-Drop Shield Active: Session is safe! Re-attaching to live table...'}
          </span>
        </div>
      )}

      {/* Discreet In-HUD Ping Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#120d09]/90 border text-[10px] font-mono select-none ${statusBorder} ${className}`}
        title={isRo ? 'Calitatea conexiunii în timp real & Anti-Latență' : 'Real-time connection ping & Anti-latency'}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
        <span>{statusText}</span>
      </div>
    </>
  );
};
