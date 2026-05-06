import { RecordCard } from "@/components/records/record-card";
import { RecordFormModal } from "@/components/records/record-form-modal";
import { useAuth } from "@/context/auth-context";
import { useFamilyMembers } from "@/hooks/use-family-members";
import {
  csvToArray,
  DEFAULT_RECORD_FORM,
  RecordFormState,
  RecordOwnerOption,
} from "@/lib/record-form";
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
import { RecordRow } from "@/types";
import { Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DisplayRecord = RecordRow & Partial<FamilyRecordRow>;

export default function RecordsScreen() {
  const { user } = useAuth();
  const {
    members,
    familyId,
    isAdmin,
    loading: familyLoading,
  } = useFamilyMembers();

  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisplayRecord | null>(
    null,
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<RecordFormState>(DEFAULT_RECORD_FORM);

  const ownerOptions = useMemo<RecordOwnerOption[]>(
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
    setForm(DEFAULT_RECORD_FORM);
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
    setForm(DEFAULT_RECORD_FORM);
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

  const onDelete = async (recordId: string) => {
    if (!user?.id) return;

    try {
      await deleteRecord(recordId, user.id);
      await loadRecords();
    } catch (error: any) {
      Alert.alert("Records", error?.message ?? "Failed to delete record");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medical Records</Text>
          <Text style={styles.subtitle}>
            {isAdmin
              ? "Manage records for your family"
              : "Manage your personal records"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreate}
          activeOpacity={0.85}
        >
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptyBody}>
                Create your first medical record to get started.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RecordCard
              title={item.title}
              recordDate={item.record_date}
              ownerName={item.owner_name}
              recordType={item.record_type}
              description={item.description}
              onEdit={() => openEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}

      <RecordFormModal
        visible={formVisible}
        isEditing={Boolean(editingRecord)}
        isAdmin={isAdmin}
        ownerOptions={ownerOptions}
        selectedMemberId={selectedMemberId}
        onSelectMemberId={setSelectedMemberId}
        form={form}
        onChangeForm={setForm}
        saving={saving}
        onClose={resetForm}
        onSubmit={submit}
      />
    </SafeAreaView>
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
});
