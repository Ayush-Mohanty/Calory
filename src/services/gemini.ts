import { OnboardingData } from './storage';

export interface MealBreakdownItem {
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  suggestion: string;
}

export interface AiNutritionPlan {
  dailyCalories: number;
  proteinsGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterLiters: number;
  waterGlasses: number;
  bmr: number;
  tdee: number;
  calorieDeficitOrSurplus: number;
  goalDescription: string;
  bmi: number;
  bmiCategory: string;
  mealBreakdown: MealBreakdownItem[];
  fitnessAdvice: string[];
  summary: string;
  generatedAt: number;
}

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  'AQ.Ab8RN6IHr6tAW_9RDuGg_Bw6cju8khY897vw0qJV35X4TKUtng';

const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Calculates user age from birthDate
 */
function getAgeFromBirthDate(birthDate: { day: number; month: number; year: number }): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.year;
  const m = today.getMonth() + 1 - birthDate.month;
  if (m < 0 || (m === 0 && today.getDate() < birthDate.day)) {
    age--;
  }
  return age > 0 ? age : 25;
}

/**
 * Fallback nutrition plan generator using Mifflin-St Jeor formula
 * Ensures user always gets accurate results even in low connectivity.
 */
function generateFallbackPlan(data: OnboardingData): AiNutritionPlan {
  const age = getAgeFromBirthDate(data.birthDate);
  const totalInches = data.heightFeet * 12 + data.heightInches;
  const heightCm = totalInches * 2.54;
  const weightKg = data.weightKg;

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (data.gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // male or other
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  bmr = Math.round(bmr);

  // Activity multiplier based on workout days
  let activityMultiplier = 1.375; // 2-3 days default
  if (data.workoutDays === '3-4_days') {
    activityMultiplier = 1.55;
  } else if (data.workoutDays === '5-6_days') {
    activityMultiplier = 1.725;
  }

  const tdee = Math.round(bmr * activityMultiplier);

  // Goal adjustment
  let calorieAdjustment = 0;
  let goalDesc = 'Maintain weight and sustain peak physical performance.';
  if (data.goal === 'lose_weight') {
    calorieAdjustment = -Math.round(tdee * 0.2); // ~20% deficit
    goalDesc = 'Moderate 20% calorie deficit designed for steady, sustainable fat loss while sparing muscle.';
  } else if (data.goal === 'gain_weight') {
    calorieAdjustment = Math.round(tdee * 0.15); // ~15% surplus
    goalDesc = 'Controlled lean caloric surplus to support hypertrophy, muscle recovery, and strength gains.';
  }

  const dailyCalories = Math.max(1200, tdee + calorieAdjustment);

  // Macros: Protein 2.0g/kg (lose) or 1.8g/kg (gain/maintain)
  const proteinMultiplier = data.goal === 'lose_weight' ? 2.0 : 1.8;
  const proteinsGrams = Math.round(weightKg * proteinMultiplier);
  const proteinCals = proteinsGrams * 4;

  // Fat: 25% of calories
  const fatCals = dailyCalories * 0.25;
  const fatsGrams = Math.round(fatCals / 9);

  // Remaining calories to carbs
  const carbCals = Math.max(100, dailyCalories - proteinCals - fatCals);
  const carbsGrams = Math.round(carbCals / 4);

  // Water calculation: ~35-40ml per kg + workout bonus
  const baseWaterMl = weightKg * 38;
  const workoutBonusMl = data.workoutDays === '5-6_days' ? 750 : 500;
  const totalWaterMl = baseWaterMl + workoutBonusMl;
  const waterLiters = Number((totalWaterMl / 1000).toFixed(1));
  const waterGlasses = Math.round(totalWaterMl / 250);

  // BMI
  const heightMeters = heightCm / 100;
  const bmiVal = Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
  let bmiCategory = 'Healthy Weight';
  if (bmiVal < 18.5) bmiCategory = 'Underweight';
  else if (bmiVal >= 25 && bmiVal < 30) bmiCategory = 'Overweight';
  else if (bmiVal >= 30) bmiCategory = 'Obesity Class';

  return {
    dailyCalories,
    proteinsGrams,
    carbsGrams,
    fatsGrams,
    waterLiters,
    waterGlasses,
    bmr,
    tdee,
    calorieDeficitOrSurplus: calorieAdjustment,
    goalDescription: goalDesc,
    bmi: bmiVal,
    bmiCategory,
    mealBreakdown: [
      {
        meal: 'Breakfast',
        calories: Math.round(dailyCalories * 0.25),
        protein: Math.round(proteinsGrams * 0.25),
        carbs: Math.round(carbsGrams * 0.3),
        fat: Math.round(fatsGrams * 0.25),
        suggestion: 'High-protein oatmeal with berries and eggs or Greek yogurt.',
      },
      {
        meal: 'Lunch',
        calories: Math.round(dailyCalories * 0.35),
        protein: Math.round(proteinsGrams * 0.35),
        carbs: Math.round(carbsGrams * 0.35),
        fat: Math.round(fatsGrams * 0.35),
        suggestion: 'Grilled lean protein, quinoa or brown rice, avocado, and leafy greens.',
      },
      {
        meal: 'Snack',
        calories: Math.round(dailyCalories * 0.15),
        protein: Math.round(proteinsGrams * 0.15),
        carbs: Math.round(carbsGrams * 0.15),
        fat: Math.round(fatsGrams * 0.15),
        suggestion: 'Whey protein shake with fruit or handful of raw almonds.',
      },
      {
        meal: 'Dinner',
        calories: Math.round(dailyCalories * 0.25),
        protein: Math.round(proteinsGrams * 0.25),
        carbs: Math.round(carbsGrams * 0.2),
        fat: Math.round(fatsGrams * 0.25),
        suggestion: 'Salmon fillet, sweet potatoes, steamed broccoli with olive oil.',
      },
    ],
    fitnessAdvice: [
      `Maintain a progressive overload resistance training routine ${data.workoutDays.replace('_', ' ')}.`,
      'Target 7-9 hours of restorative sleep each night to optimize hormonal recovery and metabolism.',
      `Drink ${waterLiters}L of water daily, distributing intake evenly before, during, and after workouts.`,
    ],
    summary: `Scientifically calibrated ${data.goal.replace('_', ' ')} protocol customized to your biometric profile and activity level.`,
    generatedAt: Date.now(),
  };
}

/**
 * Generate personalized nutrition and fitness blueprint using Google Gemini AI
 */
export async function generateNutritionPlan(
  data: OnboardingData
): Promise<AiNutritionPlan> {
  const age = getAgeFromBirthDate(data.birthDate);
  const totalInches = data.heightFeet * 12 + data.heightInches;
  const heightCm = Math.round(totalInches * 2.54);

  const goalText =
    data.goal === 'lose_weight'
      ? 'Lose Body Fat & Get Lean'
      : data.goal === 'gain_weight'
      ? 'Build Muscle & Lean Weight'
      : 'Maintain Physique & Optimize Energy';

  const workoutText =
    data.workoutDays === '2-3_days'
      ? '2 to 3 days per week (Light/Moderate)'
      : data.workoutDays === '3-4_days'
      ? '3 to 4 days per week (Moderate/Active)'
      : '5 to 6 days per week (Very Active/Intense)';

  const prompt = `
You are an elite sports scientist, PhD nutritionist, and certified fitness coach.
Generate a comprehensive, scientifically-accurate personalized daily nutrition and fitness blueprint based on the user's exact profile:
- Gender: ${data.gender}
- Primary Goal: ${goalText} (${data.goal})
- Workout Frequency: ${workoutText} (${data.workoutDays})
- Age: ${age} years old (Birthdate: ${data.birthDate.month}/${data.birthDate.day}/${data.birthDate.year})
- Height: ${data.heightFeet} ft ${data.heightInches} in (~${heightCm} cm)
- Weight: ${data.weightKg} kg

Return ONLY valid JSON matching this exact structure:
{
  "dailyCalories": 2150,
  "proteinsGrams": 165,
  "carbsGrams": 210,
  "fatsGrams": 65,
  "waterLiters": 3.5,
  "waterGlasses": 14,
  "bmr": 1780,
  "tdee": 2450,
  "calorieDeficitOrSurplus": -300,
  "goalDescription": "A moderate 300 kcal deficit to lose body fat steadily while preserving lean muscle mass.",
  "bmi": 25.9,
  "bmiCategory": "Slightly Overweight",
  "mealBreakdown": [
    { "meal": "Breakfast", "calories": 500, "protein": 35, "carbs": 55, "fat": 15, "suggestion": "Egg white omelette with spinach, whole oats with berries." },
    { "meal": "Lunch", "calories": 650, "protein": 50, "carbs": 65, "fat": 20, "suggestion": "Grilled chicken breast, brown rice, avocado, steamed broccoli." },
    { "meal": "Pre/Post Workout Snack", "calories": 350, "protein": 30, "carbs": 40, "fat": 10, "suggestion": "Greek yogurt with whey protein and a banana." },
    { "meal": "Dinner", "calories": 650, "protein": 50, "carbs": 50, "fat": 20, "suggestion": "Baked salmon or tofu with roasted sweet potatoes and asparagus." }
  ],
  "fitnessAdvice": [
    "Prioritize resistance training 3-4 days per week focusing on compound lifts.",
    "Incorporate 8,000 to 10,000 daily steps to boost passive energy expenditure.",
    "Drink at least 500ml water upon waking to kickstart hydration and metabolism."
  ],
  "summary": "Your personalized high-protein fat-loss roadmap designed to burn fat sustainably without feeling starved."
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Gemini API] Request failed with status ${response.status}: ${errText}`);
      return generateFallbackPlan(data);
    }

    const resJson = await response.json();
    const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn('[Gemini API] Empty response from model, falling back to formula calculation');
      return generateFallbackPlan(data);
    }

    const parsed = JSON.parse(candidateText) as Partial<AiNutritionPlan>;

    // Validate essential keys
    if (
      typeof parsed.dailyCalories !== 'number' ||
      typeof parsed.proteinsGrams !== 'number' ||
      typeof parsed.carbsGrams !== 'number' ||
      typeof parsed.fatsGrams !== 'number'
    ) {
      console.warn('[Gemini API] Missing numerical fields in response, using formula plan');
      return generateFallbackPlan(data);
    }

    return {
      dailyCalories: Math.round(parsed.dailyCalories),
      proteinsGrams: Math.round(parsed.proteinsGrams),
      carbsGrams: Math.round(parsed.carbsGrams),
      fatsGrams: Math.round(parsed.fatsGrams),
      waterLiters: parsed.waterLiters || Number((data.weightKg * 0.04).toFixed(1)),
      waterGlasses: parsed.waterGlasses || Math.round((parsed.waterLiters || 3.0) * 4),
      bmr: parsed.bmr || 1700,
      tdee: parsed.tdee || 2300,
      calorieDeficitOrSurplus: parsed.calorieDeficitOrSurplus || 0,
      goalDescription:
        parsed.goalDescription ||
        `Customized nutritional targets aligned with your ${data.goal} goal.`,
      bmi: parsed.bmi || 24,
      bmiCategory: parsed.bmiCategory || 'Healthy Weight',
      mealBreakdown:
        Array.isArray(parsed.mealBreakdown) && parsed.mealBreakdown.length > 0
          ? parsed.mealBreakdown
          : generateFallbackPlan(data).mealBreakdown,
      fitnessAdvice:
        Array.isArray(parsed.fitnessAdvice) && parsed.fitnessAdvice.length > 0
          ? parsed.fitnessAdvice
          : generateFallbackPlan(data).fitnessAdvice,
      summary:
        parsed.summary ||
        `Your personalized AI nutrition and fitness protocol created by Calory AI.`,
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error('[Gemini API] Error generating nutrition plan:', error);
    return generateFallbackPlan(data);
  }
}
