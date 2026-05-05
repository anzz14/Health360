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
    async (request: any): Promise<AcceptResult> => {
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
          };
        }

        // Requester already has their own real profile
        if (requesterProfile) {
          return {
            scenario: "merge_needed",
            dummyProfile,
            requesterProfile,
          };
        }

        // Clean claim — dummy has no account, no conflict
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

  // ─── STEP 2: Execute based on scenario ────────────────────
  const finalizeAccept = useCallback(
    async (request: any, result: AcceptResult): Promise<void> => {
      setLoading(true);
      try {
        if (result.scenario === "simple_claim") {
          // Dummy has no account yet
          // Just link their new auth id to the existing profile
          // All records stay exactly where they are
          const { error } = await supabase
            .from("profiles")
            .update({ auth_user_id: request.auth_user_id })
            .eq("id", request.mapped_profile_id)
            .is("auth_user_id", null);

          if (error) throw new Error(`Claim failed: ${error.message}`);
        } else if (result.scenario === "merge_needed") {
          // Person already has their own profile with data and records
          // Real profile wins — absorb dummy into it

          const realProfileId = result.requesterProfile.id;
          const dummyProfileId = result.dummyProfile.id;

          // Move all dummy's records to real profile
          const { error: recordsError } = await supabase
            .from("records")
            .update({ profile_id: realProfileId })
            .eq("profile_id", dummyProfileId);

          if (recordsError) {
            throw new Error(`Records merge failed: ${recordsError.message}`);
          }

          // Move family membership to real profile
          const { error: membershipError } = await supabase
            .from("family_memberships")
            .update({ profile_id: realProfileId })
            .eq("profile_id", dummyProfileId);

          if (membershipError) {
            throw new Error(
              `Membership merge failed: ${membershipError.message}`,
            );
          }

          // Delete the now-empty dummy profile
          const { error: deleteError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", dummyProfileId)
            .is("auth_user_id", null); // safety: never delete real profiles

          if (deleteError) {
            throw new Error(`Dummy cleanup failed: ${deleteError.message}`);
          }
        } else {
          throw new Error("Profile already linked to an account");
        }

        // Mark approved then clean up request
        await supabase
          .from("join_requests")
          .update({ status: "approved" })
          .eq("id", request.id);

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
