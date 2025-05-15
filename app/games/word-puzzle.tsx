import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State as GestureState,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { ActivityIndicator } from 'react-native';
// Assuming GameHeader is a reusable component
// import GameHeader from '@/components/GameHeader';
import { generateWordPuzzle, WordPuzzleData } from '@/utils/wordPuzzleUtils'; // Ensure this utility exists
import {
  CheckCircle,
  HelpCircle,
  Info,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const GRID_MAX_WIDTH = Math.min(width - 32, 400); // Max width for the grid container

interface CellPosition {
  row: number;
  col: number;
}

const WordPuzzleGameScreen = () => {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<WordPuzzleData | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'easy'
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);

  const gridLayout = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    cellSize: number;
  } | null>(null);
  const cellSize = useRef(0); // Will be calculated on layout

  // Animation for the grid appearing
  const gridOpacity = useSharedValue(0);
  const gridScale = useSharedValue(0.9);

  const animatedGridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
    transform: [{ scale: gridScale.value }],
  }));

  const startNewGame = useCallback(
    async (level: 'easy' | 'medium' | 'hard') => {
      setIsLoading(true);
      gridOpacity.value = 0;
      gridScale.value = 0.9;
      // Simulate generation delay for UX
      await new Promise((resolve) => setTimeout(resolve, 200));
      const newPuzzle = generateWordPuzzle(level); // Ensure this function is robust
      setPuzzle(newPuzzle);
      setFoundWords([]);
      setSelectedCells([]);
      setCurrentWord('');
      setIsLoading(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      gridOpacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      gridScale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    },
    [gridOpacity, gridScale]
  );

  useEffect(() => {
    if (gameStarted) {
      startNewGame(difficulty);
    }
  }, [gameStarted, difficulty, startNewGame]);

  const handleGridCellLayout = (event: LayoutChangeEvent) => {
    if (puzzle && puzzle.grid.length > 0) {
      const { width: gridWidth } = event.nativeEvent.layout;
      cellSize.current = gridWidth / puzzle.grid[0].length; // Assuming square grid
    }
  };

  const onPanGestureEvent = (event: any) => {
    if (!puzzle || !gridLayout.current || cellSize.current === 0) return;

    const { x, y } = event.nativeEvent;
    const {
      x: gridX,
      y: gridY,
      cellSize: currentCellSize,
    } = gridLayout.current;

    // Calculate relative coordinates within the grid
    const relativeX = x - gridX;
    const relativeY = y - gridY;

    const col = Math.floor(relativeX / currentCellSize);
    const row = Math.floor(relativeY / currentCellSize);

    if (
      row >= 0 &&
      row < puzzle.grid.length &&
      col >= 0 &&
      col < puzzle.grid[0].length
    ) {
      const newCell = { row, col };
      const lastCell =
        selectedCells.length > 0
          ? selectedCells[selectedCells.length - 1]
          : null;

      const isAlreadySelected = selectedCells.some(
        (cell) => cell.row === row && cell.col === col
      );

      if (!isAlreadySelected) {
        // Basic adjacency check for smoother selection (can be improved for strict diagonals)
        const isValidNextCell =
          !lastCell ||
          (Math.abs(newCell.row - lastCell.row) <= 1 &&
            Math.abs(newCell.col - lastCell.col) <= 1);

        if (isValidNextCell) {
          setSelectedCells((prev) => [...prev, newCell]);
          setCurrentWord((prev) => prev + puzzle.grid[row][col]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }
  };

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.state === GestureState.BEGAN) {
      setSelectedCells([]); // Clear previous selection on new gesture start
      setCurrentWord('');
    }
    if (
      event.nativeEvent.state === GestureState.END ||
      event.nativeEvent.state === GestureState.CANCELLED
    ) {
      if (currentWord.length > 1) {
        // Require at least 2 letters
        const normalizedWord = currentWord.toLowerCase();
        if (
          puzzle?.words.includes(normalizedWord) &&
          !foundWords.includes(normalizedWord)
        ) {
          setFoundWords((prev) => [...prev, normalizedWord]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Check for game win
          if (foundWords.length + 1 === puzzle?.words.length) {
            setModalContent({
              title: 'Congratulations!',
              message: "You've found all the words!",
              type: 'success',
            });
            setIsModalVisible(true);
          }
        } else if (!puzzle?.words.includes(normalizedWord)) {
          // Optionally provide feedback for invalid word selection
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
      setSelectedCells([]);
      setCurrentWord('');
    }
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some((cell) => cell.row === row && cell.col === col);
  };

  const showHint = () => {
    if (!puzzle) return;
    const unFoundWords = puzzle.words.filter(
      (word) => !foundWords.includes(word.toLowerCase())
    );
    if (unFoundWords.length > 0) {
      const randomWord =
        unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
      setModalContent({
        title: 'Hint!',
        message: `Try to find a word that is ${
          randomWord.length
        } letters long and starts with "${randomWord[0].toUpperCase()}".`,
        type: 'info',
      });
      setIsModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setModalContent({
        title: 'All Words Found!',
        message: "No more hints needed, you're a word master!",
        type: 'info',
      });
      setIsModalVisible(true);
    }
  };

  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.startContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* <GameHeader title="Word Puzzle" onBack={() => router.back()} /> */}
        <View style={styles.startScreenHeader}>
          <Info size={60} color={COLORS.primary} />
          <Text style={styles.gameTitleText}>Word Search Challenge</Text>
        </View>
        <ScrollView contentContainerStyle={styles.startContentScrollView}>
          <View style={styles.startContent}>
            <Text style={styles.gameDescription}>
              Find all the hidden words in the grid. Words can be horizontal,
              vertical, or diagonal.
            </Text>
            <View style={styles.difficultyContainer}>
              <Text style={styles.difficultyTitle}>Select Difficulty:</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.selectedDifficultyButton,
                    ]}
                    onPress={() => {
                      setDifficulty(level);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        difficulty === level &&
                          styles.selectedDifficultyButtonText,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                setGameStarted(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading || !puzzle) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Generating your puzzle...</Text>
      </SafeAreaView>
    );
  }

  const numColumns = puzzle.grid[0]?.length || 10; // Default to 10 if not loaded
  const dynamicCellSize = GRID_MAX_WIDTH / numColumns;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={styles.container}
        edges={['bottom', 'left', 'right']}
      >
        <Stack.Screen options={{ headerShown: false }} />
        {/* <GameHeader title="Word Puzzle" onBack={() => router.back()} onNewGame={() => startNewGame(difficulty)} /> */}

        <View style={styles.gameHeaderControls}>
          <TouchableOpacity
            onPress={() => startNewGame(difficulty)}
            style={styles.headerButton}
          >
            <RefreshCw size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.gameScreenTitle}>Find The Words</Text>
          <TouchableOpacity
            onPress={() => setIsInstructionsVisible(true)}
            style={styles.headerButton}
          >
            <Info size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsAndDifficultyContainer}>
            <Text style={styles.difficultyIndicatorText}>
              Level: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Text>
            <Text style={styles.statsText}>
              Found: <Text style={styles.statsValue}>{foundWords.length}</Text>{' '}
              / {puzzle.words.length}
            </Text>
          </View>

          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanStateChange}
          >
            <Animated.View
              style={[styles.gridContainer, animatedGridStyle]}
              onLayout={(event) => {
                event.target.measure((x, y, width, height, pageX, pageY) => {
                  gridLayout.current = {
                    x: pageX,
                    y: pageY,
                    width,
                    height,
                    cellSize: width / numColumns,
                  };
                });
              }}
            >
              {puzzle.grid.map((rowItems, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                  {rowItems.map((letter, colIndex) => {
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    return (
                      <Animated.View
                        key={`cell-${rowIndex}-${colIndex}`}
                        style={[
                          styles.cell,
                          { width: dynamicCellSize, height: dynamicCellSize },
                          isSelected && styles.selectedCell,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            isSelected && styles.selectedCellText,
                          ]}
                        >
                          {letter.toUpperCase()}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </Animated.View>
          </PanGestureHandler>

          <View style={styles.currentSelectionContainer}>
            <Text style={styles.currentSelectionText}>
              Selected: {currentWord.toUpperCase() || '---'}
            </Text>
          </View>

          <View style={styles.wordListContainer}>
            <Text style={styles.wordListTitle}>Words to Find:</Text>
            <View style={styles.wordList}>
              {puzzle.words.map((word) => {
                const isFound = foundWords.includes(word.toLowerCase());
                return (
                  <View
                    key={word}
                    style={[
                      styles.wordItemChip,
                      isFound && styles.foundWordChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.wordItemText,
                        isFound && styles.foundWordItemText,
                      ]}
                    >
                      {isFound
                        ? word.toUpperCase()
                        : word.toUpperCase().replace(/./g, '•')}
                    </Text>
                    {isFound && (
                      <CheckCircle
                        size={16}
                        color={COLORS.success}
                        style={{ marginLeft: 5 }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.hintButton} onPress={showHint}>
            <HelpCircle size={20} color={COLORS.white} />
            <Text style={styles.hintButtonText}>Get a Hint</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => setIsModalVisible(false)}
          animationIn="zoomIn"
          animationOut="zoomOut"
        >
          <View style={styles.modalView}>
            {modalContent?.type === 'success' && (
              <CheckCircle size={48} color={COLORS.success} />
            )}
            {modalContent?.type === 'error' && (
              <AlertCircle size={48} color={COLORS.error} />
            )}
            {modalContent?.type === 'info' && (
              <Info size={48} color={COLORS.primary} />
            )}
            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
            <Text style={styles.modalMessage}>{modalContent?.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsModalVisible(false);
                if (modalContent?.type === 'success') startNewGame(difficulty);
              }}
            >
              <Text style={styles.modalButtonText}>
                {modalContent?.type === 'success' ? 'Play Again' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          isVisible={isInstructionsVisible}
          onBackdropPress={() => setIsInstructionsVisible(false)}
          style={styles.instructionsModalContainer}
          animationIn="slideInUp"
          animationOut="slideOutDown"
        >
          <View style={styles.instructionsModalContent}>
            <View style={styles.instructionsModalHeader}>
              <Text style={styles.instructionsModalTitle}>How to Play</Text>
              <TouchableOpacity onPress={() => setIsInstructionsVisible(false)}>
                <X size={28} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.instructionsModalText}>
                - Find all the hidden words in the grid.
                {'\n'}- Words can be spelled forwards, backwards, horizontally,
                vertically, or diagonally.
                {'\n'}- To select a word, tap and drag your finger across the
                letters.
                {'\n'}- Release your finger to submit the selected word.
                {'\n'}- Found words will be marked in the list below the grid.
                {'\n'}- Use the "Hint" button if you get stuck!
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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  gameHeaderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 10,
    backgroundColor: COLORS.surfaceLight, // Or COLORS.background
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  headerButton: {
    padding: 8,
  },
  gameScreenTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    color: COLORS.secondary,
  },
  statsAndDifficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  difficultyIndicatorText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.gray,
  },
  statsText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.secondary,
  },
  statsValue: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    color: COLORS.primary,
  },
  gridContainer: {
    width: GRID_MAX_WIDTH,
    maxWidth: GRID_MAX_WIDTH,
    aspectRatio: 1, // Make it square
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 5, // Small padding inside the grid border
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.lightGray, // Softer cell borders
    backgroundColor: COLORS.white, // Default cell background
  },
  cellText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16, // Adjust based on cell size
    color: COLORS.textDark,
    textTransform: 'uppercase',
  },
  selectedCell: {
    backgroundColor: COLORS.primary, // Theme primary for selection
    borderColor: COLORS.primary, // Darker border for selected
  },
  selectedCellText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  currentSelectionContainer: {
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentSelectionText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  wordListContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 20,
    padding: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  wordListTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  wordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  wordItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  foundWordChip: {
    backgroundColor: COLORS.successMuted || '#D1FAE5', // A light green
  },
  wordItemText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  foundWordItemText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    color: COLORS.success, // Darker green for text
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    width: '80%',
    alignSelf: 'center',
  },
  hintButtonText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    marginLeft: 8,
  },
  modalView: {
    backgroundColor: COLORS.surfaceLight,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 20, // Ensure modal is not too wide
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 22,
    color: COLORS.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
  },
  instructionsModalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  instructionsModalContent: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Account for home indicator
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  instructionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionsModalTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    color: COLORS.secondary,
  },
  instructionsModalText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 24,
    marginBottom: 20,
  },
  // Start Screen Styles (Copied and adapted from Sudoku for consistency)
  startContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  startScreenHeader: {
    alignItems: 'center',
    paddingTop: '15%',
    marginBottom: 20,
  },
  gameTitleText: {
    // Renamed from gameTitle to avoid conflict
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 32,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  startContentScrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  startContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  gameDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  difficultyContainer: {
    marginBottom: 30,
  },
  difficultyTitle: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Better spacing
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20, // Pill shape
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray,
  },
  selectedDifficultyButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 15,
    color: COLORS.textDark,
  },
  selectedDifficultyButtonText: {
    color: COLORS.white,
  },
  startButton: {
    backgroundColor: COLORS.accent, // Use accent color
    borderRadius: 25, // Pill shape
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
  },
  startButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 18,
    color: COLORS.white,
  },
});

export default WordPuzzleGameScreen;
