import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Sighting } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SightingCardProps {
  sighting: Sighting;
  onPress: () => void;
  defaultBirdImage?: any;
}

export const SightingCard: React.FC<SightingCardProps> = ({
  sighting,
  onPress,
  defaultBirdImage,
}) => {
  const { colors } = useTheme();

  // If user took a photo, use photoUri; otherwise fallback to the bird's species image
  const imageSource = sighting.photoUri ? { uri: sighting.photoUri } : defaultBirdImage;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        {imageSource ? (
          <Image source={imageSource} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbPlaceholder, { backgroundColor: colors.sageSubtle }]}>
            <MaterialCommunityIcons name="feather" size={24} color={colors.primary} />
          </View>
        )}

        <View style={styles.headerInfo}>
          <View style={styles.topRow}>
            <Text style={[styles.birdName, { color: colors.text }]} numberOfLines={1}>
              {sighting.birdName}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.sageSubtle }]}>
              <MaterialCommunityIcons name="eye" size={12} color={colors.primary} />
              <Text style={[styles.countText, { color: colors.primary }]}>{sighting.count}</Text>
            </View>
          </View>

          {sighting.scientificName ? (
            <Text style={[styles.scientificName, { color: colors.textSecondary }]} numberOfLines={1}>
              {sighting.scientificName}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-clock" size={13} color={colors.sage} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {sighting.date} at {sighting.time}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#C84B31" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {sighting.locationName}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
        <View style={styles.habitatTag}>
          <MaterialCommunityIcons name="tree" size={11} color={colors.sage} />
          <Text style={[styles.habitatText, { color: colors.sage }]}>{sighting.habitat}</Text>
        </View>

        {sighting.notes ? (
          <Text style={[styles.notesSnippet, { color: colors.textMuted }]} numberOfLines={1}>
            "{sighting.notes}"
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  thumbImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E6ECE8',
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  birdName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scientificName: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
  cardFooter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(94, 126, 103, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  habitatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesSnippet: {
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
});
