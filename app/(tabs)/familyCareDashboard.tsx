import { Typography } from "@/components/typography/typography";
import {
  BriefcaseMedical,
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

// We'll fetch real members using the shared hook from ManageFamily
import { useFamilyMembers } from "@/hooks/use-family-members";

// NOTE: We map the hook's `FamilyMember` to the lightweight shape used by
// the UI to avoid changing MemberCard.

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
        // shadow
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

/** Quick action bento card — strictly w-[48%] */
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
    {/* Icon container */}
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

    {/* Text */}
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
  const [activeMember, setActiveMember] = useState("me");
  const [activeNav, setActiveNav] = useState("home");
  const { members } = useFamilyMembers();

  // Map hook members to the compact shape used by the MemberCard
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
        {/* ════════════════════════════════════════════════════════════════════
            A. HEADER
            ════════════════════════════════════════════════════════════════════ */}
        <View className="flex-row justify-between items-center px-6 mt-6">
          {/* Left: greeting */}
          <View>
            <Typography variant="body-small" color="secondary">
              Welcome back,
            </Typography>
            <Typography variant="h2" color="heading">
              Hello, Alex
            </Typography>
          </View>

          {/* Right: avatar + online dot */}
          <View style={{ position: "relative" }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 9999,
                overflow: "hidden",
                borderWidth: 2.5,
                borderColor: "rgba(6,149,148,0.2)",
              }}
            >
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=33" }}
                style={{ width: 48, height: 48 }}
              />
            </View>
            {/* Status dot */}
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

        {/* ════════════════════════════════════════════════════════════════════
            B. FAMILY MEMBERS
            ════════════════════════════════════════════════════════════════════ */}
        <View className="mt-8">
          {/* Row header */}
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Typography variant="h3" color="heading">
              Family Members
            </Typography>
            <TouchableOpacity activeOpacity={0.7}>
              <Typography
                variant="body-small"
                color="primary"
                className="font-bold"
              >
                View All
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Horizontal scroll — padding-left 24 px, trailing space via paddingRight */}
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

            {/* Add button */}
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
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            C. QUICK ACTIONS — Bento grid (strict w-[48%])
            ════════════════════════════════════════════════════════════════════ */}
        <View className="mt-8 px-6">
          <Typography variant="h3" color="heading" className="mb-4">
            Quick Actions
          </Typography>

          {/* Row 1 */}
          <View className="flex-row justify-between mb-4">
            <ActionCard action={quickActions[0]} />
            <ActionCard action={quickActions[1]} />
          </View>
          {/* Row 2 */}
          <View className="flex-row justify-between">
            <ActionCard action={quickActions[2]} />
            <ActionCard action={quickActions[3]} />
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            D. UPCOMING APPOINTMENTS
            ════════════════════════════════════════════════════════════════════ */}
        <View className="mt-8 px-6">
          {/* Row header */}
          <View className="flex-row justify-between items-center mb-4">
            <Typography variant="h3" color="heading">
              Upcoming Appointments
            </Typography>

            {/* Active badge */}
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

          {/* Appointment card */}
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
            {/* Date block */}
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

            {/* Details */}
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

              {/* Time & room row */}
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

            {/* Chevron */}
            <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
          </View>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════
          E. CUSTOM BOTTOM NAVIGATION
          ════════════════════════════════════════════════════════════════════ */}
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
        {/* Left two tabs: Home, Records */}
        {NAV.slice(0, 2).map((item) => {
          const isActive = activeNav === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveNav(item.id)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center" }}
            >
              {item.icon(isActive)}
              <Typography
                variant="body-small"
                color={isActive ? "primary" : "secondary"}
                className={`mt-1 ${isActive ? "font-bold" : ""}`}
                style={{ fontSize: 10 }}
              >
                {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}

        {/* Center FAB — Consult */}
        <View style={{ flex: 1, alignItems: "center", position: "relative" }}>
          {/* The FAB breaks up out of the nav bar */}
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
                marginTop: -32, // floats above the bar
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

        {/* Right two tabs: Orders, Profile */}
        {NAV.slice(2).map((item) => {
          const isActive = activeNav === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveNav(item.id)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center" }}
            >
              {item.icon(isActive)}
              <Typography
                variant="body-small"
                color={isActive ? "primary" : "secondary"}
                className={`mt-1 ${isActive ? "font-bold" : ""}`}
                style={{ fontSize: 10 }}
              >
                {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
