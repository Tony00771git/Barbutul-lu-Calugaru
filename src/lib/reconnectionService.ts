import { GameMode } from '../types';
import { getActiveSession, saveActiveSession, clearActiveSession, ActiveRoomSession, measurePing } from './sessionManager';
import { syncServerClock } from './duelFirestoreService';

export type ReconnectionStatus = 'connected' | 'reconnecting' | 'failed' | 'idle';

export interface ReconnectionState {
  status: ReconnectionStatus;
  attempt: number;
  maxAttempts: number;
  mode: GameMode | null;
  roomCode: string | null;
  error: string | null;
  lastConnectedAt: number;
}

type ReconnectHandler = (session: ActiveRoomSession) => Promise<boolean>;
type StateListener = (state: ReconnectionState) => void;

class AutoReconnectionService {
  private state: ReconnectionState = {
    status: 'idle',
    attempt: 0,
    maxAttempts: 10,
    mode: null,
    roomCode: null,
    error: null,
    lastConnectedAt: Date.now(),
  };

  private handlers = new Map<GameMode, ReconnectHandler>();
  private listeners = new Set<StateListener>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isReconnectingInProgress = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public registerHandler(mode: GameMode, handler: ReconnectHandler): () => void {
    this.handlers.set(mode, handler);
    return () => {
      this.handlers.delete(mode);
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): ReconnectionState {
    return { ...this.state };
  }

  public notifyConnected(mode: GameMode, roomCode: string): void {
    this.clearTimer();
    this.isReconnectingInProgress = false;
    this.updateState({
      status: 'connected',
      attempt: 0,
      mode,
      roomCode: roomCode.trim().toUpperCase(),
      error: null,
      lastConnectedAt: Date.now(),
    });
  }

  public notifyDisconnected(mode: GameMode, reason?: string): void {
    const session = getActiveSession();
    if (!session || session.mode !== mode) {
      this.updateState({ status: 'idle', mode: null, roomCode: null, error: reason || null });
      return;
    }

    if (this.state.status === 'reconnecting' || this.isReconnectingInProgress) {
      return;
    }

    console.warn(`[AutoReconnectionService] Disconnected from ${mode} (${session.roomCode}). Reason:`, reason);
    this.triggerSilentReconnection(session, reason);
  }

  public async triggerSilentReconnection(session?: ActiveRoomSession, customReason?: string): Promise<boolean> {
    const targetSession = session || getActiveSession();
    if (!targetSession) {
      this.updateState({ status: 'idle', error: customReason || 'Nu există nicio sesiune activă.' });
      return false;
    }

    this.clearTimer();
    this.updateState({
      status: 'reconnecting',
      mode: targetSession.mode,
      roomCode: targetSession.roomCode,
      error: customReason || null,
      attempt: 1,
    });

    return this.executeReconnectionLoop(targetSession);
  }

  private async executeReconnectionLoop(session: ActiveRoomSession): Promise<boolean> {
    if (this.isReconnectingInProgress) return false;
    this.isReconnectingInProgress = true;

    let attempt = this.state.attempt || 1;
    const maxAttempts = this.state.maxAttempts;

    while (attempt <= maxAttempts) {
      this.updateState({
        status: 'reconnecting',
        attempt,
        mode: session.mode,
        roomCode: session.roomCode,
      });

      console.log(`[AutoReconnectionService] Încercare reconectare ${attempt}/${maxAttempts} pentru camera ${session.roomCode}...`);

      try {
        // 1. Sync clock & verify basic ping
        await syncServerClock().catch(() => {});
        
        // 2. Dispatch to mode-specific reconnect handler
        const handler = this.handlers.get(session.mode);
        if (handler) {
          const success = await handler(session);
          if (success) {
            console.log(`[AutoReconnectionService] ✅ Reconectare cu succes la camera ${session.roomCode}!`);
            this.isReconnectingInProgress = false;
            this.notifyConnected(session.mode, session.roomCode);
            return true;
          }
        }
      } catch (err: any) {
        console.warn(`[AutoReconnectionService] Încercarea ${attempt} a eșuat:`, err?.message || err);
      }

      attempt += 1;
      if (attempt <= maxAttempts) {
        // Exponential backoff with light jitter (1.2s -> 4.5s)
        const delay = Math.min(4500, Math.floor(1200 * Math.pow(1.3, attempt - 1) + Math.random() * 500));
        await new Promise((res) => {
          this.reconnectTimer = setTimeout(res, delay);
        });
      }
    }

    this.isReconnectingInProgress = false;
    this.updateState({
      status: 'failed',
      attempt: maxAttempts,
      error: 'Nu s-a putut restabili conexiunea la masa de joc după mai multe încercări.',
    });
    return false;
  }

  public retryNow(): void {
    const session = getActiveSession();
    if (session) {
      this.clearTimer();
      this.isReconnectingInProgress = false;
      this.triggerSilentReconnection(session, 'Reîncercare manuală solicitată de utilizator');
    }
  }

  public cancelAndExit(): void {
    this.clearTimer();
    this.isReconnectingInProgress = false;
    clearActiveSession();
    this.updateState({
      status: 'idle',
      attempt: 0,
      mode: null,
      roomCode: null,
      error: null,
    });
  }

  private handleOnline = () => {
    console.log('[AutoReconnectionService] Dispozitivul a revenit ONLINE. Se declanșează reconectarea automată...');
    const session = getActiveSession();
    if (session && this.state.status !== 'connected') {
      this.triggerSilentReconnection(session, 'Conexiune la internet restabilită');
    }
  };

  private handleOffline = () => {
    console.warn('[AutoReconnectionService] Dispozitivul este OFFLINE.');
    const session = getActiveSession();
    if (session) {
      this.updateState({
        status: 'reconnecting',
        error: 'Conexiunea la internet s-a întrerupt. Se așteaptă rețeaua...',
      });
    }
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const session = getActiveSession();
      if (session && (this.state.status === 'reconnecting' || this.state.status === 'failed')) {
        console.log('[AutoReconnectionService] Tab revenit în prim-plan. Reîncercăm reconectarea...');
        this.triggerSilentReconnection(session, 'Tab vizibil');
      }
    }
  };

  private clearTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateState(partial: Partial<ReconnectionState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.warn('Listener error in AutoReconnectionService:', err);
      }
    });
  }
}

export const reconnectionService = new AutoReconnectionService();
