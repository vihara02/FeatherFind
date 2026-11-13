import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { Bird } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BIRD_LOCAL_IMAGES } from '../data/birdImages';
import { IUCNBadge, EndemicBadge } from './Badge';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BirdCardProps {
  bird: Bird;
  onPress: () => void;
  onFavoriteToggle?: () => void;
  horizontal?: boolean;
}

export const BirdCard: React.FC<BirdCardProps> = ({
  bird,
  onPress,
  onFavoriteToggle,
  horizontal = false,
}) => {
  const { colors, isDark } = useTheme();

  // Use local offline bundled image if available, else network fallback
  const localImage = BIRD_LOCAL_IMAGES[bird.localImageKey];
  const imageSource = localImage || { uri: bird.imageUrl };

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Image source={imageSource} style={styles.horizontalImage} resizeMode="cover" />
        <View style={styles.horizontalContent}>
          <View style={styles.badgeRow}>
            {bird.isEndemic && <EndemicBadge compact />}
            <IUCNBadge code={bird.iucnCode} />
          </View>
          <Text style={[styles.commonName, { color: colors.text }]} numberOfLines={1}>
            {bird.commonName}
          </Text>
          <Text style={[styles.scientificName, { color: colors.textSecondary }]} numberOfLines={1}>
            {bird.scientificName}
          </Text>
          {bird.sinhalaName ? (
            <Text style={[styles.nativeName, { color: colors.sage }]} numberOfLines={1}>
              {bird.sinhalaName}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

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
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <View style={styles.imageOverlayTop}>
          {bird.isEndemic ? <EndemicBadge compact /> : <View />}
          {onFavoriteToggle && (
            <Pressable
              hitSlop={8}
              onPress={onFavoriteToggle}
              style={[
                styles.favButton,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)' },
              ]}
            >
              <MaterialCommunityIcons
                name={bird.isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={bird.isFavorite ? '#D93838' : colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
        <View style={styles.imageOverlayBottom}>
          <IUCNBadge code={bird.iucnCode} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.familyText, { color: colors.sage }]}>
          {bird.family} • {bird.averageSize.split(',')[0]}
        </Text>
        <Text style={[styles.commonName, { color: colors.text }]} numberOfLines={1}>
          {bird.commonName}
        </Text>
        <Text style={[styles.scientificName, { color: colors.textSecondary }]} numberOfLines={1}>
          {bird.scientificName}
        </Text>
        {bird.sinhalaName ? (
          <Text style={[styles.nativeName, { color: colors.textMuted }]} numberOfLines={1}>
            {bird.sinhalaName} {bird.tamilName ? `• ${bird.tamilName}` : ''}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#E6ECE8',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageOverlayBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  favButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  familyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  commonName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  nativeName: {
    fontSize: 12,
  },
  horizontalCard: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 12,
  },
  horizontalImage: {
    width: '100%',
    height: 120,
  },
  horizontalContent: {
    padding: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
});
