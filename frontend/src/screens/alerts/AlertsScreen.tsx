import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../../api/services/alerts';
import { AlertCard } from '../../components/alerts/AlertCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../theme';
import { Alert as AlertType } from '../../types';

interface Props {
  navigation: any;
}

type Filter = 'all' | 'unseen';

export function AlertsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const filtered = filter === 'unseen' ? alerts.filter((a) => !a.seen) : alerts;

  function handleAlertPress(alert: AlertType) {
    navigation.navigate('AlertDetail', { alertId: alert.id });
  }

  if (isLoading) return <LoadingSpinner message="Carregando alertas..." />;

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersRow}>
        {(['all', 'unseen'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'Todos' : 'Não vistos'}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>
          {filtered.length} alerta{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <AlertCard alert={item} onPress={handleAlertPress} />}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum alerta"
            description={filter === 'unseen' ? 'Todos os alertas já foram vistos.' : 'Nenhum alerta gerado ainda.'}
            icon="✅"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipText: { ...typography.captionBold, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  count: { ...typography.caption, color: colors.textDisabled, marginLeft: 'auto' },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
});
