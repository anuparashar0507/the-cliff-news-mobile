import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { WifiOff, RefreshCw, AlertTriangle, Wifi } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

type WebViewErrorProps = {
  onReload: () => void;
  message?: string;
  showNetworkCheck?: boolean;
};

export default function WebViewError({
  onReload,
  message,
  showNetworkCheck = true,
}: WebViewErrorProps) {
  const { colors } = useTheme();

  // Determine error type and appropriate icon/message
  const getErrorDetails = () => {
    const defaultMessage =
      "We couldn't connect to The Cliff News. Please check your internet connection and try again.";

    if (!message) {
      return {
        icon: <WifiOff size={64} color={colors.error} />,
        title: 'Connection Error',
        description: defaultMessage,
        isNetworkError: true,
      };
    }

    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection')
    ) {
      return {
        icon: <WifiOff size={64} color={colors.error} />,
        title: 'Network Error',
        description: message,
        isNetworkError: true,
      };
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('slow')) {
      return {
        icon: <Wifi size={64} color={colors.warning} />,
        title: 'Slow Connection',
        description: message,
        isNetworkError: true,
      };
    }

    if (lowerMessage.includes('server') || lowerMessage.includes('not found')) {
      return {
        icon: <AlertTriangle size={64} color={colors.error} />,
        title: 'Server Error',
        description: message,
        isNetworkError: false,
      };
    }

    // Generic error
    return {
      icon: <AlertTriangle size={64} color={colors.error} />,
      title: 'Loading Error',
      description: message,
      isNetworkError: false,
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {errorDetails.icon}

      <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
        {errorDetails.title}
      </Text>

      <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
        {errorDetails.description}
      </Text>

      {/* Network troubleshooting tips for network errors */}
      {errorDetails.isNetworkError && showNetworkCheck && (
        <View
          style={[styles.tipsContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
            Troubleshooting Tips:
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Check your WiFi or mobile data connection
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Try moving to an area with better signal
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Restart your WiFi router if using WiFi
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Wait a moment and try again
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.reloadButton, { backgroundColor: colors.primary }]}
        onPress={onReload}
      >
        <RefreshCw size={20} color={colors.white} />
        <Text style={[styles.reloadButtonText, { color: colors.white }]}>
          Try Again
        </Text>
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
  },
  errorTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  tipsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tipsTitle: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reloadButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
