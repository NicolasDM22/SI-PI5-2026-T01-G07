import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { register } from '../../api/services/auth';
import { colors, radius, shadows, spacing, typography } from '../../theme';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
}

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleRegister() {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim() || !farmName.trim()) {
      setError('Preencha todos os campos para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      setError('A senha e a confirmação não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await register({ name, email, password, farmName });
      setAuth(user, token);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail === 'E-mail já cadastrado') {
        setError('E-mail já cadastrado. Tente fazer login ou use outro e-mail.');
      } else {
        setError('Não foi possível criar sua conta. Verifique se o servidor está rodando.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>🐄</Text>
          <Text style={styles.logoTitle}>AgriMonitor</Text>
          <Text style={styles.logoSubtitle}>Monitoramento aéreo de rebanhos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Criar conta</Text>

          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome da fazenda</Text>
            <TextInput
              style={styles.input}
              value={farmName}
              onChangeText={setFarmName}
              placeholder="Ex: Fazenda Santa Clara"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.buttonText}>Criar conta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation?.navigate('Login')} style={styles.linkRow}>
            <Text style={styles.linkText}>Já tem conta? </Text>
            <Text style={[styles.linkText, styles.linkBold]}>Entrar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>AgriMonitor © 2025</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  container: { flex: 1, backgroundColor: colors.primary },
  inner: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  logoArea: { alignItems: 'center', gap: spacing.xs },
  logoEmoji: { fontSize: 56 },
  logoTitle: { ...typography.h1, color: colors.textInverse, fontSize: 32 },
  logoSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.75)' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: { ...typography.caption, color: colors.danger },
  fieldGroup: { gap: spacing.xs },
  label: { ...typography.captionBold, color: colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { ...typography.bodyBold, color: colors.textInverse },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  linkText: { ...typography.small, color: colors.textSecondary },
  linkBold: { fontSize: 11, fontWeight: '600' as const, color: colors.primary },
  footer: {
    ...typography.small,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
