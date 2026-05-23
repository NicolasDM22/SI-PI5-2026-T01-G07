import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Flight } from '../../types';
import { Badge } from '../common/Badge';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDateTime, formatDuration } from '../../utils/format';

interface Props {
  flight: Flight;
  onPress: (flight: Flight) => void;
}

export function FlightCard({ flight, onPress }: Props) {
  const hasCount = flight.detectedCount != null;
  const countDiff = hasCount ? flight.detectedCount! - (flight.expectedCount ?? 0) : null;
  const countColor = countDiff == null
    ? colors.textDisabled
    : countDiff < -5 ? colors.danger
    : countDiff < 0 ? colors.warning
    : colors.success;

  const displayName = flight.name ?? flight.pastureName ?? 'Voo sem nome';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(flight)} activeOpacity={0.85}>
      <View style={styles.topRow}>
        {/* Thumbnail */}
        {flight.thumbnailUrl ? (
          <Image source={{ uri: flight.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.thumbIcon}>🚁</Text>
          </View>
        )}

        {/* Info principal */}
        <View style={styles.info}>
          <View style={styles.infoHeader}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Badge
              label={flight.alertsCount > 0 ? `${flight.alertsCount} alerta${flight.alertsCount > 1 ? 's' : ''}` : 'OK'}
              variant={flight.alertsCount > 0 ? 'warning' : 'resolved'}
            />
          </View>
          {flight.name && flight.pastureName && (
            <Text style={styles.pasture} numberOfLines={1}>{flight.pastureName}</Text>
          )}
          <Text style={styles.date}>{formatDateTime(flight.startTs)}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Detectados</Text>
          <Text style={[styles.statValue, { color: countColor }]}>
            {hasCount ? flight.detectedCount : '—'}
            <Text style={styles.expected}>/{flight.expectedCount ?? '?'}</Text>
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duração</Text>
          <Text style={styles.statValue}>{formatDuration(flight.startTs, flight.endTs)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Frames</Text>
          <Text style={styles.statValue}>{flight.frameCount ?? '—'}</Text>
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
  topRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  thumb: {
    width: 88,
    height: 66,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  thumbIcon: { fontSize: 24 },
  info: { flex: 1, gap: 3 },
  infoHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  name: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  pasture: { ...typography.caption, color: colors.primary },
  date: { ...typography.caption, color: colors.textSecondary },
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
