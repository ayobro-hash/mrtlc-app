// ========================================================
// ROBLOX BINARY PARSER MODULE (.rbxm / .rbxl)
// Clean, secure array chunk processor
// ========================================================

export const RobloxBinaryParser = {
    async decode(bytes) {
        try {
            const totalBytes = bytes.length;
            
            // 1. READ BINARY HEADER (First 28 Bytes)
            // Signature: "ROBLOX\x89\xff\x0d\x0a\x1a\x0a"
            const signature = String.fromCharCode(...bytes.slice(0, 6));
            if (signature !== "ROBLOX") {
                throw new Error("Invalid Binary format layout header.");
            }

            const numGroups = this.readInt32(bytes, 14);
            const numInstances = this.readInt32(bytes, 18);

            // 2. CHUNK TRAVERSAL ENGINE
            let offset = 28; // Header trailing offset
            const chunks = [];

            while (offset < totalBytes) {
                // Read 4-byte chunk magic string signature (e.g., INST, PROP, PRNT, ENDS)
                const chunkType = String.fromCharCode(...bytes.slice(offset, offset + 4));
                if (!chunkType.trim() || offset + 4 > totalBytes) break;

                const compressedLength = this.readInt32(bytes, offset + 4);
                const decompressedLength = this.readInt32(bytes, offset + 8);
                
                chunks.push({
                    type: chunkType,
                    compressedSize: compressedLength,
                    decompressedSize: decompressedLength,
                    offsetPosition: offset
                });

                // Jump past header (12 bytes) + compressed data payload block size
                offset += 12 + compressedLength;
                
                if (chunkType === "ENDS") break;
            }

            // 3. GENERATE TREE DATA DUMP
            return {
                engine: "MRTLC_SECURE_BINARY_DECODER",
                format: "Roblox Binary (.rbxm)",
                status: "PARSED_HEADERS_SUCCESSFULLY",
                metadata: {
                    totalFileSize: `${totalBytes} bytes`,
                    instanceCount: numInstances,
                    groupCount: numGroups
                },
                detectedChunks: chunks
            };

        } catch (err) {
            throw new Error(`Binary Core Decompression Failure: ${err.message}`);
        }
    },

    // Little-endian binary byte conversion helper
    readInt32(bytes, offset) {
        return bytes[offset] | 
              (bytes[offset + 1] << 8) | 
              (bytes[offset + 2] << 16) | 
              (bytes[offset + 3] << 24);
    }
};
