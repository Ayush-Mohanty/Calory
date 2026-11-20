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

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

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
    if (!GEMINI_API_KEY) {
      console.warn('[Gemini API] EXPO_PUBLIC_GEMINI_API_KEY not found in environment, using fallback formula plan');
      return generateFallbackPlan(data);
    }

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

// ==========================================
// Food Image Analysis with Gemini Vision AI
// ==========================================

export interface AnalyzedFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  isAiGenerated: boolean;
}

// In-memory cache for fast passing of base64 image data between screens
let cachedFoodImageBase64: string | null = null;

export function setCachedFoodImageBase64(base64: string | null): void {
  cachedFoodImageBase64 = base64;
}

export function getCachedFoodImageBase64(): string | null {
  return cachedFoodImageBase64;
}

/**
 * Fallback nutritional values if network/API fails
 */
export function getFallbackFoodAnalysis(customName?: string): AnalyzedFoodResult {
  return {
    name: customName || 'Unrecognized Food Item',
    calories: 350,
    protein: 15,
    carbs: 45,
    fat: 12,
    servingSize: '1 serving',
    isAiGenerated: false,
  };
}

/**
 * Strips markdown code blocks (```json ... ```) from model output
 */
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Universal helper to convert local image URIs to clean Base64 string
 */
export async function convertImageUriToBase64(uri: string): Promise<string> {
  if (!uri) throw new Error('Missing image URI');

  // If already base64 data URL
  if (uri.startsWith('data:')) {
    const parts = uri.split(',');
    return parts[1] || '';
  }

  // 1. Try expo-file-system/legacy
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FileSystem = require('expo-file-system/legacy');
    if (FileSystem && typeof FileSystem.readAsStringAsync === 'function') {
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
      if (b64) return b64;
    }
  } catch (fsErr) {
    // Continue to next fallback
  }

  // 2. Universal fetch + FileReader fallback (works across React Native & Web)
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result) {
          const b64Part = result.includes(',') ? result.split(',')[1] : result;
          resolve(b64Part);
        } else {
          reject(new Error('Empty FileReader output'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    if (base64) return base64;
  } catch (blobErr) {
    // Continue
  }

  throw new Error('Failed to convert image to base64');
}

/**
 * Sends a food image (base64) to Google Gemini AI to analyze meal name,
 * portion size, calories, protein, carbs, and fat in structured JSON.
 * Uses Google's free Gemini vision models (gemini-3.1-flash-lite, gemini-3.7-flash).
 */
export async function analyzeFoodImageWithGemini(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<AnalyzedFoodResult> {
  const cleanBase64 = base64Image
    .replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
    .trim();

  if (!cleanBase64) {
    throw new Error('Image data is empty or invalid.');
  }

  const prompt = `You are an expert AI food computer vision system and clinical nutritionist.
Analyze the food or meal in this image with high accuracy.
Identify the EXACT dish or food items present on the plate or container.
Calculate realistic nutritional values for the visible portion.

Return ONLY a valid JSON object matching this schema:
{
  "name": "Specific Food Name (e.g., Pepperoni Pizza, Chicken Biryani, Double Cheeseburger, Avocado Toast with Egg, Salmon Nigiri, Greek Salad)",
  "calories": 520,
  "protein": 32,
  "carbs": 44,
  "fat": 22,
  "servingSize": "1 plate (350g)"
}

CRITICAL RULES:
1. "name": The exact culinary name of the detected food. Be specific (e.g. "Spaghetti Carbonara", "Paneer Tikka with Naan", "Caesar Salad with Chicken", "Chocolate Donut"). DO NOT use generic phrases like "Healthy Meal", "Diet Meal", or "Balanced Meal". If there is food in the image, identify the actual dish!
2. If the image clearly contains NO food or drinks, return {"name": "No Food Detected", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "servingSize": "0g"}.
3. "calories": Total energy in kcal as an integer number.
4. "protein": Protein in grams as a number.
5. "carbs": Total carbohydrates in grams as a number.
6. "fat": Total fats in grams as a number.
7. "servingSize": Estimated portion size (e.g. "1 bowl (300g)", "1 burger (250g)", "2 slices (220g)").
8. Return ONLY pure JSON. No markdown code blocks (no \`\`\`json), no introductory text.`;

  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please check your environment configuration.');
  }

  // Free Gemini models in order of stability and speed
  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Gemini Vision] Model ${model} returned ${response.status}: ${errorText}`);
        lastError = new Error(`Model ${model} error (${response.status})`);
        // If 404 or 503 or 429, try next model in the list
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.warn(`[Gemini Vision] Empty response from model ${model}`);
        continue;
      }

      const cleanedJson = cleanJsonString(rawText);
      const parsed = JSON.parse(cleanedJson);

      const calories = Math.max(0, Math.round(Number(parsed.calories) || 0));
      const protein = Math.max(0, Math.round((Number(parsed.protein) || 0) * 10) / 10);
      const carbs = Math.max(0, Math.round((Number(parsed.carbs) || 0) * 10) / 10);
      const fat = Math.max(0, Math.round((Number(parsed.fat) || 0) * 10) / 10);
      const name =
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name.trim()
          : 'Detected Food';
      const servingSize =
        typeof parsed.servingSize === 'string' && parsed.servingSize.trim()
          ? parsed.servingSize.trim()
          : '1 serving';

      const calculatedCalories =
        calories > 0
          ? calories
          : protein > 0 || carbs > 0 || fat > 0
          ? Math.round(protein * 4 + carbs * 4 + fat * 9)
          : 0;

      return {
        name,
        calories: calculatedCalories,
        protein,
        carbs,
        fat,
        servingSize,
        isAiGenerated: true,
      };
    } catch (err: any) {
      console.warn(`[Gemini Vision] Error trying model ${model}:`, err?.message || err);
      lastError = err;
    }
  }

  // If all live models failed, re-throw so the UI can show a retry button or handle cleanly
  throw (
    lastError ||
    new Error('Food recognition service is temporarily unavailable. Please try again.')
  );
}

