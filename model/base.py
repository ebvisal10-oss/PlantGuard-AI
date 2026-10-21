from abc import ABC, abstractmethod
from typing import Dict, Any, List
from PIL import Image

class BaseDiseaseClassifier(ABC):
    """
    Abstract interface for swappable plant disease classifiers.
    Any model implementation (PyTorch MobileNetV2, EfficientNet-B0, ONNX, or Mock)
    must implement the diagnose method.
    """

    @abstractmethod
    def diagnose(self, image: Image.Image, knowledge_base: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes a PIL image and agronomic knowledge base, and returns a dictionary:
        {
            "plant": str,
            "disease": str,
            "disease_code": str,
            "confidence": float (0-100),
            "severity": str ("Healthy" | "Mild" | "Moderate" | "Severe"),
            "regions": List[{"x": float, "y": float, "r": float, "severity": str, "label": str}],
            "spot_count": int,
            "requires_retake": bool,
            "quality_warnings": List[str]
        }
        All x, y, r are normalized to [0, 1] relative to image width/height.
        """
        pass
