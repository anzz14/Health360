import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Gender = "Male" | "Female" | "Other";
export type BloodGroup =
  | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

type SaveUserProfileInput = {
  fullName: string;
  dob: string;
  gender: Gender;
  bloodGroup: BloodGroup | "";
  height: string;
  weight: string;
  medicalNotes?: string;
  avatarUrl?: string | null;
};

type SaveUserProfileResult = {
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
  medicalNotes: string;
  avatarUrl: string | null;
};

type LoadUserProfileResult = {
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
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async (): Promise<LoadUserProfileResult> => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: userError?.message || "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("full_name, dob, gender, blood_group, height_cm, weight_kg, medical_notes, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        // PGRST116 = no rows → first time user, that's fine
        if (error.code === "PGRST116") return { success: true, data: undefined };
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          fullName:     data.full_name     || "",
          dob:          toDisplayDate(data.dob),
          gender:       (data.gender       as Gender)      || "Male",
          bloodGroup:   (data.blood_group  as BloodGroup)  || "",
          height:       data.height_cm  ? String(data.height_cm)  : "",
          weight:       data.weight_kg  ? String(data.weight_kg)  : "",
          medicalNotes: data.medical_notes || "",
          avatarUrl:    data.avatar_url    || null,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Unable to load profile" };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveProfile = useCallback(
    async (input: SaveUserProfileInput): Promise<SaveUserProfileResult> => {
      setSaving(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          return { success: false, error: userError?.message || "User not authenticated" };
        }

        const formattedDob = toSqlDate(input.dob);
        if (!formattedDob) {
          return { success: false, error: "Invalid date format. Use DD / MM / YYYY." };
        }

        // ── 1. Upsert user_profiles ──────────────────────────────────────────
        // The DB trigger will automatically sync these values to family_members.
        // We still do a manual sync below as a belt-and-suspenders fallback.
        const profilePayload = {
          id:            user.id,
          full_name:     input.fullName.trim(),
          dob:           formattedDob,
          gender:        input.gender,
          blood_group:   input.bloodGroup   || null,
          height_cm:     toNumberOrNull(input.height),
          weight_kg:     toNumberOrNull(input.weight),
          medical_notes: input.medicalNotes?.trim() || null,
          avatar_url:    input.avatarUrl    || null,
        };

        const { error: upsertError } = await supabase
          .from("user_profiles")
          .upsert(profilePayload, { onConflict: "id" });

        if (upsertError) {
          return { success: false, error: upsertError.message };
        }

        // ── 2. Manually sync to family_members (belt-and-suspenders) ─────────
        // The trigger handles this automatically, but we do it here too
        // so the UI reflects changes immediately without a round-trip.
        const { data: memberships } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id);

        if (memberships && memberships.length > 0) {
          const syncPayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          // Only overwrite non-null values so we don't blank out
          // fields the family admin set manually
          if (input.fullName.trim())        syncPayload.full_name     = input.fullName.trim();
          if (formattedDob)                 syncPayload.dob           = formattedDob;
          if (input.gender)                 syncPayload.gender        = input.gender;
          if (input.bloodGroup)             syncPayload.blood_group   = input.bloodGroup;
          if (input.avatarUrl)              syncPayload.avatar_url    = input.avatarUrl;
          if (toNumberOrNull(input.height)) syncPayload.height_cm     = toNumberOrNull(input.height);
          if (toNumberOrNull(input.weight)) syncPayload.weight_kg     = toNumberOrNull(input.weight);
          if (input.medicalNotes?.trim())   syncPayload.medical_notes = input.medicalNotes.trim();

          const { error: syncError } = await supabase
            .from("family_members")
            .update(syncPayload)
            .eq("user_id", user.id);

          if (syncError) {
            // Non-fatal: profile was saved, sync just didn't apply
            console.warn("[saveProfile] family_members sync warning:", syncError.message);
          }
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || "Unable to save profile" };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { loadProfile, saveProfile, saving, loading };
};