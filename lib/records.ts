import { supabase } from "@/lib/supabase";

export type RecordInput = {
  record_type: string;
  title: string;
  description?: string | null;
  record_date: string;
  doctor_name?: string | null;
  hospital_or_clinic?: string | null;
  attachments?: string[];
  notes?: string | null;
  tags?: string[];
};

// CREATE — for any profile (self or family member)
export const createRecord = async (
  targetProfileId: string, // who the record belongs to
  createdByProfileId: string, // who is creating it
  record: RecordInput,
) => {
  const { data, error } = await supabase
    .from("records")
    .insert({
      profile_id: targetProfileId,
      created_by_profile_id: createdByProfileId,
      updated_by_profile_id: createdByProfileId,
      ...record,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create record: ${error.message}`);
  return data;
};

// READ — fetch all records for a profile
export const fetchRecords = async (profileId: string) => {
  const { data, error } = await supabase
    .from("records")
    .select(
      `
      *,
      created_by:created_by_profile_id ( id, full_name, avatar_url ),
      updated_by:updated_by_profile_id ( id, full_name, avatar_url )
    `,
    )
    .eq("profile_id", profileId)
    .eq("is_deleted", false)
    .order("record_date", { ascending: false });

  if (error) throw new Error(`Failed to fetch records: ${error.message}`);
  return data ?? [];
};

// READ — admin fetches ALL records across their family
export const fetchFamilyRecords = async (familyId: string) => {
  // Get all active members
  const { data: memberships, error: membershipError } = await supabase
    .from("family_memberships")
    .select(
      `
      profile_id,
      relation,
      profiles ( id, full_name, avatar_url, auth_user_id )
    `,
    )
    .eq("family_id", familyId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(`Failed to fetch members: ${membershipError.message}`);
  }
  if (!memberships?.length) return [];

  const profileIds = memberships.map((m) => m.profile_id);

  const { data: records, error: recordsError } = await supabase
    .from("records")
    .select(
      `
      *,
      created_by:created_by_profile_id ( id, full_name, avatar_url ),
      updated_by:updated_by_profile_id ( id, full_name, avatar_url )
    `,
    )
    .in("profile_id", profileIds)
    .eq("is_deleted", false)
    .order("record_date", { ascending: false });

  if (recordsError) {
    throw new Error(`Failed to fetch records: ${recordsError.message}`);
  }

  // Attach owner info to each record
  return (records ?? []).map((record) => {
    const membership = memberships.find(
      (m) => m.profile_id === record.profile_id,
    );
    const profile = membership?.profiles as any;
    return {
      ...record,
      owner_name: profile?.full_name ?? "Unknown",
      owner_avatar: profile?.avatar_url ?? null,
      is_dummy: !profile?.auth_user_id,
    };
  });
};

// UPDATE
export const updateRecord = async (
  recordId: string,
  updatedByProfileId: string,
  changes: Partial<RecordInput>,
) => {
  const { data, error } = await supabase
    .from("records")
    .update({
      ...changes,
      updated_by_profile_id: updatedByProfileId,
    })
    .eq("id", recordId)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) throw new Error(`Failed to update record: ${error.message}`);
  return data;
};

// DELETE (soft)
export const deleteRecord = async (
  recordId: string,
  deletedByProfileId: string,
) => {
  const { error } = await supabase
    .from("records")
    .update({
      is_deleted: true,
      updated_by_profile_id: deletedByProfileId,
    })
    .eq("id", recordId);

  if (error) throw new Error(`Failed to delete record: ${error.message}`);
};
