import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft02Icon,
  FireIcon,
  Dumbbell01Icon,
  FlashIcon,
  DropletIcon,
  Edit02Icon,
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { useUser } from '@/services/auth';
import { addNutritionLogToFirestore } from '@/services/firebase';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams();

  const initialName = (params.name as string) || 'Food Item';
  const brandName = (params.brandName as string) || '';
  const initialServingSize = (params.servingSize as string) || '1 serving';
  const initialCalories = (params.calories as string) || '0';
  const initialProtein = (params.protein as string) || '0';
  const initialCarbs = (params.carbs as string) || '0';
  const initialFat = (params.fat as string) || '0';

  // Base numerical values for quantity multiplier calculation
  const baseCalories = parseFloat(initialCalories) || 0;
  const baseProtein = parseFloat(initialProtein) || 0;
  const baseCarbs = parseFloat(initialCarbs) || 0;
  const baseFat = parseFloat(initialFat) || 0;

  // Editable states
  const [foodName, setFoodName] = useState(initialName);
  const [servingSize, setServingSize] = useState(initialServingSize);
  const [quantity, setQuantity] = useState(1);
  const [calories, setCalories] = useState(initialCalories);
  const [protein, setProtein] = useState(initialProtein);
  const [carbs, setCarbs] = useState(initialCarbs);
  const [fat, setFat] = useState(initialFat);
  const [isLogging, setIsLogging] = useState(false);

  // Update quantity and scale values proportionally
  const handleQuantityChange = (newQty: number) => {
    if (newQty < 0.5) return;
    const roundedQty = Math.round(newQty * 10) / 10;
    setQuantity(roundedQty);

    setCalories(Math.round(baseCalories * roundedQty).toString());
    setProtein((Math.round(baseProtein * roundedQty * 10) / 10).toString());
    setCarbs((Math.round(baseCarbs * roundedQty * 10) / 10).toString());
    setFat((Math.round(baseFat * roundedQty * 10) / 10).toString());
  };

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleLogFood = async () => {
    if (isLogging) return;
    setIsLogging(true);

    try {
      const parsedCalories = Math.max(0, parseInt(calories, 10) || 0);
      const parsedProtein = Math.max(0, parseFloat(protein) || 0);
      const parsedCarbs = Math.max(0, parseFloat(carbs) || 0);
      const parsedFat = Math.max(0, parseFloat(fat) || 0);

      const displayName = brandName ? `${foodName} (${brandName})` : foodName;
      const logName = quantity !== 1 
        ? `${displayName} (${quantity}x ${servingSize})` 
        : `${displayName} (${servingSize})`;

      if (user?.id) {
        await addNutritionLogToFirestore({
          userId: user.id,
          date: formatDateLocal(new Date()),
          name: logName,
          calories: parsedCalories,
          protein: parsedProtein,
          carbs: parsedCarbs,
          fat: parsedFat,
          type: 'food',
          createdAt: Date.now(),
        });
      }

      // Redirect to Home Screen with updated data
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('[FoodDetails] Error logging food:', error);
      router.replace('/(tabs)/home');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header with Back Button and Text 'Log Food' */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Food</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected Food Name in Big Font Size */}
          <View style={styles.titleSection}>
            <Text style={styles.foodNameBig}>{foodName}</Text>
            {brandName ? (
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>{brandName}</Text>
              </View>
            ) : null}
          </View>

          {/* Serving Size Card with Option to Edit */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionLabel}>Serving Size</Text>
              <HugeiconsIcon icon={Edit02Icon} size={16} color="#94A3B8" />
            </View>

            <View style={styles.servingInputRow}>
              <TextInput
                style={styles.servingTextInput}
                value={servingSize}
                onChangeText={setServingSize}
                placeholder="e.g. 1 serving, 100g"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Serving Multiplier Stepper */}
            <View style={styles.multiplierRow}>
              <Text style={styles.multiplierLabel}>Number of Servings:</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleQuantityChange(quantity - 0.5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValueText}>{quantity}x</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, styles.stepperPlusBtn]}
                  onPress={() => handleQuantityChange(quantity + 0.5)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperBtnText, styles.stepperPlusBtnText]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Calories Count Card with Proper Icons & Option to Edit */}
          <View style={styles.caloriesCard}>
            <View style={styles.caloriesCardTop}>
              <View style={styles.caloriesIconCircle}>
                <HugeiconsIcon icon={FireIcon} size={28} color="#EF4444" />
              </View>
              <View style={styles.caloriesTitleCol}>
                <Text style={styles.caloriesHeading}>Total Calories</Text>
                <Text style={styles.caloriesSubheading}>Tap value to edit manually</Text>
              </View>
              <HugeiconsIcon icon={Edit02Icon} size={18} color="#94A3B8" />
            </View>

            <View style={styles.caloriesInputRow}>
              <TextInput
                style={styles.caloriesInput}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.caloriesUnit}>kcal</Text>
            </View>
          </View>

          {/* 3 Macro Options Below Calories Card: Proteins, Fats, Carbs */}
          <Text style={styles.macrosSectionTitle}>Macronutrients</Text>

          {/* 1. Protein Option */}
          <View style={styles.macroCard}>
            <View style={styles.macroLeftRow}>
              <View style={[styles.macroIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <HugeiconsIcon icon={Dumbbell01Icon} size={22} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroHelper}>Muscle building</Text>
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <TextInput
                style={styles.macroInput}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.macroUnit}>g</Text>
            </View>
          </View>

          {/* 2. Carbs Option */}
          <View style={styles.macroCard}>
            <View style={styles.macroLeftRow}>
              <View style={[styles.macroIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <HugeiconsIcon icon={FlashIcon} size={22} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.macroLabel}>Carbohydrates</Text>
                <Text style={styles.macroHelper}>Daily energy</Text>
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <TextInput
                style={styles.macroInput}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.macroUnit}>g</Text>
            </View>
          </View>

          {/* 3. Fats Option */}
          <View style={styles.macroCard}>
            <View style={styles.macroLeftRow}>
              <View style={[styles.macroIconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.12)' }]}>
                <HugeiconsIcon icon={DropletIcon} size={22} color="#0EA5E9" />
              </View>
              <View>
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroHelper}>Hormone & cell health</Text>
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <TextInput
                style={styles.macroInput}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.macroUnit}>g</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Log Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.logButton, isLogging && styles.logButtonDisabled]}
          onPress={handleLogFood}
          disabled={isLogging}
          activeOpacity={0.85}
        >
          <Text style={styles.logButtonText}>
            {isLogging ? 'Logging Food...' : 'Log Food'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  foodNameBig: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 6,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servingInputRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 12,
  },
  servingTextInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 8,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  multiplierLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusBtn: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  stepperPlusBtnText: {
    color: '#FFFFFF',
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 32,
    textAlign: 'center',
  },
  caloriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  caloriesCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  caloriesTitleCol: {
    flex: 1,
  },
  caloriesHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  caloriesSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  caloriesInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  caloriesInput: {
    fontSize: 38,
    fontWeight: '900',
    color: '#EF4444',
    padding: 0,
    minWidth: 100,
  },
  caloriesUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
  },
  macrosSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  macroLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  macroIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  macroHelper: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  macroInput: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
    textAlign: 'right',
    minWidth: 40,
  },
  macroUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  logButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
