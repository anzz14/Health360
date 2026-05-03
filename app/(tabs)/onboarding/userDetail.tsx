import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
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
  X
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
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

// ─── Disease / Condition Enum ─────────────────────────────────────────────────
// 20 most common chronic conditions grouped by category

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
  // Metabolic
  { id: "type1_diabetes", label: "Type 1 Diabetes", category: "Metabolic" },
  { id: "type2_diabetes", label: "Type 2 Diabetes", category: "Metabolic" },
  { id: "hypothyroidism", label: "Hypothyroidism", category: "Metabolic" },
  { id: "obesity", label: "Obesity", category: "Metabolic" },
  // Cardiovascular
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
  // Respiratory
  { id: "asthma", label: "Asthma", category: "Respiratory" },
  { id: "copd", label: "COPD", category: "Respiratory" },
  { id: "sleep_apnea", label: "Sleep Apnea", category: "Respiratory" },
  // Neurological
  { id: "epilepsy", label: "Epilepsy", category: "Neurological" },
  { id: "migraine", label: "Chronic Migraine", category: "Neurological" },
  { id: "parkinsons", label: "Parkinson's Disease", category: "Neurological" },
  // Digestive
  { id: "ibs", label: "IBS", category: "Digestive" },
  { id: "gerd", label: "GERD / Acid Reflux", category: "Digestive" },
  { id: "crohns", label: "Crohn's Disease", category: "Digestive" },
  // Musculoskeletal
  { id: "arthritis", label: "Arthritis", category: "Musculoskeletal" },
  { id: "osteoporosis", label: "Osteoporosis", category: "Musculoskeletal" },
  // Immune
  { id: "lupus", label: "Lupus", category: "Immune" },
  // Mental Health
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

// ─── Multi-Select Condition Picker ────────────────────────────────────────────

interface ConditionPickerProps {
  selected: string[]; // array of ids or custom strings
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

  // Group by category for display
  const grouped = filtered.reduce<
    Partial<Record<ConditionCategory, Condition[]>>
  >((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category]!.push(c);
    return acc;
  }, {});

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

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
      {/* ── Trigger / Selected pills ── */}
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

      {/* ── Full-screen picker modal ── */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FC" }}>
          {/* Modal header */}
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

          {/* Subtitle */}
          <View
            style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}
          >
            <Typography variant="body-small" color="secondary">
              Select all that apply. You can also type a condition not listed.
            </Typography>
          </View>

          {/* Search */}
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
            {/* ── Custom / type-your-own ── */}
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

            {/* ── Grouped condition list ── */}
            {(Object.keys(grouped) as ConditionCategory[]).map((cat) => (
              <View key={cat} style={{ marginBottom: 16 }}>
                {/* Category label */}
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

                {/* Condition rows */}
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
                        {/* Checkbox */}
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

            {/* Empty search state */}
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

          {/* Confirm button */}
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

interface JoinRequest {
  id: string;
  family_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  families?: { name: string };
}

const JoinRequestCard = ({ req }: { req: JoinRequest }) => (
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileDetails() {
  const router = useRouter();
  const { loadProfile, saveProfile, saving } = useUserProfile();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [conditions, setConditions] = useState<string[]>([]); // ids + custom strings
  const [medicalNotes, setMedicalNotes] = useState(""); // free-text extra notes
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showBloodPicker, setShowBloodPicker] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinMessageIsError, setJoinMessageIsError] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);

  // Load profile on mount
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
        setAvatarUri(result.data.avatarUrl);
        // medical_notes stores a JSON envelope: { conditions: string[], notes: string }
        // Legacy plain-text rows are treated as notes with no conditions.
        const raw = result.data.medicalNotes ?? "";
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.conditions))
            setConditions(parsed.conditions);
          setMedicalNotes(typeof parsed.notes === "string" ? parsed.notes : "");
        } catch {
          // Not JSON → old plain-text row, put it in the notes box
          setMedicalNotes(raw);
          setConditions([]);
        }
      }
    };
    init();
  }, [loadProfile]);

  // ── Join request handler ─────────────────────────────────────────────────

  const fetchRequest = async (code: string) => {
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
      const { data: existing } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (existing) {
        setJoinMessage("You already belong to a family.");
        setJoinMessageIsError(true);
        return;
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
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (existingReq) {
        setJoinMessage("You already sent a request to this family.");
        setJoinMessageIsError(true);
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", authData.user.id)
        .maybeSingle();
      const requesterName =
        profile?.full_name?.trim() || fullName.trim() || "Unknown";
      const { error } = await supabase.from("join_requests").insert({
        family_id: family.id,
        user_id: authData.user.id,
        status: "pending",
        mapped_member_id: null,
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

  // ── Avatar picker ────────────────────────────────────────────────────────

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

  // ── Date of birth formatter ──────────────────────────────────────────────

  const formatDob = (text: string) => {
    const d = text.replace(/\D/g, "").slice(0, 8);
    if (d.length > 4)
      return setDob(`${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`);
    if (d.length > 2) return setDob(`${d.slice(0, 2)} / ${d.slice(2)}`);
    setDob(d);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!fullName || !dob) {
      Alert.alert(
        "Missing Info",
        "Please enter at least your Name and Date of Birth.",
      );
      return;
    }
    // Serialize conditions (IDs + custom strings) and free-text notes into
    // a single JSON envelope stored in medical_notes.
    // On load we JSON.parse this back, so conditions and notes stay separate.
    const serialized = JSON.stringify({
      conditions: conditions, // keep raw IDs/custom strings — labels resolved on display
      notes: medicalNotes.trim(),
    });

    const result = await saveProfile({
      fullName,
      dob,
      gender,
      bloodGroup,
      height,
      weight,
      medicalNotes: serialized,
      avatarUrl: avatarUri,
    });
    if (!result.success) {
      Alert.alert("Database Error", result.error || "Failed to save profile");
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
        {/* ── Progress ── */}
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

        {/* ── Heading ── */}
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
              onPress={() => fetchRequest(inviteCode)}
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

        {/* ── Pending join requests ── */}
        {joinRequests.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <FieldLabel>Join Requests</FieldLabel>
            {joinRequests.map((req) => (
              <JoinRequestCard key={req.id} req={req} />
            ))}
          </View>
        )}

        {/* ── Avatar ── */}
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
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAvatarPick}
            activeOpacity={0.7}
            style={{ marginTop: 12 }}
          >
            <Typography
              variant="body-small"
              color="primary"
              style={{
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 1.3,
              }}
            >
              ADD YOUR PHOTO
            </Typography>
          </TouchableOpacity>
        </View>

        {/* ── Full Name ── */}
        <Section>
          <FieldLabel>Full Name</FieldLabel>
          <Input
            placeholder="Enter name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </Section>

        {/* ── Date of Birth ── */}
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

        {/* ── Gender ── */}
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

        {/* ── Blood Group ── */}
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

        {/* ── Height + Weight ── */}
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

        {/* ── Chronic Conditions — multi-select ── */}
        <Section>
          <FieldLabel>Known Allergies &amp; Chronic Conditions</FieldLabel>
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

        {/* ── Additional notes (optional) ── */}
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

<<<<<<< HEAD
<Link href={'/(tabs)/onboarding/familyInfo'}>
        <Button title={saving ? "Saving..." : "Save & Continue"} variant="primary" rounded="full" size="lg" className="w-full mt-10" disabled={saving} rightIcon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />} onPress={handleSave} />    
        </Link>
=======
        {/* ── CTA ── */}
        <Button
          title={saving ? "Saving..." : "Save & Continue"}
          variant="primary"
          rounded="full"
          size="lg"
          style={{ width: "100%", marginTop: 40 }}
          disabled={saving}
          rightIcon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={handleSave}
        />
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <TouchableOpacity activeOpacity={0.7}>
            <Typography variant="body" color="secondary">
              Skip for now
            </Typography>
          </TouchableOpacity>
        </View>
>>>>>>> c2de038cc344cc7f0559012f7cce5c82e84996fc
      </ScrollView>
    </SafeAreaView>
  );
}
