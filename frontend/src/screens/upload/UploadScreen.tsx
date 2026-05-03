import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Alert, ScrollView, ActivityIndicator,
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
  queued: { label: 'Aguardando rede...', color: colors.textSecondary },
  uploading: { label: 'Enviando...', color: colors.info },
  processing: { label: 'Processando...', color: colors.accent },
  done: { label: 'Concluído', color: colors.success },
  error: { label: 'Falha no envio', color: colors.danger },
};

export function UploadScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; size: number; file?: File } | null>(null);
  const [selectedPastureId, setSelectedPastureId] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { queue, addToQueue, removeFromQueue, updateStatus } = useUploadQueueStore();
  const { data: farm } = useQuery({ queryKey: ['farm'], queryFn: getMyFarm });
  const { data: pastures } = useQuery({
    queryKey: ['pastures', farm?.id],
    queryFn: () => getPastures(farm!.id),
    enabled: !!farm,
  });

  async function pickVideo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        file: (asset as any).file,
      });
    }
  }

  async function addToQueueHandler() {
    if (!selectedFile) {
      Alert.alert('Selecione um vídeo', 'Escolha o arquivo de vídeo antes de continuar.');
      return;
    }
    if (!selectedPastureId) {
      Alert.alert('Selecione o pasto', 'Informe qual pasto foi sobrevoado neste voo.');
      return;
    }

    const pasture = pastures?.find((p) => p.id === selectedPastureId);
    const fileToUpload = selectedFile;
    const pastureToUpload = selectedPastureId;
    const notesToUpload = notes.trim() || undefined;

    setIsAdding(true);

    const queued = addToQueue({
      localUri: fileToUpload.uri,
      fileName: fileToUpload.name,
      fileSize: fileToUpload.size,
      pastureId: pastureToUpload,
      pastureName: pasture?.name ?? 'Pasto desconhecido',
      flightDate: new Date().toISOString(),
    });

    setSelectedFile(null);
    setSelectedPastureId('');
    setNotes('');
    setIsAdding(false);

    updateStatus(queued.id, 'uploading', 30);
    try {
      await uploadFlight({
        pastureId: pastureToUpload,
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

  function handleRetry(item: UploadItem) {
    Alert.alert('Reenviar', `Deseja reenviar o vídeo "${item.fileName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reenviar',
        onPress: () => {
          updateStatus(item.id, 'uploading', 20);
          setTimeout(() => updateStatus(item.id, 'processing', 70), 500);
          setTimeout(() => updateStatus(item.id, 'done', 100), 1200);
        },
      },
    ]);
  }

  function handleRemove(id: string) {
    Alert.alert('Remover da fila', 'Deseja remover este item da fila?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeFromQueue(id) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Formulário de upload */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enviar vídeo de voo</Text>
        <Text style={styles.cardSubtitle}>
          Sem internet? Adicione à fila — o envio ocorre automaticamente quando a rede for detectada.
        </Text>

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

        {/* Seleção de pasto */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pasto sobrevoado *</Text>
          <View style={styles.pastureList}>
            {pastures?.map((pasture) => (
              <TouchableOpacity
                key={pasture.id}
                style={[
                  styles.pastureChip,
                  selectedPastureId === pasture.id && styles.pastureChipActive,
                ]}
                onPress={() => setSelectedPastureId(pasture.id)}
              >
                <Text style={[
                  styles.pastureChipText,
                  selectedPastureId === pasture.id && styles.pastureChipTextActive,
                ]}>
                  {pasture.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                  <TouchableOpacity onPress={() => handleRemove(item.id)}>
                    <Text style={styles.queueRemove}>✕</Text>
                  </TouchableOpacity>
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
                    <TouchableOpacity onPress={() => handleRetry(item)}>
                      <Text style={styles.retryText}>Tentar novamente</Text>
                    </TouchableOpacity>
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
  filePicker: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  fileEmpty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  fileEmptyIcon: { fontSize: 32 },
  fileEmptyText: { ...typography.bodyBold, color: colors.textSecondary },
  fileEmptyHint: { ...typography.small, color: colors.textDisabled },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
  },
  fileIcon: { fontSize: 28 },
  fileInfo: { flex: 1 },
  fileName: { ...typography.bodyBold, color: colors.textPrimary },
  fileSize: { ...typography.caption, color: colors.textSecondary },
  fileRemove: { fontSize: 18, color: colors.textSecondary, padding: spacing.xs },
  fieldGroup: { gap: spacing.xs },
  label: { ...typography.captionBold, color: colors.textSecondary },
  pastureList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pastureChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pastureChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  pastureChipText: { ...typography.captionBold, color: colors.textSecondary },
  pastureChipTextActive: { color: colors.textInverse },
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
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: { ...typography.bodyBold, color: colors.textInverse },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary },
  queueItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    ...shadows.sm,
  },
  queueItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueFileName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  queueRemove: { fontSize: 16, color: colors.textDisabled, padding: 4 },
  queuePasture: { ...typography.caption, color: colors.primary },
  queueDate: { ...typography.small, color: colors.textDisabled },
  queueStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  queueStatusDot: { width: 8, height: 8, borderRadius: 4 },
  queueStatusText: { ...typography.captionBold },
  queueProgress: { ...typography.caption, color: colors.info, marginLeft: 'auto' },
  retryText: { ...typography.captionBold, color: colors.primary, marginLeft: 'auto' },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: radius.full,
  },
  errorMessage: { ...typography.small, color: colors.danger },
  emptyQueue: { alignItems: 'center', padding: spacing.xl, gap: spacing.xs },
  emptyQueueIcon: { fontSize: 36 },
  emptyQueueText: { ...typography.bodyBold, color: colors.textSecondary },
  emptyQueueSub: { ...typography.caption, color: colors.textDisabled },
});
