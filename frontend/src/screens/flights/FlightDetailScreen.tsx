import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFlightById, getFlightFrames, detectFrameCattle, analyzeAllFrames, FrameInfo, DetectionResult } from '../../api/services/flights';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDateTime, formatDuration } from '../../utils/format';
import { API_BASE_URL } from '../../api/client';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_SIZE = 80;

interface Props {
  navigation: any;
  route: { params: { flightId: string } };
}

export function FlightDetailScreen({ navigation, route }: Props) {
  const { flightId } = route.params;

  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState<FrameInfo | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmAnalyzeVisible, setConfirmAnalyzeVisible] = useState(false);

  const { data: flight, isLoading } = useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => getFlightById(flightId),
    refetchInterval: (query) => query.state.data?.status === 'processing' ? 2000 : false,
  });

  const { data: frames = [] } = useQuery({
    queryKey: ['frames', flightId],
    queryFn: () => getFlightFrames(flightId),
    enabled: flight?.status === 'completed',
  });

  const detectMutation = useMutation({
    mutationFn: () => detectFrameCattle(flightId, selectedFrame!.name),
    onSuccess: (data) => {
      setDetectionResult(data);
      queryClient.invalidateQueries({ queryKey: ['flight', flightId] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeAllFrames(flightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight', flightId] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unseen'] });
    },
  });

  if (isLoading || !flight) return <LoadingSpinner message="Carregando voo..." />;

  const hasCount = flight.detectedCount != null;
  const countDiff = hasCount ? flight.detectedCount - flight.expectedCount : null;
  const countColor = countDiff == null ? colors.textDisabled : countDiff < -5 ? colors.danger : countDiff < 0 ? colors.warning : colors.success;

  const selectedIndex = frames.findIndex((f) => f.name === selectedFrame?.name);

  function openFrame(frame: FrameInfo) {
    setSelectedFrame(frame);
    setDetectionResult(null);
    setModalVisible(true);
  }

  const ITEM_WIDTH = THUMB_SIZE + spacing.xs;
  const SCROLL_STEP = ITEM_WIDTH * 5;
  const maxOffset = Math.max(0, frames.length * ITEM_WIDTH - (SCREEN_WIDTH - spacing.md * 2 - 72));

  function scrollFilmstrip(direction: 'left' | 'right') {
    const next = direction === 'left'
      ? Math.max(0, scrollOffset - SCROLL_STEP)
      : Math.min(maxOffset, scrollOffset + SCROLL_STEP);
    flatListRef.current?.scrollToOffset({ offset: next, animated: true });
    setScrollOffset(next);
  }

  function openReport() {
    const url = `${API_BASE_URL}/flights/${flightId}/report`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o relatório. Verifique se o servidor está rodando.')
    );
  }

  function navigateFrame(direction: 'prev' | 'next') {
    const next = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
    if (next >= 0 && next < frames.length) {
      setSelectedFrame(frames[next]);
      setDetectionResult(null);
    }
  }

  const displayImageUri = detectionResult?.annotatedImageB64
    ? `data:image/jpeg;base64,${detectionResult.annotatedImageB64}`
    : selectedFrame?.url;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pastureName}>{flight.name ?? flight.pastureName ?? 'Voo sem nome'}</Text>
              {flight.name && flight.pastureName && (
                <Text style={styles.pastureSubtitle}>{flight.pastureName}</Text>
              )}
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
              {hasCount ? flight.detectedCount : '—'}
              <Text style={styles.statExpected}>/{flight.expectedCount ?? '?'}</Text>
            </Text>
            <Text style={styles.statLabel}>Animais detectados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(flight.startTs, flight.endTs)}</Text>
            <Text style={styles.statLabel}>Duração do voo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: flight.alertsCount > 0 ? colors.warning : colors.success }]}>
              {flight.alertsCount}
            </Text>
            <Text style={styles.statLabel}>Alertas gerados</Text>
          </View>
        </View>

        {countDiff != null && countDiff < 0 && (
          <View style={[styles.warningBanner, countDiff < -5 && styles.dangerBanner]}>
            <Text style={[styles.warningText, countDiff < -5 && styles.dangerText]}>
              {countDiff < -5
                ? `⚠️ ${Math.abs(countDiff)} animais abaixo do esperado`
                : `ℹ️ ${Math.abs(countDiff)} animal(is) não detectado(s)`}
            </Text>
          </View>
        )}

        {/* Botão de relatório PDF */}
        {flight.status === 'completed' && hasCount && (
          <TouchableOpacity style={styles.reportBtn} onPress={openReport}>
            <Text style={styles.reportBtnText}>📄  Baixar Relatório PDF</Text>
          </TouchableOpacity>
        )}

        {/* Timeline de frames */}
        {flight.status === 'completed' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Frames do voo</Text>
              {frames.length > 0 && (
                <TouchableOpacity
                  style={[styles.analyzeBtn, analyzeMutation.isPending && styles.analyzeBtnDisabled]}
                  onPress={() => setConfirmAnalyzeVisible(true)}
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.analyzeBtnText}>Analisar Voo</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
            {analyzeMutation.isPending && (
              <Text style={styles.analyzingHint}>Rodando YOLO em {frames.length} frames...</Text>
            )}
            {frames.length === 0 ? (
              <View style={styles.noFrames}>
                <Text style={styles.noFramesText}>Nenhum frame disponível para este voo.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionHint}>Toque em um frame para analisar individualmente</Text>
                <View style={styles.filmstripRow}>
                  <TouchableOpacity
                    style={[styles.filmArrow, scrollOffset <= 0 && styles.filmArrowDisabled]}
                    onPress={() => scrollFilmstrip('left')}
                    disabled={scrollOffset <= 0}
                  >
                    <Text style={styles.filmArrowText}>‹</Text>
                  </TouchableOpacity>

                  <FlatList
                    ref={flatListRef}
                    data={frames}
                    keyExtractor={(item) => item.name}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filmstrip}
                    style={styles.filmstripList}
                    onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.x)}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.thumbWrapper} onPress={() => openFrame(item)}>
                        <Image source={{ uri: item.url }} style={styles.thumb} resizeMode="cover" />
                        <Text style={styles.thumbLabel}>{item.index}</Text>
                      </TouchableOpacity>
                    )}
                  />

                  <TouchableOpacity
                    style={[styles.filmArrow, scrollOffset >= maxOffset && styles.filmArrowDisabled]}
                    onPress={() => scrollFilmstrip('right')}
                    disabled={scrollOffset >= maxOffset}
                  >
                    <Text style={styles.filmArrowText}>›</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {flight.status === 'processing' && (
          <View style={styles.processingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.processingText}>Voo em processamento — frames disponíveis em breve</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de confirmação — Analisar Voo */}
      <Modal visible={confirmAnalyzeVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Analisar Voo</Text>
            <Text style={styles.confirmMessage}>
              Será contabilizado o frame com o maior número de animais detectados como resultado do voo. Deseja continuar?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmAnalyzeVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmOkBtn}
                onPress={() => {
                  setConfirmAnalyzeVisible(false);
                  analyzeMutation.mutate();
                }}
              >
                <Text style={styles.confirmOkText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de frame */}
      <Modal visible={modalVisible} animationType="slide" statusBarTranslucent>
        <View style={styles.modal}>
          {/* Barra superior */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Frame {selectedFrame?.index} / {frames.length}
            </Text>
            {detectionResult != null ? (
              <View style={[styles.countBadge, detectionResult.count === 0 && styles.countBadgeZero]}>
                <Text style={styles.countBadgeText}>{detectionResult.count} gado</Text>
              </View>
            ) : (
              <View style={{ width: 70 }} />
            )}
          </View>

          {/* Imagem */}
          <View style={styles.modalImageContainer}>
            {displayImageUri ? (
              <Image source={{ uri: displayImageUri }} style={styles.modalImage} resizeMode="contain" />
            ) : (
              <View style={styles.modalImagePlaceholder}>
                <Text style={styles.noFramesText}>Sem imagem</Text>
              </View>
            )}
            {detectMutation.isPending && (
              <View style={styles.detectingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.detectingText}>Detectando gado...</Text>
              </View>
            )}
          </View>

          {/* Resultado */}
          {detectionResult && (
            <View style={[styles.resultBanner, detectionResult.count === 0 && styles.resultBannerZero]}>
              <Text style={styles.resultText}>
                {detectionResult.count > 0
                  ? `✓ ${detectionResult.count} animal(is) detectado(s)`
                  : 'Nenhum gado detectado neste frame'}
              </Text>
            </View>
          )}

          {detectMutation.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>Erro ao processar. Tente novamente.</Text>
            </View>
          )}

          {/* Navegação e ação */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.navBtn, selectedIndex === 0 && styles.navBtnDisabled]}
              onPress={() => navigateFrame('prev')}
              disabled={selectedIndex === 0}
            >
              <Text style={styles.navBtnText}>‹ Ant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.detectBtn, detectMutation.isPending && styles.detectBtnDisabled]}
              onPress={() => {
                setDetectionResult(null);
                detectMutation.mutate();
              }}
              disabled={detectMutation.isPending}
            >
              <Text style={styles.detectBtnText}>
                {detectionResult ? 'Re-detectar' : 'Detectar Gado'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, selectedIndex === frames.length - 1 && styles.navBtnDisabled]}
              onPress={() => navigateFrame('next')}
              disabled={selectedIndex === frames.length - 1}
            >
              <Text style={styles.navBtnText}>Próx ›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  pastureSubtitle: { ...typography.caption, color: colors.primary, marginTop: 1 },
  flightDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  notes: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  dangerBanner: { backgroundColor: colors.dangerLight, borderLeftColor: colors.danger },
  warningText: { ...typography.bodyBold, color: '#B45309' },
  dangerText: { color: colors.danger },

  reportBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  reportBtnText: { ...typography.bodyBold, color: '#fff' },

  section: { gap: spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary },
  analyzingHint: { ...typography.caption, color: colors.primary, fontStyle: 'italic' },
  analyzeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 44,
    alignItems: 'center',
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { ...typography.caption, color: '#fff', fontWeight: '700' },

  filmstripRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filmstripList: { flex: 1 },
  filmstrip: { paddingVertical: spacing.xs },
  filmArrow: {
    width: 32,
    height: THUMB_SIZE * 0.65,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  filmArrowDisabled: { opacity: 0.25 },
  filmArrowText: { fontSize: 20, color: colors.textPrimary, lineHeight: 24 },
  thumbWrapper: {
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.xs,
    width: THUMB_SIZE,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 0.65,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  thumbLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },

  noFrames: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  noFramesText: { ...typography.caption, color: colors.textSecondary },

  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  processingText: { ...typography.caption, color: colors.textSecondary, flex: 1 },

  // Modal de confirmação
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  confirmBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
    ...shadows.sm,
  },
  confirmTitle: { ...typography.h3, color: colors.textPrimary },
  confirmMessage: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  confirmButtons: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.xs },
  confirmCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  confirmCancelText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  confirmOkBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  confirmOkText: { ...typography.caption, color: '#fff', fontWeight: '700' },

  // Modal de frame
  modal: { flex: 1, backgroundColor: '#0a0a0a' },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  modalClose: { fontSize: 20, color: '#fff', fontWeight: '600', width: 32 },
  modalTitle: { ...typography.bodyBold, color: '#fff' },

  countBadge: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minWidth: 70,
    alignItems: 'center',
  },
  countBadgeZero: { backgroundColor: colors.textDisabled },
  countBadgeText: { ...typography.caption, color: '#fff', fontWeight: '700' },

  modalImageContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: { width: SCREEN_WIDTH - spacing.sm * 2, flex: 1 },
  modalImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  detectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detectingText: { color: '#fff', ...typography.bodyBold },

  resultBanner: {
    backgroundColor: '#14532d',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  resultBannerZero: { backgroundColor: '#3f3f46' },
  resultText: { color: '#fff', ...typography.bodyBold },

  errorBanner: {
    backgroundColor: colors.dangerLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  errorText: { color: colors.danger, ...typography.caption },

  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  navBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#27272a',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#fff', ...typography.caption, fontWeight: '600' },

  detectBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  detectBtnDisabled: { opacity: 0.5 },
  detectBtnText: { color: '#fff', ...typography.bodyBold },
});
