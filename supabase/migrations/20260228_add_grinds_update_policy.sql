-- Allow users to update their own grinds (needed for upsert on conflict)
CREATE POLICY "Users can update own grinds" ON grinds
  FOR UPDATE USING (auth.uid() = user_id);
