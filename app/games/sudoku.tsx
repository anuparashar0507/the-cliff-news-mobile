import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  generateSudoku,
  checkSolution as isPuzzleComplete,
} from '@/utils/sudokuUtils';
import * as Haptics from 'expo-haptics';
import Modal from 'react-native-modal';
import {
  ArrowLeft,
  Home,
  RefreshCw,
  Lightbulb,
  Trophy,
  Eye,
  EyeOff,
  Undo2,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

// Helper function to check if a number placement is valid (Sudoku rules)
const isValidPlacement = (
  grid: number[][],
  row: number,
  col: number,
  num: number
): boolean => {
  if (num === 0) return true;

  // Check row
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num && x !== col) return false;
  }
  // Check column
  for (let y = 0; y < 9; y++) {
    if (grid[y][col] === num && y !== row) return false;
  }
  // Check 3x3 subgrid
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (
        grid[startRow + i][startCol + j] === num &&
        (startRow + i !== row || startCol + j !== col)
      ) {
        return false;
      }
    }
  }
  return true;
};

// Move history for undo functionality
interface Move {
  row: number;
  col: number;
  oldValue: number;
  newValue: number;
}

const SudokuGame = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();

  // Grid state: current puzzle view
  const [grid, setGrid] = useState<number[][]>([]);
  // Mask for fixed numbers from the initial puzzle
  const [initialGridMask, setInitialGridMask] = useState<boolean[][]>([]);
  // Stores the complete solution to check against
  const [solutionGrid, setSolutionGrid] = useState<number[][]>([]);

  // UI interaction states
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(
    null
  );
  const [errorCells, setErrorCells] = useState<[number, number][]>([]);

  // Game settings and status
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'easy'
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCongratsModalVisible, setIsCongratsModalVisible] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [showErrors, setShowErrors] = useState(true);

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

  // Function to start a new game
  const startNewGame = useCallback(
    async (level: 'easy' | 'medium' | 'hard') => {
      setIsLoading(true);
      setSelectedCell(null);
      setHighlightedNumber(null);
      setErrorCells([]);
      setGameTime(0);
      setIsTimerRunning(false);
      setMistakes(0);
      setMoveHistory([]);

      await new Promise((resolve) =>
        setTimeout(resolve, Platform.OS === 'ios' ? 100 : 300)
      );

      const { puzzle, solution, fixed } = generateSudoku(level);
      setGrid(puzzle);
      setSolutionGrid(solution);
      setInitialGridMask(fixed);
      setIsLoading(false);
      setIsTimerRunning(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    []
  );

  // Effect to start a new game when difficulty changes or game initially starts
  useEffect(() => {
    if (gameStarted) {
      startNewGame(difficulty);
    }
  }, [gameStarted, difficulty, startNewGame]);

  // Handle pressing a cell on the grid
  const handleCellPress = (row: number, col: number) => {
    if (isLoading) return;

    if (initialGridMask[row]?.[col]) {
      // If it's a fixed cell, just highlight the number
      setSelectedCell(null);
      setHighlightedNumber(grid[row][col] !== 0 ? grid[row][col] : null);
    } else {
      // Select the cell for input
      setSelectedCell([row, col]);
      setHighlightedNumber(grid[row][col] !== 0 ? grid[row][col] : null);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Validate placement and update error state
  const validateAndUpdateErrors = useCallback(
    (newGrid: number[][]) => {
      const newErrorCells: [number, number][] = [];

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (
            newGrid[r][c] !== 0 &&
            !isValidPlacement(newGrid, r, c, newGrid[r][c]) &&
            !initialGridMask[r]?.[c]
          ) {
            newErrorCells.push([r, c]);
          }
        }
      }

      if (showErrors) {
        setErrorCells(newErrorCells);
      }

      return newErrorCells;
    },
    [initialGridMask, showErrors]
  );

  // Handle pressing a number on the number pad
  const handleNumberPress = (num: number) => {
    if (!selectedCell || isLoading) return;

    const [row, col] = selectedCell;
    if (initialGridMask[row]?.[col]) return; // Can't modify fixed cells

    const oldValue = grid[row][col];

    // Create new grid with the number placed
    const newGrid = grid.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? num : cell
      )
    );

    // Add to move history for undo (only if value actually changed)
    if (oldValue !== num) {
      setMoveHistory((prev) => [
        ...prev,
        { row, col, oldValue, newValue: num },
      ]);
    }

    // Update grid immediately
    setGrid(newGrid);

    // Validate and check for errors
    const newErrorCells = validateAndUpdateErrors(newGrid);

    // Check if this specific move is an error
    const isCurrentMoveError = newErrorCells.some(
      ([errorRow, errorCol]) => errorRow === row && errorCol === col
    );

    // Count mistakes
    if (isCurrentMoveError && num !== 0) {
      setMistakes((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Game over after 3 mistakes
      if (mistakes >= 2) {
        setIsTimerRunning(false);
        Alert.alert('Game Over', 'You made too many mistakes! Try again.', [
          { text: 'New Game', onPress: () => startNewGame(difficulty) },
          { text: 'Continue', style: 'cancel' },
        ]);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Update highlighted number
    setHighlightedNumber(num !== 0 ? num : null);

    // Check if puzzle is complete and correct
    if (num !== 0 && !newGrid.flat().includes(0)) {
      if (isPuzzleComplete(newGrid) && newErrorCells.length === 0) {
        setIsTimerRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsCongratsModalVisible(true);
        setErrorCells([]);
      }
    }
  };

  // Handle clearing a cell
  const handleClearCell = () => {
    if (!selectedCell || isLoading) return;
    const [row, col] = selectedCell;
    if (initialGridMask[row]?.[col]) return;

    const oldValue = grid[row][col];
    if (oldValue !== 0) {
      // Add to move history
      setMoveHistory((prev) => [...prev, { row, col, oldValue, newValue: 0 }]);

      // Create new grid with cell cleared
      const newGrid = grid.map((r, rowIndex) =>
        r.map((cell, colIndex) =>
          rowIndex === row && colIndex === col ? 0 : cell
        )
      );

      setGrid(newGrid);
      validateAndUpdateErrors(newGrid);
      setHighlightedNumber(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Undo last move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory[moveHistory.length - 1];

    // Create new grid with last move undone
    const newGrid = grid.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === lastMove.row && colIndex === lastMove.col
          ? lastMove.oldValue
          : cell
      )
    );

    setGrid(newGrid);
    setMoveHistory((prev) => prev.slice(0, -1));
    validateAndUpdateErrors(newGrid);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Get hint for current selected cell
  const getHint = () => {
    if (!selectedCell || !solutionGrid.length) return;

    const [row, col] = selectedCell;
    if (initialGridMask[row]?.[col]) return;

    const correctValue = solutionGrid[row][col];
    if (grid[row][col] !== correctValue) {
      handleNumberPress(correctValue);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  // Get cell styles based on state
  // Get cell styles based on state
  const getCellStyles = (rowIndex: number, colIndex: number) => {
    const baseStyle: any[] = [
      styles.cell,
      {
        backgroundColor: colors.surface,
        borderColor: colors.textSecondary,
      },
    ];

    const isSelected =
      selectedCell &&
      selectedCell[0] === rowIndex &&
      selectedCell[1] === colIndex;
    const isFixed = initialGridMask[rowIndex]?.[colIndex];
    const cellValue = grid[rowIndex]?.[colIndex];
    const isError = errorCells.some(
      ([errorRow, errorCol]) => errorRow === rowIndex && errorCol === colIndex
    );

    // Thick borders for 3x3 subgrids
    if ((rowIndex + 1) % 3 === 0 && rowIndex < 8) {
      baseStyle.push({
        borderBottomWidth: 2,
        borderBottomColor: colors.textPrimary,
      });
    }
    if ((colIndex + 1) % 3 === 0 && colIndex < 8) {
      baseStyle.push({
        borderRightWidth: 2,
        borderRightColor: colors.textPrimary,
      });
    }

    // Selection highlighting
    if (isSelected && !isFixed) {
      baseStyle.push({ backgroundColor: colors.primary, opacity: 0.3 });
    } else if (selectedCell) {
      const [sRow, sCol] = selectedCell;
      const inSameBox =
        Math.floor(sRow / 3) === Math.floor(rowIndex / 3) &&
        Math.floor(sCol / 3) === Math.floor(colIndex / 3);
      if (
        !isSelected &&
        (sRow === rowIndex || sCol === colIndex || inSameBox)
      ) {
        baseStyle.push({ backgroundColor: colors.background });
      }
    }

    // Fixed cell styling
    if (isFixed) {
      baseStyle.push({ backgroundColor: colors.background });
    }

    // Error styling
    if (isError && !isFixed && showErrors) {
      baseStyle.push({ backgroundColor: colors.error, opacity: 0.3 });
    }

    // Number highlighting
    if (
      highlightedNumber &&
      cellValue === highlightedNumber &&
      cellValue !== 0
    ) {
      baseStyle.push({ backgroundColor: colors.accent, opacity: 0.2 });
    }

    return baseStyle;
  };

  // Get cell text styles
  const getCellTextStyles = (rowIndex: number, colIndex: number) => {
    const baseStyle: any[] = [styles.cellText];
    const isFixed = initialGridMask[rowIndex]?.[colIndex];
    const isError = errorCells.some(
      ([errorRow, errorCol]) => errorRow === rowIndex && errorCol === colIndex
    );

    if (isFixed) {
      baseStyle.push({ color: colors.textPrimary });
    } else {
      baseStyle.push({ color: colors.primary });
    }

    if (isError && !isFixed && showErrors) {
      baseStyle.push({ color: colors.error });
    }

    return baseStyle;
  };

  // Handle back navigation
  const handleBack = () => {
    if (isTimerRunning) {
      Alert.alert('Exit Game?', 'Your progress will be lost. Are you sure?', [
        { text: 'Continue Playing', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]);
    } else {
      router.back();
    }
  };

  // Start screen UI
  if (!gameStarted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.primary}
        />

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
          <Text style={styles.headerTitle}>Sudoku</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.headerButton}
          >
            <Home size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
          <View style={styles.startScreenHeader}>
            <Trophy size={60} color={colors.primary} />
            <Text style={[styles.gameTitle, { color: colors.primary }]}>
              Sudoku Challenge
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.startContentScrollView}>
            <View style={styles.startContent}>
              <Text
                style={[
                  styles.gameDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Fill the 9×9 grid so that each column, row, and 3×3 subgrid
                contains all digits from 1 to 9.
              </Text>

              <View style={styles.difficultyContainer}>
                <Text
                  style={[
                    styles.difficultyTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Choose Difficulty:
                </Text>
                <View style={styles.difficultyButtons}>
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor:
                            difficulty === level
                              ? colors.primary
                              : colors.textSecondary,
                        },
                        difficulty === level && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => {
                        setDifficulty(level);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          {
                            color:
                              difficulty === level
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

              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.accent }]}
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
      </View>
    );
  }

  // Main game screen UI
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: colors.primary },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sudoku</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => startNewGame(difficulty)}
            style={styles.headerButton}
          >
            <RefreshCw size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.headerButton}
          >
            <Home size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Game Stats */}
          <View style={styles.gameStatsContainer}>
            <View
              style={[styles.statItem, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Time
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatTime(gameTime)}
              </Text>
            </View>
            <View
              style={[styles.statItem, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Level
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </View>
            <View
              style={[styles.statItem, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Mistakes
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: mistakes > 0 ? colors.error : colors.success },
                ]}
              >
                {mistakes}/3
              </Text>
            </View>
          </View>

          {/* Game Controls */}
          <View style={styles.gameControls}>
            <TouchableOpacity
              onPress={handleUndo}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.surface,
                  opacity: moveHistory.length > 0 ? 1 : 0.5,
                },
              ]}
              disabled={moveHistory.length === 0}
            >
              <Undo2 size={20} color={colors.primary} />
              <Text
                style={[styles.controlButtonText, { color: colors.primary }]}
              >
                Undo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={getHint}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.surface,
                  opacity: selectedCell ? 1 : 0.5,
                },
              ]}
              disabled={!selectedCell}
            >
              <Lightbulb size={20} color={colors.warning} />
              <Text
                style={[styles.controlButtonText, { color: colors.warning }]}
              >
                Hint
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowErrors(!showErrors)}
              style={[
                styles.controlButton,
                { backgroundColor: colors.surface },
              ]}
            >
              {showErrors ? (
                <Eye size={20} color={colors.accent} />
              ) : (
                <EyeOff size={20} color={colors.textSecondary} />
              )}
              <Text
                style={[
                  styles.controlButtonText,
                  { color: showErrors ? colors.accent : colors.textSecondary },
                ]}
              >
                Errors
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loaderText, { color: colors.textSecondary }]}
              >
                Generating Puzzle...
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.gridContainer,
                { backgroundColor: colors.textSecondary },
              ]}
            >
              {grid.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                  {row.map((cellValue, colIndex) => (
                    <TouchableOpacity
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={getCellStyles(rowIndex, colIndex)}
                      onPress={() => handleCellPress(rowIndex, colIndex)}
                      disabled={initialGridMask[rowIndex]?.[colIndex]}
                    >
                      <Text style={getCellTextStyles(rowIndex, colIndex)}>
                        {cellValue !== 0 ? cellValue.toString() : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {!isLoading && (
            <View style={styles.numberPadContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={`num-${num}`}
                  style={[
                    styles.numberButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.textSecondary,
                    },
                    highlightedNumber === num && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleNumberPress(num)}
                >
                  <Text
                    style={[
                      styles.numberButtonText,
                      { color: colors.textPrimary },
                      highlightedNumber === num && { color: COLORS.white },
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.numberButton,
                  styles.clearButton,
                  { backgroundColor: colors.error, borderColor: colors.error },
                ]}
                onPress={handleClearCell}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Congratulations Modal */}
      <Modal
        isVisible={isCongratsModalVisible}
        onBackdropPress={() => setIsCongratsModalVisible(false)}
        animationIn="zoomInUp"
        animationOut="zoomOutDown"
        backdropOpacity={0.6}
        useNativeDriverForBackdrop
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <Trophy
            size={80}
            color={colors.accent}
            style={{ alignSelf: 'center' }}
          />
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Congratulations!
          </Text>
          <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
            You solved the {difficulty} Sudoku in {formatTime(gameTime)} with{' '}
            {mistakes} mistakes!
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setIsCongratsModalVisible(false);
              startNewGame(difficulty);
            }}
          >
            <Text style={styles.modalButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalSecondaryButton,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
            onPress={() => {
              setIsCongratsModalVisible(false);
              setGameStarted(false);
            }}
          >
            <Text style={[styles.modalButtonText, { color: colors.primary }]}>
              Change Difficulty
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// Dynamic sizing based on screen width
const screenWidth = Dimensions.get('window').width;
const gridPaddingHorizontal = 16;
const gridContainerWidth = screenWidth - gridPaddingHorizontal * 2;

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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: gridPaddingHorizontal,
    paddingBottom: 20,
    alignItems: 'center',
  },
  gameStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    marginTop: 8,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    elevation: 2,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gameControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 1,
    flex: 1,
    justifyContent: 'center',
  },
  controlButtonText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    marginLeft: 4,
  },
  loaderContainer: {
    width: gridContainerWidth,
    height: gridContainerWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 8,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
  },
  gridContainer: {
    width: gridContainerWidth,
    height: gridContainerWidth,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    flex: 1,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: Math.max(18, (gridContainerWidth / 9) * 0.55),
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
  },
  numberPadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 12,
    width: gridContainerWidth,
  },
  numberButton: {
    width: (gridContainerWidth - 40 - 4 * 12) / 5,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
  },
  numberButtonText: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
  },
  // Start Screen Styles
  startScreenHeader: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 20,
  },
  gameTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 32,
    textAlign: 'center',
    marginTop: 16,
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
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  difficultyContainer: {
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
    justifyContent: 'space-around',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 2,
  },
  difficultyText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContent: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 200,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
  },
  modalSecondaryButton: {
    borderWidth: 2,
  },
});

export default SudokuGame;
