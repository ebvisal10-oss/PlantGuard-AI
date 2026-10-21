import pytest
import os
import numpy as np
from PIL import Image, ImageFilter

from model.classifier import MockClassifier

def test_sharp_vs_blurry_detection():
    classifier = MockClassifier()

    # 1. Sharp Leaf Image
    sharp_img = Image.new("RGB", (224, 224), (240, 240, 240))
    # Draw high contrast lines
    arr = np.zeros((224, 224, 3), dtype=np.uint8)
    arr[::16, :, 1] = 200
    arr[:, ::16, 0] = 180
    sharp_img = Image.fromarray(arr)

    warnings_sharp = classifier._assess_quality(sharp_img)
    assert not any("blurry" in w.lower() for w in warnings_sharp)

    # 2. Heavily Blurred Image
    blurry_img = sharp_img.filter(ImageFilter.GaussianBlur(12.0))
    warnings_blurry = classifier._assess_quality(blurry_img)
    assert any("blurry" in w.lower() for w in warnings_blurry)

def test_lighting_dark_and_overexposed_detection():
    classifier = MockClassifier()

    # 1. Dark leaf image (luminance < 30)
    dark_arr = np.full((128, 128, 3), 15, dtype=np.uint8)
    dark_img = Image.fromarray(dark_arr)
    warnings_dark = classifier._assess_quality(dark_img)
    assert any("dark" in w.lower() for w in warnings_dark)

    # 2. Overexposed leaf image (luminance > 235)
    bright_arr = np.full((128, 128, 3), 250, dtype=np.uint8)
    bright_img = Image.fromarray(bright_arr)
    warnings_bright = classifier._assess_quality(bright_img)
    assert any("overexposed" in w.lower() for w in warnings_bright)
