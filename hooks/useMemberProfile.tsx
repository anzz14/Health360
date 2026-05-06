import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

// ---- types (shared) ----
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

export interface MemberFormData {
  fullName: string;
  dob: string; // "DD / MM / YYYY"
  gender: Gender;
  relation: string;
  bloodGroup: BloodGroup | "";
  allergies: string[];
  conditions: string[];
  height: string;
  weight: string;
  avatarUrl: string | null;
}

// ---- helpers ----
const toSqlDate = (display: string) => {
  const parts = display.split(" / ");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const toDisplayDate = (sql: string | null) => {
  if (!sql) return "";
  const [y, m, d] = sql.split("-");
  return `${d} / ${m} / ${y}`;
};

const toNumberOrNull = (v: string) => {
  const n = Number(v.trim());
  return isNaN(n) ? null : n;
};

export const useMemberProfile = (profileId: string | undefined) => {
  const [form, setForm] = useState<MemberFormData>({
    fullName: "",
    dob: "",
    gender: "Male",
    relation: "Member",
    bloodGroup: "",
    allergies: [],
    conditions: [],
    height: "",
    weight: "",
    avatarUrl: null,
  });
  const [original, setOriginal] = useState<MemberFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // load profile by ID
  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();
    if (!error && data) {
      const relation = "Member"; // will be overwritten by membership join later
      // but we can get relation from family_memberships if needed;
      // for now keep as placeholder; the form will show it anyway.
      const parsed: MemberFormData = {
        fullName: data.full_name || "",
        dob: toDisplayDate(data.dob),
        gender: (data.gender as Gender) || "Male",
        relation: relation, // we’ll fetch separately
        bloodGroup: (data.blood_group as BloodGroup) || "",
        allergies: data.allergies || [],
        conditions: data.conditions || [],
        height: data.height_cm != null ? String(data.height_cm) : "",
        weight: data.weight_kg != null ? String(data.weight_kg) : "",
        avatarUrl: data.avatar_url ?? null,
      };
      setForm(parsed);
      setOriginal(parsed);
    } else {
      console.error("Failed to load profile:", error);
    }
    setLoading(false);

    // also fetch relation from family_memberships (if needed)
    if (profileId) {
      const { data: mem } = await supabase
        .from("family_memberships")
        .select("relation")
        .eq("profile_id", profileId)
        .single();
      if (mem) {
        setForm((prev) => ({ ...prev, relation: mem.relation }));
        setOriginal((prev) =>
          prev ? { ...prev, relation: mem.relation } : prev,
        );
      }
    }
  }, [profileId]);

  // save changes
  const save = useCallback(async () => {
    if (!profileId) return;
    setSaving(true);
    const sqlDate = toSqlDate(form.dob);
    if (!sqlDate) {
      setSaving(false);
      throw new Error("Invalid date format");
    }
    const updates = {
      full_name: form.fullName.trim(),
      dob: sqlDate,
      gender: form.gender,
      blood_group: form.bloodGroup || null,
      height_cm: toNumberOrNull(form.height),
      weight_kg: toNumberOrNull(form.weight),
      conditions: form.conditions,
      allergies: form.allergies,
      avatar_url: form.avatarUrl,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId);
    if (error) {
      setSaving(false);
      throw error;
    }
    // also update relation in family_memberships
    const { error: relError } = await supabase
      .from("family_memberships")
      .update({ relation: form.relation })
      .eq("profile_id", profileId);
    if (relError) console.error("Relation update failed:", relError);
    setSaving(false);
  }, [form, profileId]);

  // track dirtiness
  const isDirty = original
    ? JSON.stringify(form) !== JSON.stringify(original)
    : false;

  return { form, setForm, load, save, loading, saving, isDirty };
};
