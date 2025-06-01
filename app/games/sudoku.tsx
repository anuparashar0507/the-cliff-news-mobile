import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Settings,
  Eye,
  EyeOff,
  Undo2,
} from 'lucide-react-native';

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
  const [showHints, setShowHints] = useState(true);
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
      setSelectedCell(null);
      setHighlightedNumber(grid[row][col] !== 0 ? grid[row][col] : null);
    } else {
      setSelectedCell([row, col]);
      setHighlightedNumber(grid[row][col] !== 0 ? grid[row][col] : null);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle pressing a number on the number pad
  const handleNumberPress = (num: number) => {
    if (!selectedCell || isLoading) return;

    const [row, col] = selectedCell;
    if (initialGridMask[row]?.[col]) return;

    const oldValue = grid[row][col];
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = num;

    // Add to move history for undo
    if (oldValue !== num) {
      setMoveHistory((prev) => [
        ...prev,
        { row, col, oldValue, newValue: num },
      ]);
    }

    setGrid(newGrid);

    // Validate all cells for errors after a number is placed
    const newErrorCells: [number, number][] = [];
    let isCurrentMoveError = false;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (
          newGrid[r][c] !== 0 &&
          !isValidPlacement(newGrid, r, c, newGrid[r][c])
        ) {
          if (!initialGridMask[r]?.[c]) {
            newErrorCells.push([r, c]);
            if (r === row && c === col) {
              isCurrentMoveError = true;
            }
          }
        }
      }
    }

    if (showErrors) {
      setErrorCells(newErrorCells);
    }

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

      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = 0;
      setGrid(newGrid);

      const newErrorCells: [number, number][] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (
            newGrid[r][c] !== 0 &&
            !isValidPlacement(newGrid, r, c, newGrid[r][c])
          ) {
            if (!initialGridMask[r]?.[c]) newErrorCells.push([r, c]);
          }
        }
      }
      if (showErrors) {
        setErrorCells(newErrorCells);
      }
      setHighlightedNumber(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Undo last move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory[moveHistory.length - 1];
    const newGrid = grid.map((r) => [...r]);
    newGrid[lastMove.row][lastMove.col] = lastMove.oldValue;
    setGrid(newGrid);
    setMoveHistory((prev) => prev.slice(0, -1));

    // Recalculate errors
    const newErrorCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (
          newGrid[r][c] !== 0 &&
          !isValidPlacement(newGrid, r, c, newGrid[r][c])
        ) {
          if (!initialGridMask[r]?.[c]) newErrorCells.push([r, c]);
        }
      }
    }
    if (showErrors) {
      setErrorCells(newErrorCells);
    }

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

  // Memoized function to get cell styles
  const getCellStyles = useCallback(
    (rowIndex: number, colIndex: number) => {
      const style: any[] = [styles.cell];
      const isSelected =
        selectedCell &&
        selectedCell[0] === rowIndex &&
        selectedCell[1] === colIndex;
      const isFixed = initialGridMask[rowIndex]?.[colIndex];
      const cellValue = grid[rowIndex]?.[colIndex];
      const isError = errorCells.some(
        (cell) => cell[0] === rowIndex && cell[1] === colIndex
      );

      // Thick borders for 3x3 subgrids
      if ((rowIndex + 1) % 3 === 0 && rowIndex < 8)
        style.push(styles.bottomThickBorder);
      if ((colIndex + 1) % 3 === 0 && colIndex < 8)
        style.push(styles.rightThickBorder);

      if (isSelected && !isFixed) {
        style.push(styles.selectedCell);
      } else if (selectedCell) {
        const [sRow, sCol] = selectedCell;
        const inSameBox =
          Math.floor(sRow / 3) === Math.floor(rowIndex / 3) &&
          Math.floor(sCol / 3) === Math.floor(colIndex / 3);
        if (
          !isSelected &&
          (sRow === rowIndex || sCol === colIndex || inSameBox)
        ) {
          style.push(styles.relatedCell);
        }
      }

      if (isFixed) style.push(styles.fixedCell);
      if (isError && !isFixed && showErrors) style.push(styles.errorCell);

      if (
        highlightedNumber &&
        cellValue === highlightedNumber &&
        cellValue !== 0
      ) {
        style.push(styles.highlightedNumberCell);
      }

      return style;
    },
    [
      selectedCell,
      initialGridMask,
      grid,
      errorCells,
      highlightedNumber,
      showErrors,
    ]
  );

  // Memoized function to get cell text styles
  const getCellTextStyles = useCallback(
    (rowIndex: number, colIndex: number) => {
      const style: any[] = [styles.cellText];
      const isFixed = initialGridMask[rowIndex]?.[colIndex];
      const isError = errorCells.some(
        (cell) => cell[0] === rowIndex && cell[1] === colIndex
      );

      if (isFixed) style.push(styles.fixedCellText);
      else style.push(styles.userCellText);

      if (isError && !isFixed && showErrors) style.push(styles.errorCellText);

      return style;
    },
    [initialGridMask, errorCells, showErrors]
  );

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
            <Trophy size={60} color={COLORS.primary} />
            <Text style={styles.gameTitle}>Sudoku Challenge</Text>
          </View>

          <ScrollView contentContainerStyle={styles.startContentScrollView}>
            <View style={styles.startContent}>
              <Text style={styles.gameDescription}>
                Fill the 9×9 grid so that each column, row, and 3×3 subgrid
                contains all digits from 1 to 9.
              </Text>

              <View style={styles.difficultyContainer}>
                <Text style={styles.difficultyTitle}>Choose Difficulty:</Text>
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
                          styles.difficultyText,
                          difficulty === level && styles.selectedDifficultyText,
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
      </View>
    );
  }

  // Main game screen UI
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Custom Header with proper safe area */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
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
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{formatTime(gameTime)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Mistakes</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: mistakes > 0 ? COLORS.error : COLORS.success },
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
                { opacity: moveHistory.length > 0 ? 1 : 0.5 },
              ]}
              disabled={moveHistory.length === 0}
            >
              <Undo2 size={20} color={COLORS.primary} />
              <Text style={styles.controlButtonText}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={getHint}
              style={[
                styles.controlButton,
                { opacity: selectedCell && showHints ? 1 : 0.5 },
              ]}
              disabled={!selectedCell || !showHints}
            >
              <Lightbulb size={20} color={COLORS.warning} />
              <Text style={styles.controlButtonText}>Hint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowErrors(!showErrors)}
              style={styles.controlButton}
            >
              {showErrors ? (
                <Eye size={20} color={COLORS.accent} />
              ) : (
                <EyeOff size={20} color={COLORS.gray} />
              )}
              <Text style={styles.controlButtonText}>Errors</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Generating Puzzle...</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
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
                    highlightedNumber === num && styles.selectedNumberButton,
                  ]}
                  onPress={() => handleNumberPress(num)}
                >
                  <Text
                    style={[
                      styles.numberButtonText,
                      highlightedNumber === num &&
                        styles.selectedNumberButtonText,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.numberButton, styles.clearButton]}
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
        <View style={styles.modalContent}>
          <Trophy
            size={80}
            color={COLORS.accent}
            style={{ alignSelf: 'center' }}
          />
          <Text style={styles.modalTitle}>Congratulations!</Text>
          <Text style={styles.modalMessage}>
            You solved the {difficulty} Sudoku in {formatTime(gameTime)} with{' '}
            {mistakes} mistakes!
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setIsCongratsModalVisible(false);
              startNewGame(difficulty);
            }}
          >
            <Text style={styles.modalButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalSecondaryButton]}
            onPress={() => {
              setIsCongratsModalVisible(false);
              setGameStarted(false);
            }}
          >
            <Text
              style={[styles.modalButtonText, styles.modalSecondaryButtonText]}
            >
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
const cellSize = gridContainerWidth / 9;

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
    // paddingTop will be added dynamically using insets.top
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
    backgroundColor: COLORS.background,
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
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.gray,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gameControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 1,
  },
  controlButtonText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  loaderContainer: {
    width: gridContainerWidth,
    height: gridContainerWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: COLORS.cellBackground,
    borderRadius: 8,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.body.fontFamily,
  },
  gridContainer: {
    width: gridContainerWidth,
    height: gridContainerWidth,
    borderWidth: 2,
    borderColor: COLORS.gridBoxLine,
    backgroundColor: COLORS.cellBackground,
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
    borderColor: COLORS.gridLine,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cellBackground,
  },
  cellText: {
    fontSize: Math.max(18, cellSize * 0.55),
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
  },
  bottomThickBorder: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gridBoxLine,
  },
  rightThickBorder: {
    borderRightWidth: 2,
    borderRightColor: COLORS.gridBoxLine,
  },
  selectedCell: {
    backgroundColor: COLORS.selectedCellBackground,
  },
  relatedCell: {
    backgroundColor: COLORS.relatedCellBackground,
  },
  fixedCell: {
    backgroundColor: COLORS.fixedCellBackground,
  },
  fixedCellText: {
    color: COLORS.textFixed,
    fontFamily: TYPOGRAPHY.heading.fontFamily,
  },
  userCellText: {
    color: COLORS.textUser,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
  },
  errorCell: {
    backgroundColor: COLORS.errorCellBackground,
  },
  errorCellText: {
    color: COLORS.textError,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
  },
  highlightedNumberCell: {
    backgroundColor: COLORS.primary,
    opacity: 0.3,
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  selectedNumberButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: 24,
    color: COLORS.secondary,
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontWeight: 'bold',
  },
  selectedNumberButtonText: {
    color: COLORS.white,
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
    color: COLORS.primary,
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
    color: COLORS.textSecondary,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  selectedDifficultyButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  selectedDifficultyText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: COLORS.accent,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalSecondaryButtonText: {
    color: COLORS.primary,
  },
});

export default SudokuGame;
