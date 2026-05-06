import { RecordType } from "@/types";

export type RecordFormState = {
  record_type: RecordType;
  title: string;
  description: string;
  record_date: string;
  doctor_name: string;
  hospital_or_clinic: string;
  attachments: string;
  notes: string;
  tags: string;
};

export type RecordOwnerOption = {
  id: string;
  name: string;
  userId: string | null;
};

export const RECORD_TYPES: RecordType[] = [
  "radiology",
  "hospitalization",
  "vaccination",
  "lab_result",
  "prescription",
  "dental",
  "ophthalmology",
  "allergy_test",
  "surgery",
  "mental_health",
  "general_checkup",
];

export const DEFAULT_RECORD_FORM: RecordFormState = {
  record_type: "general_checkup",
  title: "",
  description: "",
  record_date: new Date().toISOString().slice(0, 10),
  doctor_name: "",
  hospital_or_clinic: "",
  attachments: "",
  notes: "",
  tags: "",
};

export const toLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

export const csvToArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
