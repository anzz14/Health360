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
  conditions?: string[]; // ← condition IDs + any custom strings
  medicalNotes?: string; // ← free-text extra notes (separate from conditions)
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
  conditions: string[]; // ← restored as array
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

      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          "full_name, dob, gender, blood_group, height_cm, weight_kg, conditions, medical_notes, avatar_url",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        // PGRST116 = no rows yet → first-time user, that's fine
        if (error.code === "PGRST116")
          return { success: true, data: undefined };
        return { success: false, error: error.message };
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
          conditions: (data.conditions as string[]) ?? [], // ← direct array
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

        // ── 1. Upsert user_profiles ──────────────────────────────────────────
        const profilePayload = {
          id: user.id,
          full_name: input.fullName.trim(),
          dob: formattedDob,
          gender: input.gender,
          blood_group: input.bloodGroup || null,
          height_cm: toNumberOrNull(input.height),
          weight_kg: toNumberOrNull(input.weight),
          conditions: input.conditions ?? [], // ← text[] array
          medical_notes: input.medicalNotes?.trim() || null,
          avatar_url: input.avatarUrl ?? null,
        };

        const { error: upsertError } = await supabase
          .from("user_profiles")
          .upsert(profilePayload, { onConflict: "id" });

        if (upsertError) {
          return { success: false, error: upsertError.message };
        }

        // ── 2. Belt-and-suspenders sync → family_members ─────────────────────
        // The DB trigger handles this automatically, but we do it immediately
        // here too so the UI reflects changes without waiting for a round-trip.
        const { data: memberships } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id);

        if (memberships && memberships.length > 0) {
          const syncPayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          // Only overwrite with non-empty values so we never blank out
          // fields the family admin set manually.
          if (input.fullName.trim())
            syncPayload.full_name = input.fullName.trim();
          if (formattedDob) syncPayload.dob = formattedDob;
          if (input.gender) syncPayload.gender = input.gender;
          if (input.bloodGroup) syncPayload.blood_group = input.bloodGroup;
          if (input.avatarUrl) syncPayload.avatar_url = input.avatarUrl;
          if (toNumberOrNull(input.height))
            syncPayload.height_cm = toNumberOrNull(input.height);
          if (toNumberOrNull(input.weight))
            syncPayload.weight_kg = toNumberOrNull(input.weight);
          if ((input.conditions ?? []).length)
            syncPayload.conditions = input.conditions; // ← NEW
          if (input.medicalNotes?.trim())
            syncPayload.medical_notes = input.medicalNotes.trim();

          const { error: syncError } = await supabase
            .from("family_members")
            .update(syncPayload)
            .eq("user_id", user.id);

          if (syncError) {
            // Non-fatal — profile saved successfully, sync just didn't apply
            console.warn(
              "[saveProfile] family_members sync warning:",
              syncError.message,
            );
          }
        }

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
