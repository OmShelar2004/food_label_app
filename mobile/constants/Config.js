import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5001';
  }

  // Get the IP address of the machine running the Expo packager
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : null;

  // Fallback to the last known stable IP or localhost
  const host = ip || '192.168.29.53'; 
  
  return `http://${host}:5001`;
};

export const BASE_URL = getBackendUrl();
export const ANALYZE_API = `${BASE_URL}/api/analyze`;
export const CHAT_API = `${BASE_URL}/api/chat`;
export const NEWS_API = `${BASE_URL}/api/news`;
