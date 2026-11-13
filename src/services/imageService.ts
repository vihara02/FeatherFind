import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface PickedImageResult {
  uri: string;
  base64?: string | null;
  width?: number;
  height?: number;
}

export async function takeBirdPhoto(): Promise<PickedImageResult | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Needed',
        'FeatherFind needs camera access so you can photograph birds in the field.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64,
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    console.error('Error taking bird photo:', error);
    Alert.alert('Camera Error', 'Could not access camera. Please check app permissions in settings.');
    return null;
  }
}

export async function pickBirdFromGallery(): Promise<PickedImageResult | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Needed',
        'FeatherFind needs photo library access to select bird images from your gallery.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64,
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    console.error('Error picking photo from gallery:', error);
    Alert.alert('Gallery Error', 'Could not open image gallery.');
    return null;
  }
}
