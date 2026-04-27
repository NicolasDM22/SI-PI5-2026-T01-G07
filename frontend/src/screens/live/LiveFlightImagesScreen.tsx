import React, { useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, Modal, Dimensions,
} from 'react-native';
import { useLiveFlightStore } from '../../store/liveFlightStore';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDateTime } from '../../utils/format';
import { LiveFrame } from '../../store/liveFlightStore';

interface Props {
  route: { params: { flightId: string } };
}

const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - spacing.md * 2 - spacing.xs * 2) / 3;
export function LiveFlightImagesScreen({ route }: Props) {
  const { flightId } = route.params;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { completedFlights, serverIp } = useLiveFlightStore();
  const flight = completedFlights.find((f) => f.id === flightId);
  const frames = flight?.frames ?? [];

  function imageUrl(frame: LiveFrame) {
    if (frame.path.startsWith('http://') || frame.path.startsWith('https://')) {
      return frame.path;
    }
    const base = serverIp.trim().replace(/\/+$/, '');
    return `${base}${frame.path}`;
  }

  const selected = selectedIndex !== null ? frames[selectedIndex] : null;

  return (
    <View style={styles.container}>
      {/* Stats header */}
      <View style={styles.header}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{frames.length}</Text>
          <Text style={styles.statLabel}>frames</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {flight?.startTs ? formatDateTime(flight.startTs).split(' ')[1] : '—'}
          </Text>
          <Text style={styles.statLabel}>início</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {flight?.endTs ? formatDateTime(flight.endTs).split(' ')[1] : '—'}
          </Text>
          <Text style={styles.statLabel}>fim</Text>
        </View>
      </View>

      {/* Grid de thumbnails */}
      <FlatList
        data={frames}
        keyExtractor={(item) => String(item.index)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <EmptyState
            title="Nenhuma imagem salva"
            description="O voo foi encerrado sem frames registrados."
            icon="📷"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.thumb}
            onPress={() => setSelectedIndex(item.index)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: imageUrl(item) }}
              style={styles.thumbImg}
              resizeMode="cover"
            />
            <View style={styles.thumbBadge}>
              <Text style={styles.thumbBadgeText}>#{item.index}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Lightbox */}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelectedIndex(null)}>
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setSelectedIndex(null)}>
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>

          {selected && (
            <>
              <Image
                source={{ uri: imageUrl(selected) }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <View style={styles.lightboxInfo}>
                <Text style={styles.lightboxInfoText}>Frame #{selected.index}</Text>
                <Text style={styles.lightboxInfoText}>{formatDateTime(selected.ts)}</Text>
              </View>
              <View style={styles.lightboxNav}>
                <TouchableOpacity
                  style={[styles.navBtn, selectedIndex === 0 && styles.navBtnDisabled]}
                  onPress={() => selectedIndex !== null && selectedIndex > 0 && setSelectedIndex(selectedIndex - 1)}
                  disabled={selectedIndex === 0}
                >
                  <Text style={styles.navBtnText}>‹ Anterior</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navBtn, selectedIndex === frames.length - 1 && styles.navBtnDisabled]}
                  onPress={() => selectedIndex !== null && selectedIndex < frames.length - 1 && setSelectedIndex(selectedIndex + 1)}
                  disabled={selectedIndex === frames.length - 1}
                >
                  <Text style={styles.navBtnText}>Próximo ›</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', backgroundColor: colors.surface,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.small, color: colors.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  grid: { padding: spacing.md, gap: spacing.xs },
  thumb: {
    width: THUMB_SIZE, height: THUMB_SIZE,
    marginRight: spacing.xs, marginBottom: spacing.xs,
    borderRadius: radius.sm, overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    ...shadows.sm,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 2, alignItems: 'center',
  },
  thumbBadgeText: { ...typography.small, color: '#fff', fontWeight: '600' },

  // Lightbox
  lightbox: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  lightboxClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  lightboxCloseText: { color: '#fff', fontSize: 18 },
  fullImage: { width: '100%', flex: 1 },
  lightboxInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  lightboxInfoText: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  lightboxNav: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.xl,
  },
  navBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { ...typography.bodyBold, color: '#fff' },
});
