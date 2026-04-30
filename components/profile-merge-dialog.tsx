import { Typography } from "@/components/typography/typography";
import { ProfileMergeDialogProps } from "@/types";
import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const ProfileField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <View style={{ marginBottom: 12 }}>
    <Typography
      variant="body-small"
      color="secondary"
      style={{ fontSize: 11, marginBottom: 4 }}
    >
      {label}
    </Typography>
    <Typography
      variant="body"
      color="heading"
      className="font-medium"
      style={{ fontSize: 14 }}
    >
      {value || "—"}
    </Typography>
  </View>
);

const ProfileCard = ({
  title,
  profile,
  selected,
  onPress,
}: {
  title: string;
  profile: {
    full_name?: string;
    relation?: string;
    dob?: string | null;
    blood_group?: string | null;
    gender?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    medical_notes?: string | null;
    avatar_url?: string | null;
  };
  selected: boolean;
  onPress: () => void;
}) => {
  const avatar =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "User")}&background=069594&color=fff`;

  return (
    <View
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? "#069594" : "#E5E7EB",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        padding: 16,
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Avatar */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 9999,
            overflow: "hidden",
            backgroundColor: "#F3F4F6",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: avatar }}
            style={{ width: 60, height: 60 }}
          />
        </View>
      </View>

      {/* Title */}
      <Typography
        variant="body"
        color="heading"
        className="font-bold text-center mb-2"
        style={{ fontSize: 13 }}
      >
        {title}
      </Typography>

      {/* Scrollable content */}
      <ScrollView
        scrollEnabled
        nestedScrollEnabled
        style={{ maxHeight: 200, marginBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileField label="Name" value={profile.full_name} />
        {profile.relation && (
          <ProfileField label="Relation" value={profile.relation} />
        )}
        <ProfileField label="DOB" value={profile.dob} />
        <ProfileField label="Blood Group" value={profile.blood_group} />
        {profile.gender && (
          <ProfileField label="Gender" value={profile.gender} />
        )}
        {profile.height_cm && (
          <ProfileField label="Height (cm)" value={profile.height_cm} />
        )}
        {profile.weight_kg && (
          <ProfileField label="Weight (kg)" value={profile.weight_kg} />
        )}
        {profile.medical_notes && (
          <ProfileField label="Medical Notes" value={profile.medical_notes} />
        )}
      </ScrollView>

      {/* Use This Button */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          height: 44,
          backgroundColor: selected ? "#069594" : "#F3F4F6",
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: selected ? "#069594" : "#E5E7EB",
        }}
      >
        <Typography
          variant="button"
          color={selected ? "white" : "heading"}
          className="font-bold"
          style={{ fontSize: 14 }}
        >
          Use This
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

export const ProfileMergeDialog: React.FC<ProfileMergeDialogProps> = ({
  visible,
  existingMember,
  incomingProfile,
  onChoose,
  onDismiss,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<"existing" | "incoming" | null>(
    null
  );
  const { width } = useWindowDimensions();
  const cardWidth = (width - 80) / 2; // 24px padding each side, 8px gap

  const handleChoose = (choice: "existing" | "incoming") => {
    setSelectedChoice(choice);
    onChoose(choice);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
    >
      {/* Semi-transparent backdrop */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        {/* Modal Content */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 40,
            maxHeight: "85%",
          }}
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Typography
              variant="h3"
              color="heading"
              className="font-bold text-center mb-4"
            >
              Choose Profile
            </Typography>
            <Typography
              variant="body-small"
              color="secondary"
              className="text-center"
              style={{ fontSize: 14 }}
            >
              Select which profile to keep — the other will be discarded
            </Typography>
          </View>

          {/* Profile Cards Side by Side */}
          <ScrollView
            scrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <ProfileCard
                  title="Current Member"
                  profile={{
                    full_name: existingMember.full_name,
                    relation: existingMember.relation,
                    dob: existingMember.dob,
                    blood_group: existingMember.blood_group,
                    gender: existingMember.gender,
                    height_cm: existingMember.height_cm,
                    weight_kg: existingMember.weight_kg,
                    medical_notes: existingMember.medical_notes,
                    avatar_url: existingMember.avatar_url,
                  }}
                  selected={selectedChoice === "existing"}
                  onPress={() => handleChoose("existing")}
                />
              </View>

              <View style={{ flex: 1 }}>
                <ProfileCard
                  title="Their Profile"
                  profile={{
                    full_name: incomingProfile.full_name,
                    dob: incomingProfile.dob,
                    blood_group: incomingProfile.blood_group,
                    gender: incomingProfile.gender,
                    height_cm: incomingProfile.height_cm,
                    weight_kg: incomingProfile.weight_kg,
                    medical_notes: incomingProfile.medical_notes,
                    avatar_url: incomingProfile.avatar_url,
                  }}
                  selected={selectedChoice === "incoming"}
                  onPress={() => handleChoose("incoming")}
                />
              </View>
            </View>
          </ScrollView>

          {/* Close Button - optional for UX */}
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.8}
            style={{
              height: 44,
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            <Typography
              variant="button"
              color="heading"
              className="font-semibold"
              style={{ fontSize: 14 }}
            >
              Cancel
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
