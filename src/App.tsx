import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameMode, Difficulty, CustomDoubles, Player, ThemeId, DuelSubmode, DuelDifficulty, PineappleBotDifficulty } from './types';
import { SetupScreen } from './components/SetupScreen';
import { NormalGame } from './components/NormalGame';
import { BoardGame } from './components/BoardGame';
import { DuelGame } from './components/DuelGame';
import { CasinoGame } from './components/CasinoGame';
import { PineappleGame } from './components/PineappleGame';
import { CrashGame } from './components/CrashGame';
import { Podium } from './components/Podium';
import { ScoreModal } from './components/ScoreModal';
import { CustomizeTab } from './components/CustomizeTab';
import { RulesModal } from './components/RulesModal';
import { CloudAccountModal } from './components/CloudAccountModal';
import { ThemeBackground } from './components/ThemeBackground';
import { LegendaryBanner } from './components/LegendaryBanner';
import { XpGainModal } from './components/XpGainModal';
import { DrunkenCoinsShopModal } from './components/DrunkenCoinsShopModal';
import { useDuelSocket } from './hooks/useDuelSocket';
import { useCasinoSocket } from './hooks/useCasinoSocket';
import { createPineappleRoom, joinPineappleRoom, addPineappleBot } from './lib/pineappleFirestoreService';
import { createCrashRoom, joinCrashRoom, addCrashBot } from './lib/crashFirestoreService';
import { recordHeadToHeadMatch } from './lib/headToHeadService';
import { PineappleMatchSettings, CrashMatchSettings, CrashBotStyle, GameInvite } from './types';
import { GameInvitePopup } from './components/GameInvitePopup';

type AppScreen = 'setup' | 'normal' | 'boardgame' | 'duel' | 'casino' | 'pineapple' | 'crash' | 'podium';

function MainAppContent() {
  const {
    theme,
    t,
    language,
    profiles,
    drunkenCoins,
    activeLegendaryAchievement,
    dismissLegendaryAchievement,
    activeXpBreakdown,
    dismissXpBreakdown,
  } = useApp();
  const { user, cloudProfile } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('setup');
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [matchTurnsPlayed, setMatchTurnsPlayed] = useState<number>(5);
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

  // Local player info for pineapple mode
  const [pineappleLocalPlayer, setPineappleLocalPlayer] = useState<{ id: string; name: string; avatarIcon: string; color: string }>({
    id: 'pn1',
    name: 'Fratele Vasile',
    avatarIcon: 'monk_drunk',
    color: '#e8c84a',
  });
  const [pineappleRoomCode, setPineappleRoomCode] = useState<string>('');
  const [pineappleIsHost, setPineappleIsHost] = useState<boolean>(true);

  // Local player info for crash mode
  const [crashLocalPlayer, setCrashLocalPlayer] = useState<{ id: string; name: string; avatarIcon: string; color: string }>({
    id: 'cr1',
    name: 'Fratele Vasile',
    avatarIcon: 'monk_drunk',
    color: '#e8c84a',
  });
  const [crashRoomCode, setCrashRoomCode] = useState<string>('');
  const [crashIsHost, setCrashIsHost] = useState<boolean>(true);

  // Duel and Casino hooks
  const duelSocket = useDuelSocket();
  const casinoSocket = useCasinoSocket();

  // Modals
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [scoreModalTab, setScoreModalTab] = useState<'live' | 'alltime' | 'achievements'>('achievements');
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);
  const [showCoinsModal, setShowCoinsModal] = useState<boolean>(false);

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

  const handleStartPineapple = async (
    role: 'host' | 'join',
    localPlayer: { id: string; name: string; avatarIcon: string; color: string },
    settings: PineappleMatchSettings,
    roomCode?: string,
    autoAddBot?: boolean,
    botDifficulty?: PineappleBotDifficulty
  ) => {
    setGameMode('pineapple');
    setPineappleLocalPlayer(localPlayer);
    setPineappleIsHost(role === 'host');

    if (role === 'host') {
      try {
        const code = await createPineappleRoom(localPlayer, settings);
        if (autoAddBot) {
          await addPineappleBot(code, botDifficulty || 'medium');
        }
        setPineappleRoomCode(code);
        setCurrentScreen('pineapple');
      } catch (err: any) {
        alert(err.message || 'Eroare la crearea camerei Pineapple!');
      }
    } else if (role === 'join' && roomCode) {
      try {
        const res = await joinPineappleRoom(roomCode, localPlayer);
        if (res.success) {
          setPineappleRoomCode(roomCode.trim().toUpperCase());
          setCurrentScreen('pineapple');
        } else {
          alert(res.error || 'Eroare la conectare!');
        }
      } catch (err: any) {
        alert(err.message || 'Eroare la conectare!');
      }
    }
  };

  const handleLeavePineapple = () => {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
    setCurrentScreen('setup');
  };

  const handleStartCrash = async (
    role: 'host' | 'join',
    localPlayer: { id: string; name: string; avatarIcon: string; color: string },
    settings: CrashMatchSettings,
    roomCode?: string,
    autoAddBot?: boolean,
    botStyle?: CrashBotStyle
  ) => {
    setGameMode('crash');
    setCrashLocalPlayer(localPlayer);
    setCrashIsHost(role === 'host');

    if (role === 'host') {
      try {
        const code = await createCrashRoom(localPlayer, settings, autoAddBot, botStyle || 'prudent');
        setCrashRoomCode(code);
        setCurrentScreen('crash');
      } catch (err: any) {
        console.error('Error starting crash room:', err);
        alert(err?.message || 'Eroare la crearea camerei Crash! Te rugăm să reîncerci.');
      }
    } else if (role === 'join' && roomCode) {
      try {
        const res = await joinCrashRoom(roomCode, localPlayer);
        if (res.success) {
          setCrashRoomCode(roomCode.trim().toUpperCase());
          setCurrentScreen('crash');
        } else {
          alert(res.error || 'Eroare la conectare!');
        }
      } catch (err: any) {
        console.error('Error joining crash room:', err);
        alert(err?.message || 'Eroare la conectare!');
      }
    }
  };

  const handleLeaveCrash = () => {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
    setCurrentScreen('setup');
  };

  const handleEndGame = (finalPlayers: Player[], turns: number = 5) => {
    setActivePlayers(finalPlayers);
    setMatchTurnsPlayed(turns);
    if (finalPlayers.length === 2 && (gameMode === 'boardgame' || gameMode === 'normal') && turns >= 2) {
      const p1 = finalPlayers[0];
      const p2 = finalPlayers[1];
      const score1 = p1.hasGivenUp ? 999999 : (p1.sipsTotal + 25 * p1.chugsTotal);
      const score2 = p2.hasGivenUp ? 999999 : (p2.sipsTotal + 25 * p2.chugsTotal);
      const isTie = score1 === score2;
      const winnerName = isTie ? null : (score1 < score2 ? p1.name : p2.name);
      recordHeadToHeadMatch(p1.name, p2.name, winnerName, gameMode, isTie);
    }
    setCurrentScreen('podium');
  };

  const handleRematch = () => {
    if (gameMode === 'normal' || gameMode === 'boardgame') {
      const resetPlayers = activePlayers.map(p => ({
        ...p,
        sipsTotal: 0,
        chugsTotal: 0,
        passesCount: 0,
        hasGivenUp: false,
        inJail: false,
        jailTurnsRemaining: 0,
        gold: 150,
        properties: [],
        position: 0,
      }));
      setActivePlayers(resetPlayers);
      setCurrentScreen(gameMode);
    } else if (gameMode === 'duel') {
      setCurrentScreen('duel');
    } else if (gameMode === 'casino') {
      setCurrentScreen('casino');
    } else if (gameMode === 'pineapple') {
      setCurrentScreen('pineapple');
    } else {
      setCurrentScreen('setup');
    }
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

  const handleAcceptGameInvite = (invite: GameInvite) => {
    const myName = cloudProfile?.displayName || user?.displayName || 'Fratele Vasile';
    const myAvatar = cloudProfile?.avatarIcon || 'monk_drunk';
    const localPlayer = {
      id: user?.uid || `guest_${Date.now()}`,
      name: myName,
      avatarIcon: myAvatar,
      color: '#50e3c2',
    };

    if (invite.mode === 'duel') {
      handleStartDuel('join', localPlayer, 'general', 'easy', invite.roomCode, 30);
    } else if (invite.mode === 'pineapple') {
      handleStartPineapple('join', localPlayer, { sipsPerPoint: 0.5, sipsToEndGame: 25 }, invite.roomCode);
    } else if (invite.mode === 'crash') {
      handleStartCrash('join', localPlayer, { sipsThreshold: 55, stakeMode: 'dynamic', groapaThreshold: 3 }, invite.roomCode);
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
      {currentScreen !== 'pineapple' && (
        <header className="w-full bg-[#161616]/85 border-b border-[#2a2a2a] backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 py-2 safe-top-padding flex items-center justify-between shadow-md">
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity active:scale-95 cursor-pointer"
          >
            <span className="text-xl">🍺</span>
            <span className="font-cinzel font-bold text-sm text-[#e8c84a] gold-text-glow">
              Barbutul lu' Călugăru
            </span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Drunken Coins Treasury & Balance Button */}
            <button
              onClick={() => setShowCoinsModal(true)}
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-amber-950 via-[#261509] to-[#1a0e05] border border-[#ffd700]/70 text-xs font-cinzel font-bold text-[#ffd700] hover:brightness-125 flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              title={language === 'ro' ? 'Bazarul Călugăresc & Tezaur Total (Bănuți Turmentați)' : 'Monastic Bazaar & Total Treasury (Drunken Coins)'}
            >
              <span className="text-sm">🍺🪙</span>
              <span className="font-mono font-bold text-[#ffd700]">
                {drunkenCoins.toLocaleString()}
              </span>
            </button>

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
      )}

      {/* Main Screen Router */}
      <main className={`container mx-auto relative z-10 safe-horizontal-padding ${currentScreen === 'pineapple' ? 'px-1 sm:px-2 max-w-5xl py-0.5' : 'px-2 sm:px-4'}`}>
        {currentScreen === 'setup' && (
          <SetupScreen
            onStartGame={handleStartGame}
            onStartDuel={handleStartDuel}
            onStartCasino={handleStartCasino}
            onStartPineapple={handleStartPineapple}
            onStartCrash={handleStartCrash}
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
            onOpenCoinsModal={() => setShowCoinsModal(true)}
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

        {currentScreen === 'pineapple' && (
          <PineappleGame
            roomCode={pineappleRoomCode}
            localPlayer={pineappleLocalPlayer}
            isHost={pineappleIsHost}
            onHome={handleLeavePineapple}
          />
        )}

        {currentScreen === 'crash' && (
          <CrashGame
            roomCode={crashRoomCode}
            localPlayer={crashLocalPlayer}
            isHost={crashIsHost}
            onExit={handleLeaveCrash}
          />
        )}

        {currentScreen === 'podium' && (
          <Podium
            mode={gameMode}
            players={activePlayers}
            turnsPlayed={matchTurnsPlayed}
            onRematch={handleRematch}
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
        onOpenBazaar={() => {
          setShowScoreModal(false);
          setShowCoinsModal(true);
        }}
      />

      <CloudAccountModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />

      {showCustomizeModal && (
        <div
          onClick={() => setShowCustomizeModal(false)}
          style={{ zIndex: 99990 }}
          className="fixed inset-0 z-[99990] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#161616] border-2 border-[#e8c84a] rounded-2xl p-4 max-w-xl w-full max-h-[90vh] overflow-y-auto gold-glow"
          >
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

      {/* Cross-Mode XP Gain & Level-Up Celebration Modal */}
      {activeXpBreakdown && (
        <XpGainModal
          breakdown={activeXpBreakdown.breakdown}
          playerName={activeXpBreakdown.playerName}
          avatarIcon={activeXpBreakdown.avatarIcon}
          isOpen={Boolean(activeXpBreakdown)}
          onClose={dismissXpBreakdown}
        />
      )}

      {/* Drunken Coins Bazaar & Treasury Modal */}
      <DrunkenCoinsShopModal
        isOpen={showCoinsModal}
        onClose={() => setShowCoinsModal(false)}
      />

      {/* Global Live Game Invite Floating Banner */}
      <GameInvitePopup onAcceptInvite={handleAcceptGameInvite} />
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
