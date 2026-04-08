import React, { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    NativeSyntheticEvent,
    Platform,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    TouchableOpacity,
    View,
} from "react-native";
import { Path, Svg } from "react-native-svg";

const PHONE_NUMBER = "+91 98765 43210";
const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 28;

function HeartIcon() {
  return (
    <Svg width={27} height={25} viewBox="0 0 27 25" fill="none">
      <Path
        d="M13.5 23.5L2.5 12.5C1.5 11.5 1 10.1 1 8.6C1 5.5 3.5 3 6.6 3C8.1 3 9.5 3.6 10.6 4.6L13.5 7.5L16.4 4.6C17.5 3.6 18.9 3 20.4 3C23.5 3 26 5.5 26 8.6C26 10.1 25.5 11.5 24.5 12.5L13.5 23.5Z"
        fill="#006D3F"
      />
    </Svg>
  );
}

export default function OtpScreen() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [timer, setTimer] = useState<number>(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<Array<TextInput | null>>(
    Array(OTP_LENGTH).fill(null),
  );

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimer(RESEND_TIMEOUT);
    setCanResend(false);
    setActiveIndex(0);
    inputRefs.current[0]?.focus();

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleContinue = () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;
    console.log("OTP submitted:", code);
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <>
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 items-center justify-center px-6">
            {/* Icon */}
            <View className="mb-8">
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(45, 201, 126, 0.2)" }}
              >
                <HeartIcon />
              </View>
            </View>

            {/* Heading */}
            <View className="items-center mb-10 w-full">
              <Text
                className="text-center mb-2"
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 28,
                  lineHeight: 35,
                  color: "#081B3A",
                  fontWeight: "700",
                }}
              >
                Enter OTP
              </Text>
              <Text
                className="text-center"
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  lineHeight: 23,
                  color: "#3D4A40",
                }}
              >
                We've sent a 6-digit code to{" "}
                <Text style={{ color: "#006D3F", fontWeight: "600" }}>
                  {PHONE_NUMBER}
                </Text>
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View className="w-full mb-10">
              <View className="flex-row justify-center gap-4 items-center w-full mb-10">
                {otp.map((digit, index) => {
                  const isActive = activeIndex === index;
                  const isFilled = digit !== "";
                  return (
                    <View
                      key={index}
                      className="items-center justify-center"
                      style={{
                        width: 48,
                        height: 56,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 10,
                        borderWidth: isActive ? 2 : 1,
                        borderColor: isActive ? "#2DC97E" : "#BBCABD",
                        ...(isActive && {
                          shadowColor: "#2DC97E",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                          elevation: 4,
                        }),
                      }}
                    >
                      <TextInput
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setActiveIndex(index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                        selectionColor="#2DC97E"
                        style={{
                          width: 46,
                          height: 54,
                          textAlign: "center",
                          fontSize: 20,
                          fontWeight: "700",
                          color: "#081B3A",
                          padding: 0,
                        }}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Resend Section */}
              <View className="items-center" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 21,
                      color: "#3D4A40",
                    }}
                  >
                    Didn't receive code?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={!canResend}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 21,
                        fontWeight: "600",
                        color: canResend ? "#006D3F" : "#BBCABD",
                      }}
                    >
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                </View>

                {!canResend && (
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 18,
                      fontWeight: "500",
                      color: "#6C7B6F",
                    }}
                  >
                    Resend in{" "}
                    <Text style={{ color: "#2DC97E", fontWeight: "600" }}>
                      {formatTimer(timer)}
                    </Text>
                  </Text>
                )}
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.85}
              style={{
                width: 322,
                height: 56,
                backgroundColor: isComplete ? "#2ECC8B" : "#A8E8C8",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  lineHeight: 24,
                  color: "#FFFFFF",
                }}
              >
                Continue with OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="items-center pb-12">
            <Text
              style={{
                fontSize: 12,
                lineHeight: 20,
                color: "#3D4A40",
                textAlign: "center",
              }}
            >
              By continuing, you agree to our{"\n"}
              <Text style={{ color: "#2DC97E", fontWeight: "500" }}>Terms</Text>
              <Text> & </Text>
              <Text style={{ color: "#2DC97E", fontWeight: "500" }}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
