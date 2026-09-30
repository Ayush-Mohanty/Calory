import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Edit02Icon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';

interface WaterCardProps {
  totalWaterLiters: number;
  consumedWaterLiters: number;
  onPlanUpdate?: (updatedWaterLiters: number) => void;
}

const GLASS_VOLUME_L = 0.25; // 250ml per glass

export const WaterCard: React.FC<WaterCardProps> = ({
  totalWaterLiters,
  consumedWaterLiters,
  onPlanUpdate,
}) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editWater, setEditWater] = useState(totalWaterLiters.toString());

  // Calculations
  const totalGlasses = Math.min(16, Math.ceil(totalWaterLiters / GLASS_VOLUME_L));
  
  // Calculate how many full, half, and empty glasses
  const consumedGlassesExact = consumedWaterLiters / GLASS_VOLUME_L;
  const fullGlasses = Math.min(totalGlasses, Math.floor(consumedGlassesExact));
  
  let hasHalfGlass = false;
  if (fullGlasses < totalGlasses) {
    const remainder = consumedGlassesExact - fullGlasses;
    if (remainder >= 0.5) { // If at least half a glass (125ml)
      hasHalfGlass = true;
    }
  }

  const emptyGlasses = Math.max(0, totalGlasses - fullGlasses - (hasHalfGlass ? 1 : 0));
  const glassesLeft = Math.max(0, totalGlasses - Math.round(consumedGlassesExact));

  const handleSaveEdit = () => {
    if (onPlanUpdate) {
      onPlanUpdate(parseFloat(editWater) || totalWaterLiters);
    }
    setIsEditModalVisible(false);
  };

  // Build array of glasses to render
  const glassElements = [];
  for (let i = 0; i < fullGlasses; i++) {
    glassElements.push(
      <Image key={`full-${i}`} source={require('../../../assets/expo.icon/images/images/full_glass.png')} style={styles.glassIcon} resizeMode="contain" />
    );
  }
  if (hasHalfGlass) {
    glassElements.push(
      <Image key="half" source={require('../../../assets/expo.icon/images/images/half_glass.png')} style={styles.glassIcon} resizeMode="contain" />
    );
  }
  for (let i = 0; i < emptyGlasses; i++) {
    glassElements.push(
      <Image key={`empty-${i}`} source={require('../../../assets/expo.icon/images/images/empty_glass.png')} style={styles.glassIcon} resizeMode="contain" />
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Water</Text>
        <TouchableOpacity onPress={() => setIsEditModalVisible(true)} activeOpacity={0.7} style={styles.editBtn}>
          <HugeiconsIcon icon={Edit02Icon} size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.glassesContainer}>
        {glassElements}
      </View>

      <Text style={styles.glassesLeftText}>
        {glassesLeft} {glassesLeft === 1 ? 'glass' : 'glasses'} left
      </Text>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Water Goal</Text>
            
            <View style={styles.inputGroup}>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={editWater} 
                onChangeText={setEditWater} 
                placeholder="Liters (e.g., 3.5)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#121720',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  glassIcon: {
    width: 32,
    height: 32,
  },
  glassesLeftText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#161B26',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalCancelText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSaveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: AppColors.primary,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
