
CREATE POLICY "Doubt images readable by authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'doubt-images');
CREATE POLICY "Users upload own doubt images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'doubt-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own doubt images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'doubt-images' AND auth.uid()::text = (storage.foldername(name))[1]);
