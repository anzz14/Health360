import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { useFamilyMembers } from "@/hooks/use-family-members";
import { useKickFamilyMember } from "@/hooks/use-kick-family-member";
import { useUserProfile } from "@/hooks/use-user-profile";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Bell,
    CalendarDays,
    Camera,
    ChevronRight,
    ClipboardList,
    FileText,
    FlaskConical,
    MoreVertical,
    Plus,
    ShieldAlert,
    Syringe,
    Trash2,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MEMBER = {
  name: "Leo Miller",
  relation: "Son",
  age: 8,
  bloodGroup: "B+",
  allergies: 2,
  conditions: 1,
  avatar: null,
  activeCondition: "Type 1 Diabetes",
  healthSummary: [
    { label: "Last Consultation", value: "Oct 12 · Dr. Sarah Jenkins" },
    { label: "Last Lab Test", value: "Oct 5 · CBC" },
    { label: "Active Reminders", value: "3", badge: true },
    { label: "Next Appointment", value: "Oct 28", badge: true, accent: true },
  ],
  recentRecords: [
    {
      id: "1",
      title: "Vaccination Record",
      date: "Oct 2",
      type: "PDF",
      icon: "syringe",
      color: "#069594",
      bg: "rgba(6,149,148,0.10)",
    },
    {
      id: "2",
      title: "Lab Result",
      date: "Sep 28",
      type: "IMG",
      icon: "flask",
      color: "#8B4823",
      bg: "rgba(139,72,35,0.10)",
    },
    {
      id: "3",
      title: "Prescription",
      date: "Sep 15",
      type: "PDF",
      icon: "clipboard",
      color: "#4C56AF",
      bg: "rgba(76,86,175,0.10)",
    },
  ],
};

const QUICK_ACCESS = [
  {
    id: "records",
    label: "Medical Records",
    sub: "24 files",
    iconColor: "#4C56AF",
    iconBg: "rgba(76,86,175,0.10)",
    Icon: FileText,
  },
  {
    id: "appointments",
    label: "Appointments",
    sub: "1 upcoming",
    iconColor: "#069594",
    iconBg: "rgba(6,149,148,0.10)",
    Icon: CalendarDays,
  },
  {
    id: "emergency",
    label: "Emergency Card",
    sub: "Contact info",
    iconColor: "#BA1A1A",
    iconBg: "rgba(255,218,214,0.40)",
    Icon: ShieldAlert,
  },
  {
    id: "reminders",
    label: "Reminders",
    sub: "3 active",
    iconColor: "#341100",
    iconBg: "#FFDBCB",
    Icon: Bell,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const RecordIcon = ({
  type,
  color,
  bg,
}: {
  type: string;
  color: string;
  bg: string;
}) => {
  const Icon =
    type === "syringe"
      ? Syringe
      : type === "flask"
        ? FlaskConical
        : ClipboardList;
  return (
    <View style={[styles.recordIconWrap, { backgroundColor: bg }]}>
      <Icon size={18} color={color} strokeWidth={1.8} />
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MemberDetailProfile() {
  const params = useLocalSearchParams();
  const memberId = (params as any).memberId as string | undefined;
  const router = useRouter();

  const storeMembers = useAppStore((s) => s.members);
  const storeProfile = useAppStore((s) => s.profile);
  const { loadProfile } = useUserProfile();
  const {
    familyId,
    isAdmin,
    members: familyMembers,
    loading: membersLoading,
  } = useFamilyMembers();
  const { kickMember, kicking } = useKickFamilyMember();
  const { avatarUrl, uploading, pickAndUpload, setAvatarUrl } =
    useAvatarUpload();

  const [member, setMember] = useState<any>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [confirmRemoveVisible, setConfirmRemoveVisible] = useState(false);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dropdown animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Get current user ID from auth
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setCurrentUserId(data.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (dropdownVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
      scaleAnim.setValue(0.92);
    }
  }, [dropdownVisible]);

  // Load member data
  useEffect(() => {
    const computeAge = (dob?: string | null) => {
      if (!dob) return "--";
      const d = new Date(dob);
      if (isNaN(d.getTime())) return "--";
      return Math.abs(
        new Date(Date.now() - d.getTime()).getUTCFullYear() - 1970,
      );
    };

    const applyTemplate = (data: any, relation = "Member") => {
      setMember({
        name: data?.name ?? data?.fullName ?? MEMBER.name,
        relation: relation,
        age: data?.age ?? (data?.dob ? computeAge(data.dob) : MEMBER.age),
        bloodGroup: data?.bloodGroup ?? data?.blood_group ?? MEMBER.bloodGroup,
        avatar:
          data?.avatar ?? data?.avatarUrl ?? data?.avatar_url ?? MEMBER.avatar,
        allergies: MEMBER.allergies,
        conditions: MEMBER.conditions,
        activeCondition: MEMBER.activeCondition,
        healthSummary: MEMBER.healthSummary,
        recentRecords: MEMBER.recentRecords,
      });
    };

    (async () => {
      if (memberId) {
        // Prefer familyMembers (provided by useFamilyMembers) which uses profile.id
        const foundInFamily = familyMembers.find((fm) => fm.id === memberId);
        if (foundInFamily) {
          applyTemplate(foundInFamily, foundInFamily.relation);
          return;
        }

        // Fallback: app store members which may use membership id
        const foundInStore = storeMembers.find((mm) => mm.id === memberId);
        if (foundInStore) {
          applyTemplate(foundInStore, foundInStore.relation);
          return;
        }

        // Final fallback: try loading profile by id (profile table)
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, dob, blood_group, avatar_url")
            .eq("id", memberId)
            .maybeSingle();

          if (profile) {
            applyTemplate(
              {
                fullName: profile.full_name,
                dob: profile.dob,
                blood_group: profile.blood_group,
                avatar_url: profile.avatar_url,
              },
              "Member",
            );
            return;
          }
        } catch (e) {
          // ignore and fall through to unknown template
        }

        // Not found anywhere — show placeholder
        applyTemplate(null);
      } else {
        const applyProfile = (p: any) => {
          applyTemplate(
            {
              fullName: p?.fullName,
              dob: p?.dob,
              bloodGroup: p?.bloodGroup,
              avatarUrl: p?.avatarUrl,
            },
            "Self",
          );
        };

        if (storeProfile) {
          applyProfile(storeProfile);
        } else {
          const res = await loadProfile();
          if (res.success && res.data) applyProfile(res.data);
        }
      }
    })();
  }, [memberId, storeMembers, storeProfile, familyMembers, loadProfile]);

  useEffect(() => {
    if (member?.avatar) {
      setAvatarUrl(member.avatar);
    }
  }, [member?.avatar, setAvatarUrl]);

  const persistAvatarUrl = async (publicUrl: string) => {
    if (memberId) {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", memberId);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setMember((prev: any) => (prev ? { ...prev, avatar: publicUrl } : prev));
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      Alert.alert("Error", "You must be logged in to update your photo.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("auth_user_id", authData.user.id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setMember((prev: any) => (prev ? { ...prev, avatar: publicUrl } : prev));
  };

  const handleAvatarPick = async () => {
    const result = await pickAndUpload();
    if (!result) return;
    setAvatarUrl(result.publicUrl);
    await persistAvatarUrl(result.publicUrl);
  };

  // ─── Access control ────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait until we have the member data and family member list
    if (!member || membersLoading) return;

    // Admin can see any member
    if (isAdmin) {
      setAccessGranted(true);
      return;
    }

    // No memberId -> viewing own profile (Self)
    if (!memberId) {
      setAccessGranted(true);
      return;
    }

    // Find the family member record that belongs to the current user
    const currentUserMember = familyMembers.find(
      (fm) => fm.userId === currentUserId,
    );
    const isOwnProfile = currentUserMember?.id === memberId;

    if (isOwnProfile) {
      setAccessGranted(true);
    } else {
      setAccessGranted(false);
    }
  }, [member, memberId, isAdmin, membersLoading, familyMembers, currentUserId]);

  // Can remove: admin only, not self, and we are viewing a member (memberId exists)
  const canRemove = isAdmin && !!memberId && member?.relation !== "Self";

  const handleRemove = async () => {
    if (!memberId || !familyId) return;
    const result = await kickMember(familyId, memberId);
    if (result.success) {
      router.push("/(tabs)/manageFamily");
    } else {
      Alert.alert("Error", result.error ?? "Failed to remove member");
    }
  };

  // Loading / permission states
  if (!member || accessGranted === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#069594" />
        </View>
      </SafeAreaView>
    );
  }

  if (accessGranted === false) {
    return (
      <SafeAreaView style={styles.safe}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <ShieldAlert size={48} color="#DC2626" />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              marginTop: 16,
              color: "#1A2B4B",
            }}
          >
            Access Denied
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            You can only view your own profile.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/manageFamily")}
            style={{
              backgroundColor: "#069594",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Back to Family
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render profile (access granted) ───────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/manageFamily")}
          style={styles.topBarBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#334155" strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Member Profile</Text>

        {canRemove ? (
          <TouchableOpacity
            onPress={() => setDropdownVisible(true)}
            style={styles.topBarBtn}
            activeOpacity={0.7}
          >
            <MoreVertical size={20} color="#334155" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarBtn} />
        )}
      </View>

      {dropdownVisible && (
        <Modal
          transparent
          animationType="none"
          visible
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropdownOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.dropdownContainer,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={[styles.dropdownItem, styles.dropdownItemDanger]}
                    onPress={() => {
                      setDropdownVisible(false);
                      setTimeout(() => setConfirmRemoveVisible(true), 150);
                    }}
                  >
                    <View style={styles.dropdownItemIcon}>
                      <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                    </View>
                    <Text
                      style={[styles.dropdownItemLabel, { color: "#DC2626" }]}
                    >
                      Remove Member
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      <Modal
        visible={confirmRemoveVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRemoveVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Remove Member</Text>
            <Text style={styles.confirmBody}>
              Remove {member.name} from the family? This cannot be undone.
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                onPress={() => setConfirmRemoveVisible(false)}
                activeOpacity={0.85}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setConfirmRemoveVisible(false);
                  handleRemove();
                }}
                activeOpacity={0.85}
                disabled={kicking}
                style={[styles.confirmRemoveBtn, kicking && { opacity: 0.65 }]}
              >
                <Text style={styles.confirmRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroCard}>
          <TouchableOpacity
            onPress={handleAvatarPick}
            activeOpacity={0.85}
            style={styles.avatarWrap}
          >
            {uploading ? (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <ActivityIndicator size="small" color="#069594" />
              </View>
            ) : avatarUrl || member.avatar ? (
              <Image
                source={{ uri: avatarUrl || member.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>
                  {getInitials(member.name)}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={10} color="#FFF" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{member.name}</Text>

          <View style={styles.relationPill}>
            <Text style={styles.relationText}>
              {member.relation} · {member.age} yrs
            </Text>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: "#FFDAD6" }]}>
              <Text style={[styles.chipText, { color: "#93000A" }]}>
                {member.bloodGroup}
              </Text>
            </View>
            <View
              style={[styles.chip, { backgroundColor: "rgba(6,149,148,0.10)" }]}
            >
              <Text style={[styles.chipText, { color: "#069594" }]}>
                {member.allergies} Allergies
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: "#FFDBCB" }]}>
              <Text style={[styles.chipText, { color: "#341100" }]}>
                {member.conditions} Condition
              </Text>
            </View>
          </View>

          <View style={styles.alertStrip}>
            <View style={styles.alertLeft}>
              <View style={styles.alertIconWrap}>
                <Plus size={14} color="#069594" strokeWidth={2.5} />
              </View>
              <Text style={styles.alertText}>{member.activeCondition}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.manageBtn}>
              <Text style={styles.manageBtnText}>Manage →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          {QUICK_ACCESS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.82}
              style={[
                styles.gridCard,
                i % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
              ]}
            >
              <View
                style={[styles.gridIconWrap, { backgroundColor: item.iconBg }]}
              >
                <item.Icon size={20} color={item.iconColor} strokeWidth={1.8} />
              </View>
              <View style={styles.gridTextWrap}>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={styles.gridSub}>{item.sub}</Text>
              </View>
              <View style={styles.gridChevronWrap}>
                <ChevronRight size={14} color="#069594" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Health Summary</Text>
          {member.healthSummary.map((row: any, i: number) => (
            <View
              key={i}
              style={[
                styles.summaryRow,
                i < member.healthSummary.length - 1 && styles.summaryRowBorder,
              ]}
            >
              <Text style={styles.summaryLabel}>{row.label}</Text>
              {row.badge ? (
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{row.value}</Text>
                </View>
              ) : (
                <Text style={styles.summaryValue}>{row.value}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Records</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          {member.recentRecords.map((rec: any) => (
            <TouchableOpacity
              key={rec.id}
              activeOpacity={0.82}
              style={styles.recordRow}
            >
              <RecordIcon type={rec.icon} color={rec.color} bg={rec.bg} />
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>{rec.title}</Text>
                <Text style={styles.recordDate}>{rec.date}</Text>
              </View>
              <View
                style={[styles.recordTypeBadge, { backgroundColor: rec.bg }]}
              >
                <Text style={[styles.recordTypeText, { color: rec.color }]}>
                  {rec.type}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.ctaButton}
          onPress={() =>
            router.push({
              pathname: "/manageFamily/editMemberDetailProfile",
              params: { memberId },
            })
          }
        >
          <Text style={styles.ctaText}>Edit Member Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles (exactly as in original) ─────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(247,249,252,0.95)",
  },
  topBarBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
    }),
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    letterSpacing: -0.36,
  },

  dropdownOverlay: { flex: 1, backgroundColor: "transparent" },
  dropdownContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 56 : 80,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 16,
    minWidth: 200,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownItemDanger: { backgroundColor: "rgba(220,38,38,0.04)" },
  dropdownItemIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemLabel: { fontSize: 14, fontWeight: "600", color: "#334155" },

  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4B",
    marginBottom: 8,
  },
  confirmBody: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmRow: { flexDirection: "row", gap: 12 },
  confirmCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: { fontSize: 15, fontWeight: "700", color: "#334155" },
  confirmRemoveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRemoveText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#4C56AF",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
    marginBottom: 20,
    gap: 8,
  },
  avatarWrap: { width: 88, height: 88, position: "relative", marginBottom: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: "#F2F4F7",
  },
  avatarFallback: {
    backgroundColor: "#CBD5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: "#4C56AF" },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 9999,
    backgroundColor: "#069594",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  relationPill: {
    backgroundColor: "#069594",
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  relationText: { fontSize: 12, fontWeight: "700", color: "#E3FFFE" },
  chipRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  chip: { borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: "700" },
  alertStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(6,149,148,0.06)",
    borderLeftWidth: 4,
    borderLeftColor: "#069594",
    borderTopRightRadius: 48,
    borderBottomRightRadius: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: "stretch",
    marginTop: 4,
  },
  alertLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: "rgba(6,149,148,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { fontSize: 14, fontWeight: "600", color: "#191C1E" },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  manageBtnText: { fontSize: 14, fontWeight: "700", color: "#069594" },

  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  gridCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#4C56AF",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
    minHeight: 148,
    justifyContent: "space-between",
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTextWrap: { flex: 1, marginTop: 12 },
  gridLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  gridSub: { fontSize: 11, fontWeight: "400", color: "#6E7979" },
  gridChevronWrap: { alignItems: "flex-end", marginTop: 8 },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: "#4C56AF",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F2F4F7" },
  summaryLabel: { fontSize: 12, fontWeight: "500", color: "#6E7979" },
  summaryValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#191C1E",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 8,
  },
  summaryBadge: {
    backgroundColor: "rgba(6,149,148,0.10)",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  summaryBadgeText: { fontSize: 11, fontWeight: "700", color: "#069594" },

  recentSection: { gap: 10 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  recentTitle: { fontSize: 18, fontWeight: "700", color: "#334155" },
  viewAllText: { fontSize: 12, fontWeight: "700", color: "#069594" },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(242,244,247,0.6)",
    borderRadius: 48,
    padding: 12,
    gap: 12,
  },
  recordIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  recordInfo: { flex: 1 },
  recordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191C1E",
    marginBottom: 2,
  },
  recordDate: { fontSize: 11, fontWeight: "400", color: "#6E7979" },
  recordTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  recordTypeText: { fontSize: 10, fontWeight: "800" },

  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  ctaButton: {
    backgroundColor: "#069594",
    borderRadius: 9999,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#069594",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
