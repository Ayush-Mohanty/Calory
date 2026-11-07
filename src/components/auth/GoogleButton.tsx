import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useSSO } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleIcon } from './AuthIcons';

WebBrowser.maybeCompleteAuthSession();

interface GoogleButtonProps {
  onSuccess?: () => void;
  onError?: (errorMsg: string) => void;
  disabled?: boolean;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      console.log('[Google SSO] Starting OAuth flow...');
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'calory',
        path: 'oauth-native-callback',
      });

      const ssoPromise = startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Google authentication timed out. Please try again.')), 25000)
      );

      const { createdSessionId, setActive } = await Promise.race([ssoPromise, timeoutPromise]);
      console.log('[Google SSO] Result session:', createdSessionId);

      if (createdSessionId && setActive) {
        const setActivePromise = setActive({ session: createdSessionId });
        const setActiveTimeout = new Promise<void>((resolve) =>
          setTimeout(() => {
            console.warn('[Google SSO] setActive took >4s, continuing');
            resolve();
          }, 4000)
        );
        await Promise.race([setActivePromise, setActiveTimeout]);
        router.replace('/');
        onSuccess?.();
      } else {
        router.replace('/');
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('[Google SSO] Error:', err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Google authentication was cancelled or failed.';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      onPress={handleGoogleSignIn}
      activeOpacity={0.8}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.content}>
          <GoogleIcon size={20} />
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1E2433',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
