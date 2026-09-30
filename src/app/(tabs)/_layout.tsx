import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, Activity01Icon, UserIcon, PlusIcon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
                testID={options.tabBarTestID}
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
          onPress={() => router.push('/add-log')}
        >
          <HugeiconsIcon icon={PlusIcon} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#161B26',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
});
