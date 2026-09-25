import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { EyeIcon, EyeOffIcon } from './AuthIcons';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon,
  isPassword = false,
  error,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          Boolean(error) && styles.inputWrapperError,
        ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#64748B"
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.rightAction}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            activeOpacity={0.7}>
            {isPasswordVisible ? (
              <EyeOffIcon size={20} color="#94A3B8" />
            ) : (
              <EyeIcon size={20} color="#94A3B8" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#10B981',
    backgroundColor: '#1A2130',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 0,
  },
  rightAction: {
    padding: 6,
    marginLeft: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
