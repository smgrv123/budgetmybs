import { BSafeAreaView, BText, BView } from '@/src/components';
import { SpacingValue, TextVariant } from '@/src/constants/theme';

/**
 * Placeholder screen — will be implemented in Phase 12.
 */
export default function AllIncomeScreen() {
  return (
    <BSafeAreaView edges={['top']}>
      <BView flex center paddingX={SpacingValue.LG}>
        <BText variant={TextVariant.SUBHEADING}>All Income</BText>
        <BText variant={TextVariant.CAPTION} muted>
          Coming soon
        </BText>
      </BView>
    </BSafeAreaView>
  );
}
