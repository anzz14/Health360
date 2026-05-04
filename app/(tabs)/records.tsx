import { useAuth } from "@/context/auth-context";
import {
  createMemberRecord,
  createPersonalRecord,
  deleteRecord,
  FamilyRecordRow,
  fetchFamilyRecords,
  fetchMyRecords,
  RecordInput,
  updateRecord,
} from "@/lib/records";
import { useFamilyMembers } from "@/hooks/use-family-members";
import { RecordRow, RecordType } from "@/types";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DisplayRecord = RecordRow & Partial<FamilyRecordRow>;

type FormState = {
  record_type: RecordType;
  title: string;
  description: string;
  record_date: string;
  doctor_name: string;
  hospital_or_clinic: string;
  attachments: string;
  notes: string;
  tags: string;
};

const RECORD_TYPES: RecordType[] = [
  "radiology",
  "hospitalization",
  "vaccination",
  "lab_result",
  "prescription",
  "dental",
  "ophthalmology",
  "allergy_test",
  "surgery",
  "mental_health",
  "general_checkup",
];

const DEFAULT_FORM: FormState = {
  record_type: "general_checkup",
  title: "",
  description: "",
  record_date: new Date().toISOString().slice(0, 10),
  doctor_name: "",
  hospital_or_clinic: "",
  attachments: "",
  notes: "",
  tags: "",
};

const toLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const csvToArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function RecordsScreen() {
  const { user } = useAuth();
  const { members, familyId, isAdmin, loading: familyLoading } = useFamilyMembers();

  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisplayRecord | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const ownerOptions = useMemo(
    () =>
      members.map((member) => ({
        id: member.id,
        name: member.name,
        userId: member.userId,
      })),
    [members],
  );

  useEffect(() => {
    if (isAdmin && ownerOptions.length > 0 && !selectedMemberId) {
      setSelectedMemberId(ownerOptions[0].id);
    }
  }, [isAdmin, ownerOptions, selectedMemberId]);

  const loadRecords = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const data =
        isAdmin && familyId
          ? await fetchFamilyRecords(familyId)
          : await fetchMyRecords(user.id);

      setRecords(data as DisplayRecord[]);
    } catch (error: any) {
      Alert.alert("Records", error?.message ?? "Failed to load records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [familyId, isAdmin, user?.id]);

  useEffect(() => {
    if (!familyLoading) {
      loadRecords();
    }
  }, [familyLoading, loadRecords]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecords();
  }, [loadRecords]);

  const openCreate = () => {
    setEditingRecord(null);
    setForm(DEFAULT_FORM);
    setFormVisible(true);
  };

  const openEdit = (record: DisplayRecord) => {
    setEditingRecord(record);
    setForm({
      record_type: record.record_type,
      title: record.title,
      description: record.description ?? "",
      record_date: record.record_date,
      doctor_name: record.doctor_name ?? "",
      hospital_or_clinic: record.hospital_or_clinic ?? "",
      attachments: (record.attachments ?? []).join(", "),
      notes: record.notes ?? "",
      tags: (record.tags ?? []).join(", "),
    });
    setFormVisible(true);
  };

  const resetForm = () => {
    setFormVisible(false);
    setEditingRecord(null);
    setForm(DEFAULT_FORM);
  };

  const validate = () => {
    if (!form.title.trim()) {
      Alert.alert("Validation", "Title is required");
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.record_date)) {
      Alert.alert("Validation", "Date must be in YYYY-MM-DD format");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!user?.id || !validate()) return;

    const payload: RecordInput = {
      record_type: form.record_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      record_date: form.record_date,
      doctor_name: form.doctor_name.trim() || null,
      hospital_or_clinic: form.hospital_or_clinic.trim() || null,
      attachments: csvToArray(form.attachments),
      notes: form.notes.trim() || null,
      tags: csvToArray(form.tags),
    };

    setSaving(true);
    try {
      if (editingRecord) {
        await updateRecord(editingRecord.id, user.id, payload);
      } else if (isAdmin && ownerOptions.length > 0 && selectedMemberId) {
        const target = ownerOptions.find((m) => m.id === selectedMemberId);
        if (!target) {
          throw new Error("Please select a family member");
        }

        await createMemberRecord(
          user.id,
          target.userId ? null : target.id,
          target.userId ?? null,
          payload,
        );
      } else {
        await createPersonalRecord(user.id, payload);
      }

      resetForm();
      await loadRecords();
    } catch (error: any) {
      Alert.alert("Records", error?.message ?? "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (recordId: string) => {
    if (!user?.id) return;

    Alert.alert("Delete Record", "This will move the record to deleted state.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRecord(recordId, user.id);
            await loadRecords();
          } catch (error: any) {
            Alert.alert("Records", error?.message ?? "Failed to delete record");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medical Records</Text>
          <Text style={styles.subtitle}>
            {isAdmin ? "Manage records for your family" : "Manage your personal records"}
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#069594" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptyBody}>Create your first medical record to get started.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.record_date}
                    {item.owner_name ? `  •  ${item.owner_name}` : ""}
                  </Text>
                </View>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{toLabel(item.record_type)}</Text>
                </View>
              </View>

              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  style={styles.actionButton}
                  activeOpacity={0.8}
                >
                  <Edit3 size={16} color="#0F766E" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  style={styles.actionButton}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#B91C1C" />
                  <Text style={[styles.actionText, { color: "#B91C1C" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingRecord ? "Edit Record" : "Create Record"}</Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isAdmin && !editingRecord && ownerOptions.length > 0 ? (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Record owner</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ownerOptions.map((option) => {
                      const selected = selectedMemberId === option.id;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() => setSelectedMemberId(option.id)}
                          style={[styles.ownerChip, selected && styles.ownerChipActive]}
                        >
                          <Text style={[styles.ownerChipText, selected && styles.ownerChipTextActive]}>
                            {option.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Record type</Text>
                <View style={styles.typeWrap}>
                  {RECORD_TYPES.map((type) => {
                    const active = form.record_type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setForm((prev) => ({ ...prev, record_type: type }))}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {toLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <FormInput
                label="Title"
                value={form.title}
                onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
                placeholder="e.g. Annual blood panel"
              />
              <FormInput
                label="Date"
                value={form.record_date}
                onChangeText={(record_date) => setForm((prev) => ({ ...prev, record_date }))}
                placeholder="YYYY-MM-DD"
              />
              <FormInput
                label="Doctor Name"
                value={form.doctor_name}
                onChangeText={(doctor_name) => setForm((prev) => ({ ...prev, doctor_name }))}
                placeholder="Optional"
              />
              <FormInput
                label="Hospital or Clinic"
                value={form.hospital_or_clinic}
                onChangeText={(hospital_or_clinic) =>
                  setForm((prev) => ({ ...prev, hospital_or_clinic }))
                }
                placeholder="Optional"
              />
              <FormInput
                label="Description"
                value={form.description}
                onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
                placeholder="Optional"
                multiline
              />
              <FormInput
                label="Attachments (comma separated URLs)"
                value={form.attachments}
                onChangeText={(attachments) => setForm((prev) => ({ ...prev, attachments }))}
                placeholder="https://..."
              />
              <FormInput
                label="Tags (comma separated)"
                value={form.tags}
                onChangeText={(tags) => setForm((prev) => ({ ...prev, tags }))}
                placeholder="urgent, follow-up"
              />
              <FormInput
                label="Notes"
                value={form.notes}
                onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
                placeholder="Optional"
                multiline
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={submit}
                disabled={saving}
                activeOpacity={0.88}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{editingRecord ? "Update Record" : "Create Record"}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[styles.input, multiline && styles.textArea]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6FAFA",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },
  addButton: {
    backgroundColor: "#069594",
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyCard: {
    marginTop: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9EEEE",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyBody: {
    marginTop: 8,
    color: "#64748B",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE9EC",
    padding: 14,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardMeta: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
  },
  badge: {
    backgroundColor: "#E8FAF8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#0F766E",
    fontWeight: "700",
    fontSize: 11,
  },
  description: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    color: "#0F766E",
    fontWeight: "700",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeText: {
    color: "#0F766E",
    fontWeight: "700",
  },
  fieldWrap: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 88,
    height: 88,
    paddingTop: 10,
  },
  typeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  typeChipActive: {
    backgroundColor: "#E8FAF8",
    borderColor: "#14B8A6",
  },
  typeChipText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  typeChipTextActive: {
    color: "#0F766E",
  },
  ownerChip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  ownerChipActive: {
    backgroundColor: "#DCF6F3",
    borderColor: "#14B8A6",
  },
  ownerChipText: {
    color: "#334155",
    fontWeight: "600",
  },
  ownerChipTextActive: {
    color: "#0F766E",
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#069594",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});