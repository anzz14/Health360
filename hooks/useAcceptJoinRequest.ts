import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

type AcceptScenario = "simple_claim" | "merge_needed" | "already_linked";

export type AcceptResult = {
  scenario: AcceptScenario;
  dummyProfile: any;
  requesterProfile: any | null;
};

export const useAcceptJoinRequest = () => {
  const [loading, setLoading] = useState(false);

  const checkAndAccept = useCallback(
    async (request: {
      id: string;
      mapped_profile_id: string | null;
      auth_user_id: string;
    }): Promise<AcceptResult> => {
      if (!request.mapped_profile_id) {
        throw new Error("No mapped profile selected.");
      }

      setLoading(true);
      try {
        const [
          { data: dummyProfile, error: dummyErr },
          { data: requesterProfile, error: requesterErr },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", request.mapped_profile_id)
            .single(),
          supabase
            .from("profiles")
            .select("*")
            .eq("auth_user_id", request.auth_user_id)
            .maybeSingle(),
        ]);

        if (dummyErr) throw new Error("Could not load the selected profile.");
        if (requesterErr) throw new Error("Could not load requester profile.");

        if (dummyProfile.auth_user_id) {
          return { scenario: "already_linked", dummyProfile, requesterProfile };
        }

        if (requesterProfile) {
          return { scenario: "merge_needed", dummyProfile, requesterProfile };
        }

        return {
          scenario: "simple_claim",
          dummyProfile,
          requesterProfile: null,
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const finalizeAccept = useCallback(
    async (
      request: {
        id: string;
        mapped_profile_id: string | null;
        auth_user_id: string;
      },
      result: AcceptResult,
    ): Promise<void> => {
      if (!request.mapped_profile_id) {
        throw new Error("Cannot finalize without a mapped profile id.");
      }

      setLoading(true);
      try {
        if (result.scenario === "simple_claim") {
          // Requester has no existing profile — just stamp their auth id
          // onto the dummy slot. All data stays exactly where it is.
          const { error } = await supabase
            .from("profiles")
            .update({ auth_user_id: request.auth_user_id })
            .eq("id", request.mapped_profile_id)
            .is("auth_user_id", null);

          if (error) throw new Error(`Claim failed: ${error.message}`);

          await supabase.from("join_requests").delete().eq("id", request.id);
        } else if (result.scenario === "merge_needed") {
          // Requester already has a profile with data.
          // RPC moves every row across all tables then deletes the dummy.
          const { data, error } = await supabase.rpc("merge_profiles", {
            p_dummy_profile_id: request.mapped_profile_id,
            p_real_profile_id: result.requesterProfile.id,
            p_request_id: request.id,
          });

          console.log("merge_profiles result:", { data, error });
          if (error) throw new Error(`Merge failed: ${error.message}`);
        } else {
          throw new Error("This profile is already linked to an account.");
        }
      } catch (err) {
        console.error("[finalizeAccept]", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { checkAndAccept, finalizeAccept, loading };
};
