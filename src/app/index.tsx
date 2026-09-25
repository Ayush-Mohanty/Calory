import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/expo';

import { AuthScreen } from '@/components/auth/AuthScreen';
import {
  getUserFromLocalStorage,
  clearUserFromLocalStorage,
  StoredUser,
} from '@/services/storage';
import { CheckIcon, UserIcon } from '@/components/auth/AuthIcons';
import { MaxContentWidth } from '@/constants/theme';

export default function HomeScreen() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [localUser, setLocalUser] = useState<StoredUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    getUserFromLocalStorage().then((stored) => {
      setLocalUser(stored);
    });
  }, [user]);

  // Loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // If user is NOT signed in -> show the Dribbble-style SignIn / SignUp screen
  if (!isSignedIn) {
    return <AuthScreen />;
  }

  // If user IS signed in -> show the authenticated verification screen
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await clearUserFromLocalStorage();
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName =
    user?.fullName ||
    localUser?.fullName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'User';

  const userEmail =
    user?.primaryEmailAddress?.emailAddress || localUser?.email || '';
  const avatarUrl = user?.imageUrl || localUser?.photoUrl;
  const userId = user?.id || localUser?.id || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Minimal Top Brand Bar */}
        <View style={styles.topBar}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Calory AI</Text>
        </View>

        {/* Authenticated Success Card */}
        <View style={styles.card}>
          <View style={styles.successBadge}>
            <CheckIcon size={16} color="#10B981" />
            <Text style={styles.successBadgeText}>Successfully Authenticated</Text>
          </View>

          {/* User Profile Info */}
          <View style={styles.profileSection}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={32} color="#10B981" />
              </View>
            )}

            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>

          {/* Verification Statuses */}
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <View style={styles.statusIconWrap}>
                <CheckIcon size={16} color="#10B981" />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Saved in LocalStorage</Text>
                <Text style={styles.statusDesc}>
                  Session is stored locally. You will not need to sign in again on next app launch.
                </Text>
              </View>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusIconWrap}>
                <CheckIcon size={16} color="#10B981" />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Saved in Firebase Firestore</Text>
                <Text style={styles.statusDesc}>
                  Basic user profile synced to `users/{userId || '...'}`
                </Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={isSigningOut}
            activeOpacity={0.8}>
            {isSigningOut ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <Text style={styles.signOutText}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#090C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#12161F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
  },
  successBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1A2130',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  statusList: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  statusItem: {
    flexDirection: 'row',
    backgroundColor: '#161B26',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  signOutButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
