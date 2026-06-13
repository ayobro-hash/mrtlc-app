/**
 * MRTLC FRONTEND CONTROLLER & BLOB BRIDGE
 */

// Global reference to the active background thread
let decompilerWorker = null;
let mountedFileBuffer = null;

function processFileSelection(input) {
    const file = input.files[0];
    if (!file) return;

    const statusBox = document.getElementById('file-status-box');
    if (statusBox) {
        statusBox.innerHTML = `🏁 READY: [${file.name.toUpperCase()}]`;
        statusBox.style.borderColor = "var(--neon-green)";
    }

    const compileBtn = document.getElementById('main-compile-btn');
    if (compileBtn) compileBtn.disabled = false;

    // Read the file into memory ahead of time
    const reader = new FileReader();
    reader.onload = function(e) {
        mountedFileBuffer = e.target.result;
    };
    reader.readAsArrayBuffer(file);
}

async function executeNexusCompilation() {
    if (!mountedFileBuffer) return;

    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');

    if (previewBox) previewBox.value = "⚡ SPINNING UP SECURE BACKGROUND THREAD...";
    if (engineStatus) {
        engineStatus.innerText = "LAUNCHING";
        engineStatus.style.color = "var(--neon-cyan)";
    }

    try {
        // APK COMPILER BYPASS: Fetch the second JS file as raw text data
        const response = await fetch('js/nexus-worker.js');
        if (!response.ok) throw new Error("Could not locate background engine script.");
        const workerCode = await response.text();
        
        // Convert the text code into an executable data blob url
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        // Spawn the isolated background processor
        decompilerWorker = new Worker(workerUrl);

        // Listen for the clean code coming back from the worker file
        decompilerWorker.onmessage = function(e) {
            const data = e.data;
            
            if (data.status === "PROCESSING") {
                if (previewBox) previewBox.value = data.message;
            } 
            else if (data.status === "SUCCESS") {
                if (engineStatus) {
                    engineStatus.innerText = "SUCCESS";
                    engineStatus.style.color = "var(--neon-green)";
                }
                document.getElementById('workspace-stats').innerText = `SCRIPTS: ${data.count}`;
                if (previewBox) {
                    previewBox.value = `-- MRTLC TWO-FILE ENGINE COMPLETE\n\n` + data.code;
                }
                decompilerWorker.terminate(); // Clean up thread memory
            }
            else if (data.status === "EMPTY") {
                if (engineStatus) engineStatus.innerText = "STANDBY";
                if (previewBox) previewBox.value = data.message;
                decompilerWorker.terminate();
            }
        };

        // Pass the raw file buffer to the background chef thread
        decompilerWorker.postMessage({ buffer: mountedFileBuffer }, [mountedFileBuffer]);

    } catch (err) {
        if (previewBox) previewBox.value = `❌ BRIDGE CRASH:\n${err.message}`;
        if (engineStatus) {
            engineStatus.innerText = "CRASH";
            engineStatus.style.color = "#ff3333";
        }
    }
}
