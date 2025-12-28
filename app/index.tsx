import { upsertProfile } from '@/db';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NavigationScreen() {
  const addData = useMutation({
    mutationFn: () =>
      upsertProfile({
        name: 'Sumrit Grover',
        salary: 100000,
        frivolousBudget: 10000,
        monthlySavingsTarget: 10000,
      }),
  });
  return (
    <SafeAreaView>
      <Text>hello</Text>
      <Pressable onPress={() => addData.mutate()}>
        <Text>Add Data</Text>
      </Pressable>
      <Link href="/navigation">
        <Text>{addData.data?.name}</Text>
      </Link>
    </SafeAreaView>
  );
}
