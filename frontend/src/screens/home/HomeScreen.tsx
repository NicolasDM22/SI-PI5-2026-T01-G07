import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getFlights } from '../../api/services/flights';
import { getMyFarm } from '../../api/services/farms';
import { getAlerts } from '../../api/services/alerts';
import { AlertCard } from '../../components/alerts/AlertCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatRelativeTime } from '../../utils/format';
import { Alert as AlertType } from '../../types';

interface Props {
  navigation: any;
}

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);

  const { data: farm } = useQuery({ queryKey: ['farm'], queryFn: getMyFarm });
  const { data: flights, refetch, isLoading } = useQuery({
    queryKey: ['flights'],
    queryFn: () => getFlights(farm?.id),
    enabled: !!farm,
  });

  const lastFlight = flights?.[0];

  const { data: allAlerts = [] } = useQuery({ queryKey: ['alerts'], queryFn: getAlerts });
  const recentUnseen = allAlerts.filter((a) => !a.seen).slice(0, 3);

  if (isLoading) return <LoadingSpinner message="Carregando painel..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Saudação */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.farmName}>{farm?.name}</Text>
        </View>
        <View style={styles.animalCount}>
          <Text style={styles.animalCountNumber}>{farm?.totalAnimals}</Text>
          <Text style={styles.animalCountLabel}>animais</Text>
        </View>
      </View>

      {/* Botão de voo ao vivo */}
      <TouchableOpacity
        style={styles.liveButton}
        onPress={() => navigation.navigate('LiveFlight')}
        activeOpacity={0.85}
      >
        <Text style={styles.liveButtonIcon}>🚁</Text>
        <View style={styles.liveButtonText}>
          <Text style={styles.liveButtonTitle}>Iniciar Voo Ao Vivo</Text>
          <Text style={styles.liveButtonSub}>Simulação com câmera do dispositivo</Text>
        </View>
        <Text style={styles.liveButtonArrow}>›</Text>
      </TouchableOpacity>

      {/* Resumo de status */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{flights?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Voos totais</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{(flights ?? []).filter((f) => f.source === 'live').length}</Text>
          <Text style={styles.statLabel}>Ao vivo</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{(flights ?? []).filter((f) => f.source === 'upload').length}</Text>
          <Text style={styles.statLabel}>Upload</Text>
        </View>
      </View>

      {/* Último voo */}
      {lastFlight && (
        <TouchableOpacity
          style={styles.lastFlightCard}
          onPress={() => navigation.navigate('FlightDetail', { flightId: lastFlight.id })}
          activeOpacity={0.85}
        >
          <View style={styles.lastFlightHeader}>
            <Text style={styles.sectionTitle}>Último voo</Text>
            <Text style={styles.lastFlightTime}>{formatRelativeTime(lastFlight.endTs)}</Text>
          </View>
          <Text style={styles.lastFlightPasture}>{lastFlight.pastureName}</Text>
          <View style={styles.lastFlightStats}>
            <Text style={styles.lastFlightStat}>
              🐄 {lastFlight.detectedCount} detectados
            </Text>
            <Text style={styles.lastFlightStat}>
              {lastFlight.source === 'live' ? '📡 Fonte: voo ao vivo' : '📤 Fonte: upload'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Alertas recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Alertas recentes {recentUnseen.length > 0 && `(${recentUnseen.length} não vistos)`}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {recentUnseen.length === 0 ? (
          <View style={styles.allGoodCard}>
            <Text style={styles.allGoodEmoji}>✅</Text>
            <Text style={styles.allGoodText}>Nenhum alerta pendente</Text>
            <Text style={styles.allGoodSub}>Tudo em ordem no rebanho.</Text>
          </View>
        ) : (
          recentUnseen.map((alert: AlertType) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onPress={(a) => navigation.navigate('AlertDetail', { alertId: a.id })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  greeting: { ...typography.h2, color: colors.textPrimary },
  farmName: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  animalCount: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  animalCountNumber: { ...typography.h2, color: colors.primary },
  animalCountLabel: { ...typography.small, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  statNumber: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.small, color: colors.textSecondary },
  lastFlightCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.md,
  },
  lastFlightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastFlightTime: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  lastFlightPasture: { ...typography.h3, color: colors.textInverse },
  lastFlightStats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  lastFlightStat: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  liveButton: {
    backgroundColor: '#1b2e1f',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#2d4a32',
    ...shadows.md,
  },
  liveButtonIcon: { fontSize: 28 },
  liveButtonText: { flex: 1, gap: 2 },
  liveButtonTitle: { ...typography.bodyBold, color: '#52b788' },
  liveButtonSub: { ...typography.caption, color: '#5a6b5d' },
  liveButtonArrow: { fontSize: 22, color: '#52b788' },
  section: { gap: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary },
  sectionLink: { ...typography.captionBold, color: colors.primary },
  allGoodCard: {
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  allGoodEmoji: { fontSize: 32 },
  allGoodText: { ...typography.bodyBold, color: colors.primary },
  allGoodSub: { ...typography.caption, color: colors.textSecondary },
});
