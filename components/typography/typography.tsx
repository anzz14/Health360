// components/ui/Typography.tsx
import React from "react";
import { TextProps as RNTextProps } from "react-native";
import { Text } from "../Text";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "title"
  | "subtitle"
  | "body"
  | "body-small"
  | "caption"
  | "button"
  | "label"
  | "error"
  | "success";

type TypographyColor =
  | "default"
  | "primary"
  | "secondary"
  | "heading"
  | "muted"
  | "error"
  | "success"
  | "warning"
  | "white";

interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  className?: string;
  children: React.ReactNode;
}

// 👇 Add new variants here
const variantStyles: Record<TypographyVariant, string> = {
  h1: "text-4xl font-bold",
  h2: "text-3xl font-bold",
  h3: "text-2xl font-bold",
  h4: "text-xl font-bold",
  title: "text-lg font-bold",
  subtitle: "text-md font-semibold",
  body: "text-base font-normal",
  "body-small": "text-sm font-normal",
  caption: "text-sm font-normal",
  button: "text-base font-semibold",
  label: "text-sm font-medium",
  error: "text-sm font-medium",
  success: "text-sm font-medium",
};

// 👇 Add new colors here
const colorStyles: Record<TypographyColor, string> = {
  default: "text-text",
  primary: "text-primary",
  secondary: "text-secondary-text",
  heading: "text-heading",
  muted: "text-muted-foreground",
  error: "text-destructive",
  success: "text-success",
  warning: "text-warning",
  white: "text-white",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  color = "default",
  className = "",
  children,
  style,
  ...restProps
}) => {
  const variantClasses = variantStyles[variant];
  const colorClasses = colorStyles[color];

  const finalClassName =
    `${variantClasses} ${colorClasses} ${className}`.trim();

  // 👈 Use your Text component here - font family will be auto-applied
  return (
    <Text className={finalClassName} style={style} {...restProps}>
      {children}
    </Text>
  );
};

// Optional: Create specialized components for better DX
export const H1: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h1" {...props} />
);

export const H2: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h2" {...props} />
);

export const H3: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h3" {...props} />
);

export const H4: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Title: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="title" {...props} />
);

export const Subtitle: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="subtitle" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="body" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, "variant">> = (
  props,
) => <Typography variant="body-small" {...props} />;

export const Caption: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="label" {...props} />
);

export const ErrorText: React.FC<Omit<TypographyProps, "variant">> = (
  props,
) => <Typography variant="error" color="error" {...props} />;

export const SuccessText: React.FC<Omit<TypographyProps, "variant">> = (
  props,
) => <Typography variant="success" color="success" {...props} />;
