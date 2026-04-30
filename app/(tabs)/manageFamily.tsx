import { AddMemberBottomSheet } from "@/components/add-member-bottom-sheet";
import { Typography } from "@/components/typography/typography";
import { FamilyMember, useFamilyMembers } from "@/hooks/use-family-members";
import { supabase } from "@/lib/supabase";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  ArrowLeft,
  BriefcaseMedical,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  Home,
  Plus,
  ShoppingCart,
  User,
  UserPlus,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type JoinRequest = {
  id: string;
  family_id: string;
  user_id: string;
  requester_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  mapped_member_id?: string | null;
};

type FamilyMemberOption = {
  id: string;
  full_name: string;
  relation: string | null;
  dob: string | null;
  blood_group: string | null;
  avatar_url: string | null;
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: (a: boolean) => React.ReactNode };

const NAV: NavItem[] = [
  { id: "home",    label: "Home",    icon: (a) => <Home        size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
  { id: "records", label: "Records", icon: (a) => <FileText    size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
  { id: "orders",  label: "Orders",  icon: (a) => <ShoppingCart size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
  { id: "profile", label: "Profile", icon: (a) => <User        size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

// ─── Member Card ─────────────────────────────────────────────────────────────

const MemberCard = ({ member }: { member: FamilyMember }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 52, height: 52, borderRadius: 9999, overflow: "hidden", flexShrink: 0 }}>
        <Image source={{ uri: member.avatar }} style={{ width: 52, height: 52 }} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Typography variant="body" color="heading" className="font-bold" style={{ fontSize: 17 }}>
          {member.name}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
          <Typography variant="body-small" color="secondary">
            {member.relation} · {member.age} yrs
          </Typography>
          <View style={{ backgroundColor: member.bloodBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
            <Typography variant="body-small" className="font-bold" style={{ fontSize: 11, color: member.bloodColor }}>
              {member.bloodGroup}
            </Typography>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
    </View>

    <View style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 12, width: "100%" }} />

    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <CalendarDays size={14} color="#9CA3AF" strokeWidth={1.8} />
        <Typography variant="body-small" color="secondary" style={{ fontSize: 12 }}>
          Last consult: {member.lastConsult}
        </Typography>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Folder size={14} color="#9CA3AF" strokeWidth={1.8} />
        <Typography variant="body-small" color="secondary" style={{ fontSize: 12 }}>
          {member.records} Records
        </Typography>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Join Request Card ────────────────────────────────────────────────────────

const JoinRequestCard = ({
  request,
  onPress,
}: {
  request: JoinRequest;
  onPress: (req: JoinRequest) => void;
}) => {
  const isPending = request.status === "pending";

  const statusColor = request.status === "approved" ? "#15803D" : request.status === "rejected" ? "#B91C1C" : "#069594";
  const statusBg   = request.status === "approved" ? "#DCFCE7" : request.status === "rejected" ? "#FEE2E2"  : "#E0F4F4";
  const statusText = request.status === "pending" ? "Review →" : request.status;

  return (
    <TouchableOpacity
      activeOpacity={isPending ? 0.82 : 1}
      onPress={() => isPending && onPress(request)}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: isPending ? 1.5 : 1,
        borderColor: isPending ? "#A3D6D5" : "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Initials avatar */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 9999,
            backgroundColor: "#E0F4F4",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Typography variant="body" color="primary" className="font-bold" style={{ fontSize: 15 }}>
            {getInitials(request.requester_name || "?")}
          </Typography>
        </View>

        <View style={{ flex: 1 }}>
          <Typography variant="body" color="heading" className="font-bold" style={{ fontSize: 16 }}>
            {request.requester_name || "Unknown requester"}
          </Typography>
          <Typography variant="body-small" color="secondary" className="mt-1">
            {isPending ? "Wants to join your family" : "Sent a join request"}
          </Typography>
        </View>

        {/* Status badge */}
        <View style={{ backgroundColor: statusBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 }}>
          <Typography variant="body-small" className="font-bold capitalize" style={{ color: statusColor, fontSize: 11 }}>
            {statusText}
          </Typography>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "#F3F4F6", marginVertical: 10 }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body-small" color="secondary">
          {new Date(request.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </Typography>
        {isPending && (
          <Typography variant="body-small" color="primary" className="font-bold" style={{ fontSize: 11 }}>
            Tap to accept or deny
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Join Request Bottom Sheet ────────────────────────────────────────────────

type JoinRequestSheetProps = {
  familyId: string;
  onHandled: () => void;
};

// We expose openWithRequest via a custom ref shape
type JoinRequestSheetRef = BottomSheetModal & {
  openWithRequest: (req: JoinRequest) => void;
};

const JoinRequestSheet = React.forwardRef<JoinRequestSheetRef, JoinRequestSheetProps>(
  ({ familyId, onHandled }, ref) => {
    const snapPoints = useMemo(() => ["88%"], []);
    const innerRef = useRef<BottomSheetModal>(null);

    const [request, setRequest]               = useState<JoinRequest | null>(null);
    const [memberOptions, setMemberOptions]   = useState<FamilyMemberOption[]>([]);
    const [selectedId, setSelectedId]         = useState<string | null>(null); // null = "none of these"
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [accepting, setAccepting]           = useState(false);
    const [denying, setDenying]               = useState(false);

    // Expose openWithRequest to parent via forwarded ref
    React.useImperativeHandle(ref, () => ({
      ...(innerRef.current as any),
      openWithRequest: async (req: JoinRequest) => {
        setRequest(req);
        setSelectedId(req.mapped_member_id ?? null);
        setLoadingOptions(true);

        const { data } = await supabase
          .from("family_members")
          .select("id, full_name, relation, dob, blood_group, avatar_url")
          .eq("family_id", familyId)
          .order("created_at", { ascending: true });

        setMemberOptions((data as FamilyMemberOption[]) || []);
        setLoadingOptions(false);
        innerRef.current?.present();
      },
    }));

    const dismiss = useCallback(() => innerRef.current?.dismiss(), []);

   const handleDeny = async () => {
  if (!request) return;
  setDenying(true);
  await supabase
    .from("join_requests")
    .update({ status: "rejected" })  // ✅ update instead of delete
    .eq("id", request.id);
  setDenying(false);
  dismiss();
  onHandled();
};


const handleAccept = async () => {
  if (!request) return;
  setAccepting(true);

  try {
    // ✅ Just a plain select — no .update() here
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", request.user_id)
      .maybeSingle();

    if (selectedId) {
      await supabase
        .from("family_members")
        .update({
          user_id: request.user_id,
          ...(profile && {
            full_name:     profile.full_name     || undefined,
            dob:           profile.dob           || undefined,
            blood_group:   profile.blood_group   || undefined,
            gender:        profile.gender        || undefined,
            avatar_url:    profile.avatar_url    || undefined,
            height_cm:     profile.height_cm     || undefined,
            weight_kg:     profile.weight_kg     || undefined,
            medical_notes: profile.medical_notes || undefined,
          }),
        })
        .eq("id", selectedId);
    } else {
      await supabase.from("family_members").insert({
        family_id:     request.family_id,
        user_id:       request.user_id,
        full_name:     profile?.full_name    || request.requester_name,
        relation:      "Member",
        dob:           profile?.dob          ?? null,
        blood_group:   profile?.blood_group  ?? null,
        gender:        profile?.gender       ?? null,
        avatar_url:    profile?.avatar_url   ?? null,
        height_cm:     profile?.height_cm    ?? null,
        weight_kg:     profile?.weight_kg    ?? null,
        medical_notes: profile?.medical_notes ?? null,
      });
    }

    // ✅ Update join_request status to approved
    await supabase
      .from("join_requests")
      .update({ status: "accepted" })
      .eq("id", request.id);

    dismiss();
    onHandled();
  } catch (err) {
    console.error("Accept error:", err);
  } finally {
    setAccepting(false);
  }
};



    return (
      <BottomSheetModal
        ref={innerRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#FFFFFF" }}
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Sheet Header ── */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 8,
              marginBottom: 20,
            }}
          >
            <Typography variant="h3" color="heading">
              Join Request
            </Typography>
            <TouchableOpacity
              onPress={dismiss}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "#F3F4F6",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* ── Requester Banner ── */}
          {request && (
            <View
              style={{
                backgroundColor: "#F0FAF9",
                borderRadius: 18,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#A3D6D5",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 54, height: 54, borderRadius: 27,
                  backgroundColor: "#069594",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Typography variant="body" color="white" className="font-bold" style={{ fontSize: 18 }}>
                  {getInitials(request.requester_name)}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body" color="heading" className="font-bold" style={{ fontSize: 17 }}>
                  {request.requester_name}
                </Typography>
                <Typography variant="body-small" color="secondary">
                  wants to join your family
                </Typography>
                <Typography variant="body-small" color="secondary" style={{ marginTop: 2 }}>
                  {new Date(request.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Typography>
              </View>
            </View>
          )}

          {/* ── Question ── */}
          <Typography variant="body" color="heading" className="font-bold" style={{ marginBottom: 4 }}>
            Who is this person in your family?
          </Typography>
          <Typography variant="body-small" color="secondary" style={{ marginBottom: 18, lineHeight: 20 }}>
            Select the matching member below — or choose "None of these" to add them as a new member.
          </Typography>

          {loadingOptions ? (
            <ActivityIndicator color="#069594" style={{ marginVertical: 32 }} />
          ) : (
            <>
              {/* ── Member Options ── */}
              {memberOptions.map((member) => {
                const isSelected = selectedId === member.id;
                const age = getAge(member.dob);

                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => setSelectedId(isSelected ? null : member.id)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isSelected ? "#F0FAF9" : "#FFFFFF",
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? "#069594" : "#E5E7EB",
                      gap: 14,
                    }}
                  >
                    {/* Avatar */}
                    <View style={{ width: 52, height: 52, borderRadius: 26, overflow: "hidden", flexShrink: 0 }}>
                      {member.avatar_url ? (
                        <Image source={{ uri: member.avatar_url }} style={{ width: 52, height: 52 }} />
                      ) : (
                        <View
                          style={{
                            width: 52, height: 52,
                            backgroundColor: "#E0F4F4",
                            alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Typography variant="body" color="primary" className="font-bold" style={{ fontSize: 16 }}>
                            {getInitials(member.full_name)}
                          </Typography>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Typography variant="body" color="heading" className="font-bold" style={{ fontSize: 16 }}>
                        {member.full_name}
                      </Typography>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <Typography variant="body-small" color="secondary">
                          {member.relation || "Member"}
                        </Typography>
                        {age !== null && (
                          <Typography variant="body-small" color="secondary">· {age} yrs</Typography>
                        )}
                        {member.blood_group && (
                          <View style={{ backgroundColor: "#FEF2F2", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                            <Typography variant="body-small" className="font-bold" style={{ fontSize: 11, color: "#DC2626" }}>
                              {member.blood_group}
                            </Typography>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Radio */}
                    <View
                      style={{
                        width: 26, height: 26, borderRadius: 13,
                        backgroundColor: isSelected ? "#069594" : "#F3F4F6",
                        alignItems: "center", justifyContent: "center",
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: "#E5E7EB",
                      }}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* ── None of These ── */}
              <TouchableOpacity
                onPress={() => setSelectedId(null)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: selectedId === null ? "#F0FAF9" : "#FFFFFF",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 28,
                  borderWidth: selectedId === null ? 2 : 1,
                  borderColor: selectedId === null ? "#069594" : "#E5E7EB",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 52, height: 52, borderRadius: 26,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <UserPlus size={22} color="#6B7280" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="body" color="heading" className="font-bold" style={{ fontSize: 16 }}>
                    None of these
                  </Typography>
                  <Typography variant="body-small" color="secondary">
                    Add as a new family member
                  </Typography>
                </View>
                <View
                  style={{
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: selectedId === null ? "#069594" : "#F3F4F6",
                    alignItems: "center", justifyContent: "center",
                    borderWidth: selectedId === null ? 0 : 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  {selectedId === null && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              {/* ── Action Buttons ── */}
              <View style={{ gap: 10 }}>
                {/* Accept */}
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={accepting || denying}
                  activeOpacity={0.88}
                  style={{
                    height: 56,
                    borderRadius: 9999,
                    backgroundColor: "#069594",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: accepting || denying ? 0.7 : 1,
                  }}
                >
                  {accepting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Typography variant="button" color="white" className="font-bold" style={{ fontSize: 16 }}>
                      ✓ Accept & Add to Family
                    </Typography>
                  )}
                </TouchableOpacity>

                {/* Deny */}
                <TouchableOpacity
                  onPress={handleDeny}
                  disabled={accepting || denying}
                  activeOpacity={0.88}
                  style={{
                    height: 56,
                    borderRadius: 9999,
                    backgroundColor: "#FEF2F2",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#FECACA",
                    opacity: accepting || denying ? 0.7 : 1,
                  }}
                >
                  {denying ? (
                    <ActivityIndicator color="#DC2626" />
                  ) : (
                    <Typography variant="button" className="font-bold" style={{ fontSize: 16, color: "#DC2626" }}>
                      ✕ Deny Request
                    </Typography>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

JoinRequestSheet.displayName = "JoinRequestSheet";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ManageFamilyScreen() {
  const [activeNav, setActiveNav]         = useState("home");
  const [joinRequests, setJoinRequests]   = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const addMemberSheetRef    = useRef<BottomSheetModal>(null);
  const joinRequestSheetRef  = useRef<JoinRequestSheetRef>(null);

  const { members, familyId, inviteCode, familyName, loading, refetch } = useFamilyMembers();

  // ── Fetch join requests ──
  const fetchJoinRequests = useCallback(async (fid: string) => {
    setRequestsLoading(true);
    const { data, error } = await supabase
      .from("join_requests")
      .select("id, family_id, user_id, requester_name, status, created_at, mapped_member_id")
      .eq("family_id", fid)
      .order("created_at", { ascending: false });

    if (error) console.error("Failed to fetch join requests", error);
    setJoinRequests((data as JoinRequest[]) || []);
    setRequestsLoading(false);
  }, []);

  useEffect(() => {
    if (familyId) fetchJoinRequests(familyId);
    else setRequestsLoading(false);
  }, [familyId, fetchJoinRequests]);

  // ── Handlers ──
  const handleCardPress = (request: JoinRequest) => {
    joinRequestSheetRef.current?.openWithRequest(request);
  };

  const handleRequestHandled = async () => {
    if (familyId) await fetchJoinRequests(familyId);
    await refetch();
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F2F5F7",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F7" />

      {/* ── Header ── */}
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

      {/* ── Scrollable Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 130 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#069594" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Invite Code Banner */}
            {inviteCode ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#E0F4F4",
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: "#A3D6D5",
                }}
              >
                <View>
                  <Typography variant="body-small" color="primary" className="font-bold mb-1 uppercase tracking-wider">
                    Family Invite Code
                  </Typography>
                  <Typography variant="h3" color="heading" style={{ letterSpacing: 2 }}>
                    {inviteCode}
                  </Typography>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: "#069594",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onPress={() => console.log("Copied:", inviteCode)}
                >
                  <Copy size={16} color="#FFFFFF" />
                  <Typography variant="body-small" color="white" className="font-bold">Copy</Typography>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Join Requests Section */}
            <View style={{ marginBottom: 6 }}>
              <Typography variant="body-small" color="primary" className="font-bold mb-2 uppercase tracking-wider">
                Join Requests
              </Typography>

              {requestsLoading ? (
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 18 }}>
                  <Typography variant="body-small" color="secondary">Loading requests...</Typography>
                </View>
              ) : joinRequests.length > 0 ? (
                joinRequests.map((request) => (
                  <JoinRequestCard key={request.id} request={request} onPress={handleCardPress} />
                ))
              ) : (
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 18 }}>
                  <Typography variant="body-small" color="secondary">No pending join requests right now.</Typography>
                </View>
              )}
            </View>

            {/* Members Count */}
            <Typography variant="body" color="secondary" className="mb-6 font-medium">
              {members.length} members in {familyName || "your family"}
            </Typography>

            {/* Member Cards */}
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}

            {/* Add New Member */}
            <TouchableOpacity
              onPress={() => addMemberSheetRef.current?.present()}
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
                marginTop: 10,
              }}
            >
              <View
                style={{
                  width: 44, height: 44, borderRadius: 9999,
                  backgroundColor: "#069594",
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 10,
                  shadowColor: "#069594",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
                }}
              >
                <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Typography variant="body" color="primary" className="font-bold">+ Add New Member</Typography>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Bottom Navigation ── */}
      <View
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1, borderTopColor: "#E5E7EB",
          flexDirection: "row", alignItems: "flex-end",
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          paddingTop: 10,
          shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.07, shadowRadius: 12, elevation: 20, zIndex: 50,
        }}
      >
        {NAV.slice(0, 2).map((item) => {
          const active = activeNav === item.id;
          return (
            <TouchableOpacity key={item.id} onPress={() => setActiveNav(item.id)} activeOpacity={0.7} style={{ flex: 1, alignItems: "center" }}>
              {item.icon(active)}
              <Typography variant="body-small" color={active ? "primary" : "secondary"} className={active ? "font-bold mt-1" : "mt-1"} style={{ fontSize: 10 }}>
                {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}

        <View style={{ flex: 1, alignItems: "center" }}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              width: 62, height: 62, borderRadius: 9999,
              backgroundColor: "#069594",
              alignItems: "center", justifyContent: "center",
              marginTop: -30, borderWidth: 4, borderColor: "#FFFFFF",
              shadowColor: "#069594", shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38, shadowRadius: 14, elevation: 14,
            }}
          >
            <BriefcaseMedical size={26} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Typography variant="body-small" color="secondary" className="mt-1" style={{ fontSize: 10 }}>Consult</Typography>
        </View>

        {NAV.slice(2).map((item) => {
          const active = activeNav === item.id;
          return (
            <TouchableOpacity key={item.id} onPress={() => setActiveNav(item.id)} activeOpacity={0.7} style={{ flex: 1, alignItems: "center" }}>
              {item.icon(active)}
              <Typography variant="body-small" color={active ? "primary" : "secondary"} className={active ? "font-bold mt-1" : "mt-1"} style={{ fontSize: 10 }}>
                {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Bottom Sheets ── */}
      <AddMemberBottomSheet
        ref={addMemberSheetRef}
        familyId={familyId}
        onMemberAdded={refetch}
      />

      <JoinRequestSheet
        ref={joinRequestSheetRef}
        familyId={familyId}
        onHandled={handleRequestHandled}
      />
    </SafeAreaView>
  );
}