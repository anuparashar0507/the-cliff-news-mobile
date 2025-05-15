import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { Stack, useRouter } from 'expo-router'; // Keep useRouter for back navigation if needed for custom logic
import * as Haptics from 'expo-haptics';
import Modal from 'react-native-modal';
import { RefreshCw, Users, Brain, Info, X } from 'lucide-react-native';

// Removed GameHeader import as header will be managed by GamesStackLayout

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'pvp' | 'ai';

const { width } = Dimensions.get('window');
const boardPadding = 16;
const boardSize = width - boardPadding * 2 - 40;
const cellSize = boardSize / 3;

const TicTacToeGameScreen = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  // const [gameStarted, setGameStarted] = useState(false); // gameStarted state might not be needed if game starts on load
  const router = useRouter(); // Keep for potential custom back navigation or other routing
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, Draw: 0 });

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
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
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
    (mode: GameMode = gameMode) => {
      setBoard(Array(9).fill(null));
      setCurrentPlayer('X');
      setWinner(null);
      setGameMode(mode);
      setIsModalVisible(false);
      playImpactHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    },
    [gameMode]
  );

  // Start the game when the component mounts
  useEffect(() => {
    startNewGame(gameMode);
  }, []);

  useEffect(() => {
    if (!winner) {
      const gameWinner = checkWinner(board);
      if (gameWinner) {
        setWinner(gameWinner);
        playNotificationHaptic(Haptics.NotificationFeedbackType.Success);
        setModalContent({
          title:
            gameWinner === 'Draw'
              ? "It's a Draw!"
              : `Player ${gameWinner} Wins!`,
          message:
            gameWinner === 'Draw'
              ? 'No one wins this round. Try again!'
              : `Congratulations Player ${gameWinner}!`,
        });
        setIsModalVisible(true);
        if (gameWinner === 'Draw') {
          setScores((prev) => ({ ...prev, Draw: prev.Draw + 1 }));
        } else {
          setScores((prev) => ({
            ...prev,
            [gameWinner]: prev[gameWinner as 'X' | 'O'] + 1,
          }));
        }
      }
    }
  }, [board, winner, checkWinner]);

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
    playImpactHaptic();
  };

  const makeAIMove = useCallback(() => {
    if (winner) return;
    const emptyCells = board
      .map((cell, index) => (cell === null ? index : -1))
      .filter((index) => index !== -1);
    if (emptyCells.length === 0) return;

    let move: number | undefined;
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
    if (move === undefined && board[4] === null) move = 4;
    if (move === undefined) {
      const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
      if (corners.length > 0)
        move = corners[Math.floor(Math.random() * corners.length)];
    }
    if (move === undefined)
      move = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    if (move !== undefined) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      setTimeout(() => {
        setBoard(newBoard);
        setCurrentPlayer('X');
        playImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
      }, 500);
    }
  }, [board, winner, checkWinner]);

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner) {
      makeAIMove();
    }
  }, [currentPlayer, gameMode, winner, makeAIMove]);

  const renderCell = (index: number) => {
    const value = board[index];
    return (
      <TouchableOpacity
        key={index}
        style={styles.cell}
        onPress={() => makeMove(index)}
        disabled={
          value !== null ||
          !!winner ||
          (gameMode === 'ai' && currentPlayer === 'O')
        }
      >
        <Text
          style={[styles.cellText, value === 'X' ? styles.xText : styles.oText]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeAreaContainer}
      edges={['top', 'bottom', 'left', 'right']} // Apply safe area to top as well
    >
      {/* <Stack.Screen options={{ headerShown: false }} /> 
        REMOVED: Header is now controlled by GamesStackLayout 
      */}
      {/* <GameHeader title="Tic Tac Toe" onBack={() => router.back()} /> 
        REMOVED: Header is now controlled by GamesStackLayout.
        The title "Tic Tac Toe" should be set in app/(tabs)/games/_layout.tsx for this screen.
        The back button is automatically provided by the Stack navigator.
        "New Game" functionality is typically handled by an in-game button.
      */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* In-game controls, not the main screen header */}
        <View style={styles.headerControls}>
          <TouchableOpacity
            onPress={() => startNewGame(gameMode)}
            style={styles.iconButton}
          >
            <RefreshCw size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.turnIndicator}>
            {winner ? `Game Over!` : `Player ${currentPlayer}'s Turn`}
          </Text>
          <TouchableOpacity
            onPress={() => setIsInstructionsVisible(true)}
            style={styles.iconButton}
          >
            <Info size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              gameMode === 'pvp' && styles.activeModeButton,
            ]}
            onPress={() => startNewGame('pvp')}
          >
            <Users
              size={20}
              color={gameMode === 'pvp' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.modeButtonText,
                gameMode === 'pvp' && styles.activeModeButtonText,
              ]}
            >
              2 Players
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              gameMode === 'ai' && styles.activeModeButton,
            ]}
            onPress={() => startNewGame('ai')}
          >
            <Brain
              size={20}
              color={gameMode === 'ai' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.modeButtonText,
                gameMode === 'ai' && styles.activeModeButtonText,
              ]}
            >
              vs AI
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.board}>
          {board.map((_, index) => renderCell(index))}
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreText, styles.xText]}>Player X</Text>
            <Text style={[styles.scoreValue, styles.xText]}>{scores.X}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreText}>Draws</Text>
            <Text style={styles.scoreValue}>{scores.Draw}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreText, styles.oText]}>Player O</Text>
            <Text style={[styles.scoreValue, styles.oText]}>{scores.O}</Text>
          </View>
        </View>

        {winner && (
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => startNewGame(gameMode)}
          >
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
        )}

        <Modal
          isVisible={isModalVisible}
          backdropOpacity={0.5}
          animationIn="zoomIn"
          animationOut="zoomOut"
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
            <Text style={styles.modalMessage}>{modalContent?.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => startNewGame(gameMode)}
            >
              <Text style={styles.modalButtonText}>New Game</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text
                style={[styles.modalButtonText, styles.modalCloseButtonText]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          isVisible={isInstructionsVisible}
          onBackdropPress={() => setIsInstructionsVisible(false)}
          style={styles.instructionsModalView}
          animationIn="slideInUp"
          animationOut="slideOutDown"
        >
          <View style={styles.instructionsModalContent}>
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
                1. The game is played on a grid that's 3 squares by 3 squares.
                {'\n'}2. You are X, your friend (or the AI) is O. Players take
                turns putting their marks in empty squares.
                {'\n'}3. The first player to get 3 of their marks in a row (up,
                down, across, or diagonally) is the winner.
                {'\n'}4. When all 9 squares are full, the game is over. If no
                player has 3 marks in a row, the game ends in a tie.
                {'\n'}5. Tap on an empty cell to place your mark.
                {'\n'}6. Good luck!
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: boardPadding,
  },
  headerControls: {
    // This is for in-game controls like refresh, not the main screen header
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10, // Reduced from 20 as main header provides top spacing
    // marginTop: 5, // Removed as SafeAreaView with 'top' edge handles top spacing
    paddingHorizontal: 10,
  },
  iconButton: {
    padding: 8,
  },
  turnIndicator: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 15,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  activeModeButton: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  activeModeButtonText: {
    color: COLORS.white,
  },
  board: {
    width: boardSize,
    height: boardSize,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cell: {
    width: cellSize - (Platform.OS === 'ios' ? 1.4 : 1.4),
    height: cellSize - (Platform.OS === 'ios' ? 1.4 : 1.4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.7,
    borderColor: COLORS.gray,
  },
  cellText: {
    fontSize: cellSize * 0.6,
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontWeight: 'bold',
  },
  xText: {
    color: COLORS.primary,
  },
  oText: {
    color: COLORS.accent,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 25,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    elevation: 2,
  },
  scoreItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  scoreText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 2,
  },
  scoreValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    marginTop: 4,
  },
  playAgainButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    elevation: 2,
  },
  playAgainButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 17,
    color: COLORS.white,
  },
  modalContent: {
    backgroundColor: COLORS.surfaceLight,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    color: COLORS.secondary,
    marginBottom: 15,
  },
  modalMessage: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
  },
  modalCloseButton: {
    backgroundColor: COLORS.lightGray,
  },
  modalCloseButtonText: {
    color: COLORS.secondary,
  },
  instructionsModalView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  instructionsModalContent: {
    backgroundColor: COLORS.surfaceLight,
    padding: 20,
    paddingTop: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    color: COLORS.secondary,
  },
  closeInstructionsButton: {
    padding: 8,
  },
  instructionsText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 24,
    marginBottom: 20,
  },
});

export default TicTacToeGameScreen;
