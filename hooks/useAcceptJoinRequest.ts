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
    async (request: { id: string; mapped_profile_id: string | null; auth_user_id: string }) => {
      if (!request.mapped_profile_id) {
        throw new Error("This request has no mapped profile. Use the RPC accept_join_request with null mapping.");
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
        if (requesterError) throw new Error("Failed to fetch requester profile");

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
      request: { id: string; mapped_profile_id: string | null; auth_user_id: string },
      result: AcceptResult,
    ): Promise<void> => {
      if (!request.mapped_profile_id) {
        throw new Error("Cannot finalize accept without a mapped profile id.");
      }
      setLoading(true);
      try {
        if (result.scenario === "simple_claim") {
          // Link the existing dummy profile to the requester's auth user id
          const { error } = await supabase
            .from("profiles")
            .update({ auth_user_id: request.auth_user_id })
            .eq("id", request.mapped_profile_id)
            .is("auth_user_id", null);

          if (error) throw new Error(`Claim failed: ${error.message}`);
        } else if (result.scenario === "merge_needed") {
          // Requester already has a real profile – merge dummy into it
          const realProfileId = result.requesterProfile.id;
          const dummyProfileId = result.dummyProfile.id;

          // Move records from dummy to real profile
          const { error: recordsError } = await supabase
            .from("records")
            .update({ profile_id: realProfileId })
            .eq("profile_id", dummyProfileId);

          if (recordsError) {
            throw new Error(`Records merge failed: ${recordsError.message}`);
          }

          // Move family memberships from dummy to real profile
          const { error: membershipError } = await supabase
            .from("family_memberships")
            .update({ profile_id: realProfileId })
            .eq("profile_id", dummyProfileId);

          if (membershipError) {
            throw new Error(`Membership merge failed: ${membershipError.message}`);
          }

          // Delete the now-empty dummy profile (only if it has no auth_user_id)
          const { error: deleteError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", dummyProfileId)
            .is("auth_user_id", null);

          if (deleteError) {
            throw new Error(`Dummy cleanup failed: ${deleteError.message}`);
          }
        }
        // If scenario is "already_linked", nothing to do

        // Mark request as approved and delete it
        await supabase.from("join_requests").update({ status: "approved" }).eq("id", request.id);
        await supabase.from("join_requests").delete().eq("id", request.id);
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