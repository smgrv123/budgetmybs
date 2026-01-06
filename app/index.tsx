import { Spacing, SpacingValue, TextVariant } from '@/constants/theme';
import { upsertProfile } from '@/db';
import { BButton, BInput, BText, BView } from '@/src/components';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function NavigationScreen() {
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [frivolousBudget, setFrivolousBudget] = useState('');
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState('');

  const addData = useMutation({
    mutationFn: () =>
      upsertProfile({
        name,
        salary: Number(salary),
        frivolousBudget: Number(frivolousBudget),
        monthlySavingsTarget: Number(monthlySavingsTarget),
      }),
  });

  const userInputData = [
    {
      label: 'Name',
      placeholder: 'Enter your name',
      value: name,
      onChangeText: (text: string) => setName(text),
      keyboardType: 'default' as const,
    },
    {
      label: 'Salary',
      placeholder: 'Enter your salary',
      value: salary,
      onChangeText: setSalary,
      keyboardType: 'numeric' as const,
    },
    {
      label: 'Frivolous Budget',
      placeholder: 'Enter your frivolous budget',
      value: frivolousBudget,
      onChangeText: setFrivolousBudget,
      keyboardType: 'numeric' as const,
    },
    {
      label: 'Monthly Savings Target',
      placeholder: 'Enter your monthly savings target',
      value: monthlySavingsTarget,
      onChangeText: setMonthlySavingsTarget,
      keyboardType: 'numeric' as const,
    },
  ];

  return (
    <SafeAreaView>
      <BView gap={SpacingValue.MD} padding={SpacingValue.MD} style={styles.formContainer}>
        <FlatList
          data={userInputData}
          renderItem={({ item }) => (
            <BView paddingY={SpacingValue.XS} flex>
              <BInput
                {...item}
                placeholderTextColor={'#000'}
                labelVariant={TextVariant.SUBHEADING}
                containerStyle={styles.inputContainer}
              />
            </BView>
          )}
        />
      </BView>
      <BButton
        onPress={() => {
          addData.mutate();
          if (addData.isSuccess) router.push('/navigation');
          else Alert.alert('Error', 'Something went wrong');
        }}
      >
        <BText>Add Data</BText>
      </BButton>

      {/* Test Onboarding Flow */}
      <BButton
        variant="secondary"
        onPress={() => router.push('/onboarding/welcome')}
        style={{ marginTop: 16, marginHorizontal: 10 }}
      >
        <BText>🚀 Test Onboarding Flow</BText>
      </BButton>

      {/* <Pressable style={styles.resetButton} onPress={() => clearData.mutate('reset')}>
        <Text>Reset Data</Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert('Delete Account', 'Are you sure? This will permanently delete all your data.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => clearData.mutate('delete') },
          ]);
        }}
      >
        <Text style={{ color: '#fff' }}>Delete Account</Text>
      </Pressable> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    justifyContent: 'center',
  },
  inputContainer: {
    gap: Spacing.xs,
  },
});
