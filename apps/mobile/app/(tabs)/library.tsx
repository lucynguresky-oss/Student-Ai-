import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const BOOKS = [
  { id: 'b1', title: 'Biology Form 4', authors: 'Kenya Institute', cover: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=200&q=80', progress: 45, type: 'FREE', color: '#22C55E' },
  { id: 'b2', title: 'Mathematics Form 4', authors: 'KLB Publishers', cover: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=200&q=80', progress: 20, type: 'FREE', color: '#7C3AED' },
  { id: 'b3', title: 'Chemistry Form 3 & 4', authors: 'Oxford Press Kenya', cover: 'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=200&q=80', progress: 0, type: 'FREE', color: '#F59E0B' },
  { id: 'b4', title: 'Physics for KCSE', authors: 'Longhorn Publishers', cover: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&q=80', progress: 0, type: 'PLUS', color: '#3B82F6' },
];

const PAPERS = [
  { id: 'p1', title: 'KCSE Biology 2023', subject: 'Biology', year: 2023, marks: 80, color: '#22C55E' },
  { id: 'p2', title: 'KCSE Mathematics 2023', subject: 'Mathematics', year: 2023, marks: 100, color: '#7C3AED' },
  { id: 'p3', title: 'KCSE Chemistry 2022', subject: 'Chemistry', year: 2022, marks: 80, color: '#F59E0B' },
];

export default function LibraryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Text style={{ fontSize: 20 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Textbooks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Textbooks</Text>
            <TouchableOpacity><Text style={{ color: '#3B82F6', fontSize: 13 }}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            {BOOKS.map(b => (
              <TouchableOpacity key={b.id} onPress={() => router.push(`/reader/${b.id}` as any)} style={styles.bookCard} activeOpacity={0.75}>
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: b.cover }} style={styles.bookCover} />
                  {b.type !== 'FREE' && (
                    <View style={styles.plusBadge}><Text style={{ color: 'black', fontSize: 9, fontWeight: '800' }}>{b.type}</Text></View>
                  )}
                  {b.progress > 0 && (
                    <View style={[styles.progressBar, { width: `${b.progress}%` as any, backgroundColor: b.color }]} />
                  )}
                </View>
                <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{b.authors}</Text>
                {b.progress > 0 && <Text style={{ fontSize: 10, color: b.color, fontWeight: '600' }}>{b.progress}% done</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Past Papers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Papers</Text>
            <TouchableOpacity><Text style={{ color: '#3B82F6', fontSize: 13 }}>See all</Text></TouchableOpacity>
          </View>
          {PAPERS.map(p => (
            <TouchableOpacity key={p.id} onPress={() => router.push(`/paper/${p.id}` as any)} style={styles.paperRow} activeOpacity={0.7}>
              <View style={[styles.paperColor, { backgroundColor: p.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paperTitle}>{p.title}</Text>
                <Text style={styles.paperMeta}>{p.year} · {p.marks} marks</Text>
              </View>
              <TouchableOpacity onPress={() => router.push(`/paper/${p.id}` as any)} style={styles.startBtn}><Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Start</Text></TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  title: { fontSize: 20, fontWeight: '800', color: 'white' },
  searchBtn: { padding: 6, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  bookCard: { width: 120 },
  bookCover: { width: 120, height: 160, borderRadius: 8, marginBottom: 8, position: 'relative' },
  plusBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  progressBar: { position: 'absolute', bottom: 0, left: 0, height: 3, borderRadius: 2 },
  bookTitle: { fontSize: 12, fontWeight: '700', color: 'white', marginBottom: 2 },
  bookAuthor: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  paperRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  paperColor: { width: 4, height: 44, borderRadius: 2 },
  paperTitle: { fontSize: 14, fontWeight: '600', color: 'white', marginBottom: 2 },
  paperMeta: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  startBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
});
