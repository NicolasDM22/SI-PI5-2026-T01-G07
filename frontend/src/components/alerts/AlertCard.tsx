import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert } from '../../types';
import { Badge } from '../common/Badge';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { alertSeverityLabel, alertStatusLabel, alertTypeLabel, formatRelativeTime } from '../../utils/format';

interface Props {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

const severityBorder: Record<Alert['severity'], string> = {
  critical: colors.danger,
  warning: colors.warning,
  info: colors.info,
};

export function AlertCard({ alert, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: severityBorder[alert.severity] }]}
      onPress={() => onPress(alert)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: alert.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Badge label={alertSeverityLabel[alert.severity]} variant={alert.severity} size="sm" />
          <Text style={styles.time}>{formatRelativeTime(alert.detectedAt)}</Text>
        </View>
        <Text style={styles.type}>{alertTypeLabel[alert.type]}</Text>
        <Text style={styles.pasture}>{alert.pastureName}</Text>
        <Text style={styles.description} numberOfLines={2}>{alert.description}</Text>
        <Badge label={alertStatusLabel[alert.status]} variant={alert.status} size="sm" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  thumbnail: {
    width: 90,
    height: '100%',
    minHeight: 110,
  },
  content: {
    flex: 1,
    padding: spacing.sm,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    ...typography.small,
    color: colors.textDisabled,
  },
  type: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  pasture: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
