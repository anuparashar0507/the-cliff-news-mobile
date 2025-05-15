import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform, // Added for platform-specific styling if needed
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/Theme'; // Assuming your COLORS are here
import {
  generateSudoku,
  checkSolution as isPuzzleComplete,
} from '@/utils/sudokuUtils'; // Renamed for clarity
// import GameHeader from '@/components/GameHeader'; // Assuming this component exists and is styled
import * as Haptics from 'expo-haptics';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons'; // For icons

// Helper function to check if a number placement is valid (Sudoku rules)
// This function is crucial for real-time error checking.
const isValidPlacement = (
  grid: number[][],
  row: number,
  col: number,
  num: number
): boolean => {
  if (num === 0) return true; // Clearing a cell is always valid in terms of placement check

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

const SudokuGame = () => {
  const router = useRouter();
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
  // const [mistakes, setMistakes] = useState(0); // Optional: mistake counter

  // Function to start a new game
  const startNewGame = useCallback(
    async (level: 'easy' | 'medium' | 'hard') => {
      setIsLoading(true);
      setSelectedCell(null);
      setHighlightedNumber(null);
      setErrorCells([]);
      // setMistakes(0);

      // Simulate generation delay for a smoother UX, especially for harder puzzles
      await new Promise((resolve) =>
        setTimeout(resolve, Platform.OS === 'ios' ? 100 : 300)
      );

      const { puzzle, solution, fixed } = generateSudoku(level);
      setGrid(puzzle);
      setSolutionGrid(solution);
      setInitialGridMask(fixed);
      setIsLoading(false);
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
    if (isLoading) return; // Don't allow interaction while loading

    if (initialGridMask[row]?.[col]) {
      // Check if the cell is part of the initial puzzle
      setSelectedCell(null);
      setHighlightedNumber(grid[row][col] !== 0 ? grid[row][col] : null); // Highlight fixed numbers too
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
    if (initialGridMask[row]?.[col]) return; // Cannot change fixed cells

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);

    // Validate all cells for errors after a number is placed
    const newErrorCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (
          newGrid[r][c] !== 0 &&
          !isValidPlacement(newGrid, r, c, newGrid[r][c])
        ) {
          if (!initialGridMask[r]?.[c]) {
            // Only mark user-inputted errors
            newErrorCells.push([r, c]);
          }
        }
      }
    }
    setErrorCells(newErrorCells);

    if (
      newErrorCells.length > 0 &&
      num !== 0 &&
      !isValidPlacement(newGrid, row, col, num)
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setHighlightedNumber(num !== 0 ? num : null);

    // Check if puzzle is complete and correct
    if (num !== 0 && !newGrid.flat().includes(0)) {
      if (isPuzzleComplete(newGrid) && newErrorCells.length === 0) {
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
    if (initialGridMask[row]?.[col]) return; // Cannot clear fixed cells

    const newGrid = grid.map((r) => [...r]);
    if (newGrid[row][col] !== 0) {
      newGrid[row][col] = 0;
      setGrid(newGrid);

      // Re-validate errors after clearing
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
      setErrorCells(newErrorCells);
      setHighlightedNumber(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Change difficulty (used by start screen, or could be added to GameHeader)
  const changeDifficultyAndRestart = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level);
    if (gameStarted) {
      // If game is already running, restart with new difficulty
      startNewGame(level);
    }
  };

  // Memoized function to get cell styles, improving performance by avoiding re-calculations
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
        // Only highlight selectable cells as "selected"
        style.push(styles.selectedCell);
      } else if (selectedCell) {
        // Highlight related cells (row, col, box)
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
      // Apply error style only to non-fixed, user-inputted cells that are incorrect
      if (isError && !isFixed) style.push(styles.errorCell);

      // Highlight cells with the same number as the currently selected/placed number
      if (
        highlightedNumber &&
        cellValue === highlightedNumber &&
        cellValue !== 0
      ) {
        style.push(styles.highlightedNumberCell);
      }

      return style;
    },
    [selectedCell, initialGridMask, grid, errorCells, highlightedNumber]
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
      else style.push(styles.userCellText); // User-inputted numbers

      // Apply error text style only to non-fixed, user-inputted cells
      if (isError && !isFixed) style.push(styles.errorCellText);

      return style;
    },
    [initialGridMask, errorCells]
  );

  // Start screen UI
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.startContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.startScreenHeader}>
          <Ionicons name="grid" size={60} color={COLORS.primary} />
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
    );
  }

  // Main game screen UI
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* <GameHeader
        title="Sudoku"
        onBack={() => {
          router.back();
          setGameStarted(false); // Reset game state when going back
          // Potentially ask "Are you sure you want to quit?"
        }}
        onNewGame={() => startNewGame(difficulty)}
        // You could add a difficulty changer to the GameHeader too
      /> */}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.gameInfoContainer}>
          <Text style={styles.difficultyIndicatorText}>
            Level: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
          {/* Optional: <Text style={styles.mistakesText}>Mistakes: {mistakes}/3</Text> */}
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
                    disabled={initialGridMask[rowIndex]?.[colIndex]} // Disable press on fixed cells
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

        {!isLoading && ( // Only show number pad if not loading
          <View style={styles.numberPadContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={`num-${num}`}
                style={styles.numberButton}
                onPress={() => handleNumberPress(num)}
              >
                <Text style={styles.numberButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.numberButton, styles.clearButton]}
              onPress={handleClearCell}
            >
              <Ionicons
                name="backspace-outline"
                size={28}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Congratulations Modal */}
      <Modal
        isVisible={isCongratsModalVisible}
        onBackdropPress={() => setIsCongratsModalVisible(false)}
        animationIn="zoomInUp" // More playful animation
        animationOut="zoomOutDown"
        backdropOpacity={0.6}
        useNativeDriverForBackdrop // Better performance for backdrop animation
      >
        <View style={styles.modalContent}>
          <Ionicons
            name="trophy-outline"
            size={80}
            color={COLORS.accent}
            style={{ alignSelf: 'center' }}
          />
          <Text style={styles.modalTitle}>Congratulations!</Text>
          <Text style={styles.modalMessage}>
            You've successfully solved the Sudoku puzzle on {difficulty} mode!
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setIsCongratsModalVisible(false);
              startNewGame(difficulty); // Start new game with current difficulty
            }}
          >
            <Text style={styles.modalButtonText}>
              Play Again (
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalSecondaryButton]}
            onPress={() => {
              setIsCongratsModalVisible(false);
              setGameStarted(false); // Go back to difficulty selection screen
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
    </SafeAreaView>
  );
};

// Dynamic sizing based on screen width
const screenWidth = Dimensions.get('window').width;
const gridPaddingHorizontal = 16; // Padding on the sides of the grid
const gridContainerWidth = screenWidth - gridPaddingHorizontal * 2;
// const cellSize = (gridContainerWidth - 8 * 0.5 - 2 * 2) / 9; // More precise cell size considering borders, but simpler is often fine
const cellSize = gridContainerWidth / 9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: gridPaddingHorizontal,
    paddingBottom: 20, // Ensure space for number pad
    alignItems: 'center',
  },
  loaderContainer: {
    // Styles for the loading indicator area
    width: gridContainerWidth,
    height: gridContainerWidth, // Match grid height
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
    fontFamily: 'OpenSans-Regular',
  },
  gridContainer: {
    width: gridContainerWidth,
    height: gridContainerWidth,
    borderWidth: 2, // Outer border of the grid
    borderColor: COLORS.gridBoxLine, // Darker line for the main grid box
    backgroundColor: COLORS.cellBackground,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    flex: 1, // Distribute height equally among rows
  },
  cell: {
    flex: 1, // Distribute width equally among cells in a row
    borderWidth: 0.5, // Thin lines for individual cells
    borderColor: COLORS.gridLine, // Lighter line for inner cells
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cellBackground,
  },
  cellText: {
    fontSize: Math.max(18, cellSize * 0.55), // Dynamic font size, slightly larger
    fontFamily: 'OpenSans-SemiBold', // Ensure this font is loaded
  },
  // Thicker borders for the 3x3 subgrids
  bottomThickBorder: {
    borderBottomWidth: 2, // Thicker line
    borderBottomColor: COLORS.gridBoxLine, // Use the darker box line color
  },
  rightThickBorder: {
    borderRightWidth: 2, // Thicker line
    borderRightColor: COLORS.gridBoxLine, // Use the darker box line color
  },
  selectedCell: {
    backgroundColor: COLORS.selectedCellBackground,
  },
  relatedCell: {
    // Cells in the same row, column, or 3x3 box as the selected cell
    backgroundColor: COLORS.relatedCellBackground,
  },
  fixedCell: {
    // Cells that are part of the initial puzzle
    backgroundColor: COLORS.fixedCellBackground,
  },
  fixedCellText: {
    color: COLORS.textFixed,
    fontFamily: 'OpenSans-Bold',
  },
  userCellText: {
    // Numbers entered by the user
    color: COLORS.textUser,
    fontFamily: 'OpenSans-SemiBold',
  },
  errorCell: {
    // Cells with incorrect numbers
    backgroundColor: COLORS.errorCellBackground,
  },
  errorCellText: {
    // Text color for incorrect numbers
    color: COLORS.textError,
    fontFamily: 'OpenSans-Bold', // Make error numbers stand out
  },
  highlightedNumberCell: {
    // Cells that contain the same number as the selected/last entered number
    backgroundColor: COLORS.selectedCellBackground, // Can be same as selected or a unique color
    // borderRadius: 4, // Optional: highlight numbers with a slight bubble
  },
  numberPadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 25, // Increased margin from grid
    paddingHorizontal: 10,
    gap: 10, // Spacing between number pad buttons
    width: gridContainerWidth, // Match grid width for alignment
  },
  numberButton: {
    width: (gridContainerWidth - 40 - 4 * 10) / 5, // 5 buttons per row (e.g. 1-5, 6-9 + clear)
    aspectRatio: 1.1, // Adjust for preferred shape
    backgroundColor: COLORS.cellBackground,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  numberButtonText: {
    fontSize: 28, // Larger numbers on buttons
    color: COLORS.textUser,
    fontFamily: 'OpenSans-Bold',
  },
  clearButton: {
    // Can have specific styling if different from numberButton, e.g., accent color
    // backgroundColor: COLORS.accent,
  },
  gameInfoContainer: {
    // Container for difficulty level, mistakes, timer etc.
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%', // Take full width of scroll content padding
    paddingVertical: 10, // Increased padding
    marginTop: 5,
  },
  difficultyIndicatorText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // mistakesText: { // If you implement a mistake counter
  //     fontFamily: 'OpenSans-SemiBold',
  //     fontSize: 16,
  //     color: COLORS.textError,
  // },

  // Start Screen Styles
  startContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  startScreenHeader: {
    // Header for the start screen (icon + title)
    alignItems: 'center',
    paddingTop: '15%', // Adjust for vertical positioning
    marginBottom: 20,
  },
  gameTitle: {
    // Title on the start screen
    fontFamily: 'Merriweather-Bold', // Ensure this font is loaded
    fontSize: 38, // Larger title
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  startContentScrollView: {
    // Make start content scrollable if it overflows on small screens
    flexGrow: 1,
    justifyContent: 'center',
  },
  startContent: {
    // Main content area of the start screen
    paddingHorizontal: 24,
    paddingBottom: 40, // Space from bottom
  },
  gameDescription: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17, // Slightly larger description
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26, // Improved line height
    marginBottom: 35, // Increased margin
  },
  difficultyContainer: {
    marginBottom: 35,
  },
  difficultyTitle: {
    fontFamily: 'OpenSans-Bold', // Bolder title for difficulty
    fontSize: 20, // Larger
    color: COLORS.textPrimary,
    marginBottom: 20, // Increased margin
    textAlign: 'center',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyButton: {
    paddingVertical: 14, // Taller buttons
    paddingHorizontal: 20,
    backgroundColor: COLORS.fixedCellBackground,
    borderRadius: 25, // More rounded (pill shape)
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent', // Default no border, selected will have one or different bg
    elevation: 1,
  },
  selectedDifficultyButton: {
    backgroundColor: COLORS.primary, // Selected difficulty stands out
    borderColor: COLORS.primary,
    elevation: 3,
  },
  difficultyText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedDifficultyText: {
    color: COLORS.textLight, // Text color for selected difficulty
    fontFamily: 'OpenSans-Bold',
  },
  startButton: {
    backgroundColor: COLORS.accent, // Use accent color for the main action
    borderRadius: 30, // Fully rounded
    paddingVertical: 18, // Larger button
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20, // Larger text
    color: COLORS.textLight,
  },

  // Modal Styles (for Congratulations popup)
  modalContent: {
    backgroundColor: COLORS.background, // Use theme background
    padding: 30, // More padding
    borderRadius: 20, // More rounded modal
    alignItems: 'stretch',
    elevation: 10, // Higher elevation for modal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 28, // Larger modal title
    fontFamily: 'Merriweather-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 17,
    fontFamily: 'OpenSans-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15, // Consistent button padding
    borderRadius: 15, // Rounded buttons in modal
    alignItems: 'center',
    marginBottom: 12, // Spacing between modal buttons
  },
  modalButtonText: {
    color: COLORS.textLight,
    fontSize: 18,
    fontFamily: 'OpenSans-SemiBold',
  },
  modalSecondaryButton: {
    // For "Change Difficulty" or less prominent actions
    backgroundColor: COLORS.cellBackground, // Lighter background
    borderWidth: 2,
    borderColor: COLORS.primary, // Border with primary color
  },
  modalSecondaryButtonText: {
    color: COLORS.primary, // Text color matches border
    fontFamily: 'OpenSans-SemiBold',
  },
});

export default SudokuGame;
