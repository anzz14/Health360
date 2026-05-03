import {
    ArrowLeft,
    CalendarDays,
    Camera,
    ChevronDown,
    Phone,
    Plus,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleProp,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

// ─── Mock Initial State ───────────────────────────────────────────────────────

const RELATIONS = ["Self", "Spouse", "Child", "Parent", "Sibling", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const TRIMESTERS = [
  "1st Trimester (Week 1-13)",
  "2nd Trimester (Week 14-26)",
  "3rd Trimester (Week 27-40)",
];

const INITIAL = {
  fullName: "Eleanor Shellstrop",
  dob: "14 / 05 / 1982",
  gender: "Male",
  relation: "Spouse",
  bloodGroup: "O +ve",
  allergies: ["Peanuts", "Latex"],
  conditions: ["Asthma"],
  height: "168",
  weight: "62",
  pregnancy: true,
  trimester: "2nd Trimester (Week 14-26)",
  diabetes: false,
  liverCondition: false,
  postSurgery: false,
  newborn: false,
  contactName: "Chidi Anagonye",
  contactPhone: "+1 (555) 012-3456",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldLabel = ({ label }: { label: string }) => (
  <Text style={styles.fieldLabel}>{label}</Text>
);

const InputField = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
}) => (
  <TextInput
    style={styles.input}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#9CA3AF"
    keyboardType={(keyboardType as any) || "default"}
  />
);

const SectionCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | undefined;
}) => <View style={[styles.sectionCard, style]}>{children}</View>;

const SectionHeading = ({ label }: { label: string }) => (
  <Text style={styles.sectionHeading}>{label}</Text>
);

const ToggleRow = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#E6E8EB", true: "#069594" }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E6E8EB"
      style={
        Platform.OS === "android"
          ? { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }
          : {}
      }
    />
  </View>
);

const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
    <TouchableOpacity
      onPress={onRemove}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <X size={10} color="#069594" strokeWidth={2.5} />
    </TouchableOpacity>
  </View>
);

const AddTag = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.addTagBtn}
    activeOpacity={0.7}
  >
    <Plus size={10} color="#069594" strokeWidth={2.5} />
    <Text style={styles.addTagText}>Add</Text>
  </TouchableOpacity>
);

const DropdownField = ({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.dropdown}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.dropdownText}>{value}</Text>
    <ChevronDown size={16} color="#6B7280" strokeWidth={1.8} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditFamilyMember({
  onBack,
  onSave,
}: {
  onBack?: () => void;
  onSave?: (form: any) => void;
}) {
  const [form, setForm] = useState(INITIAL as any);
  const [isDirty, setIsDirty] = useState(false);

  const update = (key: string, val: any) => {
    setForm((f: any) => ({ ...f, [key]: val }));
    setIsDirty(true);
  };

  const removeAllergy = (item: string) =>
    update(
      "allergies",
      (form.allergies as string[]).filter((a) => a !== item),
    );

  const removeCondition = (item: string) =>
    update(
      "conditions",
      (form.conditions as string[]).filter((c) => c !== item),
    );

  const handleSave = () => {
    if (!isDirty) return;
    onSave?.(form);
  };

  const handleRemove = () => {
    Alert.alert(
      "Remove Member",
      "All health history and associated vitals for this member will be permanently archived. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => console.log("Removed"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.headerBtn}
        >
          <ArrowLeft size={20} color="#334155" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Member</Text>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={isDirty ? 0.7 : 1}
          style={styles.headerBtn}
        >
          <Text style={[styles.saveText, isDirty && styles.saveTextActive]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {/* Avatar image / fallback */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>ES</Text>
            </View>
            {/* Dark overlay + camera icon */}
            <View style={styles.avatarOverlay}>
              <Camera size={20} color="#FFFFFF" strokeWidth={1.8} />
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 12 }}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── Basic Info ── */}
        <SectionCard>
          <SectionHeading label="BASIC INFO" />

          <View style={styles.fieldWrap}>
            <FieldLabel label="FULL NAME" />
            <InputField
              value={form.fullName}
              onChangeText={(v: string) => update("fullName", v)}
              placeholder="Full name"
            />
          </View>

          <View style={styles.fieldWrap}>
            <FieldLabel label="DATE OF BIRTH" />
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                value={form.dob}
                onChangeText={(v: string) => update("dob", v)}
                placeholder="DD / MM / YYYY"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.inputIcon}>
                <CalendarDays size={16} color="#6E7979" strokeWidth={1.8} />
              </View>
            </View>
          </View>

          {/* Gender segmented */}
          <View style={styles.fieldWrap}>
            <FieldLabel label="GENDER" />
            <View style={styles.segmented}>
              {["Male", "Female", "Other"].map((g) => (
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

          {/* Relation + Blood Group side by side */}
          <View style={styles.row}>
            <View style={[styles.fieldWrap, { flex: 1, marginRight: 10 }]}>
              <FieldLabel label="RELATION" />
              <DropdownField value={form.relation} onPress={() => {}} />
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <FieldLabel label="BLOOD GROUP" />
              <DropdownField value={form.bloodGroup} onPress={() => {}} />
            </View>
          </View>
        </SectionCard>

        {/* ── Health Info ── */}
        <SectionCard>
          <SectionHeading label="HEALTH INFO" />

          {/* Known Allergies */}
          <View style={styles.fieldWrap}>
            <FieldLabel label="KNOWN ALLERGIES" />
            <View style={styles.tagContainer}>
              {form.allergies.map((a: string) => (
                <Tag key={a} label={a} onRemove={() => removeAllergy(a)} />
              ))}
              <AddTag onPress={() => {}} />
            </View>
          </View>

          {/* Chronic Conditions */}
          <View style={styles.fieldWrap}>
            <FieldLabel label="CHRONIC CONDITIONS" />
            <View style={styles.tagContainer}>
              {form.conditions.map((c: string) => (
                <Tag key={c} label={c} onRemove={() => removeCondition(c)} />
              ))}
              <AddTag onPress={() => {}} />
            </View>
          </View>

          {/* Height + Weight side by side */}
          <View style={styles.row}>
            <View style={[styles.fieldWrap, { flex: 1, marginRight: 10 }]}>
              <FieldLabel label="HEIGHT (CM)" />
              <InputField
                value={form.height}
                onChangeText={(v: string) => update("height", v)}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <FieldLabel label="WEIGHT (KG)" />
              <InputField
                value={form.weight}
                onChangeText={(v: string) => update("weight", v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </SectionCard>

        {/* ── Special Health Conditions ── */}
        <SectionCard>
          <Text style={styles.specialTitle}>Special Health Conditions</Text>
          <Text style={styles.specialSubtitle}>
            Check all that apply to receive personalized monitoring and alerts.
          </Text>

          {/* Pregnancy */}
          <ToggleRow
            label="Pregnancy"
            value={form.pregnancy}
            onValueChange={(v: boolean) => update("pregnancy", v)}
          />

          {/* Trimester — shown only when pregnancy ON */}
          {form.pregnancy && (
            <View style={styles.trimesterWrap}>
              <View style={styles.trimesterBorder} />
              <View style={styles.trimesterContent}>
                <FieldLabel label="CURRENT TRIMESTER" />
                <DropdownField value={form.trimester} onPress={() => {}} />
              </View>
            </View>
          )}

          <ToggleRow
            label="Diabetes"
            value={form.diabetes}
            onValueChange={(v: boolean) => update("diabetes", v)}
          />
          <ToggleRow
            label="Liver Condition"
            value={form.liverCondition}
            onValueChange={(v: boolean) => update("liverCondition", v)}
          />
          <ToggleRow
            label="Post-Surgery / Wound Care"
            value={form.postSurgery}
            onValueChange={(v: boolean) => update("postSurgery", v)}
          />
          <ToggleRow
            label="Newborn"
            value={form.newborn}
            onValueChange={(v: boolean) => update("newborn", v)}
          />
        </SectionCard>

        {/* ── Emergency Contact ── */}
        <SectionCard>
          <SectionHeading label="EMERGENCY CONTACT" />

          <View style={styles.fieldWrap}>
            <FieldLabel label="CONTACT NAME" />
            <InputField
              value={form.contactName}
              onChangeText={(v: string) => update("contactName", v)}
              placeholder="Contact name"
            />
          </View>

          <View style={styles.fieldWrap}>
            <FieldLabel label="PHONE NUMBER" />
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                value={form.contactPhone}
                onChangeText={(v) => update("contactPhone", v)}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
              <View style={styles.inputIcon}>
                <Phone size={15} color="#6E7979" strokeWidth={1.8} />
              </View>
            </View>
          </View>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            onPress={handleRemove}
            activeOpacity={0.88}
            style={styles.removeBtn}
          >
            <Text style={styles.removeBtnText}>Remove This Member</Text>
          </TouchableOpacity>
          <Text style={styles.dangerNote}>
            All health history and associated vitals for this member will be
            permanently archived.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 0,
    shadowColor: "#4C56AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 10,
  },
  headerBtn: {
    width: 48,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: -0.5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "right",
  },
  saveTextActive: {
    color: "#069594",
  },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },

  // ── Avatar ──
  avatarSection: {
    alignItems: "center",
    marginBottom: 4,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 9999,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    position: "relative",
  },
  avatarCircle: {
    width: "100%",
    height: "100%",
    backgroundColor: "#CBD5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "800",
    color: "#4C56AF",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#069594",
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#4C56AF",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
    gap: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    opacity: 0.6,
  },

  // ── Fields ──
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6E7979",
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },
  input: {
    height: 48,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "400",
    color: "#191C1E",
  },
  inputWithIcon: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  // ── Gender segmented ──
  segmented: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 9999,
    padding: 4,
    height: 40,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#069594",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },

  // ── Dropdown ──
  dropdown: {
    height: 48,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#FEFEFE",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
  },

  // ── Row ──
  row: {
    flexDirection: "row",
  },

  // ── Tags ──
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6,149,148,0.10)",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#069594",
  },
  addTagBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#069594",
  },

  // ── Special Conditions ──
  specialTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
  },
  specialSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#334155",
    lineHeight: 21,
    marginTop: -8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },

  // Trimester expansion
  trimesterWrap: {
    flexDirection: "row",
    marginLeft: 0,
    marginTop: -4,
    marginBottom: 4,
  },
  trimesterBorder: {
    width: 2,
    backgroundColor: "#069594",
    borderRadius: 2,
    marginRight: 18,
    marginLeft: 2,
  },
  trimesterContent: {
    flex: 1,
    gap: 8,
  },

  // ── Danger Zone ──
  dangerZone: {
    alignItems: "center",
    paddingTop: 8,
    gap: 14,
  },
  removeBtn: {
    alignSelf: "stretch",
    height: 52,
    backgroundColor: "#EE2121",
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EE2121",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dangerNote: {
    fontSize: 11,
    fontWeight: "400",
    color: "#6E7979",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 32,
  },
});
