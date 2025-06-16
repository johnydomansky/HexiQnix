// ==========================
// 1. Global Variables and Constants
// ==========================

let originalAttributes = [];

const elements = {
    svgInput: document.getElementById("svgInput"),
    iconName: document.getElementById("iconName"),
    fillColor: document.getElementById("fillColor"),
    strokeColor: document.getElementById("strokeColor"),
    enableFill: document.getElementById("enableFill"),
    enableStroke: document.getElementById("enableStroke"),
    fillRuleValue: document.getElementById("fillRuleValue"),
    clipRuleValue: document.getElementById("clipRuleValue"),
    enableFillRule: document.getElementById("enableFillRule"),
    enableClipRule: document.getElementById("enableClipRule"),
    enableDefs: document.getElementById("enableDefs"),
    forceDeleteDefs: document.getElementById("forceDeleteDefs"),
    svgPreview: document.getElementById("svgPreview"),
    output: document.getElementById("output"),
    saveButton: document.getElementById("saveButton"),
    copyButton: document.getElementById("copyButton"),
    errorMessage: document.getElementById("error-message"),
    svgFileInput: document.getElementById("svgFileInput"),
    savedIconsGrid: document.getElementById("savedIconsGrid"),
};

let parsedSVGDoc = null;
let savedIcons = [];
let currentBackgroundColor = "#4CAF50";

const $ = (id) => document.getElementById(id);

// ==========================
// 2. Utility Functions (helpers used throughout)
// ==========================

function sanitizeIconName(name) {
    if (!name || name.trim() === "") {
        return "";
    }
    return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}

function isValidIconName(name) {
    const validPattern = /^[a-zA-Z0-9-_]*$/;
    return validPattern.test(name);
}

function isNameTaken(iconName) {
    return savedIcons.some(icon => icon.name.toLowerCase() === iconName.toLowerCase());
}

function generateDefaultName() {
    let counter = 1;
    let defaultName = `Icon_${counter}`;
    
    while (isNameTaken(defaultName)) {
        counter++;
        defaultName = `Icon_${counter}`;
    }

    return defaultName;
}

function isValidSVG(svgCode) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        return doc.documentElement.nodeName === 'svg';
    } catch (error) {
        return false;
    }
}

function updateElementStyles(element, options) {
    const { fillColor, strokeColor, enableFill, enableStroke, enableFillRule, enableClipRule, fillRule, clipRule } = options;

    const originalFill = element.getAttribute("fill");
    const originalStroke = element.getAttribute("stroke");

    originalAttributes.push({
        element,
        originalFill,
        originalStroke
    });

    if (enableFill) {
        element.setAttribute("fill", fillColor || "none");
    } else if (!originalFill) {
        element.removeAttribute("fill");
    }

    if (enableStroke) {
        element.setAttribute("stroke", strokeColor || originalStroke || "none");
    } else if (!originalStroke) {
        element.removeAttribute("stroke");
    }

    if (enableFillRule) {
        element.setAttribute("fill-rule", fillRule);
    } else {
        element.removeAttribute("fill-rule");
    }

    if (enableClipRule) {
        element.setAttribute("clip-rule", clipRule);
    } else {
        element.removeAttribute("clip-rule");
    }
}

function setSVGDimensions(svgElement) {
    let width = svgElement.getAttribute('width');
    let height = svgElement.getAttribute('height');

    if (!width || !height) {
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const viewBoxValues = viewBox.split(' ');
            if (viewBoxValues.length === 4) {
                width = viewBoxValues[2];
                height = viewBoxValues[3];
                svgElement.setAttribute('width', width);
                svgElement.setAttribute('height', height);
            }
        }
    }
}

function checkSVGValidity(svgCode) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgCode, "image/svg+xml");
    const elements = svgDoc.getElementsByTagName("svg");
    return elements.length > 0 && svgDoc.getElementsByTagName("svg")[0].childElementCount > 0;
}


// ==========================
// 3. UI Utility Functions
// ==========================

function showCustomNotification(message, type = "info") {
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => notification.remove(), 500);
    }, 1500);

    notification.addEventListener("click", function () {
        notification.style.opacity = 0;
        setTimeout(() => notification.remove(), 500);
    });
}

function showErrorMessage(message) {
    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement && errorMessageElement.textContent !== message) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = "block";
    }
}

function hideErrorMessage() {
    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement) {
        errorMessageElement.style.display = "none";
    }
}

function clearErrorState() {
    const errorNotification = document.querySelector(".notification.error");
    if (errorNotification) {
        errorNotification.remove();
    }

    const fileInput = document.getElementById("svgFileInput");
    fileInput.value = "";
}

function changePreviewBackgroundColor(color) {
    const svgPreview = document.getElementById("svgPreview");

    if (currentBackgroundColor === color) return;

    svgPreview.style.transition = "background-color 0.3s ease";
    svgPreview.style.backgroundColor = color;
    currentBackgroundColor = color;
}

function toggleAccordion(id) {
    const content = document.getElementById(id);
    const icon = content.previousElementSibling.querySelector('.accordion-toggle-icon');
    
    if (content.style.display === "block") {
        content.style.display = "none";
        icon.textContent = "+";
    } else {
        content.style.display = "block";
        icon.textContent = "-";
    }
}

function toggleInputState(checkboxId, inputId, extraElementId = null) {
    const checkbox = $(checkboxId);
    const input = $(inputId);
    const extraElement = extraElementId ? $(extraElementId) : null;

    const isEnabled = checkbox.checked;
    input.disabled = !isEnabled;

    if (extraElement) {
        extraElement.style.display = isEnabled ? "inline-block" : "none";
    }
}

// ==========================
// 4. SVG Processing Functions
// ==========================

function convertSVG() {
    const svgInput = elements.svgInput.value.trim();
    const iconNameInput = elements.iconName.value.trim();
    const enableFill = elements.enableFill.checked;
    const enableStroke = elements.enableStroke.checked;
    const fillColor = elements.fillColor.value;
    const strokeColor = elements.strokeColor.value;
    const fillRuleValue = elements.fillRuleValue.value.trim() || "evenodd";
    const clipRuleValue = elements.clipRuleValue.value.trim() || "evenodd";
    const enableFillRule = elements.enableFillRule.checked;
    const enableClipRule = elements.enableClipRule.checked;
    const enableDefs = elements.enableDefs.checked;
    const forceDeleteDefs = elements.forceDeleteDefs.checked;

    elements.svgPreview.innerHTML = '';
    elements.output.innerText = '';

    if (!svgInput) {
        elements.output.innerText = "Error: Please provide an SVG code.";
        parsedSVGDoc = null;
        return;
    }

    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgInput, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) throw new Error("SVG root element <svg> not found.");

        parsedSVGDoc = svgDoc;

        setSVGDimensions(svgElement);

        if (forceDeleteDefs) {
            const defs = svgElement.querySelector("defs");
            if (defs) {
                while (defs.firstChild) svgElement.appendChild(defs.firstChild);
                svgElement.removeChild(defs);
            }
        }

        if (!svgElement.querySelector("path, rect, circle, ellipse, polygon, polyline, line, image")) {
            throw new Error("SVG contains no recognizable graphical elements (like <path> or <image>).");
        }

        const width = svgElement.getAttribute("width") || "unknown";
        const height = svgElement.getAttribute("height") || "unknown";
        const viewBox = svgElement.getAttribute("viewBox") || `0 0 ${width} ${height}`;

        const safeIconName = sanitizeIconName(iconNameInput) || "default-icon";

        let groupElement = svgElement.querySelector("g[id]");
        if (groupElement) {
            groupElement.setAttribute("id", `iconSprite_${safeIconName}`);
        } else {
            groupElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
            groupElement.setAttribute("id", `iconSprite_${safeIconName}`);
            while (svgElement.firstChild) groupElement.appendChild(svgElement.firstChild);
            svgElement.appendChild(groupElement);
        }

        const allElements = groupElement.querySelectorAll("path, circle, rect, ellipse, polyline, line");
        allElements.forEach(element => {
            updateElementStyles(element, {
                fillColor,
                strokeColor,
                enableFill,
                enableStroke,
                enableFillRule,
                enableClipRule,
                fillRule: fillRuleValue,
                clipRule: clipRuleValue,
            });
        });

        if (enableDefs) {
            const defsElement = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            svgElement.insertBefore(defsElement, groupElement);
            defsElement.appendChild(groupElement);
        }

        const serializer = new XMLSerializer();
        let cleanedSVG = serializer.serializeToString(svgElement);
        cleanedSVG = cleanedSVG.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ");
        const convertedCode = `${safeIconName}/${viewBox}:${cleanedSVG}`;
        elements.output.innerText = convertedCode;

        updateSVGPreview(svgElement);
    } catch (error) {
        elements.output.innerText = `Error: ${error.message}`;
        elements.svgPreview.innerHTML = '';
        parsedSVGDoc = null;
    }
}

function updateSVGPreview(svgElement) {
    const previewContainer = document.getElementById("svgPreview");
    previewContainer.innerHTML = "";

    if (!svgElement) {
        previewContainer.style.padding = "0";
        return;
    }

    const svgClone = svgElement.cloneNode(true);
    previewContainer.appendChild(svgClone);
    previewContainer.style.padding = "20px";
}

function resetPreviewIfNoSVG() {
    const svgInput = document.getElementById("svgInput").value.trim();
    const svgPreview = document.getElementById("svgPreview");
    if (!svgInput) {
        svgPreview.innerHTML = "";
        svgPreview.style.backgroundColor = "#4CAF50";
        svgPreview.style.padding = "0";
    }
}

function resetFillColor() {
    originalAttributes.forEach(({ element, originalFill }) => {
        if (originalFill && originalFill !== "") {
            element.setAttribute("fill", originalFill);
        } else {
            element.setAttribute("fill", "none");
        }
    });
    document.getElementById("fillColor").value = "#000000";
    updateOutput();
}

function resetStrokeColor() {
    originalAttributes.forEach(({ element, originalStroke }) => {
        if (originalStroke && originalStroke !== "") {
            element.setAttribute("stroke", originalStroke);
        } else {
            element.setAttribute("stroke", "none");
        }
    });
    document.getElementById("strokeColor").value = "#000000";
    updateOutput();
}

function updateSVGColors(fillColor, strokeColor) {
    const svgElements = document.querySelectorAll("svg");
    svgElements.forEach((svg) => {
        if (fillColor && fillColor !== "none") {
            svg.setAttribute("fill", fillColor);
        }

        if (strokeColor && strokeColor !== "none") {
            svg.setAttribute("stroke", strokeColor);
        }
    });
}

function updateOutput() {
    const serializer = new XMLSerializer();
    const svgElement = originalAttributes[0]?.element.closest("svg");
    if (svgElement) {
        let cleanedSVG = serializer.serializeToString(svgElement);
        cleanedSVG = cleanedSVG.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ");
        document.getElementById("output").innerText = cleanedSVG;
    }
}

// ==========================
// 5. Saved Icons Management
// ==========================

function saveIcon() {
    const iconName = elements.iconName.value.trim();
    const rawOutput = elements.output.textContent.trim();

    if (!rawOutput) {
        showCustomNotification("No SVG code to save.", "error");
        return;
    }

    let finalIconName = iconName || generateDefaultName();

    if (isNameTaken(finalIconName)) {
        showCustomNotification("This icon name already exists. Please choose a different name.", "error");
        return;
    }

    let metaInfo = "";
    let svgCode = "";

    if (parsedSVGDoc) {
        const svgElement = parsedSVGDoc.querySelector("svg");
        if (!svgElement) {
            showCustomNotification("Error: Cached SVG is invalid.", "error");
            return;
        }
        const serializer = new XMLSerializer();
        svgCode = serializer.serializeToString(svgElement);
    } else {
        const svgStartIndex = rawOutput.indexOf("<svg");
        if (svgStartIndex === -1) {
            showCustomNotification("Error: SVG code not found in output.", "error");
            return;
        }
        metaInfo = rawOutput.substring(0, svgStartIndex).trim();
        svgCode = rawOutput.substring(svgStartIndex).trim();
    }

    const isValidSVG = checkSVGValidity(svgCode);

    if (!isValidSVG) {
        showCustomNotification("Error: Invalid SVG content.", "error");
        return;
    }

    const savedIcon = {
        name: finalIconName,
        code: rawOutput,
        meta: metaInfo,
        preview: svgCode,
        fullError: ""
    };

    savedIcons.push(savedIcon);
    updateSavedIconsGrid();
    showCustomNotification("Icon saved successfully!");
}

function updateSavedIconsGrid() {
    const gridContainer = elements.savedIconsGrid;
    gridContainer.innerHTML = "";

    savedIcons.forEach((icon, index) => {
        const iconDiv = document.createElement("div");
        iconDiv.classList.add("saved-icon-item");

        const iconMeta = document.createElement("div");
        iconMeta.classList.add("saved-icon-meta");
        iconMeta.textContent = icon.meta;

        const iconPreview = document.createElement("div");
        iconPreview.classList.add("saved-icon-preview");

        if (icon.preview !== "Error") {
            iconPreview.innerHTML = icon.preview;
        } else {
            iconPreview.textContent = "Error";
        }

        const iconName = document.createElement("div");
        iconName.classList.add("saved-icon-name");
        iconName.innerText = icon.name;

        gridContainer.appendChild(iconDiv);

        if (icon.fullError) {
            const errorPre = document.createElement("pre");
            errorPre.textContent = icon.fullError;
            errorPre.classList.add("icon-error-message");
            gridContainer.appendChild(errorPre);
        }

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("saved-icon-buttons");

        const copyButton = document.createElement("button");
        copyButton.innerText = "Copy";
        copyButton.onclick = () => {
            copyCodeToClipboard(icon.code);
        };

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteButton.onclick = () => {
            deleteSavedIcon(index);
            showCustomNotification("Icon deleted successfully.", "error");
        };

        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(deleteButton);

        iconDiv.appendChild(iconMeta);
        iconDiv.appendChild(iconPreview);
        iconDiv.appendChild(iconName);
        iconDiv.appendChild(buttonContainer);

        gridContainer.appendChild(iconDiv);
    });
}

function deleteSavedIcon(index) {
    savedIcons.splice(index, 1);
    updateSavedIconsGrid();
    showCustomNotification("Icon deleted successfully.", "error");
}

function copyCodeToClipboard(iconCode) {
    navigator.clipboard.writeText(iconCode).then(() => {
        showCustomNotification("Icon code copied to clipboard!", "success");
    }).catch(err => {
        showCustomNotification("Failed to copy code.", "error");
    });
}


// ==========================
// 6. Clipboard & Copying
// ==========================

function copyCode() {
    const codeBlock = document.getElementById("output").innerText;
    navigator.clipboard.writeText(codeBlock).then(() => {
        showCustomNotification("Code copied to clipboard!", "success");
    }).catch(err => {
        alert("Failed to copy code: " + err);
    });
}


// ==========================
// 7. File Handling
// ==========================

function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        hideErrorMessage();
        return;
    }

    const fileType = file.type;
    if (fileType !== "image/svg+xml") {
        showErrorMessage("Please upload a valid SVG file.");
        return;
    }

    hideErrorMessage();
}


// ==========================
// 8. Event Listeners
// ==========================

elements.svgInput.addEventListener("input", function () {
    const svgInputValue = elements.svgInput.value.trim();
    const hasContent = svgInputValue.length > 0;

    elements.copyButton.style.display = hasContent ? "inline-block" : "none";
    elements.saveButton.style.display = hasContent ? "inline-block" : "none";

    resetPreviewIfNoSVG();

    if (hasContent) {
        convertSVG();
    } else {
        elements.svgPreview.innerHTML = "";
        elements.output.textContent = "";
    }
});

document.getElementById("svgFileInput").addEventListener("change", function () {
    const fileInput = this;
    const file = fileInput.files[0];
    const svgInputField = document.getElementById("svgInput");
    const output = document.getElementById("output");
    const svgPreview = document.getElementById("svgPreview");

    svgPreview.innerHTML = "";
    output.innerText = "";
    clearErrorState();

    if (!file) {
        hideErrorMessage();
        return;
    }

    if (file.type !== "image/svg+xml") {
        showCustomNotification("Please upload a valid SVG file.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const svgContent = event.target.result;

        if (!svgContent.trim() || !svgContent.includes("<svg")) {
            showCustomNotification("Error: SVG root element <svg> not found.", "error");
            svgInputField.value = "";
            return;
        }

        svgInputField.value = svgContent;

        const inputEvent = new Event("input");
        svgInputField.dispatchEvent(inputEvent);
    };

    reader.readAsText(file);
});