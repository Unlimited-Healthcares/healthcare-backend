-- Create invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  invitation_type VARCHAR(50) NOT NULL CHECK (invitation_type IN (
    'staff_invitation', 'doctor_invitation', 'patient_invitation', 'collaboration_invitation'
  )),
  role VARCHAR(50),
  message TEXT,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'declined', 'expired'
  )),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_center ON invitations(center_id);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);
CREATE INDEX idx_invitations_type ON invitations(invitation_type);
