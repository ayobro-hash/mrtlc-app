/**
 * MRTLC CORE MATH COMPILER (BACKGROUND THREAD)
 */

self.onmessage = async function(e) {
    const arrayBuffer = e.data.buffer;
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    
    let offset = 14; // Advance past the "ROBLOX" binary header
    let extractedScripts = [];
    let discoveredNames = [];
    let chunkCount = 0;

    try {
        while (offset < bytes.length) {
            if (offset + 16 > bytes.length) break;

            const chunkType = String.fromCharCode(...bytes.subarray(offset, offset + 4));
            offset += 4;

            const compLen = view.getUint32(offset, true); offset += 4;
            const decompLen = view.getUint32(offset, true); offset += 4;
            offset += 4; // Skip flags

            let payload = bytes.subarray(offset, offset + compLen);
            offset += compLen;

            if (chunkType === "END\x00" || chunkType === "END") break;

            // ❄️ THERMAL REGULATOR SPEED BURST
            chunkCount++;
            if (chunkCount % 2 === 0) {
                self.postMessage({ status: "PROCESSING", message: `❄️ THERMAL PAUSE AT CHUNK [${chunkType}]...` });
                await new Promise(resolve => setTimeout(resolve, 4));
            }

            if (compLen < decompLen) {
                payload = decompressMultiBlockLZ4(payload, decompLen);
            }

            if (chunkType === "PROP") {
                const propString = String.fromCharCode(...payload.subarray(0, 30));

                // Instantly filter heavy spatial/3D graphics data out of processing memory
                if (propString.includes("CFrame") || propString.includes("Velocity") || propString.includes("Physics")) {
                    continue;
                }

                if (propString.includes("Source")) {
                    let interleaveStream = payload.subarray(12);
                    let restoredBytes = deInterleaveBuffer(interleaveStream, interleaveStream.length);
                    
                    const lengthView = new DataView(restoredBytes.buffer, restoredBytes.byteOffset, restoredBytes.byteLength);
                    const trueStringLength = lengthView.getUint32(0, true);
                    
                    if (trueStringLength > 0 && trueStringLength < restoredBytes.length) {
                        let pureCodeBytes = restoredBytes.subarray(4, 4 + trueStringLength);
                        let cleanSrc = new TextDecoder().decode(pureCodeBytes).trim();
                        cleanSrc = cleanSrc.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "");
                        
                        if (cleanSrc.length > 0) extractedScripts.push(cleanSrc);
                    }
                }
                else if (propString.includes("Name")) {
                    let interleaveStream = payload.subarray(12);
                    let restoredBytes = deInterleaveBuffer(interleaveStream, interleaveStream.length);
                    
                    const lengthView = new DataView(restoredBytes.buffer, restoredBytes.byteOffset, restoredBytes.byteLength);
                    const trueNameLength = lengthView.getUint32(0, true);
                    
                    if (trueNameLength > 0 && trueNameLength < restoredBytes.length) {
                        let pureNameBytes = restoredBytes.subarray(4, 4 + trueNameLength);
                        let nameText = new TextDecoder().decode(pureNameBytes).replace(/[\x00-\x1F]/g, "").trim();
                        if (nameText.length > 0 && !nameText.includes("Property")) {
                            discoveredNames.push(nameText);
                        }
                    }
                }
            }
        }

        // Return the clean data packages to the UI thread
        if (extractedScripts.length > 0) {
            const formattedCode = extractedScripts.map((src, i) => {
                return `-- // Instance Ref: [${discoveredNames[i] || "Script_" + (i + 1)}]\n${src}`;
            }).join("\n\n");
            
            self.postMessage({ status: "SUCCESS", code: formattedCode, count: extractedScripts.length });
        } else {
            self.postMessage({ status: "EMPTY", message: "-- ANALYSIS COMPLETE: 0 script strings matched container format arrays." });
        }

    } catch (err) {
        self.postMessage({ status: "PROCESSING", message: `❌ INTERNAL ENGINE FAILURE: ${err.message}` });
    }
};

// --- MULTI-BLOCK LZ4 ENGINE ---
function decompressMultiBlockLZ4(compressedData, expectedDecompressedLength) {
    const decompressedResult = new Uint8Array(expectedDecompressedLength);
    let srcIdx = 0, dstIdx = 0;

    while (dstIdx < expectedDecompressedLength && srcIdx < compressedData.length) {
        if (srcIdx + 4 > compressedData.length) break;
        
        const token = compressedData[srcIdx++];
        let literalLength = token >> 4;
        let matchLength = token & 0x0F;

        if (literalLength === 15) {
            while (compressedData[srcIdx] === 255) { literalLength += 255; srcIdx++; }
            literalLength += compressedData[srcIdx++];
        }

        for (let i = 0; i < literalLength; i++) {
            decompressedResult[dstIdx++] = compressedData[srcIdx++];
        }

        if (dstIdx >= expectedDecompressedLength || srcIdx >= compressedData.length) break;

        const offset = compressedData[srcIdx++] | (compressedData[srcIdx++] << 8);
        if (offset === 0) break;

        if (matchLength === 15) {
            while (compressedData[srcIdx] === 255) { matchLength += 255; srcIdx++; }
            matchLength += compressedData[srcIdx++];
        }
        matchLength += 4;

        let matchSrc = dstIdx - offset;
        for (let i = 0; i < matchLength; i++) {
            decompressedResult[dstIdx++] = decompressedResult[matchSrc++];
        }
    }
    return decompressedResult;
}

// --- MATRIX DE-INTERLEAVE ENGINE ---
function deInterleaveBuffer(payload, decompressedLength) {
    const restored = new Uint8Array(decompressedLength);
    const stride = Math.floor((decompressedLength + 3) / 4);
    for (let i = 0; i < decompressedLength; i++) {
        const blockIdx = i % 4;
        const posInBlock = Math.floor(i / 4);
        const srcIdx = (blockIdx * stride) + posInBlock;
        if (srcIdx < payload.length) restored[i] = payload[srcIdx];
    }
    return restored;
}
