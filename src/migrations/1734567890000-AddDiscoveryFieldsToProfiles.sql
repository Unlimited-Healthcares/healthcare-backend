-- Add discovery fields to profiles table
ALTER TABLE profiles ADD COLUMN qualifications JSONB;
ALTER TABLE profiles ADD COLUMN location JSONB;
ALTER TABLE profiles ADD COLUMN availability JSONB;
ALTER TABLE profiles ADD COLUMN privacy_settings JSONB;

-- Add indexes for better performance
CREATE INDEX idx_profiles_qualifications ON profiles USING GIN(qualifications);
CREATE INDEX idx_profiles_location ON profiles USING GIN(location);
CREATE INDEX idx_profiles_availability ON profiles USING GIN(availability);
CREATE INDEX idx_profiles_privacy_settings ON profiles USING GIN(privacy_settings);
