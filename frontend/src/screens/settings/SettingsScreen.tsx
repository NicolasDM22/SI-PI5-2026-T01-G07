import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/services/auth';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const roleLabel: Record<string, string> = {
  manager: 'Gestor',
  vet: 'Veterinário',
  operator: 'Operador',
};

export function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          clearAuth();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileRole}>{roleLabel[user?.role ?? ''] ?? user?.role}</Text>
        </View>
      </View>

      {/* Seções de config */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        <View style={styles.optionsCard}>
          <SettingRow label="Alertas críticos" hint="Receber push imediatamente" value="Ativado" />
          <SettingRow label="Alertas de atenção" hint="Receber push para alertas de nível médio" value="Ativado" />
          <SettingRow label="Conclusão de voo" hint="Notificar quando o processamento terminar" value="Ativado" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.optionsCard}>
          <SettingRow label="Versão do app" value="1.0.0" />
          <SettingRow label="Fazenda vinculada" value="Fazenda Santa Clara" />
          <SettingRow label="Ambiente" value="Desenvolvimento (mock)" />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface SettingRowProps {
  label: string;
  hint?: string;
  value?: string;
}

function SettingRow({ label, hint, value }: SettingRowProps) {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.labelGroup}>
        <Text style={rowStyles.label}>{label}</Text>
        {hint && <Text style={rowStyles.hint}>{hint}</Text>}
      </View>
      {value && <Text style={rowStyles.value}>{value}</Text>}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  labelGroup: { flex: 1, gap: 2 },
  label: { ...typography.body, color: colors.textPrimary },
  hint: { ...typography.small, color: colors.textDisabled },
  value: { ...typography.captionBold, color: colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  profileCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.textInverse },
  profileName: { ...typography.h3, color: colors.textInverse },
  profileEmail: { ...typography.caption, color: 'rgba(255,255,255,0.75)' },
  profileRole: {
    ...typography.captionBold,
    color: colors.accentLight,
    marginTop: 2,
  },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.captionBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutText: { ...typography.bodyBold, color: colors.danger },
});
