import React, { useState, useEffect, useCallback } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    TextInput,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Newspaper, Search, ExternalLink, Calendar, Radio, AlertCircle, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './LanguageContext';

import { NEWS_API } from '../constants/Config';

// Category search queries stay in English for the API (News API is English-based)
const CATEGORY_QUERIES = [
    'food safety banned ingredients food health',
    'banned food ingredients FDA harmful',
    'food additives preservatives health risk',
    'organic food healthy eating nutrition',
    'food recall contamination alert',
];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function NewsCard({ article, readMoreText }) {
    const handlePress = () => {
        if (article.url) Linking.openURL(article.url);
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
            {article.urlToImage ? (
                <Image
                    source={{ uri: article.urlToImage }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.cardImagePlaceholder}>
                    <Newspaper color="#475569" size={32} />
                </View>
            )}

            <View style={styles.cardBody}>
                <View style={styles.cardMeta}>
                    {article.source ? (
                        <View style={styles.sourceBadge}>
                            <Radio color="#38bdf8" size={11} />
                            <Text style={styles.sourceText}>{article.source}</Text>
                        </View>
                    ) : null}
                    <View style={styles.dateBadge}>
                        <Calendar color="#64748b" size={11} />
                        <Text style={styles.dateText}>{formatDate(article.publishedAt)}</Text>
                    </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={3}>{article.title}</Text>

                {article.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{article.description}</Text>
                ) : null}

                <View style={styles.readMore}>
                    <Text style={styles.readMoreText}>{readMoreText}</Text>
                    <ExternalLink color="#38bdf8" size={14} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function NewsScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    const getCategories = () => [
        { label: t('news_cat_trending'), q: CATEGORY_QUERIES[0] },
        { label: t('news_cat_banned'), q: CATEGORY_QUERIES[1] },
        { label: t('news_cat_additives'), q: CATEGORY_QUERIES[2] },
        { label: t('news_cat_organic'), q: CATEGORY_QUERIES[3] },
        { label: t('news_cat_recalls'), q: CATEGORY_QUERIES[4] },
    ];

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const fetchNews = useCallback(async (query, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const url = `${NEWS_API}?q=${encodeURIComponent(query)}&pageSize=20`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.error) throw new Error(data.error);
            setArticles(data.articles || []);
        } catch (e) {
            setError(e.message || t('news_loading'));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setSearching(false);
        }
    }, [t]);

    useEffect(() => {
        fetchNews(CATEGORY_QUERIES[activeCategory]);
    }, [activeCategory]);

    const handleCategoryPress = (index) => {
        setActiveCategory(index);
        setSearchQuery('');
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        fetchNews(searchQuery.trim());
    };

    const handleRefresh = () => {
        const q = searchQuery.trim() || CATEGORY_QUERIES[activeCategory];
        fetchNews(q, true);
    };

    const categories = getCategories();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft color="#94a3b8" size={22} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Newspaper color="#38bdf8" size={22} />
                    <Text style={styles.headerTitle}>{t('news_header')}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Search color="#64748b" size={18} style={{ marginHorizontal: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('news_search_placeholder')}
                        placeholderTextColor="#475569"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.searchBtn, searching && styles.searchBtnDisabled]}
                    onPress={handleSearch}
                    disabled={searching}
                >
                    {searching
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.searchBtnText}>{t('news_search_btn')}</Text>
                    }
                </TouchableOpacity>
            </View>

            {/* Category Pills */}
            <View>
                <FlatList
                    horizontal
                    data={categories}
                    keyExtractor={(_, i) => String(i)}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillsContainer}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={[styles.pill, activeCategory === index && styles.pillActive]}
                            onPress={() => handleCategoryPress(index)}
                        >
                            <Text style={[styles.pillText, activeCategory === index && styles.pillTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#38bdf8" />
                    <Text style={styles.loadingText}>{t('news_loading')}</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle color="#f87171" size={36} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                        <Text style={styles.retryText}>{t('news_retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={articles}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item, index }) => (
                        <NewsCard article={item} index={index} readMoreText={t('news_read_more')} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#38bdf8"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Newspaper color="#334155" size={48} />
                            <Text style={styles.emptyText}>{t('news_empty')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: 0.5,
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 12,
        color: '#f1f5f9',
        fontSize: 15,
    },
    searchBtn: {
        backgroundColor: '#3b82f6',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 13,
    },
    searchBtnDisabled: {
        opacity: 0.6,
    },
    searchBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    pillsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
    },
    pillActive: {
        backgroundColor: '#1d4ed8',
        borderColor: '#3b82f6',
    },
    pillText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 13,
    },
    pillTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 4,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    cardImage: {
        width: '100%',
        height: 190,
        backgroundColor: '#0f172a',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: 110,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        padding: 16,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    sourceText: {
        color: '#38bdf8',
        fontSize: 11,
        fontWeight: '700',
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '500',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f1f5f9',
        lineHeight: 22,
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
        marginBottom: 12,
    },
    readMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    readMoreText: {
        color: '#38bdf8',
        fontSize: 13,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
    },
    loadingText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '500',
    },
    errorText: {
        color: '#fca5a5',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryBtn: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
        marginTop: 8,
    },
    retryText: {
        color: '#38bdf8',
        fontWeight: '700',
        fontSize: 15,
    },
    emptyText: {
        color: '#475569',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
});
