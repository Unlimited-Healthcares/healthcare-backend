import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucketIfNotExists(bucketName: string) {
  console.log(`Checking bucket: ${bucketName}...`);
  const { data, error } = await supabase.storage.getBucket(bucketName);
  
  if (error && error.message.includes('not found')) {
    console.log(`Creating bucket: ${bucketName}...`);
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });
    
    if (createError) {
      console.error(`Failed to create bucket ${bucketName}:`, createError);
    } else {
      console.log(`Successfully created bucket ${bucketName}`);
    }
  } else if (data) {
    console.log(`Bucket ${bucketName} already exists.`);
    
    // Ensure it's public
    if (!data.public) {
      console.log(`Making bucket ${bucketName} public...`);
      await supabase.storage.updateBucket(bucketName, {
        public: true
      });
    }
  } else if (error) {
    console.error(`Error checking bucket ${bucketName}:`, error);
  }
}

async function main() {
  const buckets = ['avatars', 'medical-imaging', 'community', 'chat'];
  
  for (const bucket of buckets) {
    await createBucketIfNotExists(bucket);
  }
  
  console.log('Bucket setup complete.');
}

main();
