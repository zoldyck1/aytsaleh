import { supabase } from '../lib/supabase';

export async function setupStorage() {
  try {
    console.log('Setting up Supabase storage...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketName = 'post-images';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB in bytes
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }

      console.log('Bucket created successfully:', data);
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }

    // Test upload functionality
    console.log('Testing storage access...');
    const testFileName = 'test-access.txt';
    const testContent = new Blob(['test'], { type: 'text/plain' });
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testContent);

    if (uploadError) {
      console.error('Error testing upload:', uploadError);
      return false;
    }

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);

    if (deleteError) {
      console.warn('Warning: Could not delete test file:', deleteError);
    }

    console.log('Storage setup completed successfully!');
    return true;

  } catch (error) {
    console.error('Error setting up storage:', error);
    return false;
  }
}

// Run setup if called directly
if (typeof window !== 'undefined') {
  // Browser environment - can be called manually
  (window as any).setupStorage = setupStorage;
}
