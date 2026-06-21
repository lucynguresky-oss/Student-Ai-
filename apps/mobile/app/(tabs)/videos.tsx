import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useState } from 'react';

const { width, height } = Dimensions.get('window');

const CLIPS = [
  { id: 'c1', username: 'mr_omondi', subject: 'Biology · Form 4', desc: 'Photosynthesis in 60 seconds! Light-dependent vs independent reactions. Save this for KCSE! 🌿 #Biology', likes: 12400, comments: 340, shares: 890, emoji: '🧬', bg: ['#0f2027', '#203a43', '#2c5364'] },
  { id: 'c2', username: 'mathwiz_ke', subject: 'Mathematics', desc: 'The quadratic formula trick that changed my revision! 📐 #Maths #KCSE', likes: 8900, comments: 215, shares: 430, emoji: '📐', bg: ['#1a1a2e', '#16213e', '#0f3460'] },
  { id: 'c3', username: 'chemdaily_ke', subject: 'Chemistry', desc: 'Why does sodium explode in water? Alkali metal reactivity explained 🔥 #Chemistry', likes: 24100, comments: 891, shares: 2100, emoji: '⚗️', bg: ['#2d1b69', '#11998e', '#38ef7d'] },
  { id: 'c4', username: 'physics_ke', subject: 'Physics', desc: "Newton's 3rd Law with real Kenyan examples 🚀 #Physics #Learnix", likes: 7600, comments: 178, shares: 320, emoji: '🚀', bg: ['#0f0c29', '#302b63', '#24243e'] },
];

function fmt(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n); }

function ClipItem({ clip }: { clip: typeof CLIPS[0] }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(clip.likes);

  return (
    <View style={[styles.clipItem, { backgroundColor: clip.bg[0] }]}>
      {/* Background gradient simulation */}
      <View style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
        <View style={{ flex: 1, backgroundColor: clip.bg[1] }} />
      </View>

      {/* Big emoji */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 120, opacity: 0.12 }}>{clip.emoji}</Text>
      </View>

      {/* Bottom gradient */}
      <View style={styles.clipGradient} />

      {/* For You / Following */}
      <View style={styles.clipTopBar}>
        <Text style={[styles.clipTabText, { opacity: 0.55 }]}>Following</Text>
        <Text style={[styles.clipTabText, { borderBottomWidth: 2, borderBottomColor: 'white', paddingBottom: 3 }]}>For You</Text>
      </View>

      {/* Author + description (left) */}
      <View style={styles.clipLeft}>
        <View style={styles.clipAuthorRow}>
          <View style={styles.clipAvatar}>
            <Text style={{ fontSize: 22 }}>{clip.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clipUsername}>@{clip.username}</Text>
            <Text style={styles.clipSubject}>{clip.subject}</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}><Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Follow</Text></TouchableOpacity>
        </View>
        <Text style={styles.clipDesc} numberOfLines={3}>{clip.desc}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Text style={{ fontSize: 14 }}>🎵</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Learnix · {clip.subject}</Text>
        </View>
      </View>

      {/* Action rail (right) */}
      <View style={styles.clipRight}>
        {/* Test Me button (AI Quiz for video) */}
        <TouchableOpacity style={[styles.clipAction, { marginBottom: 10 }]}>
          <View style={styles.testMeBadge}>
            <Text style={{ fontSize: 16 }}>🎯</Text>
          </View>
          <Text style={styles.clipActionLabel}>Test Me</Text>
        </TouchableOpacity>

        {/* AI Explain button */}
        <TouchableOpacity style={[styles.clipAction, { marginBottom: 10 }]}>
          <View style={styles.aiExplainBadge}>
            <Text style={{ fontSize: 16 }}>🤖</Text>
          </View>
          <Text style={styles.clipActionLabel}>Explain</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clipAction} onPress={() => { setLiked(l => !l); setLikes(c => liked ? c - 1 : c + 1); }}>
          <Text style={{ fontSize: 30, color: liked ? '#EF4444' : 'white' }}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={styles.clipActionLabel}>{fmt(likes)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clipAction}>
          <Text style={{ fontSize: 28, color: 'white' }}>💬</Text>
          <Text style={styles.clipActionLabel}>{fmt(clip.comments)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clipAction}>
          <Text style={{ fontSize: 26, color: 'white' }}>🔖</Text>
          <Text style={styles.clipActionLabel}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clipAction}>
          <Text style={{ fontSize: 26, color: 'white' }}>↗️</Text>
          <Text style={styles.clipActionLabel}>{fmt(clip.shares)}</Text>
        </TouchableOpacity>
        {/* Spinning disc */}
        <View style={styles.discContainer}>
          <Text style={{ fontSize: 22 }}>{clip.emoji}</Text>
        </View>
      </View>
    </View>
  );
}

export default function VideosScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlatList
        data={CLIPS}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <ClipItem clip={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  clipItem: { width, height, position: 'relative', overflow: 'hidden' },
  clipGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', backgroundColor: 'rgba(0,0,0,0.7)' },
  clipTopBar: { position: 'absolute', top: 52, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 24, zIndex: 2 },
  clipTabText: { color: 'white', fontSize: 15, fontWeight: '600' },
  clipLeft: { position: 'absolute', bottom: 80, left: 12, right: 80, zIndex: 2 },
  clipAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  clipAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  clipUsername: { color: 'white', fontWeight: '700', fontSize: 14 },
  clipSubject: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  followBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  clipDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13.5, lineHeight: 20 },
  clipRight: { position: 'absolute', bottom: 80, right: 12, alignItems: 'center', gap: 20, zIndex: 2 },
  clipAction: { alignItems: 'center', gap: 3 },
  clipActionLabel: { color: 'white', fontSize: 12, fontWeight: '700' },
  testMeBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#22C55E' },
  aiExplainBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#8B5CF6' },
  discContainer: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)' },
});
