import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Modal from 'react-native-modal';
import {
  ArrowLeft,
  Home,
  RefreshCw,
  Users,
  Brain,
  Info,
  X,
  Trophy,
  Target,
  Zap,
  RotateCcw,
  TrendingUp,
} from 'lucide-react-native';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'pvp' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';

const { width } = Dimensions.get('window');
const boardPadding = 16;
const boardSize = width - boardPadding * 2 - 40;
const cellSize = boardSize / 3;

interface GameStats {
  X: number;
  O: number;
  Draw: number;
  gamesPlayed: number;
}

const TicTacToeGameScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    type: 'win' | 'draw' | 'info';
  } | null>(null);
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    X: 0,
    O: 0,
    Draw: 0,
    gamesPlayed: 0,
  });
  const [gameHistory, setGameHistory] = useState<Board[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isTimerRunning && gameStarted) {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameStarted]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const playImpactHaptic = (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium
  ) => {
    Haptics.impactAsync(style);
  };

  const playNotificationHaptic = (
    type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
      .Success
  ) => {
    Haptics.notificationAsync(type);
  };

  const checkWinner = useCallback(
    (currentBoard: Board): Player | 'Draw' | null => {
      const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // columns
        [0, 4, 8],
        [2, 4, 6], // diagonals
      ];

      for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (
          currentBoard[a] &&
          currentBoard[a] === currentBoard[b] &&
          currentBoard[a] === currentBoard[c]
        ) {
          return currentBoard[a];
        }
      }

      if (currentBoard.every((cell) => cell !== null)) {
        return 'Draw';
      }
      return null;
    },
    []
  );

  const startNewGame = useCallback(
    (mode: GameMode = gameMode, difficulty: Difficulty = aiDifficulty) => {
      setBoard(Array(9).fill(null));
      setCurrentPlayer('X');
      setWinner(null);
      setGameMode(mode);
      setAiDifficulty(difficulty);
      setIsModalVisible(false);
      setGameHistory([]);
      setMoveCount(0);
      setGameTime(0);
      setIsTimerRunning(true);
      playImpactHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    },
    [gameMode, aiDifficulty]
  );

  // Start the game when the component mounts
  useEffect(() => {
    if (gameStarted) {
      startNewGame(gameMode, aiDifficulty);
    }
  }, [gameStarted]);

  useEffect(() => {
    if (!winner) {
      const gameWinner = checkWinner(board);
      if (gameWinner) {
        setWinner(gameWinner);
        setIsTimerRunning(false);
        playNotificationHaptic(Haptics.NotificationFeedbackType.Success);

        // Update stats
        setStats((prev) => ({
          ...prev,
          [gameWinner === 'Draw' ? 'Draw' : gameWinner]:
            prev[gameWinner === 'Draw' ? 'Draw' : (gameWinner as 'X' | 'O')] +
            1,
          gamesPlayed: prev.gamesPlayed + 1,
        }));

        // Show result modal
        setModalContent({
          title:
            gameWinner === 'Draw'
              ? "It's a Draw!"
              : `Player ${gameWinner} Wins!`,
          message:
            gameWinner === 'Draw'
              ? `Game completed in ${moveCount} moves and ${formatTime(
                  gameTime
                )}!`
              : `Congratulations! Game won in ${moveCount} moves and ${formatTime(
                  gameTime
                )}!`,
          type: gameWinner === 'Draw' ? 'draw' : 'win',
        });
        setIsModalVisible(true);
      }
    }
  }, [board, winner, checkWinner, moveCount, gameTime]);

  const makeMove = (index: number) => {
    if (
      board[index] !== null ||
      winner ||
      (gameMode === 'ai' && currentPlayer === 'O')
    ) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setGameHistory((prev) => [...prev, newBoard]);
    setMoveCount((prev) => prev + 1);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    playImpactHaptic();
  };

  // Enhanced AI with different difficulty levels
  const makeAIMove = useCallback(() => {
    if (winner) return;

    const emptyCells = board
      .map((cell, index) => (cell === null ? index : -1))
      .filter((index) => index !== -1);

    if (emptyCells.length === 0) return;

    let move: number | undefined;

    if (aiDifficulty === 'easy') {
      // Easy: Random moves
      move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else if (aiDifficulty === 'medium') {
      // Medium: Win if possible, block if necessary, otherwise random
      // Try to win
      for (const cellIndex of emptyCells) {
        const tempBoard = [...board];
        tempBoard[cellIndex] = 'O';
        if (checkWinner(tempBoard) === 'O') {
          move = cellIndex;
          break;
        }
      }
      // Try to block
      if (move === undefined) {
        for (const cellIndex of emptyCells) {
          const tempBoard = [...board];
          tempBoard[cellIndex] = 'X';
          if (checkWinner(tempBoard) === 'X') {
            move = cellIndex;
            break;
          }
        }
      }
      // Random if nothing strategic
      if (move === undefined) {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    } else {
      // Hard: Minimax algorithm for optimal play
      move = getBestMove(board);
    }

    if (move !== undefined) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      setTimeout(() => {
        setBoard(newBoard);
        setGameHistory((prev) => [...prev, newBoard]);
        setMoveCount((prev) => prev + 1);
        setCurrentPlayer('X');
        playImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
      }, 500);
    }
  }, [board, winner, checkWinner, aiDifficulty]);

  // Minimax algorithm for hard AI
  const minimax = (
    board: Board,
    depth: number,
    isMaximizing: boolean
  ): number => {
    const result = checkWinner(board);

    if (result === 'O') return 1;
    if (result === 'X') return -1;
    if (result === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (board: Board): number => {
    let bestScore = -Infinity;
    let bestMove = 0;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner && gameStarted) {
      makeAIMove();
    }
  }, [currentPlayer, gameMode, winner, makeAIMove, gameStarted]);

  const resetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset all game statistics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setStats({ X: 0, O: 0, Draw: 0, gamesPlayed: 0 }),
        },
      ]
    );
  };

  const handleBack = () => {
    if (isTimerRunning) {
      Alert.alert(
        'Exit Game?',
        'Your current game will be lost. Are you sure?',
        [
          { text: 'Continue Playing', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell =
      winner &&
      winner !== 'Draw' &&
      [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ]
        .find((pattern) => pattern.every((i) => board[i] === winner))
        ?.includes(index);

    return (
      <TouchableOpacity
        key={index}
        style={[styles.cell, isWinningCell && styles.winningCell]}
        onPress={() => makeMove(index)}
        disabled={
          value !== null ||
          !!winner ||
          (gameMode === 'ai' && currentPlayer === 'O')
        }
      >
        <Text
          style={[
            styles.cellText,
            value === 'X' ? styles.xText : styles.oText,
            isWinningCell && styles.winningCellText,
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  // Game setup screen
  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Custom Header with proper safe area */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tic Tac Toe</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.headerButton}
          >
            <Home size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
          <ScrollView contentContainerStyle={styles.setupContainer}>
            <View style={styles.setupHeader}>
              <Target size={60} color={COLORS.primary} />
              <Text style={styles.setupTitle}>Tic Tac Toe</Text>
              <Text style={styles.setupSubtitle}>Choose your game mode</Text>
            </View>

            <View style={styles.modeSelection}>
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  gameMode === 'pvp' && styles.selectedModeCard,
                ]}
                onPress={() => {
                  setGameMode('pvp');
                  playImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Users
                  size={40}
                  color={gameMode === 'pvp' ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.modeCardTitle,
                    gameMode === 'pvp' && styles.selectedModeCardTitle,
                  ]}
                >
                  Two Players
                </Text>
                <Text
                  style={[
                    styles.modeCardDescription,
                    gameMode === 'pvp' && styles.selectedModeCardDescription,
                  ]}
                >
                  Play with a friend locally
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeCard,
                  gameMode === 'ai' && styles.selectedModeCard,
                ]}
                onPress={() => {
                  setGameMode('ai');
                  playImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Brain
                  size={40}
                  color={gameMode === 'ai' ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.modeCardTitle,
                    gameMode === 'ai' && styles.selectedModeCardTitle,
                  ]}
                >
                  vs Computer
                </Text>
                <Text
                  style={[
                    styles.modeCardDescription,
                    gameMode === 'ai' && styles.selectedModeCardDescription,
                  ]}
                >
                  Challenge the AI
                </Text>
              </TouchableOpacity>
            </View>

            {gameMode === 'ai' && (
              <View style={styles.difficultySection}>
                <Text style={styles.difficultyTitle}>AI Difficulty</Text>
                <View style={styles.difficultyButtons}>
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        aiDifficulty === level &&
                          styles.selectedDifficultyButton,
                      ]}
                      onPress={() => {
                        setAiDifficulty(level);
                        playImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          aiDifficulty === level &&
                            styles.selectedDifficultyButtonText,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.difficultyDescription}>
                  {aiDifficulty === 'easy' &&
                    'Relaxed gameplay - AI makes random moves'}
                  {aiDifficulty === 'medium' &&
                    'Balanced challenge - AI plays strategically but not perfectly'}
                  {aiDifficulty === 'hard' &&
                    'Ultimate challenge - AI plays optimally using minimax'}
                </Text>
              </View>
            )}

            {stats.gamesPlayed > 0 && (
              <View style={styles.statsSection}>
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>Game Statistics</Text>
                  <TouchableOpacity
                    onPress={resetStats}
                    style={styles.resetStatsButton}
                  >
                    <RotateCcw size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, styles.xText]}>
                      {stats.X}
                    </Text>
                    <Text style={styles.statLabel}>X Wins</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, styles.oText]}>
                      {stats.O}
                    </Text>
                    <Text style={styles.statLabel}>O Wins</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.Draw}</Text>
                    <Text style={styles.statLabel}>Draws</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                setGameStarted(true);
                playImpactHaptic(Haptics.ImpactFeedbackStyle.Heavy);
              }}
            >
              <Zap size={24} color={COLORS.white} />
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setIsInstructionsVisible(true)}
            >
              <Info size={20} color={COLORS.primary} />
              <Text style={styles.infoButtonText}>How to Play</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Main game screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Game Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tic Tac Toe</Text>
          <Text style={styles.headerSubtitle}>
            {gameMode === 'ai' ? `vs AI (${aiDifficulty})` : 'Two Players'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={styles.headerButton}
        >
          <Home size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.gameContainer}>
          {/* Game Info */}
          <View style={styles.gameInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Turn</Text>
                <Text
                  style={[
                    styles.infoValue,
                    currentPlayer === 'X' ? styles.xText : styles.oText,
                  ]}
                >
                  Player {currentPlayer}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Moves</Text>
                <Text style={styles.infoValue}>{moveCount}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{formatTime(gameTime)}</Text>
              </View>
            </View>
          </View>

          {/* Game Board */}
          <View style={styles.boardContainer}>
            <View style={styles.board}>
              {board.map((_, index) => renderCell(index))}
            </View>
          </View>

          {/* Game Controls */}
          <View style={styles.gameControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => startNewGame(gameMode, aiDifficulty)}
            >
              <RefreshCw size={20} color={COLORS.primary} />
              <Text style={styles.controlButtonText}>New Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setIsInstructionsVisible(true)}
            >
              <Info size={20} color={COLORS.primary} />
              <Text style={styles.controlButtonText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setGameStarted(false)}
            >
              <TrendingUp size={20} color={COLORS.primary} />
              <Text style={styles.controlButtonText}>Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Current Game Stats */}
          <View style={styles.currentStats}>
            <View style={styles.scoreBoard}>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreText, styles.xText]}>Player X</Text>
                <Text style={[styles.scoreValue, styles.xText]}>{stats.X}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreText}>Draws</Text>
                <Text style={styles.scoreValue}>{stats.Draw}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreText, styles.oText]}>Player O</Text>
                <Text style={[styles.scoreValue, styles.oText]}>{stats.O}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Game Result Modal */}
      <Modal
        isVisible={isModalVisible}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
        onBackdropPress={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContent}>
          {modalContent?.type === 'win' && (
            <Trophy size={60} color={COLORS.accent} style={styles.modalIcon} />
          )}
          {modalContent?.type === 'draw' && (
            <Target size={60} color={COLORS.warning} style={styles.modalIcon} />
          )}

          <Text style={styles.modalTitle}>{modalContent?.title}</Text>
          <Text style={styles.modalMessage}>{modalContent?.message}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => startNewGame(gameMode, aiDifficulty)}
            >
              <Text style={styles.modalButtonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSecondaryButton]}
              onPress={() => setGameStarted(false)}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  styles.modalSecondaryButtonText,
                ]}
              >
                Back to Menu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Instructions Modal */}
      <Modal
        isVisible={isInstructionsVisible}
        onBackdropPress={() => setIsInstructionsVisible(false)}
        style={styles.instructionsModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.instructionsContent}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>
              How to Play Tic Tac Toe
            </Text>
            <TouchableOpacity
              onPress={() => setIsInstructionsVisible(false)}
              style={styles.closeInstructionsButton}
            >
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.instructionsText}>
              <Text style={styles.instructionsBold}>Objective:</Text>
              {'\n'}
              Be the first player to get three of your marks in a row
              (horizontally, vertically, or diagonally).
              {'\n\n'}
              <Text style={styles.instructionsBold}>How to Play:</Text>
              {'\n'}• The game is played on a 3×3 grid{'\n'}• Player X always
              goes first{'\n'}• Take turns placing your mark in empty squares
              {'\n'}• First to get 3 in a row wins!{'\n'}• If all squares are
              filled with no winner, it's a draw{'\n\n'}
              <Text style={styles.instructionsBold}>Game Modes:</Text>
              {'\n'}• <Text style={styles.instructionsBold}>Two Players:</Text>{' '}
              Play with a friend on the same device{'\n'}•{' '}
              <Text style={styles.instructionsBold}>vs Computer:</Text>{' '}
              Challenge the AI with three difficulty levels{'\n\n'}
              <Text style={styles.instructionsBold}>AI Difficulty:</Text>
              {'\n'}• <Text style={styles.instructionsBold}>Easy:</Text> AI
              makes random moves{'\n'}•{' '}
              <Text style={styles.instructionsBold}>Medium:</Text> AI plays
              strategically but not perfectly{'\n'}•{' '}
              <Text style={styles.instructionsBold}>Hard:</Text> AI plays
              optimally using minimax algorithm{'\n\n'}
              <Text style={styles.instructionsBold}>Tips:</Text>
              {'\n'}• Control the center square when possible{'\n'}• Watch for
              opportunities to create two winning lines at once{'\n'}• Block
              your opponent when they have two in a row{'\n'}• Have fun and good
              luck! 🎯
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setIsInstructionsVisible(false)}
          >
            <Text style={styles.modalButtonText}>Got It!</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },

  // Setup Screen Styles
  setupContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  setupTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 32,
    color: COLORS.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  setupSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  modeSelection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedModeCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 6,
  },
  modeCardTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.secondary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  selectedModeCardTitle: {
    color: COLORS.white,
  },
  modeCardDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedModeCardDescription: {
    color: COLORS.white,
    opacity: 0.9,
  },
  difficultySection: {
    marginBottom: 30,
  },
  difficultyTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  selectedDifficultyButton: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  difficultyButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    color: COLORS.secondary,
  },
  selectedDifficultyButtonText: {
    color: COLORS.white,
  },
  difficultyDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  statsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.secondary,
  },
  resetStatsButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },

  // Game Screen Styles
  gameContainer: {
    flexGrow: 1,
    padding: 20,
  },
  gameInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  board: {
    width: boardSize,
    height: boardSize,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 4,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cell: {
    width: (boardSize - 16) / 3,
    height: (boardSize - 16) / 3,
    backgroundColor: COLORS.white,
    margin: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  winningCell: {
    backgroundColor: COLORS.accent,
  },
  cellText: {
    fontSize: cellSize * 0.5,
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontWeight: 'bold',
  },
  winningCellText: {
    color: COLORS.white,
  },
  xText: {
    color: COLORS.primary,
  },
  oText: {
    color: COLORS.accent,
  },
  gameControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    elevation: 2,
  },
  controlButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 6,
  },
  currentStats: {
    marginTop: 'auto',
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  scoreText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },

  // Modal Styles
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    color: COLORS.secondary,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalMessage: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modalButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalSecondaryButtonText: {
    color: COLORS.secondary,
  },

  // Instructions Modal
  instructionsModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  instructionsContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  instructionsTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  closeInstructionsButton: {
    padding: 8,
  },
  instructionsText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 24,
    marginBottom: 24,
  },
  instructionsBold: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
});

export default TicTacToeGameScreen;
