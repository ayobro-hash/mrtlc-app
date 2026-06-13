import { CloudSyncService } from './CloudSyncService.js';

// 1. Initialize the Worker
const nexusWorker = new Worker(new URL('./nexus-worker.js', import.meta.url));

// 2. Main UI Event Controller
const syncBtn = document.getElementById('sync-btn');
const editor = document.getElementById('editor'); // Your code input
const fileNameInput = document.getElementById('filename-input');

syncBtn.addEventListener('click', async () => {
    const code = editor.value;
    const filename = fileNameInput.value;

    if (!code || !filename) {
        alert("Please enter code and a filename.");
        return;
    }

    // Tell the worker to encrypt
    nexusWorker.postMessage({ 
        type: 'ENCRYPT', 
        payload: { text: code, key: await getOrGenerateKey() } 
    });
});

// 3. Listen for responses from the Worker
nexusWorker.onmessage = async (e) => {
    const { type, data } = e.data;

    if (type === 'ENCRYPT_SUCCESS') {
        // Now send to Supabase
        const result = await CloudSyncService.syncScript(fileNameInput.value, data);
        
        if (result.success) {
            alert("Success: Script is encrypted and stored in the cloud.");
        } else {
            alert("Error: Failed to sync with Supabase.");
        }
    } else if (type === 'ERROR') {
        console.error("Worker Error:", e.data.error);
    }
};

// 4. Helper for Master Key (Keep this in your UI or a utility file)
async function getOrGenerateKey() {
    let key = localStorage.getItem('mrtlc_master_key');
    // ... (logic from earlier)
    return key;
}
