# Swapping Machine Learning Models in PlantGuard AI

PlantGuard AI features a clean, decoupled model interface defined in `model/base.py` (`BaseDiseaseClassifier`). This enables dropping in trained deep learning models without modifying the frontend or REST API contracts.

---

## 1. Architecture Interface (`model/base.py`)

Any replacement classifier needs to implement only one method:

```python
from model.base import BaseDiseaseClassifier
from PIL import Image

class CustomModelClassifier(BaseDiseaseClassifier):
    def diagnose(self, image: Image.Image, knowledge_base: dict) -> dict:
        # 1. Run inference
        # 2. Extract spot coordinates (x, y, r) normalized to [0..1]
        # 3. Format response matching output schema
        return {
            "plant": "Tomato",
            "disease": "Early Blight",
            "disease_code": "tomato_early_blight",
            "confidence": 94.2,
            "severity": "Moderate",
            "regions": [...],
            "spot_count": 2,
            "treatment_steps": [...],
            "requires_retake": False,
            "quality_warnings": []
        }
```

---

## 2. Using Pretrained PlantVillage Models (PyTorch / MobileNetV2)

### Step 1: Install PyTorch & Torchvision
```bash
pip install torch torchvision
```

### Step 2: Training or Exporting Weights
Train a standard MobileNetV2 or EfficientNet-B0 on the PlantVillage tomato sub-classes:
1. `Tomato___Early_blight`
2. `Tomato___Late_blight`
3. `Tomato___Leaf_Mold`
4. `Tomato___Septoria_leaf_spot`
5. `Tomato___healthy`

Save the PyTorch state dict:
```python
import torch
import torchvision.models as models

model = models.mobilenet_v2(weights=None)
model.classifier[1] = torch.nn.Linear(model.last_channel, 5)
torch.save(model.state_dict(), "model/weights/plantvillage_mobilenet.pth")
```

### Step 3: Activating the Model in Backend
In `backend/main.py`:
```python
from model.classifier import get_classifier

# Switch from 'mock' to 'plantvillage'
classifier = get_classifier(prefer_model="plantvillage")
```

---

## 3. On-Device Live Detection (TF.js / ONNX Runtime Web)
For client-side offline live detection:
1. Export the model to ONNX:
   ```python
   dummy_input = torch.randn(1, 3, 224, 224)
   torch.onnx.export(model, dummy_input, "frontend/assets/plantvillage.onnx")
   ```
2. In `frontend/js/camera.js`, load `ort.min.js` (ONNX Runtime Web) to execute on-device inference without server roundtrips.
