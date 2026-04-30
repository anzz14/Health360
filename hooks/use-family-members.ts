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
  const [hasFamily, setHasFamily] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHasFamily(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("families")
        .select(
          "id,name,invite_code,family_members(id,full_name,relation,dob,blood_group,avatar_url,created_at)",
        )
        .eq("admin_user_id", user.id) // ✅ only fetch families this user admins
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch family dashboard data", error);
        setHasFamily(false);
        return;
      }

      if (!data) {
        setHasFamily(false);
        setFamilyId("");
        setInviteCode("");
        setFamilyName("");
        setMembers([]);
        return;
      }

      setHasFamily(true);
      setFamilyId(data.id);
      setInviteCode(data.invite_code);
      setFamilyName(data.name);

      const formatted: FamilyMember[] = (data.family_members || []).map((m) => {
        const actualBlood = m.blood_group || "";
        const actualAvatar =
          m.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=069594&color=fff`;

        return {
          id: m.id,
          name: m.full_name,
          relation: m.relation || "Member",
          age: calculateAge(m.dob || undefined),
          bloodGroup: actualBlood || "N/A",
          avatar: actualAvatar,
          bloodColor: actualBlood ? "#DC2626" : "#6B7280",
          bloodBg: actualBlood ? "#FEF2F2" : "#F3F4F6",
          lastConsult: "--",
          records: 0,
        };
      });

      setMembers(formatted);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Unexpected error fetching family dashboard data", message);
      setHasFamily(false);
    } finally {
      setLoading(false);
    }
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
    hasFamily,
    refetch: fetchData,
  };
}

const calculateAge = (dobString?: string) => {
  if (!dobString) return "--";
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};
