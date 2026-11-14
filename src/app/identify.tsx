import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { identifyBirdPhoto } from '../services/birdIdentification';
import { pickBirdFromGallery, takeBirdPhoto, PickedImageResult } from '../services/imageService';
import { AIIdentificationResult } from '../types';

export default function IdentifyScreen() {
  const { colors, isDark } = useTheme();
  const [photo, setPhoto] = useState<PickedImageResult | null>(null);
  const [result, setResult] = useState<AIIdentificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [identifying, setIdentifying] = useState(false);

  const choosePhoto = async (picker: () => Promise<PickedImageResult | null>) => {
    setErrorMessage('');
    try {
      const selected = await picker();
      if (selected) {
        setPhoto(selected);
        setResult(null);
      }
    } catch (error) {
      console.error('Unable to select bird photo:', error);
      setErrorMessage('Could not open the photo. Please try again.');
    }
  };

  const identifyPhoto = async () => {
    if (!photo) {
      setErrorMessage('Take a photo or choose one from your gallery first.');
      return;
    }
    setIdentifying(true);
    setErrorMessage('');
    setResult(null);
    try {
      setResult(await identifyBirdPhoto(photo.uri, photo.base64));
    } catch (error) {
      console.error('Bird identification failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not identify this bird. Please try again.');
    } finally {
      setIdentifying(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={21} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="bird" size={28} color={colors.textInverse} />
          </View>
          <Text style={[styles.title, { color: colors.textInverse }]}>Who’s that bird?</Text>
          <Text style={[styles.subtitle, { color: colors.textInverse }]}>
            Take or choose a clear photo. Our vision model will suggest likely bird species.
          </Text>
        </View>

        {photo ? (
          <View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                setPhoto(null);
                setResult(null);
                setErrorMessage('');
              }}
            >
              <MaterialCommunityIcons name="refresh" size={17} color={colors.primary} />
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>Choose another photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.placeholderIcon, { backgroundColor: colors.sageSubtle }]}>
              <MaterialCommunityIcons name="image-search-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>Your bird photo goes here</Text>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              For best results, keep the bird in focus and fill most of the frame.
            </Text>
          </View>
        )}

        <View style={styles.photoActions}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => void choosePhoto(takeBirdPhoto)}
          >
            <MaterialCommunityIcons name="camera" size={21} color={colors.textInverse} />
            <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>Take a photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => void choosePhoto(pickBirdFromGallery)}
          >
            <MaterialCommunityIcons name="image-multiple-outline" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Choose from gallery</Text>
          </TouchableOpacity>
        </View>

        {photo && (
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.identifyButton, { backgroundColor: colors.accent, opacity: identifying ? 0.7 : 1 }]}
            onPress={() => void identifyPhoto()}
            disabled={identifying}
          >
            {identifying
              ? <ActivityIndicator color={colors.text} />
              : <MaterialCommunityIcons name="creation" size={20} color={colors.text} />}
            <Text style={[styles.identifyButtonText, { color: colors.text }]}>
              {identifying ? 'Looking closely…' : 'Identify this bird'}
            </Text>
          </TouchableOpacity>
        )}

        {errorMessage ? (
          <View style={[styles.errorCard, { backgroundColor: colors.warningLight }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.warning} />
            <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {result?.matches.map((match, index) => (
          <View
            key={`${match.scientificName}-${index}`}
            style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.resultHeading}>
              <View style={[styles.resultIcon, { backgroundColor: colors.sageSubtle }]}>
                <MaterialCommunityIcons name="bird" size={22} color={colors.primary} />
              </View>
              <View style={styles.resultTitleBlock}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>{match.birdName}</Text>
                {!!match.scientificName && (
                  <Text style={[styles.scientificName, { color: colors.textSecondary }]}>{match.scientificName}</Text>
                )}
              </View>
              <Text style={[styles.confidence, { color: colors.primary }]}>
                {Math.round(match.confidence * 100)}%
              </Text>
            </View>
            {!!match.description && <Text style={[styles.resultBody, { color: colors.textSecondary }]}>{match.description}</Text>}
            {!!match.habitatInfo && <InfoRow icon="tree-outline" label="Habitat" value={match.habitatInfo} colors={colors} />}
            {match.identifyingCharacteristics.length > 0 && (
              <View style={styles.traitsBlock}>
                <Text style={[styles.traitsTitle, { color: colors.text }]}>What to look for</Text>
                {match.identifyingCharacteristics.map((trait) => (
                  <View key={trait} style={styles.traitRow}>
                    <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.primary} />
                    <Text style={[styles.traitText, { color: colors.textSecondary }]}>{trait}</Text>
                  </View>
                ))}
              </View>
            )}
            {!!match.notes && <Text style={[styles.resultNote, { color: colors.textMuted }]}>{match.notes}</Text>}
          </View>
        ))}

        <TouchableOpacity style={styles.catalogLink} onPress={() => router.push('/explore')}>
          <Text style={[styles.catalogLinkText, { color: colors.primary }]}>Browse all Sri Lankan birds</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={17} color={colors.sage} />
      <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  backButton: { alignSelf: 'flex-start', minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '600' },
  hero: { borderRadius: 24, padding: 22, marginBottom: 18 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 16 },
  title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, opacity: 0.88 },
  photoCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  photo: { width: '100%', height: 260, backgroundColor: '#E6ECE8' },
  changePhotoButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  changePhotoText: { fontSize: 13, fontWeight: '700' },
  photoPlaceholder: { minHeight: 210, borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  placeholderIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  placeholderTitle: { fontSize: 17, fontWeight: '700', marginBottom: 7, textAlign: 'center' },
  placeholderText: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 270 },
  photoActions: { gap: 10, marginBottom: 12 },
  primaryButton: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
  identifyButton: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 14 },
  identifyButtonText: { fontSize: 15, fontWeight: '800' },
  errorCard: { flexDirection: 'row', gap: 10, borderRadius: 14, padding: 14, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },
  resultCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 4, marginBottom: 12 },
  resultHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resultIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resultTitleBlock: { flex: 1 },
  resultTitle: { fontSize: 18, fontWeight: '800' },
  scientificName: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  confidence: { fontSize: 17, fontWeight: '800' },
  resultBody: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingVertical: 8 },
  infoLabel: { fontSize: 13, fontWeight: '700' },
  infoValue: { flex: 1, fontSize: 13, lineHeight: 19 },
  traitsBlock: { marginTop: 8 },
  traitsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 7 },
  traitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 6 },
  traitText: { flex: 1, fontSize: 13, lineHeight: 19 },
  resultNote: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  catalogLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 46, marginTop: 4 },
  catalogLinkText: { fontSize: 14, fontWeight: '700' },
});
