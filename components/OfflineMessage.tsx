// components/OfflineMessage.tsx (CORRECTED)
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { WifiOff, BookOpen, Gamepad2, ArrowRight } from 'lucide-react-native';

export default function OfflineMessage() {
  const router = useRouter();

  const handleEBooksPress = () => {
    router.push('/(tabs)/ebooks');
  };

  const handleGamesPress = () => {
    router.push('/(tabs)/games');
  };

  const handleRetryPress = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <WifiOff size={80} color={COLORS.error} />
        </View>

        <Text style={styles.title}>You're Offline</Text>
        <Text style={styles.message}>
          No internet connection detected. But don't worry! You can still enjoy
          our offline content.
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, styles.ebooksCard]}
            onPress={handleEBooksPress}
          >
            <BookOpen size={32} color={COLORS.white} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Read E-Books</Text>
              <Text style={styles.optionDescription}>
                Access our collection of religious texts and novels
              </Text>
            </View>
            <ArrowRight size={20} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.gamesCard]}
            onPress={handleGamesPress}
          >
            <Gamepad2 size={32} color={COLORS.white} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Play Games</Text>
              <Text style={styles.optionDescription}>
                Challenge yourself with Sudoku and Tic-Tac-Toe
              </Text>
            </View>
            <ArrowRight size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.retryButton} onPress={handleRetryPress}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 28,
    color: COLORS.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ebooksCard: {
    backgroundColor: COLORS.accent,
  },
  gamesCard: {
    backgroundColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  retryButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  retryButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
  },
});
