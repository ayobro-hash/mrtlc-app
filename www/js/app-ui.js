import { CloudSyncService } from './CloudSyncService.js';

const nexusWorker = new Worker(new URL('./nexus-worker.js', import.meta.url), { type: 'module' });

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const syncBtn = document.getElementById('sync-btn');
    const editor = document.getElementById('editor');
    const lineNumbers = document.getElementById('line-numbers');
    const filenameInput = document.getElementById('filename-input');
    const consoleOutput = document.getElementById('console-output');
    const statusText = document.getElementById('status-text');

    // 1. UI Polish: Auto-updating Line Numbers
    editor.addEventListener('input', () => {
        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    });

    // 2. Terminal Logger Helper
    function terminalLog(message, type = 'system') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const logEntry = document.createElement('div');
        logEntry.className = `log ${type}`;
        logEntry.textContent = `[${time}] ${message}`;
        consoleOutput.appendChild(logEntry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight; // Auto-scroll down
    }

    // 3. Status Bar Helper
    function updateStatus(message, btnText = "SYNC UPLINK") {
        statusText.textContent = message;
        syncBtn.innerHTML = `<span class="cloud-icon">☁️</span> ${btnText}`;
    }

    // 4. The Main Click Event
    syncBtn.addEventListener('click', () => {
        const scriptData = editor.value;
        const filename = filenameInput.value;

        if (!scriptData.trim()) {
            terminalLog('ERR: Cannot sync empty buffer.', 'error');
            return;
        }

        // Lock UI
        syncBtn.disabled = true;
        terminalLog(`Initiating sequence for [${filename}]...`);
        updateStatus('Encrypting...', 'WORKING...');

        // Send to Worker
        nexusWorker.postMessage({
            type: 'ENCRYPT',
            payload: { text: scriptData }
        });
    });

    // 5. Worker Response Handler
    nexusWorker.onmessage = async (e) => {
        const { type, data } = e.data;

        if (type === 'ENCRYPT_SUCCESS') {
            terminalLog('Encryption matrix locked. Establishing Supabase uplink...');
            updateStatus('Uploading...');
            
            const filename = filenameInput.value;
            const result = await CloudSyncService.sync(filename, data);
            
            if (result.success) {
                terminalLog(`SUCCESS: Packet [${filename}] securely written to cloud.`, 'success');
                updateStatus('Sync Complete', 'SYNCED');
            } else {
                terminalLog('ERR: Cloud packet rejection. Check database RLS.', 'error');
                updateStatus('Sync Failed', 'RETRY UPLINK');
            }
        } else {
            terminalLog('ERR: Worker thread calculation failed.', 'error');
            updateStatus('Worker Error', 'ERROR');
        }

        syncBtn.disabled = false;
        
        // Reset button text after 3 seconds
        setTimeout(() => updateStatus('Ready', 'SYNC UPLINK'), 3000);
    };

    // Clear Terminal button
    document.getElementById('clear-term').addEventListener('click', () => {
        consoleOutput.innerHTML = '';
        terminalLog('Terminal cleared.');
    });
});
