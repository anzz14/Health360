import { Typography } from "@/components/typography/typography";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Camera,
    ChevronDown,
    GitFork,
    ShieldCheck,
    Users,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Gender = "Male" | "Female" | "Other";
type SetupMode = "create" | "join";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const FAMILY_ILLUSTRATION =
  "https://res.cloudinary.com/dt5qoqw6u/image/upload/v1776014783/a5c4cd72-2dc1-4105-90eb-4e2759a83471_pccwuo.png";

export default function FamilySetupScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<SetupMode>("create");
  const [loading, setLoading] = useState(false);

  // Join Mode State
  const [inviteCode, setInviteCode] = useState("");

  // Create Mode State
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
        cleaned.slice(0, 2) +
        " / " +
        cleaned.slice(2, 4) +
        " / " +
        cleaned.slice(4);
    else if (cleaned.length > 2)
      formatted = cleaned.slice(0, 2) + " / " + cleaned.slice(2);
    setDob(formatted);
  };

  const handleJoinFamily = async () => {
    if (!inviteCode || inviteCode.length < 6) {
      Alert.alert("Error", "Please enter a valid 6-character invite code.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("request_join_family", {
        code_input: inviteCode,
      });
      if (error) throw error;
      if (!data.success) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Request Sent!", data.message);
        setInviteCode("");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName || !memberName || !dob || !bloodGroup) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // 1. Create the Family
      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name: familyName, owner_id: user.id })
        .select("id")
        .single();
      if (familyError) throw familyError;

      // 2. Create the Primary Member Profile (Self)
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: family.id,
          user_id: user.id,
          relationship: "Self",
          full_name: memberName,
          gender,
          dob,
          blood_group: bloodGroup,
        });
      if (memberError) throw memberError;

      // 3. Set the active family ID for the user
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ active_family_id: family.id, full_name: memberName })
        .eq("id", user.id);
      if (profileError) throw profileError;

      // Success! Go to dashboard
      router.replace("/(tabs)/familyCareDashboard");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
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

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          height: 56,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
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
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="h4" color="heading">
            Health360
          </Typography>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
          {/* Custom Segmented Control for Create vs Join */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F3F4F6",
              borderRadius: 12,
              padding: 4,
              marginBottom: 32,
            }}
          >
            <TouchableOpacity
              onPress={() => setMode("create")}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: mode === "create" ? "#FFFFFF" : "transparent",
                shadowColor: mode === "create" ? "#000" : "transparent",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: mode === "create" ? 2 : 0,
              }}
            >
              <Typography
                variant="label"
                color={mode === "create" ? "primary" : "muted"}
                className="font-bold"
              >
                Create Family
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("join")}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: mode === "join" ? "#FFFFFF" : "transparent",
                shadowColor: mode === "join" ? "#000" : "transparent",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: mode === "join" ? 2 : 0,
              }}
            >
              <Typography
                variant="label"
                color={mode === "join" ? "primary" : "muted"}
                className="font-bold"
              >
                Join Family
              </Typography>
            </TouchableOpacity>
          </View>

          {mode === "join" ? (
            <View>
              <Typography variant="h2" color="heading" className="mb-3">
                Join Existing Family
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                className="mb-8 leading-6"
              >
                Enter the 6-character invite code provided by your family admin
                to request access.
              </Typography>
              <View style={{ marginBottom: 24 }}>
                <Typography
                  variant="label"
                  color="heading"
                  className="font-bold mb-2"
                  style={{ letterSpacing: 0.5, textTransform: "uppercase" }}
                >
                  Invite Code
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
                    value={inviteCode}
                    onChangeText={(text) => setInviteCode(text.toUpperCase())}
                    placeholder="E.g. A7X9B2"
                    placeholderTextColor="#9CA3AF"
                    maxLength={6}
                    autoCapitalize="characters"
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: "#374151",
                      padding: 0,
                      fontFamily: "Inter_400Regular",
                      letterSpacing: 2,
                    }}
                  />
                  <Users size={20} color="#9CA3AF" strokeWidth={1.8} />
                </View>
              </View>
              <TouchableOpacity
                onPress={handleJoinFamily}
                disabled={loading}
                activeOpacity={0.88}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 58,
                  borderRadius: 9999,
                  backgroundColor: "#069594",
                  gap: 10,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Typography
                    variant="button"
                    color="white"
                    className="font-bold text-lg"
                  >
                    Send Request
                  </Typography>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Typography variant="h2" color="heading" className="mb-3">
                Name Your Family
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                className="mb-8 leading-6"
              >
                Let&apos;s set up your central healthcare hub by adding your
                first family member.
              </Typography>

              <View style={{ alignItems: "center", marginBottom: 32 }}>
                <TouchableOpacity
                  onPress={handleAvatarPick}
                  activeOpacity={0.85}
                  style={{ position: "relative" }}
                >
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
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Camera size={15} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
              </View>

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

              <View
                style={{
                  height: 1,
                  backgroundColor: "#E5E7EB",
                  marginTop: 20,
                  marginBottom: 24,
                }}
              />
              <Typography
                variant="subtitle"
                color="heading"
                className="font-bold mb-5"
              >
                Primary Member Details
              </Typography>

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

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
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
                      }}
                    >
                      {BLOOD_GROUPS.map((bg, i) => (
                        <TouchableOpacity
                          key={bg}
                          onPress={() => {
                            setBloodGroup(bg);
                            setShowBloodPicker(false);
                          }}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            backgroundColor:
                              bloodGroup === bg
                                ? "rgba(6,149,148,0.08)"
                                : "#FFFFFF",
                            borderBottomWidth:
                              i < BLOOD_GROUPS.length - 1 ? 1 : 0,
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
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 9999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          gender === g ? "#069594" : "transparent",
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
                  style={{ marginTop: 1 }}
                />
                <Typography
                  variant="body-small"
                  color="heading"
                  className="flex-1 leading-5 opacity-80"
                >
                  Your family data is encrypted and secure. Health360 follows
                  strict HIPAA compliance guidelines for personal health
                  records.
                </Typography>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {mode === "create" && (
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
            onPress={handleCreateFamily}
            disabled={loading}
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
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Typography
                  variant="button"
                  color="white"
                  className="font-bold text-lg"
                >
                  Create & Continue
                </Typography>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
