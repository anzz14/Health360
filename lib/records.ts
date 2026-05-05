import { supabase } from "@/lib/supabase";
import { RecordRow, RecordType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecordInput = {
  record_type: RecordType;
  title: string;
  description: string | null;
  record_date: string;
  doctor_name: string | null;
  hospital_or_clinic: string | null;
  attachments: string[];
  notes: string | null;
  tags: string[];
};

export type FamilyRecordRow = RecordRow & {
  owner_name: string;
};

// ─── Internal helper ──────────────────────────────────────────────────────────

async function getProfileId(authUserId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !data) throw new Error("Profile not found for this user.");
  return data.id;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

// Regular user — fetch only their own records
export async function fetchMyRecords(authUserId: string): Promise<RecordRow[]> {
  const profileId = await getProfileId(authUserId);

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_deleted", false)
    .order("record_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Admin — fetch records for every active member of the family
export async function fetchFamilyRecords(
  familyId: string,
): Promise<FamilyRecordRow[]> {
  const { data: memberships, error: mErr } = await supabase
    .from("family_memberships")
    .select("profile_id, profiles(full_name)")
    .eq("family_id", familyId)
    .eq("status", "active");

  if (mErr) throw new Error(mErr.message);
  if (!memberships?.length) return [];

  const profileIds = memberships.map((m: any) => m.profile_id);
  const nameMap: Record<string, string> = Object.fromEntries(
    memberships.map((m: any) => [
      m.profile_id,
      m.profiles?.full_name ?? "Unknown",
    ]),
  );

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .in("profile_id", profileIds)
    .eq("is_deleted", false)
    .order("record_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    ...r,
    owner_name: nameMap[r.profile_id] ?? "Unknown",
  }));
}

// ─── Create ───────────────────────────────────────────────────────────────────

// Regular user creating their own record
export async function createPersonalRecord(
  authUserId: string,
  payload: RecordInput,
): Promise<void> {
  const profileId = await getProfileId(authUserId);

  const { error } = await supabase.from("records").insert({
    ...payload,
    profile_id: profileId,
    created_by_profile_id: profileId,
  });

  if (error) throw new Error(error.message);
}

// Admin creating a record on behalf of a family member.
// targetProfileId  — used when member has no app account (dummy profile)
// targetAuthUserId — used when member has a real account
export async function createMemberRecord(
  creatorAuthUserId: string,
  targetProfileId: string | null,
  targetAuthUserId: string | null,
  payload: RecordInput,
): Promise<void> {
  const creatorProfileId = await getProfileId(creatorAuthUserId);

  let ownerProfileId: string;
  if (targetProfileId) {
    // dummy member — profile id is known directly
    ownerProfileId = targetProfileId;
  } else if (targetAuthUserId) {
    // real member — resolve their profile from auth id
    ownerProfileId = await getProfileId(targetAuthUserId);
  } else {
    throw new Error(
      "Either targetProfileId or targetAuthUserId must be provided.",
    );
  }

  const { error } = await supabase.from("records").insert({
    ...payload,
    profile_id: ownerProfileId,
    created_by_profile_id: creatorProfileId,
  });

  if (error) throw new Error(error.message);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateRecord(
  recordId: string,
  authUserId: string,
  payload: RecordInput,
): Promise<void> {
  const profileId = await getProfileId(authUserId);

  const { error } = await supabase
    .from("records")
    .update({
      ...payload,
      updated_by_profile_id: profileId,
    })
    .eq("id", recordId)
    .eq("is_deleted", false);

  if (error) throw new Error(error.message);
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

export async function deleteRecord(
  recordId: string,
  authUserId: string,
): Promise<void> {
  const profileId = await getProfileId(authUserId);

  const { error } = await supabase
    .from("records")
    .update({
      is_deleted: true,
      updated_by_profile_id: profileId,
    })
    .eq("id", recordId);

  if (error) throw new Error(error.message);
}
