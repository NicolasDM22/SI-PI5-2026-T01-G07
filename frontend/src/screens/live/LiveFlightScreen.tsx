import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLiveFlightStore } from '../../store/liveFlightStore';
import { useQueryClient } from '@tanstack/react-query';
import { useFlightHistoryStore } from '../../store/flightHistoryStore';
import { submitFlightForAi } from '../../api/services/ai';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDateTime } from '../../utils/format';

interface Props {
  navigation: any;
}

const POLL_MS = 450;

export function LiveFlightScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameIndexRef = useRef(0);
  const [endpointInput, setEndpointInput] = useState('');
  const [connStatus, setConnStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isConnecting, setIsConnecting] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const {
    serverIp,
    setServerIp,
    flightId,
    flightStatus,
    frameCount,
    lastFrameBase64,
    startTs,
    currentFrames,
    setFlightStarted,
    addFrame,
    setFlightCompleted,
    resetFlight,
  } = useLiveFlightStore();
  const registerFlight = useFlightHistoryStore((s) => s.registerFlight);

  useEffect(() => {
    if (serverIp) setEndpointInput(serverIp);
    return () => {
      stopPolling();
      stopElapsed();
    };
  }, []);

  useEffect(() => {
    frameIndexRef.current = frameCount;
  }, [frameCount]);

  useEffect(() => {
    if (flightStatus === 'active' && startTs) {
      setElapsed(0);
      elapsedRef.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - new Date(startTs).getTime()) / 1000)),
        1000
      );
    } else {
      stopElapsed();
    }
  }, [flightStatus, startTs]);

  function stopElapsed() {
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function fmt(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function normalizeEndpoint(raw: string) {
    const value = raw.trim();
    if (!value) return '';
    const withProtocol =
      value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
    return withProtocol.replace(/\/+$/, '');
  }

  async function pollLatestImage(baseUrl: string) {
    try {
      const now = Date.now();
      const imageUrl = `${baseUrl}/latest?t=${now}`;
      const response = await fetch(imageUrl, { method: 'GET' });
      if (!response.ok) return;
      const nextIndex = frameIndexRef.current;
      addFrame({ index: nextIndex, path: imageUrl, ts: new Date().toISOString() }, imageUrl);
      frameIndexRef.current = nextIndex + 1;
    } catch {
      setConnStatus('error');
      stopPolling();
      setFlightCompleted(new Date().toISOString(), []);
    }
  }

  function startMonitor(baseUrl: string) {
    const monitorId = `ngrok-${Date.now()}`;
    setFlightStarted(monitorId, new Date().toISOString());
    stopPolling();
    void pollLatestImage(baseUrl);
    pollRef.current = setInterval(() => {
      void pollLatestImage(baseUrl);
    }, POLL_MS);
  }

  async function handleConnect() {
    const endpoint = normalizeEndpoint(endpointInput);
    if (!endpoint) {
      Alert.alert('Informe a URL do endpoint (ngrok)');
      return;
    }

    setIsConnecting(true);
    setConnStatus('connecting');
    try {
      const response = await fetch(`${endpoint}/latest?t=${Date.now()}`, { method: 'GET' });
      if (!response.ok && response.status !== 404) throw new Error('invalid-endpoint');
      setServerIp(endpoint);
      setConnStatus('connected');
      startMonitor(endpoint);
    } catch {
      setConnStatus('error');
      Alert.alert('Erro de conexão', 'Não foi possível acessar o endpoint do ngrok.');
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    Alert.alert('Parar monitoramento?', 'Encerrar leitura de imagens do endpoint.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          const endTs = new Date().toISOString();
          stopPolling();
          stopElapsed();
          setConnStatus('idle');
          if (flightStatus === 'active' && startTs) {
            const createdFlight = registerFlight({
              pastureId: 'pasture-live',
              pastureName: 'Pasto Live',
              startTs,
              endTs,
              source: 'live',
              frameCount,
              detectedCount: frameCount,
              expectedCount: frameCount,
              notes: `Voo ao vivo via endpoint ${serverIp}`,
            });
            await submitFlightForAi({
              flightId: createdFlight.id,
              source: 'live',
              images: currentFrames.map((f) => f.path).filter(Boolean),
              metadata: { endpoint: serverIp, frameCount },
            });
            queryClient.invalidateQueries({ queryKey: ['flights'] });
          }
          setFlightCompleted(endTs, []);
          setServerIp('');
        },
      },
    ]);
  }

  function handleResetMonitor() {
    stopPolling();
    stopElapsed();
    setConnStatus('idle');
    setServerIp('');
    resetFlight();
  }

  const connConfig = {
    idle: { color: colors.textDisabled, label: 'Desconectado' },
    connecting: { color: colors.warning, label: 'Conectando...' },
    connected: { color: colors.success, label: 'Conectado' },
    error: { color: colors.danger, label: 'Erro de conexão' },
  }[connStatus];

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.controlsInner, { paddingTop: spacing.md }]}>
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Endpoint de imagens</Text>
          <View style={s.connLegend}>
            <View style={[s.connDot, { backgroundColor: connConfig.color }]} />
            <Text style={[s.connText, { color: connConfig.color }]}>{connConfig.label}</Text>
          </View>
        </View>

        {connStatus !== 'connected' ? (
          <>
            <Text style={s.caption}>URL publica do ngrok que serve o endpoint `/latest`</Text>
            <View style={s.ipRow}>
              <TextInput
                style={s.ipInput}
                value={endpointInput}
                onChangeText={setEndpointInput}
                placeholder="https://abc123.ngrok-free.app"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={s.connBtn} onPress={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={s.connBtnText}>Conectar</Text>
                )}
              </TouchableOpacity>
            </View>
            {connStatus === 'error' && (
              <Text style={s.errorCaption}>
                Verifique o servidor local, o ngrok e se `/latest` esta acessivel.
              </Text>
            )}
          </>
        ) : (
          <View style={s.connectedRow}>
            <View>
              <Text style={s.connectedUrl}>{serverIp}</Text>
              <Text style={s.caption}>Atualizacao automatica a cada {POLL_MS}ms</Text>
            </View>
            <TouchableOpacity style={s.disconnBtn} onPress={handleDisconnect}>
              <Text style={s.disconnText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {flightStatus === 'active' && (
        <>
          <View style={[s.card, s.liveCard]}>
            <View style={s.liveHeader}>
              <View style={s.recBadge}>
                <View style={s.recDot} />
                <Text style={s.recText}>AO VIVO</Text>
              </View>
              <Text style={s.liveElapsed}>{fmt(elapsed)}</Text>
              <Text style={s.liveFrames}>📷 {frameCount}</Text>
            </View>
          </View>

          <View style={s.frameWrap}>
            {lastFrameBase64 ? (
              <>
                <Image source={{ uri: lastFrameBase64 }} style={s.frameImg} resizeMode="cover" />
                <View style={s.frameTag}>
                  <Text style={s.frameTagText}>Frame #{Math.max(frameCount - 1, 0)}</Text>
                </View>
              </>
            ) : (
              <View style={s.frameEmpty}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={s.caption}>Aguardando primeiro frame...</Text>
              </View>
            )}
          </View>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statVal}>{frameCount}</Text>
              <Text style={s.statLbl}>Frames</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>{fmt(elapsed)}</Text>
              <Text style={s.statLbl}>Duracao</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>●</Text>
              <Text style={s.statLbl}>Status</Text>
            </View>
          </View>

          <TouchableOpacity style={s.stopBtn} onPress={handleDisconnect} activeOpacity={0.85}>
            <Text style={s.stopBtnText}>⏹ Encerrar monitoramento</Text>
          </TouchableOpacity>
        </>
      )}

      {flightStatus === 'completed' && (
        <View style={s.doneCard}>
          <Text style={s.doneIcon}>✅</Text>
          <Text style={s.doneTitle}>Monitoramento encerrado</Text>
          <Text style={s.doneSub}>
            {frameCount} frames {startTs ? `· ${formatDateTime(startTs)}` : ''}
          </Text>
          <TouchableOpacity
            style={s.startBtn}
            onPress={() => flightId && navigation.navigate('LiveFlightImages', { flightId })}
            activeOpacity={0.85}
          >
            <Text style={s.startBtnText}>🖼 Ver imagens recebidas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.newBtn, { marginTop: 0 }]} onPress={handleResetMonitor}>
            <Text style={s.newBtnText}>Nova conexao</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  controlsInner: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.bodyBold, color: colors.textPrimary },
  connLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { ...typography.captionBold },
  caption: { ...typography.caption, color: colors.textSecondary },
  errorCaption: { ...typography.caption, color: colors.danger },
  ipRow: { flexDirection: 'row', gap: spacing.sm },
  ipInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  connBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    minWidth: 90,
    alignItems: 'center',
  },
  connBtnText: { ...typography.captionBold, color: colors.textInverse },
  connectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  connectedUrl: { ...typography.bodyBold, color: colors.primary, maxWidth: 220 },
  disconnBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  disconnText: { ...typography.captionBold, color: colors.textSecondary },
  liveCard: { backgroundColor: '#1b2e1f', borderColor: '#2d4a32', borderWidth: 1 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(230,57,70,0.88)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recText: { ...typography.captionBold, color: '#fff' },
  liveElapsed: { ...typography.bodyBold, color: '#e8f5e9', flex: 1, textAlign: 'center' },
  liveFrames: { ...typography.captionBold, color: '#52b788' },
  frameWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0f1a12', aspectRatio: 16 / 9, ...shadows.md },
  frameImg: { width: '100%', height: '100%' },
  frameEmpty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  frameTag: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  frameTagText: { ...typography.small, color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  statVal: { ...typography.h3, color: colors.textPrimary },
  statLbl: { ...typography.small, color: colors.textSecondary },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  startBtnText: { ...typography.h3, color: colors.textInverse },
  stopBtn: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  stopBtnText: { ...typography.bodyBold, color: colors.danger },
  newBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  newBtnText: { ...typography.captionBold, color: colors.textSecondary },
  doneCard: {
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  doneIcon: { fontSize: 48 },
  doneTitle: { ...typography.h3, color: colors.primary },
  doneSub: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
