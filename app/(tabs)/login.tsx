import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const FamilyIllustration = () => (
  <Svg viewBox="0 0 200 120" width={220} height={132}>
    {/* Roof */}
    <Path
      d="M20 70 L100 20 L180 70"
      fill="none"
      stroke="#2ECC8B"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={4}
    />
    {/* Left child */}
    <Circle cx={70} cy={85} r={10} fill="#cbd5e1" />
    <Rect x={62} y={95} width={16} height={20} rx={4} fill="#cbd5e1" />
    {/* Center parent */}
    <Circle cx={100} cy={80} r={12} fill="#94a3b8" />
    <Rect x={88} y={92} width={24} height={23} rx={4} fill="#94a3b8" />
    {/* Right child */}
    <Circle cx={130} cy={85} r={10} fill="#cbd5e1" />
    <Rect x={122} y={95} width={16} height={20} rx={4} fill="#cbd5e1" />
  </Svg>
);

const HeartLogo = () => (
  <Svg viewBox="0 0 24 24" width={48} height={48} fill="none">
    <Path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.41 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.59 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
      fill="#2ECC8B"
    />
    <Path
      d="M12 7V13M9 10H15"
      stroke="white"
      strokeLinecap="round"
      strokeWidth={2}
    />
  </Svg>
);

export default function LoginScreen() {
  const [phone, setPhone] = useState("");

  const handleGetOtp = () => {
    // Handle OTP request
    console.log("Get OTP for:", phone);
  };

  const handleContinue = () => {
    // Handle login
    console.log("Continue with OTP");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <HeartLogo />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to your family health portal
            </Text>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <FamilyIllustration />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.countryCode}>+1</Text>
              <TextInput
                style={styles.input}
                placeholder="000 000 0000"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
              <TouchableOpacity onPress={handleGetOtp} style={styles.otpButton}>
                <Text style={styles.otpButtonText}>Get OTP</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>Continue with OTP</Text>
            </TouchableOpacity>

            {/* Links */}
            <View style={styles.linksContainer}>
              <Text style={styles.signUpText}>
                Don't have an account?{" "}
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
              <View style={styles.footerLinks}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Home Indicator */}
        <View style={styles.homeIndicatorContainer}>
          <View style={styles.homeIndicator} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  // Header
  header: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 8,
  },

  // Illustration
  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    opacity: 0.8,
  },

  // Form
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
  },
  countryCode: {
    fontSize: 15,
    fontWeight: "500",
    color: "#94a3b8",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
  },
  otpButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  otpButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2ECC8B",
  },

  // CTA
  continueButton: {
    backgroundColor: "#2ECC8B",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#2ECC8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Links
  linksContainer: {
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  signUpText: {
    fontSize: 14,
    color: "#64748b",
  },
  signUpLink: {
    fontWeight: "600",
    color: "#2ECC8B",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: "#94a3b8",
  },
  dot: {
    fontSize: 12,
    color: "#94a3b8",
  },

  // Home Indicator
  homeIndicatorContainer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  homeIndicator: {
    width: 128,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
  },
});
