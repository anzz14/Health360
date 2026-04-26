import {
  ArrowLeft,
  BriefcaseMedical,
  CalendarDays,
  ChevronRight,
  FileText,
  Folder,
  Home,
  Plus,
  ShoppingCart,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { Typography } from "@/components/typography/typography";

// ─── Types ────────────────────────────────────────────────────────────────────
type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  bloodGroup: string;
  lastConsult: string;
  records: number;
  avatar: string;
  bloodColor: string;
  bloodBg: string;
};

// ─── Static Data ──────────────────────────────────────────────────────────────
const MEMBERS: FamilyMember[] = [
  {
    id: "1",
    name: "Rajesh Sharma",
    relation: "Self",
    age: 42,
    bloodGroup: "O+",
    lastConsult: "Oct 12",
    records: 15,
    avatar: "https://i.pravatar.cc/150?img=12",
    bloodColor: "#DC2626",
    bloodBg: "#FEF2F2",
  },
  {
    id: "2",
    name: "Sunita Sharma",
    relation: "Wife",
    age: 39,
    bloodGroup: "B+",
    lastConsult: "Sep 28",
    records: 8,
    avatar: "https://i.pravatar.cc/150?img=47",
    bloodColor: "#DC2626",
    bloodBg: "#FEF2F2",
  },
  {
    id: "3",
    name: "Rohan Sharma",
    relation: "Son",
    age: 8,
    bloodGroup: "B+",
    lastConsult: "Aug 15",
    records: 12,
    avatar: "https://i.pravatar.cc/150?img=30",
    bloodColor: "#DC2626",
    bloodBg: "#FEF2F2",
  },
  {
    id: "4",
    name: "Priya Sharma",
    relation: "Daughter",
    age: 4,
    bloodGroup: "B+",
    lastConsult: "Oct 05",
    records: 4,
    avatar: "https://i.pravatar.cc/150?img=44",
    bloodColor: "#DC2626",
    bloodBg: "#FEF2F2",
  },
];

// ─── Nav items ────────────────────────────────────────────────────────────────
type NavItem = { id: string; label: string; icon: (a: boolean) => React.ReactNode };
const NAV: NavItem[] = [
  { id: "home",    label: "Home",    icon: (a) => <Home     size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
  { id: "records", label: "Records", icon: (a) => <FileText size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
  { id: "orders",  label: "Orders",  icon: (a) => <ShoppingCart size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
  { id: "profile", label: "Profile", icon: (a) => <User     size={22} color={a ? "#069594" : "#9CA3AF"} strokeWidth={2} /> },
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
    {/* ── Top row: avatar | info | chevron ── */}
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* Avatar */}
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

      {/* Name + meta */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Typography variant="body" color="heading" className="font-bold" style={{ fontSize: 17 }}>
          {member.name}
        </Typography>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
          <Typography variant="body-small" color="secondary">
            {member.relation} · {member.age} yrs
          </Typography>

          {/* Blood group badge */}
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

      {/* Chevron */}
      <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
    </View>

    {/* ── Divider ── */}
    <View
      style={{
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 12,
        width: "100%",
      }}
    />

    {/* ── Bottom row: last consult | records ── */}
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      {/* Last consult */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <CalendarDays size={14} color="#9CA3AF" strokeWidth={1.8} />
        <Typography variant="body-small" color="secondary" style={{ fontSize: 12 }}>
          Last consult: {member.lastConsult}
        </Typography>
      </View>

      {/* Records */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Folder size={14} color="#9CA3AF" strokeWidth={1.8} />
        <Typography variant="body-small" color="secondary" style={{ fontSize: 12 }}>
          {member.records} Records
        </Typography>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ManageFamilyScreen() {
  const [activeNav, setActiveNav] = useState("home");

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F2F5F7",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F7" />

      {/* ── Header (outside scroll so it stays pinned) ── */}
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
          paddingTop: 8,
          paddingBottom: 130, // clears FAB + nav bar
        }}
      >
        {/* Subtitle */}
        <Typography variant="body" color="secondary" className="mb-6">
          4 members in The Sharma Family
        </Typography>

        {/* Member cards */}
        {MEMBERS.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}

        {/* ── Add New Member ── */}
        <TouchableOpacity
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
          {/* Teal circle with + */}
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
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION
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
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 20,
          zIndex: 50,
        }}
      >
        {/* Left pair: Home, Records */}
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

        {/* Centre slot — FAB floats above */}
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
              marginTop: -30,           // floats above the nav bar
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

        {/* Right pair: Orders, Profile */}
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
    </SafeAreaView>
  );
}