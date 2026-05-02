import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type FamilyMember = {
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

const calculateAge = (dobString?: string): number | string => {
  if (!dobString) return "--";
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};

export function useFamilyMembers() {
  const [members, setMembers]       = useState<FamilyMember[]>([]);
  const [familyId, setFamilyId]     = useState<string>("");
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [hasFamily, setHasFamily]   = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [loading, setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setHasFamily(false);
        return;
      }

      // 2. Check if admin OR regular member — parallel
      const [adminResult, memberResult] = await Promise.all([
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
      ]);

      // 3. Resolve family
      let resolvedFamilyId: string | null = null;
      if (adminResult.data?.id) {
        resolvedFamilyId = adminResult.data.id;
      } else if (memberResult.data?.family_id) {
        resolvedFamilyId = memberResult.data.family_id;
      }

      if (!resolvedFamilyId) {
        setHasFamily(false);
        setFamilyId("");
        setInviteCode("");
        setFamilyName("");
        setIsAdmin(false);
        setMembers([]);
        return;
      }

      // 4. Fetch family + all its members
      const { data, error } = await supabase
        .from("families")
        .select(`
          id,
          name,
          invite_code,
          admin_user_id,
          family_members (
            id,
            full_name,
            relation,
            dob,
            blood_group,
            avatar_url,
            created_at,
            user_id
          )
        `)
        .eq("id", resolvedFamilyId)
        .maybeSingle();

      if (error || !data) {
        console.error("[useFamilyMembers] fetch error:", error);
        setHasFamily(false);
        return;
      }

      const rawMembers: any[] = data.family_members || [];

      // 5. For members with a linked user_id, fetch their live user_profile.
      //    Profile data always wins — this ensures name/avatar/dob changes in
      //    the user's own profile are reflected for ALL viewers of the family list.
      const linkedUserIds = rawMembers
        .filter((m) => !!m.user_id)
        .map((m) => m.user_id as string);

      type ProfileSnap = {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        blood_group: string | null;
        dob: string | null;
      };

      let profileMap: Record<string, ProfileSnap> = {};

      if (linkedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url, blood_group, dob")
          .in("id", linkedUserIds);

        for (const p of profiles ?? []) {
          profileMap[p.id] = p as ProfileSnap;
        }
      }

      // 6. Merge: profile always wins over family_member row.
      //
      // KEY FIX for Bug 2:
      //   Previously: `const dob = profile?.dob || m.dob`
      //   Problem: if profile.dob is null (user hasn't set it), we'd fall back to
      //   the dummy DOB from the family_member row — showing the wrong age.
      //
      //   But wait — after the handleAccept fix (Bug 1), the family_member row's
      //   dob IS now correctly overwritten with the real profile value (even null).
      //   So `m.dob` is already correct after accept.
      //
      //   To be extra safe, we explicitly prefer profile data when available,
      //   and only fall back to the row when there's no linked profile at all.
      //   This means:
      //     - Linked member with filled profile → profile data (fresh, always correct)
      //     - Linked member with empty profile  → null/-- (correct: they haven't filled it)
      //     - Unlinked dummy member             → family_member row data (what admin typed)

      setHasFamily(true);
      setFamilyId(data.id);
      setInviteCode(data.invite_code);
      setFamilyName(data.name);
      setIsAdmin(data.admin_user_id === user.id);

      const formatted: FamilyMember[] = rawMembers.map((m) => {
        const profile = m.user_id ? profileMap[m.user_id] : null;

        // When a profile is linked, ALWAYS use profile values (even if null).
        // Only fall back to the family_member row for unlinked (dummy) members.
        const hasLinkedProfile = profile !== undefined && profile !== null;

        const name = hasLinkedProfile
          ? (profile.full_name?.trim() || m.full_name || "Unknown")
          : (m.full_name || "Unknown");

        const blood = hasLinkedProfile
          ? (profile.blood_group ?? m.blood_group ?? "")   // profile wins; row as last resort
          : (m.blood_group ?? "");

        // FIX: For dob, when profile is linked, prefer profile.dob.
        // If the profile's dob is null, show "--" (don't show dummy dob).
        // For unlinked members, use the row's dob (what admin typed).
        const dob = hasLinkedProfile
          ? (profile.dob ?? null)          // null profile.dob → "--" age (correct)
          : (m.dob ?? null);               // unlinked → use what admin entered

        const avatar =
          (hasLinkedProfile ? profile.avatar_url : null) ||
          m.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=069594&color=fff`;

        return {
          id:          m.id,
          name,
          relation:    m.relation || "Member",
          age:         calculateAge(dob ?? undefined),
          bloodGroup:  blood || "N/A",
          avatar,
          bloodColor:  blood ? "#DC2626" : "#6B7280",
          bloodBg:     blood ? "#FEF2F2" : "#F3F4F6",
          lastConsult: "--",
          records:     0,
        };
      });

      setMembers(formatted);
    } catch (err) {
      console.error("[useFamilyMembers] unexpected error:", err);
      setHasFamily(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    members,
    familyId,
    inviteCode,
    familyName,
    hasFamily,
    isAdmin,
    loading,
    refetch: fetchData,
  };
}