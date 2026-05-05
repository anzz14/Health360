import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

type KickResult = {
  success: boolean;
  error?: string;
};

export const useKickFamilyMember = () => {
  const [kicking, setKicking] = useState(false);

  const kickMember = useCallback(
    async (familyId: string, memberId: string): Promise<KickResult> => {
      if (!familyId || !memberId) {
        return { success: false, error: "Missing familyId or memberId" };
      }

      setKicking(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, auth_user_id")
          .eq("id", memberId)
          .maybeSingle();

        if (profileError) {
          console.error("[kickMember] profile lookup error:", profileError);
          return { success: false, error: profileError.message };
        }

        if (!profile) {
          return { success: false, error: "Profile not found" };
        }

        const { data: membership, error: membershipError } = await supabase
          .from("family_memberships")
          .select("id, status")
          .eq("family_id", familyId)
          .eq("profile_id", profile.id)
          .eq("status", "active")
          .maybeSingle();

        if (membershipError) {
          console.error(
            "[kickMember] membership lookup error:",
            membershipError,
          );
          return { success: false, error: membershipError.message };
        }

        if (!membership) {
          return {
            success: false,
            error: "Member is not active in this family",
          };
        }

        const { error: updateError } = await supabase
          .from("family_memberships")
          .update({ status: "removed" })
          .eq("id", membership.id);

        if (updateError) {
          console.error("[kickMember] update error:", updateError);
          return { success: false, error: updateError.message };
        }

        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[kickMember] unexpected error:", msg);
        return { success: false, error: msg };
      } finally {
        setKicking(false);
      }
    },
    [],
  );

  return { kickMember, kicking };
};
