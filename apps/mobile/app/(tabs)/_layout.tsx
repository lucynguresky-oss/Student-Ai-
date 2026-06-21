import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';

function NavIcon({ emoji, focused, isClips }: { emoji: string; focused: boolean; isClips?: boolean }) {
  if (isClips) {
    return (
      <View style={{
        width: 44, height: 28, backgroundColor: focused ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
        borderRadius: 7, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 15 }}>▶</Text>
      </View>
    );
  }
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.35 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: 'rgba(255,255,255,0.07)',
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
          tabBarLabelStyle: { fontSize: 9.5, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => <NavIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            tabBarLabel: 'Learn',
            tabBarIcon: ({ focused }) => <NavIcon emoji="📚" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="videos"
          options={{
            tabBarLabel: 'Clips',
            tabBarIcon: ({ focused }) => <NavIcon emoji="" focused={focused} isClips />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            tabBarLabel: 'Books',
            tabBarIcon: ({ focused }) => <NavIcon emoji="📖" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            tabBarLabel: 'AI Tutor',
            tabBarIcon: ({ focused }) => <NavIcon emoji="🤖" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => <NavIcon emoji="👤" focused={focused} />,
          }}
        />
      </Tabs>
    </>
  );
}
