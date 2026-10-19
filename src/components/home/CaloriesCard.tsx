import { SegmentedHalfCircleProgress30 } from '@/components/HalfProgress';
import { AppColors } from '@/constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Edit02Icon, Dumbbell01Icon, EnergyIcon, FireIcon } from '@/constants/hugeicons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

interface CaloriesCardProps {
  totalCalories: number;
  consumedCalories: number;
  protein?: number;
  consumedProtein?: number;
  carbs?: number;
  consumedCarbs?: number;
  fat?: number;
  consumedFat?: number;
  onPlanUpdate?: (updatedValues: { dailyCalories: number, proteinsGrams: number, carbsGrams: number, fatsGrams: number }) => void;
}

export const CaloriesCard: React.FC<CaloriesCardProps> = ({
  totalCalories,
  consumedCalories,
  protein = 0,
  consumedProtein = 0,
  carbs = 0,
  consumedCarbs = 0,
  fat = 0,
  consumedFat = 0,
  onPlanUpdate
}) => {
  const remaining = Math.max(0, totalCalories - consumedCalories);
  const progress = totalCalories > 0 ? Math.min(1, consumedCalories / totalCalories) : 0;
  
  const remainingProtein = Math.max(0, protein - consumedProtein);
  const remainingFat = Math.max(0, fat - consumedFat);
  const remainingCarbs = Math.max(0, carbs - consumedCarbs);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCalories, setEditCalories] = useState(totalCalories.toString());
  const [editProtein, setEditProtein] = useState(protein.toString());
  const [editCarbs, setEditCarbs] = useState(carbs.toString());
  const [editFat, setEditFat] = useState(fat.toString());

  const handleSaveEdit = () => {
    if (onPlanUpdate) {
      onPlanUpdate({
        dailyCalories: parseInt(editCalories) || totalCalories,
        proteinsGrams: parseInt(editProtein) || protein,
        carbsGrams: parseInt(editCarbs) || carbs,
        fatsGrams: parseInt(editFat) || fat,
      });
    }
    setIsEditModalVisible(false);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Calories</Text>
        <TouchableOpacity onPress={() => setIsEditModalVisible(true)} activeOpacity={0.7} style={styles.editBtn}>
          <HugeiconsIcon icon={Edit02Icon} size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <SegmentedHalfCircleProgress30
          progress={progress}
          size={300}
          strokeWidth={50}
          segments={16}
          gapAngle={20}
          value={remaining}
          label="Remaining"
        />
      </View>

      <View style={styles.macrosContainer}>
        {/* Protein */}
        <View style={styles.macroItem}>
          <View style={[styles.macroIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <HugeiconsIcon icon={Dumbbell01Icon} size={24} color="#60A5FA" />
          </View>
          <Text style={styles.macroValue}>{remainingProtein}g</Text>
          <Text style={styles.macroLabel}>Protein Left</Text>
        </View>

        {/* Fat */}
        <View style={styles.macroItem}>
          <View style={[styles.macroIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
            <HugeiconsIcon icon={FireIcon} size={24} color="#F472B6" />
          </View>
          <Text style={styles.macroValue}>{remainingFat}g</Text>
          <Text style={styles.macroLabel}>Fat Left</Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroItem}>
          <View style={[styles.macroIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
            <HugeiconsIcon icon={EnergyIcon} size={24} color="#FBBF24" />
          </View>
          <Text style={styles.macroValue}>{remainingCarbs}g</Text>
          <Text style={styles.macroLabel}>Carbs Left</Text>
        </View>
      </View>

      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goals</Text>
            
            <View style={styles.inputGroup}>
              <View style={[styles.inputIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <HugeiconsIcon icon={FireIcon} size={20} color="#EF4444" />
              </View>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={editCalories} 
                onChangeText={setEditCalories} 
                placeholder="Calories"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <HugeiconsIcon icon={Dumbbell01Icon} size={20} color="#60A5FA" />
              </View>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={editProtein} 
                onChangeText={setEditProtein} 
                placeholder="Protein (g)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <HugeiconsIcon icon={EnergyIcon} size={20} color="#FBBF24" />
              </View>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={editCarbs} 
                onChangeText={setEditCarbs} 
                placeholder="Carbs (g)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                <HugeiconsIcon icon={FireIcon} size={20} color="#F472B6" />
              </View>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={editFat} 
                onChangeText={setEditFat} 
                placeholder="Fat (g)"
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  editBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  macroItem: {
    alignItems: 'center',
    width: '31%',
    backgroundColor: 'rgba(41, 143, 80, 0.12)', // Light primary background
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.2)',
  },
  macroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    paddingVertical: 16,
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
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#0F172A',
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
