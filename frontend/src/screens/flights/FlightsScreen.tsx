import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFlights } from '../../api/services/flights';
import { getMyFarm } from '../../api/services/farms';
import { FlightCard } from '../../components/flights/FlightCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography } from '../../theme';
import { Flight } from '../../types';

interface Props {
  navigation: any;
}

export function FlightsScreen({ navigation }: Props) {
  const { data: farm } = useQuery({ queryKey: ['farm'], queryFn: getMyFarm });
  const { data: flights, isLoading, refetch } = useQuery({
    queryKey: ['flights'],
    queryFn: () => getFlights(farm?.id),
    enabled: !!farm,
  });

  function handleFlightPress(flight: Flight) {
    navigation.navigate('FlightDetail', { flightId: flight.id });
  }

  if (isLoading) return <LoadingSpinner message="Carregando histórico..." />;

  return (
    <FlatList
      style={styles.container}
      data={flights}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <FlightCard flight={item} onPress={handleFlightPress} />}
      onRefresh={refetch}
      refreshing={false}
      ListEmptyComponent={
        <EmptyState
          title="Nenhum voo registrado"
          description="Inicie um voo ao vivo ou envie um vídeo para registrar o primeiro voo."
          icon="🚁"
        />
      }
      ListHeaderComponent={
        flights && flights.length > 0 ? (
          <Text style={styles.countText}>
            {flights.length} voo{flights.length !== 1 ? 's' : ''} registrado{flights.length !== 1 ? 's' : ''}
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  countText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
});
