import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) { Alert.alert('Please enter your current password.'); return; }
    if (newPassword.length < 8) { Alert.alert('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('New passwords do not match.'); return; }

    setLoading(true);
    try {
      // Call API
      await new Promise(r => setTimeout(r, 1500)); // Simulate
      Alert.alert('Success', 'Your password has been changed successfully.');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Context */}
          <Text style={styles.accountContext}>amina_learns · Learnix</Text>
          <Text style={styles.title}>Change password</Text>
          <Text style={styles.subtitle}>
            Your password must be at least 8 characters and should include a combination of numbers, letters and special characters (!$@%).
          </Text>

          {/* Current password */}
          <View style={styles.inputWrap}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showCurrent ? '🔓' : '🔒'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Forgotten your password?</Text>
          </TouchableOpacity>

          {/* New password */}
          <View style={styles.inputWrap}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showNew ? '🔓' : '🔒'}</Text>
            </TouchableOpacity>
          </View>

          {/* Retype */}
          <View style={styles.inputWrap}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              placeholder="Retype new password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry
            />
          </View>

          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <Text style={{ color: newPassword === confirmPassword ? '#22C55E' : '#EF4444', fontSize: 12, marginBottom: 12, marginTop: -4 }}>
              {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
            </Text>
          )}

          {/* Logout other devices */}
          <View style={styles.logoutRow}>
            <View style={styles.logoutCheckbox}>
              <Switch
                value={logoutOtherDevices}
                onValueChange={setLogoutOtherDevices}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#3B82F6' }}
                thumbColor="white"
                style={{ transform: [{ scale: 0.85 }] }}
              />
            </View>
            <Text style={styles.logoutRowText}>
              Log out of other devices. Choose this if someone else used your account.
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={handleChangePassword}
            style={[styles.changeBtn, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="rgba(255,255,255,0.6)" />
            ) : (
              <Text style={styles.changeBtnText}>Change password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40 },
  backArrow: { color: 'white', fontSize: 22 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700' },

  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  accountContext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 6 },
  title: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 19, marginBottom: 24 },

  inputWrap: { position: 'relative', marginBottom: 14 },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48,
    color: 'white',
    fontSize: 15,
  },
  eyeBtn: { position: 'absolute', right: 14, top: 15 },
  eyeIcon: { fontSize: 16 },

  forgotLink: { marginBottom: 18, marginTop: -6 },
  forgotLinkText: { color: '#3B82F6', fontSize: 13.5, fontWeight: '600' },

  logoutRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  logoutCheckbox: { paddingTop: 2 },
  logoutRowText: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 13.5, lineHeight: 19 },

  ctaContainer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  changeBtn: { backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  changeBtnText: { color: 'rgba(255,255,255,0.35)', fontSize: 16, fontWeight: '600' },
});
