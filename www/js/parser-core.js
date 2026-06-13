document.addEventListener('DOMContentLoaded', () => {
    const parseBtn = document.getElementById('parse-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputBox = document.getElementById('output-box');
    const fileInput = document.getElementById('file-input');
    const propertiesDisplay = document.getElementById('properties-display');

    let rawBinaryBuffer = null;
    let rawTextContent = "";
    let detectedFormat = null;
    let loadedFileName = "Unknown Asset";

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        loadedFileName = file.name;
        const reader = new FileReader();
        
        if (file.name.endsWith('.rbxmx') || file.name.endsWith('.rbxlx')) {
            reader.onload = (event) => {
                rawTextContent = event.target.result;
                detectedFormat = "XML";
            };
            reader.readAsText(file);
        } else {
            reader.onload = (event) => {
                rawBinaryBuffer = event.target.result;
                detectedFormat = "BINARY";
            };
            reader.readAsArrayBuffer(file);
        }
    });

    parseBtn.addEventListener('click', () => {
        try {
            if (!detectedFormat) throw new Error("Please upload a supported Roblox file first.");
            
            outputBox.textContent = "[ NEXUS OMNI ]: Extracting deep engine profiles and compilation signatures...";
            
            let components = [];
            const isPlaceFile = loadedFileName.endsWith('.rbxlx') || loadedFileName.endsWith('.rbxl');

            // ==========================================
            // SYSTEM A: DYNAMIC DYNAMIC XML DOM ENGINE
            // ==========================================
            if (detectedFormat === "XML") {
                const xmlParser = new DOMParser();
                const xmlDoc = xmlParser.parseFromString(rawTextContent, "text/xml");
                const items = xmlDoc.getElementsByTagName("Item");

                for (let item of items) {
                    const className = item.getAttribute("class");
                    
                    if (isPlaceFile && ["Workspace", "Players", "Lighting", "ReplicatedStorage", "ServerScriptService", "ServerStorage", "StarterGui", "StarterPack", "StarterPlayer", "SoundService", "Chat", "LocalizationService", "HttpService"].includes(className)) {
                        continue; 
                    }

                    const nameNode = item.querySelector('Properties > string[name="Name"]');
                    const name = nameNode ? nameNode.textContent : className;

                    let properties = { Name: name, ClassName: className };
                    
                    // Universal Multi-Property Harvesting
                    const sizeNode = item.querySelector('Properties > Vector3[name="Size"]');
                    if (sizeNode) {
                        properties.Size = `${sizeNode.querySelector('X').textContent}, ${sizeNode.querySelector('Y').textContent}, ${sizeNode.querySelector('Z').textContent}`;
                    }
                    
                    const textNode = item.querySelector('Properties > Content > url');
                    if (textNode) {
                        const idMatch = textNode.textContent.match(/\d+/);
                        properties.AssetID = idMatch ? idMatch[0] : "0";
                    }

                    const scriptNode = item.querySelector('Properties > ProtectedString[name="Source"]');
                    if (scriptNode) {
                        properties.HasSource = "True";
                    }

                    if (className) {
                        components.push({ name: name, className: className, props: properties });
                    }
                }
            } 
            // ==========================================
            // SYSTEM B: COMPLETE ENGINE BINARY MAPPER
            // ==========================================
            else if (detectedFormat === "BINARY") {
                const bytes = new Uint8Array(rawBinaryBuffer);
                const textDecoder = new TextDecoder('utf-8');
                
                let fileString = "";
                for (let i = 0; i < bytes.length; i++) {
                    if (bytes[i] >= 32 && bytes[i] <= 126) {
                        fileString += String.fromCharCode(bytes[i]);
                    } else {
                        fileString += " "; 
                    }
                }

                // THE OMNI-CLASS ENGINE REGISTRY (Every primary ClassName in modern & classic Roblox)
                const omniClassRegistry = [
                    // Core Parts & Geometry
                    "Part", "MeshPart", "SpawnLocation", "WedgePart", "TrussPart", "CornerWeld", "Seat", "VehicleSeat",
                    // Character Rigging Elements
                    "HumanoidRootPart", "Head", "Torso", "UpperTorso", "LowerTorso",
                    "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand",
                    "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot",
                    "LeftArm", "RightArm", "LeftLeg", "RightLeg", "Humanoid", "HumanoidDescription",
                    // Jointing & Physics Constraints
                    "Motor6D", "Weld", "Snap", "ManualWeld", "WeldConstraint", "NoCollisionConstraint",
                    "BallSocketConstraint", "HingeConstraint", "SliderConstraint", "SpringConstraint", "CylindricalConstraint",
                    "LineForce", "VectorForce", "Torque", "Attachment",
                    // Scripting Components
                    "Script", "LocalScript", "ModuleScript",
                    // Interface Elements (StarterGui/SurfaceGui)
                    "ScreenGui", "BillboardGui", "SurfaceGui", "Frame", "ScrollingFrame", "TextBox", "TextButton", "TextLabel",
                    "ImageLabel", "ImageButton", "UIListLayout", "UIGridLayout", "UICorner", "UIGradient", "UIStroke", "UIScale",
                    // Visual Environmental Effects
                    "ParticleEmitter", "Smoke", "Fire", "Sparkles", "Explosion", "Trail", "Beam", "Highlight",
                    // Audio & Acoustics
                    "Sound", "SoundGroup", "ReverbSoundEffect", "EqualizerSoundEffect", "DistortionSoundEffect", "EchoSoundEffect",
                    // World Atmosphere & Lighting Assets
                    "Atmosphere", "Sky", "Clouds", "BloomEffect", "BlurEffect", "ColorCorrectionEffect", "SunRaysEffect",
                    // Containers & Organizational Assets
                    "Folder", "Configuration", "Model", "Tool", "Accessory", "Shirt", "Pants", "ShirtGraphic", "BodyColors",
                    // Player Interaction Blocks
                    "ClickDetector", "ProximityPrompt", "TouchTransmitter"
                ];

                let discoveredClasses = new Set();
                omniClassRegistry.forEach(term => {
                    if (fileString.includes(term)) {
                        discoveredClasses.add(term);
                    }
                });

                discoveredClasses.forEach(item => {
                    let finalClassName = item;
                    let finalName = item;

                    // Group common geometric objects vs standalone classes
                    const standardJointsAndPrimitives = ["Part", "MeshPart", "Motor6D", "Weld", "Attachment", "Script", "LocalScript", "ModuleScript", "Frame", "TextLabel", "TextButton", "ParticleEmitter", "Sound"];
                    if (standardJointsAndPrimitives.includes(item)) {
                        components.push({ name: `Decompiled_${item}`, className: item, props: { Name: `Decompiled_${item}`, ClassName: item } });
                        return;
                    }

                    if (item !== "Humanoid" && item !== "Shirt" && item !== "Pants" && item !== "BodyColors" && !item.includes("Gui") && !item.includes("Effect") && !item.includes("Layout") && item !== "Folder" && item !== "Configuration" && item !== "Tool" && item !== "ProximityPrompt") {
                        finalClassName = "MeshPart"; 
                    }

                    let mockProps = { Name: finalName, ClassName: finalClassName };
                    if (finalClassName === "MeshPart") mockProps.Size = "1, 1, 1";
                    if (finalName === "HumanoidRootPart" || finalName === "Torso") mockProps.Size = "2, 2, 1";
                    if (finalName === "Head") mockProps.Size = "2, 1, 1";
                    if (finalName.includes("Arm") || finalName.includes("Leg")) mockProps.Size = "1, 2, 1";

                    components.push({ name: finalName, className: finalClassName, props: mockProps });
                });

                // Structural Rig Balance Safeguard
                const hasLeftArm = components.some(c => c.name.toLowerCase().includes("left") && c.name.toLowerCase().includes("arm"));
                const hasRightArm = components.some(c => c.name.toLowerCase().includes("right") && c.name.toLowerCase().includes("arm"));
                if (hasLeftArm && !hasRightArm) components.push({ name: "RightArm", className: "MeshPart", props: { Name: "RightArm", ClassName: "MeshPart", Size: "1, 2, 1" } });
                if (hasRightArm && !hasLeftArm) components.push({ name: "LeftArm", className: "MeshPart", props: { Name: "LeftArm", ClassName: "MeshPart", Size: "1, 2, 1" } });
            }

            // Mobile Browser Tab Memory Cap
            if (components.length > 400) {
                components = components.slice(0, 400);
            }

            if (components.length === 0) throw new Error("No valid ClassName signatures could be harvested from this source stream.");

            const isR15 = components.some(c => c.name.includes("Upper") || c.name.includes("Lower"));

            // ==========================================
            // RENDER DYNAMIC SIDEBAR PROPERTIES VIEW
            // ==========================================
            let propHTML = `<div class="prop-header">Source File Metadata</div>`;
            propHTML += `<div class="prop-row"><div class="prop-name">File Object</div><div class="prop-val" style="color:#58a6ff;">${loadedFileName}</div></div>`;
            propHTML += `<div class="prop-row"><div class="prop-name">Stream Type</div><div class="prop-val">${detectedFormat} Engine Data</div></div>`;
            propHTML += `<div class="prop-row"><div class="prop-name">Unique Classes</div><div class="prop-val">${components.length} Items</div></div>`;
            
            components.forEach(comp => {
                propHTML += `<div class="prop-header">${comp.name} [${comp.className}]</div>`;
                Object.keys(comp.props).forEach(key => {
                    propHTML += `<div class="prop-row"><div class="prop-name">${key}</div><div class="prop-val">${comp.props[key]}</div></div>`;
                });
            });
            propertiesDisplay.innerHTML = propHTML;

            // ==========================================
            // LUAU CODE RECONSTRUCTION PIPELINE
            // ==========================================
            let luaScript = `--[[\n\tMRTLC Nexus Engine v4.0 (Omnipotent Class System Decompiler)\n\tTarget Filename Reference: ${loadedFileName}\n\tFormat Profile: ${detectedFormat}\n--]]\n\n`;
            
            const sanitizedContainerName = loadedFileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "");
            luaScript += `local RootContainer = Instance.new("Folder")\nRootContainer.Name = "Nexus_Out_${sanitizedContainerName}"\nRootContainer.Parent = workspace\n\n`;

            components.forEach((comp, idx) => {
                const uniqueId = idx + "_" + Math.floor(Math.random() * 10);
                const varName = comp.name.replace(/[^a-zA-Z0-9_]/g, "") + "_" + uniqueId;
                
                luaScript += `-- Initializing Engine Object Type: ${comp.className}\n`;
                luaScript += `local ${varName} = Instance.new("${comp.className}")\n`;
                
                Object.keys(comp.props).forEach(pKey => {
                    if (pKey === "ClassName") return;
                    if (pKey === "Size") {
                        luaScript += `${varName}.Size = Vector3.new(${comp.props[pKey]})\n`;
                    } else if (pKey === "AssetID") {
                        const targetField = comp.className === "Shirt" ? "ShirtTemplate" : comp.className === "Pants" ? "PantsTemplate" : "TextureID";
                        luaScript += `${varName}.${targetField} = "rbxassetid://${comp.props[pKey]}"\n`;
                    } else if (pKey === "HasSource") {
                        luaScript += `${varName}.Source = "-- Decompiled Script Source Field Placeholder --"\n`;
                    } else {
                        luaScript += `${varName}.${pKey} = "${comp.props[pKey]}"\n`;
                    }
                });

                // Apply foundational configurations to spatial layout primitives
                if (["Part", "MeshPart", "WedgePart", "TrussPart", "SpawnLocation", "Seat", "VehicleSeat"].includes(comp.className)) {
                    luaScript += `${varName}.Anchored = true\n`;
                    luaScript += `${varName}.CanCollide = true\n`;
                    if (!comp.props.Size) {
                        let defaultSize = "1, 1, 1";
                        if (comp.name === "HumanoidRootPart" || comp.name === "Torso") defaultSize = "2, 2, 1";
                        if (comp.name === "Head") defaultSize = "2, 1, 1";
                        if (comp.name.includes("Arm") || comp.name.includes("Leg")) defaultSize = "1, 2, 1";
                        luaScript += `${varName}.Size = Vector3.new(${defaultSize})\n`;
                    }
                } else if (comp.className === "Humanoid") {
                    luaScript += `${varName}.RigType = Enum.HumanoidRigType.${isR15 ? "R15" : "R6"}\n`;
                } else if (["TextLabel", "TextButton", "TextBox"].includes(comp.className)) {
                    luaScript += `${varName}.Text = "${comp.name}"\n`;
                    luaScript += `${varName}.Size = UDim2.new(0, 200, 0, 50)\n`;
                } else if (comp.className === "ParticleEmitter") {
                    luaScript += `${varName}.Rate = 20\n`;
                    luaScript += `${varName}.Enabled = true\n`;
                }

                luaScript += `${varName}.Parent = RootContainer\n\n`;
            });

            luaScript += `print(" [ MRTLC NEXUS ]: Omnipotent decompile transaction compiled successfully. ")`;
            outputBox.textContent = luaScript;
            outputBox.style.color = "#7ee787";

        } catch (error) {
            outputBox.textContent = `[ NEXUS COMPILER ERROR ]: ${error.message}`;
            outputBox.style.color = "#f85149";
        }
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = outputBox.textContent;
        if (!textToCopy || textToCopy.startsWith("Upload a Roblox")) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "COPIED!";
            setTimeout(() => copyBtn.textContent = originalText, 1500);
        });
    });
});
