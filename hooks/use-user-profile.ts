import { useCallback, useState } from "react";

import { supabase } from "@/lib/supabase";

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
  dob: string; // formatted as "DD / MM / YYYY"
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

const toSqlDate = (dob: string): string | null => {
  const parts = dob.split(" / ");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

// Convert SQL date (YYYY-MM-DD) to display format (DD / MM / YYYY)
const toDisplayDate = (sqlDate: string | null): string => {
  if (!sqlDate) return "";
  const [year, month, day] = sqlDate.split("-");
  return `${day} / ${month} / ${year}`;
};

export const useUserProfile = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

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
          error: userError?.message || "User not authenticated",
        };
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          "full_name, dob, gender, blood_group, height_cm, weight_kg, medical_notes, avatar_url",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        // No profile found yet, which is okay
        return { success: true, data: undefined };
      }

      return {
        success: true,
        data: {
          fullName: data.full_name || "",
          dob: toDisplayDate(data.dob),
          gender: (data.gender as Gender) || "Male",
          bloodGroup: (data.blood_group as BloodGroup) || "",
          height: data.height_cm ? String(data.height_cm) : "",
          weight: data.weight_kg ? String(data.weight_kg) : "",
          medicalNotes: data.medical_notes || "",
          avatarUrl: data.avatar_url || null,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Unable to load profile",
      };
    } finally {
      setLoading(false);
    }
  }, []);

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
            error: userError?.message || "User not authenticated",
          };
        }

        const formattedDob = toSqlDate(input.dob);
        if (!formattedDob) {
          return {
            success: false,
            error: "Invalid date format. Use DD / MM / YYYY.",
          };
        }

        const { error } = await supabase.from("user_profiles").upsert(
          {
            id: user.id,
            full_name: input.fullName.trim(),
            dob: formattedDob,
            gender: input.gender,
            blood_group: input.bloodGroup || null,
            height_cm: toNumberOrNull(input.height),
            weight_kg: toNumberOrNull(input.weight),
            medical_notes: input.medicalNotes?.trim() || null,
            avatar_url: input.avatarUrl || null,
          },
          { onConflict: "id" },
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || "Unable to save profile",
        };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    loadProfile,
    saveProfile,
    saving,
    loading,
  };
};
