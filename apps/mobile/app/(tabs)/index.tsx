import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

const { width } = Dimensions.get('window');

const STORIES = [
  { id: '1', name: 'Your Story', seed: 'you', hasNew: false, isYou: true },
  { id: '2', name: 'Mr. Omondi', seed: 'omondi', hasNew: true },
  { id: '3', name: 'amina_w', seed: 'amina', hasNew: true },
  { id: '4', name: 'BioForm4', seed: 'bio', hasNew: true },
  { id: '5', name: 'MathDaily', seed: 'math', hasNew: false },
  { id: '6', name: 'ChemKE', seed: 'chem', hasNew: true },
];

const POSTS = [
  {
    id: '1',
    user: 'mr_omondi',
    name: 'Mr. Omondi',
    seed: 'omondi',
    subject: 'Biology · Form 4',
    caption: 'Mitochondria contains its own DNA — evidence for endosymbiotic theory! Who can explain how this relates to KCSE 2024 Q3b? 🧬',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80',
    likes: 2341,
    comments: 89,
    timeAgo: '2h',
    verified: true,
  },
  {
    id: '2',
    user: 'chemdaily_ke',
    name: 'ChemDaily KE',
    seed: 'chem',
    subject: 'Chemistry',
    caption: 'Alkali metals become MORE reactive down the group 🔥 Save this for your revision!',
    image: 'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=600&q=80',
    likes: 5102,
    comments: 203,
    timeAgo: '6h',
    verified: true,
  },
];

function StoryItem({ story }: { story: typeof STORIES[0] }) {
  const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${story.seed}`;
  return (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.75}>
      <View style={[styles.storyRing, { borderColor: story.hasNew ? '#E1306C' : story.isYou ? '#18D6C8' : 'rgba(255,255,255,0.15)' }]}>
        <View style={styles.storyInner}>
          <Image source={{ uri: avatarUrl }} style={styles.storyAvatar} />
        </View>
        {story.isYou && (
          <View style={styles.storyAddBtn}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
    </TouchableOpacity>
  );
}

function PostCard({ post }: { post: typeof POSTS[0] }) {
  const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${post.seed}`;
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <View style={styles.postAvatarRing}>
            <Image source={{ uri: avatarUrl }} style={styles.postAvatar} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.postUsername}>{post.user}</Text>
              {post.verified && <Text style={{ color: '#3B82F6', fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={styles.postSubject}>{post.subject}</Text>
          </View>
        </View>
        <TouchableOpacity><Text style={{ color: '#888', fontSize: 18 }}>⋯</Text></TouchableOpacity>
      </View>

      <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />

      <View style={styles.postActions}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={styles.actionBtn}><Text style={{ fontSize: 26 }}>🤍</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Text style={{ fontSize: 26 }}>💬</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Text style={{ fontSize: 24 }}>↗️</Text></TouchableOpacity>
        </View>
        <TouchableOpacity><Text style={{ fontSize: 24 }}>🔖</Text></TouchableOpacity>
      </View>

      <View style={styles.postMeta}>
        <Text style={styles.likesText}>{post.likes.toLocaleString()} likes</Text>
        <Text style={styles.captionText} numberOfLines={2}>
          <Text style={{ fontWeight: '700' }}>{post.user} </Text>
          {post.caption}
        </Text>
        <Text style={styles.commentText}>View all {post.comments} comments</Text>
        <Text style={styles.timeText}>{post.timeAgo} ago</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Simulate anti-doomscroll guardrail after 10 seconds in the demo (normally 20 mins)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInterstitial(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Learnix</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity><Text style={{ fontSize: 22 }}>❤️</Text></TouchableOpacity>
          <TouchableOpacity><Text style={{ fontSize: 22 }}>💬</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContainer}>
          {STORIES.map(s => <StoryItem key={s.id} story={s} />)}
        </ScrollView>
        <View style={styles.divider} />

        {/* Feed tabs */}
        <View style={styles.feedTabs}>
          {['For You', 'Following', 'Subjects'].map((t, i) => (
            <TouchableOpacity key={t} style={[styles.feedTab, i === 0 && styles.feedTabActive]}>
              <Text style={[styles.feedTabText, i === 0 && { color: 'white' }]}>{t}</Text>
              {i === 0 && <View style={styles.feedTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts */}
        {POSTS.map(post => <PostCard key={post.id} post={post} />)}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Anti-Doomscroll Interstitial */}
      <Modal visible={showInterstitial} transparent animationType="fade">
        <View style={styles.overlayBg}>
          <View style={styles.interstitialBox}>
            <Text style={{ fontSize: 50, marginBottom: 12 }}>🧠</Text>
            <Text style={styles.interstitialTitle}>Time for a quick break!</Text>
            <Text style={styles.interstitialDesc}>
              You've been scrolling for a while. Let's make sure you're still learning. Complete a 60-second quiz to unlock the feed.
            </Text>
            <TouchableOpacity 
              style={styles.interstitialBtn}
              onPress={() => setShowInterstitial(false)}
            >
              <Text style={styles.interstitialBtnText}>Take Quiz Now (+50 XP)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  logo: { fontSize: 22, fontWeight: '900', color: '#18D6C8' },
  storiesContainer: { paddingHorizontal: 12, paddingVertical: 12, gap: 14 },
  storyItem: { alignItems: 'center', gap: 5, width: 66 },
  storyRing: { width: 66, height: 66, borderRadius: 33, borderWidth: 2.5, padding: 2, position: 'relative' },
  storyInner: { flex: 1, borderRadius: 99, borderWidth: 2, borderColor: '#000', overflow: 'hidden' },
  storyAvatar: { width: '100%', height: '100%' },
  storyAddBtn: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, backgroundColor: '#3B82F6', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  storyName: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 66 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  feedTabs: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  feedTab: { paddingVertical: 10, marginRight: 20, position: 'relative' },
  feedTabActive: {},
  feedTabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  feedTabUnderline: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: 'white', borderRadius: 1 },
  post: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  postHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatarRing: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#E1306C', padding: 1.5, overflow: 'hidden' },
  postAvatar: { width: '100%', height: '100%', borderRadius: 99 },
  postUsername: { fontSize: 13.5, fontWeight: '700', color: 'white' },
  postSubject: { fontSize: 11, color: '#18D6C8' },
  postImage: { width: '100%', height: width * 1.1 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  actionBtn: { padding: 4 },
  postMeta: { paddingHorizontal: 12, paddingBottom: 12 },
  likesText: { fontSize: 13.5, fontWeight: '700', color: 'white', marginBottom: 4 },
  captionText: { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 4 },
  commentText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 2 },
  timeText: { fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // Interstitial
  overlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  interstitialBox: { backgroundColor: '#111', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  interstitialTitle: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  interstitialDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  interstitialBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  interstitialBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
