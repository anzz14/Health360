import { supabase } from "@/lib/supabase";
import { RecordRow, RecordType } from "@/types";

export type RecordInput = {
  record_type: RecordType;
  title: string;
  description?: string | null;
  record_date: string;
  doctor_name?: string | null;
  hospital_or_clinic?: string | null;
  attachments?: string[];
  notes?: string | null;
  tags?: string[];
};

export type FamilyRecordRow = RecordRow & {
  owner_name: string;
  member_type: "real" | "dummy";
};

export type MyRecordRow = RecordRow & {
  created_by?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  updated_by?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

// ============================================================
// CREATE - user creates their own record
// ============================================================
export const createPersonalRecord = async (
  userId: string,
  record: RecordInput,
) => {
  const { data, error } = await supabase
    .from("records")
    .insert({
      owner_user_id: userId,
      owner_member_id: null,
      created_by_user_id: userId,
      ...record,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create record: ${error.message}`);
  return data as RecordRow;
};

// ============================================================
// CREATE - admin creates record for any family member
// (works for both real users and dummies)
// ============================================================
export const createMemberRecord = async (
  adminId: string,
  ownerMemberId: string | null,
  ownerUserId: string | null,
  record: RecordInput,
) => {
  const { data, error } = await supabase
    .from("records")
    .insert({
      owner_user_id: ownerUserId,
      owner_member_id: ownerMemberId,
      created_by_user_id: adminId,
      updated_by_user_id: adminId,
      ...record,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create record: ${error.message}`);
  return data as RecordRow;
};

// ============================================================
// READ - user fetches ALL their own records
// ============================================================
export const fetchMyRecords = async (userId: string) => {
  const { data: memberRow, error: memberError } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (memberError) {
    console.warn(
      "[fetchMyRecords] family_members query failed:",
      memberError.message,
    );
  }

  let query = supabase
    .from("records")
    .select(
      `
      *,
      created_by:created_by_user_id ( id, full_name, avatar_url ),
      updated_by:updated_by_user_id ( id, full_name, avatar_url )
    `,
    )
    .eq("is_deleted", false)
    .order("record_date", { ascending: false });

  if (memberRow?.id) {
    query = query.or(
      `owner_user_id.eq.${userId},owner_member_id.eq.${memberRow.id}`,
    );
  } else {
    query = query.eq("owner_user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch records: ${error.message}`);
  return (data ?? []) as MyRecordRow[];
};

// ============================================================
// READ - admin fetches ALL records in their family
// ============================================================
export const fetchFamilyRecords = async (familyId: string) => {
  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("id, user_id, full_name, status")
    .eq("family_id", familyId)
    .eq("status", "active");

  if (membersError) {
    throw new Error(`Failed to fetch members: ${membersError.message}`);
  }
  if (!members?.length) return [] as FamilyRecordRow[];

  const memberIds = members.map((m) => m.id);
  const userIds = members.filter((m) => m.user_id).map((m) => m.user_id!);

  const filters: string[] = [];
  if (memberIds.length) {
    filters.push(`owner_member_id.in.(${memberIds.join(",")})`);
  }
  if (userIds.length) {
    filters.push(`owner_user_id.in.(${userIds.join(",")})`);
  }

  if (!filters.length) return [] as FamilyRecordRow[];

  const { data: records, error: recordsError } = await supabase
    .from("records")
    .select("*")
    .or(filters.join(","))
    .eq("is_deleted", false)
    .order("record_date", { ascending: false });

  if (recordsError) {
    throw new Error(`Failed to fetch records: ${recordsError.message}`);
  }

  return (records ?? []).map((record) => {
    const owner = members.find(
      (m) =>
        m.id === record.owner_member_id || m.user_id === record.owner_user_id,
    );

    return {
      ...(record as RecordRow),
      owner_name: owner?.full_name ?? "Unknown",
      member_type: owner?.user_id ? "real" : "dummy",
    } as FamilyRecordRow;
  });
};

// ============================================================
// UPDATE - user or admin updates a record
// ============================================================
export const updateRecord = async (
  recordId: string,
  updatedById: string,
  changes: Partial<RecordRow>,
) => {
  const { data, error } = await supabase
    .from("records")
    .update({
      ...changes,
      updated_by_user_id: updatedById,
    })
    .eq("id", recordId)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) throw new Error(`Failed to update record: ${error.message}`);
  return data as RecordRow;
};

// ============================================================
// DELETE (soft) - user or admin soft deletes a record
// ============================================================
export const deleteRecord = async (recordId: string, deletedById: string) => {
  const { error } = await supabase
    .from("records")
    .update({
      is_deleted: true,
      updated_by_user_id: deletedById,
    })
    .eq("id", recordId);

  if (error) throw new Error(`Failed to delete record: ${error.message}`);
};

// ============================================================
// REMOVE DUMMY - admin removes dummy member
// ============================================================
export const removeDummyMember = async (memberId: string, _adminId: string) => {
  const { error: recordsError } = await supabase
    .from("records")
    .delete()
    .eq("owner_member_id", memberId);

  if (recordsError) {
    throw new Error(`Failed to delete member records: ${recordsError.message}`);
  }

  const { error: memberError } = await supabase
    .from("family_members")
    .update({ status: "removed" })
    .eq("id", memberId);

  if (memberError)
    throw new Error(`Failed to remove member: ${memberError.message}`);
};

// ============================================================
// LEAVE FAMILY - real user leaves
// ============================================================
export const leaveFamily = async (userId: string, familyId: string) => {
  const { error } = await supabase
    .from("family_members")
    .update({ status: "removed" })
    .eq("user_id", userId)
    .eq("family_id", familyId);

  if (error) throw new Error(`Failed to leave family: ${error.message}`);
};

// ============================================================
// CHANGE ADMIN - update family admin
// ============================================================
export const changeAdmin = async (familyId: string, newAdminId: string) => {
  const { error } = await supabase
    .from("families")
    .update({ admin_user_id: newAdminId })
    .eq("id", familyId);

  if (error) throw new Error(`Failed to change admin: ${error.message}`);
};
