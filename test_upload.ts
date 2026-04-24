import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const bucket = 'medical-imaging';
  const filePath = `test-user-id/test-file-${Date.now()}.txt`;
  const fileContent = Buffer.from('Test file content');
  
  console.log(`Attempting to upload to ${bucket}/${filePath}...`);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileContent, {
      contentType: 'text/plain',
      upsert: true,
    });

  if (error) {
    console.error('Upload failed with error:', error);
  } else {
    console.log('Upload succeeded!', data);
  }
}

testUpload();
