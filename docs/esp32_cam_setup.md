# IoT Field Camera Setup: ESP32-CAM & Raspberry Pi

PlantGuard AI provides an automated field ingest endpoint:
`POST /api/device/ingest`

This allows autonomous solar-powered camera nodes deployed in polyhouses, greenhouses, or open fields to monitor foliar health.

---

## 1. REST Endpoint Specification

- **URL**: `http://<SERVER_IP>:8000/api/device/ingest`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: JPEG image file from camera sensor
  - `device_id`: Device identifier string (e.g. `esp32-greenhouse-01`)
  - `battery_pct`: Current battery level integer (e.g. `88`)
  - `notes`: Optional description (e.g. `Polyhouse Zone B`)

---

## 2. Raspberry Pi Python Client Script

Deploy this script on a Raspberry Pi with a Pi Camera Module or USB webcam:

```python
import time
import requests
import cv2

SERVER_URL = "http://192.168.1.100:8000/api/device/ingest"
DEVICE_ID = "rpi-polyhouse-cam-01"

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if ret:
        _, img_encoded = cv2.imencode(".jpg", frame)
        files = {"file": ("leaf.jpg", img_encoded.tobytes(), "image/jpeg")}
        data = {
            "device_id": DEVICE_ID,
            "battery_pct": 98,
            "notes": "Hourly automated canopy inspection"
        }
        try:
            res = requests.post(SERVER_URL, files=files, data=data, timeout=10)
            print("Diagnosis received:", res.json())
        except Exception as e:
            print("Upload failed:", e)

    # Sleep for 1 hour between field captures
    time.sleep(3600)
```

---

## 3. ESP32-CAM Arduino C++ Snippet

```cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "http://192.168.1.100:8000/api/device/ingest";

void postLeafImage() {
  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundary");
  
  // Post payload to server...
  esp_camera_fb_return(fb);
}
```
