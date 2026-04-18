-- Chat Data Cleanup Script
-- This script safely removes all regular chat data while preserving other system data
-- Run these commands in order to avoid foreign key constraint violations

-- Step 1: Delete message reactions first (they reference messages)
DELETE FROM chat_message_reactions;

-- Step 2: Delete chat messages (they reference rooms)
DELETE FROM chat_messages;

-- Step 3: Delete chat participants (they reference rooms)
DELETE FROM chat_participants;

-- Step 4: Delete chat rooms (main table)
DELETE FROM chat_rooms;

-- Optional: Reset auto-increment sequences if using serial IDs
-- (Not needed for UUID primary keys)

-- Verification queries to confirm cleanup:
SELECT 'chat_message_reactions' as table_name, COUNT(*) as remaining_records FROM chat_message_reactions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'chat_participants', COUNT(*) FROM chat_participants
UNION ALL
SELECT 'chat_rooms', COUNT(*) FROM chat_rooms;

-- Show that other tables are unaffected:
SELECT 'ai_chat_sessions' as table_name, COUNT(*) as records FROM ai_chat_sessions
UNION ALL
SELECT 'ai_chat_messages', COUNT(*) FROM ai_chat_messages
UNION ALL
SELECT 'users', COUNT(*) FROM users;
