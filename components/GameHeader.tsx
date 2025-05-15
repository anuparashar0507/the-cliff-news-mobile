import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/Theme';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

type GameHeaderProps = {
  title: string;
  onBack: () => void;
  onNewGame?: () => void;
};

export default function GameHeader({
  title,
  onBack,
  onNewGame,
}: GameHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={24} color={COLORS.secondary} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {onNewGame && (
        <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
          <RefreshCw size={22} color={COLORS.white} />
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Merriweather-Bold',
    fontSize: 20,
    color: COLORS.secondary,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newGameText: {
    color: COLORS.white,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    marginLeft: 4,
  },
});
