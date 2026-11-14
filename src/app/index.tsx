import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BirdCard } from '../components/BirdCard';
import { SearchBar } from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
import { INITIAL_BIRDS_DATA } from '../data/birdsData';
import { BIRD_LOCAL_IMAGES } from '../data/birdImages';
import { SRI_LANKA_HABITATS } from '../constants/Habitats';
import { ChecklistItem, getChecklist, toggleChecklistSpotted } from '../db/checklistRepo';
import { getFavoriteBirds, toggleFavorite } from '../db/birdsRepo';
import { addSighting, getBirdStats } from '../db/sightingsRepo';
import { Bird, BirdStats } from '../types';
import { getCurrentGPSLocation } from '../services/locationService';
import { takeBirdPhoto } from '../services/imageService';

const quickActions = [
  { label: 'Explore', icon: 'binoculars', color: '#1F6B52' },
  { label: 'Identify bird', icon: 'creation', color: '#6A5AA6' },
  { label: 'Log Sighting', icon: 'camera-plus', color: '#B56A1D' },
  { label: 'Checklist', icon: 'clipboard-check-outline', color: '#3B6F8C' },
] as const;

type ModalName = 'sighting' | 'checklist' | 'profile' | null;

function localDateTime() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function getBirdOfTheDay(date = new Date()): Bird | null {
  const birdCount = INITIAL_BIRDS_DATA.length;
  if (birdCount === 0) return null;
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const index = ((dayNumber % birdCount) + birdCount) % birdCount;
  return INITIAL_BIRDS_DATA[index];
}

function FeatherFindHome() {
  const { colors, isDark, setThemeMode } = useTheme();
  const [query, setQuery] = useState('');
  const [activeAction, setActiveAction] = useState('Explore');
  const [showAll, setShowAll] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [birdStats, setBirdStats] = useState<BirdStats | null>(null);
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [sightingBird, setSightingBird] = useState<Bird | null>(null);
  const [birdPickerQuery, setBirdPickerQuery] = useState('');
  const [locationName, setLocationName] = useState('');
  const [sightingNotes, setSightingNotes] = useState('');
  const [sightingCount, setSightingCount] = useState('1');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [savingSighting, setSavingSighting] = useState(false);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const birdOfTheDay = getBirdOfTheDay();

  const loadDatabaseData = useCallback(
    () => Promise.all([getBirdStats(), getFavoriteBirds()] as const),
    []
  );

  const refreshDatabaseData = useCallback(async () => {
    const [stats, favoriteBirds] = await loadDatabaseData();
    setBirdStats(stats);
    setFavorites(Object.fromEntries(favoriteBirds.map((bird) => [bird.id, true])));
  }, [loadDatabaseData]);

  useEffect(() => {
    let active = true;
    loadDatabaseData()
      .then(([stats, favoriteBirds]) => {
        if (!active) return;
        setBirdStats(stats);
        setFavorites(Object.fromEntries(favoriteBirds.map((bird) => [bird.id, true])));
      })
      .catch((error: unknown) => {
        console.error('Unable to load birding data:', error);
        Alert.alert('Could not load data', 'Please close and reopen FeatherFind to try again.');
      });
    return () => {
      active = false;
    };
  }, [loadDatabaseData]);

  const filteredBirds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const birds = INITIAL_BIRDS_DATA.map((bird) => ({
      ...bird,
      isFavorite: Boolean(favorites[bird.id]),
    }));
    const matches = !normalized
      ? birds
      : birds.filter((bird) =>
          bird.commonName.toLowerCase().includes(normalized) ||
          bird.scientificName.toLowerCase().includes(normalized) ||
          bird.sinhalaName.toLowerCase().includes(normalized) ||
          bird.family.toLowerCase().includes(normalized)
        );
    return normalized || showAll ? matches : matches.slice(0, 4);
  }, [favorites, query, showAll]);

  const pickerBirds = useMemo(() => {
    const normalized = birdPickerQuery.trim().toLowerCase();
    return INITIAL_BIRDS_DATA.filter((bird) =>
      bird.commonName.toLowerCase().includes(normalized) ||
      bird.scientificName.toLowerCase().includes(normalized)
    );
  }, [birdPickerQuery]);

  const showError = (title: string, error: unknown) => {
    console.error(`${title}:`, error);
    Alert.alert(title, 'Please try again.');
  };

  const openSightingForm = (bird?: Bird) => {
    setSightingBird(bird ?? null);
    setBirdPickerQuery('');
    setLocationName('');
    setSightingNotes('');
    setSightingCount('1');
    setPhotoUri(null);
    setCoordinates(null);
    setActiveModal('sighting');
    setActiveAction('Log Sighting');
  };

  const handleQuickActionPress = (label: string) => {
    setActiveAction(label);
    if (label === 'Explore') {
      router.push('/explore');
      return;
    }
    if (label === 'Identify bird') {
      router.push('/identify');
      return;
    }
    if (label === 'Log Sighting') {
      openSightingForm();
      return;
    }
    if (label === 'Checklist') {
      setActiveModal('checklist');
      setLoadingChecklist(true);
      getChecklist()
        .then(setChecklist)
        .catch((error: unknown) => showError('Could not load checklist', error))
        .finally(() => setLoadingChecklist(false));
      return;
    }
  };

  const handleToggleFavorite = async (birdId: string) => {
    const previous = Boolean(favorites[birdId]);
    setFavorites((current) => ({ ...current, [birdId]: !previous }));
    try {
      const isFavorite = await toggleFavorite(birdId);
      setFavorites((current) => ({ ...current, [birdId]: isFavorite }));
    } catch (error) {
      setFavorites((current) => ({ ...current, [birdId]: previous }));
      showError('Could not update favorite', error);
    }
  };

  const handleChecklistToggle = async (item: ChecklistItem) => {
    const spotted = !item.isSpotted;
    setChecklist((current) =>
      current.map((entry) => entry.bird.id === item.bird.id
        ? { ...entry, isSpotted: spotted, spottedDate: spotted ? localDateTime().date : null }
        : entry)
    );
    try {
      await toggleChecklistSpotted(item.bird.id, spotted);
    } catch (error) {
      setChecklist((current) =>
        current.map((entry) => entry.bird.id === item.bird.id ? item : entry)
      );
      showError('Could not update checklist', error);
    }
  };

  const handleSaveSighting = async () => {
    if (!sightingBird) {
      Alert.alert('Choose a bird', 'Select the bird you spotted before saving.');
      return;
    }
    if (!locationName.trim()) {
      Alert.alert('Add a location', 'Enter a location or use GPS before saving this sighting.');
      return;
    }
    const count = Number.parseInt(sightingCount, 10);
    if (!Number.isInteger(count) || count < 1) {
      Alert.alert('Check the count', 'Enter a whole number greater than zero.');
      return;
    }

    setSavingSighting(true);
    try {
      const { date, time } = localDateTime();
      await addSighting({
        birdId: sightingBird.id,
        birdName: sightingBird.commonName,
        scientificName: sightingBird.scientificName,
        date,
        time,
        locationName: locationName.trim(),
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        habitat: sightingBird.habitat,
        count,
        notes: sightingNotes.trim(),
        photoUri,
      });
      setActiveModal(null);
      Alert.alert('Sighting saved', `${sightingBird.commonName} was added to your journal and checklist.`);
      refreshDatabaseData().catch((error: unknown) => {
        showError('Sighting saved, but stats could not refresh', error);
      });
    } catch (error) {
      showError('Could not save sighting', error);
    } finally {
      setSavingSighting(false);
    }
  };

  const handleUseGPS = async () => {
    setLoadingLocation(true);
    try {
      const location = await getCurrentGPSLocation();
      if (!location) {
        Alert.alert('Location unavailable', 'Allow location access in your device settings, or enter a location manually.');
      } else {
        setLocationName(location.locationName ?? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        setCoordinates({ latitude: location.latitude, longitude: location.longitude });
      }
    } catch (error) {
      showError('Could not get location', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    setLoadingPhoto(true);
    try {
      const photo = await takeBirdPhoto();
      if (photo) setPhotoUri(photo.uri);
    } catch (error) {
      showError('Could not take photo', error);
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handleThemeToggle = async () => {
    try {
      await setThemeMode(isDark ? 'light' : 'dark');
    } catch (error) {
      showError('Could not save appearance', error);
    }
  };

  const closeModal = () => setActiveModal(null);
  const actionButtonStyle = (selected: boolean) => [
    styles.secondaryButton,
    {
      backgroundColor: selected ? colors.primary : colors.surface,
      borderColor: selected ? colors.primary : colors.border,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.sage }]}>FeatherFind</Text>
            <Text style={[styles.title, { color: colors.text }]}>Birds of Sri Lanka</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>{INITIAL_BIRDS_DATA.length} species</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
              style={[styles.themeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setActiveModal('profile')}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              style={[styles.themeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleThemeToggle}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Discover endemic birds, habitats, and your field sightings in one place.
        </Text>

        <ImageBackground
          source={BIRD_LOCAL_IMAGES.sl_blue_magpie}
          style={styles.featureCard}
          imageStyle={styles.featureImage}
          resizeMode="cover"
        >
          <View style={styles.featureScrim}>
            <View style={styles.featureBadge}>
              <MaterialCommunityIcons name="leaf" size={13} color="#F6D68C" />
              <Text style={styles.featureBadgeText}>YOUR FIELD GUIDE</Text>
            </View>
            <Text style={styles.featureTitle}>Find your next{'\n'}feathered friend.</Text>
            <Text style={styles.featureDescription}>Explore 36+ birds and learn what makes each one special.</Text>
            <View style={styles.featureActions}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.featurePrimary}
                onPress={() => router.push('/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.featurePrimaryText}>Explore birds</Text>
                <MaterialCommunityIcons name="arrow-right" size={17} color="#183D2A" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Identify a bird from a photo"
                style={styles.featureCamera}
                onPress={() => router.push('/identify')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera" size={19} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {birdOfTheDay && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Bird of the day: ${birdOfTheDay.commonName}. View details.`}
            style={[styles.dailyBirdCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSelectedBird(birdOfTheDay)}
            activeOpacity={0.82}
          >
            <Image
              source={BIRD_LOCAL_IMAGES[birdOfTheDay.localImageKey] ?? { uri: birdOfTheDay.imageUrl }}
              style={styles.dailyBirdImage}
              resizeMode="cover"
            />
            <View style={styles.dailyBirdContent}>
              <Text style={[styles.dailyBirdEyebrow, { color: colors.primary }]}>BIRD OF THE DAY</Text>
              <Text style={[styles.dailyBirdName, { color: colors.text }]} numberOfLines={1}>
                {birdOfTheDay.commonName}
              </Text>
              <Text style={[styles.dailyBirdScientific, { color: colors.textSecondary }]} numberOfLines={1}>
                {birdOfTheDay.scientificName}
              </Text>
              <Text style={[styles.dailyBirdFact, { color: colors.textSecondary }]} numberOfLines={2}>
                {birdOfTheDay.interestingFacts[0] ?? birdOfTheDay.description}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          {[
            { value: birdStats?.totalSightings ?? '—', label: 'Sightings' },
            { value: SRI_LANKA_HABITATS.length, label: 'Habitats' },
            { value: birdStats?.totalEndemicsInDB ?? '—', label: 'Endemics' },
            { value: birdStats?.uniqueSpeciesCount ?? '—', label: 'Species seen' },
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
              accessibilityRole="button"
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
                <MaterialCommunityIcons name={action.icon} size={20} color={activeAction === action.label ? colors.textInverse : action.color} />
              </View>
              <Text style={[styles.quickActionText, { color: activeAction === action.label ? colors.textInverse : colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search birds..." />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {query ? 'Search results' : showAll ? 'All species' : 'Featured species'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowAll((current) => !current)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionLink, { color: colors.primary }]}>{showAll ? 'Show less' : 'View all'}</Text>
          </TouchableOpacity>
        </View>

        {filteredBirds.length > 0 ? (
          filteredBirds.map((bird) => (
            <BirdCard
              key={bird.id}
              bird={bird}
              onPress={() => setSelectedBird(bird)}
              onFavoriteToggle={() => void handleToggleFavorite(bird.id)}
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

      <Modal visible={Boolean(selectedBird)} transparent animationType="slide" onRequestClose={() => setSelectedBird(null)}>
        {selectedBird && (
          <View style={styles.modalBackdrop}>
            <View style={[styles.detailSheet, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{selectedBird.commonName}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close bird details" onPress={() => setSelectedBird(null)} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={BIRD_LOCAL_IMAGES[selectedBird.localImageKey] ?? { uri: selectedBird.imageUrl }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
                <Text style={[styles.detailScientific, { color: colors.textSecondary }]}>{selectedBird.scientificName}</Text>
                <Text style={[styles.detailBody, { color: colors.text }]}>{selectedBird.description}</Text>
                <DetailRow label="Habitat" value={selectedBird.habitat} colors={colors} />
                <DetailRow label="Range" value={selectedBird.distributionInSriLanka} colors={colors} />
                <DetailRow label="Diet" value={selectedBird.diet} colors={colors} />
                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => {
                    const bird = selectedBird;
                    setSelectedBird(null);
                    openSightingForm(bird);
                  }}>
                    <MaterialCommunityIcons name="camera-plus" size={18} color={colors.textInverse} />
                    <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>Log sighting</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={actionButtonStyle(Boolean(favorites[selectedBird.id]))} onPress={() => void handleToggleFavorite(selectedBird.id)}>
                    <MaterialCommunityIcons name={favorites[selectedBird.id] ? 'heart' : 'heart-outline'} size={19} color={favorites[selectedBird.id] ? '#D93838' : colors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{favorites[selectedBird.id] ? 'Saved' : 'Favorite'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      <Modal visible={activeModal === 'sighting'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Log a sighting</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close sighting form" onPress={closeModal} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {sightingBird ? (
                  <View style={[styles.selectedBird, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bird</Text>
                    <Text style={[styles.selectedBirdName, { color: colors.text }]}>{sightingBird.commonName}</Text>
                    <TouchableOpacity onPress={() => setSightingBird(null)}>
                      <Text style={[styles.sectionLink, { color: colors.primary }]}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Choose a bird</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                      value={birdPickerQuery}
                      onChangeText={setBirdPickerQuery}
                      placeholder="Search species..."
                      placeholderTextColor={colors.textMuted}
                    />
                    <View style={styles.birdPickerList}>
                      {pickerBirds.slice(0, 5).map((bird) => (
                        <TouchableOpacity key={bird.id} style={[styles.birdPickerItem, { borderBottomColor: colors.border }]} onPress={() => setSightingBird(bird)}>
                          <Text style={[styles.birdPickerText, { color: colors.text }]}>{bird.commonName}</Text>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                      ))}
                      {pickerBirds.length === 0 && <Text style={[styles.helperText, { color: colors.textMuted }]}>No matching species found.</Text>}
                    </View>
                  </>
                )}

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Location *</Text>
                <View style={styles.locationRow}>
                  <TextInput
                    style={[styles.input, styles.locationInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                    value={locationName}
                    onChangeText={(value) => {
                      setLocationName(value);
                      setCoordinates(null);
                    }}
                    placeholder="Where did you see it?"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => void handleUseGPS()} disabled={loadingLocation}>
                    <MaterialCommunityIcons name={loadingLocation ? 'progress-clock' : 'crosshairs-gps'} size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Number of birds</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={sightingCount}
                  onChangeText={setSightingCount}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={sightingNotes}
                  onChangeText={setSightingNotes}
                  multiline
                  placeholder="Behavior, weather, or other details..."
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => void handleTakePhoto()} disabled={loadingPhoto}>
                  <MaterialCommunityIcons name={photoUri ? 'check-circle' : 'camera'} size={19} color={colors.primary} />
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{loadingPhoto ? 'Opening camera...' : photoUri ? 'Photo attached' : 'Add a photo'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.saveButton, { backgroundColor: colors.primary, opacity: savingSighting ? 0.65 : 1 }]}
                  onPress={() => void handleSaveSighting()}
                  disabled={savingSighting}
                >
                  <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>{savingSighting ? 'Saving...' : 'Save sighting'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={activeModal === 'checklist'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>My checklist</Text>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  {checklist.filter((item) => item.isSpotted).length} of {checklist.length} species spotted
                </Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close checklist" onPress={closeModal} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {loadingChecklist ? (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Loading checklist...</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {checklist.map((item) => (
                  <TouchableOpacity
                    key={item.bird.id}
                    style={[styles.checklistItem, { borderBottomColor: colors.border }]}
                    onPress={() => void handleChecklistToggle(item)}
                  >
                    <View style={[styles.checkbox, { borderColor: item.isSpotted ? colors.primary : colors.border, backgroundColor: item.isSpotted ? colors.primary : 'transparent' }]}>
                      {item.isSpotted && <MaterialCommunityIcons name="check" size={15} color={colors.textInverse} />}
                    </View>
                    <View style={styles.checklistText}>
                      <Text style={[styles.birdPickerText, { color: colors.text }]}>{item.bird.commonName}</Text>
                      <Text style={[styles.helperText, { color: colors.textSecondary }]}>{item.isSpotted ? `Spotted ${item.spottedDate ?? ''}` : item.bird.family}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'profile'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Your field profile</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close profile" onPress={closeModal} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="account-circle" size={42} color={colors.primary} />
                <View style={styles.profileInfo}>
                  <Text style={[styles.selectedBirdName, { color: colors.text }]}>Sri Lankan Explorer</Text>
                  <Text style={[styles.helperText, { color: colors.textSecondary }]}>Your birding activity is saved on this device.</Text>
                </View>
              </View>
              <View style={[styles.profileStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ProfileStat label="Sightings" value={birdStats?.totalSightings ?? 0} colors={colors} />
                <ProfileStat label="Species" value={birdStats?.uniqueSpeciesCount ?? 0} colors={colors} />
                <ProfileStat label="Favorites" value={Object.values(favorites).filter(Boolean).length} colors={colors} />
              </View>
              <TouchableOpacity style={[styles.themeRow, { borderColor: colors.border }]} onPress={() => void handleThemeToggle()}>
                <View style={styles.themeRowText}>
                  <MaterialCommunityIcons name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'} size={21} color={colors.primary} />
                  <Text style={[styles.birdPickerText, { color: colors.text }]}>{isDark ? 'Dark appearance' : 'Light appearance'}</Text>
                </View>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>Switch</Text>
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Your appearance preference is saved and used next time you open the app.
              </Text>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.sage }]}>{label}</Text>
      <Text style={[styles.detailBody, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function ProfileStat({ label, value, colors }: { label: string; value: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={styles.profileStat}>
      <Text style={[styles.profileStatValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function Page() {
  return <FeatherFindHome />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerText: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  pillText: { fontSize: 12, fontWeight: '700' },
  themeButton: { width: 40, height: 40, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  featureCard: { height: 245, borderRadius: 22, overflow: 'hidden', marginBottom: 18, backgroundColor: '#183D2A' },
  featureImage: { borderRadius: 22 },
  featureScrim: { flex: 1, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(11, 25, 16, 0.48)' },
  featureBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(10, 25, 16, 0.58)', marginBottom: 10 },
  featureBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  featureTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 29, fontWeight: '800', letterSpacing: -0.3 },
  featureDescription: { color: '#F1F4F1', fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 12 },
  featureActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  featurePrimary: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, backgroundColor: '#F5D99A', paddingHorizontal: 13 },
  featurePrimaryText: { color: '#183D2A', fontSize: 13, fontWeight: '800' },
  featureCamera: { width: 40, height: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  dailyBirdCard: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 18 },
  dailyBirdImage: { width: 84, height: 84, borderRadius: 13, backgroundColor: '#E6ECE8' },
  dailyBirdContent: { flex: 1 },
  dailyBirdEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginBottom: 4 },
  dailyBirdName: { fontSize: 15, fontWeight: '800' },
  dailyBirdScientific: { fontSize: 12, fontStyle: 'italic', marginTop: 1, marginBottom: 4 },
  dailyBirdFact: { fontSize: 12, lineHeight: 17 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, gap: 8 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 5, alignItems: 'center' },
  statValue: { fontSize: 21, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  quickActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  quickAction: { width: '48%', borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  quickIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  quickActionText: { fontSize: 13, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  sectionLink: { fontSize: 13, fontWeight: '700' },
  emptyState: { borderWidth: 1, borderRadius: 16, padding: 22, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  keyboardAvoiding: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  detailSheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  modalTitle: { flex: 1, fontSize: 22, fontWeight: '800' },
  detailImage: { width: '100%', height: 210, borderRadius: 16, backgroundColor: '#E6ECE8', marginBottom: 12 },
  detailScientific: { fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  detailBody: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  detailRow: { borderBottomWidth: 1, paddingVertical: 10 },
  detailLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 6 },
  primaryButton: { minHeight: 46, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
  secondaryButton: { minHeight: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 },
  notesInput: { minHeight: 86, paddingTop: 11 },
  selectedBird: { minHeight: 60, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  selectedBirdName: { fontSize: 15, fontWeight: '700' },
  birdPickerList: { marginTop: 4 },
  birdPickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, borderBottomWidth: 1 },
  birdPickerText: { fontSize: 14, fontWeight: '600' },
  helperText: { fontSize: 12, lineHeight: 18 },
  locationRow: { flexDirection: 'row', gap: 8 },
  locationInput: { flex: 1 },
  iconButton: { width: 46, height: 46, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { marginTop: 16, marginBottom: 6 },
  checklistItem: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, gap: 12 },
  checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checklistText: { flex: 1, gap: 2 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  profileInfo: { flex: 1, gap: 4 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 12, marginBottom: 8 },
  profileStat: { alignItems: 'center', gap: 3 },
  profileStatValue: { fontSize: 20, fontWeight: '800' },
  themeRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, marginBottom: 12 },
  themeRowText: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
