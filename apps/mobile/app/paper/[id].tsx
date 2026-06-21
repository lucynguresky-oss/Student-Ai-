import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

const { width } = Dimensions.get('window');

const QUESTIONS = [
  {
    num: 1,
    text: "Name the organelles that would be found in large numbers in cells of a secretory gland.",
    marks: 1,
    type: 'short',
    answer: "Golgi apparatus / Golgi bodies"
  },
  {
    num: 2,
    text: "State the function of the following parts of a light microscope:\n(a) Objective lens\n(b) Diaphragm",
    marks: 2,
    type: 'short',
    answer: "(a) Magnifies the object/specimen further\n(b) Regulates the amount of light passing through the condenser"
  },
  {
    num: 3,
    text: "Describe what happens during the light stage of photosynthesis.",
    marks: 3,
    type: 'essay',
    answer: "Light energy is absorbed by chlorophyll; water molecules are split into hydrogen and oxygen (photolysis); ATP is formed."
  }
];

export default function PaperScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'practice' | 'timed' | 'ai'>('practice');
  const [currentQ, setCurrentQ] = useState(0);

  const [isPremium, setIsPremium] = useState(false); // Normally fetched from user state
  const isPaperPremium = id === 'p3'; // Mock: p3 is KCSE Chemistry 2022 (PLUS)

  const q = QUESTIONS[currentQ] || QUESTIONS[0]!;

  if (isPaperPremium && !isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
          <Text style={{ fontSize: 24, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🔒</Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Premium Past Paper</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', paddingHorizontal: 40, marginBottom: 30 }}>
          This paper requires a Learnix Plus or Premium subscription. Upgrade to access our full KCSE archive.
        </Text>
        <TouchableOpacity onPress={() => router.push('/upgrade')} style={{ backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Upgrade Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={{ fontSize: 24, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>KCSE Biology 2023</Text>
          <Text style={styles.headerSub}>Paper 1 · {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={{ fontSize: 20, color: 'white' }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeTabs}>
        <TouchableOpacity onPress={() => setMode('practice')} style={[styles.modeTab, mode === 'practice' && styles.modeTabActive]}>
          <Text style={[styles.modeTabText, mode === 'practice' && { color: 'white' }]}>Practice</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('timed')} style={[styles.modeTab, mode === 'timed' && styles.modeTabActive]}>
          <Text style={[styles.modeTabText, mode === 'timed' && { color: 'white' }]}>Timed Exam</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('ai')} style={[styles.modeTab, mode === 'ai' && styles.modeTabActive]}>
          <Text style={[styles.modeTabText, mode === 'ai' && { color: 'white' }]}>AI Assist</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>Question {currentQ + 1} of {QUESTIONS.length}</Text>
          <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}>{q.marks} Marks</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }]} />
        </View>

        {/* Question Card */}
        <View style={styles.qCard}>
          <Text style={styles.qNumber}>Q{q.num}.</Text>
          <Text style={styles.qText}>{q.text}</Text>
        </View>

        {/* AI Assist Mode Features */}
        {mode === 'ai' && (
          <View style={styles.aiBox}>
            <View style={styles.aiBoxHeader}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
              <Text style={styles.aiBoxTitle}>AI Hint</Text>
            </View>
            <Text style={styles.aiBoxText}>
              {currentQ === 0 ? "Think about the organelle responsible for packaging and modifying proteins for secretion." :
               currentQ === 1 ? "The objective lens is close to the specimen, while the diaphragm is below the stage." :
               "Remember that light energy is needed to split a very common molecule found in plants."}
            </Text>
          </View>
        )}

        {/* Action Area */}
        <View style={styles.actionArea}>
          {mode === 'practice' || mode === 'ai' ? (
            <TouchableOpacity style={styles.revealBtn}>
              <Text style={styles.revealText}>Reveal Marking Scheme</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>01:59:45</Text>
              <Text style={styles.timerSub}>Remaining</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navBtn, currentQ === 0 && { opacity: 0.3 }]} 
          onPress={() => setCurrentQ(q => Math.max(0, q - 1))}
          disabled={currentQ === 0}
        >
          <Text style={styles.navBtnText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navBtn, styles.navBtnPrimary]}
          onPress={() => setCurrentQ(q => Math.min(QUESTIONS.length - 1, q + 1))}
          disabled={currentQ === QUESTIONS.length - 1}
        >
          <Text style={[styles.navBtnText, { color: 'black' }]}>Next Question</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  
  modeTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modeTab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeTabActive: { borderBottomColor: '#3B82F6' },
  modeTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },

  content: { padding: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBg: { height: 4, backgroundColor: '#1A1A1A', borderRadius: 2, marginBottom: 24 },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },

  qCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  qNumber: { color: '#3B82F6', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  qText: { color: 'white', fontSize: 17, lineHeight: 26 },

  aiBox: { backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  aiBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiBoxTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '700' },
  aiBoxText: { color: 'white', fontSize: 14, lineHeight: 22 },

  actionArea: { marginTop: 30, alignItems: 'center' },
  revealBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: '100%', alignItems: 'center' },
  revealText: { color: 'white', fontSize: 15, fontWeight: '600' },

  timerBox: { alignItems: 'center' },
  timerText: { color: '#EF4444', fontSize: 32, fontWeight: '800', fontFamily: 'monospace' },
  timerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },

  bottomNav: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 12 },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#1A1A1A' },
  navBtnPrimary: { backgroundColor: 'white' },
  navBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
