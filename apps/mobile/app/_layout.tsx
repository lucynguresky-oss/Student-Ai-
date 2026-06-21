import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Entry point — Welcome / Auth gate */}
        <Stack.Screen name="index" />

        {/* Auth screens */}
        <Stack.Screen
          name="auth/login"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{ animation: 'slide_from_right' }}
        />

        {/* Main app — only accessible after login */}
        <Stack.Screen name="(tabs)" />

        {/* Modals & settings */}
        <Stack.Screen
          name="upgrade"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="settings/privacy"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="settings/security"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="settings/change-password"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="settings/close-friends"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}
