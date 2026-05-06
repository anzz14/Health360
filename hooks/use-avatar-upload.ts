import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

const BUCKET = "avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarUploadResult {
  publicUrl: string;
  path: string;
}

export interface UseAvatarUploadReturn {
  /** Public URL of the uploaded avatar (or null if not yet uploaded) */
  avatarUrl: string | null;
  /** True while the image is being uploaded */
  uploading: boolean;
  /** Error message if the last upload failed */
  error: string | null;
  /** Open the image picker and upload the result */
  pickAndUpload: () => Promise<AvatarUploadResult | null>;
  /** Set a URL directly (useful when loading an existing profile) */
  setAvatarUrl: (url: string | null) => void;
}

export interface UseAvatarUploadOptions {
  /** Optional avatar URL to seed the hook with on mount */
  initialAvatarUrl?: string | null;
}

// ─── Helper: URI → Blob ───────────────────────────────────────────────────────
// React Native doesn't expose Blob natively from a file URI, so we fetch it.

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

export async function uploadAvatarToStorage(
  uri: string,
): Promise<AvatarUploadResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("You must be logged in to upload a photo.");
  }

  const userId = authData.user.id;
  const ext = (uri.split(".").pop() ?? "jpg")
    .toLowerCase()
    .replace(/\?.*$/, "");
  const path = `${userId}/avatar.${ext}`;
  const blob = await uriToBlob(uri);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: blob.type || `image/${ext}`,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  return { publicUrl, path };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAvatarUpload
 *
 * Handles the full avatar flow:
 *   1. Request media-library permission
 *   2. Launch the image picker
 *   3. Upload the chosen image to Supabase Storage (bucket: "avatar")
 *   4. Return & store the public URL
 *
 * Upload path: `<auth_user_id>/avatar.<ext>`
 * Uploads are upserted, so re-uploading just overwrites the old file.
 *
 * Usage:
 *   const { avatarUrl, uploading, pickAndUpload, setAvatarUrl } = useAvatarUpload();
 *
 *   // Load existing profile
 *   setAvatarUrl(profile.avatar_url);
 *
 *   // On press
 *   await pickAndUpload();
 */
export function useAvatarUpload(
  options: UseAvatarUploadOptions = {},
): UseAvatarUploadReturn {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    options.initialAvatarUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.initialAvatarUrl !== undefined) {
      setAvatarUrl(options.initialAvatarUrl);
    }
  }, [options.initialAvatarUrl]);

  const pickAndUpload =
    useCallback(async (): Promise<AvatarUploadResult | null> => {
      setError(null);

      // ── 1. Permission ───────────────────────────────────────────────────────
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Camera roll permission is required to set a profile photo.");
        return null;
      }

      // ── 2. Pick ─────────────────────────────────────────────────────────────
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (picked.canceled) return null;

      const asset = picked.assets[0];
      setUploading(true);

      try {
        const uploaded = await uploadAvatarToStorage(asset.uri);
        setAvatarUrl(uploaded.publicUrl);
        return uploaded;
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error("[AvatarUpload]", err);
        return null;
      } finally {
        setUploading(false);
      }
    }, []);

  return { avatarUrl, uploading, error, pickAndUpload, setAvatarUrl };
}
