import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import type { ToastVariantType } from '@/src/constants/theme';
import { BorderRadius, IconSize, Shadows, Spacing, TextVariant, ToastVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import BIcon from './icon';
import BText from './text';
import BView from './view';

export interface BToastProps {
  /** Controls visibility */
  visible: boolean;
  /** Toast message */
  message: string;
  /** Visual variant */
  variant?: ToastVariantType;
  /** Auto-dismiss duration in ms (default 3000) */
  duration?: number;
  /** Called when the toast finishes auto-dismissing */
  onDismiss: () => void;
}

const ICON_MAP: Record<ToastVariantType, string> = {
  [ToastVariant.INFO]: 'information-circle',
  [ToastVariant.SUCCESS]: 'checkmark-circle',
  [ToastVariant.WARNING]: 'alert-circle',
  [ToastVariant.ERROR]: 'close-circle',
};

const BToast: FC<BToastProps> = ({ visible, message, variant = ToastVariant.INFO, duration = 3000, onDismiss }) => {
  const themeColors = useThemeColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const COLOR_MAP: Record<ToastVariantType, { bg: string; text: string; icon: string }> = {
    [ToastVariant.INFO]: { bg: themeColors.primaryFaded, text: themeColors.primary, icon: themeColors.primary },
    [ToastVariant.SUCCESS]: { bg: themeColors.successBackground, text: themeColors.success, icon: themeColors.success },
    [ToastVariant.WARNING]: { bg: themeColors.warningBackground, text: themeColors.warning, icon: themeColors.warning },
    [ToastVariant.ERROR]: { bg: themeColors.errorBackground, text: themeColors.error, icon: themeColors.error },
  };

  const colors = COLOR_MAP[variant];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(20);
    }
  }, [visible, duration, onDismiss, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.icon, opacity, transform: [{ translateY }] },
      ]}
    >
      <BView row align="center" gap="sm" style={styles.inner}>
        <BIcon name={ICON_MAP[variant] as any} size={IconSize.sm} color={colors.icon} />
        <BText variant={TextVariant.LABEL} color={colors.text} style={styles.message}>
          {message}
        </BText>
      </BView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.md,
    zIndex: 9999,
  },
  inner: {
    padding: Spacing.md,
  },
  message: {
    flex: 1,
  },
});

export default BToast;
