import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

type AddFamilyMemberInput = {
  fullName: string;
  dob: string; // "DD / MM / YYYY"
  gender: string;
  bloodGroup: string;
  height: string;
  weight: string;
  medicalNotes?: string;
  relationship: string;
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
    async (familyId: string, input: AddFamilyMemberInput): Promise<AddFamilyMemberResult> => {
      setAdding(true);
      try {
        if (!input.fullName.trim()) {
          return { success: false, error: "Full name is required" };
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          return { success: false, error: userError?.message || "User not authenticated" };
        }

        // Verify admin
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("admin_user_id")
          .eq("id", familyId)
          .single();

        if (familyError || !familyData) {
          return { success: false, error: "Family not found" };
        }
        if (familyData.admin_user_id !== user.id) {
          return { success: false, error: "You don't have permission to add members to this family" };
        }

        // Format DOB
        let formattedDob: string | null = null;
        if (input.dob) {
          formattedDob = toSqlDate(input.dob);
          if (!formattedDob) {
            return { success: false, error: "Invalid date format. Use DD / MM / YYYY." };
          }
        }

        // KEY FIX: user_id is NULL for manually-added members.
        // It only gets set when that person accepts a join request.
        // This way the sync trigger only fires for the right person.
        const { data: memberData, error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id:     familyId,
            user_id:       null,           // ← NOT user.id (that would claim the admin owns this slot)
            full_name:     input.fullName.trim(),
            relation:      input.relationship,
            dob:           formattedDob,
            gender:        input.gender    || null,
            blood_group:   input.bloodGroup || null,
            height_cm:     input.height ? parseFloat(input.height) : null,
            weight_kg:     input.weight ? parseFloat(input.weight) : null,
            medical_notes: input.medicalNotes?.trim() || null,
            avatar_url:    input.avatarUri || null,
          })
          .select()
          .single();

        if (memberError) {
          console.error("[addMember] insert error:", memberError);
          return { success: false, error: "Failed to add family member. Please try again." };
        }

        return { success: true, memberId: memberData.id };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[addMember] unexpected error:", msg);
        return { success: false, error: msg };
      } finally {
        setAdding(false);
      }
    },
    [],
  );

  return { addMember, adding };
};