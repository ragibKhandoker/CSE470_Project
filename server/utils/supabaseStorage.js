const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the server-only service role key for uploads. An anon key usually
// cannot write to a private Storage bucket without an explicit upload policy.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const isPlaceholder = (value = '') => /your[_ -]?(project|supabase|anon|service|api|key)|placeholder/i.test(value);
const hasPlaceholderCredentials = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseKey);
let validSupabaseUrl = false;

try {
  const parsedUrl = new URL(supabaseUrl);
  validSupabaseUrl = (parsedUrl.protocol === 'https:' || parsedUrl.hostname === 'localhost') && !hasPlaceholderCredentials;
} catch {
  // Missing or malformed SUPABASE_URL is treated as an unconfigured integration.
}

let supabase = null;
if (validSupabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else if (hasPlaceholderCredentials) {
  console.warn('[Supabase Storage] Placeholder credentials found in server/.env; uploads will use local storage until real project credentials are configured.');
}

/**
 * Upload an image to Supabase Storage bucket ('food-images')
 * Returns the public HTTPS URL.
 * Falls back gracefully to local path `/uploads/${file.filename}` if Supabase is not configured.
 */
const uploadToSupabase = async (file, bucketName = 'food-images') => {
  if (!file) return null;

  // Fallback when Supabase is not configured. Avoid issuing requests to
  // placeholder project URLs, which otherwise surface as a vague "fetch failed".
  if (!supabase) {
    return `/uploads/${file.filename}`;
  }

  try {
    const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanFilename = `food-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const fileBuffer = file.buffer || fs.readFileSync(file.path);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(cleanFilename, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.warn('⚠️ Supabase Storage upload failed, falling back to local storage:', error.message);
      return `/uploads/${file.filename}`;
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(cleanFilename);

    console.log('✅ Image uploaded to Supabase Storage:', publicData.publicUrl);
    return publicData.publicUrl;
  } catch (err) {
    console.warn('⚠️ Supabase Storage exception, using local fallback:', err.message);
    return file.filename ? `/uploads/${file.filename}` : null;
  }
};

module.exports = {
  supabase,
  uploadToSupabase
};
