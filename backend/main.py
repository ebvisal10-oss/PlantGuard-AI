import io
import os
import json
import base64
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from PIL import Image

from backend.database import (
    init_db, save_scan, get_scans, delete_scan, 
    get_devices, update_device_heartbeat
)
from model.classifier import get_classifier

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
KB_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.json")

# Load knowledge base
with open(KB_PATH, "r", encoding="utf-8") as f:
    KNOWLEDGE_BASE = json.load(f)

# Initialize app & model
app = FastAPI(
    title="PlantGuard AI API",
    description="AI-based plant disease detection API with Grad-CAM localization & IoT telemetry",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = get_classifier()

@app.on_event("startup")
def startup_event():
    init_db()

# Request schemas
class Base64DiagnoseRequest(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    device_id: Optional[str] = None
    force_confidence: Optional[float] = None

class SaveScanRequest(BaseModel):
    plant: str
    disease: str
    disease_code: str
    confidence: float
    severity: str
    regions: List[Dict[str, Any]]
    image_data: Optional[str] = None
    notes: Optional[str] = None
    device_id: Optional[str] = None

class DeviceHeartbeatRequest(BaseModel):
    device_id: str
    battery_pct: Optional[int] = 100
    ip_address: Optional[str] = None

def parse_image_from_bytes_or_base64(raw_data: bytes) -> Image.Image:
    try:
        # Check if it's base64 encoded text
        text = raw_data.decode("utf-8", errors="ignore").strip()
        if text.startswith("data:image") or (len(text) > 100 and "," in text[:40]):
            base64_str = text.split(",", 1)[-1]
            image_bytes = base64.b64decode(base64_str)
            return Image.open(io.BytesIO(image_bytes))
        elif len(text) > 100 and not text.startswith(("\xff\xd8", "\x89PNG", "GIF")):
            try:
                image_bytes = base64.b64decode(text)
                return Image.open(io.BytesIO(image_bytes))
            except Exception:
                pass
    except Exception:
        pass
    
    return Image.open(io.BytesIO(raw_data))

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PlantGuard AI",
        "version": "1.0.0",
        "knowledge_base_classes": list(KNOWLEDGE_BASE.keys())
    }

@app.get("/api/diseases")
def list_diseases():
    return KNOWLEDGE_BASE

@app.post("/api/diagnose")
async def diagnose_leaf(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    device_id: Optional[str] = Form(None),
    force_confidence: Optional[float] = Form(None),
    request: Request = None
):
    """
    Accepts an image via multipart file or base64 string.
    Returns plant diagnosis, normalized spot coordinates, confidence, severity,
    and 3-step agronomic treatment guide.
    """
    image = None
    
    # 1. Check if multipart file uploaded
    if file:
        content = await file.read()
        try:
            image = parse_image_from_bytes_or_base64(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
            
    # 2. Check form base64
    elif image_base64:
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[-1]
            img_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(img_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")
            
    # 3. Check JSON body if applicable
    elif request and request.headers.get("content-type", "").startswith("application/json"):
        try:
            body = await request.json()
            raw_b64 = body.get("image", "")
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[-1]
            img_bytes = base64.b64decode(raw_b64)
            image = Image.open(io.BytesIO(img_bytes))
            device_id = device_id or body.get("device_id")
            force_confidence = force_confidence or body.get("force_confidence")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON image payload: {str(e)}")
            
    if image is None:
        raise HTTPException(status_code=400, detail="No image provided. Send file, image_base64 or JSON body.")

    # Run inference
    result = classifier.diagnose(image, KNOWLEDGE_BASE)
    
    # Allow manual override for unit testing confidence thresholds
    if force_confidence is not None:
        result["confidence"] = float(force_confidence)
        if float(force_confidence) < 70.0:
            result["requires_retake"] = True
            result["disease"] = "Uncertain Diagnosis"
            result["severity"] = "Inconclusive"

    return JSONResponse(content=result)

@app.post("/api/scans")
def create_saved_scan(payload: SaveScanRequest):
    scan_id = save_scan(
        plant=payload.plant,
        disease=payload.disease,
        disease_code=payload.disease_code,
        confidence=payload.confidence,
        severity=payload.severity,
        regions=payload.regions,
        image_data=payload.image_data,
        notes=payload.notes,
        device_id=payload.device_id
    )
    return {"status": "saved", "id": scan_id}

@app.get("/api/scans")
def list_saved_scans(limit: int = 50):
    scans = get_scans(limit=limit)
    return {"scans": scans, "count": len(scans)}

@app.delete("/api/scans/{scan_id}")
def remove_scan(scan_id: int):
    success = delete_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"status": "deleted", "id": scan_id}

@app.post("/api/device/ingest")
async def ingest_device_scan(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    device_id: str = Form("esp32-field-cam"),
    battery_pct: Optional[int] = Form(95),
    notes: Optional[str] = Form("Automated IoT leaf capture")
):
    """
    IoT Ingestion endpoint for Raspberry Pi / ESP32-CAM units.
    Receives field camera photo, executes diagnosis, records scan and updates device telemetry.
    """
    image = None
    raw_img_data = None
    
    if file:
        content = await file.read()
        try:
            image = parse_image_from_bytes_or_base64(content)
            # Create thumbnail base64 for history display
            thumb = image.copy()
            thumb.thumbnail((180, 180))
            buffer = io.BytesIO()
            thumb.save(buffer, format="JPEG", quality=70)
            raw_img_data = "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid IoT image file: {str(e)}")
    elif image_base64:
        try:
            clean_b64 = image_base64.split(",", 1)[-1] if "," in image_base64 else image_base64
            img_bytes = base64.b64decode(clean_b64)
            image = Image.open(io.BytesIO(img_bytes))
            raw_img_data = image_base64 if image_base64.startswith("data:") else f"data:image/jpeg;base64,{clean_b64}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid IoT base64 payload: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="No leaf photo provided by IoT device.")

    # Run inference
    diag = classifier.diagnose(image, KNOWLEDGE_BASE)
    
    # Update device heartbeat
    update_device_heartbeat(device_id=device_id, battery_pct=battery_pct)
    
    # Save scan automatically
    scan_id = save_scan(
        plant=diag["plant"],
        disease=diag["disease"],
        disease_code=diag["disease_code"],
        confidence=diag["confidence"],
        severity=diag["severity"],
        regions=diag["regions"],
        image_data=raw_img_data,
        notes=f"Automated scan from IoT Device {device_id} ({notes})",
        device_id=device_id
    )

    return {
        "status": "ingested",
        "scan_id": scan_id,
        "device_id": device_id,
        "diagnosis": diag
    }

@app.get("/api/devices")
def list_iot_devices():
    devices = get_devices()
    return {"devices": devices, "count": len(devices)}

@app.post("/api/devices/heartbeat")
def device_heartbeat(payload: DeviceHeartbeatRequest):
    update_device_heartbeat(payload.device_id, payload.battery_pct, payload.ip_address)
    return {"status": "ok", "device_id": payload.device_id}

# Mount static frontend
if os.path.isdir(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend_files(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        target_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(target_path):
            return FileResponse(target_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
