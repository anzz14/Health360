import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type FamilyMember = {
  id: string;           // profile.id (for linked users) OR membership id? Better to use profile.id
  membershipId: string; // family_memberships.id (useful for updates)
  name: string;
  relation: string;
  userId: string | null; // auth_user_id (for linked users)
  age: number | string;
  bloodGroup: string;
  lastConsult: string;
  records: number;
  avatar: string;
  bloodColor: string;
  bloodBg: string;
};

const calculateAge = (dobString?: string | null): number | string => {
  if (!dobString) return "--";
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return "--";
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyId, setFamilyId] = useState<string>("");
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setHasFamily(false);
        return;
      }

      // 2. Find the user's profile record (using auth_user_id)
      const { data: myProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profileError || !myProfile) {
        // No profile yet – user hasn't completed onboarding
        setHasFamily(false);
        setLoading(false);
        return;
      }

      // 3. Find which family the user belongs to (active membership)
      const { data: membership, error: membershipError } = await supabase
        .from("family_memberships")
        .select("family_id, relation")
        .eq("profile_id", myProfile.id)
        .eq("status", "active")
        .maybeSingle();

      if (membershipError || !membership) {
        // User is not a member of any family
        setHasFamily(false);
        setFamilyId("");
        setInviteCode("");
        setFamilyName("");
        setIsAdmin(false);
        setMembers([]);
        return;
      }

      const currentFamilyId = membership.family_id;

      // 4. Fetch family details (name, invite code, admin profile id)
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("name, invite_code, admin_profile_id")
        .eq("id", currentFamilyId)
        .maybeSingle();

      if (familyError || !family) {
        throw new Error("Family not found");
      }

      // 5. Fetch all active members of this family (join family_memberships + profiles)
      const { data: memberships, error: membersError } = await supabase
        .from("family_memberships")
        .select(`
          id,
          relation,
          profiles!inner (
            id,
            auth_user_id,
            full_name,
            avatar_url,
            dob,
            blood_group
          )
        `)
        .eq("family_id", currentFamilyId)
        .eq("status", "active");

      if (membersError) throw membersError;

      // 6. Format members
      const formatted: FamilyMember[] = (memberships || []).map((m: any) => {
        const profile = m.profiles;
        const hasAuthUser = !!profile.auth_user_id;
        const name = profile.full_name?.trim() || "Unknown";
        const avatar = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=069594&color=fff`;
        const bloodGroup = profile.blood_group || "N/A";
        const hasBlood = !!profile.blood_group;
        const age = calculateAge(profile.dob);

        return {
          id: profile.id,               // profile.id (unique)
          membershipId: m.id,          // family_memberships.id
          name,
          relation: m.relation || "Member",
          userId: profile.auth_user_id || null,
          age,
          bloodGroup,
          avatar,
          bloodColor: hasBlood ? "#DC2626" : "#6B7280",
          bloodBg: hasBlood ? "#FEF2F2" : "#F3F4F6",
          lastConsult: "--",  // TODO: fetch from records or appointments
          records: 0,         // TODO: fetch count
        };
      });

      // Determine if current user is admin (profile.id == family.admin_profile_id)
      const userIsAdmin = myProfile.id === family.admin_profile_id;

      setHasFamily(true);
      setFamilyId(currentFamilyId);
      setInviteCode(family.invite_code);
      setFamilyName(family.name);
      setIsAdmin(userIsAdmin);
      setMembers(formatted);
    } catch (err) {
      console.error("[useFamilyMembers]", err);
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