import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/services/auth';
import { getMyFarm, getPastures, createPasture, updatePasture, deletePasture } from '../../api/services/farms';
import { Pasture } from '../../types';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const roleLabel: Record<string, string> = {
  manager: 'Gestor',
  vet: 'Veterinário',
  operator: 'Operador',
};

export function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();

  const { data: farm, refetch: refetchFarm } = useQuery({
    queryKey: ['farm'],
    queryFn: getMyFarm,
  });
  const { data: pastures = [], refetch: refetchPastures } = useQuery({
    queryKey: ['pastures', farm?.id],
    queryFn: () => getPastures(farm!.id),
    enabled: !!farm?.id,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCount, setFormCount] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  function openAdd() {
    setEditingId(null);
    setFormName('');
    setFormCount('');
    setFormError('');
    setShowForm(true);
  }

  function openEdit(pasture: Pasture) {
    setEditingId(pasture.id);
    setFormName(pasture.name);
    setFormCount(String(pasture.expectedCount));
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError('Informe o nome do pasto.'); return; }
    const count = parseInt(formCount, 10);
    if (!formCount.trim() || isNaN(count)) { setFormError('Informe a quantidade de animais esperados.'); return; }
    if (count <= 0) { setFormError('Quantidade de animais deve ser maior que zero.'); return; }
    if (!farm) return;
    setFormLoading(true);
    setFormError('');
    try {
      if (editingId) {
        await updatePasture(farm.id, editingId, { name: formName.trim(), expectedCount: count });
      } else {
        await createPasture(farm.id, { name: formName.trim(), expectedCount: count });
      }
      await Promise.all([refetchPastures(), refetchFarm()]);
      closeForm();
    } catch {
      setFormError('Erro ao salvar. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(pastureId: string) {
    if (!farm) return;
    try {
      await deletePasture(farm.id, pastureId);
      setDeletingId(null);
      await Promise.all([refetchPastures(), refetchFarm()]);
    } catch { /* silent */ }
  }

  async function handleLogout() {
    await logout();
    clearAuth();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileRole}>{roleLabel[user?.role ?? ''] ?? user?.role}</Text>
        </View>
      </View>

      {/* Pastos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pastos</Text>
          {!showForm && (
            <TouchableOpacity onPress={openAdd} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.optionsCard}>
          {pastures.length === 0 && !showForm && (
            <Text style={styles.emptyText}>Nenhum pasto cadastrado.</Text>
          )}

          {pastures.map((pasture, index) => {
            const isLast = index === pastures.length - 1;

            if (deletingId === pasture.id) {
              return (
                <View key={pasture.id} style={[styles.confirmRow, !isLast && styles.rowBorder]}>
                  <Text style={styles.confirmText}>Remover "{pasture.name}"?</Text>
                  <View style={styles.confirmActions}>
                    <TouchableOpacity onPress={() => handleDelete(pasture.id)} style={styles.confirmYes}>
                      <Text style={styles.confirmYesText}>Remover</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeletingId(null)} style={styles.confirmNo}>
                      <Text style={styles.confirmNoText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            if (editingId === pasture.id && showForm) {
              return (
                <View key={pasture.id} style={!isLast && styles.rowBorder}>
                  <PastureForm
                    title="Editar pasto"
                    name={formName}
                    count={formCount}
                    loading={formLoading}
                    error={formError}
                    onChangeName={setFormName}
                    onChangeCount={setFormCount}
                    onSave={handleSave}
                    onCancel={closeForm}
                  />
                </View>
              );
            }

            return (
              <View key={pasture.id} style={[styles.pastureRow, !isLast && styles.rowBorder]}>
                <View style={styles.pastureInfo}>
                  <Text style={styles.pastureName}>{pasture.name}</Text>
                  <Text style={styles.pastureCount}>{pasture.expectedCount} animais esperados</Text>
                </View>
                <View style={styles.pastureActions}>
                  <TouchableOpacity onPress={() => openEdit(pasture)} style={styles.iconButton}>
                    <Text style={styles.iconEdit}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeletingId(pasture.id)} style={styles.iconButton}>
                    <Text style={styles.iconDelete}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {showForm && !editingId && (
            <View style={pastures.length > 0 ? styles.rowBorder : undefined}>
              <PastureForm
                title="Novo pasto"
                name={formName}
                count={formCount}
                loading={formLoading}
                error={formError}
                onChangeName={setFormName}
                onChangeCount={setFormCount}
                onSave={handleSave}
                onCancel={closeForm}
              />
            </View>
          )}
        </View>
      </View>

      {/* Sobre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.optionsCard}>
          <SettingRow label="Versão do app" value="1.0.0" />
          <SettingRow label="Fazenda" value={farm?.name ?? '—'} />
          <SettingRow label="Total de animais" value={farm ? `${farm.totalAnimals}` : '—'} last />
        </View>
      </View>

      {/* Logout */}
      {logoutConfirm ? (
        <View style={styles.logoutConfirmBox}>
          <Text style={styles.logoutConfirmText}>Deseja sair da sua conta?</Text>
          <View style={styles.logoutActions}>
            <TouchableOpacity style={styles.logoutConfirmYes} onPress={handleLogout}>
              <Text style={styles.logoutYesText}>Sair</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutConfirmNo} onPress={() => setLogoutConfirm(false)}>
              <Text style={styles.logoutNoText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutConfirm(true)} activeOpacity={0.85}>
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Subcomponentes ────────────────────────────────────────────────────────────

interface PastureFormProps {
  title: string;
  name: string;
  count: string;
  loading: boolean;
  error: string;
  onChangeName: (v: string) => void;
  onChangeCount: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function PastureForm({ title, name, count, loading, error, onChangeName, onChangeCount, onSave, onCancel }: PastureFormProps) {
  return (
    <View style={formStyles.container}>
      <Text style={formStyles.title}>{title}</Text>
      {error !== '' && <Text style={formStyles.error}>{error}</Text>}
      <View style={formStyles.field}>
        <Text style={formStyles.label}>Nome do pasto</Text>
        <TextInput
          style={formStyles.input}
          value={name}
          onChangeText={onChangeName}
          placeholder="Ex: Pasto Norte"
          placeholderTextColor={colors.textDisabled}
          autoCapitalize="words"
        />
      </View>
      <View style={formStyles.field}>
        <Text style={formStyles.label}>Animais esperados *</Text>
        <TextInput
          style={formStyles.input}
          value={count}
          onChangeText={onChangeCount}
          placeholder="Ex: 50"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
        />
      </View>
      <View style={formStyles.actions}>
        <TouchableOpacity style={formStyles.saveButton} onPress={onSave} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.textInverse} size="small" />
            : <Text style={formStyles.saveText}>Salvar</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={formStyles.cancelButton} onPress={onCancel} activeOpacity={0.85}>
          <Text style={formStyles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SettingRowProps {
  label: string;
  hint?: string;
  value?: string;
  last?: boolean;
}

function SettingRow({ label, hint, value, last }: SettingRowProps) {
  return (
    <View style={[rowStyles.container, !last && rowStyles.border]}>
      <View style={rowStyles.labelGroup}>
        <Text style={rowStyles.label}>{label}</Text>
        {hint && <Text style={rowStyles.hint}>{hint}</Text>}
      </View>
      {value && <Text style={rowStyles.value}>{value}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const rowStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  border: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  labelGroup: { flex: 1, gap: 2 },
  label: { ...typography.body, color: colors.textPrimary },
  hint: { ...typography.small, color: colors.textDisabled },
  value: { ...typography.captionBold, color: colors.textSecondary },
});

const formStyles = StyleSheet.create({
  container: { paddingVertical: spacing.md, gap: spacing.sm },
  title: { ...typography.captionBold, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
  field: { gap: 4 },
  label: { ...typography.captionBold, color: colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  saveText: { ...typography.bodyBold, color: colors.textInverse },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  cancelText: { ...typography.bodyBold, color: colors.textSecondary },
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
    width: 56, height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.textInverse },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: colors.textInverse },
  profileEmail: { ...typography.caption, color: 'rgba(255,255,255,0.75)' },
  profileRole: { ...typography.captionBold, color: colors.accentLight, marginTop: 2 },
  section: { gap: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.captionBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  addButtonText: { ...typography.captionBold, color: colors.textInverse },
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  emptyText: { ...typography.caption, color: colors.textDisabled, paddingVertical: spacing.md, textAlign: 'center' },
  pastureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pastureInfo: { flex: 1 },
  pastureName: { ...typography.bodyBold, color: colors.textPrimary },
  pastureCount: { ...typography.small, color: colors.textSecondary },
  pastureActions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 6 },
  iconEdit: { fontSize: 16 },
  iconDelete: { fontSize: 16 },
  confirmRow: { paddingVertical: spacing.sm, gap: spacing.xs },
  confirmText: { ...typography.caption, color: colors.textPrimary },
  confirmActions: { flexDirection: 'row', gap: spacing.sm },
  confirmYes: {
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  confirmYesText: { ...typography.captionBold, color: colors.textInverse },
  confirmNo: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  confirmNoText: { ...typography.captionBold, color: colors.textSecondary },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutButtonText: { ...typography.bodyBold, color: colors.danger },
  logoutConfirmBox: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  logoutConfirmText: { ...typography.body, color: colors.textPrimary },
  logoutActions: { flexDirection: 'row', gap: spacing.sm },
  logoutConfirmYes: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  logoutYesText: { ...typography.bodyBold, color: colors.textInverse },
  logoutConfirmNo: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  logoutNoText: { ...typography.bodyBold, color: colors.textSecondary },
});
