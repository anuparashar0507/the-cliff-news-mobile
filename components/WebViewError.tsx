import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/Theme';
import { WifiOff } from 'lucide-react-native';

type WebViewErrorProps = {
  onReload: () => void;
};

export default function WebViewError({ onReload }: WebViewErrorProps) {
  return (
    <View style={styles.container}>
      <WifiOff size={64} color={COLORS.primary} />
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorMessage}>
        We couldn't connect to The Cliff News. Please check your internet
        connection and try again.
      </Text>
      <TouchableOpacity style={styles.reloadButton} onPress={onReload}>
        <Text style={styles.reloadButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontFamily: 'Merriweather-Bold',
    fontSize: 24,
    color: COLORS.secondary,
    marginTop: 24,
    marginBottom: 12,
  },
  errorMessage: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  reloadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: COLORS.white,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
  },
});
