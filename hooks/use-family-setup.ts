import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

type CreateFamilyInput = {
  familyName: string;
  memberName: string;
  avatarUri?: string | null;
};

type CreateFamilyResult = {
  success: boolean;
  familyId?: string;
  inviteCode?: string;
  error?: string;
};

// Generate a simple 6-character random alphanumeric code
const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export const useFamilySetup = () => {
  const [saving, setSaving] = useState(false);

  const createFamily = useCallback(
    async (input: CreateFamilyInput): Promise<CreateFamilyResult> => {
      setSaving(true);

      try {
        // 1. Validate inputs
        if (!input.familyName.trim() || !input.memberName.trim()) {
          return {
            success: false,
            error: "Please fill in all details",
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

        // 3. Optional: Upload Avatar to Supabase Storage here and get public URL
        // For now, we skip this and keep it null
        let uploadedAvatarUrl: string | null = null;
        if (
          input.avatarUri &&
          input.avatarUri !==
            "https://res.cloudinary.com/dt5qoqw6u/image/upload/v1776014783/a5c4cd72-2dc1-4105-90eb-4e2759a83471_pccwuo.png"
        ) {
          // TODO: Upload logic here
          // uploadedAvatarUrl = ...
        }

        // 4. Generate invite code
        const inviteCode = `${input.familyName
          .split(" ")[0]
          .toUpperCase()}-${generateInviteCode()}`; // e.g., SHARMA-X7B9A

        // 5. Insert into Families Table
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .insert({
            name: input.familyName.trim(),
            admin_user_id: user.id,
            invite_code: inviteCode,
            avatar_url: uploadedAvatarUrl,
          })
          .select()
          .single();

        if (familyError) {
          console.error("Error creating family:", familyError);
          return {
            success: false,
            error: "Failed to create family. Please try again.",
          };
        }

        // 6. Insert the Primary Member into Family Members Table
        const { error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id: familyData.id,
            user_id: user.id,
            full_name: input.memberName.trim(),
            relation: "Self", // The admin is always "Self"
          });

        if (memberError) {
          console.error("Error creating primary member:", memberError);
          return {
            success: false,
            error: "Failed to add primary member. Please try again.",
          };
        }

        // 7. Update profiles with active_family_id
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ active_family_id: familyData.id })
          .eq("id", user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
          return {
            success: false,
            error: "Failed to set active family. Please try again.",
          };
        }

        // Success!
        console.log("Family created successfully! Invite Code:", inviteCode);
        return {
          success: true,
          familyId: familyData.id,
          inviteCode,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("Unexpected error in createFamily:", errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { createFamily, saving };
};
