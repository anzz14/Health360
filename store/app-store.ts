import { supabase } from "@/lib/supabase";
import { create } from "zustand";

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number | string;
  bloodGroup: string;
  lastConsult: string;
  records: number;
  avatar: string;
  bloodColor: string;
  bloodBg: string;
};

type UserProfile = {
  fullName: string;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  medicalNotes: string | null;
};

type AppState = {
  // Data
  members: FamilyMember[];
  familyId: string;
  familyName: string;
  inviteCode: string;
  isAdmin: boolean;
  hasFamily: boolean | null;
  profile: UserProfile | null;

  // Status
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  fetchAll: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;
};

const calculateAge = (dob?: string) => {
  if (!dob) return "--";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial state
  members: [],
  familyId: "",
  familyName: "",
  inviteCode: "",
  isAdmin: false,
  hasFamily: null,
  profile: null,
  loading: false,
  initialized: false,
  error: null,

  fetchAll: async () => {
    // Skip if already loaded
    if (get().initialized && !get().loading) return;

    set({ loading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ hasFamily: false, loading: false, initialized: true });
        return;
      }

      // All 3 queries fire in parallel — one round trip
      const [adminResult, memberResult, profileResult] = await Promise.all([
        supabase
          .from("families")
          .select("id, name, invite_code, admin_user_id")
          .eq("admin_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("family_members")
          .select("family_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),

        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      // Resolve family ID
      const resolvedFamilyId =
        adminResult.data?.id ?? memberResult.data?.family_id ?? null;

      if (!resolvedFamilyId) {
        set({ hasFamily: false, loading: false, initialized: true });
        return;
      }

      // Fetch family + all members in one query
      const { data, error } = await supabase
        .from("families")
        .select(
          `
          id, name, invite_code, admin_user_id,
          family_members (
            id, full_name, relation, dob,
            blood_group, avatar_url, user_id
          )
        `,
        )
        .eq("id", resolvedFamilyId)
        .maybeSingle();

      if (error || !data) throw new Error("Failed to load family");

      const rawMembers: any[] = data.family_members ?? [];

      // Fetch linked user profiles for live data
      const linkedIds = rawMembers
        .filter((m) => m.user_id)
        .map((m) => m.user_id);
      let profileMap: Record<string, any> = {};

      if (linkedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url, blood_group, dob")
          .in("id", linkedIds);

        for (const p of profiles ?? []) profileMap[p.id] = p;
      }

      // Format members
      const members: FamilyMember[] = rawMembers.map((m) => {
        const p = m.user_id ? profileMap[m.user_id] : null;
        const name = p?.full_name?.trim() || m.full_name || "Unknown";
        const blood = p
          ? (p.blood_group ?? m.blood_group ?? "")
          : (m.blood_group ?? "");
        const dob = p ? (p.dob ?? null) : (m.dob ?? null);
        const avatar =
          p?.avatar_url ||
          m.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=069594&color=fff`;

        return {
          id: m.id,
          name,
          relation: m.relation || "Member",
          age: calculateAge(dob ?? undefined),
          bloodGroup: blood || "N/A",
          avatar,
          bloodColor: blood ? "#DC2626" : "#6B7280",
          bloodBg: blood ? "#FEF2F2" : "#F3F4F6",
          lastConsult: "--",
          records: 0,
        };
      });

      // Format user profile
      const rawProfile = profileResult.data;
      const profile: UserProfile | null = rawProfile
        ? {
            fullName: rawProfile.full_name,
            dob: rawProfile.dob,
            gender: rawProfile.gender,
            bloodGroup: rawProfile.blood_group,
            avatarUrl: rawProfile.avatar_url,
            heightCm: rawProfile.height_cm,
            weightKg: rawProfile.weight_kg,
            medicalNotes: rawProfile.medical_notes,
          }
        : null;

      set({
        members,
        profile,
        familyId: data.id,
        familyName: data.name,
        inviteCode: data.invite_code,
        isAdmin: data.admin_user_id === user.id,
        hasFamily: true,
        loading: false,
        initialized: true,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false, initialized: true });
    }
  },

  // Force a fresh fetch (after adding member, accepting request, etc.)
  refetch: async () => {
    set({ initialized: false });
    await get().fetchAll();
  },

  // Call this on logout
  reset: () =>
    set({
      members: [],
      familyId: "",
      familyName: "",
      inviteCode: "",
      isAdmin: false,
      hasFamily: null,
      profile: null,
      loading: false,
      initialized: false,
      error: null,
    }),
}));
