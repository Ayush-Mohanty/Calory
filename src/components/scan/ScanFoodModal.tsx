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
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  Image01Icon,
  Cancel01Icon,
  SparklesIcon,
  ArrowRight02Icon,
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';

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
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        onClose();
        onSelectImage(selectedUri);
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
      // In iOS/Android modern Expo, launchImageLibraryAsync automatically presents the system picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        onClose();
        onSelectImage(selectedUri);
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
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="#94A3B8" />
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
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(41, 143, 80, 0.15)' }]}>
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
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#64748B" />
              </View>
            </TouchableOpacity>

            {/* Upload from Gallery Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handlePickFromGallery}
              activeOpacity={0.85}
              disabled={loadingAction !== null}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                {loadingAction === 'gallery' ? (
                  <ActivityIndicator size="small" color="#0EA5E9" />
                ) : (
                  <HugeiconsIcon icon={Image01Icon} size={24} color="#0EA5E9" />
                )}
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Upload from Gallery</Text>
                <Text style={styles.optionDescription}>
                  Select an existing photo from your library
                </Text>
              </View>

              <View style={styles.chevronWrapper}>
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#64748B" />
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
    backgroundColor: 'rgba(5, 8, 12, 0.78)',
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
    backgroundColor: '#12161F',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
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
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.3)',
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
    color: '#6ee7b7',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#94A3B8',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
