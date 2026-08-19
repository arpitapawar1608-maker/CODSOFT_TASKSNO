// =====================================================
// ☁ CLOUDVAULT — PREMIUM DASHBOARD
// AWS S3 FILE MANAGEMENT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const selectedFile = document.getElementById("selectedFile");

    const totalFiles = document.getElementById("totalFiles");
    const storageUsed = document.getElementById("storageUsed");
    const fileList = document.getElementById("fileList");


    // =====================================================
    // FILE SELECT
    // =====================================================

    if (fileInput) {

        fileInput.addEventListener("change", () => {

            const file = fileInput.files[0];

            if (!file) {

                if (selectedFile) {
                    selectedFile.textContent = "No file selected";
                }

                return;
            }

            if (selectedFile) {

                selectedFile.innerHTML =
                    `📄 <strong>${escapeHTML(file.name)}</strong>
                     <span>(${formatFileSize(file.size)})</span>`;

            }

        });

    }


    // =====================================================
    // UPLOAD BUTTON
    // =====================================================

    if (uploadBtn) {

        uploadBtn.addEventListener("click", uploadFile);

    }


    // =====================================================
    // UPLOAD FILE TO AWS S3
    // =====================================================

    async function uploadFile() {

        const file = fileInput?.files[0];

        if (!file) {

            showMessage(
                "⚠️ Please select a file first.",
                "warning"
            );

            return;
        }


        // Maximum 100 MB

        const MAX_SIZE = 100 * 1024 * 1024;

        if (file.size > MAX_SIZE) {

            showMessage(
                "❌ File must be smaller than 100 MB.",
                "error"
            );

            return;
        }


        const formData = new FormData();

        formData.append("file", file);


        try {

            uploadBtn.disabled = true;

            uploadBtn.innerHTML =
                "⏳ Uploading to AWS S3...";


            const response = await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


            const result =
                await response.json().catch(() => ({}));


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Upload failed"
                );

            }


            showMessage(
                "✅ File uploaded successfully to AWS S3!",
                "success"
            );


            // Reset file input

            fileInput.value = "";


            if (selectedFile) {

                selectedFile.textContent =
                    "No file selected";

            }


            // Reload files

            await loadFiles();

        }

        catch (error) {

            console.error(
                "Upload error:",
                error
            );

            showMessage(
                "❌ " + error.message,
                "error"
            );

        }

        finally {

            uploadBtn.disabled = false;

            uploadBtn.innerHTML =
                "⬆ Upload File";

        }

    }


    // =====================================================
    // LOAD FILES FROM AWS S3
    // =====================================================

    async function loadFiles() {

        if (!fileList) {
            return;
        }


        try {

            fileList.innerHTML = `

                <div class="empty-files">

                    <div>⏳</div>

                    <h3>
                        Loading files...
                    </h3>

                    <p>
                        Connecting to AWS S3
                    </p>

                </div>

            `;


            const response =
                await fetch("/upload/files");


            if (!response.ok) {

                throw new Error(
                    "Failed to load files"
                );

            }


            const files =
                await response.json();


            updateStatistics(files);

            displayFiles(files);

        }

        catch (error) {

            console.error(
                "File loading error:",
                error
            );


            fileList.innerHTML = `

                <div class="empty-files">

                    <div>⚠️</div>

                    <h3>
                        Unable to load files
                    </h3>

                    <p>
                        Check your AWS S3 connection.
                    </p>

                </div>

            `;

        }

    }


    // =====================================================
    // UPDATE STATISTICS
    // =====================================================

    function updateStatistics(files) {

        if (totalFiles) {

            totalFiles.textContent =
                files.length;

        }


        let totalSize = 0;


        files.forEach(file => {

            totalSize +=
                Number(file.size || 0);

        });


        if (storageUsed) {

            storageUsed.textContent =
                formatFileSize(totalSize);

        }

    }


    // =====================================================
    // DISPLAY FILES
    // =====================================================

    function displayFiles(files) {

        if (!fileList) {
            return;
        }


        if (!files || files.length === 0) {

            fileList.innerHTML = `

                <div class="empty-files">

                    <div>☁️</div>

                    <h3>
                        No files uploaded yet
                    </h3>

                    <p>
                        Upload your first file to AWS S3.
                    </p>

                    <a
                        href="#upload"
                        class="btn btn-primary">

                        📤 Upload First File

                    </a>

                </div>

            `;

            return;
        }


        fileList.innerHTML = "";


        files.forEach(file => {

            fileList.appendChild(
                createFileCard(file)
            );

        });

    }


    // =====================================================
    // CREATE FILE CARD
    // =====================================================

    function createFileCard(file) {

        const card =
            document.createElement("div");


        card.className =
            "file-card";


        const fileName =
            file.name || "Unknown File";


        const fileSize =
            formatFileSize(
                Number(file.size || 0)
            );


        const fileType =
            file.type || "FILE";


        const encodedName =
            encodeURIComponent(fileName);


        const icon =
            getFileIcon(fileName);


        card.innerHTML = `

            <div class="file-info">

                <div class="file-icon">

                    ${icon}

                </div>


                <div class="file-details">

                    <h3
                        title="${escapeHTML(fileName)}">

                        ${escapeHTML(fileName)}

                    </h3>


                    <div class="file-meta">

                        <span>
                            📦 ${fileSize}
                        </span>

                        <span>
                            📄 ${escapeHTML(fileType)}
                        </span>

                        <span>
                            ☁ AWS S3
                        </span>

                    </div>

                </div>

            </div>


            <div class="file-actions">

                <button
                    class="file-btn view-btn"
                    data-action="view">

                    👁 View

                </button>


                <button
                    class="file-btn download-btn"
                    data-action="download">

                    ⬇ Download

                </button>


                <button
                    class="file-btn delete-btn"
                    data-action="delete">

                    🗑 Delete

                </button>

            </div>

        `;


        // =================================================
        // VIEW
        // =================================================

        const viewButton =
            card.querySelector(
                '[data-action="view"]'
            );


        viewButton.addEventListener(
            "click",
            () => {

                // Your current backend has
                // download route, not view route.

                window.open(
                    `/upload/download/${encodedName}`,
                    "_blank"
                );

            }
        );


        // =================================================
        // DOWNLOAD
        // =================================================

        const downloadButton =
            card.querySelector(
                '[data-action="download"]'
            );


        downloadButton.addEventListener(
            "click",
            () => {

                const link =
                    document.createElement("a");


                link.href =
                    `/upload/download/${encodedName}`;


                link.target =
                    "_blank";


                document.body.appendChild(link);

                link.click();

                link.remove();

            }
        );


        // =================================================
        // DELETE
        // =================================================

        const deleteButton =
            card.querySelector(
                '[data-action="delete"]'
            );


        deleteButton.addEventListener(
            "click",
            () => {

                deleteFile(
                    fileName,
                    card
                );

            }
        );


        return card;

    }


    // =====================================================
    // DELETE FILE FROM AWS S3
    // =====================================================

    async function deleteFile(
        fileName,
        card
    ) {

        const confirmed =
            confirm(
                `Are you sure you want to delete "${fileName}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const deleteButton =
                card.querySelector(
                    ".delete-btn"
                );


            if (deleteButton) {

                deleteButton.disabled =
                    true;

                deleteButton.innerHTML =
                    "⏳ Deleting...";

            }


            const response =
                await fetch(
                    `/upload/delete/${encodeURIComponent(fileName)}`,
                    {
                        method: "DELETE"
                    }
                );


            const result =
                await response
                    .json()
                    .catch(() => ({}));


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Delete failed"
                );

            }


            showMessage(
                "🗑 File deleted successfully from AWS S3!",
                "success"
            );


            await loadFiles();

        }

        catch (error) {

            console.error(
                "Delete error:",
                error
            );


            showMessage(
                "❌ " + error.message,
                "error"
            );

        }

    }


    // =====================================================
    // FILE ICON
    // =====================================================

    function getFileIcon(filename) {

        const extension =
            filename
                .split(".")
                .pop()
                .toLowerCase();


        const icons = {

            pdf: "📕",

            doc: "📘",
            docx: "📘",

            xls: "📗",
            xlsx: "📗",

            ppt: "📙",
            pptx: "📙",

            jpg: "🖼️",
            jpeg: "🖼️",
            png: "🖼️",
            gif: "🖼️",
            webp: "🖼️",
            svg: "🖼️",

            mp4: "🎬",
            mkv: "🎬",
            avi: "🎬",
            mov: "🎬",
            webm: "🎬",

            mp3: "🎵",
            wav: "🎵",
            ogg: "🎵",

            zip: "🗜️",
            rar: "🗜️",
            "7z": "🗜️",

            txt: "📝",

            csv: "📊",

            json: "⚙️",

            html: "🌐",

            css: "🎨",

            js: "🟨",

            py: "🐍"

        };


        return icons[extension] || "📄";

    }


    // =====================================================
    // FORMAT FILE SIZE
    // =====================================================

    function formatFileSize(bytes) {

        bytes =
            Number(bytes || 0);


        if (bytes === 0) {
            return "0 KB";
        }


        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
            "TB"
        ];


        const index =
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            );


        return (
            bytes /
            Math.pow(
                1024,
                index
            )
        ).toFixed(2)
        + " "
        + units[index];

    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(
        message,
        type
    ) {

        const oldMessage =
            document.querySelector(
                ".cloudvault-message"
            );


        if (oldMessage) {
            oldMessage.remove();
        }


        const messageBox =
            document.createElement(
                "div"
            );


        messageBox.className =
            `cloudvault-message ${type}`;


        messageBox.textContent =
            message;


        document.body.appendChild(
            messageBox
        );


        setTimeout(() => {

            messageBox.classList.add(
                "show"
            );

        }, 10);


        setTimeout(() => {

            messageBox.classList.remove(
                "show"
            );


            setTimeout(() => {

                messageBox.remove();

            }, 300);

        }, 3500);

    }


    // =====================================================
    // SECURITY
    // =====================================================

    function escapeHTML(value) {

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    // =====================================================
    // AUTO REFRESH
    // =====================================================

    document.addEventListener(
        "visibilitychange",
        () => {

            if (!document.hidden) {

                loadFiles();

            }

        }
    );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadFiles();

});