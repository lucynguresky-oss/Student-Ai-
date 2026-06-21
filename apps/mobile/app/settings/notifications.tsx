import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';

type NotifPref = {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
};

const INITIAL_PREFS: NotifPref[] = [
  { key: 'likes', label: 'Likes', desc: 'When someone likes your study posts or clips', enabled: true },
  { key: 'comments', label: 'Comments', desc: 'When someone comments on your content', enabled: true },
  { key: 'follow', label: 'New followers', desc: 'When someone follows you', enabled: true },
  { key: 'ai_digest', label: 'AI daily digest', desc: 'Get your personalised study plan reminder each morning', enabled: true },
  { key: 'streak', label: 'Streak reminders', desc: 'Keep your study streak alive with daily nudges', enabled: true },
  { key: 'live', label: 'Live sessions', desc: 'When a teacher or creator you follow goes live', enabled: false },
  { key: 'messages', label: 'Direct messages', desc: 'When you receive a new message', enabled: true },
  { key: 'promos', label: 'Promotions', desc: 'News, updates, and offers from Learnix', enabled: false },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(INITIAL_PREFS);

  const toggle = (key: string, value: boolean) => {
    setPrefs(p => p.map(item => item.key === key ? { ...item, enabled: value } : item));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={styles.sectionLabel}>Push notifications</Text>
        <View style={styles.block}>
          {prefs.map((pref, i) => (
            <View key={pref.key} style={[styles.row, i < prefs.length - 1 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{pref.label}</Text>
                <Text style={styles.rowDesc}>{pref.desc}</Text>
              </View>
              <Switch
                value={pref.enabled}
                onValueChange={v => toggle(pref.key, v)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#3B82F6' }}
                thumbColor="white"
                ios_backgroundColor="rgba(255,255,255,0.12)"
              />
            </View>
          ))}
        </View>
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

  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 16, paddingVertical: 12 },
  block: { backgroundColor: '#1C1C1E', marginHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLabel: { color: 'white', fontSize: 14.5, fontWeight: '500', marginBottom: 2 },
  rowDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 16 },
});
