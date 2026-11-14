import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Bird } from '../types';
import { BirdTaxonSuggestion } from '../services/birdSearch';

interface BirdSearchSuggestionsProps {
  query: string;
  suggestions: BirdTaxonSuggestion[];
  localBirds: Bird[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function BirdSearchSuggestions({
  query,
  suggestions,
  localBirds,
  loading,
  error,
  onRetry,
}: BirdSearchSuggestionsProps) {
  const { colors } = useTheme();
  const localNames = useMemo(() => new Set(
    localBirds.flatMap((bird) => [
      bird.commonName.toLowerCase(),
      bird.scientificName.toLowerCase(),
    ])
  ), [localBirds]);

  if (query.trim().length < 2) return null;

  const additionalSuggestions = suggestions.filter((bird) =>
    !localNames.has(bird.commonName.toLowerCase()) &&
    !localNames.has(bird.scientificName.toLowerCase())
  );

  const openTaxon = async (taxonId: number) => {
    try {
      await Linking.openURL(`https://www.inaturalist.org/taxa/${taxonId}`);
    } catch (cause) {
      console.error('Unable to open iNaturalist taxon:', cause);
      Alert.alert('Could not open bird details', 'Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>More results online</Text>
        <Text style={[styles.source, { color: colors.textMuted }]}>iNaturalist</Text>
      </View>
      {loading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>Searching bird species…</Text>
        </View>
      ) : error ? (
        <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onRetry} hitSlop={8}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : additionalSuggestions.length === 0 ? (
        <Text style={[styles.statusText, { color: colors.textMuted }]}>No additional species found online.</Text>
      ) : (
        additionalSuggestions.map((bird) => (
          <TouchableOpacity
            key={bird.id}
            accessibilityRole="link"
            accessibilityLabel={`Open ${bird.commonName} on iNaturalist`}
            style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => void openTaxon(bird.id)}
            activeOpacity={0.78}
          >
            {bird.imageUrl ? (
              <Image source={{ uri: bird.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.sageSubtle }]}>
                <MaterialCommunityIcons name="bird" size={22} color={colors.primary} />
              </View>
            )}
            <View style={styles.resultText}>
              <Text style={[styles.commonName, { color: colors.text }]} numberOfLines={1}>{bird.commonName}</Text>
              <Text style={[styles.scientificName, { color: colors.textSecondary }]} numberOfLines={1}>{bird.scientificName}</Text>
              <Text style={[styles.observationCount, { color: colors.textMuted }]}>
                {bird.observationsCount.toLocaleString()} observations
              </Text>
              {!!bird.imageAttribution && (
                <Text style={[styles.imageAttribution, { color: colors.textMuted }]} numberOfLines={2}>
                  {bird.imageAttribution}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons name="open-in-new" size={17} color={colors.primary} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '800' },
  source: { fontSize: 11, fontWeight: '600' },
  statusRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusText: { flex: 1, fontSize: 12, lineHeight: 18 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  retryText: { fontSize: 12, fontWeight: '800' },
  result: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 14, padding: 9, marginBottom: 8 },
  image: { width: 54, height: 54, borderRadius: 10 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  resultText: { flex: 1, gap: 2 },
  commonName: { fontSize: 13, fontWeight: '700' },
  scientificName: { fontSize: 11, fontStyle: 'italic' },
  observationCount: { fontSize: 10 },
  imageAttribution: { fontSize: 8, lineHeight: 11 },
});
