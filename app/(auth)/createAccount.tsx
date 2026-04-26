import { Text } from "@/components";
import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
import { Link, router } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, User } from "lucide-react-native";
import React, { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateAccountScreen({
  onLogin,
}: {
  onBack?: () => void;
  onLogin?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const [agreed, setAgreed] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const PRIMARY = "#008080";
  const HEADING = "#1A2B4B";
  const GRAY = "#6B7280";
  const BORDER = "#E5E7EB";

  const sendOTP = () => {
    console.log("Send OTP");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-4 pt-4 h-16 justify-center">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full items-center justify-center"
            >
              <ArrowLeft size={22} color={"#374151"} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-7 pt-4">
            {/* Hero */}
            <View className="items-center mb-9">
              <Typography className="mb-2.5" variant="h2" color="heading">
                Create Your Account
              </Typography>
              <Typography className="mt" variant="body" color="default">
                Join thousands of families managing health together
              </Typography>
            </View>

            <View className="gap-5">
              {/* Full Name Field */}
              <View>
                <Typography
                  className="mb-2 ml-0.5"
                  variant="body"
                  color="heading"
                >
                  Email
                </Typography>

                <Input
                  prefix={<User />}
                  placeholder="AnzzSharma@gmail.com"
                  keyboardType="default"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  maxLength={50}
                  required
                />
              </View>

              {/* Phone Number Field */}
             
              {/* Password Field */}
              <View>
                <Typography
                  className="mb-2 ml-0.5"
                  variant="body"
                  color="heading"
                >
                  Password
                </Typography>
                <View
                  className="h-14 rounded-2xl bg-white flex-row items-center overflow-hidden"
                  style={{
                    borderWidth: 1,
                    borderColor: passwordFocused ? PRIMARY : BORDER,
                  }}
                >
                  <Input
                    prefix={<Lock size={18} color={GRAY} />}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    maxLength={64}
                    required
                    suffix={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                        className="pr-4"
                      >
                        {showPassword ? (
                          <EyeOff size={18} color={GRAY} />
                        ) : (
                          <Eye size={18} color={GRAY} />
                        )}
                      </TouchableOpacity>
                    }
                  />
                </View>
              </View>

               <View>
                <Typography
                  className="mb-2 ml-0.5"
                  variant="body"
                  color="heading"
                >
                  Phone Number
                </Typography>
                <View
                  className="h-14 rounded-2xl bg-white flex-row items-center overflow-hidden"
                  style={{
                    borderWidth: 1,
                    borderColor: phoneFocused ? PRIMARY : BORDER,
                  }}
                >
                  <Input
                    prefix="+91"
                    placeholder="000 000 0000"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phone: text })
                    }
                    maxLength={10}
                    required
                  />
                </View>
              </View>

              {/* Checkbox */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAgreed(!agreed)}
                className="flex-row items-start gap-3 pt-1"
              >
                <View
                  className="w-6 h-6 rounded-2xl items-center justify-center mt-0.5"
                  style={{
                    borderWidth: 1.5,
                    borderColor: agreed ? PRIMARY : BORDER,
                    backgroundColor: agreed ? PRIMARY : "#fff",
                  }}
                >
                  {agreed && (
                    <Text
                      className="text-white font-bold"
                      style={{ fontSize: 12 }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <View className="flex-row flex-wrap items-center">
                  <Typography className="opacity-70" variant="body" color="default">
                    I agree to the{" "}
                  </Typography>
                  <Typography variant="body" color="primary">
                    Terms of Service{" "}
                  </Typography>
                  <Typography className="opacity-70" variant="body" color="default">
                    and{" "}
                  </Typography>
                  <Typography variant="body" color="primary">
                    Privacy Policy
                  </Typography>
                </View>
              </TouchableOpacity>
            </View>

            <Button
              title="Send OTP"
              onPress={sendOTP}
              variant="primary"
              rounded="full"
              className="mt-4"
              size="lg"
            />

            {/* Divider */}
            <View className="flex-row items-center gap-3 my-7">
              <View className="flex-1 h-px" style={{ backgroundColor: BORDER }} />
              <Text
                className="font-bold tracking-wider"
                style={{ fontSize: 13, color: GRAY, letterSpacing: 1.5 }}
              >
                — OR —
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: BORDER }} />
            </View>

            {/* Google Button */}
            <Button
              title="Continue with Google"
              leftIcon={<User />}
              onPress={sendOTP}
              rounded="full"
              className="mt-4 bg-white border border-muted"
              textClassName="text-heading"
              size="lg"
            />

            {/* Footer */}
            <View className="flex-1 justify-end pb-8 pt-8">
              <View className="flex-row justify-center items-center gap-1">
                <Text className="text-sm" style={{ color: GRAY, fontFamily: "Inter_400Regular" }}>
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
                  <Link href="/login">
                    <Text className="font-bold text-sm" style={{ color: PRIMARY }}>
                      Log In
                    </Text>
                  </Link>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}