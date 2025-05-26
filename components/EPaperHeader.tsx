import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ArrowLeft, Share2, RefreshCw } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type EPaperHeaderProps = {
  title?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  onShare?: () => void;
  currentUrl?: string;
};

export default function EPaperHeader({
  title = 'E-Paper',
  onBack,
  onRefresh,
  onShare,
  currentUrl,
}: EPaperHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleShare = () => {
    if (onShare && currentUrl) {
      onShare();
    }
  };

  return (
    <View
      style={[
        styles.header,
        { paddingTop: Platform.OS === 'ios' ? insets.top : 10 },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={COLORS.white} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.buttonsContainer}>
        {onRefresh && (
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <RefreshCw size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {currentUrl && (
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.primary,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Merriweather-Bold',
    fontSize: 20,
    color: COLORS.white,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
