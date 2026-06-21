import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

const GRID = [
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&q=80',
  'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=300&q=80',
  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&q=80',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&q=80',
  'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&q=80',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=300&q=80',
];

const BADGES = ['🔥 15-Day Streak', '🧬 Bio Master', '📐 Math Pro', '⚡ Fast Learner'];

// Dummy gallery for creating a reel/post
const GALLERY_ITEMS = [
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&q=80',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=300&q=80',
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=300&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&q=80',
];

const HIGHLIGHT_DATES = [
  { id: '1', date: '17 May', selected: false },
  { id: '2', date: '15 May', selected: false },
  { id: '3', date: '10 May', selected: false },
  { id: '4', date: '08 May', selected: false },
  { id: '5', date: '05 May', selected: false },
  { id: '6', date: '01 May', selected: false },
  { id: '7', date: '28 Apr', selected: false },
  { id: '8', date: '25 Apr', selected: false },
  { id: '9', date: '20 Apr', selected: false },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [following, setFollowing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryType, setGalleryType] = useState<'Reel' | 'Post'>('Reel');
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [highlights, setHighlights] = useState(HIGHLIGHT_DATES);
  const [menuVisible, setMenuVisible] = useState(false);

  const avatarUrl = 'https://api.dicebear.com/8.x/avataaars/svg?seed=amina&backgroundColor=b6e3f4';

  const toggleHighlight = (id: string) => {
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, selected: !h.selected } : h));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        {/* Top-left "+" Button to upload content */}
        <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.headerIconBtn}>
          <Text style={styles.plusIconText}>+</Text>
        </TouchableOpacity>

        {/* Username in center */}
        <View style={styles.usernameContainer}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.username}>amina_learns</Text>
          <Text style={styles.chevronDown}>▾</Text>
        </View>

        {/* Top-right menu */}
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerIconBtn}>
          <Text style={{ color: 'white', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile info */}
        <View style={styles.profileSection}>
          {/* Avatar + stats */}
          <View style={styles.profileTop}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              {/* Little '+' on avatar like IG */}
              <TouchableOpacity style={styles.avatarPlusBadge}>
                <Text style={styles.avatarPlusText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              {[['42', 'Posts'], ['1.2K', 'Followers'], ['154', 'Following']].map(([v, l]) => (
                <View key={l} style={styles.statItem}>
                  <Text style={styles.statValue}>{v}</Text>
                  <Text style={styles.statLabel}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bio */}
          <Text style={styles.displayName}>Amina Wanjiku</Text>
          <Text style={styles.bio}>Form 4 · KCSE 2026 🇰🇪{'\n'}Future Engineer 🚀 | Biology & Maths nerd</Text>
          <Text style={{ color: '#18D6C8', fontSize: 13, fontWeight: '600', marginTop: 4 }}>🔥 15 Day Streak</Text>

          {/* Premium / Upgrade Banner Card */}
          <TouchableOpacity onPress={() => router.push('/upgrade')} style={styles.upgradeBannerCard}>
            <Text style={{ fontSize: 18 }}>⭐</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '800' }}>Upgrade to Learnix Plus</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Get unlimited AI tutor, textbooks & past papers</Text>
            </View>
            <Text style={{ color: '#F59E0B', fontSize: 18, fontWeight: 'bold' }}>›</Text>
          </TouchableOpacity>

          {/* Badges */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 6 }}>
            {BADGES.map(b => (
              <View key={b} style={styles.badge}><Text style={styles.badgeText}>{b}</Text></View>
            ))}
          </ScrollView>

          {/* + Add banners link */}
          <TouchableOpacity style={{ marginTop: 10, marginBottom: 4 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>+ Add banners</Text>
          </TouchableOpacity>

          {/* Buttons — Edit profile / Share profile / Add person (matches IG) */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Share profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chevronButton}>
              <Text style={{ color: 'white', fontSize: 16 }}>👤+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Discover People Section ─── */}
        <View style={styles.discoverSection}>
          <View style={styles.discoverHeader}>
            <Text style={styles.discoverTitle}>Discover people</Text>
            <TouchableOpacity>
              <Text style={styles.discoverSeeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}>
            {[
              { name: '😀', user: 'student_ke', mutual: '1 mutual' },
              { name: 'always chillin', user: 'chill_learner', mutual: '1 mutual' },
              { name: '🫡 Dan', user: 'dan_studies', mutual: '1 mutual' },
              { name: 'brainiac', user: 'brainiac_kcse', mutual: '3 mutual' },
            ].map((person, idx) => (
              <View key={idx} style={styles.discoverCard}>
                <TouchableOpacity style={styles.discoverDismiss}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
                <View style={styles.discoverAvatar}>
                  <Image
                    source={{ uri: `https://api.dicebear.com/8.x/avataaars/svg?seed=${person.user}&backgroundColor=b6e3f4` }}
                    style={{ width: 64, height: 64, borderRadius: 32 }}
                  />
                </View>
                <Text style={styles.discoverName}>{person.name}</Text>
                <Text style={styles.discoverMutual}>{person.mutual}</Text>
                <TouchableOpacity style={styles.discoverFollowBtn}>
                  <Text style={styles.discoverFollowText}>Follow</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {['⊞', '▶', '🔖'].map((icon, i) => (
            <TouchableOpacity key={i} onPress={() => setTab(i)} style={[styles.tabBtn, tab === i && styles.tabBtnActive]}>
              <Text style={{ fontSize: 20, opacity: tab === i ? 1 : 0.4 }}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {GRID.map((src, i) => (
            <TouchableOpacity key={i} style={styles.gridItem} activeOpacity={0.85}>
              <Image source={{ uri: src }} style={styles.gridImage} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ────────────────────────────────────────────────────────────
          MODAL 1: Create Bottom Sheet
          ──────────────────────────────────────────────────────────── */}
      <Modal
        visible={createVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCreateVisible(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            {/* Top indicator handle bar */}
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle}>Create</Text>
            <View style={styles.sheetDivider} />

            {/* List options */}
            {[
              { label: 'Reel', emoji: '🎬', desc: 'Share your short study video or clip', action: () => { setCreateVisible(false); setGalleryType('Reel'); setGalleryVisible(true); } },
              { label: 'Edits', emoji: '🎬', isEdit: true, desc: 'New editor capabilities', action: () => setCreateVisible(false) },
              { label: 'Post', emoji: '⊞', desc: 'Upload a picture or KCSE study note', action: () => { setCreateVisible(false); setGalleryType('Post'); setGalleryVisible(true); } },
              { label: 'Story', emoji: '⊕', desc: 'Share a quick study update', action: () => setCreateVisible(false) },
              { label: 'Highlights', emoji: '♡', desc: 'Pin your best study moments to profile', action: () => { setCreateVisible(false); setHighlightVisible(true); } },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sheetRow}
                onPress={item.action}
              >
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.rowText}>{item.label}</Text>
                    {item.isEdit && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>New</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowSubtext}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ────────────────────────────────────────────────────────────
          MODAL 2: Simulated Gallery / Camera Upload Screen
          ──────────────────────────────────────────────────────────── */}
      <Modal
        visible={galleryVisible}
        animationType="slide"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <SafeAreaView style={styles.galleryContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setGalleryVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>New {galleryType}</Text>
            <TouchableOpacity onPress={() => setGalleryVisible(false)}>
              <Text style={styles.nextBtn}>Next</Text>
            </TouchableOpacity>
          </View>

          {/* Action Row */}
          <View style={styles.galleryActionRow}>
            <TouchableOpacity style={styles.galleryActionBtn}>
              <Text style={styles.galleryActionText}>⊞ Drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryActionBtn}>
              <Text style={styles.galleryActionText}>❐ Templates</Text>
            </TouchableOpacity>
          </View>

          {/* Filter dropdown bar */}
          <View style={styles.filterDropdownBar}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.filterText}>Recents</Text>
              <Text style={styles.filterChevron}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectMultipleBtn}>
              <Text style={styles.selectMultipleText}>Select</Text>
            </TouchableOpacity>
          </View>

          {/* Photo/Video Grid */}
          <FlatList
            data={GALLERY_ITEMS}
            numColumns={3}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.galleryGridItem} activeOpacity={0.8}>
                <Image source={{ uri: item }} style={styles.galleryGridImage} />
                {galleryType === 'Reel' && (
                  <View style={styles.videoDurationBadge}>
                    <Text style={styles.durationText}>0:24</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 60 }}
          />

          {/* Sliding Bottom Tab Bar */}
          <View style={styles.galleryBottomTabs}>
            <TouchableOpacity style={styles.galleryBottomTabBtn}>
              <Text style={[styles.galleryBottomTabText, { color: 'white', fontWeight: 'bold' }]}>{galleryType.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBottomTabBtn}>
              <Text style={styles.galleryBottomTabText}>TEMPLATES</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ────────────────────────────────────────────────────────────
          MODAL 3: Add to Highlight Screen
          ──────────────────────────────────────────────────────────── */}
      <Modal
        visible={highlightVisible}
        animationType="slide"
        onRequestClose={() => setHighlightVisible(false)}
      >
        <SafeAreaView style={styles.galleryContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setHighlightVisible(false)}>
              <Text style={styles.backBtn}>←</Text>
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>Add to highlight</Text>
            <TouchableOpacity onPress={() => setHighlightVisible(false)}>
              <Text style={styles.nextBtn}>Next</Text>
            </TouchableOpacity>
          </View>

          {/* Checklist Grid */}
          <FlatList
            data={highlights}
            numColumns={3}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.highlightGridItem}
                activeOpacity={0.8}
                onPress={() => toggleHighlight(item.id)}
              >
                <View style={[styles.highlightCheckbox, item.selected && styles.highlightCheckboxSelected]}>
                  {item.selected && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <View style={styles.highlightDateBadge}>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: 1 }}
          />
        </SafeAreaView>
      </Modal>

      {/* Settings navigation is handled by router.push('/settings/index') from the ☰ button above */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerIconBtn: { padding: 4 },
  plusIconText: { color: 'white', fontSize: 26, fontWeight: '300' },
  usernameContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockEmoji: { fontSize: 13 },
  username: { fontSize: 16, fontWeight: '800', color: 'white' },
  chevronDown: { fontSize: 12, color: 'white', opacity: 0.8 },
  profileSection: { padding: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarRing: { width: 86, height: 86, borderRadius: 43, padding: 3, marginRight: 20, borderWidth: 2.5, borderColor: '#E1306C', position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 99 },
  avatarPlusBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center' },
  avatarPlusText: { color: 'white', fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  displayName: { fontSize: 14, fontWeight: '700', color: 'white', marginBottom: 2 },
  bio: { fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  badge: { backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  followButton: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  followingButton: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  messageButton: { flex: 1, backgroundColor: '#1A1A1A', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  chevronButton: { width: 40, backgroundColor: '#1A1A1A', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: 'white' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 1 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: '100%', height: '100%' },

  // Bottom Sheet Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, paddingHorizontal: 16 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 15 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 15 },
  sheetDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 15 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 14 },
  rowEmoji: { fontSize: 24, color: 'white' },
  rowText: { fontSize: 15, fontWeight: '600', color: 'white' },
  rowSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  newBadge: { backgroundColor: '#3B82F6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  newBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Gallery Screen Modal
  galleryContainer: { flex: 1, backgroundColor: '#000' },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  closeBtn: { color: 'white', fontSize: 20 },
  backBtn: { color: 'white', fontSize: 24 },
  galleryTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  nextBtn: { color: '#3B82F6', fontSize: 15, fontWeight: 'bold' },
  galleryActionRow: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  galleryActionBtn: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  galleryActionText: { color: 'white', fontSize: 13, fontWeight: '600' },
  filterDropdownBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  filterText: { color: 'white', fontSize: 15, fontWeight: '600' },
  filterChevron: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginLeft: 2 },
  selectMultipleBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectMultipleText: { color: 'white', fontSize: 12, fontWeight: '600' },
  galleryGridItem: { width: GRID_SIZE, height: GRID_SIZE, margin: 0.5, position: 'relative' },
  galleryGridImage: { width: '100%', height: '100%' },
  videoDurationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  durationText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  galleryBottomTabs: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000', flexDirection: 'row', paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', gap: 20 },
  galleryBottomTabBtn: { paddingHorizontal: 10 },
  galleryBottomTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', letterSpacing: 0.05 },

  // Highlight Screen Modal
  highlightGridItem: { width: GRID_SIZE, height: GRID_SIZE, margin: 0.5, backgroundColor: '#111', position: 'relative', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  highlightCheckbox: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'white', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  highlightCheckboxSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  checkboxTick: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  highlightDateBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#222', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  dateText: { color: 'white', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  
  // Premium / Upgrade Card Styling
  upgradeBannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 14, padding: 12, marginTop: 12 },

  // Edit profile / Share profile buttons (IG style)
  editProfileBtn: { flex: 1, backgroundColor: '#1A1A1A', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },

  // Discover People
  discoverSection: { paddingVertical: 14 },
  discoverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  discoverTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
  discoverSeeAll: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  discoverCard: { width: 155, backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, alignItems: 'center', position: 'relative' },
  discoverDismiss: { position: 'absolute', top: 8, right: 10, zIndex: 2 },
  discoverAvatar: { marginBottom: 10, marginTop: 4 },
  discoverName: { color: 'white', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  discoverMutual: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 12 },
  discoverFollowBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  discoverFollowText: { color: 'white', fontSize: 13, fontWeight: '700' },
});
