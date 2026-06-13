/**
 * MRTLC CORE NEXUS COUPLER
 * Bridges the custom UI elements directly to the array streams
 */
async function executeNexusCompilation() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');

    if (previewBox) previewBox.value = "⚡ INITIALIZING NATIVE APK DECRYPTION STREAM...";
    if (engineStatus) {
        engineStatus.innerText = "RUNNING";
        engineStatus.style.color = "var(--neon-cyan)";
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const buffer = e.target.result;
            
            // Execute the specialized, cool-running APK calculation core we built
            await processApkBinaryData(buffer);
            
            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
        } catch (err) {
            if (previewBox) previewBox.value = `❌ PIPELINE ERROR:\n${err.message}`;
            if (engineStatus) {
                engineStatus.innerText = "CRASH";
                engineStatus.style.color = "#ff3333";
            }
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * UPDATES FILE BUTTON VISUAL STATE ON SELECTION
 */
function processFileSelection(input) {
    const file = input.files[0];
    if (!file) return;

    const statusBox = document.getElementById('file-status-box');
    if (statusBox) {
        // Change text inside our neon dashed box to indicate successful mount
        statusBox.innerHTML = `🏁 READY: [${file.name.toUpperCase()}]`;
        statusBox.style.borderColor = "var(--neon-green)";
    }

    // Enable the compile button now that a file is fully mounted
    const compileBtn = document.getElementById('main-compile-btn');
    if (compileBtn) compileBtn.disabled = false;
}
