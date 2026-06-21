import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';

type SettingsRow = {
  label: string;
  icon: string;
  desc?: string;
  badge?: string | number;
  onPress?: () => void;
  danger?: boolean;
  blue?: boolean;
};

function SettingsSection({
  title,
  rows,
}: {
  title?: string;
  rows: SettingsRow[];
}) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionLabel}>{title}</Text>}
      <View style={styles.sectionBox}>
        {rows.map((row, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
            onPress={row.onPress}
          >
            <Text style={styles.rowIcon}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, row.danger && { color: '#EF4444' }, row.blue && { color: '#3B82F6' }]}>
                {row.label}
              </Text>
              {row.desc && <Text style={styles.rowDesc}>{row.desc}</Text>}
            </View>
            {row.badge !== undefined && (
              <Text style={styles.rowBadge}>{row.badge}</Text>
            )}
            {!row.danger && !row.blue && <Text style={styles.rowChevron}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    // Clear stored tokens
    await new Promise(r => setTimeout(r, 800));
    setLoggingOut(false);
    setLogoutModalVisible(false);
    router.replace('/auth/login');
  };

  const allRows = [
    // Accounts Centre
    { label: 'Accounts Centre', icon: '👤', desc: 'Password, security, personal details, connected experiences, ad preferences' },
    // How you use
    { label: 'Saved', icon: '🔖' },
    { label: 'Archive', icon: '🕔' },
    { label: 'Your activity', icon: '📊' },
    { label: 'Notifications', icon: '🔔', onPress: () => router.push('/settings/notifications') },
    { label: 'Time management', icon: '⏱️' },
    // Who can see content
    { label: 'Account privacy', icon: '🔒', badge: 'Public', onPress: () => router.push('/settings/privacy') },
    { label: 'Close Friends', icon: '⭐', badge: 0, onPress: () => router.push('/settings/close-friends') },
    { label: 'Blocked', icon: '🚫', badge: 0 },
    // How others interact
    { label: 'Messages and story replies', icon: '💬' },
    { label: 'Tags and mentions', icon: '@️' },
    { label: 'Comments', icon: '💭' },
    { label: 'Sharing and reuse', icon: '↩️' },
    { label: 'Restricted', icon: '🔕', badge: 0 },
    { label: 'Limit interactions', icon: '⚠️', badge: 'Off' },
    { label: 'Hidden words', icon: '🔤' },
    { label: 'Follow and invite friends', icon: '➕👤' },
    // What you see
    { label: 'Favourites', icon: '♡', badge: 0 },
    { label: 'Muted accounts', icon: '🔇', badge: 0 },
    { label: 'Content preferences', icon: '📌' },
    { label: 'Like and share counts', icon: '❤️' },
  ];

  const filteredRows = searchQuery
    ? allRows.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings and activity</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        {filteredRows ? (
          /* Search results */
          <View style={styles.section}>
            <View style={styles.sectionBox}>
              {filteredRows.map((row, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.row, i < filteredRows.length - 1 && styles.rowBorder]}
                  onPress={row.onPress}
                >
                  <Text style={styles.rowIcon}>{row.icon}</Text>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            {/* Your account */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderLabel}>Your account</Text>
              <Text style={styles.learnixBrand}>🎓 Learnix</Text>
            </View>
            <SettingsSection
              rows={[{
                label: 'Accounts Centre',
                icon: '🛡️',
                desc: 'Password, security, personal details, connected experiences',
                onPress: () => router.push('/settings/security'),
              }]}
            />

            {/* Subscriptions */}
            <SettingsSection
              rows={[{
                label: 'Manage Subscription',
                icon: '💳',
                desc: 'View plan, cancel auto-renew, or request refund',
                onPress: () => router.push('/upgrade'),
              }]}
            />

            {/* How you use */}
            <SettingsSection
              title="How you use Learnix"
              rows={[
                { label: 'Saved', icon: '🔖' },
                { label: 'Archive', icon: '🕔' },
                { label: 'Your activity', icon: '📊' },
                { label: 'Notifications', icon: '🔔', onPress: () => router.push('/settings/notifications') },
                { label: 'Time management', icon: '⏱️' },
              ]}
            />

            {/* Who can see */}
            <SettingsSection
              title="Who can see your content"
              rows={[
                { label: 'Account privacy', icon: '🔒', badge: 'Public', onPress: () => router.push('/settings/privacy') },
                { label: 'Close Friends', icon: '⭐', badge: 0, onPress: () => router.push('/settings/close-friends') },
                { label: 'Crossposting', icon: '🔀' },
                { label: 'Blocked', icon: '🚫', badge: 0 },
              ]}
            />

            {/* How others interact */}
            <SettingsSection
              title="How others can interact with you"
              rows={[
                { label: 'Story, live and location', icon: '🎭' },
                { label: 'Activity in Friends feed', icon: '👥' },
                { label: 'Messages and story replies', icon: '💬' },
                { label: 'Tags and mentions', icon: '🏷️' },
                { label: 'Comments', icon: '💭' },
                { label: 'Sharing and reuse', icon: '↩️' },
                { label: 'Restricted', icon: '🔕', badge: 0 },
                { label: 'Limit interactions', icon: '⚠️', badge: 'Off' },
                { label: 'Hidden words', icon: '🔤' },
                { label: 'Follow and invite friends', icon: '➕' },
              ]}
            />

            {/* What you see */}
            <SettingsSection
              title="What you see"
              rows={[
                { label: 'Favourites', icon: '♡', badge: 0 },
                { label: 'Muted accounts', icon: '🔇', badge: 0 },
                { label: 'Content preferences', icon: '📌' },
                { label: 'Like and share counts', icon: '❤️' },
              ]}
            />

            {/* More info & support */}
            <SettingsSection
              title="More info and support"
              rows={[
                { label: 'Help', icon: '❓' },
                { label: 'Privacy Centre', icon: '🏛️' },
                { label: 'Account Status', icon: '🙍' },
                { label: 'About', icon: 'ℹ️' },
              ]}
            />

            {/* Login section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Login</Text>
              <TouchableOpacity style={styles.loginAction}>
                <Text style={styles.addAccount}>Add account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.loginAction}>
                <Text style={styles.logoutText}>Log out</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {/* Log out confirmation modal — matches Instagram exactly */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.logoutModalTitle}>Log out of your account?</Text>
            <View style={styles.logoutModalDivider} />
            <TouchableOpacity onPress={handleLogout} style={styles.logoutModalBtn}>
              {loggingOut ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.logoutModalLogout}>Log Out</Text>}
            </TouchableOpacity>
            <View style={styles.logoutModalDivider} />
            <TouchableOpacity onPress={() => setLogoutModalVisible(false)} style={styles.logoutModalBtn}>
              <Text style={styles.logoutModalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40 },
  backArrow: { color: 'white', fontSize: 22 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', margin: 14, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 15, paddingVertical: 12 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 6, marginTop: 4 },
  sectionHeaderLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  learnixBrand: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },

  section: { marginHorizontal: 14, marginBottom: 20 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4, paddingHorizontal: 2 },
  sectionBox: { backgroundColor: '#1C1C1E', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { fontSize: 20, width: 30, marginRight: 12 },
  rowLabel: { color: 'white', fontSize: 14.5, fontWeight: '500', flex: 1 },
  rowDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  rowBadge: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5, marginRight: 6 },
  rowChevron: { color: 'rgba(255,255,255,0.3)', fontSize: 22, fontWeight: '300' },

  loginAction: { paddingVertical: 14 },
  addAccount: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600', marginTop: 4 },

  // Logout modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  logoutModal: { backgroundColor: '#2C2C2E', borderRadius: 20, width: '100%', overflow: 'hidden' },
  logoutModalTitle: { color: 'white', fontSize: 17, fontWeight: '700', textAlign: 'center', padding: 24 },
  logoutModalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  logoutModalBtn: { paddingVertical: 18, alignItems: 'center' },
  logoutModalLogout: { color: '#EF4444', fontSize: 17, fontWeight: '700' },
  logoutModalCancel: { color: 'white', fontSize: 17 },
});
