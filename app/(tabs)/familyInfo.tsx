import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  GitFork,
  ShieldCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Typography } from "@/components/typography/typography";
import { Button } from "@/components/button/button";

type Gender = "Male" | "Female" | "Other";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const FAMILY_ILLUSTRATION =
  "https://res.cloudinary.com/dt5qoqw6u/image/upload/v1776014783/a5c4cd72-2dc1-4105-90eb-4e2759a83471_pccwuo.png";

export default function FamilySetupScreen() {
  const [familyName, setFamilyName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showBloodPicker, setShowBloodPicker] = useState(false);

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
    const cleaned = text.replace(/\D/g, "").slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 4)
      formatted =
        cleaned.slice(0, 2) + " / " + cleaned.slice(2, 4) + " / " + cleaned.slice(4);
    else if (cleaned.length > 2)
      formatted = cleaned.slice(0, 2) + " / " + cleaned.slice(2);
    setDob(formatted);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Global Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          height: 56,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="#069594" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Centered Title */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="h4" color="heading">
            Health360
          </Typography>
        </View>

        {/* Spacer to balance the back button */}
        <View style={{ width: 36 }} />
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Step Progress Dots ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 16,
            gap: 6,
          }}
        >
          {/* Active dot (elongated pill) */}
          <View
            style={{
              width: 32,
              height: 8,
              borderRadius: 9999,
              backgroundColor: "#069594",
            }}
          />
          {/* Inactive dots */}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              backgroundColor: "#D1D5DB",
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              backgroundColor: "#D1D5DB",
            }}
          />
        </View>

        {/* ── Main Content ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>

          {/* ── Heading & Subtitle ── */}
          <Typography variant="h2" color="heading" className="mb-3">
            Name Your Family
          </Typography>

          <Typography variant="body" color="secondary" className="mb-8 leading-6">
            Let's set up your central healthcare hub by adding your first family
            member.
          </Typography>

          {/* ── Avatar Section ── */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={handleAvatarPick}
              activeOpacity={0.85}
              style={{ position: "relative" }}
            >
              {/* Avatar circle */}
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 9999,
                  backgroundColor: "#F0FAF9",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#069594",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <Image
                  source={{ uri: avatarUri ?? FAMILY_ILLUSTRATION }}
                  style={{ width: 110, height: 110 }}
                  resizeMode="cover"
                />
              </View>

              {/* Camera badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 34,
                  height: 34,
                  borderRadius: 9999,
                  backgroundColor: "#069594",
                  borderWidth: 2.5,
                  borderColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Camera size={15} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>

            {/* Change Photo label */}
            <TouchableOpacity onPress={handleAvatarPick} activeOpacity={0.7} style={{ marginTop: 12 }}>
              <Typography
                variant="label"
                color="primary"
                className="font-bold tracking-widest"
                style={{ letterSpacing: 1.2 }}
              >
                CHANGE PHOTO
              </Typography>
            </TouchableOpacity>
          </View>

          {/* ── Family Name Input ── */}
          <View style={{ marginBottom: 6 }}>
            <Typography
              variant="label"
              color="heading"
              className="font-bold mb-2"
              style={{ letterSpacing: 0.5, textTransform: "uppercase" }}
            >
              Family Name
            </Typography>

            <View
              style={{
                height: 52,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                backgroundColor: "#FFFFFF",
              }}
            >
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Enter Family Name"
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#374151",
                  padding: 0,
                  fontFamily: "Inter_400Regular",
                }}
                autoCapitalize="words"
              />
              <GitFork size={20} color="#9CA3AF" strokeWidth={1.8} />
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#E5E7EB",
              marginTop: 20,
              marginBottom: 24,
            }}
          />

          {/* ── Primary Member Details ── */}
          <Typography
            variant="subtitle"
            color="heading"
            className="font-bold mb-5"
          >
            Primary Member Details
          </Typography>

          {/* FULL NAME */}
          <View style={{ marginBottom: 16 }}>
            <Typography
              variant="label"
              color="heading"
              className="font-bold mb-2"
              style={{ letterSpacing: 0.5, textTransform: "uppercase" }}
            >
              Full Name
            </Typography>

            <View
              style={{
                height: 52,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                backgroundColor: "#FFFFFF",
              }}
            >
              <TextInput
                value={memberName}
                onChangeText={setMemberName}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#374151",
                  padding: 0,
                  fontFamily: "Inter_400Regular",
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* DOB + Blood Group row */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>

            {/* Date of Birth */}
            <View style={{ flex: 1 }}>
              <Typography
                variant="label"
                color="heading"
                className="font-bold mb-2"
                style={{ letterSpacing: 0.5, textTransform: "uppercase" }}
              >
                Date of Birth
              </Typography>

              <View
                style={{
                  height: 52,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 9999,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <TextInput
                  value={dob}
                  onChangeText={formatDob}
                  placeholder="DD / MM / YYYY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={14}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#374151",
                    padding: 0,
                    fontFamily: "Inter_400Regular",
                  }}
                />
                <CalendarDays size={17} color="#9CA3AF" strokeWidth={1.8} />
              </View>
            </View>

            {/* Blood Group */}
            <View style={{ flex: 1 }}>
              <Typography
                variant="label"
                color="heading"
                className="font-bold mb-2"
                style={{ letterSpacing: 0.5, textTransform: "uppercase" }}
              >
                Blood Group
              </Typography>

              <TouchableOpacity
                onPress={() => setShowBloodPicker(!showBloodPicker)}
                activeOpacity={0.85}
                style={{
                  height: 52,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 9999,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  backgroundColor: "#FFFFFF",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="body"
                  color={bloodGroup ? "default" : "muted"}
                >
                  {bloodGroup || "Select"}
                </Typography>
                <ChevronDown size={18} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>

              {/* Dropdown */}
              {showBloodPicker && (
                <View
                  style={{
                    position: "absolute",
                    top: 78,
                    left: 0,
                    right: 0,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 20,
                    overflow: "hidden",
                    zIndex: 100,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
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
                        paddingVertical: 10,
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
            </View>
          </View>

          {/* GENDER */}
          <View style={{ marginBottom: 24 }}>
            <Typography
              variant="label"
              color="heading"
              className="font-bold mb-3"
              style={{ letterSpacing: 0.5, textTransform: "uppercase" }}
            >
              Gender
            </Typography>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 9999,
                padding: 4,
              }}
            >
              {(["Male", "Female", "Other"] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 9999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: gender === g ? "#069594" : "transparent",
                  }}
                >
                  <Typography
                    variant="body-small"
                    color={gender === g ? "white" : "muted"}
                    className={gender === g ? "font-bold" : "font-medium"}
                  >
                    {g}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── HIPAA Compliance Banner ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              backgroundColor: "#E6F7F7",
              borderRadius: 20,
              padding: 16,
              gap: 12,
              marginBottom: 8,
            }}
          >
            <ShieldCheck
              size={18}
              color="#069594"
              strokeWidth={2}
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            <Typography
              variant="body-small"
              color="heading"
              className="flex-1 leading-5 opacity-80"
              style={{ flex: 1 }}
            >
              Your family data is encrypted and secure. Health360 follows strict
              HIPAA compliance guidelines for personal health records.
            </Typography>
          </View>

        </View>
      </ScrollView>

      {/* ── Sticky Footer CTA ── */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === "ios" ? 36 : 24,
          paddingTop: 12,
        }}
        pointerEvents="box-none"
      >
        {/* Fade gradient overlay */}
        <View
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            opacity: 0.95,
          }}
          pointerEvents="none"
        />

        <TouchableOpacity
          activeOpacity={0.88}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: 58,
            borderRadius: 9999,
            backgroundColor: "#069594",
            gap: 10,
            shadowColor: "#069594",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Typography variant="button" color="white" className="font-bold text-lg">
            Continue
          </Typography>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}