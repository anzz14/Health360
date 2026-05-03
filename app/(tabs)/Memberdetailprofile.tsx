import { useUserProfile } from "@/hooks/use-user-profile";
import { useAppStore } from "@/store/app-store";
import { useLocalSearchParams } from "expo-router";
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
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
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
  avatar: null, // set to a URI string to show a real photo
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
    .map((n: string) => n[0])
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

export default function MemberDetailProfile({
  onBack,
}: {
  onBack?: () => void;
}) {
  const params = useLocalSearchParams();
  const memberId = (params as any).memberId as string | undefined;
  const storeMembers = useAppStore((s) => s.members);
  const storeProfile = useAppStore((s) => s.profile);
  const { loadProfile } = useUserProfile();

  const found = memberId
    ? storeMembers.find((mm) => mm.id === memberId)
    : undefined;

  const initialMember = {
    name: found?.name ?? MEMBER.name,
    relation: found?.relation ?? MEMBER.relation,
    age: found?.age ?? MEMBER.age,
    bloodGroup: found?.bloodGroup ?? MEMBER.bloodGroup,
    avatar: found?.avatar ?? MEMBER.avatar,
    allergies: MEMBER.allergies,
    conditions: MEMBER.conditions,
    activeCondition: MEMBER.activeCondition,
    healthSummary: MEMBER.healthSummary,
    recentRecords: MEMBER.recentRecords,
  } as any;

  const [member, setMember] = useState(initialMember);

  // If no memberId provided, prefer store profile or fetch the logged-in user's profile
  useEffect(() => {
    let mounted = true;
    const applyProfile = (p: any) => {
      if (!mounted) return;
      const mapped = {
        name: p?.fullName ?? initialMember.name,
        relation: "Self",
        age: p?.dob ? p?.dob : initialMember.age,
        bloodGroup: p?.bloodGroup ?? initialMember.bloodGroup,
        avatar: p?.avatarUrl ?? initialMember.avatar,
        allergies: initialMember.allergies,
        conditions: initialMember.conditions,
        activeCondition: initialMember.activeCondition,
        healthSummary: initialMember.healthSummary,
        recentRecords: initialMember.recentRecords,
      } as any;
      setMember(mapped);
    };

    if (!memberId) {
      if (storeProfile) {
        applyProfile(storeProfile);
      } else {
        (async () => {
          const res = await loadProfile();
          if (res.success && res.data) applyProfile(res.data);
        })();
      }
    }

    return () => {
      mounted = false;
    };
  }, [memberId, storeProfile, loadProfile]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />

      {/* ── Top App Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.topBarBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#334155" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Member Profile</Text>
        <TouchableOpacity style={styles.topBarBtn} activeOpacity={0.7}>
          <MoreVertical size={20} color="#334155" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {member.avatar ? (
              <Image source={{ uri: member.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>
                  {getInitials(member.name)}
                </Text>
              </View>
            )}
            {/* Camera Badge */}
            <View style={styles.cameraBadge}>
              <Camera size={10} color="#FFF" strokeWidth={2} />
            </View>
          </View>

          {/* Name */}
          <Text style={styles.heroName}>{member.name}</Text>

          {/* Relation pill */}
          <View style={styles.relationPill}>
            <Text style={styles.relationText}>
              {member.relation} · {member.age} yrs
            </Text>
          </View>

          {/* Stat chips */}
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

          {/* Health Alert Strip */}
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

        {/* ── Quick Access Grid ── */}
        <View style={styles.grid}>
          {QUICK_ACCESS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.82}
              style={[
                styles.gridCard,
                i % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
                item.id === "appointments" ? { marginRight: 10 } : {}, //ayan fix this
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

        {/* ── Health Summary ── */}
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

        {/* ── Recent Records ── */}
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

        {/* Spacer for sticky CTA */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity activeOpacity={0.88} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Edit Member Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(247,249,252,0.95)",
    borderBottomWidth: 0,
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

  // ── Scroll ──
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // ── Hero Card ──
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

  // Avatar
  avatarWrap: {
    width: 88,
    height: 88,
    position: "relative",
    marginBottom: 4,
  },
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
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4C56AF",
  },
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

  // Name
  heroName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: -0.6,
    textAlign: "center",
  },

  // Relation pill
  relationPill: {
    backgroundColor: "#069594",
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  relationText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E3FFFE",
  },

  // Stat chips
  chipRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  chip: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Alert strip
  alertStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(6,149,148,0.06)",
    borderLeftWidth: 4,
    borderLeftColor: "#069594",
    borderRadius: 0,
    borderTopRightRadius: 48,
    borderBottomRightRadius: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: "stretch",
    marginTop: 4,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: "rgba(6,149,148,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191C1E",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#069594",
  },

  // ── Quick Access Grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
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
  gridTextWrap: {
    flex: 1,
    marginTop: 12,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  gridSub: {
    fontSize: 11,
    fontWeight: "400",
    color: "#6E7979",
  },
  gridChevronWrap: {
    alignItems: "flex-end",
    marginTop: 8,
  },

  // ── Health Summary ──
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
    gap: 0,
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
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6E7979",
  },
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
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#069594",
  },

  // ── Recent Records ──
  recentSection: {
    gap: 10,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#069594",
  },
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
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191C1E",
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 11,
    fontWeight: "400",
    color: "#6E7979",
  },
  recordTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  recordTypeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  // ── Bottom CTA ──
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
