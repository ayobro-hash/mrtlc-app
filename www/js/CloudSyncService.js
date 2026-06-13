import { createClient } from '@supabase/supabase-js';

// Initialize your connection
const supabase = createClient('https://iuzsvwrvitwjaeqmurah.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1enN2d3J2aXR3amFlcW11cmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTkxMTksImV4cCI6MjA5Njg5NTExOX0.bUDDzB7C0gFBwKRhqqnBO7HNvy5qWsqbH3YzTt-u_LA');

export const CloudSyncService = {
  // 1. Encrypt and Upload
  async syncScript(filename, scriptContent) {
    try {
      // Get the user's session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      // Encrypt
      const key = await getOrGenerateKey(); 
      const encryptedBlob = await encryptScript(scriptContent, key);

      // Upload to your user_data table
      const { error } = await supabase
        .from('user_data')
        .insert([{
          user_id: user.id,
          filename: filename,
          encrypted_content: encryptedBlob
        }]);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Sync failed:", err);
      return { success: false, error: err };
    }
  }
};
