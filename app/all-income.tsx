import type { Income } from '@/db/schema-types';
import { IncomeLabels, IncomeTypeEnum } from '@/db/types';
import { BButton, BIcon, BLink, BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { TransactionCard } from '@/src/components/transaction';
import { ALL_INCOME_STRINGS } from '@/src/constants/income.strings';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useIncome } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { FlatList } from 'react-native';

export default function AllIncomeScreen() {
  const themeColors = useThemeColors();
  const { income, isIncomeLoading, isIncomeError, refetchIncome } = useIncome();

  const renderItem = ({ item }: { item: Income }) => {
    const typeLabel =
      item.type === IncomeTypeEnum.OTHER && item.customType ? item.customType : (IncomeLabels[item.type] ?? item.type);

    return (
      <BLink
        href={{ pathname: '/income-detail', params: { id: item.id } }}
        fullWidth
        style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}
      >
        <TransactionCard
          id={item.id}
          description={typeLabel}
          categoryName={item.description}
          amount={item.amount}
          date={item.date}
          isSaving
          categoryIcon="cash-outline"
          isSettlement={item.type === IncomeTypeEnum.SPLITWISE_SETTLEMENT}
        />
      </BLink>
    );
  };

  const renderEmpty = () => (
    <BView flex center paddingY={SpacingValue.XL}>
      <BIcon name="cash-outline" size="lg" color={themeColors.textMuted} />
      <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.sm }}>
        {ALL_INCOME_STRINGS.noIncome}
      </BText>
    </BView>
  );

  if (isIncomeError) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView paddingX={SpacingValue.LG}>
          <ScreenHeader title={ALL_INCOME_STRINGS.screenTitle} titleVariant={TextVariant.SUBHEADING} />
        </BView>
        <BView flex center gap={SpacingValue.MD} paddingX={SpacingValue.LG}>
          <BIcon name="cloud-offline-outline" size="lg" color={themeColors.error} />
          <BText variant={TextVariant.SUBHEADING} style={{ textAlign: 'center' }}>
            {ALL_INCOME_STRINGS.loadErrorTitle}
          </BText>
          <BText variant={TextVariant.BODY} muted style={{ textAlign: 'center' }}>
            {ALL_INCOME_STRINGS.loadErrorBody}
          </BText>
          <BButton
            variant={ButtonVariant.PRIMARY}
            onPress={() => refetchIncome()}
            paddingX={SpacingValue.XL}
            paddingY={SpacingValue.SM}
            gap={SpacingValue.SM}
          >
            <BIcon name="refresh-outline" size="sm" color={themeColors.white} />
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {ALL_INCOME_STRINGS.retryButton}
            </BText>
          </BButton>
        </BView>
      </BSafeAreaView>
    );
  }

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <BView paddingX={SpacingValue.LG}>
        <ScreenHeader title={ALL_INCOME_STRINGS.screenTitle} titleVariant={TextVariant.SUBHEADING} />
      </BView>

      <FlatList
        data={income}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={isIncomeLoading ? null : renderEmpty()}
        showsVerticalScrollIndicator={false}
        onRefresh={refetchIncome}
        refreshing={isIncomeLoading}
        contentContainerStyle={{ paddingTop: Spacing.sm }}
      />
    </BSafeAreaView>
  );
}
