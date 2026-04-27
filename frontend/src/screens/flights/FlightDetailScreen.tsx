import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFlightById } from '../../api/services/flights';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDateTime, formatDuration } from '../../utils/format';

interface Props {
  navigation: any;
  route: { params: { flightId: string } };
}

export function FlightDetailScreen({ navigation, route }: Props) {
  const { flightId } = route.params;

  const { data: flight, isLoading } = useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => getFlightById(flightId),
  });

  if (isLoading || !flight) return <LoadingSpinner message="Carregando voo..." />;

  const countDiff = flight.detectedCount - flight.expectedCount;
  const countColor = countDiff < -5 ? colors.danger : countDiff < 0 ? colors.warning : colors.success;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header do voo */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.pastureName}>{flight.pastureName}</Text>
            <Text style={styles.flightDate}>{formatDateTime(flight.startTs)}</Text>
          </View>
          <Badge
            label={flight.alertsCount > 0 ? `${flight.alertsCount} alertas` : 'Sem alertas'}
            variant={flight.alertsCount > 0 ? 'warning' : 'resolved'}
          />
        </View>

        {flight.notes && <Text style={styles.notes}>{flight.notes}</Text>}
      </View>

      {/* Estatísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: countColor }]}>
            {flight.detectedCount}
            <Text style={styles.statExpected}>/{flight.expectedCount}</Text>
          </Text>
          <Text style={styles.statLabel}>Animais detectados</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(flight.startTs, flight.endTs)}</Text>
          <Text style={styles.statLabel}>Duração do voo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{flight.altitudeEstimated}m</Text>
          <Text style={styles.statLabel}>Altitude estimada</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: flight.alertsCount > 0 ? colors.warning : colors.success }]}>
            {flight.alertsCount}
          </Text>
          <Text style={styles.statLabel}>Alertas gerados</Text>
        </View>
      </View>

      {/* Contagem com contexto */}
      {countDiff < 0 && (
        <View style={[styles.warningBanner, countDiff < -5 && styles.dangerBanner]}>
          <Text style={[styles.warningText, countDiff < -5 && styles.dangerText]}>
            {countDiff < -5
              ? `⚠️ ${Math.abs(countDiff)} animais abaixo do esperado`
              : `ℹ️ ${Math.abs(countDiff)} animal(is) não detectado(s)`
            }
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integração com IA</Text>
        <Text style={styles.integrationText}>
          Este voo está registrado e pronto para envio automático de imagens quando a API de IA estiver disponível.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pastureName: { ...typography.h3, color: colors.textPrimary },
  flightDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  notes: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm,
  },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statExpected: { ...typography.caption, color: colors.textDisabled },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  warningBanner: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  dangerBanner: {
    backgroundColor: colors.dangerLight,
    borderLeftColor: colors.danger,
  },
  warningText: { ...typography.bodyBold, color: '#B45309' },
  dangerText: { color: colors.danger },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary },
  integrationText: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
});
