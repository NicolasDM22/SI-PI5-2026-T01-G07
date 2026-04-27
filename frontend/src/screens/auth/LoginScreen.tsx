import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { login } from '../../api/services/auth';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export function LoginScreen() {
  const [email, setEmail] = useState('joao@fazenda.com');
  const [password, setPassword] = useState('senha123');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha para continuar.');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await login({ email, password });
      setAuth(user, token);
    } catch {
      Alert.alert('Erro ao entrar', 'E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>🐄</Text>
          <Text style={styles.logoTitle}>AgriMonitor</Text>
          <Text style={styles.logoSubtitle}>Monitoramento aéreo de rebanhos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar na sua conta</Text>

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
        </View>

        <Text style={styles.footer}>Fazenda Santa Clara © 2025</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  logoArea: { alignItems: 'center', gap: spacing.xs },
  logoEmoji: { fontSize: 56 },
  logoTitle: {
    ...typography.h1,
    color: colors.textInverse,
    fontSize: 32,
  },
  logoSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
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
  footer: {
    ...typography.small,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
