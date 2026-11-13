import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IUCNColors } from '../constants/Colors';
import { IUCNCode } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IUCNBadgeProps {
  code: IUCNCode;
  showLabel?: boolean;
}

export const IUCNBadge: React.FC<IUCNBadgeProps> = ({ code, showLabel = false }) => {
  const conf = IUCNColors[code] || IUCNColors.LC;
  return (
    <View style={[styles.iucnContainer, { backgroundColor: conf.bg, borderColor: conf.border }]}>
      <Text style={[styles.iucnCode, { color: conf.text }]}>{code}</Text>
      {showLabel && <Text style={[styles.iucnLabel, { color: conf.text }]}>{conf.label}</Text>}
    </View>
  );
};

export const EndemicBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <View style={[styles.endemicContainer, compact && styles.endemicCompact]}>
      <MaterialCommunityIcons name="star-four-points" size={12} color="#D49A3D" />
      <Text style={styles.endemicText}>{compact ? 'Endemic' : 'Endemic to Sri Lanka'}</Text>
    </View>
  );
};

export const HabitatBadge: React.FC<{ habitat: string }> = ({ habitat }) => {
  return (
    <View style={styles.habitatContainer}>
      <MaterialCommunityIcons name="tree" size={12} color="#4A5B50" />
      <Text style={styles.habitatText} numberOfLines={1}>{habitat}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  iucnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  iucnCode: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iucnLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  endemicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 154, 61, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 154, 61, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  endemicCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  endemicText: {
    color: '#9C6E1A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  habitatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF1ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    maxWidth: 160,
  },
  habitatText: {
    color: '#4A5B50',
    fontSize: 11,
    fontWeight: '500',
  },
});
