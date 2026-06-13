// =====================================================================
// ROBLOX BINARY CHUNK EXTRACTOR & LZ4 DECOMPRESSOR PORT
// Based on fiveman1 rbxm-parser specs for browser/Termux environments
// =====================================================================

export const RobloxBinaryParser = {
    async decode(bytes) {
        try {
            const totalBytes = bytes.length;
            
            // 1. Verify Magic Header
            const signature = String.fromCharCode(...bytes.slice(0, 6));
            if (signature !== "ROBLOX") {
                throw new Error("Invalid Binary format header layout.");
            }

            const numGroups = this.readInt32(bytes, 14);
            const numInstances = this.readInt32(bytes, 18);

            let offset = 28; // Start reading right after the header
            const chunks = [];
            const scriptSources = [];

            // 2. Loop Through Binary Chunks
            while (offset < totalBytes) {
                if (offset + 12 > totalBytes) break;

                const chunkType = String.fromCharCode(...bytes.slice(offset, offset + 4));
                const compressedLength = this.readInt32(bytes, offset + 4);
                const decompressedLength = this.readInt32(bytes, offset + 8);
                
                offset += 12; // Advance past chunk header data markers

                if (offset + compressedLength > totalBytes) break;

                const compressedData = bytes.slice(offset, offset + compressedLength);
                let decompressedData = null;

                // Decompress payload if it's packed (compressed size > 0)
                if (compressedLength > 0 && decompressedLength > 0) {
                    decompressedData = this.decompressLZ4(compressedData, decompressedLength);
                } else {
                    decompressedData = compressedData;
                }

                // Gather properties if we find a PROP chunk containing script text
                if (chunkType === "PROP" && decompressedData) {
                    this.analyzePropertyChunk(decompressedData, scriptSources);
                }

                chunks.push({
                    type: chunkType,
                    size: decompressedLength
                });

                offset += compressedLength;
                if (chunkType === "ENDS") break;
            }

            return {
                engine: "MRTLC_PORTABLE_BINARY_DECODER",
                format: "Roblox Binary (.rbxm)",
                status: "PARSED_SUCCESSFULLY",
                metadata: {
                    fileSize: `${totalBytes} bytes`,
                    totalInstances: numInstances,
                    chunkCount: chunks.length
                },
                chunksFound: chunks,
                extractedScripts: scriptSources
            };

        } catch (err) {
            throw new Error(`Binary Core Port Error: ${err.message}`);
        }
    },

    // 3. Native Roblox LZ4 Block Decompression Wrapper
    decompressLZ4(src, destLen) {
        const dest = new Uint8Array(destLen);
        let srcPtr = 0;
        let destPtr = 0;

        while (srcPtr < src.length) {
            const token = src[srcPtr++];
            let literalLen = token >> 4;

            // Handle long literal lengths
            if (literalLen === 15) {
                let nextByte;
                do {
                    nextByte = src[srcPtr++];
                    literalLen += nextByte;
                } while (nextByte === 255);
            }

            // Copy literals over
            for (let i = 0; i < literalLen; i++) {
                dest[destPtr++] = src[srcPtr++];
            }

            if (srcPtr >= src.length) break;

            // Read Match Offset
            const offset = src[srcPtr Inc] | (src[srcPtr + 1] << 8);
            srcPtr += 2;

            let matchLen = token & 0x0F;
            if (matchLen === 15) {
                let nextByte;
                do {
                    nextByte = src[srcPtr++];
                    matchLen += nextByte;
                } while (nextByte === 255);
            }
            matchLen += 4; // LZ4 minimum match constraint length

            // Duplicate match block patterns
            let matchPtr = destPtr - offset;
            for (let i = 0; i < matchLen; i++) {
                dest[destPtr++] = dest[matchPtr++];
            }
        }
        return dest;
    },

    // 4. Extract text property data from decompressed blocks
    analyzePropertyChunk(data, scriptSources) {
        // Properties containing script source code blocks use "Source" descriptors
        const dataString = String.fromCharCode(...data.slice(0, 100)); // Sample header string
        if (dataString.includes("Source") || dataString.includes("Script")) {
            // Locate string sequence blocks safely
            const rawText = String.fromCharCode(...data).replace(/[\x00-\x09\x0B-\x1F\x7F-\xFF]/g, "").trim();
            if (rawText.length > 20) {
                scriptSources.push({
                    type: "ExtractedSourceStream",
                    preview: rawText.substring(0, 300) + "..."
                });
            }
        }
    },

    // Helper to read Little-Endian Int32 bits
    readInt32(bytes, offset) {
        return bytes[offset] | 
              (bytes[offset + 1] << 8) | 
              (bytes[offset + 2] << 16) | 
              (bytes[offset + 3] << 24);
    }
};
