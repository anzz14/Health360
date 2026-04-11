import { Text } from "@/components";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const GoogleIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.14 29.52 1 24 1 14.82 1 7.01 6.48 3.44 14.22l7.08 5.5C12.3 13.72 17.67 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.96-2.2 5.46-4.67 7.14l7.18 5.57C43.26 37.7 46.5 31.55 46.5 24.5z"
    />
    <Path
      fill="#FBBC05"
      d="M10.52 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.9 23.9 0 0 0 .5 24c0 3.86.92 7.5 2.54 10.72l7.48-6.44z"
    />
    <Path
      fill="#34A853"
      d="M24 47c5.52 0 10.15-1.83 13.53-4.96l-7.18-5.57C28.6 37.84 26.42 38.5 24 38.5c-6.33 0-11.7-4.22-13.48-9.92l-7.48 6.44C6.9 42.4 14.82 47 24 47z"
    />
  </Svg>
);

const IndiaFlag = () => <Text style={{ fontSize: 18 }}>🇮🇳</Text>;

export default function CreateAccountScreen({
  onBack,
  onLogin,
}: {
  onBack?: () => void;
  onLogin?: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const PRIMARY = "#008080"; // teal from screenshot
  const HEADING = "#1A2B4B";
  const GRAY = "#6B7280";
  const BORDER = "#E5E7EB";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              height: 64,
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/login")}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={22} color={HEADING} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 16 }}>
            {/* Hero */}
            <View style={{ alignItems: "center", marginBottom: 36 }}>
              <Text
                className="font-black"
                style={{
                  fontSize: 36,
                  color: HEADING,
                  lineHeight: 44,
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                Create Your Account
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: GRAY,
                  lineHeight: 24,
                  textAlign: "center",
                  fontFamily: "Inter_400Regular",
                }}
              >
                Join thousands of families managing health together
              </Text>
            </View>

            {/* Fields */}
            <View style={{ gap: 20 }}>
              {/* Full Name */}
              <View>
                <Text
                  className="font-bold"
                  style={{
                    fontSize: 13,
                    color: HEADING,
                    marginBottom: 8,
                    marginLeft: 2,
                  }}
                >
                  Full Name
                </Text>
                <View style={{ position: "relative" }}>
                  <View
                    style={{
                      position: "absolute",
                      left: 16,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                      zIndex: 10,
                    }}
                  >
                    <User size={18} color={GRAY} strokeWidth={1.8} />
                  </View>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Alex Sharma"
                    placeholderTextColor="rgba(107,114,128,0.5)"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    style={{
                      height: 58,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: nameFocused ? PRIMARY : BORDER,
                      backgroundColor: "#fff",
                      paddingLeft: 48,
                      paddingRight: 16,
                      fontSize: 16,
                      fontFamily: "Inter_400Regular",
                      color: HEADING,
                    }}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View>
                <Text
                  className="font-bold"
                  style={{
                    fontSize: 13,
                    color: HEADING,
                    marginBottom: 8,
                    marginLeft: 2,
                  }}
                >
                  Phone Number
                </Text>
                <View
                  style={{
                    height: 58,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: phoneFocused ? PRIMARY : BORDER,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      height: "100%",
                      borderRightWidth: 1,
                      borderRightColor: BORDER,
                      gap: 4,
                    }}
                  >
                    <IndiaFlag />
                    <Text
                      className="font-semibold"
                      style={{ fontSize: 15, color: HEADING }}
                    >
                      +91
                    </Text>
                    <ChevronDown size={14} color={GRAY} strokeWidth={2} />
                  </TouchableOpacity>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="98765 43210"
                    placeholderTextColor="rgba(107,114,128,0.5)"
                    keyboardType="phone-pad"
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    style={{
                      flex: 1,
                      height: "100%",
                      paddingHorizontal: 16,
                      fontSize: 16,
                      fontFamily: "Inter_400Regular",
                      color: HEADING,
                      letterSpacing: 0.4,
                    }}
                  />
                </View>
              </View>

              {/* Checkbox */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAgreed(!agreed)}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  paddingTop: 4,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: agreed ? PRIMARY : BORDER,
                    backgroundColor: agreed ? PRIMARY : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {agreed && (
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontFamily: "Inter_700Bold",
                      }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: GRAY,
                    lineHeight: 22,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  I agree to the{" "}
                  <Text className="font-semibold" style={{ color: PRIMARY }}>
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text className="font-semibold" style={{ color: PRIMARY }}>
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Send OTP */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                marginTop: 32,
                height: 58,
                borderRadius: 29,
                backgroundColor: PRIMARY,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: PRIMARY,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text
                className="font-bold"
                style={{ fontSize: 17, color: "#fff", letterSpacing: 0.3 }}
              >
                Send OTP
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginVertical: 28,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Inter_700Bold",
                  color: GRAY,
                  letterSpacing: 1.5,
                }}
              >
                — OR —
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                height: 58,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <GoogleIcon />
              <Text
                className="font-bold"
                style={{ fontSize: 16, color: HEADING }}
              >
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                paddingBottom: 32,
                paddingTop: 32,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: GRAY,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
                  <Text
                    className="font-bold"
                    style={{ fontSize: 14, color: PRIMARY }}
                  >
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
