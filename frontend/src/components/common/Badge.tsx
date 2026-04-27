import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertSeverity, AlertStatus } from '../../types';
import { colors, radius, typography } from '../../theme';

type BadgeVariant = AlertSeverity | AlertStatus | 'neutral';

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  critical: { bg: colors.dangerLight, text: colors.danger },
  warning: { bg: colors.warningLight, text: '#B45309' },
  info: { bg: colors.infoLight, text: colors.info },
  pending: { bg: colors.warningLight, text: '#B45309' },
  investigating: { bg: colors.infoLight, text: colors.info },
  resolved: { bg: colors.successLight, text: colors.primary },
  false_positive: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary },
};

interface Props {
  label: string;
  variant: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant, size = 'md' }: Props) {
  const style = variantStyles[variant] ?? variantStyles.neutral;
  return (
    <View style={[styles.base, { backgroundColor: style.bg }, size === 'sm' && styles.small]}>
      <Text style={[styles.text, { color: style.text }, size === 'sm' && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    ...typography.captionBold,
  },
  textSmall: {
    ...typography.small,
    fontWeight: '600',
  },
});
