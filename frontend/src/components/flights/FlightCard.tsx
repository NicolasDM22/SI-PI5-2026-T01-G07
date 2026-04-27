import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flight } from '../../types';
import { Badge } from '../common/Badge';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDateTime, formatDuration } from '../../utils/format';

interface Props {
  flight: Flight;
  onPress: (flight: Flight) => void;
}

export function FlightCard({ flight, onPress }: Props) {
  const countDiff = flight.detectedCount - flight.expectedCount;
  const countColor =
    countDiff < -5 ? colors.danger : countDiff < 0 ? colors.warning : colors.success;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(flight)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.pasture}>{flight.pastureName}</Text>
          <Text style={styles.date}>{formatDateTime(flight.startTs)}</Text>
        </View>
        <Badge
          label={flight.alertsCount > 0 ? `${flight.alertsCount} alerta${flight.alertsCount > 1 ? 's' : ''}` : 'Sem alertas'}
          variant={flight.alertsCount > 0 ? 'warning' : 'resolved'}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Detectados</Text>
          <Text style={[styles.statValue, { color: countColor }]}>
            {flight.detectedCount}
            <Text style={styles.expected}>/{flight.expectedCount}</Text>
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duração</Text>
          <Text style={styles.statValue}>{formatDuration(flight.startTs, flight.endTs)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Altitude</Text>
          <Text style={styles.statValue}>{flight.altitudeEstimated}m</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pasture: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statLabel: { ...typography.small, color: colors.textSecondary },
  statValue: { ...typography.bodyBold, color: colors.textPrimary },
  expected: { ...typography.caption, color: colors.textDisabled },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
});
