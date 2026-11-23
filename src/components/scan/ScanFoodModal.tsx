import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  Image01Icon,
  Cancel01Icon,
  SparklesIcon,
  ArrowRight02Icon,
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { setCachedFoodImageBase64 } from '@/services/gemini';

interface ScanFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (uri: string) => void;
}

export const ScanFoodModal: React.FC<ScanFoodModalProps> = ({
  visible,
  onClose,
  onSelectImage,
}) => {
  const [loadingAction, setLoadingAction] = useState<'camera' | 'gallery' | null>(null);

  /**
   * Take a picture with the device camera.
   * Checks permission, requests if needed, then launches camera.
   */
  const handleTakePhoto = async () => {
    if (loadingAction) return;
    setLoadingAction('camera');

    try {
      const permission = await ImagePicker.getCameraPermissionsAsync();
      let finalStatus = permission.status;

      if (finalStatus !== 'granted') {
        const requested = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = requested.status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Camera Permission Needed',
          'Camera permission is required to take photos of your food. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;

        // If base64 wasn't returned by the image cropper on native, read directly from file
        if (!base64 && asset.uri) {
          try {
            base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readErr) {
            console.warn('[ScanFoodModal] FileSystem camera read error:', readErr);
          }
        }

        if (base64) {
          setCachedFoodImageBase64(base64);
        }
        onClose();
        onSelectImage(asset.uri);
      }
    } catch (error: any) {
      console.error('[ScanFoodModal] Camera error:', error);
      Alert.alert(
        'Unable to Open Camera',
        error?.message || 'An unexpected error occurred while launching the camera.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Select a food picture from the photo gallery / library.
   */
  const handlePickFromGallery = async () => {
    if (loadingAction) return;
    setLoadingAction('gallery');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;

        // If base64 wasn't returned by the gallery cropper on native, read directly from file
        if (!base64 && asset.uri) {
          try {
            base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readErr) {
            console.warn('[ScanFoodModal] FileSystem gallery read error:', readErr);
          }
        }

        if (base64) {
          setCachedFoodImageBase64(base64);
        }
        onClose();
        onSelectImage(asset.uri);
      }
    } catch (error: any) {
      console.error('[ScanFoodModal] Gallery error:', error);
      Alert.alert(
        'Unable to Open Gallery',
        error?.message || 'An unexpected error occurred while opening your photo library.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.dialogCard}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <View style={styles.badgeContainer}>
              <View style={styles.badgeIcon}>
                <HugeiconsIcon icon={SparklesIcon} size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.badgeText}>AI FOOD SCANNER</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Scan Food</Text>
          <Text style={styles.subtitle}>
            Choose how you would like to provide an image of your meal for automated nutrition analysis.
          </Text>

          {/* Action Options */}
          <View style={styles.optionsContainer}>
            {/* Take a Picture Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleTakePhoto}
              activeOpacity={0.85}
              disabled={loadingAction !== null}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(41, 143, 80, 0.12)' }]}>
                {loadingAction === 'camera' ? (
                  <ActivityIndicator size="small" color={AppColors.primary} />
                ) : (
                  <HugeiconsIcon icon={Camera01Icon} size={24} color={AppColors.primary} />
                )}
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Take a Picture</Text>
                <Text style={styles.optionDescription}>
                  Capture your plate directly with your camera
                </Text>
              </View>

              <View style={styles.chevronWrapper}>
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Upload from Gallery Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handlePickFromGallery}
              activeOpacity={0.85}
              disabled={loadingAction !== null}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.12)' }]}>
                {loadingAction === 'gallery' ? (
                  <ActivityIndicator size="small" color="#0284C7" />
                ) : (
                  <HugeiconsIcon icon={Image01Icon} size={24} color="#0284C7" />
                )}
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Upload from Gallery</Text>
                <Text style={styles.optionDescription}>
                  Select an existing photo from your library
                </Text>
              </View>

              <View style={styles.chevronWrapper}>
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.2)',
  },
  badgeIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  optionDescription: {
    color: '#64748B',
    fontSize: 12.5,
  },
  chevronWrapper: {
    paddingLeft: 4,
  },
  cancelButton: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
