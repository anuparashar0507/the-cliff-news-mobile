import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Modal from 'react-native-modal'; // For polished popups
import { RefreshCw, AlertTriangle, Trophy, Info } from 'lucide-react-native'; // Icons

import { COLORS, TYPOGRAPHY } from '@/constants/Theme'; // Your app's theme
// Assuming GameHeader is a reusable component for consistent game headers
// import GameHeader from '@/components/GameHeader';

// --- Game Constants ---
const { width } = Dimensions.get('window');
const GRID_PADDING = 8; // Padding within the board container
const CELL_GAP = 8; // Gap between cells
const BOARD_SIZE = Math.min(width - 32, 380); // Max board size, with screen padding
const CELL_SIZE = (BOARD_SIZE - GRID_PADDING * 2 - CELL_GAP * 3) / 4; // Size of each cell

// --- Tile Data Interface ---
interface TileData {
  id: string; // Unique ID for React key and animation tracking
  value: number;
  row: number;
  col: number;
  isNew?: boolean; // Flag for appearance animation
  isMerged?: boolean; // Flag for merge animation
  key?: string; // For React list keys
}

// --- Animated Tile Component ---
const AnimatedTile: React.FC<{
  tile: TileData;
  onAnimationComplete?: () => void;
}> = React.memo(({ tile, onAnimationComplete }) => {
  const scale = useSharedValue(tile.isNew || tile.isMerged ? 0.7 : 1); // Initial scale for new/merged tiles
  const opacity = useSharedValue(tile.isNew ? 0 : 1); // Initial opacity for new tiles

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      position: 'absolute',
      left: tile.col * (CELL_SIZE + CELL_GAP) + GRID_PADDING,
      top: tile.row * (CELL_SIZE + CELL_GAP) + GRID_PADDING,
      width: CELL_SIZE,
      height: CELL_SIZE,
      backgroundColor: getTileBackgroundColor(tile.value),
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  useEffect(() => {
    if (tile.isNew) {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
      scale.value = withTiming(
        1,
        { duration: 200, easing: Easing.out(Easing.quad) },
        () => {
          if (onAnimationComplete) onAnimationComplete();
        }
      );
    } else if (tile.isMerged) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(
          1,
          { duration: 100, easing: Easing.out(Easing.quad) },
          () => {
            if (onAnimationComplete) onAnimationComplete();
          }
        )
      );
    } else {
      // Ensure opacity and scale are set for non-new/non-merged tiles if they were previously animated
      opacity.value = 1;
      scale.value = 1;
    }
  }, [tile.isNew, tile.isMerged, opacity, scale, onAnimationComplete]);

  return (
    <Animated.View style={animatedStyle}>
      <Text
        style={[
          styles.tileText,
          {
            color: getTileTextColor(tile.value),
            fontSize: getTileFontSize(tile.value),
          },
        ]}
      >
        {tile.value}
      </Text>
    </Animated.View>
  );
});

// --- Helper Functions for Tile Colors and Text ---
const getTileBackgroundColor = (value: number): string => {
  // Using a more theme-aware approach, you can map values to your COLORS
  if (value === 0) return 'transparent'; // No background for empty
  if (value === 2) return COLORS.highlight; // Example: Light gray from theme
  if (value === 4) return '#FFF3E0'; // Light orange (could be derived from COLORS.primary)
  if (value === 8) return COLORS.primary;
  if (value === 16) return '#FF8A65'; // Lighter version of an orange/red
  if (value === 32) return COLORS.accent; // Theme accent
  if (value === 64) return '#EF5350'; // A red
  if (value >= 128 && value <= 512) return COLORS.secondary; // Theme secondary
  if (value >= 1024) return COLORS.error; // Theme error color for high values
  return COLORS.darkGray; // Default
};

const getTileTextColor = (value: number): string => {
  if (value <= 4) return COLORS.textDark; // Dark text for light tiles
  if (value === 8 || (value >= 128 && value <= 512)) return COLORS.textLight; // Light text for primary/secondary
  return COLORS.textLight; // Default to light text
};

const getTileFontSize = (value: number): number => {
  if (value < 100) return CELL_SIZE * 0.4;
  if (value < 1000) return CELL_SIZE * 0.3;
  return CELL_SIZE * 0.25;
};

// --- Main Game Component ---
export default function Game2048Screen() {
  const router = useRouter();
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0); // TODO: Implement AsyncStorage for best score
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'win' | 'lose' | null>(null);

  const boardOpacity = useSharedValue(0);
  const boardScale = useSharedValue(0.8);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: boardOpacity.value,
    transform: [{ scale: boardScale.value }],
  }));

  // --- Game Initialization ---
  const initializeGrid = useCallback(() => {
    let initialTiles: TileData[] = [];
    initialTiles = addRandomTile(addRandomTile(initialTiles));
    setTiles(initialTiles);
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
    setIsModalVisible(false);
    setModalType(null);

    boardOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    boardScale.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  useEffect(() => {
    initializeGrid();
    // TODO: Load bestScore from AsyncStorage
  }, [initializeGrid]);

  // --- Add Random Tile ---
  const addRandomTile = (currentTiles: TileData[]): TileData[] => {
    const emptyCells: { row: number; col: number }[] = [];
    const grid = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));
    currentTiles.forEach((tile) => {
      grid[tile.row][tile.col] = tile.value;
    });

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) emptyCells.push({ row: r, col: c });
      }
    }

    if (emptyCells.length > 0) {
      const { row, col } =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      const newTile: TileData = {
        id: Date.now().toString() + Math.random(),
        value,
        row,
        col,
        isNew: true,
        key: Date.now().toString() + Math.random(),
      };
      return [...currentTiles, newTile];
    }
    return currentTiles;
  };

  // --- Game Logic (Movement & Merging) ---
  const processMove = (
    currentTiles: TileData[],
    direction: 'horizontal' | 'vertical',
    getNext: (k: number) => number
  ) => {
    let newTiles = JSON.parse(JSON.stringify(currentTiles)) as TileData[];
    let moved = false;
    let currentScore = score;
    const mergedIdsThisMove: string[] = [];

    for (let i = 0; i < 4; i++) {
      // Iterate over rows or columns
      let line: TileData[] = []; // Tiles in the current row/column
      if (direction === 'horizontal') {
        line = newTiles
          .filter((t) => t.row === i)
          .sort((a, b) => getNext(a.col) - getNext(b.col));
      } else {
        // vertical
        line = newTiles
          .filter((t) => t.col === i)
          .sort((a, b) => getNext(a.row) - getNext(b.row));
      }

      let newLine: TileData[] = [];
      for (let j = 0; j < line.length; j++) {
        if (
          j + 1 < line.length &&
          line[j].value === line[j + 1].value &&
          !mergedIdsThisMove.includes(line[j].id) &&
          !mergedIdsThisMove.includes(line[j + 1].id)
        ) {
          const mergedValue = line[j].value * 2;
          currentScore += mergedValue;

          const mergedTile: TileData = {
            ...line[j], // Keep position of the first tile
            value: mergedValue,
            isMerged: true, // Flag for merge animation
            id: Date.now().toString() + Math.random(), // New ID for merged tile
            key: Date.now().toString() + Math.random(),
          };
          newLine.push(mergedTile);

          mergedIdsThisMove.push(line[j].id, line[j + 1].id); // Track original IDs that merged
          moved = true;
          j++; // Skip next tile as it's merged
        } else {
          newLine.push(line[j]);
        }
      }

      // Update positions after merge
      for (let k = 0; k < newLine.length; k++) {
        const targetPos = getNext(k); // 0, 1, 2, 3 or 3, 2, 1, 0
        const originalTile = newTiles.find((t) => t.id === newLine[k].id);
        if (originalTile) {
          if (direction === 'horizontal') {
            if (originalTile.col !== targetPos) moved = true;
            originalTile.col = targetPos;
            originalTile.row = i; // ensure row is correct
          } else {
            // vertical
            if (originalTile.row !== targetPos) moved = true;
            originalTile.row = targetPos;
            originalTile.col = i; // ensure col is correct
          }
          originalTile.isMerged = newLine[k].isMerged; // Propagate merge flag
          originalTile.value = newLine[k].value; // Propagate new value
          originalTile.id = newLine[k].id; // Propagate new ID
          originalTile.key = newLine[k].key;
        } else if (newLine[k].isMerged) {
          // This is a newly created merged tile
          if (direction === 'horizontal') {
            newLine[k].col = targetPos;
            newLine[k].row = i;
          } else {
            newLine[k].row = targetPos;
            newLine[k].col = i;
          }
          newTiles.push(newLine[k]); // Add it if it's truly new (from merge logic)
        }
      }
      // Filter out the tiles that were merged (original ones)
      newTiles = newTiles.filter(
        (t) =>
          !mergedIdsThisMove.includes(t.id) ||
          newTiles.find((nt) => nt.id === t.id && nt.isMerged)
      );
      // Remove duplicates that might arise if merge logic is imperfect with IDs
      const uniqueTiles = new Map<string, TileData>();
      newTiles.forEach((t) => {
        const key = `${t.row}-${t.col}`;
        if (
          !uniqueTiles.has(key) ||
          uniqueTiles.get(key)!.value < t.value ||
          t.isMerged
        ) {
          uniqueTiles.set(key, t);
        }
      });
      newTiles = Array.from(uniqueTiles.values());
    }
    setScore(currentScore);
    return {
      updatedTiles: newTiles.map((t) => ({
        ...t,
        isNew: false,
        isMerged: t.isMerged,
      })),
      moved,
      newScore: currentScore,
    };
  };

  const move = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (isGameOver || hasWon) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let result;
    switch (direction) {
      case 'left':
        result = processMove(tiles, 'horizontal', (k) => k);
        break;
      case 'right':
        result = processMove(tiles, 'horizontal', (k) => 3 - k);
        break;
      case 'up':
        result = processMove(tiles, 'vertical', (k) => k);
        break;
      case 'down':
        result = processMove(tiles, 'vertical', (k) => 3 - k);
        break;
    }

    // Clean up flags after animations would have notionally completed
    const tilesWithoutFlags = result.updatedTiles.map((t) => ({
      ...t,
      isNew: false,
      isMerged: false,
    }));

    if (result.moved) {
      const tilesWithNew = addRandomTile(tilesWithoutFlags);
      setTiles(tilesWithNew);
      checkGameEnd(tilesWithNew, result.newScore);
    } else {
      setTiles(tilesWithoutFlags); // Still update to clear flags even if no logical move
    }
  };

  // --- Check Game End ---
  const checkGameEnd = (currentTiles: TileData[], currentScore: number) => {
    let won = false;
    currentTiles.forEach((tile) => {
      if (tile.value === 2048) won = true;
    });

    if (won && !hasWon) {
      setHasWon(true);
      setModalType('win');
      setIsModalVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Don't set game over if they won, they can continue playing
    }

    // Check for Game Over (no empty cells and no possible merges)
    const grid = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));
    currentTiles.forEach((tile) => {
      grid[tile.row][tile.col] = tile.value;
    });

    let emptyCells = 0;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) if (grid[r][c] === 0) emptyCells++;

    if (emptyCells > 0) return; // Game not over if there are empty cells

    let canMove = false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c + 1 < 4 && grid[r][c] === grid[r][c + 1]) canMove = true;
        if (r + 1 < 4 && grid[r][c] === grid[r + 1][c]) canMove = true;
        if (canMove) break;
      }
      if (canMove) break;
    }

    if (!canMove) {
      setIsGameOver(true);
      if (!hasWon) {
        // Only show lose modal if they haven't won already
        setModalType('lose');
        setIsModalVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    // Update best score
    if (currentScore > bestScore) setBestScore(currentScore);
  };

  // --- Swipe Gesture ---
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Minimum horizontal distance to trigger
    .activeOffsetY([-20, 20]) // Minimum vertical distance to trigger
    .onEnd((event) => {
      const { translationX, translationY } = event;
      if (Math.abs(translationX) > Math.abs(translationY)) {
        move(translationX > 0 ? 'right' : 'left');
      } else {
        move(translationY > 0 ? 'down' : 'up');
      }
    });

  const handleTileAnimationComplete = useCallback((tileId: string) => {
    // This function could be used to remove the isNew/isMerged flags after animation
    // For simplicity, flags are cleared in the `move` function after the logical update
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Assuming GameHeader is used if uncommented, or use Stack.Screen options */}
      <Stack.Screen options={{ headerShown: false }} />
      {/* <GameHeader title="2048" onBack={() => router.back()} onNewGame={initializeGrid} /> */}

      <View style={styles.headerContainer}>
        <Text style={styles.gameTitle}>2048</Text>
        <View style={styles.scoresContainer}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={styles.scoreValue}>{bestScore}</Text>
          </View>
        </View>
      </View>

      <View style={styles.gameContainer}>
        {/* <GestureDetector gesture={panGesture}> */}
        <Animated.View style={[styles.boardContainer, boardAnimatedStyle]}>
          {/* Background Grid Cells */}
          {Array(4)
            .fill(0)
            .map((index, r) => (
              <View
                key={`row-${r}`}
                style={[
                  styles.gridRow,
                  index === Array(4).fill(0).length - 1 && styles.lastGridRow,
                ]}
              >
                {Array(4)
                  .fill(0)
                  .map((_, c) => (
                    <View key={`cell-${r}-${c}`} style={styles.gridCell} />
                  ))}
              </View>
            ))}
          {/* Animated Tiles */}
          {tiles.map((tile) => (
            <AnimatedTile
              key={tile.key || tile.id} // Use tile.key if available, else tile.id
              tile={tile}
              onAnimationComplete={() => handleTileAnimationComplete(tile.id)}
            />
          ))}
        </Animated.View>
        {/* </GestureDetector> */}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={initializeGrid}>
          <RefreshCw size={24} color={COLORS.primary} />
          <Text style={styles.controlButtonText}>New Game</Text>
        </TouchableOpacity>
        {/* Add more controls if needed, e.g., Undo */}
      </View>

      <Text style={styles.instructionsText}>
        Swipe to move tiles. Merge same numbers to score!
      </Text>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.6}
      >
        <View style={styles.modalContent}>
          {modalType === 'win' && (
            <Trophy size={60} color={COLORS.accent} style={styles.modalIcon} />
          )}
          {modalType === 'lose' && (
            <AlertTriangle
              size={60}
              color={COLORS.error}
              style={styles.modalIcon}
            />
          )}
          <Text style={styles.modalTitle}>
            {modalType === 'win' ? 'You Win!' : 'Game Over!'}
          </Text>
          <Text style={styles.modalMessage}>
            {modalType === 'win'
              ? `You reached 2048! Your score: ${score}`
              : `Your final score: ${score}`}
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
            onPress={initializeGrid}
          >
            <Text style={styles.modalButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalSecondaryButton]}
            onPress={() => setIsModalVisible(false)}
          >
            <Text
              style={[styles.modalButtonText, styles.modalSecondaryButtonText]}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute space
    paddingVertical: Platform.OS === 'android' ? 20 : 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  gameTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 36,
    color: COLORS.secondary,
    marginBottom: 15,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300, // Max width for score boxes
  },
  scoreBox: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scoreLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.gray,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 22,
    color: COLORS.secondary,
  },
  gameContainer: {
    // This container helps center the board if there's extra vertical space
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1, // Allow it to take available space
  },
  boardContainer: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: COLORS.gray, // Board background (behind cells)
    borderRadius: 8,
    padding: GRID_PADDING,
    position: 'relative', // For absolute positioning of tiles
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: CELL_SIZE,
    marginBottom: CELL_GAP, // For the last row, this margin might be outside if not handled
  },
  lastGridRow: {
    marginBottom: 0,
  },
  gridCell: {
    // Background cells
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: COLORS.lightGray, // Background of an empty cell
    borderRadius: 6,
  },
  tileText: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  controlButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  instructionsText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10, // Ensure it's visible
  },
  modalContent: {
    backgroundColor: COLORS.surfaceLight,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    color: COLORS.secondary,
    marginBottom: 10,
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
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
  },
  modalSecondaryButton: {
    backgroundColor: COLORS.lightGray,
  },
  modalSecondaryButtonText: {
    color: COLORS.secondary,
  },
});
