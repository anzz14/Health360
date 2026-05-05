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

  // ─── STEP 1: Detect scenario ──────────────────────────────
  const checkAndAccept = useCallback(
    async (request: {
      id: string;
      mapped_profile_id: string | null;
      auth_user_id: string;
    }) => {
      if (!request.mapped_profile_id) {
        throw new Error(
          "This request has no mapped profile. Use the RPC accept_join_request with null mapping.",
        );
      }
      setLoading(true);
      try {
        const [
          { data: dummyProfile, error: dummyError },
          { data: requesterProfile, error: requesterError },
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

        if (dummyError) throw new Error("Failed to fetch dummy profile");
        if (requesterError)
          throw new Error("Failed to fetch requester profile");

        // Dummy already claimed — shouldn't happen but guard it
        if (dummyProfile.auth_user_id) {
          return {
            scenario: "already_linked",
            dummyProfile,
            requesterProfile,
          } as AcceptResult;
        }

        // Requester already has their own real profile
        if (requesterProfile) {
          return {
            scenario: "merge_needed",
            dummyProfile,
            requesterProfile,
          } as AcceptResult;
        }

        // Clean claim — dummy has no account, no conflict
        return {
          scenario: "simple_claim",
          dummyProfile,
          requesterProfile: null,
        } as AcceptResult;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ─── STEP 2: Execute based on scenario ────────────────────
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
          // Just link auth_user_id to dummy profile — no merge needed
          const { error } = await supabase
            .from("profiles")
            .update({ auth_user_id: request.auth_user_id })
            .eq("id", request.mapped_profile_id)
            .is("auth_user_id", null); // safety: only claim unclaimed profiles

          if (error) throw new Error(`Claim failed: ${error.message}`);

          // Clean up request
          await supabase
            .from("join_requests")
            .update({ status: "approved" })
            .eq("id", request.id);

          await supabase.from("join_requests").delete().eq("id", request.id);
        } else if (result.scenario === "merge_needed") {
          // Use RPC — needs elevated permissions to move records + delete profile
          const { error } = await supabase.rpc("merge_profiles", {
            p_dummy_profile_id: request.mapped_profile_id,
            p_real_profile_id: result.requesterProfile.id,
            p_request_id: request.id,
          });

          if (error) throw new Error(`Merge failed: ${error.message}`);
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
