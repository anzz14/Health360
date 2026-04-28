import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Plus,
  X,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
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
import { ALLERGIES, CHRONIC_ILLNESSES } from "@/constants/medical-data";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";

// ─── Constants ────────────────────────────────────────────────────────────────
type Gender = "Male" | "Female" | "Other";
const GENDERS: Gender[] = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── Label helper ────────────────────────
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

const Section = ({
  children,
  last = false,
}: {
  children: React.ReactNode;
  last?: boolean;
}) => <View className={last ? "" : "mb-5"}>{children}</View>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileDetails() {
  const { user } = useAuth();
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showBloodPicker, setShowBloodPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // <-- Added loading state

  // Medical Data State
  const [allergies, setAllergies] = useState<string[]>([]);
  const [illnesses, setIllnesses] = useState<string[]>([]);

  // Bottom Sheet State
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%"], []);

  // ─── FETCH EXISTING DATA ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("family_members")
          .select("*")
          .eq("user_id", user.id)
          .eq("relationship", "Self")
          .single();

        if (data) {
          setFullName(data.full_name || "");
          setDob(data.dob || "");
          setGender(data.gender || "Male");
          setBloodGroup(data.blood_group || "");
          setHeight(data.height || "");
          setWeight(data.weight || "");
          setAvatarUri(data.avatar_url || null);
          setAllergies(data.allergies || []);
          setIllnesses(data.chronic_illnesses || []);
        }
      } catch (err) {
        // No existing profile found, it will just stay blank
      } finally {
        setInitialLoad(false);
      }
    };
    fetchProfile();
  }, [user]);

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

  const handleSave = async () => {
    if (!fullName || !dob) {
      Alert.alert(
        "Missing Info",
        "Please enter at least your Name and Date of Birth.",
      );
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      // 1. BULLETPROOF FIX: Guarantee the profile exists before we do anything else
      const { error: profileCheckError } = await supabase
        .from("profiles")
        .upsert({ id: user.id }) // Creates it if it's missing!
        .select()
        .single();

      if (profileCheckError)
        console.log("Profile check note:", profileCheckError.message);

      // 2. Check if the user ALREADY has an active family
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_family_id")
        .eq("id", user.id)
        .single();

      let familyId = profile?.active_family_id;

      // 3. If they don't have a family yet, create one
      if (!familyId) {
        const familyName = `${fullName.split(" ")[0]}'s Family`;
        const { data: newFamily, error: familyError } = await supabase
          .from("families")
          .insert({ name: familyName, owner_id: user.id })
          .select("id")
          .single();

        if (familyError) throw familyError;
        familyId = newFamily.id;

        // Update the profile to remember this family
        await supabase
          .from("profiles")
          .update({ active_family_id: familyId })
          .eq("id", user.id);
      }

      // 4. Check if their Personal Profile already exists in family_members
      const { data: existingMember } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("relationship", "Self")
        .single();

      // The Data we want to save
      const memberData = {
        family_id: familyId,
        user_id: user.id,
        relationship: "Self",
        full_name: fullName,
        gender,
        dob,
        blood_group: bloodGroup,
        height,
        weight,
        allergies,
        chronic_illnesses: illnesses,
        avatar_url: avatarUri,
      };

      // 5. If they exist, UPDATE. If they don't, INSERT.
      if (existingMember) {
        const { error: updateError } = await supabase
          .from("family_members")
          .update(memberData)
          .eq("id", existingMember.id);
        if (updateError) throw updateError;
        Alert.alert("Success", "Profile updated successfully!"); // <-- Let them know it saved!
      } else {
        const { error: insertError } = await supabase
          .from("family_members")
          .insert(memberData);
        if (insertError) throw insertError;
        router.replace("/(tabs)/familyCareDashboard"); // Only redirect if it's their first time
      }
    } catch (error: any) {
      Alert.alert("Database Error", error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Multi-Select Toggles
  const toggleAllergy = (item: string) =>
    setAllergies((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  const toggleIllness = (item: string) =>
    setIllnesses((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  // Show a quick loader while it fetches existing data so fields don't suddenly jump from empty to full
  if (initialLoad) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#069594" />
      </SafeAreaView>
    );
  }

  /* ── render ── */
  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Back button */}
      <View className="px-6 pt-3 pb-1">
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <ArrowLeft size={20} color="#374151" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          paddingTop: 16,
        }}
      >
        {/* Progress */}
        <View className="mb-8">
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

        {/* Heading */}
        <View className="mb-8">
          <Typography variant="h2" color="heading" className="mb-1">
            Tell Us About You
          </Typography>
          <Typography variant="body" color="secondary">
            This helps doctors and labs serve you better
          </Typography>
        </View>

        {/* Avatar Upload */}
        <View className="items-center mb-8">
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
          <TouchableOpacity
            onPress={handleAvatarPick}
            activeOpacity={0.7}
            className="mt-3"
          >
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

        {/* FORM FIELDS */}
        <Section>
          <FieldLabel>Full Name</FieldLabel>
          <Input
            placeholder="Enter name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </Section>

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

        <Section>
          <FieldLabel>Blood Group</FieldLabel>
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
                    transform: [
                      { rotate: showBloodPicker ? "180deg" : "0deg" },
                    ],
                  }}
                />
              }
            />
          </TouchableOpacity>
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

        <Section>
          <View className="flex-row" style={{ gap: 16 }}>
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

        <Section last>
          <FieldLabel>Known Allergies & Chronic Illnesses</FieldLabel>
          <TouchableOpacity
            onPress={() => bottomSheetModalRef.current?.present()}
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
              color={allergies.length || illnesses.length ? "heading" : "muted"}
              className="flex-1 opacity-70"
            >
              {allergies.length || illnesses.length
                ? `${allergies.length + illnesses.length} selected`
                : "e.g. Penicillin allergy, Type 2 Diabetes..."}
            </Typography>
            <ChevronDown
              size={18}
              color="#9CA3AF"
              strokeWidth={2}
              style={{ flexShrink: 0, marginLeft: 8 }}
            />
          </TouchableOpacity>
        </Section>

        {/* FOOTER */}
        <Button
          title={saving ? "Saving..." : "Save & Continue"}
          variant="primary"
          rounded="full"
          size="lg"
          className="w-full mt-10"
          disabled={saving}
          rightIcon={
            !saving && (
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            )
          }
          onPress={handleSave}
        />
      </ScrollView>

      {/* --- BOTTOM SHEET FOR MEDICAL DATA --- */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#fff", borderRadius: 24 }}
      >
        <View style={{ padding: 20, flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Typography variant="h3" color="heading">
              Medical Conditions
            </Typography>
            <TouchableOpacity
              onPress={() => bottomSheetModalRef.current?.dismiss()}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Allergies Section */}
            <Typography
              variant="subtitle"
              color="heading"
              className="mb-3 mt-2"
            >
              Allergies
            </Typography>
            <View style={{ gap: 10 }}>
              {ALLERGIES.map((item) => {
                const isSelected = allergies.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleAllergy(item)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? "#069594" : "#E5E7EB",
                      backgroundColor: isSelected ? "#F0FAF9" : "#fff",
                    }}
                  >
                    <Typography
                      variant="body"
                      color={isSelected ? "primary" : "heading"}
                      className={isSelected ? "font-bold" : ""}
                    >
                      {item}
                    </Typography>
                    {isSelected && <Check size={18} color="#069594" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Illnesses Section */}
            <Typography
              variant="subtitle"
              color="heading"
              className="mb-3 mt-8"
            >
              Chronic Illnesses
            </Typography>
            <View style={{ gap: 10 }}>
              {CHRONIC_ILLNESSES.map((item) => {
                const isSelected = illnesses.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleIllness(item)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? "#069594" : "#E5E7EB",
                      backgroundColor: isSelected ? "#F0FAF9" : "#fff",
                    }}
                  >
                    <Typography
                      variant="body"
                      color={isSelected ? "primary" : "heading"}
                      className={isSelected ? "font-bold" : ""}
                    >
                      {item}
                    </Typography>
                    {isSelected && <Check size={18} color="#069594" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
