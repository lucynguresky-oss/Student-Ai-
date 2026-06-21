import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import CORBETT_MATHS, { FIVE_A_DAY_URLS, REVISION_URLS } from '../../data/corbett-maths';
import type { CorbettCategory, CorbettTopic } from '../../data/corbett-maths';

const SUBJECTS = [
  { key: 'BIO', label: 'Biology', emoji: '🧬', color: '#22C55E', lessons: 48, progress: 40 },
  { key: 'CHE', label: 'Chemistry', emoji: '⚗️', color: '#F59E0B', lessons: 40, progress: 20 },
  { key: 'PHY', label: 'Physics', emoji: '🚀', color: '#3B82F6', lessons: 44, progress: 15 },
  { key: 'ENG', label: 'English', emoji: '📖', color: '#EC4899', lessons: 36, progress: 30 },
];

const QUESTS = [
  { label: 'Complete 1 Biology lesson', xp: 50, done: false, emoji: '🧬' },
  { label: 'Score 80%+ on a quiz', xp: 75, done: true, emoji: '🎯' },
  { label: 'Watch 2 Learnix Clips', xp: 30, done: false, emoji: '🎬' },
];

const PAST_PAPERS = [
  { year: '2024', subject: 'Mathematics', paper: 'Paper 1', emoji: '📐', url: '#' },
  { year: '2023', subject: 'Mathematics', paper: 'Paper 2', emoji: '📐', url: '#' },
  { year: '2024', subject: 'Biology', paper: 'Paper 1', emoji: '🧬', url: '#' },
  { year: '2023', subject: 'Chemistry', paper: 'Paper 1', emoji: '⚗️', url: '#' },
];

const { width } = Dimensions.get('window');

export default function LearnScreen() {
  const router = useRouter();
  const streak = 15;
  const xp = 2840;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const xpToNext = level * level * 100;
  const pct = Math.min(100, (xp / xpToNext) * 100);

  const [expandedCorbett, setExpandedCorbett] = useState<string | null>(null);

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>🔥 {streak}</Text>
          <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 15 }}>⚡ {xp.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* XP Bar */}
        <View style={styles.xpSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Level {level}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{xp} / {xpToNext} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${pct}%` as any }]} />
          </View>
        </View>

        {/* Daily Quests */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Daily Quests</Text>
            <Text style={{ color: '#3B82F6', fontSize: 12 }}>1/3 done</Text>
          </View>
          {QUESTS.map((q, i) => (
            <View key={i} style={[styles.questItem, q.done && styles.questDone]}>
              <Text style={{ fontSize: 20 }}>{q.done ? '✅' : q.emoji}</Text>
              <Text style={[styles.questLabel, q.done && { color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' }]} numberOfLines={1}>{q.label}</Text>
              <View style={styles.xpBadge}><Text style={styles.xpBadgeText}>+{q.xp} XP</Text></View>
            </View>
          ))}
        </View>

        {/* ─── 5-a-Day Quick Start (Corbett Maths) ─── */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>📝 5-a-Day (Corbett Maths)</Text>
            <View style={styles.sourceBadge}><Text style={styles.sourceBadgeText}>corbettmaths.com</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {[
              { label: 'GCSE 9-1', color: '#3B82F6', url: FIVE_A_DAY_URLS.gcse },
              { label: 'Further Maths', color: '#7C3AED', url: FIVE_A_DAY_URLS.furtherMaths },
              { label: 'Primary', color: '#22C55E', url: FIVE_A_DAY_URLS.primary },
            ].map((item, i) => (
              <TouchableOpacity key={i} onPress={() => openUrl(item.url)} style={[styles.fiveADayCard, { borderColor: item.color + '40' }]}>
                <View style={[styles.fiveADayDot, { backgroundColor: item.color }]} />
                <Text style={styles.fiveADayLabel}>{item.label}</Text>
                <Text style={styles.fiveADaySubtext}>5 questions daily</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Corbett Maths Topics ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>📐 Mathematics (Corbett Maths)</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>400+ free videos, practice questions & textbooks</Text>

          {CORBETT_MATHS.map(cat => {
            const isExpanded = expandedCorbett === cat.key;
            return (
              <View key={cat.key} style={{ marginBottom: 8 }}>
                <TouchableOpacity
                  style={[styles.corbettCatHeader, { borderLeftColor: cat.color }]}
                  onPress={() => setExpandedCorbett(isExpanded ? null : cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{cat.emoji}</Text>
                  <Text style={styles.corbettCatLabel}>{cat.label}</Text>
                  <View style={styles.corbettCatCount}>
                    <Text style={styles.corbettCatCountText}>{cat.topics.length}</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>{isExpanded ? '▾' : '›'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.corbettTopicList}>
                    {cat.topics.map(topic => (
                      <View key={topic.id} style={styles.corbettTopicRow}>
                        <Text style={styles.corbettTopicTitle} numberOfLines={1}>{topic.title}</Text>
                        <View style={styles.corbettTopicActions}>
                          <TouchableOpacity onPress={() => openUrl(topic.videoUrl)} style={[styles.corbettActionPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                            <Text style={[styles.corbettActionText, { color: '#EF4444' }]}>▶ Video</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openUrl(topic.practiceUrl)} style={[styles.corbettActionPill, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                            <Text style={[styles.corbettActionText, { color: '#3B82F6' }]}>📝 Practice</Text>
                          </TouchableOpacity>
                          {topic.textbookUrl && (
                            <TouchableOpacity onPress={() => openUrl(topic.textbookUrl!)} style={[styles.corbettActionPill, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                              <Text style={[styles.corbettActionText, { color: '#22C55E' }]}>📄 PDF</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {/* Revision links */}
          <View style={styles.revisionRow}>
            <TouchableOpacity onPress={() => openUrl(REVISION_URLS.gcse)} style={styles.revisionChip}>
              <Text style={styles.revisionChipText}>📋 GCSE Revision</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openUrl(REVISION_URLS.revisionCards)} style={styles.revisionChip}>
              <Text style={styles.revisionChipText}>🃏 Revision Cards</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openUrl(REVISION_URLS.books)} style={styles.revisionChip}>
              <Text style={styles.revisionChipText}>📚 Books</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Other Subjects ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Other Subjects</Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map(s => (
              <TouchableOpacity key={s.key} style={styles.subjectCard} activeOpacity={0.7}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{s.emoji}</Text>
                <Text style={{ fontWeight: '700', fontSize: 14, color: 'white', marginBottom: 2 }}>{s.label}</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{s.lessons} lessons</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${s.progress}%` as any, backgroundColor: s.color }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Past Papers ─── */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>📄 Past Papers</Text>
            <TouchableOpacity onPress={() => router.push('/library')}>
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '600' }}>See All →</Text>
            </TouchableOpacity>
          </View>
          {PAST_PAPERS.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => router.push('/paper/p1')} style={styles.paperRow}>
              <Text style={{ fontSize: 22, marginRight: 12 }}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.paperTitle}>{p.subject} — {p.paper}</Text>
                <Text style={styles.paperYear}>{p.year} · KCSE</Text>
              </View>
              <View style={styles.paperModeBadge}>
                <Text style={styles.paperModeText}>Practice</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Leaderboard Preview ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>🏆 Weekly Leaderboard</Text>
          {[
            { rank: 1, name: 'brian_ke', xp: 4200, emoji: '🥇' },
            { rank: 2, name: 'amina_learns', xp: 2840, emoji: '🥈' },
            { rank: 3, name: 'dan_studies', xp: 2100, emoji: '🥉' },
          ].map((entry, i) => (
            <View key={i} style={[styles.leaderRow, i === 1 && styles.leaderRowMe]}>
              <Text style={{ fontSize: 20, width: 32 }}>{entry.emoji}</Text>
              <Text style={styles.leaderName}>{entry.name}</Text>
              <Text style={styles.leaderXp}>⚡ {entry.xp.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  title: { fontSize: 20, fontWeight: '800', color: 'white' },
  xpSection: { padding: 16, backgroundColor: '#0A0A0A', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  xpBarBg: { height: 8, backgroundColor: '#1A1A1A', borderRadius: 99, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 99, backgroundColor: '#18D6C8' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: 'white' },

  // Quests
  questItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#111', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  questDone: { borderColor: 'rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.06)' },
  questLabel: { flex: 1, fontSize: 13, color: 'white', fontWeight: '500' },
  xpBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  xpBadgeText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

  // 5-a-Day
  sourceBadge: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sourceBadgeText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },
  fiveADayCard: { width: 140, backgroundColor: '#111', borderRadius: 14, padding: 14, borderWidth: 1.5 },
  fiveADayDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
  fiveADayLabel: { color: 'white', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  fiveADaySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  // Corbett categories
  corbettCatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderLeftWidth: 3 },
  corbettCatLabel: { flex: 1, color: 'white', fontSize: 15, fontWeight: '700' },
  corbettCatCount: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  corbettCatCountText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },

  corbettTopicList: { marginLeft: 16, marginTop: 4, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)', paddingLeft: 12 },
  corbettTopicRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  corbettTopicTitle: { color: 'white', fontSize: 13.5, fontWeight: '500', marginBottom: 6 },
  corbettTopicActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  corbettActionPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  corbettActionText: { fontSize: 11, fontWeight: '700' },

  revisionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  revisionChip: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  revisionChipText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // Other subjects
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subjectCard: { width: (width - 42) / 2, padding: 16, backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  progressBg: { height: 4, backgroundColor: '#1A1A1A', borderRadius: 99 },
  progressFill: { height: '100%', borderRadius: 99 },

  // Past papers
  paperRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#111', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  paperTitle: { color: 'white', fontSize: 14, fontWeight: '600' },
  paperYear: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  paperModeBadge: { backgroundColor: 'rgba(59,130,246,0.12)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  paperModeText: { color: '#3B82F6', fontSize: 11, fontWeight: '700' },

  // Leaderboard
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  leaderRowMe: { backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  leaderName: { flex: 1, color: 'white', fontSize: 14, fontWeight: '600' },
  leaderXp: { color: '#3B82F6', fontSize: 13, fontWeight: '800' },
});
