import { CloudSyncService } from './CloudSyncService.js';

const nexusWorker = new Worker(new URL('./nexus-worker.js', import.meta.url), { type: 'module' });

document.addEventListener('DOMContentLoaded', () => {
    const syncBtn = document.getElementById('sync-btn');
    const editor = document.getElementById('editor');
    const filenameInput = document.getElementById('filename-input');
    const consoleOutput = document.getElementById('console-output');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    // Utility function to update status component elements
    function setUIStatus(state, message) {
        statusIndicator.className = `dot ${state}`;
        statusText.textContent = `Cloud Status: ${message}`;
        
        const timestamp = new Date().toLocaleTimeString();
        consoleOutput.innerHTML += `\n[${timestamp}] > ${message}`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight; // Auto scroll
    }

    syncBtn.addEventListener('click', () => {
        const scriptData = editor.value.trim();
        const filename = filenameInput.value.trim();

        if (!scriptData) {
            setUIStatus('error', 'Operation aborted: Editor buffer empty.');
            return;
        }

        // Lock button UI during runtime execution
        syncBtn.disabled = true;
        setUIStatus('syncing', 'Encoding asset stream...');

        // Pass payload sequence over thread wall to worker pipeline
        nexusWorker.postMessage({
            type: 'ENCRYPT',
            payload: { text: scriptData }
        });
    });

    // Intercept callback loops originating from background worker core
    nexusWorker.onmessage = async (e) => {
        const { type, data } = e.data;

        if (type === 'ENCRYPT_SUCCESS') {
            setUIStatus('syncing', 'Transmitting payload packet to Supabase infrastructure...');
            
            const filename = filenameInput.value.trim();
            const result = await CloudSyncService.sync(filename, data);
            
            // React clean based on network completion flags
            if (result.success) {
                setUIStatus('online', 'Data verification confirmed. Secure sync complete!');
            } else {
                setUIStatus('error', 'Database write operation rejected.');
            }
        } else {
            setUIStatus('error', 'Worker internal calculation exception.');
        }

        // Restore click interactions
        syncBtn.disabled = false;
    };
});
