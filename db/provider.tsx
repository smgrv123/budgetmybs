import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import migrations from "../drizzle/migrations";
import { db } from "./client";

/**
 * Database Provider Component
 * Runs migrations on app startup and shows loading/error states
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
          Migration error: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 16 }}>
          Initializing database...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
