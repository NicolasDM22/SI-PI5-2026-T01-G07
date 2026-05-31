import React, { useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAlertById, markAlertSeen } from '../../api/services/alerts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { alertSeverityLabel, formatDateTime } from '../../utils/format';

interface Props {
  navigation: any;
  route: { params: { alertId: string } };
}

const severityColor: Record<'critical' | 'warning', string> = {
  critical: colors.danger,
  warning: colors.warning,
};

const severityBg: Record<'critical' | 'warning', string> = {
  critical: colors.dangerLight,
  warning: colors.warningLight,
};

export function AlertDetailScreen({ route }: Props) {
  const { alertId } = route.params;
  const queryClient = useQueryClient();

  const { data: alert, isLoading } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => getAlertById(alertId),
  });

  useEffect(() => {
    if (alert && !alert.seen) {
      markAlertSeen(alertId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['alerts-unseen'] });
        queryClient.invalidateQueries({ queryKey: ['alert', alertId] });
      });
    }
  }, [alert?.id]);

  if (isLoading || !alert) return <LoadingSpinner message="Carregando alerta..." />;

  const color = severityColor[alert.severity];
  const bg = severityBg[alert.severity];
  const diffLabel = alert.diff > 0 ? `+${alert.diff}` : `${alert.diff}`;

  return (
    <View style={styles.root}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header colorido */}
      <View style={[styles.header, { backgroundColor: bg, borderLeftColor: color }]}>
        <View style={[styles.severityBadge, { backgroundColor: color }]}>
          <Text style={styles.severityText}>{alertSeverityLabel[alert.severity]}</Text>
        </View>
        <Text style={[styles.pastureName, { color }]}>{alert.pastureName}</Text>
        <Text style={styles.headerDate}>{formatDateTime(alert.createdAt)}</Text>
      </View>

      {/* Imagem do frame */}
      <View style={styles.imageCard}>
        {alert.imageUrl ? (
          <Image
            source={{ uri: alert.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
            <Text style={styles.imagePlaceholderText}>Imagem não disponível</Text>
          </View>
        )}
      </View>

      {/* Card de contagem */}
      <View style={styles.countsCard}>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{alert.detectedCount}</Text>
          <Text style={styles.countLabel}>Detectados</Text>
        </View>
        <View style={styles.countDivider} />
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{alert.expectedCount}</Text>
          <Text style={styles.countLabel}>Esperados</Text>
        </View>
        <View style={styles.countDivider} />
        <View style={styles.countItem}>
          <Text style={[styles.countNumber, styles.diffNumber, { color }]}>{diffLabel}</Text>
          <Text style={styles.countLabel}>Diferença</Text>
        </View>
      </View>

      {/* Descrição */}
      <View style={styles.descriptionCard}>
        <Text style={styles.sectionLabel}>Descrição do alerta</Text>
        <Text style={styles.description}>{alert.description}</Text>
      </View>

    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.sm, paddingBottom: spacing.xxl },
  header: {
    padding: spacing.lg,
    borderLeftWidth: 5,
    gap: spacing.xs,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  severityText: { fontSize: 11, fontWeight: '700' as const, color: colors.textInverse },
  pastureName: { ...typography.h3 },
  headerDate: { ...typography.caption, color: colors.textSecondary },
  imageCard: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    ...shadows.md,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    height: 160,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  imagePlaceholderIcon: { fontSize: 36 },
  imagePlaceholderText: { ...typography.caption, color: colors.textDisabled },
  countsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  countItem: { flex: 1, alignItems: 'center', gap: 4 },
  countDivider: { width: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  countNumber: { ...typography.h2, color: colors.textPrimary },
  diffNumber: { fontWeight: '700' as const },
  countLabel: { ...typography.small, color: colors.textSecondary },
  descriptionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
});
