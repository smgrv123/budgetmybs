import type { UpdateIncomeInput } from '@/db/schema-types';
import { IncomeLabels, IncomeTypeEnum, USER_INCOME_TYPES } from '@/db/types';
import { BButton, BCard, BIcon, BInput, BSafeAreaView, BText, BToast, BView, ScreenHeader } from '@/src/components/ui';
import { DetailsCard } from '@/src/components';
import type { ToastVariantType } from '@/src/constants/theme';
import { ButtonVariant, CardVariant, Spacing, SpacingValue, TextVariant, ToastVariant } from '@/src/constants/theme';
import { INCOME_DETAIL_STRINGS } from '@/src/constants/income.strings';
import { useIncome, useIncomeById } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency, formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

const editIncomeSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .min(1, INCOME_DETAIL_STRINGS.validation.amountRequired)
      .refine((v) => {
        const num = parseFloat(v.replace(/,/g, ''));
        return !isNaN(num) && num > 0;
      }, INCOME_DETAIL_STRINGS.validation.amountPositive),
    type: z
      .string()
      .min(1, INCOME_DETAIL_STRINGS.validation.typeRequired)
      .refine((v) => USER_INCOME_TYPES.includes(v as (typeof USER_INCOME_TYPES)[number]), {
        message: INCOME_DETAIL_STRINGS.validation.typeRequired,
      }),
    customType: z.string().optional(),
    date: z.iso.date(INCOME_DETAIL_STRINGS.validation.dateValidISO),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === IncomeTypeEnum.OTHER) {
        return data.customType && data.customType.trim().length > 0;
      }
      return true;
    },
    { message: INCOME_DETAIL_STRINGS.validation.customTypeRequired, path: ['customType'] }
  );

const typeOptions = USER_INCOME_TYPES.map((t) => ({ label: IncomeLabels[t], value: t }));

export default function IncomeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeColors = useThemeColors();
  const { updateIncome, isUpdatingIncome, removeIncome } = useIncome();
  const { income, isIncomeLoading } = useIncomeById(id);

  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('');
  const [editCustomType, setEditCustomType] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariantType>(ToastVariant.WARNING);

  const showToast = (msg: string, v: ToastVariantType = ToastVariant.WARNING) => {
    setToastMessage(msg);
    setToastVariant(v);
    setToastVisible(true);
  };

  const enterEditMode = () => {
    if (!income) return;
    setEditAmount(formatIndianNumber(income.amount));
    setEditType(income.type);
    setEditCustomType(income.customType ?? '');
    setEditDescription(income.description ?? '');
    setEditDate(income.date);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!income || !id) return;

    const result = editIncomeSchema.safeParse({
      amount: editAmount,
      type: editType,
      customType: editCustomType.trim() || undefined,
      date: editDate,
      description: editDescription.trim() || undefined,
    });

    if (!result.success) {
      showToast(result.error.issues[0].message);
      return;
    }

    const updateData: UpdateIncomeInput = {
      amount: parseFloat(result.data.amount.replace(/,/g, '')),
      type: result.data.type as (typeof USER_INCOME_TYPES)[number],
      customType: result.data.customType ?? null,
      description: result.data.description ?? null,
      date: result.data.date,
    };

    updateIncome(
      { id, data: updateData },
      {
        onSuccess: () => {
          setIsEditing(false);
          showToast(INCOME_DETAIL_STRINGS.changesSavedToast, ToastVariant.SUCCESS);
        },
        onError: () => showToast(INCOME_DETAIL_STRINGS.saveChangesFailedToast, ToastVariant.ERROR),
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(INCOME_DETAIL_STRINGS.deleteAlertTitle, INCOME_DETAIL_STRINGS.deleteAlertBody, [
      { text: INCOME_DETAIL_STRINGS.deleteAlertCancel, style: 'cancel' },
      {
        text: INCOME_DETAIL_STRINGS.deleteAlertConfirm,
        style: 'destructive',
        onPress: () =>
          removeIncome(id!, {
            onSuccess: () => router.back(),
            onError: () => showToast(INCOME_DETAIL_STRINGS.deleteFailedToast, ToastVariant.ERROR),
          }),
      },
    ]);
  };

  if (isIncomeLoading) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView flex center>
          <BIcon name="sync" size="lg" color={themeColors.primary} />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            {INCOME_DETAIL_STRINGS.loadingLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  if (!income) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <ScreenHeader title={INCOME_DETAIL_STRINGS.screenTitle} />
        <BView flex center>
          <BIcon name="alert-circle-outline" size="lg" color={themeColors.error} />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            {INCOME_DETAIL_STRINGS.notFoundLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  const typeLabel =
    income.type === IncomeTypeEnum.OTHER && income.customType
      ? income.customType
      : (IncomeLabels[income.type] ?? income.type);

  const headerActions = !isEditing
    ? [
        { icon: 'create-outline', onPress: enterEditMode, color: themeColors.primary },
        { icon: 'trash-outline', onPress: handleDelete, color: themeColors.error },
      ]
    : undefined;

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <BView paddingX={SpacingValue.LG}>
        <ScreenHeader
          title={INCOME_DETAIL_STRINGS.screenTitle}
          titleVariant={TextVariant.SUBHEADING}
          actions={headerActions}
        />
      </BView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <BCard variant={CardVariant.ELEVATED} style={styles.card}>
          <BText variant={TextVariant.CAPTION} muted>
            {INCOME_DETAIL_STRINGS.amountLabel}
          </BText>
          {isEditing ? (
            <BInput
              value={editAmount}
              onChangeText={(text) => setEditAmount(formatIndianNumber(parseFormattedNumber(text)))}
              keyboardType="decimal-pad"
              placeholder={INCOME_DETAIL_STRINGS.amountPlaceholder}
              leftIcon={
                <BText variant={TextVariant.LABEL} muted>
                  {INCOME_DETAIL_STRINGS.currencySymbol}
                </BText>
              }
              containerStyle={{ marginTop: Spacing.xs }}
            />
          ) : (
            <BText variant={TextVariant.HEADING} style={{ color: themeColors.success }}>
              +{formatCurrency(income.amount)}
            </BText>
          )}
        </BCard>

        <DetailsCard
          isEditing={isEditing}
          categoryLabel={INCOME_DETAIL_STRINGS.typeLabel}
          categoryViewLabel={typeLabel}
          categoryOptions={typeOptions}
          categoryValue={editType}
          onCategoryChange={(v) => {
            setEditType(v);
            if (v !== IncomeTypeEnum.OTHER) setEditCustomType('');
          }}
          categoryModalTitle={INCOME_DETAIL_STRINGS.typeModalTitle}
          showSubCategory={isEditing && editType === IncomeTypeEnum.OTHER}
          subCategoryValue={editCustomType}
          onSubCategoryChange={setEditCustomType}
          subCategoryLabel={INCOME_DETAIL_STRINGS.customTypeLabel}
          subCategoryPlaceholder={INCOME_DETAIL_STRINGS.customTypePlaceholder}
          viewDate={income.date}
          editDate={editDate}
          onDateChange={setEditDate}
          dateLabel={INCOME_DETAIL_STRINGS.dateLabel}
          dateError={!editDate ? INCOME_DETAIL_STRINGS.validation.dateRequired : undefined}
          viewDescription={income.description}
          editDescription={editDescription}
          onDescriptionChange={setEditDescription}
          descriptionLabel={INCOME_DETAIL_STRINGS.descriptionLabel}
          descriptionPlaceholder={INCOME_DETAIL_STRINGS.descriptionPlaceholder}
          noDescriptionFallback={INCOME_DETAIL_STRINGS.noDescriptionFallback}
        />

        {isEditing && (
          <BView gap={SpacingValue.SM}>
            <BButton
              variant={ButtonVariant.PRIMARY}
              onPress={handleSave}
              loading={isUpdatingIncome}
              style={styles.fullWidthButton}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {INCOME_DETAIL_STRINGS.saveChangesButton}
              </BText>
            </BButton>
            <BButton
              variant={ButtonVariant.OUTLINE}
              onPress={() => setIsEditing(false)}
              style={styles.fullWidthButton}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.primary}>
                {INCOME_DETAIL_STRINGS.cancelButton}
              </BText>
            </BButton>
          </BView>
        )}
      </ScrollView>

      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  fullWidthButton: {
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
