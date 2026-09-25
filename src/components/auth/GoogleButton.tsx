import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useSSO } from '@clerk/expo';
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
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'calory',
        path: 'oauth-native-callback',
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onSuccess?.();
      } else {
        // Additional verification might be required in some flows
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
