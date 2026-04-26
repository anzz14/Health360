// components/ui/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Typography, ErrorText, Label, BodySmall } from '../typography/typography';

type InputVariant = 'default' | 'outline' | 'filled' | 'underline';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends TextInputProps {
  // Variants
  variant?: InputVariant;
  size?: InputSize;
  
  // Labels & Helpers
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  
  // Prefix/Suffix
  prefix?: React.ReactNode; // For country codes like +91
  prefixTextClassName?: string;
  suffix?: React.ReactNode; // For buttons like "Get OTP"
  suffixText?: string;
  onSuffixPress?: () => void;
  suffixLoading?: boolean;
  
  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  
  // Clear button
  isClearable?: boolean;
  
  // Layout
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const variantStyles = {
  default: {
    container: 'border border-gray-200 bg-white',
    focused: 'border-primary',
    error: 'border-destructive',
  },
  outline: {
    container: 'border-2 border-gray-200 bg-transparent',
    focused: 'border-primary',
    error: 'border-destructive',
  },
  filled: {
    container: 'border-0 bg-gray-100',
    focused: 'bg-gray-50',
    error: 'bg-destructive/10',
  },
  underline: {
    container: 'border-b border-gray-200 bg-transparent rounded-none',
    focused: 'border-b-2 border-primary',
    error: 'border-b-destructive',
  },
};

const sizeStyles = {
  sm: {
    container: 'h-10 px-3 rounded-xl',
    input: 'text-sm',
    prefix: 'text-sm',
  },
  md: {
    container: 'h-12 px-4 rounded-xl',
    input: 'text-sm',
    prefix: 'text-sm',
  },
  lg: {
    container: 'h-14 px-4 rounded-2xl',
    input: 'text-base',
    prefix: 'text-base',
  },
};

export const Input: React.FC<InputProps> = ({
  // Variants
  variant = 'default',
  size = 'lg',
  
  // Labels & Helpers
  label,
  error,
  helper,
  required = false,
  
  // Prefix/Suffix
  prefix,
  prefixTextClassName = '',
  suffix,
  suffixText,
  onSuffixPress,
  suffixLoading = false,
  
  // Icons
  leftIcon,
  rightIcon,
  onRightIconPress,
  
  // Clear button
  isClearable = false,
  
  // State
  value,
  onChangeText,
  onFocus,
  onBlur,
  editable = true,
  
  // Layout
  containerClassName = '',
  inputClassName = '',
  labelClassName = '',
  
  // TextInput props
  placeholder,
  placeholderTextColor = '#94a3b8',
  secureTextEntry,
  keyboardType,
  maxLength,
  multiline = false,
  numberOfLines,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = secureTextEntry;
  const isTextArea = multiline;
  const hasError = !!error;
  const isClearableActive = isClearable && value && value.length > 0;
  
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  
  const getContainerStyle = () => {
    let style = `${variantStyle.container} ${sizeStyle.container} flex-row items-center`;
    
    if (isTextArea) {
      style = style.replace('items-center', 'items-start');
      style += ' py-3';
    }
    
    if (hasError) {
      style += ` ${variantStyle.error}`;
    } else if (isFocused) {
      style += ` ${variantStyle.focused}`;
    }
    
    if (!editable) {
      style += ' opacity-50 bg-gray-50';
    }
    
    return style;
  };
  
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <View className={`w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center mb-2">
          <Label className={`text-sm ${labelClassName}`}>{label}</Label>
          {required && (
            <Typography color="error" className="ml-1 text-sm">
              *
            </Typography>
          )}
        </View>
      )}
      
      {/* Input Container */}
      <View className={getContainerStyle()}>
        {/* Left Icon */}
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        
        {/* Prefix (e.g., +91) */}
        {prefix && (
          <Typography
            className={`mr-2 font-medium text-gray-400 ${sizeStyle.prefix} ${prefixTextClassName}`}
          >
            {prefix}
          </Typography>
        )}
        
        {/* Text Input */}
        <TextInput
          className={`
            flex-1 
            text-slate-900 
            ${sizeStyle.input}
            ${isTextArea ? 'text-left' : ''}
            py-0
            ${inputClassName}
          `}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          editable={editable}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines || 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...restProps}
        />
        
        {/* Clear Button */}
        {isClearableActive && (
          <TouchableOpacity onPress={handleClear} className="ml-2">
            <Typography className="text-gray-400 text-lg">✕</Typography>
          </TouchableOpacity>
        )}
        
        {/* Password Toggle */}
        {isPassword && value && (
          <TouchableOpacity onPress={togglePasswordVisibility} className="ml-2">
            <Typography className="text-gray-400">
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Typography>
          </TouchableOpacity>
        )}
        
        {/* Right Icon */}
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            className="ml-2"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
        
        {/* Suffix Button (e.g., Get OTP) */}
        {suffixText && onSuffixPress && (
          <TouchableOpacity
            onPress={onSuffixPress}
            disabled={suffixLoading}
            className="px-3 py-2 rounded-xl ml-2"
          >
            <Typography
              color="primary"          
              className={suffixLoading ? 'opacity-50' : ''}
            >
              {suffixLoading ? 'Sending...' : suffixText}
            </Typography>
          </TouchableOpacity>
        )}
        
        {suffix && !suffixText && <View className="ml-2">{suffix}</View>}
      </View>
      
      {/* Error Message */}
      {hasError && <ErrorText className="mt-1 ml-1">{error}</ErrorText>}
      
      {/* Helper Text */}
      {helper && !hasError && (
        <BodySmall color="muted" className="mt-1 ml-1">
          {helper}
        </BodySmall>
      )}
    </View>
  );
};