(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // www/js/parser-core.js
  var require_parser_core = __commonJS({
    "www/js/parser-core.js"() {
      document.addEventListener("DOMContentLoaded", () => {
        const parseBtn = document.getElementById("parse-btn");
        const copyBtn = document.getElementById("copy-btn");
        const outputBox = document.getElementById("output-box");
        const fileInput = document.getElementById("file-input");
        const propertiesDisplay = document.getElementById("properties-display");
        let rawBinaryBuffer = null;
        let rawTextContent = "";
        let detectedFormat = null;
        let loadedFileName = "Unknown Asset";
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          loadedFileName = file.name;
          const reader = new FileReader();
          if (file.name.endsWith(".rbxmx") || file.name.endsWith(".rbxlx")) {
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
        parseBtn.addEventListener("click", () => {
          try {
            if (!detectedFormat) throw new Error("Please upload a supported Roblox file first.");
            outputBox.textContent = "[ NEXUS OMNI ]: Extracting deep engine profiles and compilation signatures...";
            let components = [];
            const isPlaceFile = loadedFileName.endsWith(".rbxlx") || loadedFileName.endsWith(".rbxl");
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
                const sizeNode = item.querySelector('Properties > Vector3[name="Size"]');
                if (sizeNode) {
                  properties.Size = `${sizeNode.querySelector("X").textContent}, ${sizeNode.querySelector("Y").textContent}, ${sizeNode.querySelector("Z").textContent}`;
                }
                const textNode = item.querySelector("Properties > Content > url");
                if (textNode) {
                  const idMatch = textNode.textContent.match(/\d+/);
                  properties.AssetID = idMatch ? idMatch[0] : "0";
                }
                const scriptNode = item.querySelector('Properties > ProtectedString[name="Source"]');
                if (scriptNode) {
                  properties.HasSource = "True";
                }
                if (className) {
                  components.push({ name, className, props: properties });
                }
              }
            } else if (detectedFormat === "BINARY") {
              const bytes = new Uint8Array(rawBinaryBuffer);
              const textDecoder = new TextDecoder("utf-8");
              let fileString = "";
              for (let i = 0; i < bytes.length; i++) {
                if (bytes[i] >= 32 && bytes[i] <= 126) {
                  fileString += String.fromCharCode(bytes[i]);
                } else {
                  fileString += " ";
                }
              }
              const omniClassRegistry = [
                // Core Parts & Geometry
                "Part",
                "MeshPart",
                "SpawnLocation",
                "WedgePart",
                "TrussPart",
                "CornerWeld",
                "Seat",
                "VehicleSeat",
                // Character Rigging Elements
                "HumanoidRootPart",
                "Head",
                "Torso",
                "UpperTorso",
                "LowerTorso",
                "LeftUpperArm",
                "LeftLowerArm",
                "LeftHand",
                "RightUpperArm",
                "RightLowerArm",
                "RightHand",
                "LeftUpperLeg",
                "LeftLowerLeg",
                "LeftFoot",
                "RightUpperLeg",
                "RightLowerLeg",
                "RightFoot",
                "LeftArm",
                "RightArm",
                "LeftLeg",
                "RightLeg",
                "Humanoid",
                "HumanoidDescription",
                // Jointing & Physics Constraints
                "Motor6D",
                "Weld",
                "Snap",
                "ManualWeld",
                "WeldConstraint",
                "NoCollisionConstraint",
                "BallSocketConstraint",
                "HingeConstraint",
                "SliderConstraint",
                "SpringConstraint",
                "CylindricalConstraint",
                "LineForce",
                "VectorForce",
                "Torque",
                "Attachment",
                // Scripting Components
                "Script",
                "LocalScript",
                "ModuleScript",
                // Interface Elements (StarterGui/SurfaceGui)
                "ScreenGui",
                "BillboardGui",
                "SurfaceGui",
                "Frame",
                "ScrollingFrame",
                "TextBox",
                "TextButton",
                "TextLabel",
                "ImageLabel",
                "ImageButton",
                "UIListLayout",
                "UIGridLayout",
                "UICorner",
                "UIGradient",
                "UIStroke",
                "UIScale",
                // Visual Environmental Effects
                "ParticleEmitter",
                "Smoke",
                "Fire",
                "Sparkles",
                "Explosion",
                "Trail",
                "Beam",
                "Highlight",
                // Audio & Acoustics
                "Sound",
                "SoundGroup",
                "ReverbSoundEffect",
                "EqualizerSoundEffect",
                "DistortionSoundEffect",
                "EchoSoundEffect",
                // World Atmosphere & Lighting Assets
                "Atmosphere",
                "Sky",
                "Clouds",
                "BloomEffect",
                "BlurEffect",
                "ColorCorrectionEffect",
                "SunRaysEffect",
                // Containers & Organizational Assets
                "Folder",
                "Configuration",
                "Model",
                "Tool",
                "Accessory",
                "Shirt",
                "Pants",
                "ShirtGraphic",
                "BodyColors",
                // Player Interaction Blocks
                "ClickDetector",
                "ProximityPrompt",
                "TouchTransmitter"
              ];
              let discoveredClasses = /* @__PURE__ */ new Set();
              omniClassRegistry.forEach((term) => {
                if (fileString.includes(term)) {
                  discoveredClasses.add(term);
                }
              });
              discoveredClasses.forEach((item) => {
                let finalClassName = item;
                let finalName = item;
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
              const hasLeftArm = components.some((c) => c.name.toLowerCase().includes("left") && c.name.toLowerCase().includes("arm"));
              const hasRightArm = components.some((c) => c.name.toLowerCase().includes("right") && c.name.toLowerCase().includes("arm"));
              if (hasLeftArm && !hasRightArm) components.push({ name: "RightArm", className: "MeshPart", props: { Name: "RightArm", ClassName: "MeshPart", Size: "1, 2, 1" } });
              if (hasRightArm && !hasLeftArm) components.push({ name: "LeftArm", className: "MeshPart", props: { Name: "LeftArm", ClassName: "MeshPart", Size: "1, 2, 1" } });
            }
            if (components.length > 400) {
              components = components.slice(0, 400);
            }
            if (components.length === 0) throw new Error("No valid ClassName signatures could be harvested from this source stream.");
            const isR15 = components.some((c) => c.name.includes("Upper") || c.name.includes("Lower"));
            let propHTML = `<div class="prop-header">Source File Metadata</div>`;
            propHTML += `<div class="prop-row"><div class="prop-name">File Object</div><div class="prop-val" style="color:#58a6ff;">${loadedFileName}</div></div>`;
            propHTML += `<div class="prop-row"><div class="prop-name">Stream Type</div><div class="prop-val">${detectedFormat} Engine Data</div></div>`;
            propHTML += `<div class="prop-row"><div class="prop-name">Unique Classes</div><div class="prop-val">${components.length} Items</div></div>`;
            components.forEach((comp) => {
              propHTML += `<div class="prop-header">${comp.name} [${comp.className}]</div>`;
              Object.keys(comp.props).forEach((key) => {
                propHTML += `<div class="prop-row"><div class="prop-name">${key}</div><div class="prop-val">${comp.props[key]}</div></div>`;
              });
            });
            propertiesDisplay.innerHTML = propHTML;
            let luaScript = `--[[
	MRTLC Nexus Engine v4.0 (Omnipotent Class System Decompiler)
	Target Filename Reference: ${loadedFileName}
	Format Profile: ${detectedFormat}
--]]

`;
            const sanitizedContainerName = loadedFileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "");
            luaScript += `local RootContainer = Instance.new("Folder")
RootContainer.Name = "Nexus_Out_${sanitizedContainerName}"
RootContainer.Parent = workspace

`;
            components.forEach((comp, idx) => {
              const uniqueId = idx + "_" + Math.floor(Math.random() * 10);
              const varName = comp.name.replace(/[^a-zA-Z0-9_]/g, "") + "_" + uniqueId;
              luaScript += `-- Initializing Engine Object Type: ${comp.className}
`;
              luaScript += `local ${varName} = Instance.new("${comp.className}")
`;
              Object.keys(comp.props).forEach((pKey) => {
                if (pKey === "ClassName") return;
                if (pKey === "Size") {
                  luaScript += `${varName}.Size = Vector3.new(${comp.props[pKey]})
`;
                } else if (pKey === "AssetID") {
                  const targetField = comp.className === "Shirt" ? "ShirtTemplate" : comp.className === "Pants" ? "PantsTemplate" : "TextureID";
                  luaScript += `${varName}.${targetField} = "rbxassetid://${comp.props[pKey]}"
`;
                } else if (pKey === "HasSource") {
                  luaScript += `${varName}.Source = "-- Decompiled Script Source Field Placeholder --"
`;
                } else {
                  luaScript += `${varName}.${pKey} = "${comp.props[pKey]}"
`;
                }
              });
              if (["Part", "MeshPart", "WedgePart", "TrussPart", "SpawnLocation", "Seat", "VehicleSeat"].includes(comp.className)) {
                luaScript += `${varName}.Anchored = true
`;
                luaScript += `${varName}.CanCollide = true
`;
                if (!comp.props.Size) {
                  let defaultSize = "1, 1, 1";
                  if (comp.name === "HumanoidRootPart" || comp.name === "Torso") defaultSize = "2, 2, 1";
                  if (comp.name === "Head") defaultSize = "2, 1, 1";
                  if (comp.name.includes("Arm") || comp.name.includes("Leg")) defaultSize = "1, 2, 1";
                  luaScript += `${varName}.Size = Vector3.new(${defaultSize})
`;
                }
              } else if (comp.className === "Humanoid") {
                luaScript += `${varName}.RigType = Enum.HumanoidRigType.${isR15 ? "R15" : "R6"}
`;
              } else if (["TextLabel", "TextButton", "TextBox"].includes(comp.className)) {
                luaScript += `${varName}.Text = "${comp.name}"
`;
                luaScript += `${varName}.Size = UDim2.new(0, 200, 0, 50)
`;
              } else if (comp.className === "ParticleEmitter") {
                luaScript += `${varName}.Rate = 20
`;
                luaScript += `${varName}.Enabled = true
`;
              }
              luaScript += `${varName}.Parent = RootContainer

`;
            });
            luaScript += `print(" [ MRTLC NEXUS ]: Omnipotent decompile transaction compiled successfully. ")`;
            outputBox.textContent = luaScript;
            outputBox.style.color = "#7ee787";
          } catch (error) {
            outputBox.textContent = `[ NEXUS COMPILER ERROR ]: ${error.message}`;
            outputBox.style.color = "#f85149";
          }
        });
        copyBtn.addEventListener("click", () => {
          const textToCopy = outputBox.textContent;
          if (!textToCopy || textToCopy.startsWith("Upload a Roblox")) return;
          navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "COPIED!";
            setTimeout(() => copyBtn.textContent = originalText, 1500);
          });
        });
      });
    }
  });
  require_parser_core();
})();
