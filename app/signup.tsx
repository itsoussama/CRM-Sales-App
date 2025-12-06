import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlus, Mail, Lock, User as UserIcon, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SignupScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    const result = await signup(name.trim(), email.trim(), password, role);
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        t('common.success'),
        t('auth.accountCreated'),
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } else {
      Alert.alert(t('auth.signupFailed'), result.error || t('auth.signupFailed'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <UserPlus size={48} color="#3B82F6" />
          </View>
          <Text style={styles.title}>{t('auth.createAccountTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.joinCrm')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <UserIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.fullName')}
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor="#6B7280"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>

          <TouchableOpacity
            style={styles.roleSelector}
            onPress={() => setShowRolePicker(!showRolePicker)}
          >
            <Text style={styles.roleLabel}>{t('auth.role')}</Text>
            <View style={styles.roleValue}>
              <Text style={styles.roleText}>{role === 'admin' ? t('auth.admin') : t('auth.user')}</Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {showRolePicker && (
            <View style={styles.rolePicker}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'user' && styles.roleOptionActive]}
                onPress={() => {
                  setRole('user');
                  setShowRolePicker(false);
                }}
              >
                <Text style={[styles.roleOptionText, role === 'user' && styles.roleOptionTextActive]}>
                  {t('auth.user')}
                </Text>
                <Text style={styles.roleOptionDesc}>{t('auth.standardAccess')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === 'admin' && styles.roleOptionActive]}
                onPress={() => {
                  setRole('admin');
                  setShowRolePicker(false);
                }}
              >
                <Text style={[styles.roleOptionText, role === 'admin' && styles.roleOptionTextActive]}>
                  {t('auth.admin')}
                </Text>
                <Text style={styles.roleOptionDesc}>{t('auth.fullAccess')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <UserPlus size={20} color="#FFFFFF" />
            <Text style={styles.signupButtonText}>
              {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginButtonText}>{t('auth.alreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  roleSelector: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  roleValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  rolePicker: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  roleOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  roleOptionActive: {
    backgroundColor: '#1E3A8A',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleOptionTextActive: {
    color: '#3B82F6',
  },
  roleOptionDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
  },
  loginButton: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
});
