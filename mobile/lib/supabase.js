import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/SupabaseConfig';

const isValidUrl = (url) => {
    return url && url.startsWith('https://');
};

// Use a mock storage for SSR (server-side rendering) to avoid "window is not defined"
const isWebSSR = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = (isValidUrl(SUPABASE_URL) && !isWebSSR)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.localStorage : undefined) : AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })
    : null;
