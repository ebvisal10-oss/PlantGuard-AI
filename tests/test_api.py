import pytest
import os
import io
import base64
from fastapi.testclient import TestClient
from PIL import Image

from backend.main import app
from backend.database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def create_test_image(color=(50, 150, 60), size=(224, 224)):
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "potato_early_blight" in data["knowledge_base_classes"]
    assert "corn_common_rust" in data["knowledge_base_classes"]
    assert "pepper_bacterial_spot" in data["knowledge_base_classes"]

def test_list_diseases_multi_crop():
    response = client.get("/api/diseases")
    assert response.status_code == 200
    data = response.json()
    
    # Check multi-crop catalog
    assert "potato_early_blight" in data
    assert "corn_common_rust" in data
    assert "pepper_bacterial_spot" in data
    assert "apple_scab" in data
    assert "grape_black_rot" in data
    assert "rice_bacterial_leaf_blight" in data
    assert "generic_healthy_leaf" in data
    
    # Verify potato treatment steps
    assert len(data["potato_early_blight"]["treatment_steps"]) == 3
    assert data["potato_early_blight"]["plant"] == "Potato"

def test_diagnose_multi_crop_leaves():
    samples_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "assets", "samples")
    crops_to_test = [
        ("potato_early_blight.jpg", "Potato"),
        ("pepper_bacterial_spot.jpg", "Pepper"),
        ("corn_common_rust.jpg", "Corn"),
        ("healthy_crop_leaf.jpg", "Crop"),
        ("apple_scab.jpg", "Apple"),
        ("grape_black_rot.jpg", "Grape")
    ]

    for filename, expected_plant_keyword in crops_to_test:
        sample_path = os.path.join(samples_dir, filename)
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                img_bytes = f.read()
        else:
            img_bytes = create_test_image()

        response = client.post(
            "/api/diagnose",
            files={"file": (filename, img_bytes, "image/jpeg")}
        )
        assert response.status_code == 200, f"Failed on {filename}"
        data = response.json()
        assert "plant" in data
        assert "disease" in data
        assert "confidence" in data
        assert "severity" in data
        assert "regions" in data
        assert "treatment_steps" in data
        assert isinstance(data["regions"], list)

        # Region coordinate checks
        for region in data["regions"]:
            assert 0.0 <= region["x"] <= 1.0
            assert 0.0 <= region["y"] <= 1.0
            assert 0.0 < region["r"] <= 0.5

def test_diagnose_base64_json():
    raw_bytes = create_test_image()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(raw_bytes).decode()
    
    response = client.post(
        "/api/diagnose",
        json={"image": b64_str}
    )
    assert response.status_code == 200
    data = response.json()
    assert "disease" in data
    assert data["confidence"] > 0

def test_confidence_threshold_logic():
    """
    If confidence < 70%, show 'Not sure, retake the photo' instead of a verdict.
    """
    raw_bytes = create_test_image()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(raw_bytes).decode()

    response = client.post(
        "/api/diagnose",
        json={"image": b64_str, "force_confidence": 55.0}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] == 55.0
    assert data["requires_retake"] is True
    assert data["disease"] == "Uncertain Diagnosis"
    assert data["severity"] == "Inconclusive"

def test_scan_crud_flow():
    # 1. Save scan
    payload = {
        "plant": "Potato",
        "disease": "Potato Early Blight",
        "disease_code": "potato_early_blight",
        "confidence": 93.5,
        "severity": "Moderate",
        "regions": [{"x": 0.44, "y": 0.36, "r": 0.08, "severity": "High", "label": "Target concentric ring #1"}],
        "image_data": "data:image/jpeg;base64,sample",
        "notes": "Automated unit test scan for potato"
    }
    post_res = client.post("/api/scans", json=payload)
    assert post_res.status_code == 200
    scan_id = post_res.json()["id"]
    assert scan_id > 0

    # 2. Get scans list
    get_res = client.get("/api/scans")
    assert get_res.status_code == 200
    scans = get_res.json()["scans"]
    assert any(s["id"] == scan_id for s in scans)

    # 3. Delete scan
    del_res = client.delete(f"/api/scans/{scan_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"
