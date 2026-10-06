const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const fileList = document.getElementById("fileList");
const convertButton = document.getElementById("convertButton");
const downloadButton = document.getElementById("downloadButton");
const clearButton = document.getElementById("clearButton");
const progressArea = document.getElementById("progressArea");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const status = document.getElementById("status");

let selectedFiles = [];
let convertedFiles = [];

fileInput.addEventListener("change", () => setFiles([...fileInput.files]));

["dragenter", "dragover"].forEach(name => {
  dropZone.addEventListener(name, event => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(name => {
  dropZone.addEventListener(name, event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", event => {
  setFiles([...event.dataTransfer.files]);
});

function addFiles(files) {
  const validFiles = files.filter(file =>
    /\.(heic|heif)$/i.test(file.name) ||
    /image\/(heic|heif)/i.test(file.type)
  );

  if (!validFiles.length) {
    status.textContent = "Please paste HEIC or HEIF files.";
    return;
  }

  const existingKeys = new Set(
    selectedFiles.map(file => `${file.name}|${file.size}|${file.lastModified}`)
  );

  for (const file of validFiles) {
    const key = `${file.name}|${file.size}|${file.lastModified}`;
    if (!existingKeys.has(key)) {
      selectedFiles.push(file);
      existingKeys.add(key);
    }
  }

  convertedFiles = [];
  downloadButton.classList.add("hidden");

  renderSelectedFiles();
  convertButton.disabled = selectedFiles.length === 0;
  clearButton.classList.toggle("hidden", selectedFiles.length === 0);
  status.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} ready.`;
}

function renderSelectedFiles() {
  fileList.innerHTML = selectedFiles.map(file => `
    <div class="file-item">
      <span>${escapeHtml(file.name)}</span>
      <span>${formatBytes(file.size)}</span>
    </div>
  `).join("");

  fileList.classList.toggle("hidden", selectedFiles.length === 0);
}

function setFiles(files) {
  selectedFiles = files.filter(file =>
    /\.(heic|heif)$/i.test(file.name) ||
    /image\/(heic|heif)/i.test(file.type)
  );

  convertedFiles = [];
  downloadButton.classList.add("hidden");

  if (!selectedFiles.length) {
    fileList.innerHTML = "";
    fileList.classList.add("hidden");
    status.textContent = "Please choose HEIC or HEIF files.";
    convertButton.disabled = true;
    return;
  }

  renderSelectedFiles();
  convertButton.disabled = false;
  clearButton.classList.remove("hidden");
  status.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} ready.`;
}

convertButton.addEventListener("click", convertAll);
clearButton.addEventListener("click", clearAll);

async function convertAll() {
  if (!selectedFiles.length) return;

  convertButton.disabled = true;
  clearButton.classList.add("hidden");
  progressArea.classList.remove("hidden");
  convertedFiles = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    updateProgress(
      Math.round((i / selectedFiles.length) * 100),
      `Converting ${i + 1} of ${selectedFiles.length}: ${file.name}`
    );

    try {
      const result = await HeicTo({ blob: file, type: "image/png" });
      const blob = Array.isArray(result) ? result[0] : result;
      const name = file.name.replace(/\.(heic|heif)$/i, "") + ".png";
      convertedFiles.push({ name, blob });
    } catch (error) {
      console.error(error);
      status.textContent = `Could not convert ${file.name}. Continuing...`;
    }
  }

  updateProgress(
    100,
    `Finished: ${convertedFiles.length} of ${selectedFiles.length} converted.`
  );

  if (convertedFiles.length) {
    if (typeof gtag === "function") {
      gtag("event", "conversion_complete", {
        files_selected: selectedFiles.length,
        files_converted: convertedFiles.length
      });
    }   
 renderConvertedFiles();
    status.textContent =
      `Conversion complete. ${convertedFiles.length} PNG file${convertedFiles.length === 1 ? "" : "s"} ready to download.`;
    downloadButton.classList.remove("hidden");
  } else {
    status.textContent = "No files were converted.";
  }

  clearButton.classList.remove("hidden");
}

function renderConvertedFiles() {
  fileList.innerHTML = `
    <div class="results-title">Converted files</div>
    ${convertedFiles.map((file, index) => `
      <div class="file-item converted-file">
        <div class="file-info">
          <strong>${escapeHtml(file.name)}</strong>
          <span class="converted-label">PNG ready</span>
        </div>
        <button type="button" class="download-one" data-index="${index}">
          Download PNG
        </button>
      </div>
    `).join("")}
  `;

  fileList.classList.remove("hidden");

  fileList.querySelectorAll(".download-one").forEach(button => {
    button.addEventListener("click", () => {
      downloadSingleFile(convertedFiles[Number(button.dataset.index)]);
    });
  });
}

function downloadSingleFile(file) {
  if (!file) return;

  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

downloadButton.addEventListener("click", async () => {
  if (!convertedFiles.length) return;

  downloadButton.disabled = true;
  downloadButton.textContent = "Creating ZIP...";

  try {
    const zip = new JSZip();
    convertedFiles.forEach(file => zip.file(file.name, file.blob));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "converted-png-files.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = "Download All as ZIP";
  }
});

function clearAll() {
  selectedFiles = [];
  convertedFiles = [];
  fileInput.value = "";
  fileList.innerHTML = "";
  fileList.classList.add("hidden");
  progressArea.classList.add("hidden");
  downloadButton.classList.add("hidden");
  clearButton.classList.add("hidden");
  convertButton.disabled = true;
  progressBar.style.width = "0%";
  progressText.textContent = "Preparing...";
  progressPercent.textContent = "0%";
  status.textContent = "";
}

function updateProgress(percent, message) {
  progressBar.style.width = `${percent}%`;
  progressText.textContent = message;
  progressPercent.textContent = `${percent}%`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


document.addEventListener("paste", event => {
  const items = Array.from(event.clipboardData?.items || []);
  const files = items
    .filter(item => item.kind === "file")
    .map(item => item.getAsFile())
    .filter(Boolean);

  const heicFiles = files.filter(file =>
    /\.(heic|heif)$/i.test(file.name) ||
    /image\/(heic|heif)/i.test(file.type)
  );

  if (!heicFiles.length) return;

  event.preventDefault();
  addFiles(heicFiles);
});

