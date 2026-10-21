import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "assets", "samples")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_potato_early_blight():
    img = Image.new("RGB", (600, 600), (240, 243, 240))
    draw = ImageDraw.Draw(img)
    # Broad ovate potato leaflet
    points = [
        (300, 70), (380, 150), (430, 260), (410, 390), (360, 480), (300, 540),
        (240, 480), (190, 390), (170, 260), (220, 150)
    ]
    draw.polygon(points, fill=(45, 125, 52))
    # Midrib and veins
    draw.line([(300, 75), (300, 540)], fill=(65, 155, 72), width=5)
    for y in [180, 260, 340, 420]:
        draw.line([(300, y), (370, y + 40)], fill=(60, 145, 68), width=3)
        draw.line([(300, y), (230, y + 40)], fill=(60, 145, 68), width=3)

    # Concentric target spots
    spots = [(260, 240, 36), (360, 330, 32), (240, 380, 24)]
    for sx, sy, rad in spots:
        draw.ellipse([sx - rad - 10, sy - rad - 10, sx + rad + 10, sy + rad + 10], fill=(190, 185, 45))
        draw.ellipse([sx - rad, sy - rad, sx + rad, sy + rad], fill=(85, 48, 22))
        draw.ellipse([sx - rad + 8, sy - rad + 8, sx + rad - 8, sy + rad - 8], fill=(115, 70, 35))
        draw.ellipse([sx - rad + 14, sy - rad + 14, sx + rad - 14, sy + rad - 14], fill=(60, 35, 18))
        draw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=(35, 18, 10))

    img = img.filter(ImageFilter.GaussianBlur(0.8))
    img.save(os.path.join(OUTPUT_DIR, "potato_early_blight.jpg"), quality=92)
    print("Saved potato_early_blight.jpg")

def generate_pepper_bacterial_spot():
    img = Image.new("RGB", (600, 600), (240, 243, 240))
    draw = ImageDraw.Draw(img)
    # Lanceolate smooth bell pepper leaf
    points = [
        (300, 60), (370, 160), (410, 280), (390, 410), (340, 490), (300, 550),
        (260, 490), (210, 410), (190, 280), (230, 160)
    ]
    draw.polygon(points, fill=(42, 138, 55))
    draw.line([(300, 65), (300, 550)], fill=(60, 168, 75), width=5)

    # Angular bacterial water-soaked spots
    np.random.seed(12)
    for _ in range(22):
        sx = int(np.random.randint(230, 370))
        sy = int(np.random.randint(140, 460))
        rad = int(np.random.randint(5, 12))
        # Pale chlorotic halo
        draw.ellipse([sx - rad - 3, sy - rad - 3, sx + rad + 3, sy + rad + 3], fill=(185, 190, 60))
        # Angular dark lesion
        draw.polygon([
            (sx - rad, sy - rad // 2), (sx + rad // 2, sy - rad),
            (sx + rad, sy + rad // 3), (sx, sy + rad)
        ], fill=(45, 25, 15))

    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(os.path.join(OUTPUT_DIR, "pepper_bacterial_spot.jpg"), quality=92)
    print("Saved pepper_bacterial_spot.jpg")

def generate_corn_rust():
    img = Image.new("RGB", (600, 600), (240, 243, 240))
    draw = ImageDraw.Draw(img)
    # Elongated maize leaf blade with parallel venation
    points = [
        (300, 40), (350, 120), (370, 250), (370, 400), (360, 530), (300, 570),
        (240, 530), (230, 400), (230, 250), (250, 120)
    ]
    draw.polygon(points, fill=(58, 142, 60))
    # Parallel veins
    for x in range(240, 365, 8):
        draw.line([(x, 50), (x, 560)], fill=(70, 160, 72), width=1)
    draw.line([(300, 45), (300, 570)], fill=(90, 185, 95), width=6)

    # Elongated reddish/cinnamon rust pustules
    np.random.seed(42)
    for _ in range(35):
        cx = int(np.random.randint(245, 355))
        cy = int(np.random.randint(90, 510))
        pw = int(np.random.randint(5, 9))
        ph = int(np.random.randint(12, 22))
        # Reddish-cinnamon orange rust pustule
        draw.ellipse([cx - pw, cy - ph, cx + pw, cy + ph], fill=(185, 75, 25))
        # Inner powdery core
        draw.ellipse([cx - pw + 2, cy - ph + 4, cx + pw - 2, cy + ph - 4], fill=(210, 105, 30))

    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(os.path.join(OUTPUT_DIR, "corn_common_rust.jpg"), quality=92)
    print("Saved corn_common_rust.jpg")

def generate_apple_scab():
    img = Image.new("RGB", (600, 600), (240, 243, 240))
    draw = ImageDraw.Draw(img)
    # Elliptical finely serrated apple leaf
    points = [
        (300, 60), (390, 150), (430, 270), (410, 390), (350, 480), (300, 540),
        (250, 480), (190, 390), (170, 270), (210, 150)
    ]
    draw.polygon(points, fill=(52, 135, 58))
    draw.line([(300, 65), (300, 540)], fill=(72, 160, 78), width=5)

    # Olive-green velvety circular scab spots with radiating margins
    scab_spots = [(260, 230, 28), (360, 300, 24), (250, 380, 20), (340, 420, 22)]
    for sx, sy, rad in scab_spots:
        # Radiating margin
        draw.ellipse([sx - rad - 6, sy - rad - 6, sx + rad + 6, sy + rad + 6], fill=(55, 65, 35))
        # Dark olive velvety scab
        draw.ellipse([sx - rad, sy - rad, sx + rad, sy + rad], fill=(42, 48, 25))
        # Corky core
        draw.ellipse([sx - rad + 6, sy - rad + 6, sx + rad - 6, sy + rad - 6], fill=(28, 32, 18))

    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(os.path.join(OUTPUT_DIR, "apple_scab.jpg"), quality=92)
    print("Saved apple_scab.jpg")

def generate_grape_black_rot():
    img = Image.new("RGB", (600, 600), (240, 243, 240))
    draw = ImageDraw.Draw(img)
    # Palmately lobed grape leaf
    points = [
        (300, 70), (350, 120), (420, 150), (450, 230), (410, 300), (440, 380),
        (380, 440), (340, 480), (300, 530), (260, 480), (220, 440), (160, 380),
        (190, 300), (150, 230), (180, 150), (250, 120)
    ]
    draw.polygon(points, fill=(48, 128, 54))
    # Palmate main veins radiating from base
    draw.line([(300, 520), (300, 75)], fill=(68, 155, 75), width=5)
    draw.line([(300, 520), (420, 155)], fill=(65, 150, 72), width=4)
    draw.line([(300, 520), (180, 155)], fill=(65, 150, 72), width=4)

    # Reddish-tan spots with dark border and pycnidia
    spots = [(250, 250, 26), (360, 270, 22), (290, 380, 20)]
    for sx, sy, rad in spots:
        draw.ellipse([sx - rad, sy - rad, sx + rad, sy + rad], fill=(65, 35, 20))
        draw.ellipse([sx - rad + 3, sy - rad + 3, sx + rad - 3, sy + rad - 3], fill=(160, 95, 60))
        # Inner black pycnidia specks
        for _ in range(6):
            px = sx + int(np.random.randint(-rad + 6, rad - 6))
            py = sy + int(np.random.randint(-rad + 6, rad - 6))
            draw.point((px, py), fill=(20, 20, 20))

    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(os.path.join(OUTPUT_DIR, "grape_black_rot.jpg"), quality=92)
    print("Saved grape_black_rot.jpg")

def generate_healthy_crop():
    img = Image.new("RGB", (600, 600), (240, 243, 240))
    draw = ImageDraw.Draw(img)
    # Smooth, vibrant, glossy foliage
    points = [
        (300, 60), (380, 140), (430, 250), (410, 380), (360, 480), (300, 540),
        (240, 480), (190, 380), (170, 250), (220, 140)
    ]
    draw.polygon(points, fill=(45, 175, 65))
    draw.line([(300, 65), (300, 540)], fill=(75, 205, 95), width=6)
    # Highlights
    draw.polygon([(290, 170), (330, 200), (310, 260), (280, 220)], fill=(65, 195, 80))
    draw.polygon([(240, 300), (280, 330), (260, 380), (230, 340)], fill=(65, 195, 80))

    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(os.path.join(OUTPUT_DIR, "healthy_crop_leaf.jpg"), quality=92)
    print("Saved healthy_crop_leaf.jpg")

if __name__ == "__main__":
    generate_potato_early_blight()
    generate_pepper_bacterial_spot()
    generate_corn_rust()
    generate_apple_scab()
    generate_grape_black_rot()
    generate_healthy_crop()
    print("Multi-crop sample leaves generated successfully!")
