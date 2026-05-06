import {
    RECORD_TYPES,
    RecordFormState,
    RecordOwnerOption,
    toLabel,
} from "@/lib/record-form";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type RecordFormModalProps = {
  visible: boolean;
  isEditing: boolean;
  isAdmin: boolean;
  ownerOptions: RecordOwnerOption[];
  selectedMemberId: string | null;
  onSelectMemberId: (id: string) => void;
  form: RecordFormState;
  onChangeForm: React.Dispatch<React.SetStateAction<RecordFormState>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

function RecordFormModalComponent({
  visible,
  isEditing,
  isAdmin,
  ownerOptions,
  selectedMemberId,
  onSelectMemberId,
  form,
  onChangeForm,
  saving,
  onClose,
  onSubmit,
}: RecordFormModalProps) {
  const showOwnerSelector = isAdmin && !isEditing && ownerOptions.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Record" : "Create Record"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {showOwnerSelector ? (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Record owner</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {ownerOptions.map((option) => {
                    const selected = selectedMemberId === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => onSelectMemberId(option.id)}
                        style={[
                          styles.ownerChip,
                          selected && styles.ownerChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ownerChipText,
                            selected && styles.ownerChipTextActive,
                          ]}
                        >
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
                      onPress={() =>
                        onChangeForm((prev) => ({ ...prev, record_type: type }))
                      }
                      style={[styles.typeChip, active && styles.typeChipActive]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          active && styles.typeChipTextActive,
                        ]}
                      >
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
              onChangeText={(title) =>
                onChangeForm((prev) => ({ ...prev, title }))
              }
              placeholder="e.g. Annual blood panel"
            />
            <FormInput
              label="Date"
              value={form.record_date}
              onChangeText={(record_date) =>
                onChangeForm((prev) => ({ ...prev, record_date }))
              }
              placeholder="YYYY-MM-DD"
            />
            <FormInput
              label="Doctor Name"
              value={form.doctor_name}
              onChangeText={(doctor_name) =>
                onChangeForm((prev) => ({ ...prev, doctor_name }))
              }
              placeholder="Optional"
            />
            <FormInput
              label="Hospital or Clinic"
              value={form.hospital_or_clinic}
              onChangeText={(hospital_or_clinic) =>
                onChangeForm((prev) => ({ ...prev, hospital_or_clinic }))
              }
              placeholder="Optional"
            />
            <FormInput
              label="Description"
              value={form.description}
              onChangeText={(description) =>
                onChangeForm((prev) => ({ ...prev, description }))
              }
              placeholder="Optional"
              multiline
            />
            <FormInput
              label="Attachments (comma separated URLs)"
              value={form.attachments}
              onChangeText={(attachments) =>
                onChangeForm((prev) => ({ ...prev, attachments }))
              }
              placeholder="https://..."
            />
            <FormInput
              label="Tags (comma separated)"
              value={form.tags}
              onChangeText={(tags) =>
                onChangeForm((prev) => ({ ...prev, tags }))
              }
              placeholder="urgent, follow-up"
            />
            <FormInput
              label="Notes"
              value={form.notes}
              onChangeText={(notes) =>
                onChangeForm((prev) => ({ ...prev, notes }))
              }
              placeholder="Optional"
              multiline
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Update Record" : "Create Record"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
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

export const RecordFormModal = React.memo(RecordFormModalComponent);

const styles = StyleSheet.create({
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
