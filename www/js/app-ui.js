import { CloudSyncService } from './CloudSyncService.js';

// URL matches relatively inside the js folder now
const nexusWorker = new Worker(new URL('./nexus-worker.js', import.meta.url), { type: 'module' });

document.addEventListener('DOMContentLoaded', () => {
    const syncBtn = document.getElementById('sync-btn');
    const editor = document.getElementById('editor');
    const lineNumbers = document.getElementById('line-numbers');
    const filenameInput = document.getElementById('filename-input');
    const consoleOutput = document.getElementById('console-output');
    const statusText = document.getElementById('status-text');

    editor.addEventListener('input', () => {
        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    });

    function terminalLog(message, type = 'system') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const logEntry = document.createElement('div');
        logEntry.className = `log ${type}`;
        logEntry.textContent = `[${time}] ${message}`;
        consoleOutput.appendChild(logEntry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function updateStatus(message, btnText = "SYNC UPLINK") {
        statusText.textContent = message;
        syncBtn.innerHTML = `<span class="cloud-icon">☁️</span> ${btnText}`;
    }

    syncBtn.addEventListener('click', () => {
        const scriptData = editor.value;
        const filename = filenameInput.value;

        if (!scriptData.trim()) {
            terminalLog('ERR: Cannot sync empty buffer.', 'error');
            return;
        }

        syncBtn.disabled = true;
        terminalLog(`Initiating sequence for [${filename}]...`);
        updateStatus('Encrypting...', 'WORKING...');

        nexusWorker.postMessage({
            type: 'ENCRYPT',
            payload: { text: scriptData }
        });
    });

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
        setTimeout(() => updateStatus('Ready', 'SYNC UPLINK'), 3000);
    };

    document.getElementById('clear-term').addEventListener('click', () => {
        consoleOutput.innerHTML = '';
        terminalLog('Terminal cleared.');
    });
});
