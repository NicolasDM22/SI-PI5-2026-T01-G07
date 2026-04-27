import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { colors, typography } from '../theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { FlightDetailScreen } from '../screens/flights/FlightDetailScreen';
import { LiveFlightScreen } from '../screens/live/LiveFlightScreen';
import { LiveFlightImagesScreen } from '../screens/live/LiveFlightImagesScreen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyScreen = React.ComponentType<any>;

const Stack = createStackNavigator();

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { ...typography.bodyBold, color: colors.textPrimary },
          headerBackTitle: 'Voltar',
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen
              name="FlightDetail"
              component={FlightDetailScreen as AnyScreen}
              options={{ title: 'Detalhe do Voo' }}
            />
            <Stack.Screen
              name="LiveFlight"
              component={LiveFlightScreen as AnyScreen}
              options={{
                title: 'Voo Ao Vivo 🚁',
                headerStyle: { backgroundColor: '#0f1a12' },
                headerTintColor: '#52b788',
                headerTitleStyle: { color: '#e8f5e9' },
              }}
            />
            <Stack.Screen
              name="LiveFlightImages"
              component={LiveFlightImagesScreen as AnyScreen}
              options={{
                title: 'Imagens do Voo',
                headerStyle: { backgroundColor: '#0f1a12' },
                headerTintColor: '#52b788',
                headerTitleStyle: { color: '#e8f5e9' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
