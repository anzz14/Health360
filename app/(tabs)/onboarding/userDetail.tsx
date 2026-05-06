import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import { useAvatarUpload } from "@/hooks/use-avatar-upload"; // ← new hook
import { useUserProfile } from "@/hooks/use-user-profile";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = "Male" | "Female" | "Other";
const GENDERS: Gender[] = ["Male", "Female", "Other"];

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number] | "";

// ─── Conditions ───────────────────────────────────────────────────────────────

export type ConditionCategory =
  | "Metabolic"
  | "Cardiovascular"
  | "Respiratory"
  | "Neurological"
  | "Digestive"
  | "Musculoskeletal"
  | "Immune"
  | "Mental Health";

export interface Condition {
  id: string;
  label: string;
  category: ConditionCategory;
}

export const COMMON_CONDITIONS: Condition[] = [
  { id: "type1_diabetes", label: "Type 1 Diabetes", category: "Metabolic" },
  { id: "type2_diabetes", label: "Type 2 Diabetes", category: "Metabolic" },
  { id: "hypothyroidism", label: "Hypothyroidism", category: "Metabolic" },
  { id: "obesity", label: "Obesity", category: "Metabolic" },
  { id: "hypertension", label: "Hypertension", category: "Cardiovascular" },
  {
    id: "heart_disease",
    label: "Coronary Heart Disease",
    category: "Cardiovascular",
  },
  {
    id: "high_cholesterol",
    label: "High Cholesterol",
    category: "Cardiovascular",
  },
  { id: "asthma", label: "Asthma", category: "Respiratory" },
  { id: "copd", label: "COPD", category: "Respiratory" },
  { id: "sleep_apnea", label: "Sleep Apnea", category: "Respiratory" },
  { id: "epilepsy", label: "Epilepsy", category: "Neurological" },
  { id: "migraine", label: "Chronic Migraine", category: "Neurological" },
  { id: "parkinsons", label: "Parkinson's Disease", category: "Neurological" },
  { id: "ibs", label: "IBS", category: "Digestive" },
  { id: "gerd", label: "GERD / Acid Reflux", category: "Digestive" },
  { id: "crohns", label: "Crohn's Disease", category: "Digestive" },
  { id: "arthritis", label: "Arthritis", category: "Musculoskeletal" },
  { id: "osteoporosis", label: "Osteoporosis", category: "Musculoskeletal" },
  { id: "lupus", label: "Lupus", category: "Immune" },
  { id: "depression", label: "Depression", category: "Mental Health" },
  { id: "anxiety", label: "Anxiety Disorder", category: "Mental Health" },
];

const CATEGORY_COLORS: Record<ConditionCategory, { bg: string; text: string }> =
  {
    Metabolic: { bg: "rgba(6,149,148,0.10)", text: "#069594" },
    Cardiovascular: { bg: "rgba(186,26,26,0.10)", text: "#BA1A1A" },
    Respiratory: { bg: "rgba(76,86,175,0.10)", text: "#4C56AF" },
    Neurological: { bg: "rgba(139,72,35,0.10)", text: "#8B4823" },
    Digestive: { bg: "rgba(234,179,8,0.12)", text: "#92660A" },
    Musculoskeletal: { bg: "rgba(107,114,128,0.12)", text: "#4B5563" },
    Immune: { bg: "rgba(217,70,239,0.10)", text: "#9333EA" },
    "Mental Health": { bg: "rgba(59,130,246,0.10)", text: "#2563EB" },
  };

// ─── Condition Picker ─────────────────────────────────────────────────────────

interface ConditionPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

const ConditionPicker: React.FC<ConditionPickerProps> = ({
  selected,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");

  const filtered = COMMON_CONDITIONS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce<
    Partial<Record<ConditionCategory, Condition[]>>
  >((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category]!.push(c);
    return acc;
  }, {});

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || selected.includes(trimmed)) {
      setCustomInput("");
      return;
    }
    onChange([...selected, trimmed]);
    setCustomInput("");
  };

  const removeItem = (id: string) => onChange(selected.filter((s) => s !== id));
  const getLabel = (id: string) =>
    COMMON_CONDITIONS.find((c) => c.id === id)?.label ?? id;
  const getCategory = (id: string): ConditionCategory | null =>
    COMMON_CONDITIONS.find((c) => c.id === id)?.category ?? null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
        style={{
          minHeight: 52,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
        }}
      >
        {selected.length === 0 ? (
          <Typography variant="body-small" color="secondary">
            Select conditions or type your own…
          </Typography>
        ) : (
          selected.map((id) => {
            const cat = getCategory(id);
            const colors = cat
              ? CATEGORY_COLORS[cat]
              : { bg: "rgba(107,114,128,0.12)", text: "#4B5563" };
            return (
              <View
                key={id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.bg,
                  borderRadius: 9999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  gap: 5,
                }}
              >
                <Typography
                  variant="body-small"
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {getLabel(id)}
                </Typography>
                <TouchableOpacity
                  onPress={() => removeItem(id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <X size={10} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ marginLeft: "auto" }}>
          <ChevronDown size={16} color="#9CA3AF" strokeWidth={2} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FC" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              backgroundColor: "#FFFFFF",
              borderBottomWidth: 1,
              borderBottomColor: "#F2F4F7",
            }}
          >
            <Typography variant="h3" color="heading">
              Conditions & Illnesses
            </Typography>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View
            style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}
          >
            <Typography variant="body-small" color="secondary">
              Select all that apply. You can also type a condition not listed.
            </Typography>
          </View>

          <View
            style={{
              marginHorizontal: 20,
              marginVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              paddingHorizontal: 14,
              height: 46,
              gap: 10,
            }}
          >
            <Search size={16} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search conditions…"
              placeholderTextColor="#9CA3AF"
              style={{ flex: 1, fontSize: 14, color: "#1F2937" }}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={14} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Typography
                variant="body-small"
                color="secondary"
                style={{ marginBottom: 10, fontWeight: "600" }}
              >
                Not listed? Type it yourself:
              </Typography>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholder="e.g. Sickle Cell Anaemia…"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: "#1F2937",
                    backgroundColor: "#F9FAFB",
                  }}
                  onSubmitEditing={addCustom}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={addCustom}
                  disabled={!customInput.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: customInput.trim() ? "#069594" : "#E5E7EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {(Object.keys(grouped) as ConditionCategory[]).map((cat) => (
              <View key={cat} style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: CATEGORY_COLORS[cat].text,
                    }}
                  />
                  <Typography
                    variant="body-small"
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 1,
                      color: CATEGORY_COLORS[cat].text,
                      textTransform: "uppercase",
                    }}
                  >
                    {cat}
                  </Typography>
                </View>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "#F2F4F7",
                    overflow: "hidden",
                  }}
                >
                  {grouped[cat]!.map((condition, idx) => {
                    const isSelected = selected.includes(condition.id);
                    const isLast = idx === grouped[cat]!.length - 1;
                    const colors = CATEGORY_COLORS[condition.category];
                    return (
                      <TouchableOpacity
                        key={condition.id}
                        onPress={() => toggle(condition.id)}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          backgroundColor: isSelected ? colors.bg : "#FFFFFF",
                          borderBottomWidth: isLast ? 0 : 1,
                          borderBottomColor: "#F2F4F7",
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            backgroundColor: isSelected
                              ? colors.text
                              : "#F3F4F6",
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: "#E5E7EB",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && (
                            <Check size={13} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>
                        <Typography
                          variant="body-small"
                          style={{
                            fontSize: 14,
                            fontWeight: isSelected ? "700" : "500",
                            color: isSelected ? colors.text : "#374151",
                            flex: 1,
                          }}
                        >
                          {condition.label}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {filtered.length === 0 && search.length > 0 && (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Typography
                  variant="body-small"
                  color="secondary"
                  style={{ textAlign: "center" }}
                >
                  No results for "{search}". Use the field above to add it
                  manually.
                </Typography>
              </View>
            )}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: Platform.OS === "ios" ? 24 : 20,
              paddingTop: 12,
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderTopColor: "#F2F4F7",
            }}
          >
            <TouchableOpacity
              onPress={() => setVisible(false)}
              activeOpacity={0.88}
              style={{
                height: 52,
                borderRadius: 9999,
                backgroundColor: "#069594",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="button"
                color="white"
                style={{ fontWeight: "700", fontSize: 15 }}
              >
                Done · {selected.length} selected
              </Typography>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// ─── Join Request Card ────────────────────────────────────────────────────────

interface JoinRequestDisplay {
  id: string;
  family_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  families?: { name: string };
}

const JoinRequestCard = ({ req }: { req: JoinRequestDisplay }) => (
  <View
    style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    }}
  >
    <Typography
      variant="body-small"
      color="heading"
      style={{ fontWeight: "700" }}
    >
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

// ─── Small helpers ────────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: string }) => (
  <Typography
    variant="body"
    color="heading"
    style={{
      fontWeight: "700",
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.4,
    }}
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
}) => <View style={{ marginBottom: last ? 0 : 20 }}>{children}</View>;

// ─── Avatar Widget ─────────────────────────────────────────────────────────────
// Extracted so any other screen can use the same UI with the hook.

interface AvatarWidgetProps {
  avatarUrl: string | null;
  uploading: boolean;
  onPress: () => void;
}

const AvatarWidget: React.FC<AvatarWidgetProps> = ({
  avatarUrl,
  uploading,
  onPress,
}) => (
  <View style={{ alignItems: "center", marginBottom: 32 }}>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={uploading}
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
        {uploading ? (
          // Show spinner while uploading
          <ActivityIndicator size="large" color="#069594" />
        ) : avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 96, height: 96, borderRadius: 9999 }}
          />
        ) : (
          <Camera size={30} color="#069594" strokeWidth={1.8} />
        )}
      </View>

      {/* Green + badge — hidden while uploading */}
      {!uploading && (
        <View
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            bottom: 2,
            right: 2,
            borderRadius: 9999,
            backgroundColor: "#069594",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#FFFFFF",
          }}
        >
          <Plus size={12} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={uploading}
      style={{ marginTop: 12 }}
    >
      <Typography
        variant="body-small"
        color="primary"
        style={{ fontWeight: "700", textAlign: "center", letterSpacing: 1.3 }}
      >
        {uploading ? "UPLOADING…" : "ADD YOUR PHOTO"}
      </Typography>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileDetails() {
  const router = useRouter();
  const { loadProfile, saveProfile, saving } = useUserProfile();

  // ── Avatar — now powered by useAvatarUpload ───────────────────────────────
  const {
    avatarUrl,
    uploading: avatarUploading,
    error: avatarError,
    pickAndUpload,
    setAvatarUrl,
  } = useAvatarUpload();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [showBloodPicker, setShowBloodPicker] = useState(false);

  // Join-a-family state
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinMessageIsError, setJoinMessageIsError] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequestDisplay[]>([]);

  // ── Load existing profile ─────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const result = await loadProfile();
      if (result.success && result.data) {
        setFullName(result.data.fullName);
        setDob(result.data.dob);
        setGender(result.data.gender);
        setBloodGroup(result.data.bloodGroup);
        setHeight(result.data.height);
        setWeight(result.data.weight);
        setConditions(result.data.conditions);
        setMedicalNotes(result.data.medicalNotes);
        // ← Load existing avatar URL from Supabase Storage into the hook
        if (result.data.avatarUrl) setAvatarUrl(result.data.avatarUrl);
      }
    };
    init();
  }, [loadProfile]);

  // Show avatar error as an alert
  useEffect(() => {
    if (avatarError) Alert.alert("Photo Error", avatarError);
  }, [avatarError]);

  // ── Join request handler ──────────────────────────────────────────────────

  const handleJoinRequest = async (code: string) => {
    setJoinLoading(true);
    setJoinMessage("");
    setJoinMessageIsError(false);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setJoinMessage("You must be logged in.");
        setJoinMessageIsError(true);
        return;
      }

      const authUserId = authData.user.id;

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (myProfile?.id) {
        const { data: existingMembership } = await supabase
          .from("family_memberships")
          .select("id")
          .eq("profile_id", myProfile.id)
          .eq("status", "active")
          .maybeSingle();

        if (existingMembership) {
          setJoinMessage("You already belong to a family.");
          setJoinMessageIsError(true);
          return;
        }
      }

      const { data: family } = await supabase
        .from("families")
        .select("id")
        .eq("invite_code", code.trim().toUpperCase())
        .maybeSingle();

      if (!family?.id) {
        setJoinMessage("Invalid invite code. Please check and try again.");
        setJoinMessageIsError(true);
        return;
      }

      const { data: existingReq } = await supabase
        .from("join_requests")
        .select("id")
        .eq("family_id", family.id)
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (existingReq) {
        setJoinMessage("You already sent a request to this family.");
        setJoinMessageIsError(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      const requesterName =
        profile?.full_name?.trim() || fullName.trim() || "Unknown";

      const { error } = await supabase.from("join_requests").insert({
        family_id: family.id,
        auth_user_id: authUserId,
        status: "pending",
        mapped_profile_id: null,
        requester_name: requesterName,
      });

      if (error) {
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

  // ── DOB formatter ─────────────────────────────────────────────────────────

  const formatDob = (text: string) => {
    const d = text.replace(/\D/g, "").slice(0, 8);
    if (d.length > 4)
      return setDob(`${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`);
    if (d.length > 2) return setDob(`${d.slice(0, 2)} / ${d.slice(2)}`);
    setDob(d);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!fullName || !dob) {
      Alert.alert(
        "Missing Info",
        "Please enter at least your Name and Date of Birth.",
      );
      return;
    }

    const result = await saveProfile({
      fullName,
      dob,
      gender,
      bloodGroup,
      height,
      weight,
      conditions,
      medicalNotes,
      avatarUrl, // ← public Supabase Storage URL (or null)
    });

    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to save profile");
      return;
    }

    router.replace("/(tabs)/onboarding/familyInfo");
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
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
        {/* Progress bar */}
        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body-small" color="secondary">
              Let's set up your profile · Step 1 of 3
            </Typography>
            <Typography
              variant="body-small"
              color="primary"
              style={{ fontWeight: "700" }}
            >
              33%
            </Typography>
          </View>
          <View
            style={{
              marginTop: 8,
              borderRadius: 9999,
              overflow: "hidden",
              height: 6,
              backgroundColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                width: "33%",
                height: 6,
                backgroundColor: "#069594",
                borderRadius: 9999,
              }}
            />
          </View>
        </View>

        {/* Heading */}
        <View style={{ marginBottom: 32 }}>
          <Typography variant="h2" color="heading" style={{ marginBottom: 4 }}>
            Tell Us About You
          </Typography>
          <Typography variant="body" color="secondary">
            This helps doctors and labs serve you better
          </Typography>
        </View>

        {/* ── Join a Family ── */}
        <Section>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
                gap: 8,
              }}
            >
              <Users size={18} color="#069594" strokeWidth={2} />
              <Typography
                variant="body"
                color="heading"
                style={{ fontWeight: "700" }}
              >
                Join a Family
              </Typography>
            </View>

            <Input
              placeholder="Enter invite code (e.g., SHARMA-X7B9A)"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text);
                if (joinMessage) {
                  setJoinMessage("");
                  setJoinMessageIsError(false);
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={() => handleJoinRequest(inviteCode)}
              disabled={joinLoading || !inviteCode.trim()}
              activeOpacity={0.85}
              style={{
                marginTop: 12,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                backgroundColor:
                  joinLoading || !inviteCode.trim() ? "#D1FAF8" : "#069594",
              }}
            >
              <Typography
                variant="body-small"
                color="white"
                style={{ fontWeight: "700", letterSpacing: 0.5 }}
              >
                {joinLoading ? "Sending..." : "Send Join Request"}
              </Typography>
            </TouchableOpacity>

            {joinMessage ? (
              <Typography
                variant="body-small"
                color={joinMessageIsError ? "error" : "primary"}
                style={{ marginTop: 8, textAlign: "center" }}
              >
                {joinMessage}
              </Typography>
            ) : null}
          </View>
        </Section>

        {/* Pending join requests */}
        {joinRequests.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <FieldLabel>Join Requests</FieldLabel>
            {joinRequests.map((req) => (
              <JoinRequestCard key={req.id} req={req} />
            ))}
          </View>
        )}

        {/* ── Avatar ── uses AvatarWidget + useAvatarUpload hook ── */}
        <AvatarWidget
          avatarUrl={avatarUrl}
          uploading={avatarUploading}
          onPress={pickAndUpload}
        />

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

        {/* Gender */}
        <Section>
          <FieldLabel>Gender</FieldLabel>
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              borderRadius: 16,
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {GENDERS.map((g) => {
              const active = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: active ? "#069594" : "transparent",
                    shadowColor: active ? "#069594" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: active ? 0.25 : 0,
                    shadowRadius: 4,
                    elevation: active ? 3 : 0,
                  }}
                >
                  <Typography
                    variant="body-small"
                    color={active ? "white" : "heading"}
                    style={{ fontWeight: active ? "700" : "500" }}
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
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                overflow: "hidden",
                marginTop: 4,
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
                    style={{ fontWeight: bloodGroup === bg ? "700" : "400" }}
                  >
                    {bg}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Height + Weight */}
        <Section>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
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

        {/* Chronic Conditions */}
        <Section>
          <FieldLabel>Known Allergies & Chronic Conditions</FieldLabel>
          <ConditionPicker selected={conditions} onChange={setConditions} />
          {conditions.length > 0 && (
            <Typography
              variant="body-small"
              color="secondary"
              style={{ marginTop: 6, marginLeft: 4 }}
            >
              {conditions.length} condition{conditions.length !== 1 ? "s" : ""}{" "}
              selected
            </Typography>
          )}
        </Section>

        {/* Additional notes */}
        <Section last>
          <FieldLabel>Additional Medical Notes (optional)</FieldLabel>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              minHeight: 88,
            }}
          >
            <TextInput
              value={medicalNotes}
              onChangeText={setMedicalNotes}
              placeholder="Any extra notes for your doctor…"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                minHeight: 68,
                textAlignVertical: "top",
                color: "#111827",
                fontSize: 14,
              }}
            />
          </View>
        </Section>

        <Button
          title={saving ? "Saving..." : "Save & Continue"}
          variant="primary"
          rounded="full"
          size="lg"
          style={{ width: "100%", marginTop: 40 }}
          disabled={saving || avatarUploading}
          rightIcon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
