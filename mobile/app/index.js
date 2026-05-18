import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from './LanguageContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ArrowRight, Globe, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { t, toggleLanguage, language } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
        setError('');
        setSuccess('');

        if (!supabase) {
            setError('Supabase is not configured. Please add your credentials to constants/SupabaseConfig.js');
            return;
        }

        if (!email || !password) {
            setError(t('login_error_empty'));
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) throw signUpError;

                if (data.user && data.session) {
                    // Auto-login on success (if confirmation is off)
                    router.replace('/analyze');
                } else {
                    setSuccess(t('login_success_signup'));
                }
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                router.replace('/analyze');
            }
        } catch (err) {
            if (err.message === 'Invalid login credentials') {
                setError(t('login_error_invalid'));
            } else {
                setError(err.message || t('login_error_general'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4f46e5', '#3b82f6', '#06b6d4']}
                style={styles.background}
            />

            {/* Language toggle top-right */}
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                <Globe color="#fff" size={15} />
                <Text style={styles.langToggleText}>{t('lang_toggle')}</Text>
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.glassCard}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {isSignUp ? t('login_signup_title') : t('login_title')}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isSignUp ? t('login_signup_subtitle') : t('login_subtitle')}
                        </Text>
                    </View>

                    {error ? (
                        <View style={styles.msgBoxError}>
                            <AlertCircle color="#ef4444" size={16} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {success ? (
                        <View style={styles.msgBoxSuccess}>
                            <Text style={styles.successText}>{success}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <View style={styles.inputIcon}>
                            <Mail color="#94a3b8" size={20} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder={t('login_email_placeholder')}
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputIcon}>
                            <Lock color="#94a3b8" size={20} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder={t('login_password_placeholder')}
                            placeholderTextColor="#94a3b8"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>
                                    {isSignUp ? t('login_signup_button') : t('login_button')}
                                </Text>
                                <ArrowRight color="#fff" size={20} style={styles.arrowIcon} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        <Text style={styles.switchText}>
                            {isSignUp ? t('login_switch_to_login') : t('login_switch_to_signup')}
                        </Text>
                    </TouchableOpacity>

                    {!isSignUp && (
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotText}>{t('login_forgot')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    langToggle: {
        position: 'absolute',
        top: 56,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        zIndex: 10,
    },
    langToggleText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    msgBoxError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: 8,
    },
    msgBoxSuccess: {
        backgroundColor: '#f0fdf4',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    successText: {
        color: '#16a34a',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        padding: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    loginButton: {
        backgroundColor: '#4f46e5',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    arrowIcon: {
        marginLeft: 8,
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchText: {
        color: '#4f46e5',
        fontWeight: '600',
        fontSize: 15,
    },
    forgotPassword: {
        marginTop: 16,
        alignItems: 'center',
    },
    forgotText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 14,
    }
});
