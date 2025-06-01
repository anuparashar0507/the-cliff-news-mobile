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
  Trophy,
  Target,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'pvp' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';

const { width } = Dimensions.get('window');
const boardPadding = 20;
const boardSize = Math.min(width - boardPadding * 2, 320);
const cellSize = (boardSize - 16) / 3; // Account for borders

interface GameStats {
  X: number;
  O: number;
  Draw: number;
  gamesPlayed: number;
}

const TicTacToeGameScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();

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
  const [stats, setStats] = useState<GameStats>({
    X: 0,
    O: 0,
    Draw: 0,
    gamesPlayed: 0,
  });
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
      setGameTime(0);
      setIsTimerRunning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
              ? `Game completed in ${formatTime(gameTime)}!`
              : `Congratulations! Game won in ${formatTime(gameTime)}!`,
          type: gameWinner === 'Draw' ? 'draw' : 'win',
        });
        setIsModalVisible(true);
      }
    }
  }, [board, winner, checkWinner, gameTime]);

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
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // AI Move Logic (simplified)
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
      // Medium: Try to win, then block, then random
      for (const cellIndex of emptyCells) {
        const tempBoard = [...board];
        tempBoard[cellIndex] = 'O';
        if (checkWinner(tempBoard) === 'O') {
          move = cellIndex;
          break;
        }
      }
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
      if (move === undefined) {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    } else {
      // Hard: Minimax algorithm
      move = getBestMove(board);
    }

    if (move !== undefined) {
      setTimeout(() => {
        const newBoard = [...board];
        newBoard[move!] = 'O';
        setBoard(newBoard);
        setCurrentPlayer('X');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    const row = Math.floor(index / 3);
    const col = index % 3;
    const left = col * (cellSize + 2) + 8; // 8px padding + 2px gap
    const top = row * (cellSize + 2) + 8;

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
        style={[
          styles.cell,
          {
            backgroundColor: colors.surface,
            borderColor: colors.textSecondary,
            left: left,
            top: top,
          },
          isWinningCell && { backgroundColor: colors.accent, opacity: 0.8 },
        ]}
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
            value === 'X'
              ? { color: colors.primary }
              : { color: colors.accent },
            isWinningCell && { color: colors.white },
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.primary}
        />

        {/* Custom Header with proper safe area */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top, backgroundColor: colors.primary },
          ]}
        >
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
              <Target size={60} color={colors.primary} />
              <Text style={[styles.setupTitle, { color: colors.textPrimary }]}>
                Tic Tac Toe
              </Text>
              <Text
                style={[styles.setupSubtitle, { color: colors.textSecondary }]}
              >
                Choose your game mode
              </Text>
            </View>

            <View style={styles.modeSelection}>
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      gameMode === 'pvp'
                        ? colors.primary
                        : colors.textSecondary,
                  },
                  gameMode === 'pvp' && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setGameMode('pvp');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Users
                  size={40}
                  color={gameMode === 'pvp' ? COLORS.white : colors.primary}
                />
                <Text
                  style={[
                    styles.modeCardTitle,
                    {
                      color:
                        gameMode === 'pvp' ? COLORS.white : colors.textPrimary,
                    },
                  ]}
                >
                  Two Players
                </Text>
                <Text
                  style={[
                    styles.modeCardDescription,
                    {
                      color:
                        gameMode === 'pvp'
                          ? COLORS.white
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Play with a friend locally
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      gameMode === 'ai' ? colors.primary : colors.textSecondary,
                  },
                  gameMode === 'ai' && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setGameMode('ai');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Brain
                  size={40}
                  color={gameMode === 'ai' ? COLORS.white : colors.primary}
                />
                <Text
                  style={[
                    styles.modeCardTitle,
                    {
                      color:
                        gameMode === 'ai' ? COLORS.white : colors.textPrimary,
                    },
                  ]}
                >
                  vs Computer
                </Text>
                <Text
                  style={[
                    styles.modeCardDescription,
                    {
                      color:
                        gameMode === 'ai' ? COLORS.white : colors.textSecondary,
                    },
                  ]}
                >
                  Challenge the AI
                </Text>
              </TouchableOpacity>
            </View>

            {gameMode === 'ai' && (
              <View style={styles.difficultySection}>
                <Text
                  style={[
                    styles.difficultyTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  AI Difficulty
                </Text>
                <View style={styles.difficultyButtons}>
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor:
                            aiDifficulty === level
                              ? colors.primary
                              : colors.textSecondary,
                        },
                        aiDifficulty === level && {
                          backgroundColor: colors.accent,
                        },
                      ]}
                      onPress={() => {
                        setAiDifficulty(level);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          {
                            color:
                              aiDifficulty === level
                                ? COLORS.white
                                : colors.textPrimary,
                          },
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {stats.gamesPlayed > 0 && (
              <View
                style={[
                  styles.statsSection,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[styles.statsTitle, { color: colors.textPrimary }]}
                >
                  Game Statistics
                </Text>
                <View style={styles.statsGrid}>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[styles.statValue, { color: colors.textPrimary }]}
                    >
                      {stats.gamesPlayed}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Games
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {stats.X}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      X Wins
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={[styles.statValue, { color: colors.accent }]}>
                      {stats.O}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      O Wins
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[styles.statValue, { color: colors.textPrimary }]}
                    >
                      {stats.Draw}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Draws
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                setGameStarted(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }}
            >
              <Zap size={24} color={COLORS.white} />
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Main game screen
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />

      {/* Game Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: colors.primary },
        ]}
      >
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
          <View style={[styles.gameInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Turn
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color:
                        currentPlayer === 'X' ? colors.primary : colors.accent,
                    },
                  ]}
                >
                  Player {currentPlayer}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Time
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatTime(gameTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Game Board */}
          <View style={styles.boardContainer}>
            <View
              style={[styles.board, { backgroundColor: colors.textSecondary }]}
            >
              {board.map((_, index) => renderCell(index))}
            </View>
          </View>

          {/* Game Controls */}
          <View style={styles.gameControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.textSecondary,
                },
              ]}
              onPress={() => startNewGame(gameMode, aiDifficulty)}
            >
              <RefreshCw size={20} color={colors.primary} />
              <Text
                style={[styles.controlButtonText, { color: colors.primary }]}
              >
                New Game
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.textSecondary,
                },
              ]}
              onPress={() => setGameStarted(false)}
            >
              <Target size={20} color={colors.primary} />
              <Text
                style={[styles.controlButtonText, { color: colors.primary }]}
              >
                Change Mode
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current Game Stats */}
          <View style={styles.currentStats}>
            <View
              style={[styles.scoreBoard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>
                  Player X
                </Text>
                <Text style={[styles.scoreValue, { color: colors.primary }]}>
                  {stats.X}
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text
                  style={[styles.scoreText, { color: colors.textSecondary }]}
                >
                  Draws
                </Text>
                <Text
                  style={[styles.scoreValue, { color: colors.textPrimary }]}
                >
                  {stats.Draw}
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreText, { color: colors.accent }]}>
                  Player O
                </Text>
                <Text style={[styles.scoreValue, { color: colors.accent }]}>
                  {stats.O}
                </Text>
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
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          {modalContent?.type === 'win' && (
            <Trophy size={60} color={colors.accent} style={styles.modalIcon} />
          )}
          {modalContent?.type === 'draw' && (
            <Target size={60} color={colors.warning} style={styles.modalIcon} />
          )}

          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {modalContent?.title}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
            {modalContent?.message}
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => startNewGame(gameMode, aiDifficulty)}
            >
              <Text style={styles.modalButtonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalSecondaryButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setGameStarted(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                Back to Menu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 16,
    marginBottom: 8,
  },
  setupSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    textAlign: 'center',
  },
  modeSelection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeCardTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeCardDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  difficultySection: {
    marginBottom: 30,
  },
  difficultyTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  difficultyButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
  },
  statsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Game Screen Styles
  gameContainer: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  gameInfo: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
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
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  board: {
    width: boardSize,
    height: boardSize,
    borderRadius: 12,
    padding: 4, // Reduce padding
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Remove flexDirection and flexWrap - use absolute positioning instead
  },
  cell: {
    width: cellSize,
    height: cellSize,
    position: 'absolute', // Use absolute positioning
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
  },
  cellText: {
    fontSize: cellSize * 0.5,
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontWeight: 'bold',
  },
  gameControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    elevation: 2,
  },
  controlButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    marginLeft: 6,
  },
  currentStats: {
    marginTop: 'auto',
    width: '100%',
  },
  scoreBoard: {
    flexDirection: 'row',
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
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalContent: {
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
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalMessage: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalSecondaryButton: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default TicTacToeGameScreen;
