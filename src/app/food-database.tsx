import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/services/auth';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft02Icon,
  Search01Icon,
  Cancel01Icon,
  PlusIcon,
  FireIcon,
  Tick02Icon,
  SparklesIcon,
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import {
  searchFatSecretFoods,
  ParsedFoodItem,
  isFatSecretConfigured,
} from '@/services/fatsecret';
import { addNutritionLogToFirestore } from '@/services/firebase';

export default function FoodDatabaseScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ParsedFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loggedItems, setLoggedItems] = useState<{ [id: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const executeSearch = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setIsLoading(false);
      setErrorMsg(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const foods = await searchFatSecretFoods(trimmed);
      setResults(foods);
      if (foods.length === 0) {
        setErrorMsg(`No foods found matching "${trimmed}"`);
      }
    } catch (err: any) {
      console.error('[FoodDatabase] Search error:', err);
      setErrorMsg(err?.message || 'Unable to fetch results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length >= 3) {
      setIsLoading(true);
      debounceTimer.current = setTimeout(() => {
        executeSearch(text);
      }, 350);
    } else {
      setResults([]);
      setIsLoading(false);
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setErrorMsg(null);
    setIsLoading(false);
  };

  const handleLogFood = async (food: ParsedFoodItem) => {
    if (!user?.id) {
      showToast('Please sign in to log foods');
      return;
    }

    // Mark as logged immediately for responsive UI
    setLoggedItems((prev) => ({ ...prev, [food.id]: true }));

    try {
      await addNutritionLogToFirestore({
        userId: user.id,
        date: formatDateLocal(new Date()),
        name: food.brandName ? `${food.name} (${food.brandName})` : food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        type: 'food',
        createdAt: Date.now(),
      });

      showToast(`Added ${food.name} (${food.calories} kcal)`);
    } catch (err) {
      console.error('[FoodDatabase] Error logging food:', err);
      showToast('Failed to save log. Please try again.');
      setLoggedItems((prev) => ({ ...prev, [food.id]: false }));
    }
  };

  const handleSelectFood = (food: ParsedFoodItem) => {
    router.push({
      pathname: '/food-details' as any,
      params: {
        id: food.id,
        name: food.name,
        brandName: food.brandName || '',
        servingSize: food.servingSize,
        calories: food.calories.toString(),
        protein: food.protein.toString(),
        carbs: food.carbs.toString(),
        fat: food.fat.toString(),
      },
    });
  };

  const renderFoodCard = ({ item }: { item: ParsedFoodItem }) => {
    const isLogged = !!loggedItems[item.id];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectFood(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Food Name & Brand */}
          <View style={styles.nameRow}>
            <Text style={styles.foodName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.brandName ? (
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText} numberOfLines={1}>
                  {item.brandName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Serving Size */}
          <Text style={styles.servingText}>
            Serving: {item.servingSize}
          </Text>

          {/* Calorie Count & Macro Pills */}
          <View style={styles.metaRow}>
            <View style={styles.calorieBadge}>
              <HugeiconsIcon icon={FireIcon} size={14} color="#EF4444" />
              <Text style={styles.calorieText}>{item.calories} kcal</Text>
            </View>

            {(item.protein > 0 || item.carbs > 0 || item.fat > 0) && (
              <View style={styles.macrosBadge}>
                <Text style={styles.macrosText}>
                  P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Action: + Icon inside card */}
        <TouchableOpacity
          style={[styles.plusButton, isLogged && styles.plusButtonActive]}
          onPress={() => handleSelectFood(item)}
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={isLogged ? Tick02Icon : PlusIcon}
            size={20}
            color={isLogged ? '#FFFFFF' : AppColors.primary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header with Back Button Icon */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={28} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 'Search Food' Heading Text */}
        <Text style={styles.heading}>Search Food</Text>
        <Text style={styles.subheading}>
          Search food database to get verified calories & macros
        </Text>

        {/* API Status Notice if Keys Missing */}
        {!isFatSecretConfigured() && (
          <View style={styles.configNotice}>
            <HugeiconsIcon icon={SparklesIcon} size={16} color="#F59E0B" />
            <Text style={styles.configNoticeText}>
              Add FatSecret Client ID & Secret in .env for live API. Showing instant food database preview.
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <HugeiconsIcon icon={Search01Icon} size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods (e.g., banana, chicken, egg)..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
            returnKeyType="search"
          />
          {isLoading ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={styles.clearBtn}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Results List / Guidance */}
        {query.trim().length > 0 && query.trim().length < 3 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.hintText}>
              Type at least 3 characters to search food database...
            </Text>
          </View>
        ) : errorMsg && !isLoading ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderFoodCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !isLoading && query.trim().length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.hintText}>
                    Search for any food, meal, or ingredient to view nutrition and log it to your day.
                  </Text>
                </View>
              ) : undefined
            }
          />
        )}
      </View>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.toastAction}>
            <Text style={styles.toastActionText}>View Log</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    height: 52,
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  configNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  configNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    paddingRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  brandBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  servingText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calorieText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  macrosBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macrosText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.25)',
  },
  plusButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  toastAction: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toastActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
