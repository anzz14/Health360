import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";
import {
  AcceptResult,
  FamilyMemberRow,
  JoinRequest,
  UserProfileRow,
} from "@/types";

export const useAcceptJoinRequest = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Fetches both the requester's profile and the existing family member record.
   * Returns whether a merge dialog is needed.
   */
  const checkAndAccept = useCallback(
    async (request: JoinRequest): Promise<AcceptResult> => {
      setLoading(true);

      try {
        // Fetch the requester's user profile
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", request.user_id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw new Error("Failed to fetch user profile");
        }

        // Fetch the existing family member record
        const { data: memberData, error: memberError } = await supabase
          .from("family_members")
          .select("*")
          .eq("id", request.mapped_member_id)
          .single();

        if (memberError) {
          console.error("Error fetching family member:", memberError);
          throw new Error("Failed to fetch family member");
        }

        const existingMember = memberData as FamilyMemberRow;
        const incomingProfile = profileData as UserProfileRow | null;

        // If no user profile exists, no merge needed
        if (!incomingProfile) {
          return {
            needsMerge: false,
            existingMember,
          };
        }

        // Both profiles exist, merge dialog is needed
        return {
          needsMerge: true,
          existingMember,
          incomingProfile,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Error in checkAndAccept:", message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Finalizes the acceptance by:
   * 1. Updating the family_members row with chosen data
   * 2. Deleting the join_requests row
   */
  const finalizeAccept = useCallback(
    async (
      request: JoinRequest,
      chosenSource: "existing" | "incoming",
      incomingProfile?: UserProfileRow
    ): Promise<void> => {
      setLoading(true);

      try {
        // Fetch the current family member to get its data
        const { data: currentMember, error: fetchError } = await supabase
          .from("family_members")
          .select("*")
          .eq("id", request.mapped_member_id)
          .single();

        if (fetchError || !currentMember) {
          throw new Error("Failed to fetch current family member");
        }

        const memberUpdate: Partial<FamilyMemberRow> = {
          user_id: request.user_id,
        };

        // If the user chose incoming profile, merge in the chosen fields
        if (chosenSource === "incoming" && incomingProfile) {
          memberUpdate.full_name = incomingProfile.full_name;
          memberUpdate.dob = incomingProfile.dob;
          memberUpdate.blood_group = incomingProfile.blood_group;
          memberUpdate.gender = incomingProfile.gender;
          memberUpdate.avatar_url = incomingProfile.avatar_url;
          memberUpdate.height_cm = incomingProfile.height_cm;
          memberUpdate.weight_kg = incomingProfile.weight_kg;
          memberUpdate.medical_notes = incomingProfile.medical_notes;
        }
        // If existing, just set user_id (already done above)

        // 1. Update the family_members row
        const { error: updateError } = await supabase
          .from("family_members")
          .update(memberUpdate)
          .eq("id", request.mapped_member_id);

        if (updateError) {
          console.error("Error updating family member:", updateError);
          throw new Error("Failed to update family member");
        }

        // 2. Delete the join_requests row
        const { error: deleteError } = await supabase
          .from("join_requests")
          .delete()
          .eq("id", request.id);

        if (deleteError) {
          console.error("Error deleting join request:", deleteError);
          throw new Error("Failed to delete join request");
        }

        console.log("Join request accepted successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Error in finalizeAccept:", message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { checkAndAccept, finalizeAccept, loading };
};
