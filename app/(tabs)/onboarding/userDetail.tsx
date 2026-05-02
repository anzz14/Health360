import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  Plus,
  Users,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
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

import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/use-user-profile";

type Gender = "Male" | "Female" | "Other";
const GENDERS: Gender[] = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number] | "";

interface JoinRequest {
  id: string;
  family_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  families?: { name: string };
}

const FieldLabel = ({ children }: { children: string }) => (
  <Typography variant="body" color="heading" className="font-bold mb-2 ml-1 uppercase" style={{ letterSpacing: 0.4 }}>
    {children}
  </Typography>
);

const Section = ({ children, last = false }: { children: React.ReactNode; last?: boolean }) => (
  <View className={last ? "" : "mb-5"}>{children}</View>
);

const JoinRequestCard = ({ req }: { req: JoinRequest }) => (
  <View className="bg-white rounded-2xl px-4 py-3 mb-2" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
    <Typography variant="body-small" color="heading" className="font-bold">
      {req.families?.name || "Family"}
    </Typography>
    <Typography variant="body-small" color="secondary">
      Status: {req.status}
    </Typography>
    <Typography variant="body-small" color="secondary">
      {new Date(req.created_at).toLocaleDateString()}
    </Typography>
  </View>
);

export default function ProfileDetails() {
  const router = useRouter();
  const { loadProfile, saveProfile, saving } = useUserProfile();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showBloodPicker, setShowBloodPicker] = useState(false);

  // Join request state
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinMessageIsError, setJoinMessageIsError] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const initializeProfile = async () => {
      const result = await loadProfile();
      if (result.success && result.data) {
        setFullName(result.data.fullName);
        setDob(result.data.dob);
        setGender(result.data.gender);
        setBloodGroup(result.data.bloodGroup);
        setHeight(result.data.height);
        setWeight(result.data.weight);
        setMedicalNotes(result.data.medicalNotes);
        setAvatarUri(result.data.avatarUrl);
      }
    };
    initializeProfile();
  }, [loadProfile]);


   // Drop-in replacement for the fetchRequest function in userDetail.tsx
// Always reads requester_name from user_profiles at request time,
// so it's never stale even if the user updated their name.

const fetchRequest = async (inviteCode: string) => {
  setJoinLoading(true);
  setJoinMessage("");
  setJoinMessageIsError(false);

  try {
    // 1. Auth check
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setJoinMessage("You must be logged in.");
      setJoinMessageIsError(true);
      return;
    }

    // 2. Guard: already a member of any family
    const { data: existingMembership } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (existingMembership) {
      setJoinMessage("You already belong to a family.");
      setJoinMessageIsError(true);
      return;
    }

    // 3. Resolve invite code → family
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (!family?.id) {
      setJoinMessage("Invalid invite code. Please check and try again.");
      setJoinMessageIsError(true);
      return;
    }

    // 4. Guard: pending request already exists for this family
    const { data: existingRequest } = await supabase
      .from("join_requests")
      .select("id")
      .eq("family_id", family.id)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (existingRequest) {
      setJoinMessage("You already sent a request to this family.");
      setJoinMessageIsError(true);
      return;
    }

    // 5. Always read the freshest name from user_profiles
    //    (never rely on local state which may be mid-edit or stale)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    const requesterName =
      profile?.full_name?.trim() ||   // ← always fresh from DB
      fullName.trim() ||               // ← fallback: current input field value
      "Unknown";

    // 6. Insert join request with the freshest name
    const { error: insertError } = await supabase
      .from("join_requests")
      .insert({
        family_id:      family.id,
        user_id:        authData.user.id,
        status:         "pending",
        mapped_member_id: null,
        requester_name: requesterName,
      });

    if (insertError) {
      setJoinMessage("Failed to send request. Please try again.");
      setJoinMessageIsError(true);
      return;
    }

    setJoinMessage("Join request sent! Waiting for family admin to approve.");
    setJoinMessageIsError(false);
    setInviteCode("");
  } finally {
    setJoinLoading(false);
  }
};

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
    if (d.length > 4) return setDob(d.slice(0, 2) + " / " + d.slice(2, 4) + " / " + d.slice(4));
    if (d.length > 2) return setDob(d.slice(0, 2) + " / " + d.slice(2));
    setDob(d);
  };

  const handleSave = async () => {
    if (!fullName || !dob) {
      Alert.alert("Missing Info", "Please enter at least your Name and Date of Birth.");
      return;
    }
    const result = await saveProfile({
      fullName,
      dob,
      gender,
      bloodGroup,
      height,
      weight,
      medicalNotes,
      avatarUrl: avatarUri,
    });
    if (!result.success) {
      Alert.alert("Database Error", result.error || "Failed to save profile");
      return;
    }
    router.replace("/(tabs)/onboarding/familyInfo");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="px-6 pt-3 pb-1">
        <TouchableOpacity activeOpacity={0.7} className="w-9 h-9 items-center justify-center">
          <ArrowLeft size={20} color="#374151" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}
      >
        {/* Progress */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center">
            <Typography variant="body-small" color="secondary">Let's set up your profile · Step 1 of 3</Typography>
            <Typography variant="body-small" color="primary" className="font-bold">33%</Typography>
          </View>
          <View className="mt-2 rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#E5E7EB" }}>
            <View className="bg-primary rounded-full" style={{ width: "33%", height: 6 }} />
          </View>
        </View>

        {/* Heading */}
        <View className="mb-8">
          <Typography variant="h2" color="heading" className="mb-1">Tell Us About You</Typography>
          <Typography variant="body" color="secondary">This helps doctors and labs serve you better</Typography>
        </View>

        {/* Join a Family */}
        <Section>
          <View className="bg-white rounded-2xl px-4 py-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
            <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
              <Users size={18} color="#069594" strokeWidth={2} />
              <Typography variant="body" color="heading" className="font-bold">Join a Family</Typography>
            </View>
            <Input
              placeholder="Enter invite code (e.g., SHARMA-X7B9A)"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text);
                if (joinMessage) { setJoinMessage(""); setJoinMessageIsError(false); }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
      
            onPress={() => fetchRequest(inviteCode)}
              disabled={joinLoading || !inviteCode.trim()}
              activeOpacity={0.85}
              className="mt-3 rounded-2xl items-center justify-center"
              style={{ backgroundColor: joinLoading || !inviteCode.trim() ? "#D1FAF8" : "#069594", paddingVertical: 12 }}
            >
              <Typography variant="body-small" color="white" className="font-bold" style={{ letterSpacing: 0.5 }}>
                {joinLoading ? "Sending..." : "Send Join Request"}
              </Typography>
            </TouchableOpacity>
            {joinMessage ? (
              <Typography variant="body-small" color={joinMessageIsError ? "error" : "primary"} className="mt-2 text-center">
                {joinMessage}
              </Typography>
            ) : null}
          </View>
        </Section>

        {/* Existing Join Requests */}
        {joinRequestsLoading ? (
          <View className="mb-5"><Typography variant="body-small" color="secondary">Loading join requests...</Typography></View>
        ) : joinRequests.length > 0 ? (
          <View className="mb-5">
            <FieldLabel>Join Requests</FieldLabel>
            {joinRequests.map((req) => (
              <JoinRequestCard key={req.id} req={req} />
            ))}
          </View>
        ) : null}

        {/* Avatar */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={handleAvatarPick} activeOpacity={0.85} style={{ position: "relative" }}>
            <View style={{ width: 96, height: 96, borderRadius: 9999, borderWidth: 2, borderColor: "#069594", borderStyle: "dashed", backgroundColor: "#F5F7FA", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: 9999 }} />
              ) : (
                <Camera size={30} color="#069594" strokeWidth={1.8} />
              )}
            </View>
            <View className="absolute bg-primary rounded-full items-center justify-center" style={{ width: 22, height: 22, bottom: 2, right: 2, borderWidth: 2, borderColor: "#FFFFFF" }}>
              <Plus size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAvatarPick} activeOpacity={0.7} className="mt-3">
            <Typography variant="body-small" color="primary" className="font-bold text-center" style={{ letterSpacing: 1.3 }}>
              ADD YOUR PHOTO
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <Section>
          <FieldLabel>Full Name</FieldLabel>
          <Input placeholder="Enter name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        </Section>

        {/* Date of Birth */}
        <Section>
          <FieldLabel>Date of Birth</FieldLabel>
          <Input placeholder="DD / MM / YYYY" value={dob} onChangeText={formatDob} keyboardType="number-pad" maxLength={14} suffix={<CalendarDays size={20} color="#6B7280" strokeWidth={1.8} />} />
        </Section>

        {/* Gender */}
        <Section>
          <FieldLabel>Gender</FieldLabel>
          <View className="flex-row p-1 rounded-2xl" style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" }}>
            {GENDERS.map((g) => {
              const isActive = gender === g;
              return (
                <TouchableOpacity key={g} onPress={() => setGender(g)} activeOpacity={0.8} className="flex-1 items-center py-3 rounded-xl" style={isActive ? { backgroundColor: "#069594", shadowColor: "#069594", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 } : { backgroundColor: "transparent" }}>
                  <Typography variant="body-small" color={isActive ? "white" : "heading"} className={isActive ? "font-bold" : "font-medium"}>{g}</Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Blood Group */}
        <Section>
          <FieldLabel>Blood Group</FieldLabel>
          <TouchableOpacity onPress={() => setShowBloodPicker((v) => !v)} activeOpacity={0.85}>
            <Input placeholder="Select" value={bloodGroup} editable={false} pointerEvents="none" suffix={<ChevronDown size={18} color="#9CA3AF" strokeWidth={2} style={{ transform: [{ rotate: showBloodPicker ? "180deg" : "0deg" }] }} />} />
          </TouchableOpacity>
          {showBloodPicker && (
            <View className="bg-white rounded-2xl overflow-hidden mt-1" style={{ borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 6 }}>
              {BLOOD_GROUPS.map((bg, i) => (
                <TouchableOpacity key={bg} onPress={() => { setBloodGroup(bg); setShowBloodPicker(false); }} activeOpacity={0.7} style={{ paddingVertical: 11, paddingHorizontal: 16, backgroundColor: bloodGroup === bg ? "rgba(6,149,148,0.08)" : "#FFFFFF", borderBottomWidth: i < BLOOD_GROUPS.length - 1 ? 1 : 0, borderBottomColor: "#F3F4F6" }}>
                  <Typography variant="body-small" color={bloodGroup === bg ? "primary" : "default"} className={bloodGroup === bg ? "font-bold" : ""}>{bg}</Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Height + Weight */}
        <Section>
          <View className="flex-row" style={{ gap: 16 }}>
            <View className="flex-1">
              <FieldLabel>Height</FieldLabel>
              <Input placeholder="175" value={height} onChangeText={setHeight} keyboardType="numeric" maxLength={5} suffixText="cm" />
            </View>
            <View className="flex-1">
              <FieldLabel>Weight</FieldLabel>
              <Input placeholder="70" value={weight} onChangeText={setWeight} keyboardType="numeric" maxLength={5} suffixText="kg" />
            </View>
          </View>
        </Section>

        {/* Medical Notes */}
        <Section last>
          <FieldLabel>Known Allergies &amp; Chronic Illnesses</FieldLabel>
          <View className="bg-white rounded-2xl px-4" style={{ borderWidth: 1, borderColor: "#E5E7EB", minHeight: 96, paddingVertical: 10 }}>
            <TextInput value={medicalNotes} onChangeText={setMedicalNotes} placeholder="e.g. Penicillin allergy, Type 2 Diabetes..." placeholderTextColor="#9CA3AF" multiline style={{ minHeight: 76, textAlignVertical: "top", color: "#111827", fontSize: 14 }} />
          </View>
        </Section>

        <Button title={saving ? "Saving..." : "Save & Continue"} variant="primary" rounded="full" size="lg" className="w-full mt-10" disabled={saving} rightIcon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />} onPress={handleSave} />
        <View className="items-center mt-5">
          <TouchableOpacity activeOpacity={0.7}>
            <Typography variant="body" color="secondary">Skip for now</Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}