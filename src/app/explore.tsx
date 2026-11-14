import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BirdCard } from '../components/BirdCard';
import { BirdSearchSuggestions } from '../components/BirdSearchSuggestions';
import { SearchBar } from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
import { INITIAL_BIRDS_DATA } from '../data/birdsData';
import { BIRD_LOCAL_IMAGES } from '../data/birdImages';
import { getFavoriteBirds, toggleFavorite } from '../db/birdsRepo';
import { Bird } from '../types';
import { useBirdSearch } from '../hooks/useBirdSearch';

type CatalogFilter = 'all' | 'endemic' | 'atRisk';

const filters: { key: CatalogFilter; label: string }[] = [
  { key: 'all', label: 'All birds' },
  { key: 'endemic', label: 'Endemic' },
  { key: 'atRisk', label: 'At risk' },
];

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const onlineSearch = useBirdSearch(query);

  useEffect(() => {
    let active = true;
    getFavoriteBirds()
      .then((birds) => {
        if (active) setFavorites(Object.fromEntries(birds.map((bird) => [bird.id, true])));
      })
      .catch((error: unknown) => {
        console.error('Unable to load favorite birds:', error);
        Alert.alert('Could not load favorites', 'Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleBirds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return INITIAL_BIRDS_DATA.filter((bird) => {
      const matchesQuery = !normalized || [
        bird.commonName,
        bird.scientificName,
        bird.sinhalaName,
        bird.family,
      ].some((value) => value.toLowerCase().includes(normalized));
      const matchesFilter = filter === 'all' ||
        (filter === 'endemic' && bird.isEndemic) ||
        (filter === 'atRisk' && ['NT', 'VU', 'EN', 'CR'].includes(bird.iucnCode));
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  const handleToggleFavorite = async (birdId: string) => {
    const previous = Boolean(favorites[birdId]);
    setFavorites((current) => ({ ...current, [birdId]: !previous }));
    try {
      const isFavorite = await toggleFavorite(birdId);
      setFavorites((current) => ({ ...current, [birdId]: isFavorite }));
    } catch (error) {
      console.error('Unable to update favorite bird:', error);
      setFavorites((current) => ({ ...current, [birdId]: previous }));
      Alert.alert('Could not update favorite', 'Please try again.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={21} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.sage }]}>FIELD GUIDE</Text>
          <Text style={[styles.title, { color: colors.text }]}>Explore birds</Text>
        </View>
        <Text style={[styles.count, { color: colors.primary }]}>{INITIAL_BIRDS_DATA.length}</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Meet the birds of Sri Lanka. Search by name, family, or browse by group.
      </Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search birds..." />

      <View style={styles.filterRow}>
        {filters.map((item) => {
          const selected = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, { color: selected ? colors.textInverse : colors.textSecondary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.resultCount, { color: colors.textMuted }]}>
        {visibleBirds.length} local {visibleBirds.length === 1 ? 'species' : 'species'}
      </Text>
      <FlatList
        data={visibleBirds}
        keyExtractor={(bird) => bird.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.cardColumn}>
            <BirdCard
              bird={{ ...item, isFavorite: Boolean(favorites[item.id]) }}
              onPress={() => setSelectedBird(item)}
              onFavoriteToggle={() => void handleToggleFavorite(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="binoculars" size={32} color={colors.sage} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No birds found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {query.trim().length >= 2
                ? 'No matching species in the local guide. Check the online results below.'
                : 'Try another search or choose a different group.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          <BirdSearchSuggestions
            query={query}
            suggestions={onlineSearch.suggestions}
            localBirds={INITIAL_BIRDS_DATA}
            loading={onlineSearch.loading}
            error={onlineSearch.error}
            onRetry={onlineSearch.retry}
          />
        }
      />

      <Modal visible={Boolean(selectedBird)} transparent animationType="slide" onRequestClose={() => setSelectedBird(null)}>
        {selectedBird && (
          <View style={styles.modalBackdrop}>
            <View style={[styles.detailSheet, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <View style={styles.detailHeading}>
                  <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>{selectedBird.commonName}</Text>
                  <Text style={[styles.scientificName, { color: colors.textSecondary }]}>{selectedBird.scientificName}</Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close bird details"
                  onPress={() => setSelectedBird(null)}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[selectedBird]}
                keyExtractor={(bird) => bird.id}
                renderItem={({ item }) => (
                  <View>
                    <Image
                      source={BIRD_LOCAL_IMAGES[item.localImageKey] ?? { uri: item.imageUrl }}
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                    <Text style={[styles.detailBody, { color: colors.text }]}>{item.description}</Text>
                    <DetailRow label="Habitat" value={item.habitat} colors={colors} />
                    <DetailRow label="Where to find it" value={item.distributionInSriLanka} colors={colors} />
                    <DetailRow label="Diet" value={item.diet} colors={colors} />
                    <DetailRow label="Did you know?" value={item.interestingFacts[0] ?? item.behavior} colors={colors} />
                  </View>
                )}
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.sage }]}>{label}</Text>
      <Text style={[styles.detailBody, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18 },
  backButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 3 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  count: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, paddingHorizontal: 18, marginTop: 7, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginTop: 10 },
  filterChip: { minHeight: 36, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  filterText: { fontSize: 12, fontWeight: '700' },
  resultCount: { fontSize: 12, fontWeight: '600', paddingHorizontal: 18, marginTop: 14, marginBottom: 9 },
  listContent: { paddingHorizontal: 14, paddingBottom: 24, flexGrow: 1 },
  gridRow: { justifyContent: 'space-between' },
  cardColumn: { width: '48.5%' },
  emptyCard: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 18, padding: 24, margin: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 5 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  detailSheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  detailHeading: { flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  scientificName: { fontSize: 13, fontStyle: 'italic', marginTop: 3 },
  detailImage: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#E6ECE8', marginBottom: 12 },
  detailBody: { fontSize: 14, lineHeight: 21, marginBottom: 10 },
  detailRow: { borderBottomWidth: 1, paddingVertical: 10 },
  detailLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
});
