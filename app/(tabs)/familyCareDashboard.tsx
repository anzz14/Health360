import { Typography } from "@/components/typography/typography";
import { useAuth } from "@/context/auth-context";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";
import {
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    FlaskConical,
    Home,
    MapPin,
    Pill,
    Plus,
    ShoppingCart,
    User,
    Video,
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
  icon: (active: boolean) => React.ReactNode;
};

import { useFamilyMembers } from "@/hooks/use-family-members";
import { useUserProfile } from "@/hooks/use-user-profile";

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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Family member avatar card */
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
      {member.avatar ? (
        <Image
          source={{ uri: member.avatar }}
          style={{ width: 72, height: 72 }}
        />
      ) : member.isMe ? (
        <User size={28} color={active ? "#fff" : "#94A3B8"} strokeWidth={2} />
      ) : (
        <User size={28} color={active ? "#fff" : "#94A3B8"} strokeWidth={2} />
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

/** Quick action bento card */
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

/** Create Family Card – shown inside the Family Members section when no family */
const CreateFamilyCard = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: "#A3D6D5",
      borderStyle: "dashed",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }}
  >
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#E0F4F4",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}
    >
      <Plus size={24} color="#069594" strokeWidth={2} />
    </View>
    <View style={{ flex: 1 }}>
      <Typography variant="body" color="heading" className="font-bold">
        Create Your Family
      </Typography>
      <Typography variant="body-small" color="secondary" className="mt-0.5">
        Add members, manage records & more
      </Typography>
    </View>
    <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [activeMember, setActiveMember] = useState("me");
  const [activeNav, setActiveNav] = useState("home");
  const [displayName, setDisplayName] = useState("there");
  const [currentUserProfileId, setCurrentUserProfileId] = useState<
    string | null
  >(null);
  const { session } = useAuth();
  const router = useRouter();
  const { loadProfile } = useUserProfile();
  const { avatarUrl, uploading, error, pickAndUpload, setAvatarUrl } =
    useAvatarUpload();

  const { familyId, members, loading: familyLoading } = useFamilyMembers();

  // ✅ Load user's display name from the new 'profiles' table
  useEffect(() => {
    let isMounted = true;

    const loadDisplayName = async () => {
      const user = session?.user;
      if (!user) {
        if (isMounted) setDisplayName("there");
        return;
      }

      // Query profiles using auth_user_id (not id)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile name:", error);
        if (isMounted) setDisplayName("there");
        return;
      }

      const name =
        data?.full_name?.trim() || user.email?.split("@")[0] || "there";
      if (isMounted) setDisplayName(name);
      if (isMounted) setCurrentUserProfileId(data?.id ?? null);
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };

    loadDisplayName();

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    const seedAvatar = async () => {
      const result = await loadProfile();
      if (result.success && result.data?.avatarUrl) {
        setAvatarUrl(result.data.avatarUrl);
      }
    };

    seedAvatar();
  }, [loadProfile, setAvatarUrl]);

  const persistAvatarUrl = async (publicUrl: string) => {
    const profileId = currentUserProfileId;
    if (!profileId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profileId);

    if (error) {
      console.error("[DashboardAvatar]", error);
    }
  };

  const handleHeaderAvatarPress = async () => {
    const result = await pickAndUpload();
    if (!result) return;

    setAvatarUrl(result.publicUrl);
    await persistAvatarUrl(result.publicUrl);
  };

  // Map hook members to the compact shape used by MemberCard
  const displayMembers: FamilyMember[] = members.map((m) => ({
    id: m.id,
    label: m.name,
    avatar: m.avatar,
    isMe: m.relation === "Self",
  }));

  // Ensure there's a sensible default selected member once data loads
  useEffect(() => {
    if (!displayMembers || displayMembers.length === 0) return;
    const ids = displayMembers.map((d) => d.id);
    if (!ids.includes(activeMember)) setActiveMember(displayMembers[0].id);
  }, [displayMembers, activeMember]);

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

  if (familyLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F2F5F7",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#069594" />
      </SafeAreaView>
    );
  }

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
        {/* ──────────────────────────────────────────────────────────────────────
            A. HEADER (always shown)
        ────────────────────────────────────────────────────────────────────── */}
        <View className="flex-row justify-between items-center px-6 mt-6">
          <View>
            <Typography variant="body-small" color="secondary">
              Welcome back,
            </Typography>
            <Typography variant="h2" color="heading">
              Hello, {displayName}
            </Typography>
          </View>
          <View style={{ position: "relative" }}>
            <Link href={"/(tabs)/profile"} asChild>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={uploading}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 9999,
                  overflow: "hidden",
                  borderWidth: 2.5,
                  borderColor: "rgba(6,149,148,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#069594" />
                ) : avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: 52, height: 52 }}
                  />
                ) : (
                  <Image
                    source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                    style={{ width: 48, height: 48 }}
                  />
                )}
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              onPress={handleHeaderAvatarPress}
              disabled={uploading}
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#069594",
                borderWidth: 2,
                borderColor: "#F2F5F7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={10} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ──────────────────────────────────────────────────────────────────────
            B. FAMILY MEMBERS SECTION
            - If user has a family → show horizontal scroll + "View All"
            - Else → show Create Family card (no "View All")
        ────────────────────────────────────────────────────────────────────── */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Typography variant="h3" color="heading">
              Family Members
            </Typography>

            {familyId && (
              <TouchableOpacity activeOpacity={0.7}>
                <Link href={"/(tabs)/manageFamily"}>
                  <Typography
                    variant="body-small"
                    color="primary"
                    className="font-bold"
                  >
                    View All
                  </Typography>
                </Link>
              </TouchableOpacity>
            )}
          </View>

          {familyId ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 0 }}
            >
              {displayMembers.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  active={activeMember === m.id}
                  onPress={() => setActiveMember(m.id)}
                />
              ))}

              {/* Add member button (only for families) */}
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
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
          ) : (
            <View style={{ paddingHorizontal: 24 }}>
              <CreateFamilyCard
                onPress={() => router.push("/(tabs)/onboarding/familyInfo")}
              />
            </View>
          )}
        </View>

        {/* ──────────────────────────────────────────────────────────────────────
            C. QUICK ACTIONS (always shown)
        ────────────────────────────────────────────────────────────────────── */}
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

        {/* ──────────────────────────────────────────────────────────────────────
            D. UPCOMING APPOINTMENTS (always shown)
        ────────────────────────────────────────────────────────────────────── */}
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
    </SafeAreaView>
  );
}
