import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Hardcoded for testing inside your js folder environment
const supabase = createClient('https://iuzsvwrvitwjaeqmurah.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1enN2d3J2aXR3amFlcW11cmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTkxMTksImV4cCI6MjA5Njg');

export const CloudSyncService = {
    async sync(filename, data) {
        try {
            const { error } = await supabase
                .from('user_data')
                .insert([{ filename: filename, encrypted_content: data }]);
                
            return { success: !error };
        } catch (fail) {
            return { success: false, error: fail };
        }
    }
};
