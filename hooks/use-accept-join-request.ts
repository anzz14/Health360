// hooks/useAcceptJoinRequest.ts
import { supabase } from "@/lib/supabase";
import {
  AcceptResult,
  FamilyMemberRow,
  JoinRequest,
  UserProfileRow,
} from "@/types";
import { useCallback, useState } from "react";

export const useAcceptJoinRequest = () => {
  const [loading, setLoading] = useState(false);

  // ============================================================
  // STEP 1: Check if merge dialog is needed
  // Fetches both the requester's profile and the existing member row
  // ============================================================
  const checkAndAccept = useCallback(
    async (request: JoinRequest): Promise<AcceptResult> => {
      setLoading(true);
      try {
        if (!request?.mapped_member_id) {
          throw new Error("No mapped_member_id on request");
        }

        const [
          { data: profileData, error: profileError },
          { data: memberData, error: memberError },
        ] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("*")
            .eq("id", request.user_id)
            .maybeSingle(),
          supabase
            .from("family_members")
            .select("*")
            .eq("id", request.mapped_member_id)
            .single(),
        ]);

        if (profileError) throw new Error("Failed to fetch user profile");
        if (memberError) throw new Error("Failed to fetch family member");

        return {
          existingMember: memberData as FamilyMemberRow,
          incomingProfile: (profileData as UserProfileRow) ?? undefined,
          needsMerge: !!profileData,
        };
      } catch (err) {
        console.error("[checkAndAccept]", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ============================================================
  // STEP 2: Finalize acceptance
  //
  // What happens here:
  //   1. family_members.user_id gets filled in  ← dummy becomes real
  //   2. join_request.status = 'approved'       ← safe state if delete fails
  //   3. join_request deleted                   ← cleanup
  //
  // After this:
  //   - Dummy's old records (owner_member_id) are now visible to the user
  //     because RLS checks fm.user_id = auth.uid() which now matches
  //   - Admin still sees everything, nothing breaks
  //   - User's personal records (owner_user_id) were never touched
  // ============================================================
  const finalizeAccept = useCallback(
    async (
      request: JoinRequest,
      incomingProfile?: UserProfileRow | null,
    ): Promise<void> => {
      setLoading(true);
      try {
        if (!request.mapped_member_id) {
          throw new Error("No mapped_member_id on this request");
        }

        // Build the member update — always set user_id, merge profile if provided
        const memberUpdate: Partial<FamilyMemberRow> = {
          user_id: request.user_id,
          ...(incomingProfile?.full_name && {
            full_name: incomingProfile.full_name,
          }),
          ...(incomingProfile?.dob && { dob: incomingProfile.dob }),
          ...(incomingProfile?.gender && { gender: incomingProfile.gender }),
          ...(incomingProfile?.blood_group && {
            blood_group: incomingProfile.blood_group,
          }),
          ...(incomingProfile?.avatar_url && {
            avatar_url: incomingProfile.avatar_url,
          }),
          ...(incomingProfile?.height_cm && {
            height_cm: incomingProfile.height_cm,
          }),
          ...(incomingProfile?.weight_kg && {
            weight_kg: incomingProfile.weight_kg,
          }),
          ...(incomingProfile?.medical_notes && {
            medical_notes: incomingProfile.medical_notes,
          }),
        };

        // 1. Link the real account to the family_member row
        const { error: updateError } = await supabase
          .from("family_members")
          .update(memberUpdate)
          .eq("id", request.mapped_member_id);

        if (updateError) {
          throw new Error(
            `Failed to update family member: ${updateError.message}`,
          );
        }

        // 2. Mark request as approved BEFORE deleting
        //    If delete fails, status is already safe — no double-accept possible
        const { error: statusError } = await supabase
          .from("join_requests")
          .update({ status: "approved" })
          .eq("id", request.id);

        if (statusError) {
          // Non-fatal but log it — member is already linked
          console.warn(
            "[finalizeAccept] Failed to update request status:",
            statusError.message,
          );
        }

        // 3. Cleanup — delete the join request
        const { error: deleteError } = await supabase
          .from("join_requests")
          .delete()
          .eq("id", request.id);

        if (deleteError) {
          // Non-fatal — status is already 'approved' so no harm
          console.warn(
            "[finalizeAccept] Failed to delete join request:",
            deleteError.message,
          );
        }

        console.log("[finalizeAccept] accepted successfully");
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
