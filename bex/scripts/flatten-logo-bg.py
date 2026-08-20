#!/usr/bin/env python3
"""Passla logo: tamamen duz #0E0618 arkaplan, sifir halo."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageFilter

BG = (14, 6, 24)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BRAND = ASSETS / "branding"
SOURCE_LOGO = BRAND / "passla-logo-source.png"
SOURCE_ICON = Path(
    r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\passla-icon-clean.png"
)


def sat(r: int, g: int, b: int) -> float:
    mx = max(r, g, b)
    return (mx - min(r, g, b)) / mx if mx else 0.0


def keep_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 15:
        return False

    mx = max(r, g, b)
    s = sat(r, g, b)

    if mx - min(r, g, b) < 25 and mx > 40:
        return False

    # Arka plan + mor glow
    if mx < 100:
        return False

    if r >= 110 and r >= g and r >= b and s >= 0.15:
        return True

    if b >= 90 and b >= r * 0.7 and s >= 0.12:
        return True
    if b >= 70 and g >= 25 and s >= 0.18 and b > r:
        return True

    return False


def flatten_source(src_path: Path) -> bytes:
    src = Image.open(src_path).convert("RGBA")
    w, h = src.size
    mask = Image.new("L", (w, h), 0)
    spx = src.load()
    mpx = mask.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = spx[x, y]
            if keep_pixel(r, g, b, a):
                mpx[x, y] = 255

    mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))

    out = Image.new("RGB", (w, h), BG)
    opx = out.load()
    mpx = mask.load()
    for y in range(h):
        for x in range(w):
            if mpx[x, y]:
                r, g, b, _ = spx[x, y]
                opx[x, y] = (r, g, b)

    tmp = BRAND / "_flatten-out.png"
    out.save(tmp, format="PNG", optimize=True)
    data = tmp.read_bytes()
    tmp.unlink(missing_ok=True)
    return data


def main() -> None:
    if not SOURCE_LOGO.exists():
        raise SystemExit(f"Kaynak bulunamadi: {SOURCE_LOGO}")

    logo_bytes = flatten_source(SOURCE_LOGO)
    for rel in [
        BRAND / "passla-logo.png",
        BRAND / "passla-logo-full.png",
        ASSETS / "splash-icon.png",
    ]:
        rel.write_bytes(logo_bytes)
    print("OK  logo + splash")

    icon_src = SOURCE_ICON if SOURCE_ICON.exists() else SOURCE_LOGO
    icon_bytes = flatten_source(icon_src)
    for rel in [
        BRAND / "passla-icon-mark.png",
        ASSETS / "icon.png",
        ASSETS / "favicon.png",
    ]:
        rel.write_bytes(icon_bytes)
    print("OK  icon + favicon")

    im = Image.open(BRAND / "passla-logo.png")
    cx, cy = im.width // 2, im.height // 2
    print(f"corner={im.getpixel((0, 0))} center={im.getpixel((cx, cy))} bg={BG}")


if __name__ == "__main__":
    main()
