import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import { Animated } from 'react-native';

import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import BButton from './button';
import BIcon from './icon';
import BText from './text';
import BView from './view';

export type BAccordionProps = {
  /** Header icon name (Ionicons) */
  icon: string;
  /** Header icon color */
  iconColor?: string;
  /** Section title */
  title: string;
  /** Whether section starts expanded */
  defaultExpanded?: boolean;
  /** Children content when expanded */
  children: ReactNode;
};

const BAccordion: FC<BAccordionProps> = ({ icon, iconColor, title, defaultExpanded = false, children }) => {
  const themeColors = useThemeColors();
  const resolvedIconColor = iconColor ?? themeColors.primary;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [chevronRotation] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const toggle = () => {
    const toValue = expanded ? 0 : 1;

    Animated.timing(chevronRotation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setExpanded(!expanded);
  };

  const rotateInterpolation = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <BView rounded={SpacingValue.LG} border bg="background" fullWidth>
      <BButton variant={ButtonVariant.GHOST} onPress={toggle} fullWidth>
        <BView
          row
          paddingX={SpacingValue.BASE}
          paddingY={SpacingValue.SM}
          gap={SpacingValue.SM}
          align="center"
          justify="space-between"
          fullWidth
        >
          <BView row gap={SpacingValue.MD} align="center">
            <BIcon name={icon as any} color={resolvedIconColor} size={SpacingValue.MD} />
            <BText variant={TextVariant.SUBHEADING}>{title}</BText>
          </BView>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
            <BIcon name="chevron-down" size={SpacingValue.SM} color={themeColors.textMuted} />
          </Animated.View>
        </BView>
      </BButton>
      {expanded && (
        <BView padding={SpacingValue.BASE} paddingY={SpacingValue.SM}>
          {children}
        </BView>
      )}
    </BView>
  );
};

export default BAccordion;
