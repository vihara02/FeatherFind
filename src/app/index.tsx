import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BirdCard } from '../components/BirdCard';
import { SearchBar } from '../components/SearchBar';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { INITIAL_BIRDS_DATA } from '../data/birdsData';

const quickActions = [
  { label: 'Explore', icon: 'binoculars', color: '#1F6B52' },
  { label: 'Log Sighting', icon: 'camera-plus', color: '#B56A1D' },
  { label: 'Checklist', icon: 'checklist', color: '#3B6F8C' },
  { label: 'Profile', icon: 'account-circle', color: '#5C4B8A' },
];

function FeatherFindHome() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [activeAction, setActiveAction] = useState('Explore');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'sl-junglefowl': true,
  });

  const filteredBirds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const birds = INITIAL_BIRDS_DATA.map((bird) => ({
      ...bird,
      isFavorite: Boolean(favorites[bird.id]),
    }));

    if (!normalized) return birds.slice(0, 4);

    return birds.filter((bird) =>
      bird.commonName.toLowerCase().includes(normalized) ||
      bird.scientificName.toLowerCase().includes(normalized) ||
      bird.sinhalaName.toLowerCase().includes(normalized) ||
      bird.family.toLowerCase().includes(normalized)
    ).slice(0, 6);
  }, [favorites, query]);

  const handleQuickActionPress = (label: string) => {
    setActiveAction(label);
    Alert.alert('Feature ready', `${label} is active and responding.`);
  };

  const handleToggleFavorite = (birdId: string) => {
    setFavorites((prev) => ({
      ...prev,
      [birdId]: !prev[birdId],
    }));
  };

  const handleBirdPress = (birdName: string) => {
    Alert.alert('Bird selected', `${birdName} has been opened for viewing.`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.sage }]}>FeatherFind</Text>
            <Text style={[styles.title, { color: colors.text }]}>Birds of Sri Lanka</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.primary }]}>{INITIAL_BIRDS_DATA.length} species</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Discover endemic birds, habitats, and your field sightings in one place.
        </Text>

        <View style={styles.statsRow}>
          {[
            { value: '128', label: 'Sightings' },
            { value: '9', label: 'Habitats' },
            { value: '19', label: 'Endemics' },
            { value: '3', label: 'Trips' },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.quickAction,
                {
                  backgroundColor: activeAction === action.label ? colors.primary : colors.surface,
                  borderColor: activeAction === action.label ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => handleQuickActionPress(action.label)}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${action.color}15` }]}>
                <MaterialCommunityIcons name={action.icon as any} size={20} color={activeAction === action.label ? colors.textInverse : action.color} />
              </View>
              <Text style={[styles.quickActionText, { color: activeAction === action.label ? colors.textInverse : colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search birds..." />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured species</Text>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>View all</Text>
        </View>

        {filteredBirds.length > 0 ? (
          filteredBirds.map((bird) => (
            <BirdCard
              key={bird.id}
              bird={bird}
              onPress={() => handleBirdPress(bird.commonName)}
              onFavoriteToggle={() => handleToggleFavorite(bird.id)}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No birds found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try a different keyword like “magpie”, “forest”, or “endemic”.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <FeatherFindHome />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  quickAction: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
