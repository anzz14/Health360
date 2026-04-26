declare module "react-native-global-props" {
  import type { TextInputProps, TextProps } from "react-native";

  export function setCustomText(props: TextProps): void;
  export function setCustomTextInput(props: TextInputProps): void;
}
