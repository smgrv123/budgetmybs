import type { ModalPositionType } from '@/constants/theme';
import { BorderRadius, ModalPosition, Opacity, Shadows, Spacing, TextVariant } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { FC } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { ModalProps as RNModalProps } from 'react-native-modal';
import RNModal from 'react-native-modal';
import BButton from './button';
import BIcon from './icon';
import BText from './text';
import BView from './view';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BModalProps extends Partial<RNModalProps> {
  /** Controls visibility of the modal */
  isVisible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Modal title (optional) */
  title?: string;
  /** Modal content */
  // content: ReactNode;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Modal position */
  position?: ModalPositionType;
  /** Override content container styles */
  containerStyle?: StyleProp<ViewStyle>;
  /** Override content styles */
  contentStyle?: StyleProp<ViewStyle>;
  /** Override header styles */
  headerStyle?: StyleProp<ViewStyle>;
}

const BModal: FC<BModalProps> = ({
  isVisible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  position = ModalPosition.CENTER,
  containerStyle,
  contentStyle,
  headerStyle,
  style,
  ...props
}) => {
  const themeColors = useThemeColors();
  const isBottom = position === ModalPosition.BOTTOM;

  return (
    <RNModal
      isVisible={isVisible}
      onBackdropPress={closeOnBackdrop ? onClose : undefined}
      onBackButtonPress={onClose}
      onSwipeComplete={isBottom ? onClose : undefined}
      swipeDirection={isBottom ? 'down' : undefined}
      style={[styles.modal, isBottom && styles.modalBottom, style]}
      backdropOpacity={Opacity.overlay}
      animationIn={isBottom ? 'slideInUp' : 'fadeIn'}
      animationOut={isBottom ? 'slideOutDown' : 'fadeOut'}
      useNativeDriver
      useNativeDriverForBackdrop
      statusBarTranslucent
      {...props}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <BView
          style={[
            styles.container,
            isBottom && styles.containerBottom,
            { backgroundColor: themeColors.background },
            containerStyle,
          ]}
        >
          {(title || showCloseButton) && (
            <BView row style={[styles.header, { borderBottomColor: themeColors.border }, headerStyle]}>
              {title ? (
                <BText variant={TextVariant.SUBHEADING} style={styles.title}>
                  {title}
                </BText>
              ) : (
                <BView />
              )}
              {showCloseButton && (
                <BButton variant="ghost" onPress={onClose}>
                  <BIcon name="close" size="base" color={themeColors.textSecondary} />
                </BButton>
              )}
            </BView>
          )}
          <BView style={[styles.content, contentStyle]}>{children}</BView>
        </BView>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBottom: {
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxWidth: 400,
  },
  container: {
    borderRadius: BorderRadius.lg,
    maxHeight: SCREEN_HEIGHT * 0.85,
    width: '90%',
    alignSelf: 'center',
    ...Shadows.lg,
  },
  containerBottom: {
    width: '100%',
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
});

export default BModal;
