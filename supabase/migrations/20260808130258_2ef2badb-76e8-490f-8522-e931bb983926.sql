CREATE POLICY "Usuarios leem seus documentos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios enviam seus documentos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios atualizam seus documentos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios apagam seus documentos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);