/**
 * Database schema types for Health360
 */

// ─── Join Requests ────────────────────────────────────────────────────────
export type JoinRequest = {
  id: string;
  family_id: string;
  user_id: string;
  requester_name: string;
  status: "pending" | "approved" | "rejected";
  mapped_member_id: string;
  created_at: string;
};

// ─── Family Members ───────────────────────────────────────────────────────
export type FamilyMemberRow = {
  id: string;
  family_id: string;
  user_id: string | null;
  full_name: string;
  relation: string | null;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  medical_notes: string | null;
  avatar_url: string | null;
  created_at: string;
};

// ─── User Profiles ────────────────────────────────────────────────────────
export type UserProfileRow = {
  id: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  medical_notes: string | null;
  avatar_url: string | null;
  created_at: string;
};

// ─── Profile Merge Dialog ────────────────────────────────────────────────
export type ProfileMergeDialogProps = {
  visible: boolean;
  existingMember: FamilyMemberRow;
  incomingProfile: UserProfileRow;
  onChoose: (chosen: "existing" | "incoming") => void;
  onDismiss: () => void;
};

// ─── Accept Join Request Hook ────────────────────────────────────────────
export type AcceptResult = {
  needsMerge: boolean;
  existingMember?: FamilyMemberRow;
  incomingProfile?: UserProfileRow;
};
