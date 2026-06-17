"""Generate PWA icons for IZO Coach."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Install Pillow: pip install pillow")
    raise

OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

COLOR = (20, 184, 166)  # #14b8a6
WHITE = (255, 255, 255)

for size in (192, 512):
    img = Image.new("RGB", (size, size), COLOR)
    draw = ImageDraw.Draw(img)
    font_size = size // 4
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()
    text = "IZO"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, (size - th) / 2 - size * 0.05), text, fill=WHITE, font=font)
    img.save(OUT / f"icon-{size}.png")
    print(f"Created icon-{size}.png")
