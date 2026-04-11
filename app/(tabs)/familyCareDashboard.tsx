import {
  CreditCard,
  FlaskConical,
  Pill,
  Plus,
  User,
  Video,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FamilyMember = {
  id: string;
  name: string;
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
  icon: React.ReactNode;
  active?: boolean;
  isCta?: boolean;
};

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "me", name: "Me", label: "Me", isMe: true },
  {
    id: "mom",
    name: "Mom",
    label: "Mom",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "dad",
    name: "Dad",
    label: "Dad",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "junior",
    name: "Junior",
    label: "Junior",
    avatar: "https://i.pravatar.cc/150?img=30",
  },
];

const MeAvatar = () => (
  <View className="w-12 h-12 rounded-xl bg-[#2ECC8B] items-center justify-center">
    <User size={24} color="#fff" strokeWidth={2} />
  </View>
);

const FamilyMemberCard = ({
  member,
  selected,
  onPress,
}: {
  member: FamilyMember;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="items-center gap-1.5"
    activeOpacity={0.75}
  >
    <View
      className={`w-16 h-16 rounded-2xl items-center justify-center overflow-hidden ${
        selected ? "bg-[#2ECC8B]" : "bg-white border border-[#F1F5F9]"
      }`}
      style={
        selected
          ? {
              shadowColor: "#2ECC8B",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 6,
            }
          : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }
      }
    >
      {member.isMe ? (
        <MeAvatar />
      ) : member.avatar ? (
        <Image
          source={{ uri: member.avatar }}
          className="w-12 h-12 rounded-xl"
        />
      ) : (
        <User size={24} color={selected ? "#fff" : "#94A3B8"} />
      )}
    </View>

    <Text
      className={`text-xs ${
        selected ? "font-bold text-[#1A2E4A]" : "font-medium text-[#475569]"
      }`}
    >
      {member.label}
    </Text>
  </TouchableOpacity>
);

const QuickActionCard = ({ action }: { action: QuickAction }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    className={`flex-1 rounded-2xl p-4 min-h-[125px] ${
      action.dark ? "bg-[#1A2E4A]" : "bg-white border border-[#F1F5F9]"
    }`}
    style={
      action.dark
        ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 6,
          }
        : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }
    }
  >
    <View
      className="w-10 h-10 rounded-xl items-center justify-center mb-3"
      style={{ backgroundColor: action.iconBg }}
    >
      {action.icon}
    </View>

    <Text
      className={`text-sm font-bold mb-1 ${
        action.dark ? "text-white" : "text-slate-800"
      }`}
    >
      {action.title}
    </Text>

    <Text
      className={`text-[10px] ${
        action.dark ? "text-white/70" : "text-slate-500"
      }`}
    >
      {action.subtitle}
    </Text>
  </TouchableOpacity>
);

export default function FamilyCareDashboard() {
  const [selectedMember, setSelectedMember] = useState("me");
  const [activeNav, setActiveNav] = useState("home");

  const quickActions: QuickAction[] = [
    {
      id: "consult",
      title: "Consult Doctor",
      subtitle: "Video call available",
      icon: <Video size={20} color="#3B82F6" strokeWidth={2} />,
      iconBg: "#EFF6FF",
    },
    {
      id: "lab",
      title: "Book Lab Test",
      subtitle: "Home sample pickup",
      icon: <FlaskConical size={20} color="#10B981" strokeWidth={2} />,
      iconBg: "#ECFDF5",
    },
    {
      id: "medicine",
      title: "Order Medicine",
      subtitle: "Refill prescription",
      icon: <Pill size={18} color="#F97316" strokeWidth={2} />,
      iconBg: "#FFF7ED",
    },
    {
      id: "emergency",
      title: "Emergency Card",
      subtitle: "One tap assistance",
      icon: <CreditCard size={20} color="#fff" strokeWidth={2} />,
      iconBg: "rgba(255,255,255,0.2)",
      dark: true,
    },
  ];

  return (
    <>
      <View className="flex-1 bg-[#F8FDFB]">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FDFB" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          className="flex-1"
        >
          <View className="flex-row justify-between items-center px-6 pt-8 pb-4">
            <View>
              <Text className="text-sm font-medium text-slate-500">
                Welcome back,
              </Text>
              <Text className="text-2xl font-bold text-[#1A2E4A]">
                Hello, Alex
              </Text>
            </View>

            <View className="w-12 h-12">
              <View className="w-12 h-12 rounded-full border-2 border-[#2ECC8B]/20 p-0.5">
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=33" }}
                  className="w-10 h-10 rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#2ECC8B] border-2 border-[#F8FDFB]" />
            </View>
          </View>

          <View className="mt-4">
            <View className="flex-row justify-between items-center px-6 mb-3">
              <Text className="text-lg font-bold text-[#1A2E4A]">
                Family Members
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-sm font-semibold text-[#2ECC8B]">
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
              {FAMILY_MEMBERS.map((member) => (
                <FamilyMemberCard
                  key={member.id}
                  member={member}
                  selected={selectedMember === member.id}
                  onPress={() => setSelectedMember(member.id)}
                />
              ))}

              <View className="items-center gap-1.5">
                <TouchableOpacity
                  className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Plus size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>
                <Text className="text-xs font-medium text-slate-400">Add</Text>
              </View>
            </ScrollView>
          </View>

          <View className="mt-8 px-6">
            <Text className="text-lg font-bold text-[#1A2E4A] mb-4">
              Quick Actions
            </Text>

            <View className="gap-4">
              <View className="flex-row gap-4">
                <QuickActionCard action={quickActions[0]} />
                <QuickActionCard action={quickActions[1]} />
              </View>
              <View className="flex-row gap-4">
                <QuickActionCard action={quickActions[2]} />
                <QuickActionCard action={quickActions[3]} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
