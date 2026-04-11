import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  Home,
  Plus,
  ShoppingCart,
  Stethoscope,
  User,
} from "lucide-react-native";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type BloodGroup = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  bloodGroup: BloodGroup;
  lastConsult: string;
  records: number;
  initials: string;
};

type NavItem = {
  key: string;
  label: string;
  active: boolean;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAMILY: FamilyMember[] = [
  {
    id: "1",
    name: "Rajesh Sharma",
    relation: "Self",
    age: 42,
    bloodGroup: "O+",
    lastConsult: "Oct 12",
    records: 15,
    initials: "RS",
  },
  {
    id: "2",
    name: "Sunita Sharma",
    relation: "Wife",
    age: 39,
    bloodGroup: "B+",
    lastConsult: "Sep 28",
    records: 8,
    initials: "SS",
  },
  {
    id: "3",
    name: "Rohan Sharma",
    relation: "Son",
    age: 8,
    bloodGroup: "B+",
    lastConsult: "Aug 15",
    records: 12,
    initials: "RO",
  },
  {
    id: "4",
    name: "Priya Sharma",
    relation: "Daughter",
    age: 4,
    bloodGroup: "B+",
    lastConsult: "Oct 05",
    records: 4,
    initials: "PS",
  },
];

const NAV: NavItem[] = [
  { key: "home", label: "Home", active: true },
  { key: "records", label: "Records", active: false },
  { key: "consult", label: "Consult", active: false },
  { key: "orders", label: "Orders", active: false },
  { key: "profile", label: "Profile", active: false },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <View className="w-12 h-12 rounded-full bg-slate-400 items-center justify-center">
      <Text className="text-sm font-bold text-white">{initials}</Text>
    </View>
  );
}

// ─── Blood Badge ──────────────────────────────────────────────────────────────

function BloodBadge({ group }: { group: BloodGroup }) {
  return (
    <View className="bg-red-100 rounded-full px-2 py-0.5">
      <Text className="text-[10px] font-bold text-red-700">{group}</Text>
    </View>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onPress,
}: {
  member: FamilyMember;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-white rounded-xl p-4 shadow-sm"
      style={{ elevation: 2 }}
    >
      {/* Top row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Avatar initials={member.initials} />
          <View className="gap-0.5">
            <Text className="text-base font-bold text-[#1A2B4B]">
              {member.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-[#4E5E81]">
                {member.relation} · {member.age} yrs
              </Text>
              <BloodBadge group={member.bloodGroup} />
            </View>
          </View>
        </View>
        <ChevronRight size={16} color="#CBD5E1" />
      </View>

      {/* Divider + bottom stats */}
      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-50">
        <View className="flex-row items-center gap-1">
          <Calendar size={12} color="#4E5E81" />
          <Text className="text-[11px] text-[#4E5E81]">
            Last consult: {member.lastConsult}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <FolderOpen size={12} color="#4E5E81" />
          <Text className="text-[11px] text-[#4E5E81]">
            {member.records} Records
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Nav Icon ─────────────────────────────────────────────────────────────────

function NavIcon({ itemKey, active }: { itemKey: string; active: boolean }) {
  const color = active ? "#2ECC8B" : "#94A3B8";
  switch (itemKey) {
    case "home":
      return <Home size={20} color={color} />;
    case "records":
      return <FileText size={20} color={color} />;
    case "consult":
      return <Stethoscope size={20} color={color} />;
    case "orders":
      return <ShoppingCart size={20} color={color} />;
    case "profile":
      return <User size={20} color={color} />;
    default:
      return null;
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ManageFamilyScreen() {
  const handleMember = (id: string) => console.log("Open member:", id);
  const handleAddMember = () => console.log("Add new member");
  const handleBack = () => console.log("Go back");

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-4 h-16 bg-white">
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#1A2B4B" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-[#1A2B4B]">
          Manage Family
        </Text>
        {/* Spacer keeps title centred */}
        <View className="w-5" />
      </View>

      {/* ── Body ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text className="text-sm font-medium text-[#4E5E81] mb-4">
          {FAMILY.length} members in The Sharma Family
        </Text>

        {/* Member Cards */}
        <View className="gap-4">
          {FAMILY.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onPress={() => handleMember(member.id)}
            />
          ))}

          {/* Add New Member Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddMember}
            className="h-28 rounded-xl border-2 border-dashed border-emerald-300/50 bg-emerald-50/20 items-center justify-center gap-2"
          >
            <View className="w-10 h-10 rounded-full bg-[#2DC97E] items-center justify-center">
              <Plus size={18} color="#fff" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-bold text-emerald-500">
              + Add New Member
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom Navigation ── */}
      <View className="absolute bottom-0 left-0 right-0 h-[76px] flex-row items-center justify-between px-6 pb-3 bg-white/90 border-t border-slate-200">
        {NAV.map((item) => {
          if (item.key === "consult") {
            return (
              <View key={item.key} className="items-center gap-1 -mt-7">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="w-14 h-14 rounded-full bg-[#2ECC8B] items-center justify-center border-4 border-[#F8FDFB]"
                  style={{
                    shadowColor: "#2ECC8B",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 15,
                    elevation: 8,
                  }}
                >
                  <Stethoscope size={24} color="#fff" />
                </TouchableOpacity>
                <Text className="text-[10px] font-medium text-slate-400">
                  {item.label}
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              className="items-center gap-1"
            >
              <NavIcon itemKey={item.key} active={item.active} />
              <Text
                className={`text-[10px] ${
                  item.active
                    ? "font-bold text-[#2ECC8B]"
                    : "font-medium text-slate-400"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
