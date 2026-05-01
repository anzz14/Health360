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
        const { error: deleteError } = await supabase
          .from("family_members")
          .delete()
          .eq("id", memberId)
          .eq("family_id", familyId);

        if (deleteError) {
          console.error("[kickMember] delete error:", deleteError);
          return { success: false, error: deleteError.message };
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
