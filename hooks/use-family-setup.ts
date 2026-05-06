// hooks/use-family-setup.ts (corrected)
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

type CreateFamilyInput = {
  familyName: string;
  memberName: string;
  avatarUrl?: string | null;
};

type CreateFamilyResult = {
  success: boolean;
  familyId?: string;
  inviteCode?: string;
  error?: string;
};

const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export const useFamilySetup = () => {
  const [saving, setSaving] = useState(false);

  const createFamily = useCallback(
    async (input: CreateFamilyInput): Promise<CreateFamilyResult> => {
      setSaving(true);

      try {
        if (!input.familyName.trim() || !input.memberName.trim()) {
          return { success: false, error: "Please fill in all details" };
        }

        // 1. Get authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          return {
            success: false,
            error: userError?.message || "Not authenticated",
          };
        }

        // 2. Get the user's profile (must exist after ProfileDetails step)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (profileError || !profile) {
          return {
            success: false,
            error: "Profile not found. Please complete your profile first.",
          };
        }

        // 3. Generate human‑readable invite code
        const inviteCode = `${input.familyName.split(" ")[0].toUpperCase()}-${generateInviteCode()}`;

        // 4. Create the family – use admin_profile_id (not admin_user_id)
        const { data: family, error: familyError } = await supabase
          .from("families")
          .insert({
            name: input.familyName.trim(),
            admin_profile_id: profile.id, // ✅ corrected column name
            invite_code: inviteCode,
            avatar_url: input.avatarUrl ?? null,
          })
          .select()
          .single();

        if (familyError) {
          console.error("Family insert error:", familyError);
          return { success: false, error: "Failed to create family" };
        }

        // 5. Add the user as an active member
        const { error: membershipError } = await supabase
          .from("family_memberships")
          .insert({
            family_id: family.id,
            profile_id: profile.id,
            relation: "Self",
            status: "active",
          });

        if (membershipError) {
          console.error("Membership insert error:", membershipError);
          return { success: false, error: "Failed to add member to family" };
        }

        // 6. Update profile's active_family_id
        await supabase
          .from("profiles")
          .update({ active_family_id: family.id })
          .eq("id", profile.id);

        return {
          success: true,
          familyId: family.id,
          inviteCode,
        };
      } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { createFamily, saving };
};
