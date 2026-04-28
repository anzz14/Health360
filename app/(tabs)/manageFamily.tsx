import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
import { ALLERGIES, CHRONIC_ILLNESSES } from "@/constants/medical-data";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { ArrowLeft, ChevronRight, Copy, Plus, X } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types & Constants ────────────────────────────────────────────────────────
type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number | string;
  bloodGroup: string;
  avatar: string;
  bloodColor: string;
  bloodBg: string;
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── Helper Functions ────────────────────────────────────────────────────────
const calculateAge = (dobString: string) => {
  if (!dobString) return "--";
  const parts = dobString.split(" / ");
  if (parts.length !== 3) return "--";
  return new Date().getFullYear() - parseInt(parts[2], 10);
};

const getBloodColors = (bg: string) => {
  if (!bg) return { color: "#6B7280", bg: "#F3F4F6" };
  if (bg.includes("O")) return { color: "#DC2626", bg: "#FEF2F2" };
  if (bg.includes("A") || bg.includes("B"))
    return { color: "#D97706", bg: "#FEF3C7" };
  return { color: "#059669", bg: "#D1FAE5" };
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ManageFamilyScreen() {
  const { user } = useAuth();

  // Data State
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // <-- NEW: Refresh State
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [familyCode, setFamilyCode] = useState<string | null>(null);

  // Bottom Sheet State
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);
  const [adding, setAdding] = useState(false);

  // New Member Form State
  const [newMember, setNewMember] = useState({
    name: "",
    relation: "",
    dob: "",
    gender: "Male",
    bloodGroup: "",
    height: "",
    weight: "",
  });
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedIllnesses, setSelectedIllnesses] = useState<string[]>([]);

  // ─── Fetch Data ───
  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_family_id")
        .eq("id", user.id)
        .single();
      if (!profile?.active_family_id) return setLoading(false);
      setActiveFamilyId(profile.active_family_id);

      const { data: familyData } = await supabase
        .from("families")
        .select("invite_code")
        .eq("id", profile.active_family_id)
        .single();
      if (familyData) setFamilyCode(familyData.invite_code);

      const { data: membersData } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", profile.active_family_id);

      // 💡 FIXED: Removed the broken join. It will now fetch perfectly.
      const { data: requestsData, error: reqError } = await supabase
        .from("family_requests")
        .select("*")
        .eq("family_id", profile.active_family_id)
        .eq("status", "pending");

      if (reqError) console.error("Requests Fetch Error:", reqError);

      setPendingRequests(requestsData || []);
      setMembers(
        (membersData || []).map((m: any) => ({
          id: m.id,
          name: m.full_name,
          relation: m.relationship,
          age: calculateAge(m.dob),
          bloodGroup: m.blood_group,
          avatar: m.avatar_url,
          ...getBloodColors(m.blood_group),
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // ─── Pull to Refresh Action ───
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ─── Actions ───
  const copyToClipboard = async () => {
    if (familyCode) {
      await Clipboard.setStringAsync(familyCode);
      Alert.alert("Copied!", "Family code copied to clipboard.");
    }
  };

  const handleApprove = (requestId: string) => {
    Alert.alert(
      "Approve Request",
      "Are you sure you want to add this person to your family?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => confirmApproval(requestId, null),
        },
      ],
    );
  };

  const confirmApproval = async (
    requestId: string,
    linkMemberId: string | null,
  ) => {
    try {
      const { data, error } = await supabase.rpc("approve_family_request", {
        request_id: requestId,
        link_member_id: linkMemberId,
      });

      if (error) throw error; // Network error

      if (data.success) {
        Alert.alert("Success", "Family member added!");
        fetchData(); // Refresh the list!
      } else {
        // If the database blocked it, it will tell us EXACTLY why here
        Alert.alert("Database Error", data.error || "Approval failed.");
      }
    } catch (err: any) {
      Alert.alert("Network Error", err.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("family_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);
      if (error) throw error;
      fetchData(); // Refresh UI
    } catch (err: any) {
      Alert.alert("Error", "Could not reject request.");
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.relation || !activeFamilyId)
      return Alert.alert("Error", "Name and Relationship are required.");
    setAdding(true);
    try {
      const { error } = await supabase.from("family_members").insert({
        family_id: activeFamilyId,
        full_name: newMember.name,
        relationship: newMember.relation,
        dob: newMember.dob,
        gender: newMember.gender,
        blood_group: newMember.bloodGroup,
        height: newMember.height,
        weight: newMember.weight,
        allergies: selectedAllergies,
        chronic_illnesses: selectedIllnesses,
      });
      if (error) throw error;

      bottomSheetRef.current?.dismiss();
      setNewMember({
        name: "",
        relation: "",
        dob: "",
        gender: "Male",
        bloodGroup: "",
        height: "",
        weight: "",
      });
      setSelectedAllergies([]);
      setSelectedIllnesses([]);
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setAdding(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#069594" />
      </View>
    );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F2F5F7",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F7" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 6,
          gap: 12,
        }}
      >
        <TouchableOpacity activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1A2B4B" strokeWidth={2.3} />
        </TouchableOpacity>
        <Typography variant="h3" color="heading">
          Manage Family
        </Typography>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 130,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#069594"
          />
        } // <-- PULL TO REFRESH ADDED
      >
        {/* Family Code Banner */}
        {familyCode && (
          <View
            style={{
              backgroundColor: "#069594",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              shadowColor: "#069594",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View>
              <Typography
                variant="body-small"
                color="white"
                className="opacity-80 mb-1"
              >
                Family Invite Code
              </Typography>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 24,
                  color: "#FFFFFF",
                  letterSpacing: 4,
                }}
              >
                {familyCode}
              </Text>
            </View>
            <TouchableOpacity
              onPress={copyToClipboard}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 12,
                borderRadius: 12,
              }}
            >
              <Copy size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        <Typography variant="body" color="secondary" className="mb-6">
          {members.length} members in your Family
        </Typography>

        {/* ── Approval Inbox ── */}
        {pendingRequests.map((req) => {
          return (
            <View
              key={req.id}
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Typography variant="subtitle" color="heading">
                  Join Request
                </Typography>
                <Typography
                  variant="body-small"
                  style={{ color: "#B45309", marginTop: 4 }}
                >
                  <Text style={{ fontWeight: "bold" }}>A new user</Text> wants
                  to join.
                </Typography>
              </View>

              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                {/* Reject Button */}
                <TouchableOpacity
                  onPress={() => handleReject(req.id)}
                  style={{
                    backgroundColor: "#FEE2E2",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} color="#DC2626" />
                </TouchableOpacity>
                {/* Approve Button */}
                <TouchableOpacity
                  onPress={() => handleApprove(req.id)}
                  style={{
                    backgroundColor: "#D97706",
                    paddingHorizontal: 16,
                    height: 36,
                    justifyContent: "center",
                    borderRadius: 999,
                  }}
                >
                  <Typography
                    variant="button"
                    color="white"
                    className="font-bold"
                    style={{ fontSize: 13 }}
                  >
                    Approve
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Member Cards */}
        {members.map((m) => (
          <TouchableOpacity
            key={m.id}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 16,
              marginBottom: 14,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 9999,
                  overflow: "hidden",
                  backgroundColor: "#E6F7F7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.avatar ? (
                  <Image
                    source={{ uri: m.avatar }}
                    style={{ width: 52, height: 52 }}
                  />
                ) : (
                  <Typography variant="h4" color="primary">
                    {m.name.charAt(0)}
                  </Typography>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Typography
                  variant="body"
                  color="heading"
                  className="font-bold"
                  style={{ fontSize: 17 }}
                >
                  {m.name}
                </Typography>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                    gap: 8,
                  }}
                >
                  <Typography variant="body-small" color="secondary">
                    {m.relation} · {m.age} yrs
                  </Typography>
                  <View
                    style={{
                      backgroundColor: m.bloodBg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Typography
                      variant="body-small"
                      className="font-bold"
                      style={{ fontSize: 11, color: m.bloodColor }}
                    >
                      {m.bloodGroup || "N/A"}
                    </Typography>
                  </View>
                </View>
              </View>
              <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Add New Member Button */}
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.present()}
          activeOpacity={0.8}
          style={{
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: "#A3D6D5",
            backgroundColor: "#F4FAFA",
            borderRadius: 20,
            paddingVertical: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              backgroundColor: "#069594",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Typography variant="body" color="primary" className="font-bold">
            + Add New Member
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTTOM SHEET FOR ADDING MEMBER */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#F9FAFB", borderRadius: 24 }}
        keyboardBehavior="extend"
      >
        <View style={{ padding: 24, flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Typography variant="h3" color="heading">
              Create Profile
            </Typography>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.dismiss()}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 20, paddingBottom: 100 }}
          >
            <View>
              <Typography variant="label" color="heading" className="mb-2">
                Full Name
              </Typography>
              <Input
                placeholder="Enter name"
                value={newMember.name}
                onChangeText={(t) => setNewMember((p) => ({ ...p, name: t }))}
              />
            </View>
            <View>
              <Typography variant="label" color="heading" className="mb-2">
                Relationship
              </Typography>
              <Input
                placeholder="e.g. Son, Daughter, Father"
                value={newMember.relation}
                onChangeText={(t) =>
                  setNewMember((p) => ({ ...p, relation: t }))
                }
              />
            </View>
            <View>
              <Typography variant="label" color="heading" className="mb-2">
                Date of Birth
              </Typography>
              <Input
                placeholder="DD / MM / YYYY"
                value={newMember.dob}
                onChangeText={(t) => setNewMember((p) => ({ ...p, dob: t }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Typography variant="label" color="heading" className="mb-2">
                  Height
                </Typography>
                <Input
                  placeholder="175"
                  value={newMember.height}
                  onChangeText={(t) =>
                    setNewMember((p) => ({ ...p, height: t }))
                  }
                  keyboardType="numeric"
                  suffixText="cm"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="label" color="heading" className="mb-2">
                  Weight
                </Typography>
                <Input
                  placeholder="70"
                  value={newMember.weight}
                  onChangeText={(t) =>
                    setNewMember((p) => ({ ...p, weight: t }))
                  }
                  keyboardType="numeric"
                  suffixText="kg"
                />
              </View>
            </View>

            <View>
              <Typography variant="label" color="heading" className="mb-2">
                Blood Group
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    onPress={() =>
                      setNewMember((p) => ({ ...p, bloodGroup: bg }))
                    }
                    style={{
                      width: "22%",
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor:
                        newMember.bloodGroup === bg ? "#069594" : "#E5E7EB",
                      backgroundColor:
                        newMember.bloodGroup === bg ? "#F0FAF9" : "#fff",
                    }}
                  >
                    <Typography
                      variant="body-small"
                      color={
                        newMember.bloodGroup === bg ? "primary" : "heading"
                      }
                      className={newMember.bloodGroup === bg ? "font-bold" : ""}
                    >
                      {bg}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Typography
                variant="subtitle"
                color="heading"
                className="mb-3 mt-4"
              >
                Known Allergies
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {ALLERGIES.map((item) => {
                  const isSelected = selectedAllergies.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setSelectedAllergies((p) =>
                          p.includes(item)
                            ? p.filter((i) => i !== item)
                            : [...p, item],
                        )
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: isSelected ? "#069594" : "#E5E7EB",
                        backgroundColor: isSelected ? "#069594" : "#fff",
                      }}
                    >
                      <Typography
                        variant="body-small"
                        color={isSelected ? "white" : "heading"}
                        className={isSelected ? "font-bold" : ""}
                      >
                        {item}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Typography
                variant="subtitle"
                color="heading"
                className="mb-3 mt-4"
              >
                Chronic Illnesses
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CHRONIC_ILLNESSES.map((item) => {
                  const isSelected = selectedIllnesses.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setSelectedIllnesses((p) =>
                          p.includes(item)
                            ? p.filter((i) => i !== item)
                            : [...p, item],
                        )
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: isSelected ? "#069594" : "#E5E7EB",
                        backgroundColor: isSelected ? "#069594" : "#fff",
                      }}
                    >
                      <Typography
                        variant="body-small"
                        color={isSelected ? "white" : "heading"}
                        className={isSelected ? "font-bold" : ""}
                      >
                        {item}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </BottomSheetScrollView>

          <View style={{ paddingTop: 16 }}>
            <Button
              title={adding ? "Saving Profile..." : "Save Profile"}
              onPress={handleAddMember}
              disabled={adding}
              variant="primary"
              rounded="full"
              size="lg"
              className="w-full"
            />
          </View>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
