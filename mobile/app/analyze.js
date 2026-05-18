import React, { useState, useEffect } from 'react';
import { Platform, 
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Camera, Upload, AlertCircle, CheckCircle2, LogOut, Newspaper, MessageCircle, Globe, Volume2, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useLanguage } from './LanguageContext';

import { ANALYZE_API } from '../constants/Config';

export default function AnalyzeScreen() {
    const router = useRouter();
    const { t, toggleLanguage, language } = useLanguage();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Stop speech when navigating away
    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const pickImage = async (useCamera = false) => {
        try {
            Speech.stop();
            setIsSpeaking(false);
            let result;
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            };

            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    setError(t('analyze_camera_error'));
                    return;
                }
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    setError(t('analyze_gallery_error'));
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled) {
                setImage(result.assets[0].uri);
                setResult(null);
                setError(null);
                analyzeImage(result.assets[0]);
            }
        } catch (err) {
            setError(t('analyze_pick_error'));
            console.error(err);
        }
    };

    const analyzeImage = async (imageAsset) => {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', {
            uri: imageAsset.uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });

        try {
            const response = await axios.post(ANALYZE_API, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data);
            // Speak the result automatically
            speakResults(response.data);
        } catch (err) {
            setError(err.response?.data?.error || t('analyze_server_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const speakResults = (data) => {
        if (!data) return;

        Speech.stop();
        setIsSpeaking(true);

        let textToSpeak = `${data.verdict}. `;

        if (data.report && data.report.length > 0) {
            textToSpeak += language === 'hi' ? 'खतरनाक सामग्री: ' : 'Risk factors detected: ';
            data.report.forEach((item, index) => {
                textToSpeak += `${item.ingredient}, `;
            });
        } else {
            textToSpeak += t('analyze_clean_label');
        }

        Speech.speak(textToSpeak, {
            language: language === 'hi' ? 'hi-IN' : 'en-US',
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    const toggleSpeech = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            speakResults(result);
        }
    };

    const getVerdictColor = (verdict) => {
        if (!verdict) return '#64748b';
        const lower = verdict.toLowerCase();
        if (lower.includes('avoid')) return '#ef4444';
        if (lower.includes('safe') || lower.includes('good')) return '#22c55e';
        return '#f59e0b';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.background}
            />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.navBarScroll}
                contentContainerStyle={styles.navBar}
            >
                <TouchableOpacity onPress={() => router.push('/chat')} style={styles.chatBtn}>
                    <MessageCircle color="#4ade80" size={20} />
                    <Text style={styles.chatBtnText}>{t('nav_ai_chat')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/news')} style={styles.newsBtn}>
                    <Newspaper color="#38bdf8" size={20} />
                    <Text style={styles.newsBtnText}>{t('nav_food_news')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
                    <Globe color="#a78bfa" size={18} />
                    <Text style={styles.langBtnText}>अ/A</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace('/')} style={styles.logoutBtn}>
                    <LogOut color="#94a3b8" size={20} />
                    <Text style={styles.logoutText}>{t('nav_sign_out')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={styles.title}>{t('analyze_title')}</Text>
                    <Text style={styles.titleHighlight}>{t('analyze_title_highlight')}</Text>
                    <Text style={styles.subtitle}>{t('analyze_subtitle')}</Text>
                </View>

                {!image && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => pickImage(true)}>
                            <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Camera color="#fff" size={24} style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>{t('analyze_take_photo')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(false)}>
                            <Upload color="#e2e8f0" size={24} style={styles.buttonIcon} />
                            <Text style={styles.secondaryButtonText}>{t('analyze_upload')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {image && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: image }} style={styles.previewImage} />

                        {!loading && (
                            <TouchableOpacity style={styles.resetButton} onPress={() => { setImage(null); setResult(null); Speech.stop(); setIsSpeaking(false); }}>
                                <Text style={styles.resetButtonText}>{t('analyze_scan_another')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>{t('analyze_analyzing')}</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <AlertCircle color="#ef4444" size={24} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {result && (
                    <View style={styles.resultContainer}>

                        <View style={[styles.verdictCard, { backgroundColor: getVerdictColor(result.verdict) + '20', borderColor: getVerdictColor(result.verdict) }]}>
                            <Text style={[styles.verdictText, { color: getVerdictColor(result.verdict) }]}>
                                {result.verdict}
                            </Text>

                            <TouchableOpacity style={styles.speakButton} onPress={toggleSpeech}>
                                {isSpeaking ? (
                                    <Square color="#fff" size={18} fill="#fff" />
                                ) : (
                                    <Volume2 color="#fff" size={20} />
                                )}
                                <Text style={styles.speakButtonText}>
                                    {isSpeaking ? 'Stop' : t('analyze_listen')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>{t('analyze_ingredient_breakdown')}</Text>

                        {result.report && result.report.length > 0 ? (
                            result.report.map((item, index) => (
                                <View key={index} style={[styles.ingredientCard, item.level === 'High' ? styles.highRisk : styles.medRisk]}>
                                    <View style={styles.ingredientHeader}>
                                        {item.level === 'High' ?
                                            <AlertCircle color="#f87171" size={18} /> :
                                            <AlertCircle color="#fbbf24" size={18} />
                                        }
                                        <Text style={styles.ingredientName}>{item.ingredient}</Text>
                                    </View>
                                    <Text style={styles.ingredientReason}>{item.reason}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.safeContainer}>
                                <CheckCircle2 color="#4ade80" size={32} />
                                <Text style={styles.safeText}>{t('analyze_clean_label')}</Text>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    navBarScroll: {
        maxHeight: 60,
        marginTop: 10,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
        paddingRight: 40, // Extra space at the end of scroll
    },
    chatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.4)',
    },
    chatBtnText: {
        color: '#4ade80',
        marginLeft: 5,
        fontWeight: '700',
        fontSize: 13,
    },
    newsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.4)',
    },
    newsBtnText: {
        color: '#38bdf8',
        marginLeft: 6,
        fontWeight: '700',
        fontSize: 14,
    },
    langBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.4)',
    },
    langBtnText: {
        color: '#a78bfa',
        marginLeft: 5,
        fontWeight: '700',
        fontSize: 13,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    logoutText: {
        color: '#94a3b8',
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 14,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#f8fafc',
        textAlign: 'center',
        letterSpacing: 1,
    },
    titleHighlight: {
        fontSize: 42,
        fontWeight: '900',
        color: '#38bdf8',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        paddingHorizontal: 10,
        lineHeight: 24,
    },
    actionContainer: {
        gap: 16,
        marginTop: 10,
    },
    primaryButton: {
        borderRadius: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    secondaryButton: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    buttonIcon: {
        marginRight: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryButtonText: {
        color: '#e2e8f0',
        fontSize: 18,
        fontWeight: '600',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    previewImage: {
        width: '100%',
        height: 350,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    resetButton: {
        paddingVertical: 14,
        paddingHorizontal: 28,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    resetButtonText: {
        color: '#cbd5e1',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#cbd5e1',
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7f1d1d',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ef4444',
        marginBottom: 24,
    },
    errorText: {
        color: '#fecaca',
        marginLeft: 12,
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    resultContainer: {
        marginTop: 24,
    },
    verdictCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    verdictText: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 16,
    },
    speakButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4f46e5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    speakButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 20,
        marginLeft: 4,
    },
    ingredientCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    highRisk: {
        backgroundColor: 'rgba(127, 29, 29, 0.4)',
        borderColor: '#991b1b',
    },
    medRisk: {
        backgroundColor: 'rgba(113, 63, 18, 0.4)',
        borderColor: '#854d0e',
    },
    ingredientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    ingredientName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#f8fafc',
        marginLeft: 8,
    },
    ingredientReason: {
        fontSize: 15,
        color: '#cbd5e1',
        lineHeight: 24,
    },
    safeContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: 'rgba(20, 83, 45, 0.4)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#166534',
    },
    safeText: {
        marginTop: 16,
        fontSize: 18,
        color: '#4ade80',
        fontWeight: '700',
    }
});
