// components/Text.tsx
import { Text as RNText, StyleSheet, TextProps } from "react-native";

// Font weight mapping (unchanged from your original)
const weightToFont: Record<string, string> = {
  "100": "Inter_100Thin",
  "200": "Inter_200ExtraLight",
  "300": "Inter_300Light",
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  "800": "Inter_800ExtraBold",
  "900": "Inter_900Black",
};

const classToWeight: Record<string, string> = {
  "font-thin": "100",
  "font-extralight": "200",
  "font-light": "300",
  "font-normal": "400",
  "font-medium": "500",
  "font-semibold": "600",
  "font-bold": "700",
  "font-extrabold": "800",
  "font-black": "900",
};

type Props = TextProps & { className?: string };

export function Text({ style, className = "", ...props }: Props) {
  const classes = className.split(" ");
  const matchedClass = Object.keys(classToWeight).find((k) =>
    classes.includes(k),
  );

  const flat = StyleSheet.flatten(style) ?? {};
  const weightFromStyle = String(flat.fontWeight ?? "400");

  const weight = matchedClass ? classToWeight[matchedClass] : weightFromStyle;
  const fontFamily = weightToFont[weight] ?? "Inter_400Regular";

  // The key change: we pass `className` directly to RNText.
  // NativeWind's Babel plugin transforms it before it gets here.
  return (
    <RNText className={className} style={[{ fontFamily }, style]} {...props} />
  );
}
