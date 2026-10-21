import pytest
import io
from fastapi.testclient import TestClient
from PIL import Image

from backend.main import app

client = TestClient(app)

def test_iot_ingest_endpoint():
    # Simulate an ESP32-CAM posting a field capture
    img = Image.new("RGB", (224, 224), (45, 120, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/device/ingest",
        data={
            "device_id": "esp32-greenhouse-01",
            "battery_pct": 89,
            "notes": "Automated field capture via solar camera"
        },
        files={"file": ("field_leaf.jpg", buf.getvalue(), "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ingested"
    assert data["device_id"] == "esp32-greenhouse-01"
    assert "scan_id" in data
    assert len(data["diagnosis"]["plant"]) > 0
    assert "disease" in data["diagnosis"]

def test_iot_device_list_telemetry():
    response = client.get("/api/devices")
    assert response.status_code == 200
    data = response.json()
    assert "devices" in data
    assert len(data["devices"]) > 0
    # Check that our active node is listed
    dev_ids = [d["device_id"] for d in data["devices"]]
    assert "esp32-greenhouse-01" in dev_ids
