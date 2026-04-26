import { Text } from "@/components";
import { AppImage } from "@/components/appImage";
import { Button } from "@/components/button/button";
import { Typography } from "@/components/typography/typography";
import { Link } from "expo-router";
import { Eye, EyeOff, Lock, Mail, ScanHeart } from "lucide-react-native";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/inputs/input";

import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const { handleSubmit } = useForm<LoginForm>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const GRAY = "#6B7280";

  const handleLogin = () => console.log("Login with:", { email, password });

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="items-center pt-12 pb-6">
            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 border border-gray-200">
              <ScanHeart size={48} color="#069494" />
            </View>

            <Typography className="-tracking-[1px]" variant="h3" color="heading">
              Welcome Back
            </Typography>

            <Typography className="mt-2" variant="body" color="secondary">
              Log in to your family health portal
            </Typography>
          </View>

          {/* Illustration */}
          <View className=" items-center justify-center py-4 opacity-80">
            <AppImage
              source={{
                uri: "https://res.cloudinary.com/dt5qoqw6u/image/upload/v1776014783/a5c4cd72-2dc1-4105-90eb-4e2759a83471_pccwuo.png",
              }}
              className="w-40 h-4git0"
              resizeMode="contain"
            />
          </View>

          <View className="px-6 pb-14 gap-4">
            {/* Email Field */}
            <View>
              <Typography className="mb-1 ml-1" variant="body-small" color="default">
                Email
              </Typography>
              <Input
                prefix={<Mail size={18} color={GRAY} />}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                required
              />
            </View>

            {/* Password Field */}
            <View>
              <Typography className="mb-1 ml-1" variant="body-small" color="default">
                Password
              </Typography>
              <Input
                prefix={<Lock size={18} color={GRAY} />}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                maxLength={64}
                required
                suffixIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
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

            {/* Forgot Password */}
            <TouchableOpacity activeOpacity={0.7} className="self-end -mt-2">
              <Typography variant="body-small" color="primary">
                Forgot Password?
              </Typography>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Log In"
              onPress={handleLogin}
              variant="primary"
              rounded="2xl"
              size="lg"
            />

            {/* Footer */}
            <View className="items-center mt-2">
              <Typography variant="body-small" color="default">
                Don't have an account?
                <Link href={"/createAccount"}>
                  <Typography variant="body-small" color="primary">
                    {" "}Sign Up
                  </Typography>
                </Link>
              </Typography>

              <View className="flex-row items-center gap-4 mt-3">
                <Typography variant="body-small" color="muted" className="opacity-50 text-xs">
                  Privacy Policy
                </Typography>
                <Typography variant="body-small" color="muted" className="opacity-50 text-xs">
                  •
                </Typography>
                <Typography variant="body-small" color="muted" className="opacity-50 text-xs">
                  Terms of Service
                </Typography>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}