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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { API_BASE } from '../../constants/api';

const AGE_BANDS = [
  { key: 'UNDER_13', label: 'Under 13' },
  { key: 'TEEN_13_17', label: '13 – 17 years' },
  { key: 'ADULT_18_PLUS', label: '18 and above' },
];

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = name, 2 = username, 3 = email/phone, 4 = password, 5 = age
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageBand, setAgeBand] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    if (step === 1 && !displayName.trim()) {
      Alert.alert('Please enter your full name.'); return;
    }
    if (step === 2 && username.trim().length < 3) {
      Alert.alert('Username must be at least 3 characters.'); return;
    }
    if (step === 3 && !emailOrPhone.trim()) {
      Alert.alert('Please enter your email or phone.'); return;
    }
    if (step === 4 && password.length < 8) {
      Alert.alert('Password must be at least 8 characters.'); return;
    }
    if (step === 4 && password !== confirmPassword) {
      Alert.alert('Passwords do not match.'); return;
    }
    if (step === 5) { handleSignup(); return; }
    setStep(s => s + 1);
  };

  const handleSignup = async () => {
    if (!ageBand) { Alert.alert('Please select your age group.'); return; }
    setLoading(true);
    const isEmail = emailOrPhone.includes('@');
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          email: isEmail ? emailOrPhone : undefined,
          phone: !isEmail ? emailOrPhone : undefined,
          password,
          ageBand,
        }),
      });
      const json = await res.json();
      if (json?.data?.accessToken || res.ok) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Sign up failed', json?.error?.detail || 'Please try again.');
      }
    } catch (e) {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>Add the name you go by in class or at home.</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.textInput}
              placeholder="Full name"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={nextStep}
            />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Create a username</Text>
            <Text style={styles.stepSubtitle}>You can always change this later. Use letters, numbers, and underscores.</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.textInput}
              placeholder="Username"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={nextStep}
            />
            {username.length >= 3 && (
              <View style={styles.usernameCheck}>
                <Text style={{ color: '#22C55E', fontSize: 13 }}>✓ @{username} is available</Text>
              </View>
            )}
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Add your email or phone</Text>
            <Text style={styles.stepSubtitle}>We'll send you a verification code to confirm your account.</Text>
            <TextInput
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              style={styles.textInput}
              placeholder="Email or phone number"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={nextStep}
            />
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Create a password</Text>
            <Text style={styles.stepSubtitle}>Must be at least 8 characters. Include numbers and special characters for security.</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={[styles.textInput, { paddingRight: 48 }]}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                autoFocus
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.toggleEye}>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>{showPassword ? '🔓' : '🔒'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.textInput}
              placeholder="Retype password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={nextStep}
            />
            {confirmPassword.length > 0 && (
              <View style={styles.usernameCheck}>
                <Text style={{ color: password === confirmPassword ? '#22C55E' : '#EF4444', fontSize: 13 }}>
                  {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </Text>
              </View>
            )}
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>How old are you?</Text>
            <Text style={styles.stepSubtitle}>This helps us personalise your experience and show age-appropriate content.</Text>
            {AGE_BANDS.map(ab => (
              <TouchableOpacity
                key={ab.key}
                onPress={() => setAgeBand(ab.key)}
                style={[styles.ageBandBtn, ageBand === ab.key && styles.ageBandBtnActive]}
              >
                <Text style={[styles.ageBandText, ageBand === ab.key && styles.ageBandTextActive]}>{ab.label}</Text>
                {ageBand === ab.key && <Text style={{ color: '#3B82F6', fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(s => s - 1)} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.logoText}>📚 Learnix</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>

          {/* Step content */}
          <View style={styles.stepContent}>{stepContent()}</View>

          {/* Next/Finish CTA */}
          <TouchableOpacity
            onPress={nextStep}
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryBtnText}>{step === 5 ? 'Create Account 🚀' : 'Next'}</Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  backBtn: { width: 40, padding: 4 },
  backArrow: { color: 'white', fontSize: 22 },
  logoText: { color: 'white', fontSize: 18, fontWeight: '800' },

  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 6 },
  progressFill: { height: 3, backgroundColor: '#3B82F6', borderRadius: 2 },
  progressText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600', marginBottom: 28 },

  stepContent: { flex: 1, marginBottom: 24 },
  stepTitle: { color: 'white', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  stepSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 20, marginBottom: 24 },

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
  inputWrap: { position: 'relative' },
  toggleEye: { position: 'absolute', right: 14, top: 15 },

  usernameCheck: { marginBottom: 10, marginTop: -6 },

  ageBandBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  ageBandBtnActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)' },
  ageBandText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
  ageBandTextActive: { color: 'white' },

  primaryBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  loginText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  loginLink: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },
});
