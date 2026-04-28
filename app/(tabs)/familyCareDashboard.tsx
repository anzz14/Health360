import { Typography } from "@/components/typography/typography";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  BriefcaseMedical,
  ChevronRight,
  Clock,
  CreditCard,
  FlaskConical,
  Home,
  MapPin,
  Pill,
  Plus,
  ShoppingCart,
  User,
  Users,
  Video
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
type FamilyMember = {
  id: string;
  label: string;
  avatar?: string;
  isMe?: boolean;
};

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  dark?: boolean;
};

type NavItem = {
  id: string;
  label: string;
  route: string;
  icon: (active: boolean) => React.ReactNode;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const MemberCard = ({
  member,
  active,
  onPress,
}: {
  member: FamilyMember;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{ alignItems: "center", marginRight: 16 }}
  >
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? "#069594" : "#FFFFFF",
        borderWidth: active ? 0 : 1,
        borderColor: "#E5E7EB",
        shadowColor: active ? "#069594" : "#000",
        shadowOffset: { width: 0, height: active ? 6 : 1 },
        shadowOpacity: active ? 0.28 : 0.05,
        shadowRadius: active ? 10 : 2,
        elevation: active ? 6 : 1,
      }}
    >
      {member.isMe ? (
        <User size={28} color={active ? "#fff" : "#94A3B8"} strokeWidth={2} />
      ) : member.avatar ? (
        <Image
          source={{ uri: member.avatar }}
          style={{ width: 72, height: 72 }}
        />
      ) : (
        <Typography variant="h3" color={active ? "white" : "primary"}>
          {member.label.charAt(0)}
        </Typography>
      )}
    </View>
    <Typography
      variant="body-small"
      color={active ? "heading" : "secondary"}
      className={`mt-2 ${active ? "font-bold" : "font-medium"}`}
    >
      {member.label}
    </Typography>
  </TouchableOpacity>
);

const ActionCard = ({ action }: { action: QuickAction }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={{
      width: "48%",
      backgroundColor: action.dark ? "#1A2B4B" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      minHeight: 140,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: action.dark ? 8 : 1 },
      shadowOpacity: action.dark ? 0.18 : 0.06,
      shadowRadius: action.dark ? 14 : 3,
      elevation: action.dark ? 6 : 2,
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: action.iconBg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {action.icon}
    </View>
    <Typography
      variant="body"
      color={action.dark ? "white" : "heading"}
      className="font-bold mt-3 mb-1"
    >
      {action.title}
    </Typography>
    <Typography
      variant="body-small"
      color={action.dark ? "white" : "secondary"}
      className={action.dark ? "opacity-70" : ""}
    >
      {action.subtitle}
    </Typography>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);
  const [primaryName, setPrimaryName] = useState("");
  const [primaryAvatar, setPrimaryAvatar] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeMember, setActiveMember] = useState("me");

  const NAV: NavItem[] = [
    {
      id: "home",
      label: "Home",
      route: "/(tabs)/familyCareDashboard",
      icon: (a) => (
        <Home size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
      ),
    },
    {
      id: "records",
      label: "Manage",
      route: "/(tabs)/manageFamily",
      icon: (a) => (
        <Users size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
      ),
    },
    {
      id: "orders",
      label: "Orders",
      route: "/(tabs)/familyCareDashboard",
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
      route: "/(tabs)/userDetail",
      icon: (a) => (
        <User size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} />
      ),
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: "consult",
      title: "Consult Doctor",
      subtitle: "Video call available",
      icon: <Video size={22} color="#3B82F6" strokeWidth={2} />,
      iconBg: "#EFF6FF",
    },
    {
      id: "lab",
      title: "Book Lab Test",
      subtitle: "Home sample pickup",
      icon: <FlaskConical size={22} color="#069594" strokeWidth={2} />,
      iconBg: "#E0F4F4",
    },
    {
      id: "medicine",
      title: "Order Medicine",
      subtitle: "Refill prescription",
      icon: <Pill size={20} color="#F97316" strokeWidth={2} />,
      iconBg: "#FFF7ED",
    },
    {
      id: "emergency",
      title: "Emergency Card",
      subtitle: "One tap assistance",
      icon: <CreditCard size={22} color="#fff" strokeWidth={2} />,
      iconBg: "rgba(255,255,255,0.15)",
      dark: true,
    },
  ];

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_family_id, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) setPrimaryName(profile.full_name.split(" ")[0]);
        if (profile?.avatar_url) setPrimaryAvatar(profile.avatar_url);

        if (profile?.active_family_id) {
          setHasFamily(true);
          const { data: membersData } = await supabase
            .from("family_members")
            .select("id, full_name, avatar_url, relationship")
            .eq("family_id", profile.active_family_id);

          if (membersData) {
            const mappedMembers = membersData.map((m: any) => ({
              id: m.id,
              label:
                m.relationship === "Self" ? "Me" : m.full_name.split(" ")[0],
              avatar: m.avatar_url,
              isMe: m.relationship === "Self",
            }));

            mappedMembers.sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : 0));
            setFamilyMembers(mappedMembers);
            if (mappedMembers.length > 0) setActiveMember(mappedMembers[0].id);
          }
        } else {
          setHasFamily(false);
          // If no family, just show a "Me" card
          setFamilyMembers([{ id: "me", label: "Me", isMe: true }]);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#069594" />
      </View>
    );

  // ─── DASHBOARD ───
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F2F5F7",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F7" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center px-6 mt-6 mb-4">
          <View>
            <Typography variant="body-small" color="secondary">
              Welcome back,
            </Typography>
            <Typography variant="h2" color="heading">
              Hello, {primaryName || "User"}
            </Typography>
          </View>
          <View style={{ position: "relative" }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 9999,
                overflow: "hidden",
                borderWidth: 2.5,
                borderColor: "rgba(6,149,148,0.2)",
                backgroundColor: "#E6F7F7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {primaryAvatar ? (
                <Image
                  source={{ uri: primaryAvatar }}
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <Typography variant="h3" color="primary">
                  {primaryName.charAt(0) || "U"}
                </Typography>
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 13,
                height: 13,
                borderRadius: 9999,
                backgroundColor: "#069594",
                borderWidth: 2,
                borderColor: "#F2F5F7",
              }}
            />
          </View>
        </View>

        {/* SETUP NUDGE (Only shows if they haven't created a family yet) */}
        {!hasFamily && (
          <View className="px-6 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/familyInfo")}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#E0F4F4",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Typography variant="subtitle" color="heading" className="mb-1">
                  Complete Setup
                </Typography>
                <Typography variant="body-small" color="secondary">
                  Create or join a family to unlock full medical profiles.
                </Typography>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#069594",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight color="#fff" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* FAMILY MEMBERS SCROLL */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Typography variant="h3" color="heading">
              Family Members
            </Typography>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  hasFamily ? "/(tabs)/manageFamily" : "/(tabs)/familyInfo",
                )
              }
              activeOpacity={0.7}
            >
              <Typography
                variant="body-small"
                color="primary"
                className="font-bold"
              >
                Manage All
              </Typography>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 0 }}
          >
            {familyMembers.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                active={activeMember === m.id}
                onPress={() => setActiveMember(m.id)}
              />
            ))}
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    hasFamily ? "/(tabs)/manageFamily" : "/(tabs)/familyInfo",
                  )
                }
                activeOpacity={0.7}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "#CBD5E1",
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                }}
              >
                <Plus size={20} color="#94A3B8" strokeWidth={2} />
              </TouchableOpacity>
              <Typography
                variant="body-small"
                color="secondary"
                className="mt-2 font-medium"
              >
                Add
              </Typography>
            </View>
          </ScrollView>
        </View>

        {/* QUICK ACTIONS */}
        <View className="mt-8 px-6">
          <Typography variant="h3" color="heading" className="mb-4">
            Quick Actions
          </Typography>
          <View className="flex-row justify-between mb-4">
            <ActionCard action={quickActions[0]} />
            <ActionCard action={quickActions[1]} />
          </View>
          <View className="flex-row justify-between">
            <ActionCard action={quickActions[2]} />
            <ActionCard action={quickActions[3]} />
          </View>
        </View>

        {/* UPCOMING APPOINTMENTS */}
        <View className="mt-8 px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Typography variant="h3" color="heading">
              Upcoming Appointments
            </Typography>
            <View
              style={{
                backgroundColor: "#E0F4F4",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Typography
                variant="body-small"
                color="primary"
                className="font-bold"
                style={{ fontSize: 11 }}
              >
                1 ACTIVE
              </Typography>
            </View>
          </View>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 60,
                backgroundColor: "#F2F5F7",
                borderRadius: 14,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
                flexShrink: 0,
              }}
            >
              <Typography
                variant="body-small"
                color="secondary"
                className="font-semibold"
                style={{ fontSize: 11, letterSpacing: 0.5 }}
              >
                OCT
              </Typography>
              <Typography
                variant="h2"
                color="heading"
                className="font-bold"
                style={{ lineHeight: 32 }}
              >
                12
              </Typography>
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" color="heading" className="font-bold">
                Dr. Sarah Jenkins
              </Typography>
              <Typography
                variant="body-small"
                color="secondary"
                className="mt-0.5"
              >
                Cardiologist · General Checkup
              </Typography>
              <View className="flex-row items-center mt-2" style={{ gap: 12 }}>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Clock size={13} color="#069594" strokeWidth={2} />
                  <Typography
                    variant="body-small"
                    color="secondary"
                    style={{ fontSize: 11 }}
                  >
                    09:30 AM
                  </Typography>
                </View>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <MapPin size={13} color="#069594" strokeWidth={2} />
                  <Typography
                    variant="body-small"
                    color="secondary"
                    style={{ fontSize: 11 }}
                  >
                    Room 402
                  </Typography>
                </View>
              </View>
            </View>
            <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
          </View>
        </View>
      </ScrollView>

      {/* CUSTOM BOTTOM NAVIGATION */}
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
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 16,
        }}
      >
        {NAV.slice(0, 2).map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center" }}
          >
            {item.icon(item.id === "home")}
            <Typography
              variant="body-small"
              color={item.id === "home" ? "primary" : "secondary"}
              className={`mt-1 ${item.id === "home" ? "font-bold" : ""}`}
              style={{ fontSize: 10 }}
            >
              {item.label}
            </Typography>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1, alignItems: "center", position: "relative" }}>
          <View style={{ alignItems: "center", marginBottom: 2 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                width: 60,
                height: 60,
                borderRadius: 9999,
                backgroundColor: "#069594",
                alignItems: "center",
                justifyContent: "center",
                marginTop: -32,
                borderWidth: 4,
                borderColor: "#FFFFFF",
                shadowColor: "#069594",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
                elevation: 12,
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
        </View>
        {NAV.slice(2).map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center" }}
          >
            {item.icon(false)}
            <Typography
              variant="body-small"
              color="secondary"
              className="mt-1"
              style={{ fontSize: 10 }}
            >
              {item.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
