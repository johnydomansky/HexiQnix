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
    rotationDial: document.getElementById("rotation-dial"),
    rotationAngle: document.getElementById("rotation-angle"),
    scaleWidth: document.getElementById("scale-width"),
    scaleHeight: document.getElementById("scale-height"),
    aspectRatioLock: document.getElementById("aspect-ratio-lock"),
    resetDimensionsBtn: document.getElementById("reset-dimensions-btn"),
    customColorInput: document.getElementById("customColorInput"),
};

let parsedSVGDoc = null;
let savedIcons = [];
let currentBackgroundColor = "#4CAF50";
let originalWidth = 0;
let originalHeight = 0;
let originalAspectRatio = 1;

const $ = (id) => document.getElementById(id);

// ==========================
// 2. Utility Functions
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
    const { fillColor, strokeColor, enableFill, enableStroke, enableFillRule, enableClipRule, fillRule, clipRule, applyRootFillNoneToChildren } = options;

    const originalFill = element.getAttribute("fill");
    const originalStroke = element.getAttribute("stroke");

    originalAttributes.push({
        element,
        originalFill,
        originalStroke
    });

    if (enableFill) {
        element.setAttribute("fill", fillColor || "none");
    } else if (applyRootFillNoneToChildren) {
        element.setAttribute("fill", "none");
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
    originalWidth = width;
    originalHeight = height;
    if (height > 0) {
        originalAspectRatio = width / height;
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
    applySettings();
}

// ==========================
// 4. SVG Processing Functions
// ==========================

function parseSVG() {
    let svgInput = elements.svgInput.value.trim();
    if (!svgInput) {
        elements.svgPreview.innerHTML = "";
        parsedSVGDoc = null;
        updateOutput(null);
        return;
    }

    if (!svgInput.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgInput = svgInput.replace(/<svg/g, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgInput, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) throw new Error("SVG root element <svg> not found.");

        parsedSVGDoc = svgDoc;
        setSVGDimensions(svgElement);
        elements.scaleWidth.value = originalWidth;
        elements.scaleHeight.value = originalHeight;

        applySettings();
    } catch (error) {
        elements.output.innerText = `Error: ${error.message}`;
        elements.svgPreview.innerHTML = '';
        parsedSVGDoc = null;
    }
}

function applySettings() {
    if (!parsedSVGDoc) return;

    const svgElement = parsedSVGDoc.documentElement.cloneNode(true);

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

    const applyRootFillNoneToChildren = svgElement.getAttribute("fill") === "none" && !enableFill;
    if (applyRootFillNoneToChildren) {
        svgElement.removeAttribute("fill");
    }

    let newWidth = elements.scaleWidth.value;
    let newHeight = elements.scaleHeight.value;

    if (newWidth < 1) newWidth = 1;
    if (newHeight < 1) newHeight = 1;

    elements.scaleWidth.value = newWidth;
    elements.scaleHeight.value = newHeight;

    svgElement.setAttribute('width', newWidth);
    svgElement.setAttribute('height', newHeight);

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
            applyRootFillNoneToChildren,
        });

        const customCssRules = document.querySelectorAll(".custom-css-rule");
        customCssRules.forEach(rule => {
            const property = rule.querySelector("input[placeholder='Property']").value;
            const value = rule.querySelector("input[placeholder='Value']").value;
            if (property && value) {
                element.style[property] = value;
            }
        });
    });

    if (enableDefs) {
        const defsElement = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgElement.insertBefore(defsElement, groupElement);
        defsElement.appendChild(groupElement);
    }

    transformManager.apply(svgElement);
    updateOutput(svgElement);
    updateSVGPreview(svgElement);
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
    previewContainer.style.padding = "0";
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
    applySettings();
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
    applySettings();
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

function updateOutput(svgElement) {
    const output = elements.output;
    const copyButton = elements.copyButton;
    const saveButton = elements.saveButton;

    if (svgElement) {
        const serializer = new XMLSerializer();
        const svgClone = svgElement.cloneNode(true);
        svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        let cleanedSVG = serializer.serializeToString(svgClone);
        cleanedSVG = cleanedSVG.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ");
        const iconName = elements.iconName.value.trim() || "default-icon";
        const viewBox = svgElement.getAttribute("viewBox") || "0 0 24 24";
        output.innerText = `${iconName}/${viewBox}:${cleanedSVG}`;
        copyButton.style.display = "inline-block";
        saveButton.style.display = "inline-block";
    } else {
        output.innerText = "";
        copyButton.style.display = "none";
        saveButton.style.display = "none";
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

    const previewSgvElement = elements.svgPreview.querySelector("svg");
    if (!previewSgvElement) {
        showCustomNotification("Error: Preview SVG not found.", "error");
        return;
    }

    const svgCode = previewSgvElement.outerHTML;
    const metaInfo = rawOutput.substring(0, rawOutput.indexOf("<svg")).trim();

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
    const svgInputField = document.getElementById("svgInput");

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
        parseSVG();
    };

    reader.readAsText(file);
}


// ==========================
// 8. Event Listeners
// ==========================

function setupEventListeners() {
    elements.svgInput.addEventListener("input", parseSVG);
    elements.iconName.addEventListener("input", applySettings);
    elements.fillColor.addEventListener("input", applySettings);
    elements.strokeColor.addEventListener("input", applySettings);
    elements.fillRuleValue.addEventListener("input", applySettings);
    elements.clipRuleValue.addEventListener("input", applySettings);
    elements.enableDefs.addEventListener("change", applySettings);
    elements.forceDeleteDefs.addEventListener("change", applySettings);
    elements.aspectRatioLock.addEventListener("change", applySettings);
    elements.svgFileInput.addEventListener("change", handleFileUpload);

    elements.customColorInput.addEventListener("input", (event) => {
        changePreviewBackgroundColor(event.target.value);
    });

    elements.scaleWidth.addEventListener('input', (e) => {
        if (elements.aspectRatioLock.checked) {
            const newWidth = parseFloat(e.target.value);
            if (!isNaN(newWidth) && newWidth > 0 && originalAspectRatio > 0) {
                elements.scaleHeight.value = Math.round(newWidth / originalAspectRatio);
            }
        }
        applySettings();
    });

    elements.scaleHeight.addEventListener('input', (e) => {
        if (elements.aspectRatioLock.checked) {
            const newHeight = parseFloat(e.target.value);
            if (!isNaN(newHeight) && newHeight > 0) {
                elements.scaleWidth.value = Math.round(newHeight * originalAspectRatio);
            }
        }
        applySettings();
    });

    elements.resetDimensionsBtn.addEventListener('click', () => {
        elements.scaleWidth.value = originalWidth;
        elements.scaleHeight.value = originalHeight;
        applySettings();
    });

    if (elements.rotationDial) {
        let isDragging = false;

        const handle = elements.rotationDial.querySelector('.dial-handle');

        const updateRotation = (newRotation) => {
            let angle = newRotation;
            if (angle < 0) angle = 360 + angle;
            if (angle >= 360) angle = angle % 360;

            transformManager.setRotation(angle);
            elements.rotationAngle.value = `${angle}°`;

            const angleRad = (angle - 90) * (Math.PI / 180);
            const radius = elements.rotationDial.offsetWidth / 2;
            const handleRadius = handle.offsetWidth / 2;
            const x = radius + (radius - handleRadius - 2) * Math.cos(angleRad) - handleRadius;
            const y = radius + (radius - handleRadius - 2) * Math.sin(angleRad) - handleRadius;
            handle.style.left = `${x}px`;
            handle.style.top = `${y}px`;

            applySettings();
        };

        elements.rotationDial.addEventListener("mousedown", (e) => {
            isDragging = true;
            elements.rotationDial.style.cursor = 'grabbing';
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                const rect = elements.rotationDial.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
                updateRotation(Math.round(angle + 90));
            }
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                elements.rotationDial.style.cursor = 'pointer';
            }
        });

        elements.rotationDial.addEventListener("touchstart", (e) => {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener("touchmove", (e) => {
            if (isDragging) {
                const rect = elements.rotationDial.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const touch = e.touches[0];
                const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
                updateRotation(Math.round(angle + 90));
            }
        });

        document.addEventListener("touchend", () => {
            if (isDragging) {
                isDragging = false;
            }
        });

        elements.rotationAngle.addEventListener('keydown', (e) => {
            let angle = parseInt(elements.rotationAngle.value) || 0;
            if (e.key === 'ArrowUp') {
                angle++;
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                angle--;
                e.preventDefault();
            }
            updateRotation(angle);
        });

        elements.rotationAngle.addEventListener('input', (e) => {
            let angle = parseInt(e.target.value) || 0;
            updateRotation(angle);
        });
    }

    const addCssRuleBtn = document.getElementById("add-css-rule-btn");
    if (addCssRuleBtn) {
        addCssRuleBtn.addEventListener("click", () => {
            const container = document.getElementById("custom-css-rules-container");
            const ruleDiv = document.createElement("div");
            ruleDiv.classList.add("custom-css-rule");

            const propertyInput = document.createElement("input");
            propertyInput.type = "text";
            propertyInput.placeholder = "Property";
            propertyInput.addEventListener("input", applySettings);

            const valueInput = document.createElement("input");
            valueInput.type = "text";
            valueInput.placeholder = "Value";
            valueInput.addEventListener("input", applySettings);

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "X";
            deleteBtn.classList.add("delete-rule-btn");
            deleteBtn.addEventListener("click", () => {
                ruleDiv.remove();
                applySettings();
            });

            ruleDiv.appendChild(propertyInput);
            ruleDiv.appendChild(valueInput);
            ruleDiv.appendChild(deleteBtn);
            container.appendChild(ruleDiv);
        });
    }
}


// ==========================
// 9. Transformation Functions
// ==========================

const transformManager = (() => {
    let rotate = 0;
    let scaleX = 1;
    let scaleY = 1;

    function applyTransforms(svgElement) {
        if (!svgElement) return;
        let transformString = ``;
        if (rotate !== 0) transformString += `rotate(${rotate}) `;
        if (scaleX !== 1 || scaleY !== 1) transformString += `scale(${scaleX}, ${scaleY})`;

        if (transformString.trim()) {
            svgElement.setAttribute("transform", transformString.trim());
        } else {
            svgElement.removeAttribute("transform");
        }
    }

    return {
        setRotation(angle) {
            rotate = angle;
        },
        getRotation() {
            return rotate;
        },
        setScale(x, y) {
            scaleX = x;
            scaleY = y;
        },
        getScale() {
            return { scaleX, scaleY };
        },
        flipX() {
            scaleX *= -1;
        },
        flipY() {
            scaleY *= -1;
        },
        apply(svgElement) {
            applyTransforms(svgElement);
        }
    };
})();

function flipHorizontal() {
    if (parsedSVGDoc) {
        transformManager.flipX();
        applySettings();
    }
}

function flipVertical() {
    if (parsedSVGDoc) {
        transformManager.flipY();
        applySettings();
    }
}

// ==========================
// 10. Initialization
// ==========================

document.addEventListener("DOMContentLoaded", setupEventListeners);