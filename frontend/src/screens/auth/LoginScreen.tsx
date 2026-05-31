import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { login } from '../../api/services/auth';
import { colors, radius, shadows, spacing, typography } from '../../theme';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await login({ email, password });
      setAuth(user, token);
    } catch {
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Text style={styles.logoEmoji}>🐄</Text>
        <Text style={styles.logoTitle}>AgriMonitor</Text>
        <Text style={styles.logoSubtitle}>Monitoramento aéreo de rebanhos</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Entrar na sua conta</Text>

        {error !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.buttonText}>Entrar</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.navigate('Register')} style={styles.linkRow}>
          <Text style={styles.linkText}>Ainda não tem conta? </Text>
          <Text style={[styles.linkText, styles.linkBold]}>Criar conta</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>AgriMonitor © 2025</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    padding: spacing.lg,
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
