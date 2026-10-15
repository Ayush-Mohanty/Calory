import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Modal, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, Activity01Icon, UserIcon, PlusIcon, Dumbbell01Icon, DropletIcon, FireIcon, SparklesIcon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isFabModalVisible, setIsFabModalVisible] = useState(false);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.tabBarContent}>
        {/* Left Side: 3 Navigation Tabs */}
        <View style={styles.navTabs}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const getIcon = () => {
              switch (route.name) {
                case 'home':
                  return Home01Icon;
                case 'analytics':
                  return Activity01Icon;
                case 'profile':
                  return UserIcon;
                default:
                  return Home01Icon;
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                style={styles.tabItem}
              >
                <HugeiconsIcon
                  icon={getIcon()}
                  size={24}
                  color={isFocused ? AppColors.primary : '#94A3B8'}
                />
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Side: Floating Action Button (+) */}
        <TouchableOpacity 
          style={styles.fabButton} 
          activeOpacity={0.8}
          onPress={() => setIsFabModalVisible(true)}
        >
          <HugeiconsIcon icon={PlusIcon} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* FAB Modal */}
      <Modal visible={isFabModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsFabModalVisible(false)}>
          <View style={[styles.fabMenu, { bottom: insets.bottom + 80 }]}>
            <View style={styles.fabGrid}>
              
              <TouchableOpacity style={styles.gridItem} onPress={() => { setIsFabModalVisible(false); router.push('/log-exercise'); }}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={Dumbbell01Icon} size={24} color={AppColors.primary} />
                </View>
                <Text style={styles.gridText}>Log Exercise</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={() => { setIsFabModalVisible(false); router.push('/add-log'); }}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                  <HugeiconsIcon icon={DropletIcon} size={24} color="#0EA5E9" />
                </View>
                <Text style={styles.gridText}>Drink Water</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={() => { setIsFabModalVisible(false); }}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <HugeiconsIcon icon={Activity01Icon} size={24} color="#F59E0B" />
                </View>
                <Text style={styles.gridText}>Food Database</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={() => { setIsFabModalVisible(false); }}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                  <HugeiconsIcon icon={FireIcon} size={24} color="#EC4899" />
                  <View style={styles.premiumBadge}>
                    <HugeiconsIcon icon={SparklesIcon} size={12} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.gridText}>Scan Food</Text>
              </TouchableOpacity>

            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    elevation: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navTabs: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 30,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.primary,
    position: 'absolute',
    bottom: -2,
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dim the background slightly
  },
  fabMenu: {
    position: 'absolute',
    right: 20,
    width: width - 40,
    backgroundColor: 'transparent',
    padding: 10,
    borderWidth: 0,
  },
  fabGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#FFFFFF', // Premium crisp white
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9', // Very subtle border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridText: {
    color: '#0F172A', // Deep slate for high contrast on white
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#161B26',
  }
});
