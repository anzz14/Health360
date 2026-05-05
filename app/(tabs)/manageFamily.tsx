import { AddMemberBottomSheet } from "@/components/add-member-bottom-sheet";
import { Typography } from "@/components/typography/typography";
import { FamilyMember, useFamilyMembers } from "@/hooks/use-family-members";
import { useKickFamilyMember } from "@/hooks/use-kick-family-member";
import { useAcceptJoinRequest } from "@/hooks/useAcceptJoinRequest";
import { supabase } from "@/lib/supabase";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Link, useRouter } from "expo-router";
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
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from "lucide-react-native";
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
  Modal,
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
  auth_user_id: string;
  requester_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  mapped_profile_id?: string | null;
};

type MemberOption = {
  id: string;
  full_name: string;
  relation: string | null;
  dob: string | null;
  blood_group: string | null;
  avatar_url: string | null;
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV = [
  {
    id: "home",
    label: "Home",
    icon: (a: boolean) => (
      <Home size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
    ),
  },
  {
    id: "records",
    label: "Records",
    icon: (a: boolean) => (
      <FileText size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
    ),
  },
  {
    id: "orders",
    label: "Orders",
    icon: (a: boolean) => (
      <ShoppingCart
        size={22}
        color={a ? "#069594" : "#9CA3AF"}
        strokeWidth={2}
      />
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (a: boolean) => (
      <User size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getAge = (dob: string | null): number | null => {
  if (!dob) return null;
  return Math.abs(
    new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970,
  );
};

// ─── Change Admin Sheet ───────────────────────────────────────────────────────

type ChangeAdminSheetProps = {
  familyId: string;
  currentAdminUserId: string | null;
  members: FamilyMember[];
  onTransferred: () => void;
};

const ChangeAdminSheet = React.forwardRef<
  BottomSheetModal,
  ChangeAdminSheetProps
>(({ familyId, currentAdminUserId, members, onTransferred }, ref) => {
  const snapPoints = useMemo(() => ["60%"], []);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  const eligibleMembers = members.filter(
    (m) => m.userId && m.userId !== currentAdminUserId,
  );

  const dismiss = useCallback(() => {
    if (ref && "current" in ref) ref.current?.dismiss();
  }, [ref]);

  const handleTransfer = async () => {
    if (!selectedUserId) return;
    setTransferring(true);
    try {
      const { data, error } = await supabase.rpc("transfer_admin", {
        p_family_id: familyId,
        p_new_admin_user_id: selectedUserId,
      });

      if (error || data?.error) {
        Alert.alert(
          "Error",
          error?.message ?? data?.error ?? "Transfer failed",
        );
        return;
      }

      setSelectedUserId(null);
      dismiss();
      onTransferred();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Something went wrong");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFF" }}
      handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 8,
            marginBottom: 8,
          }}
        >
          <Typography variant="h3" color="heading">
            Change Admin
          </Typography>
          <TouchableOpacity
            onPress={dismiss}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Typography
          variant="body-small"
          color="secondary"
          style={{ marginBottom: 24, lineHeight: 20 }}
        >
          Select a member to become the new admin. Only members with an app
          account can be admin.
        </Typography>

        {eligibleMembers.length === 0 ? (
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <ShieldCheck size={32} color="#9CA3AF" strokeWidth={1.5} />
            <Typography
              variant="body-small"
              color="secondary"
              style={{ marginTop: 12, textAlign: "center", lineHeight: 20 }}
            >
              No other members have an app account yet. They need to join via
              invite code first.
            </Typography>
          </View>
        ) : (
          <>
            {eligibleMembers.map((m) => {
              const selected = selectedUserId === m.userId;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedUserId(selected ? null : m.userId!)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: selected ? "#F0FAF9" : "#FFF",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? "#069594" : "#E5E7EB",
                    gap: 14,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 9999,
                      overflow: "hidden",
                      backgroundColor: "#E0F4F4",
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
                      <Typography
                        variant="body"
                        color="primary"
                        className="font-bold"
                        style={{ fontSize: 16 }}
                      >
                        {getInitials(m.name)}
                      </Typography>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Typography
                      variant="body"
                      color="heading"
                      className="font-bold"
                      style={{ fontSize: 16 }}
                    >
                      {m.name}
                    </Typography>
                    <Typography variant="body-small" color="secondary">
                      {m.relation}
                      {m.age !== "--" ? ` · ${m.age} yrs` : ""}
                    </Typography>
                  </View>

                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: selected ? "#069594" : "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: selected ? 0 : 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    {selected && (
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={handleTransfer}
              disabled={!selectedUserId || transferring}
              activeOpacity={0.88}
              style={{
                height: 56,
                borderRadius: 9999,
                backgroundColor: "#069594",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
                opacity: !selectedUserId || transferring ? 0.5 : 1,
              }}
            >
              {transferring ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Typography
                  variant="button"
                  color="white"
                  className="font-bold"
                  style={{ fontSize: 16 }}
                >
                  Confirm Transfer
                </Typography>
              )}
            </TouchableOpacity>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ChangeAdminSheet.displayName = "ChangeAdminSheet";

// ─── Member Card (with permission check) ─────────────────────────────────────

const MemberCard = ({
  m,
  isAdmin,
  adminUserId,
  currentUserId,
  onKick,
  isKicking,
}: {
  m: FamilyMember;
  isAdmin: boolean;
  adminUserId: string | null;
  currentUserId?: string | null;
  onKick?: (member: FamilyMember) => void;
  isKicking?: boolean;
}) => {
  const router = useRouter();
  const isThisAdmin = !!m.userId && m.userId === adminUserId;
  const canKick = isAdmin && !isThisAdmin && m.relation !== "Self";

  const canViewProfile = isAdmin || (m.userId && m.userId === currentUserId);

  const handlePress = () => {
    if (canViewProfile) {
      router.push(`/manageFamily/Memberdetailprofile?memberId=${m.id}`);
    } else {
      Alert.alert("Access Denied", "You can only view your own profile.");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={canViewProfile ? 0.9 : 1}
      onPress={handlePress}
      style={{ marginBottom: 14 }}
    >
      <View
        style={{
          backgroundColor: "#FFF",
          borderRadius: 20,
          padding: 16,
          marginBottom: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: isThisAdmin ? 1.5 : 0,
          borderColor: isThisAdmin ? "#A3D6D5" : "transparent",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 9999,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image
              source={{ uri: m.avatar }}
              style={{ width: 52, height: 52 }}
            />
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="body"
                color="heading"
                className="font-bold"
                style={{ fontSize: 17 }}
              >
                {m.name}
              </Typography>
              {isThisAdmin && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    backgroundColor: "#E0F4F4",
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <ShieldCheck size={11} color="#069594" strokeWidth={2.5} />
                  <Typography
                    variant="body-small"
                    className="font-bold"
                    style={{ fontSize: 10, color: "#069594" }}
                  >
                    Admin
                  </Typography>
                </View>
              )}
            </View>

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
                  {m.bloodGroup}
                </Typography>
              </View>
            </View>

            {!m.userId && (
              <Typography
                variant="body-small"
                color="muted"
                style={{ fontSize: 10, marginTop: 3 }}
              >
                No app account
              </Typography>
            )}
          </View>
          <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
          {/* {canKick ? (
            <TouchableOpacity
              onPress={() => onKick?.(m)}
              disabled={isKicking}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: "#FECACA",
                opacity: isKicking ? 0.65 : 1,
              }}
            >
              <Typography
                variant="body-small"
                className="font-bold"
                style={{ fontSize: 11, color: "#DC2626" }}
              >
                Remove
              </Typography>
            </TouchableOpacity>
          ) : (
            <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
          )} */}
        </View>

        <View
          style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 12 }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CalendarDays size={14} color="#9CA3AF" strokeWidth={1.8} />
            <Typography
              variant="body-small"
              color="secondary"
              style={{ fontSize: 12 }}
            >
              Last consult: {m.lastConsult}
            </Typography>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Folder size={14} color="#9CA3AF" strokeWidth={1.8} />
            <Typography
              variant="body-small"
              color="secondary"
              style={{ fontSize: 12 }}
            >
              {m.records} Records
            </Typography>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Join Request Card ────────────────────────────────────────────────────────

const JoinRequestCard = ({
  req,
  onPress,
}: {
  req: JoinRequest;
  onPress: (r: JoinRequest) => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.82}
    onPress={() => onPress(req)}
    style={{
      backgroundColor: "#FFF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1.5,
      borderColor: "#A3D6D5",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
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
        <Typography
          variant="body"
          color="primary"
          className="font-bold"
          style={{ fontSize: 15 }}
        >
          {getInitials(req.requester_name || "?")}
        </Typography>
      </View>
      <View style={{ flex: 1 }}>
        <Typography
          variant="body"
          color="heading"
          className="font-bold"
          style={{ fontSize: 16 }}
        >
          {req.requester_name || "Unknown"}
        </Typography>
        <Typography variant="body-small" color="secondary" className="mt-1">
          Wants to join your family
        </Typography>
      </View>
      <View
        style={{
          backgroundColor: "#E0F4F4",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 9999,
        }}
      >
        <Typography
          variant="body-small"
          className="font-bold"
          style={{ color: "#069594", fontSize: 11 }}
        >
          Review →
        </Typography>
      </View>
    </View>
    <View
      style={{ height: 1, backgroundColor: "#F3F4F6", marginVertical: 10 }}
    />
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Typography variant="body-small" color="secondary">
        {new Date(req.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Typography>
      <Typography
        variant="body-small"
        color="primary"
        className="font-bold"
        style={{ fontSize: 11 }}
      >
        Tap to accept or deny
      </Typography>
    </View>
  </TouchableOpacity>
);

// ─── Join Request Sheet ───────────────────────────────────────────────────────

type SheetProps = { familyId: string; onHandled: () => void };
type SheetRef = BottomSheetModal & {
  openWithRequest: (r: JoinRequest) => void;
};

const JoinRequestSheet = React.forwardRef<SheetRef, SheetProps>(
  ({ familyId, onHandled }, ref) => {
    const snapPoints = useMemo(() => ["88%"], []);
    const innerRef = useRef<BottomSheetModal>(null);

    const [req, setReq] = useState<JoinRequest | null>(null);
    const [options, setOptions] = useState<MemberOption[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [denying, setDenying] = useState(false);

    const { checkAndAccept, finalizeAccept } = useAcceptJoinRequest();

    React.useImperativeHandle(ref, () => ({
      ...(innerRef.current as any),
      openWithRequest: async (r: JoinRequest) => {
        setReq(r);
        setSelId(null);
        setLoading(true);

        const { data, error } = await supabase
          .from("family_memberships")
          .select(
            `
            profile_id,
            relation,
            profiles ( id, full_name, dob, blood_group, avatar_url )
          `,
          )
          .eq("family_id", familyId)
          .eq("status", "active")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Failed to load members:", error);
          setLoading(false);
          return;
        }

        // Transform to MemberOption[] ( profile_id = id, profile details spread )
        const members: MemberOption[] = (data ?? []).map((row: any) => ({
          id: row.profile_id, // profile id
          full_name: row.profiles?.full_name ?? "Unknown",
          dob: row.profiles?.dob ?? null,
          blood_group: row.profiles?.blood_group ?? null,
          avatar_url: row.profiles?.avatar_url ?? null,
          relation: row.relation,
        }));

        setOptions(members);
        setLoading(false);
        innerRef.current?.present();
      },
    }));

    const dismiss = useCallback(() => innerRef.current?.dismiss(), []);

    const handleDeny = async () => {
      if (!req) return;
      setDenying(true);
      const { error } = await supabase
        .from("join_requests")
        .delete()
        .eq("id", req.id);
      if (error) {
        Alert.alert("Error", `Failed to deny: ${error.message}`);
        setDenying(false);
        return;
      }
      setDenying(false);
      dismiss();
      onHandled();
    };

    const handleAccept = async () => {
      if (!req) return;
      setAccepting(true);
      try {
        if (!selId) {
          // ── No mapping selected → check if user already has a profile ────
          // ✅ Check if user already has a profile (from auth trigger)
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("auth_user_id", req.auth_user_id)
            .maybeSingle();

          const { error } = await supabase.rpc("accept_join_request", {
            p_request_id: req.id,
            p_family_id: req.family_id,
            p_auth_user_id: req.auth_user_id,
            p_relation: "Member",
          });

          if (error) throw new Error(error.message);
        } else {
          // ── Mapping selected → detect scenario first ────────────
          const result = await checkAndAccept({
            id: req.id,
            mapped_profile_id: selId,
            auth_user_id: req.auth_user_id,
          });

          if (result.scenario === "already_linked") {
            Alert.alert(
              "Already Linked",
              "This profile is already connected to an account.",
            );
            return;
          }

          if (result.scenario === "merge_needed") {
            // Show confirmation before merging — destructive operation
            await new Promise<void>((resolve, reject) => {
              Alert.alert(
                "Merge Profiles",
                `${req.requester_name} already has their own account with data.\n\nTheir existing profile will be kept and all records from the dummy profile will be moved to it.\n\nContinue?`,
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => reject(new Error("cancelled")),
                  },
                  {
                    text: "Merge",
                    style: "destructive",
                    onPress: () => resolve(),
                  },
                ],
              );
            });
          }

          await finalizeAccept(
            {
              id: req.id,
              mapped_profile_id: selId,
              auth_user_id: req.auth_user_id,
            },
            result,
          );
        }

        dismiss();
        onHandled();
      } catch (err: any) {
        if (err?.message === "cancelled") return; // user pressed Cancel on merge dialog
        Alert.alert("Error", err?.message ?? "Something went wrong.");
      } finally {
        setAccepting(false);
      }
    };

    const RadioRow = ({
      id,
      label,
      sub,
      avatarUrl,
      onSelect,
    }: {
      id: string | null;
      label: string;
      sub: string;
      avatarUrl?: string | null;
      onSelect: () => void;
    }) => {
      const selected = selId === id;
      return (
        <TouchableOpacity
          onPress={onSelect}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: selected ? "#F0FAF9" : "#FFF",
            borderRadius: 16,
            padding: 14,
            marginBottom: 10,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? "#069594" : "#E5E7EB",
            gap: 14,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              overflow: "hidden",
              backgroundColor: "#E0F4F4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 52, height: 52 }}
              />
            ) : (
              <Typography
                variant="body"
                color="primary"
                className="font-bold"
                style={{ fontSize: 16 }}
              >
                {getInitials(label)}
              </Typography>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              color="heading"
              className="font-bold"
              style={{ fontSize: 16 }}
            >
              {label}
            </Typography>
            <Typography variant="body-small" color="secondary">
              {sub}
            </Typography>
            {selected && id !== null && (
              <Typography
                variant="body-small"
                color="primary"
                style={{ fontSize: 11, marginTop: 3 }}
              >
                ✓ Their profile data will replace this record
              </Typography>
            )}
          </View>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: selected ? "#069594" : "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: selected ? 0 : 1,
              borderColor: "#E5E7EB",
            }}
          >
            {selected && <Check size={14} color="#FFF" strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <BottomSheetModal
        ref={innerRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#FFF" }}
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
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
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {req && (
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
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: "#069594",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="body"
                  color="white"
                  className="font-bold"
                  style={{ fontSize: 18 }}
                >
                  {getInitials(req.requester_name || "?")}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography
                  variant="body"
                  color="heading"
                  className="font-bold"
                  style={{ fontSize: 17 }}
                >
                  {req.requester_name}
                </Typography>
                <Typography variant="body-small" color="secondary">
                  wants to join your family
                </Typography>
                <Typography
                  variant="body-small"
                  color="secondary"
                  style={{ marginTop: 2 }}
                >
                  {new Date(req.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Typography>
              </View>
            </View>
          )}

          <Typography
            variant="body"
            color="heading"
            className="font-bold"
            style={{ marginBottom: 4 }}
          >
            Who is this person in your family?
          </Typography>
          <Typography
            variant="body-small"
            color="secondary"
            style={{ marginBottom: 18, lineHeight: 20 }}
          >
            Select a member to link their account — or "None of these" to add
            fresh.
          </Typography>

          {loading ? (
            <ActivityIndicator color="#069594" style={{ marginVertical: 32 }} />
          ) : (
            <>
              {options.map((m) => {
                const a = getAge(m.dob);
                const sub = [
                  m.relation || "Member",
                  a ? `${a} yrs` : null,
                  m.blood_group,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <RadioRow
                    key={m.id}
                    id={m.id}
                    label={m.full_name}
                    sub={sub}
                    avatarUrl={m.avatar_url}
                    onSelect={() => setSelId(selId === m.id ? null : m.id)}
                  />
                );
              })}
              <View style={{ marginBottom: 28 }}>
                <RadioRow
                  id={null}
                  label="None of these"
                  sub="Add as a brand-new family member"
                  onSelect={() => setSelId(null)}
                />
              </View>
              <View style={{ gap: 10 }}>
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
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Typography
                      variant="button"
                      color="white"
                      className="font-bold"
                      style={{ fontSize: 16 }}
                    >
                      {selId
                        ? "✓  Accept & Replace Profile"
                        : "✓  Accept & Add to Family"}
                    </Typography>
                  )}
                </TouchableOpacity>
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
                    <Typography
                      variant="button"
                      className="font-bold"
                      style={{ fontSize: 16, color: "#DC2626" }}
                    >
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
  },
);

JoinRequestSheet.displayName = "JoinRequestSheet";

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ManageFamilyScreen() {
  const [activeNav, setActiveNav] = useState("home");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [pendingKickMember, setPendingKickMember] =
    useState<FamilyMember | null>(null);

  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const addMemberRef = useRef<BottomSheetModal>(null);
  const joinRequestRef = useRef<SheetRef>(null);
  const changeAdminRef = useRef<BottomSheetModal>(null);

  const {
    members,
    familyId,
    inviteCode,
    familyName,
    loading,
    isAdmin,
    refetch,
  } = useFamilyMembers();
  const { kickMember, kicking } = useKickFamilyMember();

  // Get current logged-in user's ID
  const [adminProfileId, setAdminProfileId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("families")
          .select("admin_profile_id")
          .eq("id", familyId)
          .single();

        if (error) throw error;

        const adminPid = data?.admin_profile_id ?? null;
        setAdminProfileId(adminPid);

        if (adminPid) {
          const { data: profile, error: pErr } = await supabase
            .from("profiles")
            .select("auth_user_id")
            .eq("id", adminPid)
            .maybeSingle();

          if (pErr) {
            console.error("Failed to load admin profile auth_user_id:", pErr);
            setAdminUserId(null);
          } else {
            setAdminUserId(profile?.auth_user_id ?? null);
          }
        } else {
          setAdminUserId(null);
        }
      } catch (err) {
        console.error("Failed to fetch admin profile id:", err);
        setAdminProfileId(null);
        setAdminUserId(null);
      }
    })();
  }, [familyId]);

  // fetch join requests with new column names
  const fetchJoinRequests = useCallback(async (fid: string) => {
    setRequestsLoading(true);
    const { data, error } = await supabase
      .from("join_requests")
      .select(
        "id, family_id, auth_user_id, requester_name, status, created_at, mapped_profile_id",
      ) // ↑ use auth_user_id + mapped_profile_id
      .eq("family_id", fid)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) console.error("[fetchJoinRequests]", error);
    setJoinRequests((data as JoinRequest[]) || []);
    setRequestsLoading(false);
  }, []);

  useEffect(() => {
    if (familyId && isAdmin) fetchJoinRequests(familyId);
    else {
      setJoinRequests([]);
      setRequestsLoading(false);
    }
  }, [familyId, isAdmin, fetchJoinRequests]);

  const handleRequestHandled = useCallback(async () => {
    if (familyId) await fetchJoinRequests(familyId);
    await refetch();
  }, [familyId, fetchJoinRequests, refetch]);

  const handleKickMember = useCallback((member: FamilyMember) => {
    if (member.relation === "Self") return; // member.id is profile.id
    setPendingKickMember(member);
  }, []);

  const confirmKickMember = useCallback(async () => {
    if (!pendingKickMember || !familyId) return;
    const member = pendingKickMember;
    setPendingKickMember(null);
    const result = await kickMember(familyId, member.id); // member.id = profile.id
    if (result.success) await refetch();
    else Alert.alert("Error", result.error ?? "Failed to remove member");
  }, [familyId, kickMember, pendingKickMember, refetch]);

  const handleAdminTransferred = useCallback(async () => {
    await refetch();
    if (familyId) {
      const { data } = await supabase
        .from("families")
        .select("admin_profile_id") // ← new column name
        .eq("id", familyId)
        .single();
      setAdminProfileId(data?.admin_profile_id ?? null);
    }
  }, [familyId, refetch]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F2F5F7",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F7" />

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
          <Link href={"/familyCareDashboard"}>
            <ArrowLeft size={22} color="#1A2B4B" strokeWidth={2.3} />
          </Link>
        </TouchableOpacity>
        <Typography variant="h3" color="heading" style={{ flex: 1 }}>
          {isAdmin ? "Manage Family" : "My Family"}
        </Typography>

        {isAdmin && (
          <TouchableOpacity
            onPress={() => changeAdminRef.current?.present()}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#E0F4F4",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: "#A3D6D5",
            }}
          >
            <ShieldCheck size={14} color="#069594" strokeWidth={2.5} />
            <Typography
              variant="body-small"
              className="font-bold"
              style={{ color: "#069594", fontSize: 12 }}
            >
              Change Admin
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 130,
        }}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#069594"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {isAdmin && inviteCode ? (
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
                  <Typography
                    variant="body-small"
                    color="primary"
                    className="font-bold mb-1 uppercase tracking-wider"
                  >
                    Family Invite Code
                  </Typography>
                  <Typography
                    variant="h3"
                    color="heading"
                    style={{ letterSpacing: 2 }}
                  >
                    {inviteCode}
                  </Typography>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => console.log("Copied:", inviteCode)}
                  style={{
                    backgroundColor: "#069594",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Copy size={16} color="#FFF" />
                  <Typography
                    variant="body-small"
                    color="white"
                    className="font-bold"
                  >
                    Copy
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : null}

            {isAdmin && (
              <View style={{ marginBottom: 6 }}>
                <Typography
                  variant="body-small"
                  color="primary"
                  className="font-bold mb-2 uppercase tracking-wider"
                >
                  Join Requests
                </Typography>
                {requestsLoading ? (
                  <View
                    style={{
                      backgroundColor: "#FFF",
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      marginBottom: 18,
                    }}
                  >
                    <Typography variant="body-small" color="secondary">
                      Loading requests...
                    </Typography>
                  </View>
                ) : joinRequests.length > 0 ? (
                  joinRequests.map((r) => (
                    <JoinRequestCard
                      key={r.id}
                      req={r}
                      onPress={(req) =>
                        joinRequestRef.current?.openWithRequest(req)
                      }
                    />
                  ))
                ) : (
                  <View
                    style={{
                      backgroundColor: "#FFF",
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      marginBottom: 18,
                    }}
                  >
                    <Typography variant="body-small" color="secondary">
                      No pending join requests right now.
                    </Typography>
                  </View>
                )}
              </View>
            )}

            <Typography
              variant="body"
              color="secondary"
              className="mb-6 font-medium"
            >
              {members.length} members in {familyName || "your family"}
            </Typography>

            {members.map((m) => (
              <MemberCard
                key={m.id}
                m={m}
                isAdmin={isAdmin}
                adminUserId={adminUserId}
                currentUserId={currentUserId}
                onKick={handleKickMember}
                isKicking={kicking}
              />
            ))}

            {isAdmin && (
              <TouchableOpacity
                onPress={() => addMemberRef.current?.present()}
                activeOpacity={0.8}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#A3D6D5",
                  backgroundColor: "#F4FAFA",
                  borderRadius: 20,
                  paddingVertical: 28,
                  alignItems: "center",
                  marginTop: 10,
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
                    shadowColor: "#069594",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.28,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Plus size={22} color="#FFF" strokeWidth={2.5} />
                </View>
                <Typography
                  variant="body"
                  color="primary"
                  className="font-bold"
                >
                  + Add New Member
                </Typography>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={!!pendingKickMember}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingKickMember(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFF",
              borderRadius: 24,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <Typography variant="h3" color="heading" className="mb-2">
              Remove Member
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              {pendingKickMember
                ? `Remove ${pendingKickMember.name} from the family? This cannot be undone.`
                : "Remove this member from the family?"}
            </Typography>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setPendingKickMember(null)}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="button"
                  color="heading"
                  className="font-bold"
                >
                  Cancel
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmKickMember}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="button"
                  color="white"
                  className="font-bold"
                >
                  Remove
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          flexDirection: "row",
          alignItems: "flex-end",
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 20,
          zIndex: 50,
        }}
      >
        {NAV.slice(0, 2).map((item) => {
          const active = activeNav === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveNav(item.id)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center" }}
            >
              {item.icon(active)}
              <Typography
                variant="body-small"
                color={active ? "primary" : "secondary"}
                className={active ? "font-bold mt-1" : "mt-1"}
                style={{ fontSize: 10 }}
              >
                {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
        <View style={{ flex: 1, alignItems: "center" }}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              width: 62,
              height: 62,
              borderRadius: 9999,
              backgroundColor: "#069594",
              alignItems: "center",
              justifyContent: "center",
              marginTop: -30,
              borderWidth: 4,
              borderColor: "#FFF",
              shadowColor: "#069594",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38,
              shadowRadius: 14,
              elevation: 14,
            }}
          >
            <BriefcaseMedical size={26} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
          <Typography
            variant="body-small"
            color="secondary"
            className="mt-1"
            style={{ fontSize: 10 }}
          >
            Consult
          </Typography>
        </View>
        {NAV.slice(2).map((item) => {
          const active = activeNav === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveNav(item.id)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center" }}
            >
              {item.icon(active)}
              <Typography
                variant="body-small"
                color={active ? "primary" : "secondary"}
                className={active ? "font-bold mt-1" : "mt-1"}
                style={{ fontSize: 10 }}
              >
                {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {isAdmin && (
        <>
          <AddMemberBottomSheet
            ref={addMemberRef}
            familyId={familyId}
            onMemberAdded={refetch}
          />
          <JoinRequestSheet
            ref={joinRequestRef}
            familyId={familyId}
            onHandled={handleRequestHandled}
          />
          <ChangeAdminSheet
            ref={changeAdminRef}
            familyId={familyId}
            currentAdminUserId={adminUserId}
            members={members}
            onTransferred={handleAdminTransferred}
          />
        </>
      )}
    </SafeAreaView>
  );
}
