/* ─── DocuDistill Public Upload ──────────────────────────────
   Landing page + password-gated upload to Supabase Storage.
──────────────────────────────────────────────────────────── */

// ─── Supabase Config ─────────────────────────────────────
const SUPABASE_URL = "https://ctgtcojnuukcathxjaqu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Z3Rjb2pudXVrY2F0aHhqYXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzg1MDMsImV4cCI6MjA4OTk1NDUwM30.vt48ucx6jsCEBixDZzEfpwe0i-l-K5XMmyE46tqxCt0";
const BUCKET_NAME = "submissions";

// ─── Password hash (SHA-256 of "DocuDistillPass1328") ────
const ACCESS_HASH = "039454d8080681ac22f649626fd12e9008690d610bf7574d8a626a3b8f55239d";

let supa = null;
let selectedFiles = [];
let isAuthenticated = false;

/* ─── Init ───── */

document.addEventListener("DOMContentLoaded", () => {
    initSupabase();
    bindEvents();
    runHeroAnimations();
    initScrollReveal();
    initNavButtonObserver();
    initDemoExtraction();
    initDemoDatabase();
});

function initSupabase() {
    try {
        if (SUPABASE_URL.includes("YOUR_PROJECT_REF")) return;
        supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Supabase init failed:", e);
    }
}

/* ─── Password Gate ───── */

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkPassword() {
    const input = document.getElementById("passwordInput");
    const error = document.getElementById("passwordError");
    const password = input.value;

    if (!password) return;

    const hash = await hashPassword(password);

    if (hash === ACCESS_HASH) {
        isAuthenticated = true;
        closeModal("passwordModal");
        openModal("uploadModal");
        error.classList.add("hidden");
    } else {
        error.classList.remove("hidden");
        input.value = "";
        input.focus();
    }
}

function requestUploadAccess() {
    if (isAuthenticated) {
        openModal("uploadModal");
    } else {
        openModal("passwordModal");
        setTimeout(() => document.getElementById("passwordInput").focus(), 100);
    }
}

/* ─── Modal Helpers ───── */

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
    document.body.style.overflow = "";
}

/* ─── Events ───── */

function bindEvents() {
    // All upload buttons → password gate
    document.getElementById("heroUploadBtn").addEventListener("click", requestUploadAccess);
    document.getElementById("navUploadBtn").addEventListener("click", requestUploadAccess);
    document.getElementById("ctaUploadBtn").addEventListener("click", requestUploadAccess);

    // Password modal
    document.getElementById("modalClose").addEventListener("click", () => closeModal("passwordModal"));
    document.getElementById("passwordSubmit").addEventListener("click", checkPassword);
    document.getElementById("passwordInput").addEventListener("keydown", e => {
        if (e.key === "Enter") checkPassword();
    });
    document.getElementById("passwordModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) closeModal("passwordModal");
    });

    // Upload modal
    document.getElementById("uploadModalClose").addEventListener("click", () => closeModal("uploadModal"));
    document.getElementById("uploadModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) closeModal("uploadModal");
    });

    // File input
    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("fileInput");

    uploadZone.addEventListener("click", () => fileInput.click());
    uploadZone.addEventListener("dragover", e => {
        e.preventDefault();
        uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", e => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener("change", e => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = "";
    });

    document.getElementById("submitBtn").addEventListener("click", uploadAll);
    document.getElementById("clearBtn").addEventListener("click", clearQueue);

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", e => {
            const target = document.querySelector(a.getAttribute("href"));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

/* ─── Nav Upload Button (appears after scrolling past hero CTA) ───── */

function initNavButtonObserver() {
    const heroBtn = document.getElementById("heroUploadBtn");
    const navBtn = document.getElementById("navUploadBtn");

    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            navBtn.classList.remove("visible");
        } else {
            navBtn.classList.add("visible");
        }
    }, { threshold: 0 });

    observer.observe(heroBtn);
}

/* ─── Hero Pipeline Animation ───── */

function runHeroAnimations() {
    // Staggered fade-in for hero content
    document.querySelectorAll(".anim-fade").forEach(el => {
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add("active"), delay);
    });

    // Pipeline stages animate sequentially
    const stages = document.querySelectorAll(".pipe-stage");
    const connectors = document.querySelectorAll(".pipe-flow");

    let delay = 1200; // start after hero text
    stages.forEach((stage, i) => {
        setTimeout(() => stage.classList.add("active"), delay);
        delay += 400;
        if (connectors[i]) {
            setTimeout(() => connectors[i].classList.add("active"), delay);
            delay += 300;
        }
    });

    // Floating cards
    const floats = document.querySelectorAll(".float-card");
    floats.forEach((card, i) => {
        setTimeout(() => card.classList.add("active"), 2800 + i * 400);
    });

    // Loop: pulse the pipeline periodically
    setInterval(() => {
        // Reset
        connectors.forEach(c => c.classList.remove("active"));
        stages.forEach(s => {
            s.style.transition = "none";
            s.classList.remove("active");
        });

        // Re-trigger after a frame
        requestAnimationFrame(() => {
            stages.forEach(s => s.style.transition = "");
            let d = 200;
            stages.forEach((stage, i) => {
                setTimeout(() => stage.classList.add("active"), d);
                d += 350;
                if (connectors[i]) {
                    setTimeout(() => connectors[i].classList.add("active"), d);
                    d += 250;
                }
            });
        });
    }, 8000);
}

/* ─── Scroll Reveal ───── */

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const siblings = entry.target.parentElement?.querySelectorAll(".reveal") || [];
                const idx = Array.from(siblings).indexOf(entry.target);
                setTimeout(() => entry.target.classList.add("active"), (idx % 6) * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });

    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

/* ─── File Queue ───── */

function addFiles(fileList) {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"];

    for (const file of Array.from(fileList)) {
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!allowed.includes(ext)) { alert(`Unsupported: ${file.name}`); continue; }
        if (file.size > 50 * 1024 * 1024) { alert(`Too large (50MB max): ${file.name}`); continue; }
        if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    }
    renderQueue();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderQueue();
}

function clearQueue() {
    selectedFiles = [];
    renderQueue();
}

function renderQueue() {
    const container = document.getElementById("uploadQueue");
    const list = document.getElementById("queueList");
    const count = document.getElementById("queueCount");
    const submitBtn = document.getElementById("submitBtn");

    if (!selectedFiles.length) {
        container.classList.add("hidden");
        submitBtn.disabled = true;
        return;
    }

    container.classList.remove("hidden");
    submitBtn.disabled = false;
    count.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`;

    list.innerHTML = selectedFiles.map((file, i) => `
        <div class="queue-item">
            <span class="queue-item-name">${esc(file.name)}</span>
            <span class="queue-item-size">${formatSize(file.size)}</span>
            <button class="queue-item-remove" data-index="${i}">&times;</button>
        </div>
    `).join("");

    list.querySelectorAll(".queue-item-remove").forEach(btn => {
        btn.addEventListener("click", () => removeFile(parseInt(btn.dataset.index)));
    });
}

/* ─── Upload ───── */

async function uploadAll() {
    if (!selectedFiles.length) return;

    const submitBtn = document.getElementById("submitBtn");
    const statusEl = document.getElementById("uploadStatus");
    const statusText = document.getElementById("statusText");
    const statusIcon = document.getElementById("statusIcon");

    submitBtn.disabled = true;
    statusEl.classList.remove("hidden", "success", "error");
    statusIcon.innerHTML = '<svg class="spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 019.95 9"/></svg>';

    const submitterName = document.getElementById("submitterName").value.trim();
    const submitterNote = document.getElementById("submitterNote").value.trim();

    let uploaded = 0;
    let failed = 0;

    for (const file of selectedFiles) {
        statusText.textContent = `Uploading ${uploaded + 1}/${selectedFiles.length}: ${file.name}`;
        try {
            if (supa) {
                const ts = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                const path = `${ts}_${safeName}`;

                const { error } = await supa.storage.from(BUCKET_NAME).upload(path, file, {
                    cacheControl: "3600",
                    upsert: false,
                });
                if (error) throw error;

                // Save metadata (best-effort)
                try {
                    await supa.from("submission_metadata").insert({
                        storage_path: path,
                        original_filename: file.name,
                        file_size: file.size,
                        submitter_name: submitterName || "anonymous",
                        submitter_note: submitterNote || "",
                    });
                } catch (_) {}

                uploaded++;
            } else {
                await new Promise(r => setTimeout(r, 400));
                uploaded++;
            }
        } catch (e) {
            console.error(`Upload failed: ${file.name}`, e);
            failed++;
        }
    }

    if (failed === 0) {
        statusEl.classList.add("success");
        statusIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        statusText.textContent = `${uploaded} file${uploaded === 1 ? "" : "s"} uploaded. Processing will begin shortly.`;
        selectedFiles = [];
        renderQueue();
    } else {
        statusEl.classList.add("error");
        statusIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        statusText.textContent = `${uploaded} uploaded, ${failed} failed.`;
    }

    submitBtn.disabled = false;
}

/* ─── Dashboard Demo: Extraction Animation ───── */

// Real extracted fields from d6062ef3.json
const DEMO_FIELDS = [
    { key: "Form", value: "WWC-5P", hw: false },
    { key: "Fraction", value: "NW1/4SW1/4SW1/4", hw: true },
    { key: "Section", value: "3", hw: true },
    { key: "Township", value: "13", hw: true },
    { key: "Range", value: "13", hw: true },
    { key: "County", value: "Russell", hw: true },
    { key: "Owner", value: "Korg Est", hw: true },
    { key: "Address", value: "Po Box 913", hw: true },
    { key: "City/State/ZIP", value: "Russell, Ks 67665", hw: true },
    { key: "Depth", value: "75 ft.", hw: true },
    { key: "Static Water Level", value: "45 ft.", hw: true },
    { key: "Use", value: "Domestic", hw: false },
    { key: "Casing Type", value: "Native Stone", hw: true },
    { key: "Casing Diameter", value: "36 in.", hw: true },
    { key: "Grout Material", value: "Bentonite", hw: false },
    { key: "Completion Date", value: "2/24/03", hw: true },
];

function initDemoExtraction() {
    const container = document.getElementById("demoExtraction");
    if (!container) return;

    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            runExtractionDemo();
        }
    }, { threshold: 0.3 });

    observer.observe(container);
}

function runExtractionDemo() {
    const badge = document.getElementById("demoStatusBadge");
    const fieldsContainer = document.getElementById("demoFields");
    const scanLine = document.getElementById("scanLine");
    const footer = document.getElementById("demoFooter");
    const fieldCount = document.getElementById("demoFieldCount");
    const timeEl = document.getElementById("demoTime");

    // Clear previous
    fieldsContainer.innerHTML = "";
    badge.textContent = "Queued";
    badge.className = "demo-status-badge queued";
    footer.classList.remove("visible");
    scanLine.classList.remove("scanning");
    fieldCount.textContent = "0";
    timeEl.textContent = "0.0s";

    // Scan duration = 7s, fields spread evenly across it
    const scanDuration = 7000;
    const fieldDelay = scanDuration / DEMO_FIELDS.length; // ~437ms per field

    // Phase 1: Start scanning (600ms in)
    setTimeout(() => {
        badge.textContent = "Processing";
        badge.className = "demo-status-badge processing";
        scanLine.classList.add("scanning");
    }, 600);

    // Phase 2: Fields appear synced with scan position
    DEMO_FIELDS.forEach((field, i) => {
        const el = document.createElement("div");
        el.className = "demo-field";
        el.innerHTML = `
            <span class="demo-field-key">${field.key}</span>
            <span class="demo-field-value">${field.value}${field.hw ? '<span class="demo-field-hw">handwritten</span>' : ''}</span>
        `;
        fieldsContainer.appendChild(el);

        const t = 900 + i * fieldDelay;
        setTimeout(() => {
            el.classList.add("visible");
            fieldCount.textContent = String(i + 1);
            timeEl.textContent = ((i + 1) * 1.74).toFixed(1) + "s";
        }, t);
    });

    // Phase 3: Complete (after scan finishes)
    const completeTime = 900 + scanDuration + 300;
    setTimeout(() => {
        badge.textContent = "Complete";
        badge.className = "demo-status-badge complete";
        scanLine.classList.remove("scanning");
        scanLine.style.opacity = "0";
        footer.classList.add("visible");
        timeEl.textContent = "27.9s";
    }, completeTime);

    // Loop after pause
    setTimeout(() => runExtractionDemo(), completeTime + 4000);
}


/* ─── Dashboard Demo: Database Import Animation ───── */

function initDemoDatabase() {
    const container = document.getElementById("demoDatabase");
    if (!container) return;

    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            runDatabaseDemo();
        }
    }, { threshold: 0.35 });

    observer.observe(container);
}

function runDatabaseDemo() {
    const card = document.getElementById("dbExtractionCard");
    const fieldsList = document.getElementById("dbFieldsList");
    const btn = document.getElementById("dbImportBtn");
    const ripple = document.getElementById("dbRipple");
    const tableContainer = document.getElementById("dbTableContainer");
    const newRow = document.getElementById("dbNewRow");
    const rowCount = document.getElementById("dbRowCount");

    // Reset
    card.className = "db-extraction-panel";
    card.style.display = "";
    btn.innerHTML = 'Import to Database <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    btn.classList.remove("clicked");
    ripple.classList.remove("animate");
    tableContainer.classList.add("hidden");
    newRow.classList.remove("visible");
    rowCount.textContent = "12 records";

    // Populate with first 14 fields (same as extraction demo end state)
    const fields14 = DEMO_FIELDS.slice(0, 14);
    fieldsList.innerHTML = fields14.map(f => `
        <div class="demo-field visible">
            <span class="demo-field-key">${f.key}</span>
            <span class="demo-field-value">${f.value}${f.hw ? '<span class="demo-field-hw">handwritten</span>' : ''}</span>
        </div>
    `).join("");

    // Phase 1: "Click" the button (2s)
    setTimeout(() => {
        btn.classList.add("clicked");
        ripple.classList.add("animate");
        btn.innerHTML = 'Importing... <svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 019.95 9"/></svg>';
    }, 2000);

    // Phase 2: Panel shrinks
    setTimeout(() => {
        card.classList.add("importing");
    }, 2800);

    // Phase 3: Panel disappears, table appears
    setTimeout(() => {
        card.classList.add("gone");
    }, 3500);

    setTimeout(() => {
        card.style.display = "none";
        tableContainer.classList.remove("hidden");
    }, 4000);

    // Phase 4: New row slides in
    setTimeout(() => {
        newRow.classList.add("visible");
        rowCount.textContent = "13 records";
    }, 4800);

    // Loop
    setTimeout(() => runDatabaseDemo(), 12000);
}

/* ─── Utilities ───── */

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function esc(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}
