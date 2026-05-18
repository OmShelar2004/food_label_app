import React, { useState, useRef, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Send, ChevronLeft, Trash2, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './LanguageContext';

import { CHAT_API } from '../constants/Config';

function TypingIndicator() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const animate = (dot, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(600),
                ])
            ).start();
        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    return (
        <View style={styles.typingBubble}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
            ))}
        </View>
    );
}

function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    return (
        <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
            {!isUser && (
                <View style={styles.botAvatar}>
                    <Bot color="#38bdf8" size={16} />
                </View>
            )}
            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
                    {message.text}
                </Text>
                <Text style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextBot]}>
                    {message.time}
                </Text>
            </View>
        </View>
    );
}

function getTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const flatListRef = useRef(null);

    const getSuggestedPrompts = () => [
        t('chat_prompt_1'),
        t('chat_prompt_2'),
        t('chat_prompt_3'),
        t('chat_prompt_4'),
        t('chat_prompt_5'),
        t('chat_prompt_6'),
    ];

    const [messages, setMessages] = useState([
        {
            id: '0',
            role: 'bot',
            text: t('chat_welcome'),
            time: getTime(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Build history for /api/chat (exclude the welcome message)
    const buildHistory = (msgs) =>
        msgs
            .slice(1)
            .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

    const sendMessage = useCallback(async (text) => {
        const userText = (text || input).trim();
        if (!userText || loading) return;
        setInput('');

        const userMsg = { id: Date.now().toString(), role: 'user', text: userText, time: getTime() };
        setMessages((prev) => {
            const updated = [...prev, userMsg];
            return updated;
        });
        setLoading(true);

        try {
            const res = await fetch(CHAT_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    history: buildHistory([...messages, userMsg]),
                }),
            });
            const data = await res.json();
            const botText = data.reply || data.error || t('chat_fallback');
            const botMsg = { id: (Date.now() + 1).toString(), role: 'bot', text: botText, time: getTime() };
            setMessages((prev) => [...prev, botMsg]);
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: 'bot', text: t('chat_error_connect'), time: getTime() },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, t]);

    const clearChat = () => {
        setMessages([
            {
                id: '0',
                role: 'bot',
                text: t('chat_cleared'),
                time: getTime(),
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ChevronLeft color="#94a3b8" size={22} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.botBadge}>
                        <Bot color="#38bdf8" size={18} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{t('chat_header_title')}</Text>
                        <View style={styles.onlineRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>{t('chat_powered_by')}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity onPress={clearChat} style={styles.headerBtn}>
                    <Trash2 color="#64748b" size={18} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    renderItem={({ item }) => <MessageBubble message={item} />}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListFooterComponent={loading ? <TypingIndicator /> : null}
                    showsVerticalScrollIndicator={false}
                />

                {/* Suggested prompts (shown only at start) */}
                {messages.length === 1 && !loading && (
                    <View style={styles.suggestionsContainer}>
                        <View style={styles.suggestionsRow}>
                            <Sparkles color="#38bdf8" size={14} />
                            <Text style={styles.suggestionsLabel}>{t('chat_suggestions_label')}</Text>
                        </View>
                        <FlatList
                            horizontal
                            data={getSuggestedPrompts()}
                            keyExtractor={(_, i) => String(i)}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionChip}
                                    onPress={() => sendMessage(item)}
                                >
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('chat_placeholder')}
                        placeholderTextColor="#475569"
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={500}
                        onSubmitEditing={() => sendMessage()}
                        returnKeyType="send"
                        blurOnSubmit
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                        onPress={() => sendMessage()}
                        disabled={!input.trim() || loading}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Send color="#fff" size={20} />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    botBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(56,189,248,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.4)',
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
    onlineText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },
    messagesList: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 8 },
    messageRow: { marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end' },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowBot: { justifyContent: 'flex-start' },
    botAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(56,189,248,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.3)',
    },
    bubble: {
        maxWidth: '78%',
        padding: 14,
        borderRadius: 20,
    },
    bubbleUser: {
        backgroundColor: '#1d4ed8',
        borderBottomRightRadius: 4,
    },
    bubbleBot: {
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    bubbleText: { fontSize: 15, lineHeight: 22 },
    bubbleTextUser: { color: '#fff' },
    bubbleTextBot: { color: '#e2e8f0' },
    timeText: { fontSize: 10, marginTop: 4 },
    timeTextUser: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
    timeTextBot: { color: '#475569' },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 14,
        gap: 5,
        alignSelf: 'flex-start',
        marginLeft: 38,
        marginBottom: 14,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#38bdf8',
    },
    suggestionsContainer: { paddingBottom: 8 },
    suggestionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    suggestionsLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
    suggestionChip: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    suggestionText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        backgroundColor: '#0f172a',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 12,
        color: '#f1f5f9',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#334155',
        maxHeight: 120,
    },
    sendBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#1d4ed8',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1d4ed8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    sendBtnDisabled: { backgroundColor: '#1e293b', shadowOpacity: 0 },
});
