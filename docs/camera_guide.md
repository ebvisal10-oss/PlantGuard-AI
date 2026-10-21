# Camera Testing & Phone Deployment Guide: PlantGuard AI

PlantGuard AI uses the modern HTML5 `navigator.mediaDevices.getUserMedia` API with `facingMode: "environment"` to target rear-facing phone cameras.

---

## 1. Local Testing Requirements
Modern web browsers (Safari on iOS, Chrome on Android, desktop browsers) strictly require a **Secure Context** to grant camera hardware permissions:
- `http://localhost:<port>` or `http://127.0.0.1:<port>` are treated as inherently secure.
- Direct local IP access (e.g. `http://192.168.1.100:8000`) on mobile browsers requires either an HTTPS tunnel or a browser origin exemption.

---

## 2. Testing on a Physical Smartphone

### Option A: Cloudflare Tunnel / Ngrok (Recommended)
1. Start the PlantGuard server locally:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```
2. In a separate terminal, launch a secure HTTPS tunnel:
   ```bash
   # Via Cloudflare (Free, no login required)
   npx cloudflared tunnel --url http://localhost:8000
   
   # Or via Ngrok
   ngrok http 8000
   ```
3. Open the generated `https://xxxx.trycloudflare.com` URL in your phone's browser.
4. When prompted, tap **"Allow"** for Camera permissions. The rear camera and framing guide HUD will activate immediately.

### Option B: Local Network with Chrome Flag
If testing on Android connected to the same Wi-Fi:
1. Open Chrome on Android and navigate to:
   `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Enable the flag and enter your PC's local IP address (e.g. `http://192.168.1.50:8000`).
3. Relaunch Chrome.

---

## 3. Desktop Testing & Built-in Simulator
If you are developing on a desktop PC without a physical webcam:
1. Open `http://localhost:8000`
2. Tap **"Scan Leaf"**
3. If no physical camera is detected, PlantGuard automatically activates the **Interactive Leaf Test Stream** (`🌱`).
4. You can also tap the **"🌱 Simulate Feed"** button at any time to test the live-scan circle tracking, blur detectors, and shutter animations with sample crop leaves.
5. You can also tap **"📁 Upload Photo"** at any time to analyze existing photos.
