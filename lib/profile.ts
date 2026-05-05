import { supabase } from "@/lib/supabase";

// Get current user's profile id — needed for everything else
export const getMyProfileId = async (authUserId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) throw new Error(`Profile not found: ${error.message}`);
  return data.id;
};

// Get full profile
export const getMyProfile = async (authUserId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) throw new Error(`Profile not found: ${error.message}`);
  return data;
};

// Create profile on signup (call this right after auth.signUp)
export const createProfile = async (authUserId: string, fullName: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ auth_user_id: authUserId, full_name: fullName })
    .select()
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return data;
};

// Admin creates a dummy profile
export const createDummyProfile = async (profile: {
  full_name: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  relation: string;
  family_id: string;
}) => {
  const { relation, family_id, ...profileData } = profile;

  // Create dummy profile (no auth_user_id)
  const { data: newProfile, error: profileError } = await supabase
    .from("profiles")
    .insert(profileData)
    .select()
    .single();

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  // Add to family
  const { error: membershipError } = await supabase
    .from("family_memberships")
    .insert({
      family_id,
      profile_id: newProfile.id,
      relation,
      status: "active",
    });

  if (membershipError) {
    throw new Error(`Failed to add to family: ${membershipError.message}`);
  }

  return newProfile;
};
