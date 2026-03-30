import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { BCard, BDateField, BDropdown, BIcon, BInput, BText, BView } from '@/src/components/ui';
import { CardVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatDate } from '@/src/utils/date';
import DetailRow from './DetailRow';

export const Divider: FC = () => {
  const themeColors = useThemeColors();
  return <BView style={[styles.divider, { backgroundColor: themeColors.border }]} />;
};

interface DetailsCardProps {
  isEditing: boolean;

  // Category row
  categoryLabel: string;
  categoryViewLabel: string;
  categoryOptions: { label: string; value: string }[];
  categoryValue: string;
  onCategoryChange: (v: string) => void;
  categoryModalTitle?: string;
  categoryIcon?: string;
  categoryIconColor?: string;
  /** Hide the entire category row (and sub-category) — used when editing a bill payment */
  hideCategoryRow?: boolean;

  // Sub-category row (shown when showSubCategory is true)
  showSubCategory?: boolean;
  subCategoryValue?: string;
  onSubCategoryChange?: (v: string) => void;
  subCategoryLabel?: string;
  subCategoryPlaceholder?: string;

  // Date row
  viewDate: string;
  editDate: string;
  onDateChange: (v: string) => void;
  dateLabel: string;
  datePlaceholder?: string;
  dateError?: string;

  // Description row
  viewDescription: string | null;
  editDescription: string;
  onDescriptionChange: (v: string) => void;
  descriptionLabel: string;
  descriptionPlaceholder?: string;
  noDescriptionFallback: string;

  /** Extra content rendered below the description row — include a leading <Divider /> if present */
  bottomSection?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const DetailsCard: FC<DetailsCardProps> = ({
  isEditing,
  categoryLabel,
  categoryViewLabel,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  categoryModalTitle,
  categoryIcon,
  categoryIconColor,
  hideCategoryRow,
  showSubCategory,
  subCategoryValue,
  onSubCategoryChange,
  subCategoryLabel,
  subCategoryPlaceholder,
  viewDate,
  editDate,
  onDateChange,
  dateLabel,
  datePlaceholder = 'YYYY-MM-DD',
  dateError,
  viewDescription,
  editDescription,
  onDescriptionChange,
  descriptionLabel,
  descriptionPlaceholder,
  noDescriptionFallback,
  bottomSection,
  style,
}) => {
  const themeColors = useThemeColors();

  return (
    <BCard variant={CardVariant.ELEVATED} style={[{ padding: Spacing.lg }, style]}>
      <BView gap={SpacingValue.MD}>
        {!hideCategoryRow && (
          <>
            <DetailRow icon="pricetag-outline" label={categoryLabel}>
              {isEditing ? (
                <BView style={{ marginTop: Spacing.xs }}>
                  <BDropdown
                    options={categoryOptions}
                    value={categoryValue}
                    onValueChange={(v) => onCategoryChange(String(v))}
                    searchable
                    modalTitle={categoryModalTitle}
                  />
                </BView>
              ) : (
                <BView row align="center" gap={SpacingValue.XS} style={{ marginTop: Spacing.xs }}>
                  {categoryIcon && (
                    <BIcon name={categoryIcon as any} size="sm" color={categoryIconColor ?? themeColors.textMuted} />
                  )}
                  <BText variant={TextVariant.LABEL}>{categoryViewLabel}</BText>
                </BView>
              )}
            </DetailRow>

            {showSubCategory && (
              <>
                <Divider />
                <DetailRow icon="create-outline" label={subCategoryLabel ?? ''}>
                  <BInput
                    value={subCategoryValue ?? ''}
                    onChangeText={onSubCategoryChange}
                    placeholder={subCategoryPlaceholder}
                    containerStyle={{ marginTop: Spacing.xs }}
                  />
                </DetailRow>
              </>
            )}

            <Divider />
          </>
        )}

        <DetailRow icon="calendar-outline" label={dateLabel}>
          {isEditing ? (
            <BView style={{ marginTop: Spacing.xs }}>
              <BDateField value={editDate} onChange={onDateChange} placeholder={datePlaceholder} error={dateError} />
            </BView>
          ) : (
            <BText variant={TextVariant.LABEL} style={{ marginTop: Spacing.xs }}>
              {formatDate(viewDate)}
            </BText>
          )}
        </DetailRow>

        <Divider />

        <DetailRow icon="document-text-outline" label={descriptionLabel}>
          {isEditing ? (
            <BInput
              value={editDescription}
              onChangeText={onDescriptionChange}
              placeholder={descriptionPlaceholder}
              multiline
              numberOfLines={2}
              containerStyle={{ marginTop: Spacing.xs }}
            />
          ) : (
            <BText variant={TextVariant.BODY} style={{ marginTop: Spacing.xs }}>
              {viewDescription || noDescriptionFallback}
            </BText>
          )}
        </DetailRow>

        {bottomSection}
      </BView>
    </BCard>
  );
};

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});

export default DetailsCard;
