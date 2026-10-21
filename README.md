# PlantGuard AI 🌿🛡️
### *Detect Early. Grow Healthier.*

**PlantGuard AI** is a mobile-first Progressive Web App (PWA) with a Python FastAPI backend for real-time crop disease detection, severity assessment, and actionable agronomic treatment guidance.

Built with an Agritech aesthetic (`#1B7F3B`), glassmorphism HUD, leaf-framing reticle, client-side blur/lighting quality gates, normalized red hotspot circular overlays, SQLite scan history, and an IoT module for autonomous field cameras (ESP32-CAM & Raspberry Pi).

---

## 🌟 Key Features

1. **Camera HUD & Real-Time Leaf Guidance**:
   - `navigator.mediaDevices.getUserMedia` with rear camera preference (`facingMode: "environment"`).
   - SVG leaf-shaped framing guide with corner brackets and guidance tips.
   - Dual Modes:
     - **Live Scan**: captures a frame every ~1s, downscales to $224 \times 224$, overlays red circles over infected spots, floating diagnosis chip, and prevents overlapping requests.
     - **Capture Mode**: shutter button with visual flash, green laser scan line sweep animation cycling *"Scanning Leaf..."* $\rightarrow$ *"AI Analyzing Image..."* $\rightarrow$ *"Processing Complete."*
   - Camera Controls: Switch front/rear lens, torch/flash toggle (where supported), pinch/slider zoom, pause/resume, and test stream fallback.
   - **Quality Assurance Gate**: Real-time client-side Laplacian blur check and luminance histogram alert (*"Image too blurry / too dark, adjust and try again"*).
   - **Interactive Leaf Test Stream**: Built-in test stream for testing on desktop / headless browser environments without a physical camera.

2. **Accurate Diagnosis & Grad-CAM Hotspot Localization**:
   - Normalized spot coordinates $(x, y, r \in [0, 1])$ that scale crisply on any device.
   - Severity scoring: Healthy, Mild, Moderate, Severe.
   - **Confidence Threshold Rule**: If confidence is under 70%, shows *"Not sure, retake the photo"* instead of an uncertain verdict.
   - **Actionable 3-Step Treatment Guide**:
     - Step 1: Sanitation & physical removal of infected leaves.
     - Step 2: Canopy airflow & moisture control (drip irrigation, mulching).
     - Step 3: Qualified local chemical & bio-fungicide recommendations with safety gear notices and local Krishi Bhavan advisory reminders.

3. **Storage & Fleet Monitoring**:
   - **SQLite Database**: Persists saved scans with thumbnails, disease codes, and coordinates.
   - **History Tab**: Browse past scans, view details, or delete records.
   - **IoT Field Device Module**: `/api/device/ingest` allows solar ESP32-CAM and Raspberry Pi nodes to post foliar images from the field, with a live telemetry dashboard.

4. **Localization (i18n)**:
   - English & Malayalam (മലയാളം) toggle.

---

## 📁 Project Structure

```
jose/
├── backend/
│   ├── main.py                 # FastAPI application routes & middleware
│   ├── database.py             # SQLite setup, tables & CRUD operations
│   ├── knowledge_base.json     # Plant diseases, symptoms, causes & 3-step treatments
│   └── generate_samples.py     # High quality synthetic leaf generator
├── model/
│   ├── base.py                 # BaseDiseaseClassifier abstract interface
│   ├── classifier.py           # Swappable classifier (MockClassifier & PlantVillage)
│   └── gradcam.py              # Hotspot region extraction & Grad-CAM simulator
├── frontend/
│   ├── index.html              # Mobile-first single-page shell
│   ├── styles.css              # Agritech design system & HUD animations
│   ├── manifest.json           # PWA web manifest
│   ├── sw.js                   # Service worker for offline caching
│   ├── assets/                 # Icons & sample test leaves
│   └── js/
│       ├── app.js              # State management & screen router
│       ├── camera.js           # getUserMedia, controls, zoom, simulated stream
│       ├── quality.js          # Client-side Laplacian blur & luminance analysis
│       ├── api.js              # REST client for backend endpoints
│       └── i18n.js             # English and Malayalam translation mappings
├── tests/
│   ├── test_api.py             # Tests for /api/diagnose, thresholding (<70%), and scans
│   ├── test_quality.py         # Blur and low-light validator tests
│   └── test_iot.py             # IoT device ingest endpoint tests
├── docs/
│   ├── camera_guide.md         # Testing camera on phones via HTTPS / local network
│   ├── model_swap.md           # Instructions for training & swapping PyTorch/ONNX models
│   └── esp32_cam_setup.md      # Field unit firmware & curl ingestion guide
├── requirements.txt
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
pytest tests/ -v
```

### 3. Start the Server
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at:
`http://localhost:8000`

---

## 📱 Testing on a Mobile Phone
See [docs/camera_guide.md](docs/camera_guide.md) for details on exposing the app securely over HTTPS using Cloudflare Tunnel or ngrok:
```bash
npx cloudflared tunnel --url http://localhost:8000
```
Then visit the generated `https://` link on your smartphone to grant camera permissions and scan real leaves.

---

## 🤖 Swapping the AI Model
See [docs/model_swap.md](docs/model_swap.md) to plug in PyTorch MobileNetV2, EfficientNet, or ONNX models trained on PlantVillage.
