import { Input } from "@/components/inputs/input";
import {
  Gender,
  MemberFormData,
  useMemberProfile,
} from "@/hooks/useMemberProfile";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronDown,
  Phone,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Reusable in‑page picker modal ──────────────────────────────────────────

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.pickerBackdrop}>
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  item === selected && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    item === selected && styles.pickerOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
          />
          <TouchableOpacity onPress={onClose} style={styles.pickerCancel}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen component ──────────────────────────────────────────────────

export default function EditFamilyMember() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const router = useRouter();
  const { form, setForm, load, save, loading, saving, isDirty } =
    useMemberProfile(memberId);

  // Special health condition toggles (local state, not yet persisted – you can hook them later)
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasLiverCondition, setHasLiverCondition] = useState(false);
  const [hasPostSurgery, setHasPostSurgery] = useState(false);
  const [isNewborn, setIsNewborn] = useState(false);
  const [trimester, setTrimester] = useState("2nd Trimester (Week 14-26)");

  // Picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState("");
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerCallback, setPickerCallback] = useState<(val: string) => void>(
    () => {}
  );

  useEffect(() => {
    load();
  }, [load]);

  // ─── Helpers ───────────────────────────────────────────────────────────

  const update = (key: keyof MemberFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const removeAllergy = (item: string) =>
    update("allergies", form.allergies.filter((a) => a !== item));

  const removeCondition = (item: string) =>
    update("conditions", form.conditions.filter((c) => c !== item));

  const addAllergy = () => {
    Alert.prompt("Add Allergy", "Enter the allergy name", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add",
        onPress: (val?: string) =>
          val && update("allergies", [...form.allergies, val.trim()]),
      },
    ]);
  };

  const addCondition = () => {
    Alert.prompt("Add Condition", "Enter condition", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add",
        onPress: (val?: string) =>
          val && update("conditions", [...form.conditions, val.trim()]),
      },
    ]);
  };

  // Universal picker opener
  const openPicker = (
    title: string,
    options: string[],
    callback: (val: string) => void
  ) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerCallback(() => callback);
    setPickerVisible(true);
  };

  // Specific pickers
  const showRelationPicker = () => {
    openPicker("Relation", ["Self", "Spouse", "Child", "Parent", "Sibling", "Other"], (val) =>
      update("relation", val)
    );
  };

  const showBloodGroupPicker = () => {
    openPicker("Blood Group", ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], (val) =>
      update("bloodGroup", val)
    );
  };

  const showTrimesterPicker = () => {
    openPicker("Trimester", [
      "1st Trimester (Week 1-13)",
      "2nd Trimester (Week 14-26)",
      "3rd Trimester (Week 27-40)",
    ], setTrimester);
  };

  const handleSave = async () => {
    try {
      await save();
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRemove = async () => {
    Alert.alert(
      "Remove Member",
      "This action will archive the member. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("family_memberships")
              .update({ status: "removed" })
              .eq("profile_id", memberId);
            if (error) {
              Alert.alert("Error", error.message);
              return;
            }
            router.back();
          },
        },
      ]
    );
  };

  // Current selected item for picker highlight
  const currentPickerSelected = useMemo(() => {
    if (pickerTitle === "Relation") return form.relation;
    if (pickerTitle === "Blood Group") return form.bloodGroup;
    if (pickerTitle === "Trimester") return trimester;
    return undefined;
  }, [pickerTitle, form.relation, form.bloodGroup, trimester]);

  // ─── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#069594" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={20} color="#334155" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Member</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isDirty || saving}
          style={styles.headerBtn}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#069594" />
          ) : (
            <Text style={[styles.saveText, isDirty && styles.saveTextActive]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{getInitials(form.fullName)}</Text>
            </View>
            <View style={styles.avatarOverlay}>
              <Camera size={14} color="#FFFFFF" strokeWidth={1.8} />
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 10 }}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>BASIC INFO</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <Input
              value={form.fullName}
              onChangeText={(v) => update("fullName", v)}
              placeholder="Full name"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                value={form.dob}
                onChangeText={(v) => update("dob", v)}
                placeholder="DD / MM / YYYY"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.inputIcon}>
                <CalendarDays size={16} color="#6E7979" strokeWidth={1.8} />
              </View>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>GENDER</Text>
            <View style={styles.segmented}>
              {(["Male", "Female", "Other"] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => update("gender", g)}
                  activeOpacity={0.8}
                  style={[
                    styles.segmentBtn,
                    form.gender === g && styles.segmentBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      form.gender === g && styles.segmentTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Relation + Blood Group */}
          <View style={styles.row}>
            <View style={[styles.fieldWrap, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.fieldLabel}>RELATION</Text>
              <TouchableOpacity
                onPress={showRelationPicker}
                style={styles.dropdown}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>
                  {form.relation || "Select"}
                </Text>
                <ChevronDown size={16} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>BLOOD GROUP</Text>
              <TouchableOpacity
                onPress={showBloodGroupPicker}
                style={styles.dropdown}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>
                  {form.bloodGroup || "Select"}
                </Text>
                <ChevronDown size={16} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Health Info Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>HEALTH INFO</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>KNOWN ALLERGIES</Text>
            <View style={styles.tagContainer}>
              {form.allergies.map((a) => (
                <View key={a} style={styles.tag}>
                  <Text style={styles.tagText}>{a}</Text>
                  <TouchableOpacity
                    onPress={() => removeAllergy(a)}
                    style={styles.tagRemove}
                  >
                    <Text style={styles.tagRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={addAllergy} style={styles.addTagBtn}>
                <Text style={styles.addTagText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CHRONIC CONDITIONS</Text>
            <View style={styles.tagContainer}>
              {form.conditions.map((c) => (
                <View key={c} style={styles.tag}>
                  <Text style={styles.tagText}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => removeCondition(c)}
                    style={styles.tagRemove}
                  >
                    <Text style={styles.tagRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={addCondition} style={styles.addTagBtn}>
                <Text style={styles.addTagText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Height + Weight */}
          <View style={styles.row}>
            <View style={[styles.fieldWrap, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.fieldLabel}>HEIGHT (CM)</Text>
              <Input
                value={form.height}
                onChangeText={(v) => update("height", v)}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
              <Input
                value={form.weight}
                onChangeText={(v) => update("weight", v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Special Health Conditions Card */}
        <View style={styles.specialCard}>
          <Text style={styles.specialTitle}>Special Health Conditions</Text>
          <Text style={styles.specialSubtitle}>
            Check all that apply to receive personalized monitoring and alerts.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Pregnancy</Text>
            <Switch
              value={isPregnant}
              onValueChange={setIsPregnant}
              trackColor={{ false: "#E5E7EB", true: "#069594" }}
              thumbColor="#FFFFFF"
            />
          </View>
          {isPregnant && (
            <View style={styles.trimesterBox}>
              <Text style={styles.trimesterLabel}>CURRENT TRIMESTER</Text>
              <TouchableOpacity
                onPress={showTrimesterPicker}
                style={styles.trimesterDropdown}
                activeOpacity={0.8}
              >
                <Text style={styles.trimesterText}>{trimester}</Text>
                <ChevronDown size={16} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Diabetes</Text>
            <Switch
              value={hasDiabetes}
              onValueChange={setHasDiabetes}
              trackColor={{ false: "#E5E7EB", true: "#069594" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Liver Condition</Text>
            <Switch
              value={hasLiverCondition}
              onValueChange={setHasLiverCondition}
              trackColor={{ false: "#E5E7EB", true: "#069594" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Post-Surgery / Wound Care</Text>
            <Switch
              value={hasPostSurgery}
              onValueChange={setHasPostSurgery}
              trackColor={{ false: "#E5E7EB", true: "#069594" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Newborn</Text>
            <Switch
              value={isNewborn}
              onValueChange={setIsNewborn}
              trackColor={{ false: "#E5E7EB", true: "#069594" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Emergency Contact Card (placeholders for now) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>EMERGENCY CONTACT</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CONTACT NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={[styles.fieldWrap, { marginBottom: 0 }]}>
            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
              <View style={styles.inputIcon}>
                <Phone size={16} color="#6E7979" strokeWidth={1.8} />
              </View>
            </View>
          </View>
        </View>

        {/* Remove Member */}
        <TouchableOpacity
          onPress={handleRemove}
          style={styles.removeBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.removeBtnText}>Remove This Member</Text>
        </TouchableOpacity>
        <Text style={styles.dangerNote}>
          All health history and associated vitals for this member will be
          permanently archived.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Picker modal – rendered outside of ScrollView to avoid clipping */}
      <PickerModal
        visible={pickerVisible}
        title={pickerTitle}
        options={pickerOptions}
        selected={currentPickerSelected}
        onSelect={pickerCallback}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function getInitials(name: string) {
  return (name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0,
  },
  headerBtn: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 17,
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  saveText: { color: "#CBD5E1", fontSize: 16, fontWeight: "600" },
  saveTextActive: { color: "#069594", fontSize: 16, fontWeight: "600" },

  scroll: { paddingHorizontal: 16, paddingTop: 20 },

  /* Avatar */
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitials: { fontWeight: "700", color: "#FFFFFF", fontSize: 24 },
  avatarOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#069594",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F5F7FA",
  },
  changePhotoText: { color: "#069594", fontWeight: "600", fontSize: 15 },

  /* Section card */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    fontWeight: "700",
    color: "#9CA3AF",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  /* Fields */
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.6,
    color: "#374151",
    marginBottom: 7,
  },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#111827",
  },
  inputWithIcon: { position: "relative" },
  inputIcon: { position: "absolute", right: 14, top: 15 },

  /* Gender segmented */
  segmented: { flexDirection: "row" },
  segmentBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  segmentBtnActive: { backgroundColor: "#069594" },
  segmentText: { color: "#374151", fontSize: 14, fontWeight: "500" },
  segmentTextActive: { color: "#FFFFFF", fontWeight: "600" },

  /* Dropdown */
  row: { flexDirection: "row" },
  dropdown: {
    height: 46,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  dropdownText: { color: "#111827", fontSize: 15 },

  /* Tags */
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F6F6",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tagText: { marginRight: 6, color: "#0F766E", fontSize: 13, fontWeight: "600" },
  tagRemove: { padding: 2 },
  tagRemoveText: { color: "#0F766E", fontSize: 12, fontWeight: "700" },
  addTagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  addTagText: { color: "#374151", fontSize: 13, fontWeight: "600" },

  /* Special Health Conditions */
  specialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  specialTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: "#111827",
    marginBottom: 6,
  },
  specialSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  toggleLabel: { fontSize: 15, fontWeight: "500", color: "#111827" },
  divider: { height: 1, backgroundColor: "#F3F4F6" },

  /* Trimester box */
  trimesterBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#069594",
    paddingLeft: 12,
    marginBottom: 10,
    marginTop: 4,
  },
  trimesterLabel: {
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.6,
    color: "#6B7280",
    marginBottom: 6,
  },
  trimesterDropdown: {
    height: 44,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  trimesterText: { color: "#111827", fontSize: 14 },

  /* Remove / Danger */
  removeBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
    marginTop: 12,
  },
  removeBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  dangerNote: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 4,
  },

  /* Picker modal styles */
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "70%",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginVertical: 16,
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: "#E6F6F6",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#111827",
  },
  pickerOptionTextSelected: {
    color: "#069594",
    fontWeight: "600",
  },
  pickerSeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  pickerCancel: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});