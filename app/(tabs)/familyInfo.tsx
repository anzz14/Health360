import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Gender = "Male" | "Female" | "Other" | null;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function CreateFamilyProfileScreen() {
  const [familyName, setFamilyName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
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
        cleaned.slice(0, 2) +
        " / " +
        cleaned.slice(2, 4) +
        " / " +
        cleaned.slice(4);
    else if (cleaned.length > 2)
      formatted = cleaned.slice(0, 2) + " / " + cleaned.slice(2);
    setDob(formatted);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View
        className="flex-row items-center px-4 bg-white border-b border-gray-100"
        style={{
          height: 64,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          className="w-8 h-8 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>

        <Text className="ml-4 text-lg font-bold" style={{ color: "#1A2B4B" }}>
          Health360
        </Text>
      </View>

      {/* ── Step Indicators ── */}
      <View
        className="flex-row justify-center items-center px-6 pt-2 pb-0 bg-white gap-2"
        style={{ gap: 8 }}
      >
        <View
          className="h-1.5 rounded-full"
          style={{ width: 32, backgroundColor: "#2DC97E" }}
        />
        <View
          className="h-1.5 rounded-full"
          style={{ width: 8, backgroundColor: "#E0E3E6" }}
        />
        <View
          className="h-1.5 rounded-full"
          style={{ width: 8, backgroundColor: "#E0E3E6" }}
        />
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Header */}
        <View className="mb-6" style={{ gap: 8 }}>
          <Text
            className="font-extrabold"
            style={{ fontSize: 24, lineHeight: 30, color: "#1A2B4B" }}
          >
            Name Your Family
          </Text>
          <Text
            className="text-sm"
            style={{ lineHeight: 20, color: "#3D4A40" }}
          >
            Let's set up your central healthcare hub by adding your first family
            member.
          </Text>
        </View>

        {/* ── Avatar ── */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={handleAvatarPick}
            activeOpacity={0.85}
            style={{ position: "relative" }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 9999,
                backgroundColor: "#ECEEF1",
                borderWidth: 4,
                borderColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 88, height: 88, borderRadius: 9999 }}
                />
              ) : (
                <User size={36} color="#9CA3AF" strokeWidth={1.5} />
              )}
            </View>

            {/* Camera badge */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: 9999,
                backgroundColor: "#2DC97E",
                borderWidth: 2,
                borderColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Camera size={12} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </TouchableOpacity>

          <Text
            className="mt-2 font-semibold tracking-widest uppercase"
            style={{ fontSize: 12, color: "#006D3F", letterSpacing: 0.6 }}
          >
            Upload Photo
          </Text>
        </View>

        {/* ── Form Fields ── */}
        <View style={{ gap: 16 }}>
          {/* Family Name */}
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Family Name</Text>
            <View style={[styles.inputRow, { position: "relative" }]}>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Enter Name"
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
                autoCapitalize="words"
              />
              <View
                style={{
                  position: "absolute",
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <User size={18} color="#3D4A40" strokeWidth={1.8} />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View
            className="w-full h-px"
            style={{ backgroundColor: "#E0E3E6" }}
          />

          {/* Section heading */}
          <Text className="font-bold text-sm" style={{ color: "#1A2B4B" }}>
            Primary Member Details
          </Text>

          {/* Full Name */}
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={memberName}
                onChangeText={setMemberName}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* DOB + Blood Group side by side */}
          <View className="flex-row" style={{ gap: 16 }}>
            {/* Date of Birth */}
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={[styles.inputRow, { position: "relative" }]}>
                <TextInput
                  value={dob}
                  onChangeText={formatDob}
                  placeholder="DD / MM / YYYY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={14}
                  style={[styles.textInput, { paddingRight: 36 }]}
                />
                <View
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                  }}
                >
                  <CalendarDays size={15} color="#9CA3AF" strokeWidth={1.8} />
                </View>
              </View>
            </View>

            {/* Blood Group */}
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.label}>Blood Group</Text>
              <TouchableOpacity
                onPress={() => setShowBloodPicker(!showBloodPicker)}
                activeOpacity={0.85}
                style={[
                  styles.inputRow,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, color: "#374151" }}>
                  {bloodGroup}
                </Text>
                <ChevronDown size={18} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>

              {showBloodPicker && (
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 20,
                    overflow: "hidden",
                    marginTop: 4,
                    zIndex: 10,
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
                        paddingHorizontal: 14,
                        backgroundColor:
                          bloodGroup === bg
                            ? "rgba(45,201,126,0.08)"
                            : "#FFFFFF",
                        borderBottomWidth: i < BLOOD_GROUPS.length - 1 ? 1 : 0,
                        borderBottomColor: "#F3F4F6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: bloodGroup === bg ? "#2DC97E" : "#374151",
                          fontWeight: bloodGroup === bg ? "700" : "400",
                        }}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Gender Segmented Control */}
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Gender</Text>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 9999,
                padding: 4,
                gap: 0,
              }}
            >
              {(["Male", "Female", "Other"] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: gender === g ? "#2DC97E" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: gender === g ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info / Disclaimer Banner */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              backgroundColor: "#ECFDF5",
              borderWidth: 1,
              borderColor: "#D1FAE5",
              borderRadius: 32,
              padding: 12,
              gap: 12,
            }}
          >
            <ShieldCheck
              size={16}
              color="#006D3F"
              strokeWidth={2}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 10,
                lineHeight: 16,
                color: "#00522F",
              }}
            >
              Your health data is encrypted and protected under HIPAA-compliant
              storage. Only you and authorised family members can access this
              profile.
            </Text>
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
          paddingTop: 16,
          paddingBottom: Platform.OS === "ios" ? 36 : 24,
          //   background: "transparent",
        }}
        pointerEvents="box-none"
      >
        {/* Fade gradient layer */}
        <View
          style={{
            position: "absolute",
            top: -24,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#F8FDFB",
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
            height: 56,
            borderRadius: 9999,
            backgroundColor: "#2DC97E",
            gap: 8,
            shadowColor: "#A7F3D0",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            Continue
          </Text>
          <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#1A2B4B",
    letterSpacing: -0.3,
    textTransform: "uppercase" as const,
    lineHeight: 16,
  },
  inputRow: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 48,
    justifyContent: "center" as const,
    paddingHorizontal: 16,
  },
  textInput: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    padding: 0,
    height: 46,
  },
};
