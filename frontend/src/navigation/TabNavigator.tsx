import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FlightsScreen } from '../screens/flights/FlightsScreen';
import { UploadScreen } from '../screens/upload/UploadScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AlertsScreen } from '../screens/alerts/AlertsScreen';
import { useUploadQueueStore } from '../store/uploadQueueStore';
import { getUnseenCount } from '../api/services/alerts';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, string> = {
  Home: '🏠',
  Flights: '🚁',
  Upload: '📤',
  Alerts: '🔔',
  Settings: '⚙️',
};

export function TabNavigator() {
  const pendingCount = useUploadQueueStore((s) => s.pendingCount());

  const { data: unseenAlerts = 0 } = useQuery({
    queryKey: ['alerts-unseen'],
    queryFn: getUnseenCount,
    refetchInterval: 30000,
  });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
            {tabIcons[route.name]}
          </Text>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { ...typography.small, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { ...typography.bodyBold, color: colors.textPrimary },
        headerTintColor: colors.primary,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início', headerTitle: 'AgriMonitor 🐄' }} />
      <Tab.Screen name="Flights" component={FlightsScreen} options={{ title: 'Voos', headerTitle: 'Histórico de Voos' }} />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          title: 'Enviar',
          headerTitle: 'Enviar Vídeo',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Alertas',
          headerTitle: 'Alertas',
          tabBarBadge: unseenAlerts > 0 ? unseenAlerts : undefined,
        }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Perfil', headerTitle: 'Configurações' }} />
    </Tab.Navigator>
  );
}
