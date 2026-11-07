export interface CalorieCalculationParams {
  workoutType: 'Cardio' | 'Weight Lifting' | string;
  intensity: 'Low' | 'Medium' | 'High';
  durationMinutes: number;
  weightKg?: number;
  heightFeet?: number;
  heightInches?: number;
  gender?: 'male' | 'female' | 'other';
  birthDate?: {
    day: number;
    month: number;
    year: number;
  };
}

/**
 * Calculates user age from birthDate
 */
export function calculateAge(birthDate?: { day: number; month: number; year: number }): number {
  if (!birthDate || !birthDate.year) return 25;
  const today = new Date();
  let age = today.getFullYear() - birthDate.year;
  const m = today.getMonth() + 1 - birthDate.month;
  if (m < 0 || (m === 0 && today.getDate() < birthDate.day)) {
    age--;
  }
  return age > 0 ? age : 25;
}

/**
 * Calculates personalized workout calorie burn using the standard
 * Compendium of Physical Activities (MET) and Mifflin-St Jeor BMR formulation
 * as used by Apple Fitness, Fitbit, and Google Fit.
 *
 * Formula:
 * 1. BMR (Mifflin-St Jeor):
 *    - Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 *    - Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 *    - Other: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 78
 *
 * 2. MET (Metabolic Equivalent of Task):
 *    - Cardio: Low = 5.5, Medium = 8.5, High = 12.0
 *    - Weight Lifting: Low = 3.5, Medium = 6.0, High = 8.5
 *
 * 3. Energy Expenditure:
 *    - Gross Burn = (MET * 3.5 * weightKg / 200) * durationMinutes
 *    - Personalized Correction = BMR / (24 * weightKg)
 *    - Total Calories = round(Gross Burn * Personalized Correction)
 */
export function calculateWorkoutCalories(params: CalorieCalculationParams): number {
  const {
    workoutType,
    intensity,
    durationMinutes,
    weightKg = 70,
    heightFeet = 5,
    heightInches = 9,
    gender = 'male',
    birthDate,
  } = params;

  if (durationMinutes <= 0) return 0;

  // 1. Calculate age & height in cm
  const age = calculateAge(birthDate);
  const totalInches = (heightFeet || 5) * 12 + (heightInches || 9);
  const heightCm = totalInches * 2.54;
  const validWeight = weightKg > 0 ? weightKg : 70;

  // 2. Basal Metabolic Rate (BMR) via Mifflin-St Jeor
  let bmr: number;
  if (gender === 'female') {
    bmr = 10 * validWeight + 6.25 * heightCm - 5 * age - 161;
  } else if (gender === 'male') {
    bmr = 10 * validWeight + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * validWeight + 6.25 * heightCm - 5 * age - 78;
  }

  // 3. Assign MET based on Workout Type & Intensity (Compendium of Physical Activities)
  const isCardio =
    workoutType.toLowerCase().includes('cardio') ||
    workoutType.toLowerCase().includes('run') ||
    workoutType.toLowerCase().includes('walk') ||
    workoutType.toLowerCase().includes('cycl');

  let met: number;
  if (isCardio) {
    switch (intensity) {
      case 'Low':
        met = 5.5; // Brisk walk / light jog / leisurely cycle
        break;
      case 'High':
        met = 12.0; // Vigorous run (~11 km/h) / HIIT / sprint intervals
        break;
      case 'Medium':
      default:
        met = 8.5; // Moderate running (~8.5 km/h) / steady-state cycle
        break;
    }
  } else {
    // Weight Lifting / Strength Training
    switch (intensity) {
      case 'Low':
        met = 3.5; // Light resistance machines / slow circuit
        break;
      case 'High':
        met = 8.5; // Vigorous compound lifts / crossfit / explosive power sets
        break;
      case 'Medium':
      default:
        met = 6.0; // Standard free weights / hypertrophy resistance training
        break;
    }
  }

  // 4. Standard ACSM Metabolic Equation
  // Calories / min = (MET * 3.5 * weightKg) / 200
  const grossCalories = ((met * 3.5 * validWeight) / 200) * durationMinutes;

  // 5. Individual BMR scaling factor (accounts for user's personal metabolism vs generic baseline)
  // Standard baseline 1 MET is approximately 1 kcal/kg/hr = 24 * weightKg per day
  const standardDailyBmr = 24 * validWeight;
  const bmrFactor = Math.max(0.7, Math.min(1.3, bmr / standardDailyBmr));

  const totalCalories = Math.round(grossCalories * bmrFactor);

  // Guarantee minimum physiological burn (> 1 cal/min)
  return Math.max(Math.round(durationMinutes * 2), totalCalories);
}
