import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from './AuthInput';
import { GoogleButton } from './GoogleButton';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  AlertIcon,
  CloseIcon,
  CheckIcon,
  FlameIcon,
} from './AuthIcons';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email OTP verification state (Clerk)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();

  const clearMessages = () => {
    setErrorBanner(null);
    setSuccessBanner(null);
  };

  const handleTabSwitch = (tab: 'signin' | 'signup') => {
    clearMessages();
    setIsVerifying(false);
    setActiveTab(tab);
  };

  // Sign In with Email & Password
  const handleSignIn = async () => {
    clearMessages();
    if (!email.trim() || !password) {
      setErrorBanner('Please enter your email and password.');
      return;
    }

    if (!isSignInLoaded) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        setSuccessBanner('Signed in successfully! Loading your dashboard...');
        await setSignInActive({ session: result.createdSessionId });
        onAuthSuccess?.();
      } else {
        console.log('[SignIn] Result status:', result.status);
        setErrorBanner('Authentication could not be completed. Please try again.');
      }
    } catch (err: any) {
      console.error('[SignIn] Error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to sign in. Please verify your credentials.';
      setErrorBanner(msg);
    } finally {
      setLoading(false);
    }
  };

  // Sign Up with Email & Password
  const handleSignUp = async () => {
    clearMessages();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorBanner('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorBanner('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorBanner('Passwords do not match. Please double-check.');
      return;
    }

    if (!isSignUpLoaded) return;
    setLoading(true);

    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsVerifying(true);
      setSuccessBanner(`Verification code sent to ${email.trim()}.`);
    } catch (err: any) {
      console.error('[SignUp] Error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to create account. Please check your details.';
      setErrorBanner(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify Email Code
  const handleVerifyCode = async () => {
    clearMessages();
    if (!verificationCode.trim()) {
      setErrorBanner('Please enter the 6-digit verification code.');
      return;
    }

    if (!isSignUpLoaded) return;
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        setSuccessBanner('Account verified successfully!');
        await setSignUpActive({ session: result.createdSessionId });
        onAuthSuccess?.();
      } else {
        setErrorBanner('Verification incomplete. Please re-enter the code.');
      }
    } catch (err: any) {
      console.error('[VerifyCode] Error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid verification code. Please try again.';
      setErrorBanner(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (!isSignUpLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setSuccessBanner('A new verification code has been sent to your email.');
    } catch (err: any) {
      setErrorBanner(err?.message || 'Could not resend code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Dribbble Style Ambient Branding Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              {/* Background ambient glow image */}
              <Image
                source={require('@/assets/images/logo-glow.png')}
                style={styles.logoGlow}
                resizeMode="contain"
              />
              {/* Elevated Logo Card with app icon */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.appLogo}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <FlameIcon size={14} color="#10B981" />
                <Text style={styles.badgeText}>AI POWERED TRACKER</Text>
              </View>
            </View>

            <Text style={styles.appTitle}>Calory AI</Text>
            <Text style={styles.appSubtitle}>
              Intelligent calorie tracking & real-time nutrition intelligence
            </Text>
          </View>

          {/* Alert / Notification Banners */}
          {errorBanner && (
            <View style={styles.bannerError}>
              <AlertIcon size={18} color="#EF4444" />
              <Text style={styles.bannerErrorText}>{errorBanner}</Text>
              <TouchableOpacity onPress={() => setErrorBanner(null)}>
                <CloseIcon size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {successBanner && (
            <View style={styles.bannerSuccess}>
              <CheckIcon size={18} color="#10B981" />
              <Text style={styles.bannerSuccessText}>{successBanner}</Text>
              <TouchableOpacity onPress={() => setSuccessBanner(null)}>
                <CloseIcon size={16} color="#10B981" />
              </TouchableOpacity>
            </View>
          )}

          {/* Main Auth Card */}
          <View style={styles.card}>
            {isVerifying ? (
              /* Verification Code Mode (Clerk OTP) */
              <View style={styles.verificationContainer}>
                <Text style={styles.verificationTitle}>Verify Your Email</Text>
                <Text style={styles.verificationSubtitle}>
                  Enter the 6-digit confirmation code sent to{' '}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>

                <AuthInput
                  label="Verification Code"
                  placeholder="e.g. 123456"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TouchableOpacity
                  style={styles.primaryButtonWrapper}
                  onPress={handleVerifyCode}
                  disabled={loading}
                  activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Verify & Complete Setup
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>Didn't receive code?</Text>
                  <TouchableOpacity onPress={handleResendCode}>
                    <Text style={styles.resendLink}> Resend Code</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setIsVerifying(false)}>
                  <Text style={styles.backButtonText}>← Back to Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Regular Sign In / Sign Up Form */
              <>
                {/* Segmented Switcher */}
                <View style={styles.segmentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.segmentTab,
                      activeTab === 'signin' && styles.segmentTabActive,
                    ]}
                    onPress={() => handleTabSwitch('signin')}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.segmentTabText,
                        activeTab === 'signin' && styles.segmentTabTextActive,
                      ]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentTab,
                      activeTab === 'signup' && styles.segmentTabActive,
                    ]}
                    onPress={() => handleTabSwitch('signup')}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.segmentTabText,
                        activeTab === 'signup' && styles.segmentTabTextActive,
                      ]}>
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Google SSO Button */}
                <GoogleButton
                  onSuccess={onAuthSuccess}
                  onError={(err) => setErrorBanner(err)}
                  disabled={loading}
                />

                {/* Sleek Dribbble Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with email</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Form Fields */}
                {activeTab === 'signup' && (
                  <AuthInput
                    label="Full Name"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    icon={<UserIcon size={20} color="#64748B" />}
                  />
                )}

                <AuthInput
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  icon={<MailIcon size={20} color="#64748B" />}
                />

                <AuthInput
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  icon={<LockIcon size={20} color="#64748B" />}
                />

                {activeTab === 'signup' && (
                  <AuthInput
                    label="Confirm Password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                    icon={<LockIcon size={20} color="#64748B" />}
                  />
                )}

                {/* Primary CTA Button */}
                <TouchableOpacity
                  style={styles.primaryButtonWrapper}
                  onPress={activeTab === 'signin' ? handleSignIn : handleSignUp}
                  disabled={loading}
                  activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {activeTab === 'signin'
                          ? 'Sign In to Calory'
                          : 'Create Free Account'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switcher Footer */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>
                    {activeTab === 'signin'
                      ? "Don't have an account yet?"
                      : 'Already have an account?'}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleTabSwitch(activeTab === 'signin' ? 'signup' : 'signin')
                    }>
                    <Text style={styles.footerLink}>
                      {activeTab === 'signin' ? ' Sign Up' : ' Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Privacy & Terms Note */}
          <Text style={styles.termsText}>
            By continuing, you agree to Calory AI's Terms of Service & Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  logoGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    opacity: 0.85,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#161B26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  badgeRow: {
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
    gap: 10,
  },
  bannerErrorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
  },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
    gap: 10,
  },
  bannerSuccessText: {
    flex: 1,
    color: '#6EE7B7',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#12161F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#090C10',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentTabActive: {
    backgroundColor: '#1E2433',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  segmentTabText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  primaryButtonWrapper: {
    marginTop: 8,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  footerLink: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  verificationContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emailHighlight: {
    color: '#10B981',
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  resendLink: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    padding: 8,
  },
  backButtonText: {
    color: '#64748B',
    fontSize: 13,
  },
  termsText: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
