import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertById, updateAlertStatus } from '../../api/services/alerts';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { AlertStatus } from '../../types';
import {
  alertSeverityLabel, alertStatusLabel, alertTypeLabel, formatDateTime,
} from '../../utils/format';

interface Props {
  navigation: any;
  route: { params: { alertId: string } };
}

export function AlertDetailScreen({ navigation, route }: Props) {
  const { alertId } = route.params;
  const queryClient = useQueryClient();
  const [notesModal, setNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [pendingStatus, setPendingStatus] = useState<AlertStatus | null>(null);

  const { data: alert, isLoading } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => getAlertById(alertId),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ status, notes }: { status: AlertStatus; notes?: string }) =>
      updateAlertStatus(alertId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert', alertId] });
      setNotesModal(false);
      setNotesText('');
    },
    onError: () => Alert.alert('Erro', 'Não foi possível atualizar o alerta.'),
  });

  function handleAction(status: AlertStatus) {
    setPendingStatus(status);
    setNotesModal(true);
  }

  function confirmAction() {
    if (!pendingStatus) return;
    updateStatus({ status: pendingStatus, notes: notesText.trim() || undefined });
  }

  if (isLoading || !alert) return <LoadingSpinner message="Carregando alerta..." />;

  const isResolved = alert.status === 'resolved' || alert.status === 'false_positive';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Imagem principal */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: alert.imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.imageBadges}>
          <Badge label={alertSeverityLabel[alert.severity]} variant={alert.severity} />
          <Badge label={alertStatusLabel[alert.status]} variant={alert.status} />
        </View>
      </View>

      {/* Informações */}
      <View style={styles.card}>
        <Text style={styles.alertType}>{alertTypeLabel[alert.type]}</Text>
        <Text style={styles.pasture}>{alert.pastureName}</Text>
        <Text style={styles.date}>{formatDateTime(alert.detectedAt)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Descrição da anomalia</Text>
        <Text style={styles.description}>{alert.description}</Text>
      </View>

      {alert.notes && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Anotações</Text>
          <Text style={styles.notes}>{alert.notes}</Text>
        </View>
      )}

      {/* Ações */}
      {!isResolved && (
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>O que deseja fazer?</Text>

          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => handleAction('investigating')}
            disabled={isPending || alert.status === 'investigating'}
            activeOpacity={0.85}
          >
            <Text style={styles.actionPrimaryText}>
              {alert.status === 'investigating' ? '✓ Equipe já acionada' : '📲 Acionar equipe de campo'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionSecondary}
              onPress={() => handleAction('resolved')}
              disabled={isPending}
            >
              <Text style={styles.actionSecondaryText}>✅ Marcar resolvido</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSecondary, styles.actionNeutral]}
              onPress={() => handleAction('false_positive')}
              disabled={isPending}
            >
              <Text style={styles.actionSecondaryText}>👎 Falso positivo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isResolved && (
        <View style={styles.resolvedBanner}>
          <Text style={styles.resolvedText}>
            {alert.status === 'resolved' ? '✅ Alerta resolvido' : '👎 Marcado como falso positivo'}
          </Text>
        </View>
      )}

      {/* Modal de anotação */}
      <Modal visible={notesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar anotação</Text>
            <Text style={styles.modalSubtitle}>Opcional — registre o que foi decidido</Text>
            <TextInput
              style={styles.modalInput}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Ex: Equipe acionada às 10:45, aguardando retorno..."
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNotesModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmAction} disabled={isPending}>
                {isPending
                  ? <ActivityIndicator color={colors.textInverse} size="small" />
                  : <Text style={styles.modalConfirmText}>Confirmar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.sm, paddingBottom: spacing.xxl },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 260 },
  imageBadges: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  alertType: { ...typography.h3, color: colors.textPrimary },
  pasture: { ...typography.bodyBold, color: colors.primary },
  date: { ...typography.caption, color: colors.textSecondary },
  sectionLabel: { ...typography.captionBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  notes: { ...typography.body, color: colors.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  actionsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  actionsTitle: { ...typography.bodyBold, color: colors.textPrimary },
  actionPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionPrimaryText: { ...typography.bodyBold, color: colors.textInverse },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionSecondary: {
    flex: 1,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  actionNeutral: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  actionSecondaryText: { ...typography.captionBold, color: colors.textPrimary },
  resolvedBanner: {
    backgroundColor: colors.successLight,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  resolvedText: { ...typography.bodyBold, color: colors.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalSubtitle: { ...typography.caption, color: colors.textSecondary },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 100,
    backgroundColor: colors.background,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalCancel: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalCancelText: { ...typography.bodyBold, color: colors.textSecondary },
  modalConfirm: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: { ...typography.bodyBold, color: colors.textInverse },
});
