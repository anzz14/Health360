import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  Plus,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";

// ─── Constants ────────────────────────────────────────────────────────────────
type Gender = "Male" | "Female" | "Other";
const GENDERS: Gender[] = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── Label helper – enforces the global label contract ────────────────────────
const FieldLabel = ({ children }: { children: string }) => (
  <Typography
    variant="body"
    color="heading"
    className="font-bold mb-2 ml-1 uppercase"
    style={{ letterSpacing: 0.4 }}
  >
    {children}
  </Typography>
);

// ─── Section wrapper – enforces the 20px (mb-5) vertical rhythm ───────────────
const Section = ({
  children,
  last = false,
}: {
  children: React.ReactNode;
  last?: boolean;
}) => <View className={last ? "" : "mb-5"}>{children}</View>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileDetails() {
  const [fullName, setFullName]     = useState("");
  const [dob, setDob]               = useState("");
  const [gender, setGender]         = useState<Gender>("Male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [height, setHeight]         = useState("");
  const [weight, setWeight]         = useState("");
  const [avatarUri, setAvatarUri]   = useState<string | null>(null);
  const [showBloodPicker, setShowBloodPicker] = useState(false);

  /* ── helpers ── */
  const handleAvatarPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const formatDob = (text: string) => {
    const d = text.replace(/\D/g, "").slice(0, 8);
    if (d.length > 4)
      return setDob(d.slice(0, 2) + " / " + d.slice(2, 4) + " / " + d.slice(4));
    if (d.length > 2) return setDob(d.slice(0, 2) + " / " + d.slice(2));
    setDob(d);
  };

  /* ── render ── */
  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Back button — sits outside scroll so it never moves ── */}
      <View className="px-6 pt-3 pb-1">
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <ArrowLeft size={20} color="#374151" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable body — 24 px horizontal gutter, 40 px bottom pad ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24, // = px-6
          paddingBottom: 40,
          paddingTop: 16,        // = pt-4
        }}
      >

        {/* ════════════════════════════════════════════════════════════════════
            PROGRESS SECTION                                               mb-8
            ════════════════════════════════════════════════════════════════════ */}
        <View className="mb-8">
          {/* Label row */}
          <View className="flex-row justify-between items-center">
            <Typography variant="body-small" color="secondary">
              Let's set up your profile · Step 1 of 3
            </Typography>
            <Typography
              variant="body-small"
              color="primary"
              className="font-bold"
            >
              33%
            </Typography>
          </View>

          {/* Track + fill */}
          <View
            className="mt-2 rounded-full overflow-hidden"
            style={{ height: 6, backgroundColor: "#E5E7EB" }}
          >
            <View
              className="bg-primary rounded-full"
              style={{ width: "33%", height: 6 }}
            />
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            PAGE HEADING                                                   mb-8
            ════════════════════════════════════════════════════════════════════ */}
        <View className="mb-8">
          <Typography variant="h2" color="heading" className="mb-1">
            Tell Us About You
          </Typography>
          <Typography variant="body" color="secondary">
            This helps doctors and labs serve you better
          </Typography>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            AVATAR UPLOAD                                                  mb-8
            ════════════════════════════════════════════════════════════════════ */}
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={handleAvatarPick}
            activeOpacity={0.85}
            style={{ position: "relative" }}
          >
            {/* Dashed teal circle */}
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 9999,
                borderWidth: 2,
                borderColor: "#069594",
                borderStyle: "dashed",
                backgroundColor: "#F5F7FA",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 96, height: 96, borderRadius: 9999 }}
                />
              ) : (
                <Camera size={30} color="#069594" strokeWidth={1.8} />
              )}
            </View>

            {/* "+" badge — absolutely pinned to bottom-right of the circle */}
            <View
              className="absolute bg-primary rounded-full items-center justify-center"
              style={{
                width: 22,
                height: 22,
                bottom: 2,
                right: 2,
                borderWidth: 2,
                borderColor: "#FFFFFF",
              }}
            >
              <Plus size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
          </TouchableOpacity>

          {/* Caption */}
          <TouchableOpacity onPress={handleAvatarPick} activeOpacity={0.7} className="mt-3">
            <Typography
              variant="body-small"
              color="primary"
              className="font-bold text-center"
              style={{ letterSpacing: 1.3 }}
            >
              ADD YOUR PHOTO
            </Typography>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            FORM FIELDS — 20 px (mb-5) vertical rhythm between each field
            ════════════════════════════════════════════════════════════════════ */}

        {/* Full Name */}
        <Section>
          <FieldLabel>Full Name</FieldLabel>
          <Input
            placeholder="Enter name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </Section>

        {/* Date of Birth */}
        <Section>
          <FieldLabel>Date of Birth</FieldLabel>
          <Input
            placeholder="DD / MM / YYYY"
            value={dob}
            onChangeText={formatDob}
            keyboardType="number-pad"
            maxLength={14}
            suffix={
              <CalendarDays size={20} color="#6B7280" strokeWidth={1.8} />
            }
          />
        </Section>

        {/* Gender Selector */}
        <Section>
          <FieldLabel>Gender</FieldLabel>

          <View
            className="flex-row p-1 rounded-2xl"
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {GENDERS.map((g) => {
              const isActive = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                  className="flex-1 items-center py-3 rounded-xl"
                  style={
                    isActive
                      ? {
                          backgroundColor: "#069594",
                          shadowColor: "#069594",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                      : { backgroundColor: "transparent" }
                  }
                >
                  <Typography
                    variant="body-small"
                    color={isActive ? "white" : "heading"}
                    className={isActive ? "font-bold" : "font-medium"}
                  >
                    {g}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Blood Group */}
        <Section>
          <FieldLabel>Blood Group</FieldLabel>

          {/* Tap wraps a disabled Input to keep pill shape */}
          <TouchableOpacity
            onPress={() => setShowBloodPicker((v) => !v)}
            activeOpacity={0.85}
          >
            <Input
              placeholder="Select"
              value={bloodGroup}
              editable={false}
              pointerEvents="none"
              suffix={
                <ChevronDown
                  size={18}
                  color="#9CA3AF"
                  strokeWidth={2}
                  style={{
                    transform: [{ rotate: showBloodPicker ? "180deg" : "0deg" }],
                  }}
                />
              }
            />
          </TouchableOpacity>

          {/* Inline dropdown — renders directly below, pushes layout down */}
          {showBloodPicker && (
            <View
              className="bg-white rounded-2xl overflow-hidden mt-1"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {BLOOD_GROUPS.map((bg, i) => (
                <TouchableOpacity
                  key={bg}
                  onPress={() => {
                    setBloodGroup(bg);
                    setShowBloodPicker(false);
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 11,
                    paddingHorizontal: 16,
                    backgroundColor:
                      bloodGroup === bg ? "rgba(6,149,148,0.08)" : "#FFFFFF",
                    borderBottomWidth: i < BLOOD_GROUPS.length - 1 ? 1 : 0,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <Typography
                    variant="body-small"
                    color={bloodGroup === bg ? "primary" : "default"}
                    className={bloodGroup === bg ? "font-bold" : ""}
                  >
                    {bg}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Height + Weight — side-by-side with gap-x-4 */}
        <Section>
          <View className="flex-row" style={{ gap: 16 }}>

            {/* Height */}
            <View className="flex-1">
              <FieldLabel>Height</FieldLabel>
              <Input
                placeholder="175"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                maxLength={5}
                suffixText="cm"
              />
            </View>

            {/* Weight */}
            <View className="flex-1">
              <FieldLabel>Weight</FieldLabel>
              <Input
                placeholder="70"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                maxLength={5}
                suffixText="kg"
              />
            </View>
          </View>
        </Section>

        {/* Known Allergies & Chronic Illnesses */}
        <Section last>
          <FieldLabel>Known Allergies &amp; Chronic Illnesses</FieldLabel>

          {/* Pill-shaped read trigger (multiline textarea-style) */}
          <TouchableOpacity
            activeOpacity={0.85}
            className="bg-white rounded-2xl px-4 flex-row items-center justify-between"
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              minHeight: 56,
              paddingVertical: 14,
            }}
          >
            <Typography
              variant="body"
              color="muted"
              className="flex-1 opacity-70"
              style={{ flex: 1 }}
            >
              e.g. Penicillin allergy, Type 2 Diabetes...
            </Typography>
            <ChevronDown
              size={18}
              color="#9CA3AF"
              strokeWidth={2}
              style={{ flexShrink: 0, marginLeft: 8 }}
            />
          </TouchableOpacity>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            FOOTER
            ════════════════════════════════════════════════════════════════════ */}
        <Button
          title="Save & Continue"
          variant="primary"
          rounded="full"
          size="lg"
          className="w-full mt-10"
          rightIcon={
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          }
          onPress={() => console.log("Save & Continue")}
        />

        <View className="items-center mt-5">
          <TouchableOpacity activeOpacity={0.7}>
            <Typography variant="body" color="secondary">
              Skip for now
            </Typography>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}