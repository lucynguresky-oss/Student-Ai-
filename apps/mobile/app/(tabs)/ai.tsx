import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { API_BASE } from '../../constants/api';

const MODES = [
  { key: 'explain', label: 'Explain', emoji: '💡' },
  { key: 'quiz', label: 'Quiz Me', emoji: '🎯' },
  { key: 'paper', label: 'Past Paper', emoji: '📄' },
  { key: 'planner', label: 'Study Plan', emoji: '📅' },
];

const SUGGESTED = [
  'Explain photosynthesis in simple terms',
  'Difference between mitosis and meiosis?',
  'Help me solve quadratic equations',
  "Summarise Newton's laws",
];

interface Source { label: string; type: 'book' | 'paper'; }
interface Message { id: string; role: 'user' | 'assistant'; content: string; sources?: Source[]; loading?: boolean; }

export default function AiScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('explain');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(3); // Start with 3 messages sent to show limit bar activity
  const [isPremium, setIsPremium] = useState(false);
  const [limitAlertOpen, setLimitAlertOpen] = useState(false);

  const listRef = useRef<FlatList>(null);

  const scrollToBottom = () => { listRef.current?.scrollToEnd({ animated: true }); };
  useEffect(() => { if (messages.length > 0) scrollToBottom(); }, [messages]);

  const send = async (text?: string) => {
    // Check if free user has hit limit
    if (msgCount >= 15 && !isPremium) {
      setLimitAlertOpen(true);
      return;
    }

    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    const loadingMsg: Message = { id: 'loading', role: 'assistant', content: '', loading: true };
    setMessages(m => [...m, userMsg, loadingMsg]);
    setLoading(true);
    setMsgCount(prev => prev + 1);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, mode }),
      });
      const { data } = await res.json();
      setMessages(m => m.filter(x => x.id !== 'loading').concat({
        id: (Date.now() + 1).toString(), role: 'assistant', content: data.content, sources: data.sources,
      }));
    } catch {
      setMessages(m => m.filter(x => x.id !== 'loading').concat({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Great question! Let me break this down for you step by step.\n\nThis is one of the most commonly tested KCSE topics. Can you tell me what you already understand about this topic? I\'ll tailor my explanation to your level. 🎓',
        sources: [
          { label: 'Biology Form 4 Textbook (Ch. 3)', type: 'book' },
          { label: 'KCSE 2023 Paper 1', type: 'paper' },
        ],
      }));
    }
    setLoading(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.loading) {
      return (
        <View style={styles.aiRow}>
          <View style={styles.aiAvatar}><Text style={{ fontSize: 18 }}>🤖</Text></View>
          <View style={[styles.aiBubble, { flexDirection: 'row', gap: 5, padding: 16 }]}>
            {[0,1,2].map(i => <View key={i} style={styles.dot} />)}
          </View>
        </View>
      );
    }

    if (item.role === 'user') {
      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}><Text style={styles.userText}>{item.content}</Text></View>
        </View>
      );
    }

    return (
      <View style={styles.aiRow}>
        <View style={styles.aiAvatar}><Text style={{ fontSize: 18 }}>🤖</Text></View>
        <View style={{ flex: 1 }}>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{item.content}</Text>
          </View>
          {item.sources && item.sources.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 4 }}>
              {item.sources.map((s, i) => (
                <View key={i} style={[styles.sourcePill, { backgroundColor: s.type === 'book' ? 'rgba(59,130,246,0.15)' : 'rgba(124,58,237,0.15)' }]}>
                  <Text style={{ fontSize: 10 }}>{s.type === 'book' ? '📚' : '📄'}</Text>
                  <Text style={[styles.sourceText, { color: s.type === 'book' ? '#60a5fa' : '#a78bfa' }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const currentMode = MODES.find(m => m.key === mode)!;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.aiLogoCircle}><Text style={{ fontSize: 20 }}>🤖</Text></View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>Learnix AI</Text>
                <View style={styles.gptBadge}><Text style={{ color: '#10b981', fontSize: 10, fontWeight: '700' }}>GPT-4o</Text></View>
              </View>
              <Text style={styles.headerSub}>● KCSE Tutor · Online</Text>
            </View>
          </View>

          {/* Quick Upgrade Badge inside AI screen */}
          <TouchableOpacity onPress={() => router.push('/upgrade')} style={styles.upgradeTopBadge}>
            <Text style={styles.upgradeTopBadgeText}>⭐ Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Mode picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {MODES.map(m => (
            <TouchableOpacity key={m.key} onPress={() => setMode(m.key)} style={[styles.modeChip, mode === m.key && styles.modeChipActive]}>
              <Text style={{ fontSize: 12 }}>{m.emoji}</Text>
              <Text style={[styles.modeLabel, mode === m.key && { color: 'white' }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyState}>
          <View style={styles.bigAvatar}><Text style={{ fontSize: 36 }}>🤖</Text></View>
          <Text style={styles.emptyTitle}>Ask me anything</Text>
          <Text style={styles.emptySub}>Grounded in your KCSE curriculum</Text>
          {SUGGESTED.map(s => (
            <TouchableOpacity key={s} onPress={() => send(s)} style={styles.suggestionBtn}>
              <Text style={styles.suggestionText}>{s}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 20, gap: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />
      )}

      {/* Dynamic progress limits bar */}
      {!isPremium && (
        <TouchableOpacity 
          onPress={() => router.push('/upgrade')} 
          style={styles.limitsBar}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <Text style={styles.limitsText}>Daily Socratic Messages: {msgCount}/15</Text>
            <Text style={styles.limitsUpgradeLink}>Unlock Unlimited Plus ⚡</Text>
          </View>
          <View style={styles.limitsTrack}>
            <View style={[styles.limitsFill, { width: `${Math.min(100, (msgCount / 15) * 100)}%`, backgroundColor: msgCount >= 12 ? '#EF4444' : '#F59E0B' }]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.plusBtn}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Ask about ${currentMode.label.toLowerCase()}...`}
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.textInput}
            multiline
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={() => send()} disabled={!input.trim() || loading} style={[styles.sendBtn, input.trim() && !loading && styles.sendBtnActive]}>
            <Text style={{ color: 'white', fontSize: 16 }}>↑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>AI may make mistakes · aligned with KCSE syllabus</Text>
      </View>

      {/* LIMIT ALERT UPGRADE MODAL */}
      {limitAlertOpen && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>⚡</Text>
            <Text style={styles.alertTitle}>Daily Limit Reached!</Text>
            <Text style={styles.alertDesc}>
              You have completed your 15 Socratic free tutoring messages for today. Upgrade to Learnix Plus to continue chatting without limits!
            </Text>
            
            <TouchableOpacity 
              onPress={() => { setLimitAlertOpen(false); router.push('/upgrade'); }} 
              style={styles.alertCtaBtn}
            >
              <Text style={styles.alertCtaText}>Get Unlimited Plus Access</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setLimitAlertOpen(false)} 
              style={styles.alertCancelBtn}
            >
              <Text style={styles.alertCancelText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', gap: 10 },
  aiLogoCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a6feb', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: 'white' },
  gptBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  headerSub: { fontSize: 11, color: '#10b981', fontWeight: '500' },
  upgradeTopBadge: { backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  upgradeTopBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '800' },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modeChipActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)' },
  modeLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  emptyState: { padding: 24, alignItems: 'center', paddingTop: 40 },
  bigAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1a6feb', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 6 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
  suggestionBtn: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  suggestionText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1 },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  userBubble: { maxWidth: '80%', padding: 12, backgroundColor: '#1a6feb', borderRadius: 18, borderBottomRightRadius: 4 },
  userText: { color: 'white', fontSize: 14.5, lineHeight: 21 },
  aiRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  aiAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1a6feb', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiBubble: { flex: 1, padding: 12, backgroundColor: '#111', borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  aiText: { color: 'rgba(255,255,255,0.88)', fontSize: 14.5, lineHeight: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  sourcePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sourceText: { fontSize: 11, fontWeight: '600' },
  
  limitsBar: { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 12 },
  limitsText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  limitsUpgradeLink: { color: '#F59E0B', fontSize: 11, fontWeight: '800' },
  limitsTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  limitsFill: { height: '100%', borderRadius: 3 },

  inputArea: { padding: 10, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: '#000' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 8 },
  plusBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 2 },
  textInput: { flex: 1, color: 'white', fontSize: 15, maxHeight: 100, lineHeight: 21, paddingTop: 4 },
  sendBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  sendBtnActive: { backgroundColor: '#1a6feb' },
  disclaimer: { textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 },

  // Limit alert modal styles
  alertOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 1000 },
  alertContent: { backgroundColor: '#1C1C1E', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)', padding: 24, alignItems: 'center', textAlign: 'center', width: '100%' },
  alertTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  alertDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  alertCtaBtn: { backgroundColor: '#F59E0B', width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  alertCtaText: { color: 'white', fontSize: 15, fontWeight: '800' },
  alertCancelBtn: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  alertCancelText: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5, fontWeight: '600' },
});
