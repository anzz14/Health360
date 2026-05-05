import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Gender = "Male" | "Female" | "Other";
export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type SaveUserProfileInput = {
  fullName: string;
  dob: string;
  gender: Gender;
  bloodGroup: BloodGroup | "";
  height: string;
  weight: string;
  conditions?: string[];
  medicalNotes?: string;
  avatarUrl?: string | null;
};

export type SaveUserProfileResult = {
  success: boolean;
  error?: string;
};

export type LoadedUserProfile = {
  fullName: string;
  dob: string;
  gender: Gender;
  bloodGroup: BloodGroup | "";
  height: string;
  weight: string;
  conditions: string[];
  medicalNotes: string;
  avatarUrl: string | null;
};

export type LoadUserProfileResult = {
  success: boolean;
  data?: LoadedUserProfile;
  error?: string;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

const toSqlDate = (dob: string): string | null => {
  const parts = dob.split(" / ");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const toDisplayDate = (sqlDate: string | null): string => {
  if (!sqlDate) return "";
  const [year, month, day] = sqlDate.split("-");
  return `${day} / ${month} / ${year}`;
};

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUserProfile = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  // New schema: profiles table, keyed by auth_user_id (not id = auth uid)

  const loadProfile = useCallback(async (): Promise<LoadUserProfileResult> => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: userError?.message ?? "User not authenticated",
        };
      }

      // NEW: query by auth_user_id, not by id
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, dob, gender, blood_group, height_cm, weight_kg, conditions, medical_notes, avatar_url",
        )
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      // No profile yet — first-time user
      if (!data) {
        return { success: true, data: undefined };
      }

      return {
        success: true,
        data: {
          fullName: data.full_name ?? "",
          dob: toDisplayDate(data.dob),
          gender: (data.gender as Gender) ?? "Male",
          bloodGroup: (data.blood_group as BloodGroup) ?? "",
          height: data.height_cm != null ? String(data.height_cm) : "",
          weight: data.weight_kg != null ? String(data.weight_kg) : "",
          conditions: (data.conditions as string[]) ?? [],
          medicalNotes: data.medical_notes ?? "",
          avatarUrl: data.avatar_url ?? null,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message ?? "Unable to load profile",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  // New schema: upsert into profiles using auth_user_id.
  // family_memberships links profile.id → family.id (no direct user_id on memberships).
  // We sync the profile row; the memberships table has no duplicated profile fields
  // so no secondary sync is needed.

  const saveProfile = useCallback(
    async (input: SaveUserProfileInput): Promise<SaveUserProfileResult> => {
      setSaving(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return {
            success: false,
            error: userError?.message ?? "User not authenticated",
          };
        }

        const formattedDob = toSqlDate(input.dob);
        if (!formattedDob) {
          return {
            success: false,
            error: "Invalid date format. Use DD / MM / YYYY.",
          };
        }

        // ── 1. Check if a profile row already exists for this auth user ───────
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (fetchError) {
          return { success: false, error: fetchError.message };
        }

        const profilePayload = {
          auth_user_id: user.id,
          full_name: input.fullName.trim(),
          dob: formattedDob,
          gender: input.gender || null,
          blood_group: input.bloodGroup || null,
          height_cm: toNumberOrNull(input.height),
          weight_kg: toNumberOrNull(input.weight),
          conditions: input.conditions ?? [],
          medical_notes: input.medicalNotes?.trim() || null,
          avatar_url: input.avatarUrl ?? null,
          updated_at: new Date().toISOString(),
        };

        if (existingProfile) {
          // ── 2a. Update existing profile row ──────────────────────────────────
          const { error: updateError } = await supabase
            .from("profiles")
            .update(profilePayload)
            .eq("id", existingProfile.id);

          if (updateError) {
            return { success: false, error: updateError.message };
          }
        } else {
          // ── 2b. Insert new profile row ───────────────────────────────────────
          // RLS "profiles_insert" allows insert when auth_user_id = auth.uid()
          const { error: insertError } = await supabase
            .from("profiles")
            .insert(profilePayload);

          if (insertError) {
            return { success: false, error: insertError.message };
          }
        }

        // ── 3. No secondary sync needed ───────────────────────────────────────
        // In the new schema, family_memberships only stores (family_id, profile_id,
        // relation, status). All personal data lives solely in profiles.
        // The family list view joins profiles live, so it always shows fresh data.

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message ?? "Unable to save profile",
        };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { loadProfile, saveProfile, saving, loading };
};