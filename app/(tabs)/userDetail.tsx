import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  FileText,
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

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  const handleAvatarPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const formatDob = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 3 && cleaned.length <= 4) {
      formatted = cleaned.slice(0, 2) + " / " + cleaned.slice(2);
    } else if (cleaned.length > 4) {
      formatted =
        cleaned.slice(0, 2) +
        " / " +
        cleaned.slice(2, 4) +
        " / " +
        cleaned.slice(4, 8);
    }
    setDob(formatted);
  };

  const PROGRESS = 1 / 3;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          height: 52,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress Section */}
        <View style={{ marginTop: 24, marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#6B7280",
                lineHeight: 18,
              }}
            >
              Complete your health profile
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#2DC97E",
                lineHeight: 18,
              }}
            >
              1/3
            </Text>
          </View>
          <View
            style={{
              width: "100%",
              height: 6,
              backgroundColor: "#E5E7EB",
              borderRadius: 9999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${PROGRESS * 100}%`,
                height: 6,
                backgroundColor: "#2DC97E",
                borderRadius: 9999,
              }}
            />
          </View>
        </View>

        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#1A2B4B",
              lineHeight: 32,
              marginBottom: 8,
            }}
          >
            Tell Us About You
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", lineHeight: 20 }}>
            This helps doctors and labs serve you better
          </Text>
        </View>

        {/* Avatar Upload */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
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
                backgroundColor: "#F5F7FA",
                borderWidth: 2,
                borderColor: "#2DC97E",
                borderStyle: "dashed",
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
                <Camera size={28} color="#2DC97E" strokeWidth={1.8} />
              )}
            </View>
            {/* Edit badge */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: 9999,
                backgroundColor: "#2DC97E",
                borderWidth: 2,
                borderColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={10} color="#FFFFFF" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              fontWeight: "700",
              color: "#2DC97E",
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            Upload Photo
          </Text>
        </View>

        {/* Profile Form */}
        <View style={{ gap: 24 }}>
          {/* Full Name */}
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={[styles.inputWrapper, { position: "relative" }]}>
              <TextInput
                value={dob}
                onChangeText={formatDob}
                placeholder="DD / MM / YYYY"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={14}
                style={styles.input}
              />
              <View
                style={{
                  position: "absolute",
                  right: 18,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <CalendarDays size={18} color="#9CA3AF" strokeWidth={1.8} />
              </View>
            </View>
          </View>

          {/* Gender */}
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Gender</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
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
                    backgroundColor: gender === g ? "#2DC97E" : "#FFFFFF",
                    borderWidth: gender === g ? 2 : 1,
                    borderColor: gender === g ? "#2DC97E" : "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: gender === g ? "700" : "500",
                      color: gender === g ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Blood Group */}
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Blood Group</Text>
            <TouchableOpacity
              onPress={() => setShowBloodGroupPicker(!showBloodGroupPicker)}
              activeOpacity={0.85}
              style={[
                styles.inputWrapper,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: bloodGroup ? "#374151" : "#9CA3AF",
                  fontWeight: "400",
                }}
              >
                {bloodGroup || "Select blood group"}
              </Text>
              <ChevronDown size={18} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>

            {showBloodGroupPicker && (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                {BLOOD_GROUPS.map((bg, i) => (
                  <TouchableOpacity
                    key={bg}
                    onPress={() => {
                      setBloodGroup(bg);
                      setShowBloodGroupPicker(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor:
                        bloodGroup === bg
                          ? "rgba(45, 201, 126, 0.08)"
                          : "#FFFFFF",
                      borderBottomWidth: i < BLOOD_GROUPS.length - 1 ? 1 : 0,
                      borderBottomColor: "#F3F4F6",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
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

          {/* Height & Weight */}
          <View style={{ flexDirection: "row", gap: 16 }}>
            {/* Height */}
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.label}>Height</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  },
                ]}
              >
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="—"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#1A2B4B",
                    paddingVertical: 0,
                    height: 46,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#6B7280",
                    marginLeft: 4,
                  }}
                >
                  cm
                </Text>
              </View>
            </View>

            {/* Weight */}
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.label}>Weight</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  },
                ]}
              >
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="—"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#1A2B4B",
                    paddingVertical: 0,
                    height: 46,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#6B7280",
                    marginLeft: 4,
                  }}
                >
                  kg
                </Text>
              </View>
            </View>
          </View>

          {/* Health Notes */}
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>
              Known Allergies & Chronic Illnesses
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 24,
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 14,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                minHeight: 80,
              }}
            >
              <TextInput
                value={healthNotes}
                onChangeText={setHealthNotes}
                placeholder="e.g. Penicillin allergy, Type 2 Diabetes..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#1A2B4B",
                  lineHeight: 22,
                  textAlignVertical: "top",
                  padding: 0,
                  minHeight: 52,
                }}
              />
              <FileText
                size={18}
                color="#9CA3AF"
                strokeWidth={1.8}
                style={{ marginTop: 2 }}
              />
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={{ marginTop: 48, gap: 16 }}>
          {/* Primary CTA */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={{
              width: "100%",
              height: 60,
              backgroundColor: "#2DC97E",
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              shadowColor: "#2DC97E",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 15,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#FFFFFF",
                lineHeight: 28,
              }}
            >
              Continue
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Skip link */}
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#6B7280",
                  lineHeight: 20,
                }}
              >
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#1A2B4B",
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
    lineHeight: 16,
  },
  inputWrapper: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 48,
    justifyContent: "center" as const,
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    padding: 0,
    height: 46,
  },
};
