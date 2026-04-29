import { AddMemberBottomSheet } from "@/components/add-member-bottom-sheet";
import { Typography } from "@/components/typography/typography";
import { FamilyMember, useFamilyMembers } from "@/hooks/use-family-members";
import { supabase } from "@/lib/supabase";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  ArrowLeft,
  BriefcaseMedical,
  CalendarDays,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  Home,
  Plus,
  ShoppingCart,
  User,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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

type JoinRequest = {
  id: string;
  family_id: string;
  requester_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

// ─── Nav items ────────────────────────────────────────────────────────────────
type NavItem = {
  id: string;
  label: string;
  icon: (a: boolean) => React.ReactNode;
};


const NAV: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: (a) => (
      <Home size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
    ),
  },
  {
    id: "records",
    label: "Records",
    icon: (a) => (
      <FileText size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
    ),
  },
  {
    id: "orders",
    label: "Orders",
    icon: (a) => (
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
    icon: (a) => (
      <User size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
    ),
  },
];

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
          source={{ uri: member.avatar }}
          style={{ width: 52, height: 52 }}
        />
      </View>

      <View style={{ flex: 1, marginLeft: 14 }}>
        <Typography
          variant="body"
          color="heading"
          className="font-bold"
          style={{ fontSize: 17 }}
        >
          {member.name}
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
            {member.relation} · {member.age} yrs
          </Typography>

          <View
            style={{
              backgroundColor: member.bloodBg,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Typography
              variant="body-small"
              className="font-bold"
              style={{ fontSize: 11, color: member.bloodColor }}
            >
              {member.bloodGroup}
            </Typography>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
    </View>

    <View
      style={{
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 12,
        width: "100%",
      }}
    />

    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <CalendarDays size={14} color="#9CA3AF" strokeWidth={1.8} />
        <Typography
          variant="body-small"
          color="secondary"
          style={{ fontSize: 12 }}
        >
          Last consult: {member.lastConsult}
        </Typography>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Folder size={14} color="#9CA3AF" strokeWidth={1.8} />
        <Typography
          variant="body-small"
          color="secondary"
          style={{ fontSize: 12 }}
        >
          {member.records} Records
        </Typography>
      </View>
    </View>
  </TouchableOpacity>
);

const JoinRequestCard = ({ request }: { request: JoinRequest }) => {
  const statusColor =
    request.status === "approved"
      ? "#15803D"
      : request.status === "rejected"
        ? "#B91C1C"
        : "#B45309";
  const statusBg =
    request.status === "approved"
      ? "#DCFCE7"
      : request.status === "rejected"
        ? "#FEE2E2"
        : "#FEF3C7";

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
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
          <User size={22} color="#069594" strokeWidth={2.2} />
        </View>

        <View style={{ flex: 1 }}>
          <Typography
            variant="body"
            color="heading"
            className="font-bold"
            style={{ fontSize: 16 }}
          >
            {request.requester_name || "Unknown requester"}
          </Typography>
          <Typography variant="body-small" color="secondary" className="mt-1">
            Sent a join request
          </Typography>
        </View>

        <View
          style={{
            backgroundColor: statusBg,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
          }}
        >
          <Typography
            variant="body-small"
            className="font-bold capitalize"
            style={{ color: statusColor, fontSize: 11 }}
          >
            {request.status}
          </Typography>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: "#E5E7EB",
          marginVertical: 12,
          width: "100%",
        }}
      />

      <Typography variant="body-small" color="secondary">
        Requested on {new Date(request.created_at).toLocaleDateString()}
      </Typography>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ManageFamilyScreen() {
  const [activeNav, setActiveNav] = useState("home");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Use the hook to fetch the joined data & invite code!
  const { members, familyId, inviteCode, familyName, loading, refetch } =
    useFamilyMembers();

  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!familyId) {
        setJoinRequests([]);
        setRequestsLoading(false);
        return;
      }

      setRequestsLoading(true);

      const { data, error } = await supabase
        .from("join_requests")
        .select("id,family_id,requester_name,status,created_at")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch join requests", error);
        setJoinRequests([]);
        setRequestsLoading(false);
        return;
      }

      setJoinRequests((data as JoinRequest[]) || []);
      setRequestsLoading(false);
    };

    fetchJoinRequests();
  }, [familyId]);

  const handleAddMemberPress = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.present();
    }
  };

  const handleMemberAdded = async () => {
    // Refetch the members list to show the newly added member
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

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 130, // clears FAB + nav bar
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
            {/* ── INVITE CODE BANNER ── */}
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
                  style={{
                    backgroundColor: "#069594",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onPress={() => {
                    // Optional: Add clipboard logic here
                    console.log("Copied:", inviteCode);
                  }}
                >
                  <Copy size={16} color="#FFFFFF" />
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

            {/* Join Requests */}
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
                    backgroundColor: "#FFFFFF",
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
                joinRequests.map((request) => (
                  <JoinRequestCard key={request.id} request={request} />
                ))
              ) : (
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
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

            {/* Subtitle */}
            <Typography
              variant="body"
              color="secondary"
              className="mb-6 font-medium"
            >
              {members.length} members in {familyName || "your family"}
            </Typography>

            {/* Member cards */}
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}

            {/* ── Add New Member ── */}
            <TouchableOpacity
              onPress={handleAddMemberPress}
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
                <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Typography variant="body" color="primary" className="font-bold">
                + Add New Member
              </Typography>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── BOTTOM NAVIGATION ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
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
              borderColor: "#FFFFFF",
              shadowColor: "#069594",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38,
              shadowRadius: 14,
              elevation: 14,
            }}
          >
            <BriefcaseMedical size={26} color="#FFFFFF" strokeWidth={2} />
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

      <AddMemberBottomSheet
        ref={bottomSheetRef}
        familyId={familyId}
        onMemberAdded={handleMemberAdded}
      />
    </SafeAreaView>
  );
}
