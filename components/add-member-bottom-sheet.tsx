import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
import { useAddFamilyMember } from "@/hooks/use-add-family-member";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { Calendar, Camera, ChevronDown, Plus, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Image,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const GENDERS = ["Male", "Female", "Other"] as const;
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
const RELATIONSHIPS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Aunt/Uncle",
  "Cousin",
  "Other",
] as const;

type AddMemberBottomSheetProps = {
  familyId: string;
  onMemberAdded: () => void;
};

export const AddMemberBottomSheet = React.forwardRef<
  BottomSheetModal,
  AddMemberBottomSheetProps
>(({ familyId, onMemberAdded }, ref) => {
  const snapPoints = useMemo(() => ["90%"], []);
  const { addMember, adding } = useAddFamilyMember();

  // Form state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<(typeof GENDERS)[number]>("Male");
  const [bloodGroup, setBloodGroup] = useState<
    (typeof BLOOD_GROUPS)[number] | ""
  >("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof RELATIONSHIPS)[number]>("Spouse");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showBloodPicker, setShowBloodPicker] = useState(false);
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);

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
    if (d.length > 4)
      return setDob(d.slice(0, 2) + " / " + d.slice(2, 4) + " / " + d.slice(4));
    if (d.length > 2) return setDob(d.slice(0, 2) + " / " + d.slice(2));
    setDob(d);
  };

  const handleAddMember = async () => {
    if (!fullName.trim()) {
      alert("Please enter member name");
      return;
    }

    const result = await addMember(familyId, {
      fullName,
      dob,
      gender,
      bloodGroup,
      height,
      weight,
      medicalNotes,
      relationship,
      avatarUri,
    });

    if (result.success) {
      // Reset form
      setFullName("");
      setDob("");
      setGender("Male");
      setBloodGroup("");
      setHeight("");
      setWeight("");
      setMedicalNotes("");
      setRelationship("Spouse");
      setAvatarUri(null);

      // Close bottom sheet and refresh list
      if (ref && "current" in ref && ref.current) {
        ref.current?.dismiss();
      }
      onMemberAdded();
    } else {
      alert("Error", result.error || "Failed to add member");
    }
  };

  const FieldLabel = ({ children }: { children: string }) => (
    <Typography
      variant="body"
      color="heading"
      className="font-bold mb-2 ml-1 uppercase"
      style={{ letterSpacing: 0.4, fontSize: 12 }}
    >
      {children}
    </Typography>
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
    >
      <BottomSheetView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 24,
          paddingTop: 16,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Typography variant="h3" color="heading">
            Add Family Member
          </Typography>
          <TouchableOpacity
            onPress={() => {
              if (ref && "current" in ref && ref.current) {
                ref.current?.dismiss();
              }
            }}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Avatar Section */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleAvatarPick}
              activeOpacity={0.85}
              style={{ position: "relative" }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
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
                    style={{ width: 80, height: 80, borderRadius: 9999 }}
                  />
                ) : (
                  <Camera size={28} color="#069594" strokeWidth={1.8} />
                )}
              </View>

              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  backgroundColor: "#069594",
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={10} color="#FFFFFF" strokeWidth={3} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAvatarPick}
              activeOpacity={0.7}
              style={{ marginTop: 10 }}
            >
              <Typography
                variant="body-small"
                color="primary"
                className="font-bold text-center"
                style={{ letterSpacing: 1.1, fontSize: 11 }}
              >
                ADD PHOTO
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Full Name</FieldLabel>
            <Input
              placeholder="Enter name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* DOB */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Date of Birth</FieldLabel>
            <Input
              placeholder="DD / MM / YYYY"
              value={dob}
              onChangeText={formatDob}
              keyboardType="number-pad"
              maxLength={14}
              suffix={<Calendar size={18} color="#6B7280" strokeWidth={1.8} />}
            />
          </View>

          {/* Gender */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Gender</FieldLabel>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
              }}
            >
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: gender === g ? "#069594" : "#F3F4F6",
                    borderWidth: 1,
                    borderColor: gender === g ? "#069594" : "#E5E7EB",
                  }}
                >
                  <Typography
                    variant="body-small"
                    color={gender === g ? "white" : "heading"}
                    className="text-center font-bold"
                    style={{ fontSize: 12 }}
                  >
                    {g}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Blood Group */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Blood Group</FieldLabel>
            <TouchableOpacity
              onPress={() => setShowBloodPicker(!showBloodPicker)}
              style={{
                height: 52,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Typography
                variant="body"
                color={bloodGroup ? "heading" : "secondary"}
                style={{ fontSize: 15 }}
              >
                {bloodGroup || "Select blood group"}
              </Typography>
              <ChevronDown
                size={18}
                color="#6B7280"
                style={{
                  transform: [{ rotate: showBloodPicker ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>

            {showBloodPicker && (
              <View
                style={{
                  marginTop: 8,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  maxHeight: 200,
                }}
              >
                <ScrollView scrollEnabled>
                  {BLOOD_GROUPS.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      onPress={() => {
                        setBloodGroup(bg);
                        setShowBloodPicker(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: "#E5E7EB",
                      }}
                    >
                      <Typography
                        variant="body"
                        color={bloodGroup === bg ? "primary" : "heading"}
                        className={bloodGroup === bg ? "font-bold" : ""}
                      >
                        {bg}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Relationship */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Relationship</FieldLabel>
            <TouchableOpacity
              onPress={() => setShowRelationshipPicker(!showRelationshipPicker)}
              style={{
                height: 52,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Typography
                variant="body"
                color="heading"
                style={{ fontSize: 15 }}
              >
                {relationship}
              </Typography>
              <ChevronDown
                size={18}
                color="#6B7280"
                style={{
                  transform: [
                    { rotate: showRelationshipPicker ? "180deg" : "0deg" },
                  ],
                }}
              />
            </TouchableOpacity>

            {showRelationshipPicker && (
              <View
                style={{
                  marginTop: 8,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  maxHeight: 200,
                }}
              >
                <ScrollView scrollEnabled>
                  {RELATIONSHIPS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => {
                        setRelationship(r);
                        setShowRelationshipPicker(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: "#E5E7EB",
                      }}
                    >
                      <Typography
                        variant="body"
                        color={relationship === r ? "primary" : "heading"}
                        className={relationship === r ? "font-bold" : ""}
                      >
                        {r}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Height */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Height (cm)</FieldLabel>
            <Input
              placeholder="170"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Weight */}
          <View style={{ marginBottom: 16 }}>
            <FieldLabel>Weight (kg)</FieldLabel>
            <Input
              placeholder="70"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Medical Notes */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel>Medical Notes</FieldLabel>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: "#FFFFFF",
                minHeight: 100,
              }}
            >
              <TextInput
                placeholder="Any medical history, allergies, etc."
                value={medicalNotes}
                onChangeText={setMedicalNotes}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                style={{
                  fontSize: 15,
                  color: "#374151",
                  fontFamily: "Inter_400Regular",
                }}
              />
            </View>
          </View>

          {/* Add Member Button */}
          <TouchableOpacity
            onPress={handleAddMember}
            disabled={adding}
            activeOpacity={0.88}
            style={{
              height: 56,
              borderRadius: 10,
              backgroundColor: "#069594",
              alignItems: "center",
              justifyContent: "center",
              opacity: adding ? 0.7 : 1,
              marginBottom: 20,
            }}
          >
            <Typography
              variant="button"
              color="white"
              className="font-bold text-lg"
            >
              {adding ? "Adding..." : "Add Member"}
            </Typography>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

AddMemberBottomSheet.displayName = "AddMemberBottomSheet";
