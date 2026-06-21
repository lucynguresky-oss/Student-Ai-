import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

const { width } = Dimensions.get('window');

const BOOK_TEXT = `Chapter 3: Cell Biology

3.1 Introduction to Cells
Cells are the basic structural and functional units of all living organisms. They are the smallest entities that exhibit the characteristics of life.

The discovery of cells is credited to Robert Hooke in 1665, who observed thin slices of cork under a primitive microscope. He coined the term 'cell' because the box-like structures reminded him of the small rooms (cells) in a monastery.

3.2 Cell Structure and Function
A typical animal cell consists of three main parts: the cell membrane, cytoplasm, and nucleus.

• Cell Membrane: A semi-permeable boundary that encloses the cell's contents and regulates the passage of substances in and out.
• Cytoplasm: A jelly-like substance where most chemical reactions take place. It contains various organelles.
• Nucleus: The control centre of the cell, containing genetic material (DNA) that dictates cell activities.

3.3 Plant vs Animal Cells
While they share many similarities, plant cells have distinct features:
• Cell Wall: A rigid outer layer made of cellulose that provides support.
• Chloroplasts: Contain chlorophyll for photosynthesis.
• Large Central Vacuole: Stores water, nutrients, and waste products, helping maintain turgor pressure.`;

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [fontSize, setFontSize] = useState(18);
  const [showControls, setShowControls] = useState(true);
  const [isPremium, setIsPremium] = useState(false); // Normally fetched from user state
  const isBookPremium = id === 'b4'; // Mock: b4 is Physics for KCSE (PLUS)

  const getThemeStyles = () => {
    switch (theme) {
      case 'light': return { bg: '#F8FAFC', text: '#0F172A', controls: '#ffffff', border: '#E2E8F0' };
      case 'sepia': return { bg: '#F4ECD8', text: '#5B4636', controls: '#E9DEC3', border: '#D2C3A2' };
      default: return { bg: '#000000', text: '#E2E8F0', controls: '#111111', border: '#222222' };
    }
  };

  const t = getThemeStyles();

  if (isBookPremium && !isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
          <Text style={{ fontSize: 24, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🔒</Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Premium Content</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', paddingHorizontal: 40, marginBottom: 30 }}>
          This book requires a Learnix Plus or Premium subscription. Upgrade to access the full library.
        </Text>
        <TouchableOpacity onPress={() => router.push('/upgrade')} style={{ backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Upgrade Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]} edges={['top']}>
      <StatusBar barStyle={theme === 'light' || theme === 'sepia' ? 'dark-content' : 'light-content'} backgroundColor={t.bg} />

      {/* Top Controls */}
      {showControls && (
        <View style={[styles.header, { backgroundColor: t.controls, borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={{ fontSize: 24, color: t.text }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.bookTitle, { color: t.text }]} numberOfLines={1}>Biology Form 4</Text>
            <Text style={[styles.chapterTitle, { color: t.text, opacity: 0.7 }]}>Ch 3. Cell Biology</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={{ fontSize: 20, color: t.text }}>🔖</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reader Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => setShowControls(c => !c)}>
          <Text style={[styles.readerText, { color: t.text, fontSize, lineHeight: fontSize * 1.6 }]}>
            {BOOK_TEXT}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Controls / Tools */}
      {showControls && (
        <View style={[styles.bottomControls, { backgroundColor: t.controls, borderTopColor: t.border }]}>
          {/* AI Tools */}
          <View style={styles.aiToolsRow}>
            <TouchableOpacity style={styles.aiToolBtn}>
              <Text style={styles.aiToolEmoji}>🤖</Text>
              <Text style={styles.aiToolLabel}>Summarise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiToolBtn}>
              <Text style={styles.aiToolEmoji}>🧠</Text>
              <Text style={styles.aiToolLabel}>Explain Page</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiToolBtn}>
              <Text style={styles.aiToolEmoji}>🎯</Text>
              <Text style={styles.aiToolLabel}>Quiz Me</Text>
            </TouchableOpacity>
          </View>

          {/* Reader Settings */}
          <View style={styles.settingsRow}>
            {/* Font Size */}
            <View style={styles.settingGroup}>
              <TouchableOpacity onPress={() => setFontSize(f => Math.max(14, f - 2))} style={[styles.settingBtn, { borderColor: t.border }]}>
                <Text style={{ color: t.text, fontSize: 16 }}>A-</Text>
              </TouchableOpacity>
              <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{fontSize}</Text>
              <TouchableOpacity onPress={() => setFontSize(f => Math.min(30, f + 2))} style={[styles.settingBtn, { borderColor: t.border }]}>
                <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Themes */}
            <View style={styles.settingGroup}>
              <TouchableOpacity onPress={() => setTheme('light')} style={[styles.themeBtn, { backgroundColor: '#F8FAFC', borderColor: theme === 'light' ? '#3B82F6' : '#E2E8F0' }]} />
              <TouchableOpacity onPress={() => setTheme('sepia')} style={[styles.themeBtn, { backgroundColor: '#F4ECD8', borderColor: theme === 'sepia' ? '#3B82F6' : '#D2C3A2' }]} />
              <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.themeBtn, { backgroundColor: '#000000', borderColor: theme === 'dark' ? '#3B82F6' : '#222' }]} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerBtn: { padding: 8, zIndex: 10 },
  bookTitle: { fontSize: 15, fontWeight: '700' },
  chapterTitle: { fontSize: 12 },
  contentContainer: { padding: 24, paddingBottom: 100 },
  readerText: { fontFamily: 'serif' }, // Ideally use 'Literata' from tokens
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingBottom: 30, paddingTop: 16 },
  aiToolsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  aiToolBtn: { alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  aiToolEmoji: { fontSize: 18, marginBottom: 4 },
  aiToolLabel: { color: '#3B82F6', fontSize: 11, fontWeight: '700' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  themeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
});
