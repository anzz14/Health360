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
  memberId?: string; // profile.id
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

        // 1. Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          return { success: false, error: userError?.message || "User not authenticated" };
        }

        // 2. Get the admin's profile id (using auth_user_id)
        const { data: adminProfile, error: adminProfileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (adminProfileError || !adminProfile) {
          return { success: false, error: "Your profile not found. Please complete onboarding." };
        }

        // 3. Verify admin: family's admin_profile_id must match adminProfile.id
        const { data: family, error: familyError } = await supabase
          .from("families")
          .select("admin_profile_id")
          .eq("id", familyId)
          .single();

        if (familyError || !family) {
          return { success: false, error: "Family not found" };
        }
        if (family.admin_profile_id !== adminProfile.id) {
          return { success: false, error: "You don't have permission to add members to this family" };
        }

        // 4. Format DOB
        let formattedDob: string | null = null;
        if (input.dob) {
          formattedDob = toSqlDate(input.dob);
          if (!formattedDob) {
            return { success: false, error: "Invalid date format. Use DD / MM / YYYY." };
          }
        }

        // 5. Create a new profile for the family member (auth_user_id = NULL initially)
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            auth_user_id: null,   // dummy profile, will be linked later when they accept join request
            full_name: input.fullName.trim(),
            dob: formattedDob,
            gender: input.gender || null,
            blood_group: input.bloodGroup || null,
            height_cm: input.height ? parseFloat(input.height) : null,
            weight_kg: input.weight ? parseFloat(input.weight) : null,
            medical_notes: input.medicalNotes?.trim() || null,
            avatar_url: input.avatarUri || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (profileError) {
          console.error("[addMember] profile insert error:", profileError);
          return { success: false, error: "Failed to create member profile. Please try again." };
        }

        // 6. Add to family_memberships (active membership)
        const { error: membershipError } = await supabase
          .from("family_memberships")
          .insert({
            family_id: familyId,
            profile_id: newProfile.id,
            relation: input.relationship || "Member",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (membershipError) {
          console.error("[addMember] membership insert error:", membershipError);
          // Rollback would be ideal, but for simplicity just return error
          return { success: false, error: "Failed to add member to family. Please try again." };
        }

        return { success: true, memberId: newProfile.id };
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