-- Add push_token column to profiles table for Expo push notifications
-- This allows us to send notifications to users when they receive matches

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
ON profiles(push_token)
WHERE push_token IS NOT NULL;

-- Update the RLS policies if needed (push_token should only be writable by the user themselves)
-- Users can read their own push_token and update it
-- No need to create new policies as existing user policies should cover this

-- Add comment for documentation
COMMENT ON COLUMN profiles.push_token IS 'Expo push notification token for sending push notifications to user devices';
