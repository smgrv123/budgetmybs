import { getProfile } from "@/db";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  console.log(data);
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  return (
    <SafeAreaView>
      <Text>{data?.name}</Text>
    </SafeAreaView>
  );
}
