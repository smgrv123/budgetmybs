import type { ModalPositionType } from '@/constants/theme';
import { BorderRadius, Colors, ModalPosition, Opacity, Shadows, Spacing } from '@/constants/theme';
import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import type { ModalProps as RNModalProps } from 'react-native-modal';
import RNModal from 'react-native-modal';
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
  content: ReactNode;
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
}

const BModal: FC<BModalProps> = ({
  isVisible,
  onClose,
  title,
  content,
  showCloseButton = true,
  closeOnBackdrop = true,
  position = ModalPosition.CENTER,
  containerStyle,
  contentStyle,
  style,
  ...props
}) => {
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
        <BView style={[styles.container, isBottom && styles.containerBottom, containerStyle]}>
          {(title || showCloseButton) && (
            <BView row style={styles.header}>
              {title ? (
                <BText variant="subheading" style={styles.title}>
                  {title}
                </BText>
              ) : (
                <BView />
              )}
              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    opacity: pressed ? Opacity.pressed : Opacity.full,
                  })}
                >
                  <BIcon name="close" size="base" color={Colors.light.textSecondary} />
                </Pressable>
              )}
            </BView>
          )}
          <BView style={[styles.content, contentStyle]}>{content}</BView>
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
    backgroundColor: Colors.light.background,
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
});

export default BModal;
