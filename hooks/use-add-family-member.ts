import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

type AddFamilyMemberInput = {
  fullName: string;
  dob: string; // formatted as "DD / MM / YYYY"
  gender: string;
  bloodGroup: string;
  height: string;
  weight: string;
  medicalNotes?: string;
  relationship: string; // e.g., "Spouse", "Child", "Parent", etc.
  avatarUri?: string | null;
};

type AddFamilyMemberResult = {
  success: boolean;
  memberId?: string;
  error?: string;
};

const toSqlDate = (dob: string): string | null => {
  const parts = dob.split(" / ");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export const useAddFamilyMember = () => {
  const [adding, setAdding] = useState(false);

  const addMember = useCallback(
    async (
      familyId: string,
      input: AddFamilyMemberInput,
    ): Promise<AddFamilyMemberResult> => {
      setAdding(true);

      try {
        // 1. Validate inputs
        if (!input.fullName.trim()) {
          return {
            success: false,
            error: "Full name is required",
          };
        }

        // 2. Get current logged in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return {
            success: false,
            error: userError?.message || "User not authenticated",
          };
        }

        // 3. Verify user is admin of this family
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("admin_user_id")
          .eq("id", familyId)
          .single();

        if (familyError || !familyData) {
          return {
            success: false,
            error: "Family not found",
          };
        }

        if (familyData.admin_user_id !== user.id) {
          return {
            success: false,
            error: "You don't have permission to add members to this family",
          };
        }

        // 4. Format DOB if provided
        let formattedDob: string | null = null;
        if (input.dob) {
          formattedDob = toSqlDate(input.dob);
          if (!formattedDob) {
            return {
              success: false,
              error: "Invalid date format. Use DD / MM / YYYY.",
            };
          }
        }

        // 5. Insert the family member
        const { data: memberData, error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id: familyId,
            user_id: user.id,
            full_name: input.fullName.trim(),
            relation: input.relationship,
            dob: formattedDob,
            gender: input.gender || null,
            blood_group: input.bloodGroup || null,
            height_cm: input.height ? parseFloat(input.height) : null,
            weight_kg: input.weight ? parseFloat(input.weight) : null,
            medical_notes: input.medicalNotes?.trim() || null,
            avatar_url: input.avatarUri || null,
          })
          .select()
          .single();

        if (memberError) {
          console.error("Error adding member:", memberError);
          return {
            success: false,
            error: "Failed to add family member. Please try again.",
          };
        }

        console.log("Family member added successfully:", memberData.id);
        return {
          success: true,
          memberId: memberData.id,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("Unexpected error in addMember:", errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setAdding(false);
      }
    },
    [],
  );

  return { addMember, adding };
};
