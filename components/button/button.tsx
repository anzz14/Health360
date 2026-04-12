// components/ui/Button.tsx
import React from "react";
import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  // Variants
  variant?: "primary" | "delete" | "edit";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  size?: "sm" | "md" | "lg";

  // Content
  title: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Styles
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Events
  onPress?: () => void;
}

const sizeStyles = {
  sm: {
    button: "h-9 px-3",
    text: "text-sm",
  },
  md: {
    button: "h-11 px-4",
    text: "text-base",
  },
  lg: {
    button: "h-14 px-6",
    text: "text-md",
  },
};

const roundedStyles = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

// 👇 Variant configurations - Add new variant styles here
const variantStyles = {
  primary: {
    button: "bg-primary",
    text: "text-background",
  },
  delete: {
    button: "bg-destructive",
    text: "text-destructive-foreground",
  },
  edit: {
    button: "bg-accent",
    text: "text-accent-foreground",
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  title,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  rounded = "full",
  size = "md",
  textClassName = "",
  style,
  textStyle,
  onPress,
  ...restProps
}) => {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const roundedClass = roundedStyles[rounded];
  const sizeClass = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${variantStyle.button}
        ${roundedClass}     
        ${sizeClass.button}
        flex-row
        items-center
        justify-center
        ${className}
      `}
      style={style}
      activeOpacity={0.7}
      {...restProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#000"}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}

          <Text
            className={`
              ${variantStyle.text}           
              font-semibold
              ${sizeClass.text}
              ${textClassName}
            `}
            style={textStyle}
          >
            {title}
          </Text>

          {rightIcon && <View className="ml-2 text-white">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};
