import { Text } from "@/components";
import { AppImage } from "@/components/appImage";
import { Button } from "@/components/button/button";
import { Typography } from "@/components/typography/typography";
import { Link } from "expo-router";
import { ScanHeart } from "lucide-react-native";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@/components/inputs/input";

import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
              <View className="items-center pt-12 pb-6 ">
                <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 border border-gray-200">
                  <ScanHeart size={48} color="#069494" />
                </View>

                <Typography
                  className="-tracking-[1px]"
                  variant="h3"
                  color="heading"
                >
                  Welcome Back
                </Typography>

                <Typography className="mt-2" variant="body" color="secondary">
                  Log in to your family health portal
                </Typography>
              </View>

              <View className="flex-1 items-center justify-center py-4 opacity-80">
                <AppImage
                  source={{
                    uri: "https://res.cloudinary.com/dt5qoqw6u/image/upload/v1776014783/a5c4cd72-2dc1-4105-90eb-4e2759a83471_pccwuo.png",
                  }}
                  className="w-80 h-80"
                  resizeMode="contain"
                />
              </View>

              <View className="px-6 pb-14">
                <Typography
                  className="mb-1 ml-1"
                  variant="body-small"
                  color="default"
                >
                  Phone Number
                </Typography>

                <Input
                  prefix="+91"
                  placeholder="000 000 0000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  suffixText="Get OTP"
                  onSuffixPress={handleGetOtp}
                  required
                />

                <Button
                  title="Continue with OTP"
                  onPress={handleContinue}
                  variant="primary"
                  rounded="2xl"               
                  className="mt-4"
                  size="lg"
                />

                <View className="items-center mt-6">
                  <Typography className="" variant="body-small" color="default">
                    Don't have an account?
                    <Link href={"/createAccount"}>
                      <Typography variant="body-small" color="primary">
                        {" "}
                        Sign Up
                      </Typography>
                    </Link>
                  </Typography>

                  <View className="flex-row items-center gap-4 space-x-2 mt-3">
                    <Typography
                      variant="body-small"
                      color="muted"
                      className="opacity-50 text-xs"
                    >
                      Privacy Policy
                    </Typography>

                    <Typography
                      variant="body-small"
                      color="muted"
                      className="opacity-50 text-xs"
                    >
                      •
                    </Typography>

                    <Typography
                      variant="body-small"
                      color="muted"
                      className="opacity-50 text-xs"
                    >
                      Terms of Service
                    </Typography>
                  </View>
                </View>
              </View>
            </>
          </ScrollView>
          <Link href={"/otp"}>temp btn</Link>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
