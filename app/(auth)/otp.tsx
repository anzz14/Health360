import { Button } from "@/components/button/button";
import { Typography } from "@/components/typography/typography";
import { Heart } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";

const PHONE_NUMBER = "+91 98765 43210";
const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 28;

export default function OtpScreen() {
  const [otp, setOtp]               = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [timer, setTimer]           = useState<number>(RESEND_TIMEOUT);
  const [canResend, setCanResend]   = useState<boolean>(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  /* ── countdown ── */
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => {
      setTimer((p) => {
        if (p <= 1) { clearInterval(id); setCanResend(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /* ── input handlers ── */
  const handleChange = (text: string, i: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < OTP_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus(); setActiveIndex(i + 1);
    }
  };

  const handleKey = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, i: number) => {
    if (e.nativeEvent.key !== "Backspace") return;
    const next = [...otp];
    if (!otp[i] && i > 0) {
      next[i - 1] = ""; setOtp(next);
      inputRefs.current[i - 1]?.focus(); setActiveIndex(i - 1);
    } else { next[i] = ""; setOtp(next); }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimer(RESEND_TIMEOUT); setCanResend(false); setActiveIndex(0);
    inputRefs.current[0]?.focus();
    const id = setInterval(() => {
      setTimer((p) => { if (p <= 1) { clearInterval(id); setCanResend(true); return 0; } return p - 1; });
    }, 1000);
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    /*
     * LAYOUT CONTRACT
     * ───────────────────────────────────────────────────────────────────
     * SafeAreaView  flex:1
     *   KeyboardAvoidingView  flex:1
     *     Shell  flex:1  position:relative   ← footer anchor point
     *       Body  flex:1  alignItems:center  ← ALL children auto-centred
     *       Footer  position:absolute bottom:32  ← guaranteed bottom pin
     * ───────────────────────────────────────────────────────────────────
     * Zero ml / mr anywhere. Horizontal position comes only from:
     *   • Parent alignItems:"center"
     *   • paddingHorizontal:24 on body
     *   • w-full on Button (stretches to padded edges)
     *   • justifyContent:"center" + gap on OTP row
     */
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Shell ── */}
        <View style={{ flex: 1, position: "relative" }}>

          {/* ── Centred body ── */}
          <View
            style={{
              flex: 1,
              alignItems: "center",       // horizontal centre for every child
              paddingHorizontal: 24,      // strict 24 px gutter — never deviate
              paddingTop: 80,
              paddingBottom: 104,         // clears the absolute footer
            }}
          >

            {/* Heart icon */}
            <View
              style={{
                width: 80, height: 80,
                borderRadius: 9999,
                backgroundColor: "rgba(6,149,148,0.12)",
                alignItems: "center", justifyContent: "center",
                marginBottom: 28,
              }}
            >
              <Heart size={36} color="#069594" fill="#069594" />
            </View>

            {/* Title */}
            <Typography
              variant="h2"
              color="heading"
              className="text-center"
              style={{ marginBottom: 8 }}
            >
              Enter OTP
            </Typography>

            {/* Subtitle — single block; phone number is an inline nested Typography */}
            <Typography
              variant="body"
              color="default"
              className="text-center opacity-80"
              style={{ marginBottom: 40, lineHeight: 22 }}
            >
              {"We've sent a 6-digit code to "}
              <Typography variant="body" color="primary" className="font-semibold">
                {PHONE_NUMBER}
              </Typography>
            </Typography>

            {/* ─────────────────────────────────────────────────────────────
                OTP GRID
                • w:"100%" fills the padded parent exactly
                • justifyContent:"center" distributes boxes symmetrically
                • gap:10  is the ONLY spacing between boxes — no ml/mr
                ───────────────────────────────────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                width: "100%",
                gap: 10,
                marginBottom: 28,
              }}
            >
              {otp.map((digit, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <View
                    key={idx}
                    style={{
                      width: 50, height: 60,
                      borderRadius: 12,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: "#FFFFFF",
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive ? "#069594" : "#E5E7EB",
                      ...(isActive && {
                        shadowColor: "#069594",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }),
                    }}
                  >
                    <TextInput
                      // >
                      value={digit}
                      onChangeText={(t) => handleChange(t, idx)}
                      onKeyPress={(e) => handleKey(e, idx)}
                      onFocus={() => setActiveIndex(idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectionColor="#069594"
                      style={{
                        width: 50, height: 60,
                        textAlign: "center",
                        fontSize: 22, fontWeight: "700",
                        color: "#1A2B4B",
                        fontFamily: "Inter_700Bold",
                        padding: 0,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            {/* Resend section */}
            <View style={{ alignItems: "center", gap: 6, marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Typography variant="body-small" color="default">
                  {"Didn't receive code? "}
                </Typography>
                <TouchableOpacity onPress={handleResend} disabled={!canResend} activeOpacity={0.7}>
                  <Typography
                    variant="body-small"
                    color={canResend ? "primary" : "muted"}
                    className="font-bold"
                  >
                    Resend OTP
                  </Typography>
                </TouchableOpacity>
              </View>

              {!canResend && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Typography variant="body-small" color="default" className="opacity-70">
                    {"Resend in "}
                  </Typography>
                  <Typography variant="body-small" color="primary" className="font-semibold">
                    {fmt(timer)}
                  </Typography>
                </View>
              )}
            </View>

            {/* CTA — w-full stretches to the 24 px padded edges of parent */}
            <Button
              title="Continue with OTP"
              onPress={() => isComplete && console.log("OTP:", otp.join(""))}
              variant="primary"
              rounded="2xl"
              size="lg"
              className="w-full"
              style={{ opacity: isComplete ? 1 : 0.55 }}
            />

          </View>{/* end body */}

          {/* ─────────────────────────────────────────────────────────────
              FOOTER — absolute pin, guaranteed bottom regardless of screen size
              left:0 right:0 + alignItems:center = perfectly centred
              No ml/mr, no translate hacks
              ───────────────────────────────────────────────────────── */}
          <View
            style={{
              position: "absolute",
              bottom: 32,
              left: 0,
              right: 0,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Typography variant="body-small" color="default" className="opacity-70">
              By continuing, you agree to our
            </Typography>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <TouchableOpacity activeOpacity={0.7}>
                <Typography variant="body-small" color="primary" className="font-medium">
                  Terms
                </Typography>
              </TouchableOpacity>
              <Typography variant="body-small" color="default" className="opacity-50">
                &amp;
              </Typography>
              <TouchableOpacity activeOpacity={0.7}>
                <Typography variant="body-small" color="primary" className="font-medium">
                  Privacy Policy
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

        </View>{/* end shell */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}