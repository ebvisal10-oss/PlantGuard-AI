/**
 * Camera Module for PlantGuard AI
 * Manages media streams, facing modes, torch, zoom, simulated test stream,
 * and high-performance canvas frame capture.
 */
class CameraController {
  constructor(videoElement, canvasOverlay, options = {}) {
    this.video = videoElement;
    this.overlay = canvasOverlay;
    this.overlayCtx = this.overlay ? this.overlay.getContext("2d") : null;
    this.stream = null;
    this.track = null;
    this.facingMode = "environment"; // Rear camera preference
    this.isTorchOn = false;
    this.zoomLevel = 1.0;
    this.isPaused = false;
    this.isSimulated = false;
    this.simulatedTimer = null;
    this.simulatedLeafIndex = 0;
    this.sampleLeaves = [
      "/assets/samples/potato_early_blight.jpg",
      "/assets/samples/corn_common_rust.jpg",
      "/assets/samples/pepper_bacterial_spot.jpg",
      "/assets/samples/apple_scab.jpg",
      "/assets/samples/grape_black_rot.jpg",
      "/assets/samples/tomato_early_blight.jpg",
      "/assets/samples/healthy_crop_leaf.jpg"
    ];
    this.onQualityUpdate = options.onQualityUpdate || null;
    this.onError = options.onError || null;
    this.onStateChange = options.onStateChange || null;
  }

  async startCamera(preferSimulated = false) {
    this.stopCamera();

    if (preferSimulated) {
      return this.startSimulatedFeed();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("navigator.mediaDevices.getUserMedia not supported in this browser. Falling back to test stream.");
      return this.startSimulatedFeed("No getUserMedia API supported");
    }

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.isSimulated = false;
      this.isPaused = false;

      // Wait for video metadata to play
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(resolve).catch(resolve);
        };
      });

      this.track = this.stream.getVideoTracks()[0];
      this._applyTrackCapabilities();

      if (this.onStateChange) this.onStateChange({ status: "active", isSimulated: false, isPaused: false });
      return { success: true, simulated: false };
    } catch (err) {
      console.error("[Camera] getUserMedia failed:", err.name, err.message);
      let errorType = "unknown";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorType = "permission_denied";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorType = "not_found";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorType = "in_use";
      }

      if (this.onError) {
        this.onError({ type: errorType, error: err });
      }

      // Automatically fallback to simulated test stream so user is never blocked
      return this.startSimulatedFeed(err.message);
    }
  }

  _applyTrackCapabilities() {
    if (!this.track) return;
    const caps = this.track.getCapabilities ? this.track.getCapabilities() : {};
    
    // Check torch support
    const torchBtn = document.getElementById("torchToggleBtn");
    if (torchBtn) {
      if (caps.torch) {
        torchBtn.style.display = "flex";
      } else {
        // Torch not available on desktop/unsupported lenses
        torchBtn.style.display = "none";
      }
    }

    // Check zoom support
    const zoomSlider = document.getElementById("zoomSlider");
    if (zoomSlider && caps.zoom) {
      zoomSlider.min = caps.zoom.min || 1;
      zoomSlider.max = Math.min(caps.zoom.max || 4, 4);
      zoomSlider.step = caps.zoom.step || 0.1;
      zoomSlider.value = this.zoomLevel;
    }
  }

  startSimulatedFeed(reason = "") {
    this.stopCamera();
    this.isSimulated = true;
    this.isPaused = false;
    console.log(`[Camera] Initiating interactive Leaf Test Stream (${reason || 'Simulated Mode'})`);

    // Create a virtual canvas stream
    const simCanvas = document.createElement("canvas");
    simCanvas.width = 640;
    simCanvas.height = 640;
    const simCtx = simCanvas.getContext("2d");

    let currentImg = new Image();
    currentImg.crossOrigin = "anonymous";
    currentImg.src = this.sampleLeaves[this.simulatedLeafIndex];

    const fps = 20;
    let angle = 0;
    
    this.simulatedTimer = setInterval(() => {
      if (this.isPaused) return;

      simCtx.fillStyle = "#1e2923";
      simCtx.fillRect(0, 0, 640, 640);

      if (currentImg.complete && currentImg.naturalWidth > 0) {
        // Draw leaf with gentle lifelike breathing/swaying motion
        simCtx.save();
        simCtx.translate(320, 320);
        angle += 0.015;
        const scale = 1.0 + Math.sin(angle) * 0.015;
        simCtx.scale(scale * this.zoomLevel, scale * this.zoomLevel);
        simCtx.drawImage(currentImg, -300, -300, 600, 600);
        simCtx.restore();
      }

      // Small simulated timestamp
      simCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
      simCtx.font = "12px monospace";
      simCtx.fillText(`[TEST STREAM] ${new Date().toLocaleTimeString()} • ${this.sampleLeaves[this.simulatedLeafIndex].split("/").pop().replace(".jpg","")}`, 16, 620);

    }, 1000 / fps);

    // Stream from canvas
    if (simCanvas.captureStream) {
      this.stream = simCanvas.captureStream(20);
      this.video.srcObject = this.stream;
      this.video.play().catch(() => {});
    }

    if (this.onStateChange) this.onStateChange({ status: "active", isSimulated: true, isPaused: false });
    return { success: true, simulated: true };
  }

  nextSimulatedLeaf() {
    if (!this.isSimulated) return;
    this.simulatedLeafIndex = (this.simulatedLeafIndex + 1) % this.sampleLeaves.length;
    this.startSimulatedFeed();
  }

  setSimulatedLeaf(url) {
    this.sampleLeaves[this.simulatedLeafIndex] = url;
    this.startSimulatedFeed();
  }

  async switchCamera() {
    if (this.isSimulated) {
      this.nextSimulatedLeaf();
      return;
    }
    this.facingMode = (this.facingMode === "environment") ? "user" : "environment";
    return this.startCamera();
  }

  async toggleTorch() {
    if (!this.track || this.isSimulated) return false;
    try {
      this.isTorchOn = !this.isTorchOn;
      await this.track.applyConstraints({
        advanced: [{ torch: this.isTorchOn }]
      });
      return this.isTorchOn;
    } catch (e) {
      console.warn("Torch constraint could not be applied:", e);
      this.isTorchOn = false;
      return false;
    }
  }

  async setZoom(val) {
    this.zoomLevel = parseFloat(val);
    if (this.track && !this.isSimulated) {
      try {
        await this.track.applyConstraints({
          advanced: [{ zoom: this.zoomLevel }]
        });
      } catch (e) {
        // Fallback to CSS transform zoom on video container
        this.video.style.transform = `scale(${this.zoomLevel})`;
      }
    } else {
      this.video.style.transform = `scale(${this.zoomLevel})`;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.video.pause();
    } else {
      this.video.play().catch(() => {});
    }
    if (this.onStateChange) {
      this.onStateChange({ status: this.isPaused ? "paused" : "active", isSimulated: this.isSimulated, isPaused: this.isPaused });
    }
    return this.isPaused;
  }

  stopCamera() {
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.track = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.clearOverlay();
    if (this.onStateChange) {
      this.onStateChange({ status: "stopped", isSimulated: false, isPaused: false });
    }
  }

  /**
   * Captures a frame from video element
   * @param {number} targetWidth - Width to downscale (e.g. 224 for live scan, 720+ for shutter)
   * @param {number} targetHeight
   * @returns {string} Base64 JPEG data URL
   */
  captureFrame(targetWidth = 224, targetHeight = 224) {
    if (!this.video || (!this.stream && !this.isSimulated)) return null;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const vw = this.video.videoWidth || 640;
    const vh = this.video.videoHeight || 480;

    // Crop center square to match leaf framing guide
    const minDim = Math.min(vw, vh);
    const sx = (vw - minDim) / 2;
    const sy = (vh - minDim) / 2;

    ctx.drawImage(this.video, sx, sy, minDim, minDim, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL("image/jpeg", targetWidth > 300 ? 0.90 : 0.80);
  }

  clearOverlay() {
    if (!this.overlay || !this.overlayCtx) return;
    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
  }

  /**
   * Draws normalized red hotspot rings and disease chips on live canvas overlay
   * @param {Array<{x: number, y: number, r: number, severity: string, label: string}>} regions 
   * @param {string} diseaseLabel 
   * @param {number} confidence 
   */
  drawOverlayHotspots(regions = [], diseaseLabel = "", confidence = 0) {
    if (!this.overlay || !this.overlayCtx) return;
    const ctx = this.overlayCtx;
    const w = this.overlay.width;
    const h = this.overlay.height;

    ctx.clearRect(0, 0, w, h);

    if (!regions || regions.length === 0) return;

    // Pulse animation factor based on timestamp
    const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.12;

    regions.forEach((reg, index) => {
      const cx = reg.x * w;
      const cy = reg.y * h;
      const radius = Math.max(14, reg.r * Math.min(w, h) * pulse);

      // 1. Outer glowing red halo
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.5);
      grad.addColorStop(0, "rgba(239, 68, 68, 0.45)");
      grad.addColorStop(1, "rgba(239, 68, 68, 0.0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. High-precision dashed targeting ring
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Central targeting reticle crosshair
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();

      // 4. Spot Index Tag
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
      ctx.beginPath();
      ctx.arc(cx + radius * 0.7, cy - radius * 0.7, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${index + 1}`, cx + radius * 0.7, cy - radius * 0.7);
    });

    // Draw floating disease chip if diagnosis available
    if (diseaseLabel && confidence > 0) {
      const chipText = `${diseaseLabel} (${confidence.toFixed(1)}%)`;
      ctx.font = "bold 13px Outfit, sans-serif";
      const textWidth = ctx.measureText(chipText).width;
      const chipW = textWidth + 36;
      const chipH = 34;
      const chipX = (w - chipW) / 2;
      const chipY = 24;

      // Glassmorphism pill backdrop
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = confidence >= 70 ? "#22C55E" : "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 17);
      ctx.fill();
      ctx.stroke();

      // Glowing status dot
      ctx.fillStyle = confidence >= 70 ? "#22C55E" : "#F59E0B";
      ctx.beginPath();
      ctx.arc(chipX + 18, chipY + 17, 5, 0, Math.PI * 2);
      ctx.fill();

      // Label text
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(chipText, chipX + 30, chipY + 18);
    }
  }
}
