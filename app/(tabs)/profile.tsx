import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { useUserProfile } from "@/hooks/use-user-profile";
import { supabase } from "@/lib/supabase";
import {
    ArrowRight,
    Bell,
    Calendar,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    HelpCircle,
    MapPin,
    Menu,
    MessageCircle,
    Pencil,
    ShoppingBag,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEAL = "#069594";

function MenuItem({
  icon,
  iconBg,
  label,
  chevronColor = "#334155",
  last = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  chevronColor?: string;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-4 py-4 ${
        !last ? "border-b border-[#F3F3F4]" : ""
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </View>
        <Text className="text-sm font-bold text-[#334155]">{label}</Text>
      </View>
      <ChevronRight size={16} color={chevronColor} strokeWidth={2} />
    </TouchableOpacity>
  );
}

function MiniAvatar({
  emoji,
  bg,
  zIndex,
}: {
  emoji: string;
  bg: string;
  zIndex: number;
}) {
  return (
    <View
      className="w-10 h-10 rounded-full border-2 border-white items-center justify-center -mr-3"
      style={{ backgroundColor: bg, zIndex }}
    >
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { loadProfile } = useUserProfile();
  const { avatarUrl, uploading, error, pickAndUpload, setAvatarUrl } =
    useAvatarUpload();
  const [displayName, setDisplayName] = useState("Alex Sharma");
  const [phoneNumber] = useState("+91 98765 43210");

  useEffect(() => {
    const loadCurrentProfile = async () => {
      const result = await loadProfile();

      if (result.success && result.data) {
        setDisplayName(result.data.fullName || "Alex Sharma");
        setAvatarUrl(result.data.avatarUrl);
      }
    };

    loadCurrentProfile();
  }, [loadProfile, setAvatarUrl]);

  useEffect(() => {
    if (error) {
      Alert.alert("Photo Error", error);
    }
  }, [error]);

  const persistAvatarUrl = async (publicUrl: string) => {
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user) {
      Alert.alert("Upload Saved", "Photo uploaded, but you are not signed in.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("auth_user_id", data.user.id);

    if (updateError) {
      console.error("[ProfileAvatar]", updateError);
      Alert.alert(
        "Upload Saved",
        "Photo uploaded, but the profile record could not be updated.",
      );
    }
  };

  const handlePickAvatar = async () => {
    const result = await pickAndUpload();

    if (!result) return;

    setAvatarUrl(result.publicUrl);
    await persistAvatarUrl(result.publicUrl);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error logging out", error.message);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-4 h-16 bg-[#F5F7FA] border-b border-[#F5F7FA] shadow-sm">
        <TouchableOpacity className="w-9 h-9 items-center justify-center rounded-full">
          <Menu size={20} color="#334155" strokeWidth={1.8} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#334155]">Health360</Text>
        <TouchableOpacity className="w-9 h-9 items-center justify-center rounded-full">
          <Bell size={20} color="#334155" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View className="bg-white rounded-[25px] shadow-sm items-center px-4 pt-6 pb-5">
          {/* Avatar */}
          <View className="relative mb-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickAvatar}
              disabled={uploading}
              className="w-22 h-22 rounded-full border-4 border-white items-center justify-center shadow-sm overflow-hidden"
              style={{ width: 88, height: 88, backgroundColor: TEAL }}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 88, height: 88 }}
                />
              ) : (
                <Text className="text-3xl font-bold text-white">
                  {displayName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() || "AS"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-white items-center justify-center"
              style={{ backgroundColor: TEAL }}
              disabled={uploading}
            >
              <Pencil size={12} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Name & Phone */}
          <Text className="text-[22px] font-bold text-[#334155] text-center">
            {displayName}
          </Text>
          <Text className="text-sm text-[#334155] mt-1 text-center">
            {phoneNumber}
          </Text>

          {/* Family Admin Badge */}
          <View
            className="flex-row items-center gap-1 rounded-full px-3 py-1 mt-3"
            style={{ backgroundColor: "rgba(118,214,213,0.2)" }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TEAL }}
            />
            <Text className="text-xs font-bold" style={{ color: TEAL }}>
              Family Admin
            </Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            className="mt-4 h-[42px] rounded-full border items-center justify-center"
            style={{
              borderColor: TEAL,
              width: 200,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-sm font-bold" style={{ color: TEAL }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Family Card */}
        <View className="bg-white rounded-[25px] shadow-sm px-4 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-[#334155]">
              Your Family
            </Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <Text className="text-sm font-bold" style={{ color: TEAL }}>
                Manage
              </Text>
              <ArrowRight size={14} color={TEAL} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center">
            <View className="flex-row items-center">
              <MiniAvatar emoji="👩" bg="#f9a8d4" zIndex={3} />
              <MiniAvatar emoji="👨" bg="#93c5fd" zIndex={2} />
              <MiniAvatar emoji="👦" bg="#fcd34d" zIndex={1} />
            </View>
            <Text className="text-sm font-medium text-[#6E7979] ml-5">
              3 Members
            </Text>
          </View>
        </View>

        {/* Health Menu Group */}
        <View className="bg-white rounded-[25px] shadow-sm overflow-hidden">
          <MenuItem
            icon={<Clock size={18} color={TEAL} strokeWidth={1.8} />}
            iconBg="#93F2F2"
            label="My Reminders"
          />
          <MenuItem
            icon={<FileText size={18} color="#334155" strokeWidth={1.8} />}
            iconBg="#DCE2F3"
            label="Medical Records"
          />
          <MenuItem
            icon={<CreditCard size={18} color="#B21620" strokeWidth={1.8} />}
            iconBg="#FFDAD7"
            label="Emergency Cards"
            last
          />
        </View>

        {/* Consultations & Orders Group */}
        <View className="bg-white rounded-[25px] shadow-sm overflow-hidden">
          <MenuItem
            icon={<Calendar size={18} color={TEAL} strokeWidth={1.8} />}
            iconBg="rgba(118,214,213,0.3)"
            label="My Appointments"
          />
          <MenuItem
            icon={<ShoppingBag size={18} color="#334155" strokeWidth={1.8} />}
            iconBg="#DCE2F3"
            label="My Orders"
            last
          />
        </View>

        {/* Account Group */}
        <View className="bg-white rounded-[25px] shadow-sm overflow-hidden">
          <MenuItem
            icon={<MapPin size={18} color="#334155" strokeWidth={1.8} />}
            iconBg="#E2E2E2"
            label="Saved Addresses"
          />
          <MenuItem
            icon={<CreditCard size={18} color="#334155" strokeWidth={1.8} />}
            iconBg="#E2E2E2"
            label="Payment Methods"
            last
          />
        </View>

        {/* Support Group */}
        <View className="bg-white rounded-[25px] shadow-sm overflow-hidden">
          <MenuItem
            icon={<HelpCircle size={18} color="#3E4949" strokeWidth={1.8} />}
            iconBg="#E2E2E2"
            label="Help & FAQ"
            chevronColor="#6E7979"
          />
          <MenuItem
            icon={<MessageCircle size={18} color="#3E4949" strokeWidth={1.8} />}
            iconBg="#E2E2E2"
            label="Contact Support"
            chevronColor="#6E7979"
            last
          />
        </View>

        {/* Footer */}
        <View className="items-center pt-6 pb-4 gap-4">
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-base font-bold text-[#EE2222]">Log Out</Text>
          </TouchableOpacity>
          <Text className="text-xs text-[#6E7979]">v2.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
