import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { API_BASE } from '../../constants/api';

export default function AccountPrivacyScreen() {
  const router = useRouter();
  const [isPrivate, setIsPrivate] = useState(false);

  const handleToggle = async (value: boolean) => {
    setIsPrivate(value);
    // PATCH to API
    try {
      const token = ''; // replace with stored token
      await fetch(`${API_BASE}/profiles/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ privacyMode: value ? 'PRIVATE' : 'PUBLIC' }),
      });
    } catch (e) {
      console.warn('Privacy toggle API call failed (offline mode)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Private account</Text>
          <Switch
            value={isPrivate}
            onValueChange={handleToggle}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#3B82F6' }}
            thumbColor="white"
            ios_backgroundColor="rgba(255,255,255,0.15)"
          />
        </View>

        {/* Descriptions */}
        <View style={styles.descBox}>
          <Text style={styles.descText}>
            When your account is <Text style={styles.bold}>public</Text>, your profile and posts can be seen by anyone on or off Learnix, even if they don't have an account.
          </Text>
          <View style={{ height: 16 }} />
          <Text style={styles.descText}>
            When your account is <Text style={styles.bold}>private</Text>, only the followers you approve can see what you share, including your study posts, clips, and following lists. Certain info on your profile, such as your profile picture and username, is visible to everyone. <Text style={{ color: '#3B82F6' }}>Learn more</Text>
          </Text>
        </View>

        {/* Extra options when private */}
        {isPrivate && (
          <View style={styles.privateOptions}>
            <Text style={styles.privateOptionsTitle}>While private:</Text>
            {[
              { icon: '✅', text: 'New follower requests must be approved by you' },
              { icon: '✅', text: 'Current approved followers keep access' },
              { icon: '✅', text: 'Your study content won\'t appear in explore' },
            ].map((item, i) => (
              <View key={i} style={styles.privateOptionRow}>
                <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>
                <Text style={styles.privateOptionText}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40 },
  backArrow: { color: 'white', fontSize: 22 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  toggleLabel: { color: 'white', fontSize: 16, fontWeight: '500' },

  descBox: { paddingTop: 20 },
  descText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20 },
  bold: { color: 'white', fontWeight: '600' },

  privateOptions: { marginTop: 24, backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  privateOptionsTitle: { color: '#60A5FA', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  privateOptionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  privateOptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 18, flex: 1 },
});
