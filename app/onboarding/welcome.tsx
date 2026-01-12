import { OnboardingStrings } from '@/constants/onboarding.strings';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { BFeatureCard } from '@/src/components/onboarding';
import { BLink, BSafeAreaView, BText, BView } from '@/src/components/ui';
import { FlatList, StyleSheet } from 'react-native';

const { welcome } = OnboardingStrings;

export default function WelcomeScreen() {
  return (
    <BSafeAreaView>
      <BView flex paddingX="xl" style={styles.content}>
        {/* Header Section */}
        <BView style={styles.header}>
          <BText variant="heading" center>
            {welcome.title}
          </BText>
          <BText variant="body" muted center style={styles.subtitle}>
            {welcome.subtitle}
          </BText>
        </BView>

        {/* Features Section */}
        <FlatList
          data={welcome.features}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BFeatureCard icon={item.icon} title={item.title} description={item.description} />}
          scrollEnabled={false}
          contentContainerStyle={styles.features}
        />
      </BView>

      {/* Footer Section */}
      <BView paddingX="xl" paddingY="xl" style={styles.footer}>
        <BLink href="/onboarding/setup" style={styles.getStartedButton}>
          <BText color="#FFFFFF" variant="label">
            {welcome.getStartedButton}
          </BText>
        </BLink>
        <BText variant="caption" muted center style={styles.setupTimeHint}>
          {welcome.setupTimeHint}
        </BText>
      </BView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  subtitle: {
    marginTop: Spacing.md,
  },
  features: {
    marginTop: Spacing.lg,
  },
  footer: {
    paddingBottom: Spacing['2xl'],
  },
  getStartedButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
  },
  setupTimeHint: {
    marginTop: Spacing.md,
  },
});
