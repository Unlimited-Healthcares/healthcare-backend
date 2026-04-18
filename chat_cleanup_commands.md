
# Method 1: Execute the SQL script directly in PostgreSQL
docker exec -it healthcare-backend-postgres-1 psql -U postgres -d healthcare -f /tmp/clear_chat_data.sql

# Method 2: Copy script to container and execute
docker cp clear_chat_data.sql healthcare-backend-postgres-1:/tmp/
docker exec -it healthcare-backend-postgres-1 psql -U postgres -d healthcare -f /tmp/clear_chat_data.sql

# Method 3: Execute commands directly
docker exec -it healthcare-backend-postgres-1 psql -U postgres -d healthcare -c "
DELETE FROM chat_message_reactions;
DELETE FROM chat_messages;
DELETE FROM chat_participants;
DELETE FROM chat_rooms;
"

# Verify cleanup
docker exec -it healthcare-backend-postgres-1 psql -U postgres -d healthcare -c "
SELECT 'chat_message_reactions' as table_name, COUNT(*) as remaining_records FROM chat_message_reactions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'chat_participants', COUNT(*) FROM chat_participants
UNION ALL
SELECT 'chat_rooms', COUNT(*) FROM chat_rooms;
"

