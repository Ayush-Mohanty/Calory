import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { UserIcon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';

// We need a Notification Bell icon. We'll use a placeholder or define it in hugeicons.ts
// For now, let's create a temporary BellIcon inline or use a View if not available.
// I will import it from hugeicons.ts. I'll add Notification03Icon to hugeicons.ts in the next step.
import { Notification03Icon } from '@/constants/hugeicons';

interface HomeHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ avatarUrl, displayName }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.userInfoRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <HugeiconsIcon icon={UserIcon} size={24} color={AppColors.primary} />
          </View>
        )}
        <View style={styles.textWrap}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
        <HugeiconsIcon icon={Notification03Icon} size={24} color="#FFFFFF" />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: AppColors.primary,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.primary,
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161B26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#161B26',
  },
});
