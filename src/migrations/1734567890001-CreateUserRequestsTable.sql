-- Create user_requests table
CREATE TABLE user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'connection', 'job_application', 'collaboration', 
    'patient_request', 'staff_invitation', 'referral'
  )),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_requests_sender ON user_requests(sender_id);
CREATE INDEX idx_user_requests_recipient ON user_requests(recipient_id);
CREATE INDEX idx_user_requests_status ON user_requests(status);
CREATE INDEX idx_user_requests_type ON user_requests(request_type);
CREATE INDEX idx_user_requests_created_at ON user_requests(created_at);
