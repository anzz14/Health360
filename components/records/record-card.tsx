import { toLabel } from "@/lib/record-form";
import { Edit3, Trash2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RecordCardProps = {
  title: string;
  recordDate: string;
  ownerName?: string | null;
  recordType: string;
  description?: string | null;
  onEdit: () => void;
  onDelete: () => void;
};

function RecordCardComponent({
  title,
  recordDate,
  ownerName,
  recordType,
  description,
  onEdit,
  onDelete,
}: RecordCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardMainContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardMeta}>
            {recordDate}
            {ownerName ? `  •  ${ownerName}` : ""}
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{toLabel(recordType)}</Text>
        </View>
      </View>

      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          onPress={onEdit}
          style={styles.actionButton}
          activeOpacity={0.8}
        >
          <Edit3 size={16} color="#0F766E" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          style={styles.actionButton}
          activeOpacity={0.8}
        >
          <Trash2 size={16} color="#B91C1C" />
          <Text style={[styles.actionText, styles.deleteActionText]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const RecordCard = React.memo(RecordCardComponent);

const styles = StyleSheet.create({
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
  cardMainContent: {
    flex: 1,
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
  deleteActionText: {
    color: "#B91C1C",
  },
});
