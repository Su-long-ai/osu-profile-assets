#!/usr/bin/env python3
"""Frame-rate-only remake of the original osu! v10 animation.

The illustration, typography and layout are NOT regenerated or redesigned.
We interpolate the existing real frames, retain the original palette and verify
the wrap-around seam. Do not call generative image APIs.
"""
from pathlib import Path
import argparse
import io
import json
import math

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def frames_from_gif(path):
    source = Image.open(path)
    rgb = []
    durations = []
    for i in range(source.n_frames):
        source.seek(i)
        rgb.append(np.asarray(source.convert("RGB"), dtype=np.uint8).copy())
        durations.append(int(source.info.get("duration", 50)))
    return rgb, durations


def flow(src, dst, width, height):
    """Small-scale dense flow, then upscale to the original resolution."""
    size = (width // 2, height // 2)
    gray0 = cv2.cvtColor(cv2.resize(src, size, interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
    gray1 = cv2.cvtColor(cv2.resize(dst, size, interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
    small = cv2.calcOpticalFlowFarneback(
        gray0, gray1, None, 0.5, 4, 19, 3, 5, 1.1, 0,
    )
    dense = cv2.resize(small, (width, height), interpolation=cv2.INTER_LINEAR)
    dense *= 2.0
    return dense


def interpolate(a, b, alpha):
    h, w = a.shape[:2]
    x, y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    ab = flow(a, b, w, h)
    ba = flow(b, a, w, h)
    warped_a = cv2.remap(a, x - ab[..., 0] * alpha, y - ab[..., 1] * alpha,
                         interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    warped_b = cv2.remap(b, x - ba[..., 0] * (1 - alpha), y - ba[..., 1] * (1 - alpha),
                         interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    middle = cv2.addWeighted(warped_a, 1 - alpha, warped_b, alpha, 0)
    # Keep truly static pixels pixel-perfect (especially lettering).
    unchanged = np.max(np.abs(a.astype(np.int16) - b.astype(np.int16)), axis=2) <= 2
    middle[unchanged] = a[unchanged]
    return middle


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()
    source = Path(args.source)
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    originals, original_delays = frames_from_gif(source)
    count = len(originals)
    assert count == 60 and len(set(original_delays)) == 1 and original_delays[0] == 50
    h, w = originals[0].shape[:2]
    assert (w, h) == (900, 496)
    target_frames = 90
    out = []
    for k in range(target_frames):
        p = k * count / target_frames
        base = math.floor(p)
        alpha = p - base
        if alpha < 0.0001:
            img = originals[base].copy()
        else:
            img = interpolate(originals[base], originals[(base + 1) % count], alpha)
        out.append(Image.fromarray(img, "RGB"))
        if k % 15 == 0:
            print(f"Resampled {k + 1}/{target_frames} frames", flush=True)

    # GIF timing has 10ms precision: 30/30/40 repeated = exactly 3 seconds.
    durations = [30, 30, 40] * 30
    assert sum(durations) == 3000

    # The original was already palette-limited. Reuse one palette for every
    # frame to prevent flickering palette changes.
    palette = Image.fromarray(originals[0], "RGB").quantize(
        colors=224, method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in out]
    indexed[0].save(
        target,
        save_all=True,
        append_images=indexed[1:],
        duration=durations,
        loop=0,
        disposal=1,
        optimize=True,
    )
    rendered, rendered_delays = frames_from_gif(target)
    assert len(rendered) == 90, f"GIF encoder merged frames: {len(rendered)}"
    assert sum(rendered_delays) == 3000
    assert set(rendered_delays) == {30, 40}
    pix = np.stack([x.astype(np.int16) for x in rendered])
    steps = np.mean(
        np.abs(pix - np.roll(pix, -1, axis=0)), axis=(1, 2, 3)
    )
    seam = float(steps[-1] / max(float(np.median(steps[:-1])), 0.001))
    assert seam <= 1.8, f"Loop discontinuity unexpectedly visible: {seam:.2f}x"
    assert target.stat().st_size < 10 * 1024 * 1024

    # Comparison preview: true source pixels, not new generated illustration.
    canvas = Image.new("RGB", (900, 496 + 30), (23, 28, 36))
    canvas.paste(Image.fromarray(originals[0], "RGB"), (0, 0))
    ImageDraw.Draw(canvas).text((12, 503), "Original v10 artwork retained, 30 FPS interpolation only", fill=(160, 180, 190))
    preview = target.with_suffix(".png")
    canvas.save(preview, optimize=True)

    result = {
        "source": source.name,
        "output": target.name,
        "frames_before": count,
        "frames_after": len(rendered),
        "duration_ms": sum(rendered_delays),
        "fps_average": 30,
        "source_artwork_unchanged": True,
        "generative_art_used": False,
        "loop_seam_ratio": round(seam, 3),
        "size_bytes": target.stat().st_size,
        "dimensions": [w, h],
    }
    target.with_suffix(".json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2), flush=True)


if __name__ == "__main__":
    main()
