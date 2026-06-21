import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

/**
 * index.tsx – The app entry point.
 * Checks if user is logged in (has a stored token).
 * If yes → redirect to (tabs).
 * If no → show welcome screen with Login / Sign up options.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // In production: check AsyncStorage for stored token
    // For now we always show login (no stored token)
    try {
      // Simulate a quick auth check delay
      await new Promise(r => setTimeout(r, 600));
      
      // If token exists, go straight to app:
      // const token = await AsyncStorage.getItem('token');
      // if (token) { router.replace('/(tabs)'); return; }
    } catch (e) {
      // No token, show welcome
    }
    
    setChecking(false);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.splashLogo}>📚</Text>
        <Text style={styles.splashTitle}>Learnix</Text>
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Hero branding */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>📚</Text>
          </View>
          <Text style={styles.heroTitle}>Learnix</Text>
          <Text style={styles.heroSubtitle}>
            AI-powered learning for KCSE{'\n'}& beyond 🇰🇪
          </Text>

          {/* Feature pills */}
          <View style={styles.pillsRow}>
            {['🤖 AI Tutor', '📄 Past Papers', '🎬 Clips', '📊 Quizzes'].map(pill => (
              <View key={pill} style={styles.pill}>
                <Text style={styles.pillText}>{pill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Social proof */}
        <View style={styles.socialProof}>
          <View style={styles.avatarStack}>
            {['🟦', '🟩', '🟨', '🟧'].map((c, i) => (
              <View
                key={i}
                style={[
                  styles.stackAvatar,
                  { backgroundColor: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444'][i], left: i * 18 },
                ]}
              >
                <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>
                  {['A', 'B', 'C', 'D'][i]}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.socialProofText}>
            Join <Text style={{ color: 'white', fontWeight: '700' }}>50,000+</Text> students
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => router.push('/auth/signup')}
            style={styles.signupBtn}
          >
            <Text style={styles.signupBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Social logins */}
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>🔗</Text>
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, { marginTop: 10 }]}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>📱</Text>
            <Text style={styles.socialBtnText}>Continue with M-Pesa</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By signing up, you agree to our{' '}
          <Text style={{ color: '#3B82F6' }}>Terms</Text> and{' '}
          <Text style={{ color: '#3B82F6' }}>Privacy Policy</Text>.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: { fontSize: 64, marginBottom: 12 },
  splashTitle: { color: 'white', fontSize: 28, fontWeight: '900' },

  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  heroSection: { alignItems: 'center', marginBottom: 28 },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: 'white', marginBottom: 8 },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 12,
  },
  avatarStack: { flexDirection: 'row', width: 80, height: 28, position: 'relative' },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  socialProofText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  ctaSection: { marginBottom: 20 },
  signupBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signupBtnText: { color: 'white', fontSize: 17, fontWeight: '800' },

  loginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', marginHorizontal: 14 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  socialBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },

  footer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
  },
});
