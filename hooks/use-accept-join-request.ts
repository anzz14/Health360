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

  /**
   * Fetches both the requester's profile and the existing family member record.
   * Returns whether a merge dialog is needed.
   */
  const checkAndAccept = useCallback(
    async (request: any): Promise<AcceptResult> => {
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

  /**
   * Finalizes the acceptance by:
   * 1. Updating the family_members row with chosen data
   * 2. Deleting the join_requests row
   */
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

        const { error: updateError } = await supabase
          .from("family_members")
          .update(memberUpdate)
          .eq("id", request.mapped_member_id);

        if (updateError)
          throw new Error(
            `Failed to update family member: ${updateError.message}`,
          );

        const { error: deleteError } = await supabase
          .from("join_requests")
          .delete()
          .eq("id", request.id);

        if (deleteError) {
          console.error(
            "[finalizeAccept] join_request delete failed:",
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
