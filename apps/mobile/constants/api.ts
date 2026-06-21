// Using standard Expo network patterns. 
// For physical devices, you must set EXPO_PUBLIC_API_URL to your machine's local IP address (e.g. 192.168.X.X:4000)
// 10.0.2.2 is the Android emulator's loopback to the host machine.
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
