import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const SUGGESTED = [
  { id: '1', username: 'baraka_savo', displayName: 'Baraka Savo', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=baraka&backgroundColor=b6e3f4' },
  { id: '2', username: 'ckitekite', displayName: 'kitekite comedian', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=ckite&backgroundColor=c0aede' },
  { id: '3', username: 'azziad_naisenya2', displayName: 'azziad_naisenya2', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=azziad&backgroundColor=ffdfbf' },
  { id: '4', username: 'kitekitecomedian', displayName: 'Washira Sam', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=washira&backgroundColor=ffd5dc' },
  { id: '5', username: 'ecclesia_4christ', displayName: 'EcclesiaBs', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=ecclesia&backgroundColor=d1f4cc' },
  { id: '6', username: 'johnkiarie773', displayName: 'john kiarie', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=john&backgroundColor=b6e3f4' },
];

export default function CloseFriendsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = SUGGESTED.filter(
    u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFinish = () => {
    console.log('Close friends selected:', Array.from(selected));
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Close Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Notice */}
      <Text style={styles.notice}>
        We don't send notifications when you edit your Close Friends list.{' '}
        <Text style={{ color: '#3B82F6' }}>How it works.</Text>
      </Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="rgba(255,255,255,0.35)"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={<Text style={styles.sectionLabel}>Suggested</Text>}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => toggleSelect(item.id)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.displayName}>{item.displayName}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleFinish} style={styles.finishedBtn}>
          <Text style={styles.finishedBtnText}>
            Finished{selected.size > 0 ? ` (${selected.size})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40 },
  backArrow: { color: 'white', fontSize: 22 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700' },

  notice: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 14, lineHeight: 18 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', marginHorizontal: 14, marginBottom: 4, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 15, paddingVertical: 12 },

  sectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 },

  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 14, backgroundColor: '#222' },
  username: { color: 'white', fontSize: 14.5, fontWeight: '700' },
  displayName: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, marginTop: 2 },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  finishedBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  finishedBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
