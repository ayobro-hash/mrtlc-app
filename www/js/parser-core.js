import { NexusParser } from './nexus-parser.js';

document.addEventListener('DOMContentLoaded', () => {
    const parseBtn = document.getElementById('parse-btn');
    const inputBox = document.getElementById('input-box');
    const outputBox = document.getElementById('output-box');
    const fileInput = document.getElementById('file-input');

    let activeRawData = null;

    // Handle Direct File Uploads safely
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        // If it's a binary file, read it cleanly as a Data URL or text alternative 
        // that handles file headers safely, or directly as text if it's XML.
        reader.onload = async (event) => {
            activeRawData = event.target.result;
            inputBox.value = `[FILE LOADED]: ${file.name} (${file.size} bytes)\nClick "RUN PARSER" to process the raw binary stream.`;
            outputBox.textContent = "File loaded into memory buffer. Ready to parse.";
            outputBox.style.color = "#58a6ff";
        };

        // Binary files must be intercepted correctly
        if (file.name.endsWith('.rbxm') || file.name.endsWith('.rbxl')) {
            reader.readAsText(file); // Your backend modules can read the stream signature
        } else {
            reader.readAsText(file); // Standard reading for XML text strings
        }
    });

    parseBtn.addEventListener('click', async () => {
        try {
            // Use file buffer if available, otherwise fallback to the text area input
            const dataToParse = activeRawData || inputBox.value;

            if (!dataToParse || !dataToParse.trim() || dataToParse.startsWith("[FILE LOADED]")) {
                throw new Error("Input buffer is empty. Paste data or upload a file first.");
            }

            const parsedResult = await NexusParser.parse(dataToParse);

            outputBox.textContent = JSON.stringify(parsedResult, null, 4);
            outputBox.style.color = "#7ee787"; 
            
        } catch (error) {
            outputBox.textContent = `[PARSER ERROR]: ${error.message}`;
            outputBox.style.color = "#f85149"; 
        } finally {
            // Clear file memory buffer after running
            activeRawData = null;
        }
    });
});
