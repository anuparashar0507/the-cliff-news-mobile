import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  Grid2x2 as SudokuIcon,
  Sigma as SigmaIcon,
  Puzzle as WordPuzzleIcon,
  XCircle as TicTacToeIcon,
  Gamepad2, // A generic game icon for the header
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardMarginHorizontal = 20; // Increased horizontal margin for the screen
const cardGap = 20; // Gap between cards
// Calculate card width based on 1 column, allowing for margins
const cardWidth = width - cardMarginHorizontal * 2;

// Define a type for the game routes to ensure type safety
type GamePath =
  | '/games/sudoku'
  | '/games/tic-tac-toe'
  | '/games/2048'
  | '/games/word-puzzle';

interface GameOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement<{ size: number; color: string }>;
  color: string; // Base color for the card
  gradientColors?: [string, string]; // Optional gradient
  route: GamePath;
}

// Helper function to create a slightly darker shade for gradient or accents
const darkenColor = (hex: string, percent: number): string => {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.floor(r * (1 - percent / 100));
  g = Math.floor(g * (1 - percent / 100));
  b = Math.floor(b * (1 - percent / 100));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
};

const AnimatedGameCard = ({
  game,
  index,
  onPress,
}: {
  game: GameOption;
  index: number;
  onPress: () => void;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30); // Start 30px down

  useEffect(() => {
    opacity.value = withDelay(
      index * 150,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    translateY.value = withDelay(
      index * 150,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
  }, [opacity, translateY, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  // Use gradient if provided, otherwise use the solid color
  // For a true gradient, you'd use expo-linear-gradient. This is a visual approximation.
  const cardBackgroundColor = game.color;
  const cardAccentColor = game.gradientColors
    ? game.gradientColors[1]
    : darkenColor(game.color, 15);

  return (
    <Animated.View style={[styles.gameCardContainer, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.gameCard,
          // If you install expo-linear-gradient, you can use it here
          // For now, we'll use a solid color and a border for accent
          {
            backgroundColor: cardBackgroundColor,
            borderColor: cardAccentColor,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardIconBackground}>
          {React.cloneElement(game.icon, { size: 48, color: cardAccentColor })}
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>
        </View>
        <View style={styles.playButton}>
          <Text style={styles.playButtonText}>Play Now</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function GamesScreen() {
  const router = useRouter();

  const gameOptions: GameOption[] = [
    {
      id: 'sudoku',
      title: 'Sudoku Classic',
      description: 'Challenge your logic with this timeless number puzzle.',
      icon: <SudokuIcon color={COLORS.white} />, // Icon color will be overridden in AnimatedGameCard
      color: COLORS.primary,
      gradientColors: [COLORS.primary, darkenColor(COLORS.primary, 20)],
      route: '/games/sudoku',
    },
    {
      id: 'tictactoe',
      title: 'Tic Tac Toe',
      description: "The ultimate X's and O's showdown. Play vs AI or a friend!",
      icon: <TicTacToeIcon color={COLORS.white} />,
      color: COLORS.success, // Using your theme's success color
      gradientColors: [COLORS.success, darkenColor(COLORS.success, 20)],
      route: '/games/tic-tac-toe',
    },
    // {
    //   id: '2048',
    //   title: '2048 Masters',
    //   description: 'Slide, merge, and strategize to reach the 2048 tile.',
    //   icon: <SigmaIcon color={COLORS.white} />,
    //   color: COLORS.accent,
    //   gradientColors: [COLORS.accent, darkenColor(COLORS.accent, 20)],
    //   route: '/games/2048',
    // },
    // {
    //   id: 'word-puzzle',
    //   title: 'Word Finder Pro',
    //   description: 'Unscramble letters and expand your vocabulary.',
    //   icon: <WordPuzzleIcon color={COLORS.white} />,
    //   color: COLORS.secondary,
    //   gradientColors: [COLORS.secondary, darkenColor(COLORS.secondary, 20)],
    //   route: '/games/word-puzzle',
    // },
  ];

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* The header "Fun Zone" is handled by TabLayout, so no need for a title here */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeader}>
          <Gamepad2 size={32} color={COLORS.primary} />
          <Text style={styles.screenTitle}>Game Zone</Text>
          <Text style={styles.screenSubtitle}>Choose your challenge!</Text>
        </View>

        <View style={styles.gamesGrid}>
          {gameOptions.map((game, index) => (
            <AnimatedGameCard
              key={game.id}
              game={game}
              index={index}
              onPress={() => router.push(game.route)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // A slightly off-white or very light gray
  },
  scrollContent: {
    paddingTop: 20, // Space from top if header is transparent or part of scroll
    paddingBottom: 40, // More space at the bottom
    paddingHorizontal: cardMarginHorizontal,
  },
  screenHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  screenTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 28,
    color: COLORS.secondary,
    marginTop: 8,
  },
  screenSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  gamesGrid: {
    flexDirection: 'column',
    gap: cardGap, // Use the defined gap
  },
  gameCardContainer: {
    // This container is for the animation
  },
  gameCard: {
    width: cardWidth,
    borderRadius: 20, // More rounded corners
    padding: 12,
    borderWidth: 1, // Using border as part of the gradient effect
    overflow: 'hidden', // Important for inner elements if using pseudo-gradient
    elevation: 6, // Slightly more elevation for a "premium" feel
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2, // Softer shadow
    shadowRadius: 10,
    // alignItems: 'center', // Center content if icon is above text
  },
  cardIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 40, // Circular background for icon
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent white
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center', // Center the icon container
  },
  cardTextContainer: {
    alignItems: 'center', // Center title and description
  },
  gameTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24, // Larger title
    color: COLORS.white, // Ensure good contrast with card background
    marginBottom: 8,
    textAlign: 'center',
  },
  gameDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.white, // Ensure good contrast
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 20,
    minHeight: 40, // Ensure space for 2 lines of description
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white button
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20, // Pill-shaped button
    alignSelf: 'center', // Center the button
    marginTop: 'auto', // Push to bottom if card content is variable
  },
  playButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});
