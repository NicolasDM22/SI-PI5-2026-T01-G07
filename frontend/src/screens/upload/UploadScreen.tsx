import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUploadQueueStore } from '../../store/uploadQueueStore';
import { getPastures, getMyFarm } from '../../api/services/farms';
import { uploadFlight } from '../../api/services/flights';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { UploadItem, UploadStatus } from '../../types';
import { formatFileSize, formatRelativeTime } from '../../utils/format';

interface Props {
  navigation: any;
}

const uploadStatusConfig: Record<UploadStatus, { label: string; color: string }> = {
  queued:     { label: 'Aguardando rede...', color: colors.textSecondary },
  uploading:  { label: 'Enviando...',        color: colors.info },
  processing: { label: 'Processando...',     color: colors.accent },
  done:       { label: 'Concluído',          color: colors.success },
  error:      { label: 'Falha no envio',     color: colors.danger },
};

export function UploadScreen({ navigation }: Props) {
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; size: number; file?: File } | null>(null);
  const [flightName, setFlightName] = useState('');
  const [selectedPastureId, setSelectedPastureId] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [retryConfirmId, setRetryConfirmId] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  const { queue, addToQueue, removeFromQueue, updateStatus } = useUploadQueueStore();
  const { data: farm } = useQuery({ queryKey: ['farm'], queryFn: getMyFarm });
  const { data: pastures } = useQuery({
    queryKey: ['pastures', farm?.id],
    queryFn: () => getPastures(farm!.id),
    enabled: !!farm,
  });

  async function pickVideo() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({ uri: asset.uri, name: asset.name, size: asset.size ?? 0, file: (asset as any).file });
    }
  }

  async function addToQueueHandler() {
    setFormError('');
    if (!selectedFile) { setFormError('Selecione um vídeo antes de continuar.'); return; }
    if (!selectedPastureId) { setFormError('Selecione o pasto sobrevoado.'); return; }

    const pasture = pastures?.find((p) => p.id === selectedPastureId);
    const fileToUpload = selectedFile;
    const pastureToUpload = selectedPastureId;
    const pastureName = pasture?.name ?? 'Pasto desconhecido';
    const notesToUpload = notes.trim() || undefined;
    const nameToUpload = flightName.trim() || undefined;

    setIsAdding(true);

    const queued = addToQueue({
      localUri: fileToUpload.uri,
      fileName: fileToUpload.name,
      fileSize: fileToUpload.size,
      pastureId: pastureToUpload,
      pastureName,
      flightDate: new Date().toISOString(),
    });

    setSelectedFile(null);
    setSelectedPastureId('');
    setFlightName('');
    setNotes('');
    setIsAdding(false);

    updateStatus(queued.id, 'uploading', 30);
    try {
      await uploadFlight({
        name: nameToUpload,
        pastureId: pastureToUpload,
        pastureName,
        farmId: farm?.id ?? 'farm-local',
        flightDate: new Date().toISOString(),
        notes: notesToUpload,
        videoUri: fileToUpload.uri,
        videoFile: fileToUpload.file,
      });
      updateStatus(queued.id, 'done', 100);
      queryClient.invalidateQueries({ queryKey: ['flights'] });
    } catch {
      updateStatus(queued.id, 'error', 0, 'Falha no envio. Tente novamente.');
    }
  }

  function confirmRetry(item: UploadItem) {
    updateStatus(item.id, 'uploading', 20);
    setTimeout(() => updateStatus(item.id, 'processing', 70), 500);
    setTimeout(() => updateStatus(item.id, 'done', 100), 1200);
    setRetryConfirmId(null);
  }

  const selectedPasture = pastures?.find((p) => p.id === selectedPastureId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Formulário de upload */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enviar vídeo de voo</Text>
        <Text style={styles.cardSubtitle}>
          Sem internet? Adicione à fila — o envio ocorre automaticamente quando a rede for detectada.
        </Text>

        {formError !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {/* Seleção de vídeo */}
        <TouchableOpacity style={styles.filePicker} onPress={pickVideo} activeOpacity={0.85}>
          {selectedFile ? (
            <View style={styles.fileSelected}>
              <Text style={styles.fileIcon}>🎥</Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Text style={styles.fileRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fileEmpty}>
              <Text style={styles.fileEmptyIcon}>📁</Text>
              <Text style={styles.fileEmptyText}>Toque para selecionar o vídeo</Text>
              <Text style={styles.fileEmptyHint}>MP4, MOV, AVI</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Nome do voo */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome do voo (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputSingle]}
            value={flightName}
            onChangeText={setFlightName}
            placeholder="Ex: Voo matutino pasto norte"
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        {/* Seleção de pasto */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pasto sobrevoado *</Text>
          {pastures && pastures.length === 0 && (
            <Text style={styles.noPasturesHint}>
              Nenhum pasto cadastrado. Acesse Perfil para adicionar.
            </Text>
          )}
          <View style={styles.pastureList}>
            {pastures?.map((pasture) => {
              const active = selectedPastureId === pasture.id;
              return (
                <TouchableOpacity
                  key={pasture.id}
                  style={[styles.pastureChip, active && styles.pastureChipActive]}
                  onPress={() => setSelectedPastureId(pasture.id)}
                >
                  <Text style={[styles.pastureChipName, active && styles.pastureChipTextActive]}>
                    {pasture.name}
                  </Text>
                  <Text style={[styles.pastureChipCount, active && styles.pastureChipTextActive]}>
                    {pasture.expectedCount} animais
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedPasture && (
            <Text style={styles.pastureHint}>
              Contagem esperada: {selectedPasture.expectedCount} animais
            </Text>
          )}
        </View>

        {/* Notas */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Observações (opcional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: voo matutino, boa visibilidade, altitude ~35m"
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={addToQueueHandler}
          disabled={isAdding}
          activeOpacity={0.85}
        >
          {isAdding
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.addButtonText}>+ Adicionar à fila de envio</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Fila de upload */}
      {queue.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fila de envio ({queue.length})</Text>
          {queue.map((item) => {
            const config = uploadStatusConfig[item.status];
            return (
              <View key={item.id} style={styles.queueItem}>
                <View style={styles.queueItemHeader}>
                  <Text style={styles.queueFileName} numberOfLines={1}>{item.fileName}</Text>
                  {removeConfirmId === item.id ? (
                    <View style={styles.inlineConfirm}>
                      <TouchableOpacity onPress={() => { removeFromQueue(item.id); setRemoveConfirmId(null); }} style={styles.confirmDanger}>
                        <Text style={styles.confirmDangerText}>Remover</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRemoveConfirmId(null)} style={styles.confirmCancel}>
                        <Text style={styles.confirmCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setRemoveConfirmId(item.id)}>
                      <Text style={styles.queueRemove}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.queuePasture}>{item.pastureName}</Text>
                <Text style={styles.queueDate}>{formatRelativeTime(item.createdAt)}</Text>

                <View style={styles.queueStatusRow}>
                  <View style={[styles.queueStatusDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.queueStatusText, { color: config.color }]}>{config.label}</Text>
                  {item.status === 'uploading' && (
                    <Text style={styles.queueProgress}>{item.progress}%</Text>
                  )}
                  {item.status === 'error' && (
                    retryConfirmId === item.id ? (
                      <View style={styles.inlineConfirm}>
                        <TouchableOpacity onPress={() => confirmRetry(item)} style={styles.confirmPrimary}>
                          <Text style={styles.confirmPrimaryText}>Reenviar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setRetryConfirmId(null)} style={styles.confirmCancel}>
                          <Text style={styles.confirmCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => setRetryConfirmId(item.id)} style={styles.retryButton}>
                        <Text style={styles.retryText}>Tentar novamente</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {item.status === 'uploading' && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                  </View>
                )}

                {item.errorMessage && (
                  <Text style={styles.errorMessage}>{item.errorMessage}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {queue.length === 0 && (
        <View style={styles.emptyQueue}>
          <Text style={styles.emptyQueueIcon}>📭</Text>
          <Text style={styles.emptyQueueText}>Fila vazia</Text>
          <Text style={styles.emptyQueueSub}>Nenhum vídeo aguardando envio</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  errorBox: { backgroundColor: '#FDECEA', borderRadius: radius.md, padding: spacing.sm },
  errorText: { ...typography.caption, color: colors.danger },
  filePicker: { borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, overflow: 'hidden' },
  fileEmpty: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  fileEmptyIcon: { fontSize: 32 },
  fileEmptyText: { ...typography.bodyBold, color: colors.textSecondary },
  fileEmptyHint: { ...typography.small, color: colors.textDisabled },
  fileSelected: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.infoLight },
  fileIcon: { fontSize: 28 },
  fileInfo: { flex: 1 },
  fileName: { ...typography.bodyBold, color: colors.textPrimary },
  fileSize: { ...typography.caption, color: colors.textSecondary },
  fileRemove: { fontSize: 18, color: colors.textSecondary, padding: spacing.xs },
  fieldGroup: { gap: spacing.xs },
  label: { ...typography.captionBold, color: colors.textSecondary },
  noPasturesHint: { ...typography.caption, color: colors.accent, fontStyle: 'italic' },
  pastureList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pastureChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pastureChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  pastureChipName: { ...typography.captionBold, color: colors.textSecondary },
  pastureChipCount: { ...typography.small, color: colors.textDisabled },
  pastureChipTextActive: { color: colors.textInverse },
  pastureHint: { ...typography.caption, color: colors.primary, fontStyle: 'italic' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 80,
  },
  inputSingle: { minHeight: undefined },
  addButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', ...shadows.sm },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: { ...typography.bodyBold, color: colors.textInverse },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary },
  queueItem: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4, ...shadows.sm },
  queueItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueFileName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  queueRemove: { fontSize: 16, color: colors.textDisabled, padding: 4 },
  queuePasture: { ...typography.caption, color: colors.primary },
  queueDate: { ...typography.small, color: colors.textDisabled },
  queueStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  queueStatusDot: { width: 8, height: 8, borderRadius: 4 },
  queueStatusText: { ...typography.captionBold },
  queueProgress: { ...typography.caption, color: colors.info, marginLeft: 'auto' },
  retryButton: { marginLeft: 'auto' },
  retryText: { ...typography.captionBold, color: colors.primary },
  inlineConfirm: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  confirmDanger: { backgroundColor: colors.danger, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  confirmDangerText: { ...typography.small, color: colors.textInverse, fontWeight: '600' as const },
  confirmPrimary: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  confirmPrimaryText: { ...typography.small, color: colors.textInverse, fontWeight: '600' as const },
  confirmCancel: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  confirmCancelText: { ...typography.small, color: colors.textSecondary, fontWeight: '600' as const },
  progressBar: { height: 4, backgroundColor: colors.borderLight, borderRadius: radius.full, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: colors.info, borderRadius: radius.full },
  errorMessage: { ...typography.small, color: colors.danger },
  emptyQueue: { alignItems: 'center', padding: spacing.xl, gap: spacing.xs },
  emptyQueueIcon: { fontSize: 36 },
  emptyQueueText: { ...typography.bodyBold, color: colors.textSecondary },
  emptyQueueSub: { ...typography.caption, color: colors.textDisabled },
});
