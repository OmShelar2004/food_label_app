import { Stack } from 'expo-router';
import { LanguageProvider } from './LanguageContext';

export default function Layout() {
    return (
        <LanguageProvider>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="analyze" options={{ headerShown: false }} />
                <Stack.Screen name="news" options={{ headerShown: false }} />
                <Stack.Screen name="chat" options={{ headerShown: false }} />
            </Stack>
        </LanguageProvider>
    );
}
