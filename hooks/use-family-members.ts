import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

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

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyId, setFamilyId] = useState<string>("");
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // 1. Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Fetch the family the user belongs to
    const { data: family } = await supabase
      .from("families")
      .select("*")
      .limit(1)
      .single();

    if (!family) {
      setLoading(false);
      return;
    }

    setFamilyId(family.id);
    setInviteCode(family.invite_code);
    setFamilyName(family.name);

    // 3. Fetch all family members in this family
    const { data: membersData } = await supabase
      .from("family_members")
      .select("*")
      .eq("family_id", family.id)
      .order("created_at", { ascending: true });

    if (!membersData) return;

    // 4. Find all members who have an actual app account (user_id is not null)
    const userIds = membersData.map((m) => m.user_id).filter(Boolean);
    let profiles: any[] = [];

    // 5. Fetch their "User Profile" data
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);
      profiles = profilesData || [];
    }

    // 6. Merge the Data! (If they have a profile, use that data, otherwise use family_members data)
    const formatted: FamilyMember[] = membersData.map((m) => {
      const profile = profiles.find((p) => p.id === m.user_id) || {};

      const actualDob = profile.dob || m.dob;
      const actualBlood = profile.blood_group || m.blood_group;
      const actualAvatar =
        profile.avatar_url ||
        m.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=069594&color=fff`;

      return {
        id: m.id,
        name: m.full_name,
        relation: m.relation,
        age: calculateAge(actualDob),
        bloodGroup: actualBlood || "N/A",
        avatar: actualAvatar,
        bloodColor: actualBlood ? "#DC2626" : "#6B7280",
        bloodBg: actualBlood ? "#FEF2F2" : "#F3F4F6",
        lastConsult: "--", // Placeholder for future feature
        records: 0, // Placeholder
      };
    });

    setMembers(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    members,
    familyId,
    inviteCode,
    familyName,
    loading,
    refetch: fetchData,
  };
}

// Helper to convert "YYYY-MM-DD" into an age number
const calculateAge = (dobString?: string) => {
  if (!dobString) return "--";
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};
