/**
 * Main Application Orchestrator for PlantGuard AI
 */

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    currentScreen: "home",
    scanMode: "live", // "live" | "capture"
    isLiveDiagnoseInFlight: false,
    liveScanInterval: null,
    currentDiagnosis: null,
    currentSnapshotDataUrl: null,
    cameraController: null
  };

  // DOM Elements
  const screens = {
    home: document.getElementById("homeScreen"),
    camera: document.getElementById("cameraScreen"),
    result: document.getElementById("resultScreen"),
    history: document.getElementById("historyScreen"),
    devices: document.getElementById("devicesScreen")
  };

  const navButtons = document.querySelectorAll(".nav-item");
  const scanLeafBtn = document.getElementById("scanLeafBtn");
  const uploadPhotoInput = document.getElementById("uploadPhotoInput");
  const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
  const uploadFallbackBtn = document.getElementById("uploadFallbackBtn");
  const cameraUploadInput = document.getElementById("cameraUploadInput");

  // Camera elements
  const videoEl = document.getElementById("cameraVideo");
  const overlayEl = document.getElementById("cameraOverlay");
  const cameraStateBadge = document.getElementById("cameraStateBadge");
  const qualityAlertBanner = document.getElementById("qualityAlertBanner");
  const qualityAlertText = document.getElementById("qualityAlertText");
  const scanningHudOverlay = document.getElementById("scanningHudOverlay");
  const scanningStatusText = document.getElementById("scanningStatusText");
  const shutterBtn = document.getElementById("shutterBtn");
  const shutterFlash = document.getElementById("shutterFlash");
  const switchCameraBtn = document.getElementById("switchCameraBtn");
  const torchToggleBtn = document.getElementById("torchToggleBtn");
  const pauseCameraBtn = document.getElementById("pauseCameraBtn");
  const testStreamBtn = document.getElementById("testStreamBtn");
  const zoomSlider = document.getElementById("zoomSlider");
  const backFromCameraBtn = document.getElementById("backFromCameraBtn");
  const liveModeTab = document.getElementById("liveModeTab");
  const captureModeTab = document.getElementById("captureModeTab");

  // Result elements
  const resultLeafCanvas = document.getElementById("resultLeafCanvas");
  const resultMarkersContainer = document.getElementById("resultMarkersContainer");
  const resultPlantName = document.getElementById("resultPlantName");
  const resultDiseaseName = document.getElementById("resultDiseaseName");
  const resultConfidenceValue = document.getElementById("resultConfidenceValue");
  const resultConfidenceRing = document.getElementById("resultConfidenceRing");
  const resultSeverityBadge = document.getElementById("resultSeverityBadge");
  const resultSpotsSummary = document.getElementById("resultSpotsSummary");
  const lowConfidenceAlert = document.getElementById("lowConfidenceAlert");
  const treatmentGuideSection = document.getElementById("treatmentGuideSection");
  const treatmentStep1Action = document.getElementById("treatmentStep1Action");
  const treatmentStep2Action = document.getElementById("treatmentStep2Action");
  const treatmentStep3Action = document.getElementById("treatmentStep3Action");
  const treatmentSafetyAlert = document.getElementById("treatmentSafetyAlert");
  const treatmentLocalAlert = document.getElementById("treatmentLocalAlert");
  const saveScanBtn = document.getElementById("saveScanBtn");
  const retakeBtn = document.getElementById("retakeBtn");

  // History & Device elements
  const historyListContainer = document.getElementById("historyListContainer");
  const devicesListContainer = document.getElementById("devicesListContainer");
  const langToggleBtn = document.getElementById("langToggleBtn");
  const permErrorModal = document.getElementById("permErrorModal");
  const closePermModalBtn = document.getElementById("closePermModalBtn");

  // Initialize Camera Controller
  const camera = new CameraController(videoEl, overlayEl, {
    onStateChange: (camState) => {
      if (camState.status === "active") {
        cameraStateBadge.textContent = camState.isSimulated ? t("simulated_camera_badge") : t("camera_active");
        cameraStateBadge.className = camState.isSimulated ? "status-pill simulated" : "status-pill live";
        testStreamBtn.classList.toggle("active", camState.isSimulated);
      } else if (camState.status === "paused") {
        cameraStateBadge.textContent = t("camera_paused");
        cameraStateBadge.className = "status-pill paused";
      }
    },
    onError: (err) => {
      if (err.type === "permission_denied") {
        showPermModal();
      }
    }
  });
  state.cameraController = camera;

  // Screen Switching Function
  function showScreen(screenName) {
    state.currentScreen = screenName;
    Object.keys(screens).forEach((key) => {
      screens[key].classList.toggle("active", key === screenName);
    });

    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.screen === screenName);
    });

    if (screenName === "camera") {
      startCameraSession();
    } else {
      stopCameraSession();
    }

    if (screenName === "history") {
      loadHistory();
    } else if (screenName === "devices") {
      loadDevices();
    }
  }

  // Camera Session Control
  async function startCameraSession() {
    resizeOverlayCanvas();
    await camera.startCamera();
    if (state.scanMode === "live") {
      startLiveScanLoop();
    }
  }

  function stopCameraSession() {
    stopLiveScanLoop();
    camera.stopCamera();
    qualityAlertBanner.classList.remove("visible");
  }

  function resizeOverlayCanvas() {
    if (overlayEl && videoEl) {
      overlayEl.width = videoEl.clientWidth || 360;
      overlayEl.height = videoEl.clientHeight || 480;
    }
  }
  window.addEventListener("resize", resizeOverlayCanvas);

  // Live Scan Mode
  function startLiveScanLoop() {
    stopLiveScanLoop();
    state.liveScanInterval = setInterval(async () => {
      if (state.currentScreen !== "camera" || state.scanMode !== "live" || camera.isPaused) {
        return;
      }

      if (state.isLiveDiagnoseInFlight) return;

      // Quality assessment
      const quality = QualityChecker.analyze(videoEl);
      if (!quality.passed) {
        qualityAlertText.textContent = t(quality.messageKey);
        qualityAlertBanner.classList.add("visible");
        camera.clearOverlay();
        return;
      } else {
        qualityAlertBanner.classList.remove("visible");
      }

      // Grab downscaled frame ~224x224
      const frameDataUrl = camera.captureFrame(224, 224);
      if (!frameDataUrl) return;

      state.isLiveDiagnoseInFlight = true;
      try {
        const diag = await API.diagnoseLeaf(frameDataUrl);
        // Draw real-time red circular hotspot markers and floating badge
        camera.drawOverlayHotspots(diag.regions, diag.disease, diag.confidence);
      } catch (err) {
        console.warn("[LiveScan] Frame diagnosis skipped:", err);
      } finally {
        state.isLiveDiagnoseInFlight = false;
      }
    }, 1100);
  }

  function stopLiveScanLoop() {
    if (state.liveScanInterval) {
      clearInterval(state.liveScanInterval);
      state.liveScanInterval = null;
    }
    camera.clearOverlay();
  }

  // Mode Tabs Switching
  liveModeTab.addEventListener("click", () => {
    state.scanMode = "live";
    liveModeTab.classList.add("active");
    captureModeTab.classList.remove("active");
    shutterBtn.classList.remove("capture-mode");
    startLiveScanLoop();
  });

  captureModeTab.addEventListener("click", () => {
    state.scanMode = "capture";
    captureModeTab.classList.add("active");
    liveModeTab.classList.remove("active");
    shutterBtn.classList.add("capture-mode");
    stopLiveScanLoop();
    qualityAlertBanner.classList.remove("visible");
  });

  // Shutter Capture Workflow
  shutterBtn.addEventListener("click", async () => {
    await performFullCapture();
  });

  async function performFullCapture() {
    // 1. Shutter flash effect
    shutterFlash.classList.add("flash");
    setTimeout(() => shutterFlash.classList.remove("flash"), 250);

    // 2. Client-side quality gate
    const quality = QualityChecker.analyze(videoEl);
    if (!quality.passed) {
      qualityAlertText.textContent = t(quality.messageKey);
      qualityAlertBanner.classList.add("visible");
      setTimeout(() => qualityAlertBanner.classList.remove("visible"), 4000);
      return;
    }

    // 3. Freeze high-resolution frame
    const frozenFrameDataUrl = camera.captureFrame(600, 600);
    state.currentSnapshotDataUrl = frozenFrameDataUrl;

    // 4. Trigger Scanning Laser & Status animation
    scanningHudOverlay.classList.add("active");
    scanningStatusText.textContent = t("scanning_step_1");

    setTimeout(() => {
      scanningStatusText.textContent = t("scanning_step_2");
    }, 700);

    try {
      const diag = await API.diagnoseLeaf(frozenFrameDataUrl);
      setTimeout(() => {
        scanningStatusText.textContent = t("scanning_step_3");
        setTimeout(() => {
          scanningHudOverlay.classList.remove("active");
          displayResults(diag, frozenFrameDataUrl);
        }, 500);
      }, 1200);
    } catch (err) {
      scanningHudOverlay.classList.remove("active");
      alert(`Diagnosis error: ${err.message}`);
    }
  }

  // Display Results on Result Screen
  function displayResults(diag, imageSrc) {
    state.currentDiagnosis = diag;
    showScreen("result");

    // Draw frozen photo onto canvas with responsive aspect ratio
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resultLeafCanvas.width = img.naturalWidth || 600;
      resultLeafCanvas.height = img.naturalHeight || 600;
      const ctx = resultLeafCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0, resultLeafCanvas.width, resultLeafCanvas.height);

      // Render interactive normalized red circular markers
      renderResultMarkers(diag.regions || [], resultLeafCanvas.width, resultLeafCanvas.height);
    };
    img.src = imageSrc;

    // Text & Badges
    resultPlantName.textContent = diag.plant || "Tomato Crop";
    resultDiseaseName.textContent = diag.disease || "Diagnosed Condition";
    
    // Confidence meter
    const conf = Math.round(diag.confidence || 0);
    resultConfidenceValue.textContent = `${conf}%`;
    const offset = 220 - (220 * conf) / 100;
    resultConfidenceRing.style.strokeDashoffset = offset;
    resultConfidenceRing.style.stroke = conf >= 70 ? "#22C55E" : "#EF4444";

    // Severity pill
    const sev = diag.severity || "Moderate";
    resultSeverityBadge.textContent = sev;
    resultSeverityBadge.className = `severity-pill ${sev.toLowerCase()}`;

    resultSpotsSummary.textContent = `${diag.spot_count || (diag.regions ? diag.regions.length : 0)} ${t("spots_detected")}`;

    // Low confidence threshold check (< 70%)
    if (diag.requires_retake || conf < 70) {
      lowConfidenceAlert.style.display = "block";
      treatmentGuideSection.style.display = "none";
    } else {
      lowConfidenceAlert.style.display = "none";
      treatmentGuideSection.style.display = "block";

      // Populate 3-step treatment guide
      const steps = diag.treatment_steps || [];
      if (steps[0]) treatmentStep1Action.textContent = steps[0].action;
      if (steps[1]) treatmentStep2Action.textContent = steps[1].action;
      if (steps[2]) {
        treatmentStep3Action.textContent = steps[2].action;
        treatmentSafetyAlert.textContent = steps[2].safety_note || t("safety_gear_notice");
        treatmentLocalAlert.textContent = steps[2].local_guidance || t("krishi_bhavan_notice");
      }
    }

    // Reset save button state
    saveScanBtn.disabled = false;
    saveScanBtn.textContent = t("save_scan_btn");
    saveScanBtn.classList.remove("saved");
  }

  // Render clickable/hoverable normalized red hotspot circles over frozen image
  function renderResultMarkers(regions, canvasW, canvasH) {
    resultMarkersContainer.innerHTML = "";
    regions.forEach((reg, idx) => {
      const marker = document.createElement("div");
      marker.className = "hotspot-marker";
      marker.style.left = `${(reg.x * 100)}%`;
      marker.style.top = `${(reg.y * 100)}%`;
      const pixelRadius = Math.max(20, reg.r * canvasW);
      marker.style.width = `${pixelRadius * 2}px`;
      marker.style.height = `${pixelRadius * 2}px`;

      marker.innerHTML = `
        <div class="marker-core">
          <span class="marker-index">${idx + 1}</span>
        </div>
        <div class="marker-tooltip">${reg.label || `Spot #${idx + 1}`} (${reg.severity})</div>
      `;

      marker.addEventListener("click", () => {
        alert(`${reg.label || `Spot #${idx + 1}`}\nSeverity: ${reg.severity}\nCoordinates: X=${Math.round(reg.x * 100)}%, Y=${Math.round(reg.y * 100)}%`);
      });

      resultMarkersContainer.appendChild(marker);
    });
  }

  // Save Scan to SQLite
  saveScanBtn.addEventListener("click", async () => {
    if (!state.currentDiagnosis) return;
    saveScanBtn.disabled = true;
    saveScanBtn.textContent = "Saving...";

    try {
      await API.saveScan({
        plant: state.currentDiagnosis.plant,
        disease: state.currentDiagnosis.disease,
        disease_code: state.currentDiagnosis.disease_code,
        confidence: state.currentDiagnosis.confidence,
        severity: state.currentDiagnosis.severity,
        regions: state.currentDiagnosis.regions || [],
        image_data: state.currentSnapshotDataUrl,
        notes: "Scan saved from PlantGuard AI web application"
      });

      saveScanBtn.textContent = `✓ ${t("saved_badge")}`;
      saveScanBtn.classList.add("saved");
    } catch (err) {
      alert(`Save error: ${err.message}`);
      saveScanBtn.disabled = false;
      saveScanBtn.textContent = t("save_scan_btn");
    }
  });

  retakeBtn.addEventListener("click", () => {
    showScreen("camera");
  });

  // History Tab Loader
  async function loadHistory() {
    historyListContainer.innerHTML = "<div class='loading-spinner'>Loading history...</div>";
    try {
      const data = await API.getScans();
      const scans = data.scans || [];
      if (scans.length === 0) {
        historyListContainer.innerHTML = `<div class='empty-state'>${t("no_history")}</div>`;
        return;
      }

      historyListContainer.innerHTML = "";
      scans.forEach((scan) => {
        const card = document.createElement("div");
        card.className = "history-card";
        const dateStr = new Date(scan.timestamp).toLocaleString();
        const thumb = scan.image_data || "/assets/samples/tomato_early_blight.jpg";

        card.innerHTML = `
          <div class="history-thumb-wrap">
            <img class="history-thumb" src="${thumb}" alt="${scan.disease}">
            <span class="severity-pill mini ${scan.severity.toLowerCase()}">${scan.severity}</span>
          </div>
          <div class="history-details">
            <h4 class="history-disease">${scan.disease}</h4>
            <div class="history-meta">
              <span>${scan.plant}</span> • 
              <span class="conf-badge">${Math.round(scan.confidence)}%</span>
            </div>
            <div class="history-date">${dateStr}</div>
          </div>
          <button class="delete-scan-btn" data-id="${scan.id}" title="Delete">🗑</button>
        `;

        card.querySelector(".delete-scan-btn").addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm("Delete this saved scan record?")) {
            await API.deleteScan(scan.id);
            loadHistory();
          }
        });

        card.addEventListener("click", () => {
          // View in result screen
          displayResults(scan, thumb);
        });

        historyListContainer.appendChild(card);
      });
    } catch (err) {
      historyListContainer.innerHTML = `<div class='error-state'>Error: ${err.message}</div>`;
    }
  }

  // IoT Devices Tab Loader
  async function loadDevices() {
    devicesListContainer.innerHTML = "<div class='loading-spinner'>Loading IoT fleet telemetry...</div>";
    try {
      const data = await API.getDevices();
      const devices = data.devices || [];
      devicesListContainer.innerHTML = "";

      devices.forEach((dev) => {
        const card = document.createElement("div");
        card.className = "device-card";
        const lastSeen = new Date(dev.last_ping).toLocaleTimeString();
        const latest = dev.latest_scan;

        card.innerHTML = `
          <div class="device-header">
            <div class="device-title-row">
              <span class="device-icon">📡</span>
              <div>
                <h4 class="device-name">${dev.name}</h4>
                <span class="device-id-tag">${dev.device_id}</span>
              </div>
            </div>
            <span class="status-pill ${dev.status === 'active' ? 'live' : 'paused'}">${dev.status}</span>
          </div>
          <div class="device-metrics-grid">
            <div class="metric-box">
              <span class="metric-label">${t("battery")}</span>
              <span class="metric-val ${dev.battery_pct > 20 ? 'green' : 'red'}">${dev.battery_pct}%</span>
            </div>
            <div class="metric-box">
              <span class="metric-label">${t("last_ping")}</span>
              <span class="metric-val">${lastSeen}</span>
            </div>
            <div class="metric-box wide">
              <span class="metric-label">${t("latest_diagnosis")}</span>
              <span class="metric-val highlight">
                ${latest ? `${latest.disease} (${Math.round(latest.confidence)}%)` : "No automated scans yet"}
              </span>
            </div>
          </div>
        `;
        devicesListContainer.appendChild(card);
      });
    } catch (err) {
      devicesListContainer.innerHTML = `<div class='error-state'>Error: ${err.message}</div>`;
    }
  }

  // Camera Controls Listeners
  switchCameraBtn.addEventListener("click", () => camera.switchCamera());
  torchToggleBtn.addEventListener("click", async () => {
    const on = await camera.toggleTorch();
    torchToggleBtn.classList.toggle("active", on);
  });
  pauseCameraBtn.addEventListener("click", () => {
    const paused = camera.togglePause();
    pauseCameraBtn.classList.toggle("active", paused);
    pauseCameraBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
  });
  testStreamBtn.addEventListener("click", () => {
    camera.startSimulatedFeed();
  });
  zoomSlider.addEventListener("input", (e) => {
    camera.setZoom(e.target.value);
  });
  backFromCameraBtn.addEventListener("click", () => {
    showScreen("home");
  });

  // Navigation Links
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(btn.dataset.screen);
    });
  });

  scanLeafBtn.addEventListener("click", () => {
    showScreen("camera");
  });

  // Image Upload Handlers
  uploadPhotoBtn.addEventListener("click", () => uploadPhotoInput.click());
  uploadFallbackBtn.addEventListener("click", () => cameraUploadInput.click());

  function handleFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      state.currentSnapshotDataUrl = dataUrl;
      try {
        const diag = await API.diagnoseLeaf(dataUrl);
        displayResults(diag, dataUrl);
      } catch (err) {
        alert(`Diagnosis failed: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  }

  uploadPhotoInput.addEventListener("change", handleFileSelect);
  cameraUploadInput.addEventListener("change", handleFileSelect);

  // Global helper for diagnosing sample leaves
  window.diagnoseSample = async function(sampleUrl) {
    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const dataUrl = evt.target.result;
        state.currentSnapshotDataUrl = dataUrl;
        const diag = await API.diagnoseLeaf(dataUrl);
        displayResults(diag, dataUrl);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to diagnose sample:", err);
      alert(`Failed to load sample: ${err.message}`);
    }
  };

  // Robust Event Delegation for sample leaf chips
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".sample-leaf-chip");
    if (chip && chip.dataset.sample) {
      window.diagnoseSample(chip.dataset.sample);
    }
  });

  // Language Switcher
  langToggleBtn.addEventListener("click", () => {
    const nextLang = currentLang === "en" ? "ml" : "en";
    setLanguage(nextLang);
  });

  // Camera Permission Modal Handlers
  function showPermModal() {
    permErrorModal.classList.add("visible");
  }
  closePermModalBtn.addEventListener("click", () => {
    permErrorModal.classList.remove("visible");
  });

  // Service Worker Registration for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("ServiceWorker registration skipped:", err);
    });
  }

  // Start on Home
  showScreen("home");
});
