import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../../api/services/alerts';
import { AlertCard } from '../../components/alerts/AlertCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../theme';
import { Alert as AlertType, AlertStatus } from '../../types';
import { alertStatusLabel } from '../../utils/format';

interface Props {
  navigation: any;
}

const STATUS_FILTERS: (AlertStatus | 'all')[] = ['all', 'pending', 'investigating', 'resolved'];
const filterLabel: Record<AlertStatus | 'all', string> = {
  all: 'Todos',
  ...alertStatusLabel,
};

export function AlertsScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<AlertStatus | 'all'>('all');

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['alerts', activeFilter],
    queryFn: () => getAlerts(activeFilter !== 'all' ? { status: activeFilter } : undefined),
  });

  function handleAlertPress(alert: AlertType) {
    navigation.navigate('AlertDetail', { alertId: alert.id });
  }

  if (isLoading) return <LoadingSpinner message="Carregando alertas..." />;

  return (
    <View style={styles.container}>
      {/* Filtros de status */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {filterLabel[item]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <AlertCard alert={item} onPress={handleAlertPress} />}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum alerta encontrado"
            description="Não há alertas nessa categoria no momento."
            icon="🔍"
          />
        }
        ListHeaderComponent={
          alerts && alerts.length > 0 ? (
            <Text style={styles.countText}>{alerts.length} alerta{alerts.length !== 1 ? 's' : ''}</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filtersContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  filterText: { ...typography.captionBold, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  countText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
});
