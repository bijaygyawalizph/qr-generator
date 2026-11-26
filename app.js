(() => {
  "use strict";

  const form = document.getElementById("qr-form");
  const urlInput = document.getElementById("url-input");
  const logoInput = document.getElementById("logo-input");
  const dropzone = document.getElementById("dropzone");
  const dropzoneContent = document.getElementById("dropzone-content");
  const logoPreview = document.getElementById("logo-preview");
  const removeLogoBtn = document.getElementById("remove-logo");

  const dotsType = document.getElementById("dots-type");
  const cornersType = document.getElementById("corners-type");
  const dotsColor = document.getElementById("dots-color");
  const bgColor = document.getElementById("bg-color");
  const qrSize = document.getElementById("qr-size");
  const errorCorrection = document.getElementById("error-correction");

  const qrCanvas = document.getElementById("qr-canvas");
  const downloadRow = document.getElementById("download-row");
  const downloadFormat = document.getElementById("download-format");
  const downloadBtn = document.getElementById("download-btn");
  const formError = document.getElementById("form-error");
  const resetBtn = document.getElementById("reset-btn");

  let logoDataUrl = null;
  let qrCode = null;
  let hasGenerated = false;

  function showError(message) {
    formError.textContent = message;
    formError.hidden = !message;
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function isValidUrl(value) {
    try {
      const u = new URL(value);
      return Boolean(u.hostname);
    } catch {
      return false;
    }
  }

  // ---- Logo upload handling ----
  function setLogoPreview(dataUrl) {
    logoDataUrl = dataUrl;
    logoPreview.src = dataUrl;
    logoPreview.hidden = false;
    dropzoneContent.hidden = true;
    removeLogoBtn.hidden = false;
  }

  function clearLogo() {
    logoDataUrl = null;
    logoPreview.src = "";
    logoPreview.hidden = true;
    dropzoneContent.hidden = false;
    removeLogoBtn.hidden = true;
    logoInput.value = "";
  }

  function handleLogoFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Logo must be an image file.");
      return;
    }
    showError("");
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener("click", () => logoInput.click());

  logoInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleLogoFile(file);
  });

  removeLogoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearLogo();
  });

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    })
  );

  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
    })
  );

  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleLogoFile(file);
  });

  // ---- QR generation ----
  function buildOptions(data) {
    const size = Math.min(1000, Math.max(150, Number(qrSize.value) || 300));
    const options = {
      width: size,
      height: size,
      type: "svg",
      data,
      margin: 8,
      qrOptions: {
        errorCorrectionLevel: errorCorrection.value,
      },
      dotsOptions: {
        type: dotsType.value,
        color: dotsColor.value,
      },
      cornersSquareOptions: {
        type: cornersType.value,
        color: dotsColor.value,
      },
      cornersDotOptions: {
        type: cornersType.value === "square" ? "square" : "dot",
        color: dotsColor.value,
      },
      backgroundOptions: {
        color: bgColor.value,
      },
    };

    if (logoDataUrl) {
      options.image = logoDataUrl;
      options.imageOptions = {
        crossOrigin: "anonymous",
        margin: 6,
        imageSize: 0.4,
        hideBackgroundDots: true,
      };
    }

    return options;
  }

  function renderQr(data) {
    const options = buildOptions(data);

    qrCanvas.innerHTML = "";
    qrCanvas.classList.remove("qr-canvas--empty");

    qrCode = new QRCodeStyling(options);
    qrCode.append(qrCanvas);

    downloadRow.hidden = false;
    hasGenerated = true;
  }

  function updateIfGenerated() {
    if (!hasGenerated) return;
    const data = normalizeUrl(urlInput.value);
    if (isValidUrl(data)) {
      renderQr(data);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = urlInput.value;
    const normalized = normalizeUrl(raw);

    if (!normalized) {
      showError("Please enter a link.");
      return;
    }
    if (!isValidUrl(normalized)) {
      showError("Please enter a valid URL (e.g. https://example.com).");
      return;
    }

    showError("");
    renderQr(normalized);
  });

  // Live-update style controls once a QR has been generated
  [dotsType, cornersType, dotsColor, bgColor, errorCorrection].forEach((el) =>
    el.addEventListener("change", updateIfGenerated)
  );
  qrSize.addEventListener("input", updateIfGenerated);

  // Changing the logo after generation should refresh the QR too
  const refreshAfterLogoChange = () => updateIfGenerated();
  logoInput.addEventListener("change", refreshAfterLogoChange);
  removeLogoBtn.addEventListener("click", refreshAfterLogoChange);

  downloadBtn.addEventListener("click", () => {
    if (!qrCode) return;
    const ext = downloadFormat.value;
    qrCode.download({ name: "qr-code", extension: ext });
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    clearLogo();
    showError("");
    qrCanvas.innerHTML = "<span>Your QR code will appear here</span>";
    qrCanvas.classList.add("qr-canvas--empty");
    downloadRow.hidden = true;
    qrCode = null;
    hasGenerated = false;
  });
})();
