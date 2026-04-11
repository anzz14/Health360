import { Text } from "@/components";
import { ScanHeart } from "lucide-react-native";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type LoginForm = {
  mobileNumber: number;
};

export default function LoginScreen() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit: SubmitHandler<LoginForm> = (data) => console.log(data);

  const [phone, setPhone] = useState("");

  const handleGetOtp = () => console.log("Get OTP for:", phone);
  const handleContinue = () => console.log("Continue with OTP");

  return (
    <>
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
            <>
              <View className="items-center pt-12 pb-6">
                <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 border border-gray-200">
                  <ScanHeart size={48} color="#069494" />
                </View>
                <Text className="text-2xl font-bold text-heading -tracking-[0.5px]">
                  Welcome Back
                </Text>

                <Text className="text-sm text-secondary-text mt-2">
                  Log in to your family health portal
                </Text>
              </View>

              <View className="flex-1 items-center justify-center py-4 opacity-80">
                <Svg viewBox="0 0 200 120" width={220} height={132}>
                  <Path
                    d="M20 70 L100 20 L180 70"
                    fill="none"
                    stroke="#069494"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={4}
                  />
                  <Circle cx={70} cy={85} r={10} fill="#cbd5e1" />
                  <Rect
                    x={62}
                    y={95}
                    width={16}
                    height={20}
                    rx={4}
                    fill="#cbd5e1"
                  />
                  <Circle cx={100} cy={80} r={12} fill="#94a3b8" />
                  <Rect
                    x={88}
                    y={92}
                    width={24}
                    height={23}
                    rx={4}
                    fill="#94a3b8"
                  />
                  {/* Right child */}
                  <Circle cx={130} cy={85} r={10} fill="#cbd5e1" />
                  <Rect
                    x={122}
                    y={95}
                    width={16}
                    height={20}
                    rx={4}
                    fill="#cbd5e1"
                  />
                </Svg>
              </View>

              <View className="px-6 pb-14">
                <Text className="text-sm font-medium text-secondary-text mb-1 ml-1">
                  Phone Number
                </Text>

                <View>
                  <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 h-14 bg-white">
                    <Text className="text-sm font-medium text-gray-400 mr-2">
                      +91
                    </Text>

                    <TextInput
                      className="flex-1 text-sm text-slate-900 py-0"
                      placeholder="000 000 0000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      maxLength={10}
                    />

                    <TouchableOpacity
                      onPress={handleGetOtp}
                      className="px-3 py-2 rounded-xl"
                    >
                      <Text className="text-primary font-medium">Get OTP</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleContinue}
                  className="bg-primary rounded-2xl h-14 items-center justify-center mt-4 shadow-md"
                >
                  <Text className="text-white text-base font-bold">
                    Continue with OTP
                  </Text>
                </TouchableOpacity>

                {/* Links */}
                <View className="items-center mt-6">
                  <Text className="text-sm text-text">
                    Don't have an account?
                    <Text className="text-primary"> Sign Up</Text>
                  </Text>

                  <View className="flex-row items-center gap-4 space-x-2 mt-3">
                    <Text className="text-xs text-secondary-text opacity-70">
                      Privacy Policy
                    </Text>
                    <Text className="text-xs text-secondary-text opacity-70">
                      •
                    </Text>
                    <Text className="text-xs text-secondary-text opacity-70">
                      Terms of Service
                    </Text>
                  </View>
                </View>
              </View>
            </>
          </ScrollView>

          {/* Home Indicator */}
          {/* <View className="items-center pb-2">
            <View className="w-32 h-1.5 bg-gray-200 rounded-full" />
          </View> */}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
