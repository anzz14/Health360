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
      //    This is the KEY fix: if the member changes their name/avatar in
      //    userDetail.tsx, the family list reflects it immediately on next fetch.
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

      // 6. Merge family_member row with live user_profile (profile wins)
      setHasFamily(true);
      setFamilyId(data.id);
      setInviteCode(data.invite_code);
      setFamilyName(data.name);
      setIsAdmin(data.admin_user_id === user.id);

      const formatted: FamilyMember[] = rawMembers.map((m) => {
        const profile = m.user_id ? profileMap[m.user_id] : null;

        // Profile data always wins over the family_member row —
        // so renaming in userDetail.tsx is reflected here without a DB migration
        const name       = profile?.full_name?.trim()  || m.full_name  || "Unknown";
        const blood      = profile?.blood_group         || m.blood_group || "";
        const avatar     = profile?.avatar_url          || m.avatar_url
          || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=069594&color=fff`;
        const dob        = profile?.dob                 || m.dob;

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