import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { API_BASE } from '../../constants/api';

const LEARNIX_LOGO = '📚'; // Replace with actual logo asset

export default function LoginScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Phase: 'identifier' or 'password' (matches the Instagram flow in images)
  const [phase, setPhase] = useState<'identifier' | 'password'>('identifier');

  // Once username is confirmed we show avatar + name
  const avatarUrl = 'https://api.dicebear.com/8.x/avataaars/svg?seed=' + (identifier || 'learnix') + '&backgroundColor=b6e3f4';

  const handleNextPhase = () => {
    if (!identifier.trim()) {
      Alert.alert('Please enter your username, email, or phone number.');
      return;
    }
    setPhase('password');
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (json?.data?.accessToken) {
        // Store token (AsyncStorage in production)
        console.log('Logged in:', json.data);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login failed', json?.error?.detail || 'Incorrect password. Please try again.');
      }
    } catch (e) {
      // Simulate success for UI demo
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {phase === 'password' && (
              <TouchableOpacity onPress={() => setPhase('identifier')} style={styles.backBtn}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.logoText}>{LEARNIX_LOGO} Learnix</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          {phase === 'identifier' ? (
            <View style={styles.formSection}>
              {/* Logo/Branding */}
              <View style={styles.brandContainer}>
                <View style={styles.brandIconWrap}>
                  <Text style={{ fontSize: 56 }}>📚</Text>
                </View>
                <Text style={styles.brandTitle}>Learnix</Text>
                <Text style={styles.brandTagline}>AI-powered learning for KCSE & beyond</Text>
              </View>

              <Text style={styles.inputLabel}>Username, email or phone number</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                style={styles.textInput}
                placeholder="Username, email or phone"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={handleNextPhase}
              />

              <TouchableOpacity onPress={handleNextPhase} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Next</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgotten password?</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              {/* Social Logins */}
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>🔗</Text>
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialBtn, { marginTop: 10 }]}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>📱</Text>
                <Text style={styles.socialBtnText}>Continue with M-Pesa number</Text>
              </TouchableOpacity>

              {/* Sign up */}
              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Password phase — shows avatar + username like Instagram */
            <View style={styles.formSection}>
              <View style={styles.avatarSection}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                <Text style={styles.avatarUsername}>{identifier}</Text>
              </View>

              <View style={styles.passwordInputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.textInput, { paddingRight: 48 }]}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.passwordToggle}
                >
                  <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>
                    {showPassword ? '🔓' : '🔒'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryBtnText}>Log in</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgotten password?</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                onPress={() => setPhase('identifier')}
                style={styles.switchAccountBtn}
              >
                <Text style={styles.switchAccountText}>Switch account</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backBtn: { width: 40, padding: 4 },
  backArrow: { color: 'white', fontSize: 22 },
  logoText: { color: 'white', fontSize: 18, fontWeight: '800' },

  formSection: { flex: 1, justifyContent: 'center', paddingTop: 20 },

  brandContainer: { alignItems: 'center', marginBottom: 40 },
  brandIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.3)',
    marginBottom: 12,
  },
  brandTitle: { fontSize: 32, fontWeight: '900', color: 'white', marginBottom: 6 },
  brandTagline: { fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18 },

  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  textInput: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: 'white',
    fontSize: 15,
    marginBottom: 14,
  },
  passwordInputWrap: { position: 'relative' },
  passwordToggle: { position: 'absolute', right: 14, top: 15 },

  primaryBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },

  forgotBtn: { alignItems: 'center', marginBottom: 24 },
  forgotText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', marginHorizontal: 12 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  socialBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  signupText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  signupLink: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },

  // Password phase
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
  avatarUsername: { color: 'white', fontSize: 20, fontWeight: '800' },

  switchAccountBtn: { alignItems: 'center', paddingVertical: 14 },
  switchAccountText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
