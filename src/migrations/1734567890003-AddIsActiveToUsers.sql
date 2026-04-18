-- Add isActive field to users table
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;

-- Add index for better performance
CREATE INDEX idx_users_is_active ON users(isActive);
