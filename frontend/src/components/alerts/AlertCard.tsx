import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert } from '../../types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { alertSeverityLabel, formatRelativeTime } from '../../utils/format';

interface Props {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

const severityBorder: Record<'critical' | 'warning', string> = {
  critical: colors.danger,
  warning: colors.warning,
};

const severityBg: Record<'critical' | 'warning', string> = {
  critical: colors.dangerLight,
  warning: colors.warningLight,
};

const severityText: Record<'critical' | 'warning', string> = {
  critical: colors.danger,
  warning: '#B45309',
};

export function AlertCard({ alert, onPress }: Props) {
  const borderColor = severityBorder[alert.severity];
  const diffLabel = alert.diff > 0 ? `+${alert.diff}` : `${alert.diff}`;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: borderColor }, !alert.seen && styles.unseen]}
      onPress={() => onPress(alert)}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: severityBg[alert.severity] }]}>
            <Text style={[styles.badgeText, { color: severityText[alert.severity] }]}>
              {alertSeverityLabel[alert.severity]}
            </Text>
          </View>
          <Text style={styles.time}>{formatRelativeTime(alert.createdAt)}</Text>
          {!alert.seen && <View style={styles.unseenDot} />}
        </View>

        <Text style={styles.pasture}>{alert.pastureName}</Text>
        <Text style={styles.description} numberOfLines={2}>{alert.description}</Text>

        <View style={styles.countsRow}>
          <Text style={styles.countItem}>🐄 {alert.detectedCount} detectados</Text>
          <Text style={styles.countItem}>🎯 {alert.expectedCount} esperados</Text>
          <Text style={[styles.diffText, { color: borderColor }]}>
            {diffLabel} animais
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
    ...shadows.sm,
    overflow: 'hidden',
  },
  unseen: {
    backgroundColor: '#FAFFFE',
  },
  content: {
    padding: spacing.sm,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  time: {
    ...typography.small,
    color: colors.textDisabled,
    flex: 1,
    textAlign: 'right',
  },
  unseenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pasture: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  countsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  countItem: {
    ...typography.small,
    color: colors.textSecondary,
  },
  diffText: {
    ...typography.captionBold,
    marginLeft: 'auto',
  },
});
