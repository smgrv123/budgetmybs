import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { PropsWithChildren } from 'react';
import { DevSettings, Text, TouchableOpacity, View } from 'react-native';
import migrations from '../drizzle/migrations';
import { db, deleteDatabase } from './client';

/**
 * Database Provider Component
 * Runs migrations on app startup and shows loading/error states
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations);

  const handleReset = async () => {
    try {
      await deleteDatabase();
      // Reload the app to recreate the database
      DevSettings.reload();
    } catch (e) {
      console.error('Failed to reset database:', e);
    }
  };

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          padding: 20,
        }}
      >
        <Text style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Migration Error</Text>
        <Text style={{ color: '#ffffff', fontSize: 14, textAlign: 'center', marginBottom: 30 }}>{error.message}</Text>

        <TouchableOpacity
          onPress={handleReset}
          style={{
            backgroundColor: '#ff6b6b',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Reset Database & Restart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!success) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 16 }}>Initializing database...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
