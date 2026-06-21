import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const avatarUrl = 'https://api.dicebear.com/8.x/avataaars/svg?seed=amina&backgroundColor=b6e3f4';

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionTitleBox}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

type SecurityRow = { label: string; icon?: string; chevron?: boolean; onPress?: () => void };

function SecurityBlock({ rows }: { rows: SecurityRow[] }) {
  return (
    <View style={styles.block}>
      {rows.map((row, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.blockRow, i < rows.length - 1 && styles.blockRowBorder]}
          onPress={row.onPress}
        >
          <Text style={styles.blockRowLabel}>{row.label}</Text>
          {row.chevron !== false && <Text style={styles.blockRowChevron}>›</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SecurityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password and security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Accounts Centre card */}
        <View style={styles.centreCard}>
          <View style={styles.centreCardLeft}>
            <View style={styles.centreIcon}>
              <Text style={{ fontSize: 20 }}>🛡️</Text>
            </View>
            <View>
              <Text style={styles.centreTitle}>Accounts Centre</Text>
              <Text style={styles.centreDesc}>
                Manage your connected experiences and account settings across Learnix.
              </Text>
              <TouchableOpacity>
                <Text style={styles.centreLearnMore}>Learn more</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile preview */}
          <TouchableOpacity style={styles.profilePreviewRow} onPress={() => router.push('/settings/change-password')}>
            <Image source={{ uri: avatarUrl }} style={styles.profilePreviewAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profilePreviewName}>amina_learns</Text>
              <Text style={styles.profilePreviewPlatform}>🎓 Learnix</Text>
            </View>
            <Text style={styles.blockRowChevron}>›</Text>
          </TouchableOpacity>

          {/* Accounts centre menu */}
          <SecurityBlock
            rows={[
              { label: '🧑 Profiles and personal details', onPress: () => {} },
              { label: '🔒 Password and security', onPress: () => {} },
              { label: '🔗 Connected experiences', onPress: () => {} },
              { label: '📋 Your information and permissions', onPress: () => {} },
              { label: '📣 Ad preferences', onPress: () => {} },
              { label: '💳 Learnix Pay', onPress: () => router.push('/upgrade') },
              { label: '⭐ Subscriptions', onPress: () => router.push('/upgrade') },
              { label: '👤 Manage accounts', onPress: () => {} },
            ]}
          />
        </View>

        {/* Login & Recovery */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <SectionTitle
            title="Login & recovery"
            subtitle="Manage your passwords, login preferences and recovery methods."
          />
          <SecurityBlock
            rows={[
              { label: 'Change password', onPress: () => router.push('/settings/change-password') },
              { label: 'Two-factor authentication' },
              { label: 'Verification selfie' },
              { label: 'Saved login' },
            ]}
          />
        </View>

        {/* Security checks */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <SectionTitle
            title="Security checks"
            subtitle="Review security issues by running checks across apps, devices and emails sent."
          />
          <SecurityBlock
            rows={[
              { label: 'Where you\'re logged in' },
              { label: 'Recent emails' },
              { label: 'Security Checkup' },
            ]}
          />
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

  centreCard: { margin: 16, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  centreCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  centreIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center' },
  centreTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  centreDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12.5, lineHeight: 17, maxWidth: 220 },
  centreLearnMore: { color: '#3B82F6', fontSize: 12.5, fontWeight: '600', marginTop: 4 },

  profilePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  profilePreviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  profilePreviewName: { color: 'white', fontSize: 14.5, fontWeight: '700' },
  profilePreviewPlatform: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  sectionTitleBox: { marginBottom: 10 },
  sectionTitleText: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 17 },

  block: { backgroundColor: '#1C1C1E', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
  blockRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  blockRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  blockRowLabel: { color: 'white', fontSize: 14.5, flex: 1 },
  blockRowChevron: { color: 'rgba(255,255,255,0.3)', fontSize: 22 },
});
