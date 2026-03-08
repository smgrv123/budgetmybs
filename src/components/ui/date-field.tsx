import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import {
  BorderRadius,
  ButtonVariant,
  ComponentHeight,
  ComponentSize,
  FontSize,
  ModalPosition,
  Opacity,
  Spacing,
  SpacingValue,
  TextVariant,
} from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatDate, formatLocalDateToISO, isISODateString, parseISOToLocalDate } from '@/src/utils/date';
import BButton from './button';
import BIcon from './icon';
import BModal from './modal';
import BText from './text';
import BView from './view';

const DATE_FIELD_TEXT = {
  selectDate: 'Select Date',
  cancel: 'Cancel',
  done: 'Done',
  clear: 'Clear',
} as const;

export type BDateFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: string;
  maximumDate?: string;
  allowClear?: boolean;
  disabled?: boolean;
};

const getDateFromISO = (value?: string): Date =>
  value && isISODateString(value) ? parseISOToLocalDate(value) : new Date();

const BDateField: FC<BDateFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  error,
  minimumDate,
  maximumDate,
  allowClear = false,
  disabled = false,
}) => {
  const themeColors = useThemeColors();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState<Date>(getDateFromISO(value));

  const minDate = useMemo(
    () => (minimumDate && isISODateString(minimumDate) ? parseISOToLocalDate(minimumDate) : undefined),
    [minimumDate]
  );
  const maxDate = useMemo(
    () => (maximumDate && isISODateString(maximumDate) ? parseISOToLocalDate(maximumDate) : undefined),
    [maximumDate]
  );

  const displayValue =
    value && isISODateString(value) ? formatDate(parseISOToLocalDate(value), 'DD MMM YYYY') : placeholder;
  const displayColor = value && isISODateString(value) ? themeColors.text : themeColors.textMuted;

  const openPicker = () => {
    if (disabled) return;

    const currentDate = getDateFromISO(value);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        is24Hour: true,
        minimumDate: minDate,
        maximumDate: maxDate,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) return;
          onChange(formatLocalDateToISO(selectedDate));
        },
      });
      return;
    }

    if (!DateTimePicker) return;
    setIosDraftDate(currentDate);
    setIsPickerVisible(true);
  };

  const clearValue = () => {
    if (!allowClear || disabled) return;
    onChange('');
  };

  const confirmIOSDate = () => {
    onChange(formatLocalDateToISO(iosDraftDate));
    setIsPickerVisible(false);
  };

  return (
    <BView style={styles.container}>
      {label && (
        <BText variant={TextVariant.LABEL} style={styles.label}>
          {label}
        </BText>
      )}

      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          {
            height: ComponentHeight.md,
            backgroundColor: themeColors.background,
            borderColor: error ? themeColors.error : themeColors.border,
            opacity: disabled ? Opacity.disabled : pressed ? Opacity.pressed : Opacity.full,
          },
        ]}
      >
        <BText style={[styles.valueText, { color: displayColor }]} numberOfLines={1}>
          {displayValue}
        </BText>
        <BIcon name="calendar-outline" size={ComponentSize.SM} color={themeColors.textSecondary} />
      </Pressable>

      {allowClear && Boolean(value) && !disabled && (
        <BButton
          variant={ButtonVariant.GHOST}
          onPress={clearValue}
          paddingX={SpacingValue.NONE}
          paddingY={SpacingValue.XS}
          style={styles.clearButton}
        >
          <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
            {DATE_FIELD_TEXT.clear}
          </BText>
        </BButton>
      )}

      {error && (
        <BText variant={TextVariant.CAPTION} color={themeColors.error} style={styles.errorText}>
          {error}
        </BText>
      )}

      {Platform.OS === 'ios' && (
        <BModal
          isVisible={isPickerVisible}
          onClose={() => setIsPickerVisible(false)}
          title={DATE_FIELD_TEXT.selectDate}
          position={ModalPosition.BOTTOM}
        >
          <BView gap={SpacingValue.MD}>
            <DateTimePicker
              value={iosDraftDate}
              mode="date"
              display="spinner"
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={(_, selectedDate) => {
                if (!selectedDate) return;
                setIosDraftDate(selectedDate);
              }}
            />

            <BView row gap={SpacingValue.SM}>
              <BButton
                style={styles.actionButton}
                variant={ButtonVariant.OUTLINE}
                onPress={() => setIsPickerVisible(false)}
                paddingY={SpacingValue.SM}
              >
                <BText variant={TextVariant.LABEL} color={themeColors.primary}>
                  {DATE_FIELD_TEXT.cancel}
                </BText>
              </BButton>
              <BButton
                style={styles.actionButton}
                variant={ButtonVariant.PRIMARY}
                onPress={confirmIOSDate}
                paddingY={SpacingValue.SM}
              >
                <BText variant={TextVariant.LABEL} color={themeColors.white}>
                  {DATE_FIELD_TEXT.done}
                </BText>
              </BButton>
            </BView>
          </BView>
        </BModal>
      )}
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs,
  },
  trigger: {
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  valueText: {
    fontSize: FontSize.base,
    flex: 1,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  errorText: {
    marginTop: Spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});

export default BDateField;
