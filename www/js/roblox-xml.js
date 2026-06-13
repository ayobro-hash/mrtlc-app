export const RobloxXmlParser = {
    decode(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Validate structure
        if (xmlDoc.querySelector("parsererror")) {
            throw new Error("Failed to parse XML schema. Formatting error.");
        }

        const instances = xmlDoc.getElementsByTagName("Item");
        const extractedScripts = [];

        for (let item of instances) {
            const className = item.getAttribute("class");
            
            // Get instance name property
            let name = "UnknownInstance";
            const nameNode = item.querySelector('Properties > string[name="Name"]');
            if (nameNode) name = nameNode.textContent;

            // Isolate and capture Lua code blocks
            if (className === "Script" || className === "LocalScript" || className === "ModuleScript") {
                const sourceNode = item.querySelector('Properties > ProtectedString[name="Source"]');
                if (sourceNode) {
                    extractedScripts.push({
                        name: name,
                        class: className,
                        source: sourceNode.textContent.trim()
                    });
                }
            }
        }

        return {
            engine: "MRTLC_XML_DECODER",
            format: "Roblox XML (.rbxmx/.rbxlx)",
            instancesFound: instances.length,
            extractedScriptsCount: extractedScripts.length,
            scripts: extractedScripts
        };
    }
};
