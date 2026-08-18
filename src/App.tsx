import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameMode, Difficulty, CustomDoubles, Player, ThemeId, DuelSubmode, DuelDifficulty } from './types';
import { SetupScreen } from './components/SetupScreen';
import { NormalGame } from './components/NormalGame';
import { BoardGame } from './components/BoardGame';
import { DuelGame } from './components/DuelGame';
import { CasinoGame } from './components/CasinoGame';
import { Podium } from './components/Podium';
import { ScoreModal } from './components/ScoreModal';
import { CustomizeTab } from './components/CustomizeTab';
import { RulesModal } from './components/RulesModal';
import { CloudAccountModal } from './components/CloudAccountModal';
import { ThemeBackground } from './components/ThemeBackground';
import { LegendaryBanner } from './components/LegendaryBanner';
import { useDuelSocket } from './hooks/useDuelSocket';
import { useCasinoSocket } from './hooks/useCasinoSocket';

type AppScreen = 'setup' | 'normal' | 'boardgame' | 'duel' | 'casino' | 'podium';

function MainAppContent() {
  const { theme, t, language, activeLegendaryAchievement, dismissLegendaryAchievement } = useApp();
  const { user, cloudProfile } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('setup');
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const [customDoubles, setCustomDoubles] = useState<CustomDoubles>({
    '2-2': '',
    '3-3': '',
    '4-4': '',
    '5-5': '',
  });
  const [boardDiceCount, setBoardDiceCount] = useState<1 | 2>(1);

  // Local player info for duel mode
  const [duelLocalPlayer, setDuelLocalPlayer] = useState<{ id: string; name: string; avatarIcon: string; color: string }>({
    id: 'p1',
    name: 'Fratele Vasile',
    avatarIcon: 'monk_drunk',
    color: '#e8c84a',
  });

  // Local player info for casino mode
  const [casinoLocalPlayer, setCasinoLocalPlayer] = useState<{ id: string; name: string; avatarIcon: string; color: string }>({
    id: 'c1',
    name: 'Călugărul Onufrie',
    avatarIcon: 'monk_drunk',
    color: '#e8c84a',
  });

  // Duel and Casino hooks
  const duelSocket = useDuelSocket();
  const casinoSocket = useCasinoSocket();

  // Modals
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [scoreModalTab, setScoreModalTab] = useState<'live' | 'alltime' | 'achievements'>('achievements');
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);

  const handleStartGame = (
    mode: GameMode,
    players: Player[],
    difficulty: Difficulty,
    doubles: CustomDoubles,
    diceCount: 1 | 2,
    submode?: DuelSubmode,
    dDifficulty?: DuelDifficulty
  ) => {
    setGameMode(mode);
    setActivePlayers(players);
    setGameDifficulty(difficulty);
    setCustomDoubles(doubles);
    setBoardDiceCount(diceCount);

    if (mode === 'normal') {
      setCurrentScreen('normal');
    } else if (mode === 'boardgame') {
      setCurrentScreen('boardgame');
    }
  };

  const handleStartDuel = (
    role: 'host' | 'join',
    localPlayer: { id: string; name: string; avatarIcon: string; color: string },
    submode: DuelSubmode,
    difficulty: DuelDifficulty,
    roomCode?: string,
    targetPoints?: number
  ) => {
    setGameMode('duel');
    setDuelLocalPlayer(localPlayer);

    if (role === 'host') {
      duelSocket.createRoom(localPlayer, submode, difficulty, targetPoints);
    } else if (role === 'join' && roomCode) {
      duelSocket.joinRoom(roomCode, localPlayer);
    }

    setCurrentScreen('duel');
  };

  const handleStartCasino = (
    role: 'host' | 'join',
    localPlayer: { id: string; name: string; avatarIcon: string; color: string },
    startingChips: number,
    roomCode?: string
  ) => {
    setGameMode('casino');
    setCasinoLocalPlayer(localPlayer);

    if (role === 'host') {
      casinoSocket.createRoom(localPlayer, startingChips);
    } else if (role === 'join' && roomCode) {
      casinoSocket.joinRoom(roomCode, localPlayer);
    }

    setCurrentScreen('casino');
  };

  const handleEndGame = (finalPlayers: Player[]) => {
    setActivePlayers(finalPlayers);
    setCurrentScreen('podium');
  };

  const handleLeaveDuel = () => {
    duelSocket.disconnect();
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
    setCurrentScreen('setup');
  };

  const handleLeaveCasino = () => {
    casinoSocket.disconnect();
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
    setCurrentScreen('setup');
  };

  const handleHomeClick = () => {
    if (currentScreen === 'duel') {
      handleLeaveDuel();
    } else if (currentScreen === 'casino') {
      handleLeaveCasino();
    } else {
      setCurrentScreen('setup');
    }
  };

  const getThemeBackgroundClass = (tId: ThemeId) => {
    switch (tId) {
      case 'tavern':
        return 'bg-gradient-to-br from-[#1e130b] via-[#0d0d0d] to-[#080503]';
      case 'cellar':
        return 'bg-gradient-to-br from-[#1b1209] via-[#0d0d0d] to-[#080503]';
      case 'great_hall':
        return 'bg-gradient-to-br from-[#18130e] via-[#0d0d0d] to-[#060504]';
      case 'dungeon':
        return 'bg-gradient-to-br from-[#1a0f0a] via-[#0d0d0d] to-[#060403]';
      default:
        return 'bg-gradient-to-br from-[#1e130b] via-[#0d0d0d] to-[#080503]';
    }
  };

  return (
    <div className={`min-h-screen w-full relative transition-colors duration-500 ${getThemeBackgroundClass(theme)} text-[#f0ebe0] font-body safe-bottom-padding`}>
      {/* Dynamic Themed Visual Background */}
      <ThemeBackground theme={theme} />

      {/* Persistent Navigation Header Bar with notch safe-area support */}
      <header className="w-full bg-[#161616]/85 border-b border-[#2a2a2a] backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 py-2 safe-top-padding flex items-center justify-between shadow-md">
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity active:scale-95"
        >
          <span className="text-xl">🍺</span>
          <span className="font-cinzel font-bold text-sm text-[#e8c84a] gold-text-glow">
            Barbutul lu' Călugăru
          </span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Account & Leaderboard Button */}
          <button
            onClick={() => setShowCloudModal(true)}
            className={`py-1.5 px-2.5 sm:px-3 rounded-xl border text-xs font-cinzel font-bold flex items-center gap-1.5 shadow transition-all active:scale-95 ${
              user
                ? 'bg-gradient-to-r from-emerald-950 to-[#122415] border-emerald-500/50 text-emerald-300 hover:brightness-110'
                : 'bg-gradient-to-r from-[#2a1708] to-[#1a1005] border-[#ffd700]/40 text-[#ffd700] hover:brightness-110'
            }`}
            title={t('tabCloudAccount')}
          >
            <span>{user ? '🟢' : '☁️'}</span>
            <span className="truncate max-w-[110px] sm:max-w-none">
              {user ? (cloudProfile?.displayName || user.displayName || t('tabCloudAccount')) : t('tabCloudLogin')}
            </span>
          </button>

          {/* Achievements Button on Main Screen & Navbar */}
          <button
            onClick={() => {
              setScoreModalTab('achievements');
              setShowScoreModal(true);
            }}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#2e1f13] to-[#1c140d] border border-[#e8c84a] text-xs font-cinzel font-bold text-[#ffd700] hover:brightness-110 flex items-center gap-1 shadow active:scale-95"
            title={language === 'ro' ? 'Realizări & Trofee' : 'Achievements & Trophies'}
          >
            <span>🏅</span>
            <span>{language === 'ro' ? 'Realizări' : 'Achievements'}</span>
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#e8c84a] text-xs font-cinzel text-gray-300 active:scale-95 transition-all"
            title={t('tabRules')}
          >
            📜
          </button>

          <button
            onClick={() => setShowCustomizeModal(true)}
            className="p-2 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#e8c84a] text-xs font-cinzel text-gray-300 active:scale-95 transition-all"
            title={t('tabCustomize')}
          >
            🎨
          </button>
        </div>
      </header>

      {/* Main Screen Router */}
      <main className="container mx-auto relative z-10 px-2 sm:px-4 safe-horizontal-padding">
        {currentScreen === 'setup' && (
          <SetupScreen
            onStartGame={handleStartGame}
            onStartDuel={handleStartDuel}
            onStartCasino={handleStartCasino}
            onOpenAchievements={() => {
              setScoreModalTab('achievements');
              setShowScoreModal(true);
            }}
            onOpenProfiles={() => {
              setScoreModalTab('alltime');
              setShowScoreModal(true);
            }}
            onOpenCustomize={() => setShowCustomizeModal(true)}
            onOpenRules={() => setShowRulesModal(true)}
            onOpenCloudModal={() => setShowCloudModal(true)}
          />
        )}

        {currentScreen === 'normal' && (
          <NormalGame
            initialPlayers={activePlayers}
            difficulty={gameDifficulty}
            customDoubles={customDoubles}
            onEndGame={handleEndGame}
            onOpenRules={() => setShowRulesModal(true)}
          />
        )}

        {currentScreen === 'boardgame' && (
          <BoardGame
            initialPlayers={activePlayers}
            boardDiceCount={boardDiceCount}
            onEndGame={handleEndGame}
            onOpenRules={() => setShowRulesModal(true)}
          />
        )}

        {currentScreen === 'duel' && (
          <DuelGame
            socket={duelSocket}
            localPlayer={duelLocalPlayer}
            onEndGame={handleEndGame}
            onOpenRules={() => setShowRulesModal(true)}
            onLeave={handleLeaveDuel}
          />
        )}

        {currentScreen === 'casino' && (
          <CasinoGame
            casinoSocket={casinoSocket}
            localPlayer={casinoLocalPlayer}
            onLeave={handleLeaveCasino}
          />
        )}

        {currentScreen === 'podium' && (
          <Podium
            mode={gameMode}
            players={activePlayers}
            onPlayAgain={handleHomeClick}
            onHome={handleHomeClick}
          />
        )}
      </main>

      {/* Persistent Global Modals */}
      <ScoreModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        activePlayers={activePlayers}
        gameMode={gameMode}
        initialTab={scoreModalTab}
        achievementsOnly={scoreModalTab === 'achievements'}
      />

      <CloudAccountModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />

      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-4 max-w-xl w-full max-h-[90vh] overflow-y-auto gold-glow">
            <CustomizeTab onClose={() => setShowCustomizeModal(false)} />
          </div>
        </div>
      )}

      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Legendary Achievement Notification Popup Banner */}
      {activeLegendaryAchievement && (
        <LegendaryBanner
          achievement={activeLegendaryAchievement.achievement}
          playerName={activeLegendaryAchievement.playerName}
          onClose={dismissLegendaryAchievement}
          onDismiss={dismissLegendaryAchievement}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
