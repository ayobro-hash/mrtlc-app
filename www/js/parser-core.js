// Import the Master Router Engine
import { NexusParser } from './nexus-parser.js';

document.addEventListener('DOMContentLoaded', () => {
    const parseBtn = document.getElementById('parse-btn');
    const inputBox = document.getElementById('input-box');
    const outputBox = document.getElementById('output-box');

    parseBtn.addEventListener('click', async () => {
        try {
            const rawData = inputBox.value;

            // Run through the newly separated multi-format pipeline
            const parsedResult = await NexusParser.parse(rawData);

            // Output the JSON string directly to the interface
            outputBox.textContent = JSON.stringify(parsedResult, null, 4);
            outputBox.style.color = "#7ee787"; 
            
        } catch (error) {
            outputBox.textContent = `[PARSER ERROR]: ${error.message}`;
            outputBox.style.color = "#f85149"; 
        }
    });
});
