-- Anyone authenticated can upload/update their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatar' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatar' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars are publicly readable
CREATE POLICY "Avatars are public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatar');