import { RobloxXmlParser } from './roblox-xml.js';
import { RobloxBinaryParser } from './roblox-binary.js';

export const NexusParser = {
    async parse(rawData) {
        if (!rawData || !rawData.trim()) {
            throw new Error("Input buffer is completely empty.");
        }

        // Detect Format: Roblox Binary files always start with the "ROBLOX" magic header
        if (rawData.startsWith("ROBLOX")) {
            return await RobloxBinaryParser.decode(rawData);
        } 
        
        // Detect Format: Check if it's standard XML structure
        if (rawData.trim().startsWith("<") || rawData.includes("<roblox")) {
            return RobloxXmlParser.decode(rawData);
        }

        throw new Error("Unsupported format. Input must be a valid Roblox XML or Binary stream.");
    }
};
