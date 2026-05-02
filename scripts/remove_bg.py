#!/usr/bin/env python3
"""Batch remove backgrounds from raw crystal images via rembg (U2Net).

Reads everything in assets/images/crystals/raw and writes transparent PNGs
to assets/images/crystals/processed with the same basename.
"""
import sys
from pathlib import Path

from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/images/crystals/raw"
OUT = ROOT / "assets/images/crystals/processed"

EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in RAW.iterdir() if p.suffix.lower() in EXTS)
    if not files:
        print(f"No images found in {RAW}", file=sys.stderr)
        return 1

    print(f"Loading u2net model (first run downloads ~170MB)...")
    session = new_session("u2net")

    for i, src in enumerate(files, 1):
        dst = OUT / (src.stem + ".png")
        if dst.exists():
            print(f"[{i:02d}/{len(files)}] skip (exists): {dst.name}")
            continue
        data = src.read_bytes()
        result = remove(data, session=session)
        dst.write_bytes(result)
        print(f"[{i:02d}/{len(files)}] {src.name} -> {dst.name}")

    print(f"\nDone. {len(files)} files processed -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
